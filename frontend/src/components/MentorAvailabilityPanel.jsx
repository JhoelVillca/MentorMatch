import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { Clock, Grid2x2 as Grid, List, CircleAlert as AlertCircle, X, Plus, Trash2, Check, CalendarCheck } from 'lucide-react';

const API_URL = '/api/disponibilidad/';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DIA_STR_TO_INT = {
  'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4,
  'Viernes': 5, 'Sábado': 6, 'Domingo': 7,
};

const DIA_INT_TO_STR = {};
Object.entries(DIA_STR_TO_INT).forEach(([k, v]) => { DIA_INT_TO_STR[v] = k; });

const useAvailability = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient(API_URL);
      setAvailabilities(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const add = useCallback(async (payload) => {
    await apiClient(API_URL, { method: 'POST', body: payload });
    await fetchAll();
  }, [fetchAll]);

  const remove = useCallback(async (id) => {
    await apiClient(`${API_URL}${id}`, { method: 'DELETE' });
    setAvailabilities(prev => prev.filter(a => a.id !== id));
  }, []);

  return { availabilities, loading, error, setError, add, remove, refresh: fetchAll };
};

const buildSavedSet = (availabilities) => {
  const set = new Set();
  availabilities.forEach(av => {
    const dayIdx = typeof av.dia_semana === 'number'
      ? av.dia_semana - 1
      : (DIA_STR_TO_INT[av.dia_semana] ?? 1) - 1;
    const startH = parseInt((av.hora_inicio ?? '').split(':')[0], 10) || 0;
    const endH = parseInt((av.hora_fin ?? '').split(':')[0], 10) || 0;
    for (let h = startH; h < endH; h++) set.add(`${dayIdx}-${h}`);
  });
  return set;
};

const groupContiguous = (pendingSet) => {
  const byDay = {};
  pendingSet.forEach(key => {
    const [d, h] = key.split('-').map(Number);
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(h);
  });
  const blocks = [];
  Object.entries(byDay).forEach(([dayIdx, hours]) => {
    hours.sort((a, b) => a - b);
    let start = hours[0];
    let end = hours[0] + 1;
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === end) { end = hours[i] + 1; }
      else { blocks.push({ dayIdx: Number(dayIdx), startH: start, endH: end }); start = hours[i]; end = hours[i] + 1; }
    }
    blocks.push({ dayIdx: Number(dayIdx), startH: start, endH: end });
  });
  return blocks;
};

const GridCell = React.memo(({ dayIdx, hour, isActive, onMouseDown, onMouseEnter }) => {
  return (
    <td
      onMouseDown={() => onMouseDown(dayIdx, hour)}
      onMouseEnter={() => onMouseEnter(dayIdx, hour)}
      className={`
        border select-none transition-all duration-300 h-8 cursor-pointer relative
        ${isActive 
          ? 'bg-gradient-to-br from-primary-600 to-accent-500 border-transparent shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]' 
          : 'bg-white border-slate-100 hover:border-primary-300 hover:bg-slate-50'
        }
      `}
      title={`${DAYS[dayIdx]} ${String(hour).padStart(2, '0')}:00`}
    >
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 rounded-full bg-white/70" />
        </div>
      )}
    </td>
  );
});
GridCell.displayName = 'GridCell';

const WeekGrid = ({ selectedSet, onDragStart, onDragEnter, onDragEnd }) => {
  const tableRef = useRef(null);

  useEffect(() => {
    const handleUp = () => onDragEnd();
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, [onDragEnd]);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table ref={tableRef} className="w-full border-collapse min-w-[600px]" onMouseLeave={onDragEnd}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white text-[10px] text-slate-400 font-medium w-12 py-2 border-b border-slate-200">UTC</th>
            {DAYS_SHORT.map((d, i) => (
              <th key={i} className="text-xs text-slate-500 font-semibold py-2 px-1 border-b border-slate-200">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(h => (
            <tr key={h}>
              <td className="sticky left-0 z-10 bg-white text-[10px] text-slate-400 font-mono text-right pr-2 select-none border-r border-slate-100">
                {String(h).padStart(2, '0')}:00
              </td>
              {DAYS.map((_, dayIdx) => {
                const key = `${dayIdx}-${h}`;
                return (
                  <GridCell
                    key={key}
                    dayIdx={dayIdx}
                    hour={h}
                    isActive={selectedSet.has(key)}
                    onMouseDown={onDragStart}
                    onMouseEnter={onDragEnter}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SlotCard = ({ slot, onDelete }) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const handleDelete = async () => {
    if (!confirmando) { setConfirmando(true); return; }
    setDeleting(true);
    try { await onDelete(slot.id); }
    finally { setDeleting(false); setConfirmando(false); }
  };

  const diaLabel = typeof slot.dia_semana === 'number'
    ? DIA_INT_TO_STR[slot.dia_semana] ?? slot.dia_semana
    : slot.dia_semana;

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-slate-200 transition-colors shadow-card">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{diaLabel}</p>
        <p className="text-slate-500 text-xs font-mono mt-0.5">
          {slot.hora_inicio} — {slot.hora_fin}
          <span className="text-slate-400 ml-1">UTC</span>
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
          confirmando
            ? 'bg-red-600 hover:bg-red-700 text-white border border-red-600'
            : 'bg-transparent border border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {deleting ? (
          <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : confirmando ? (
          <><Check size={12} />Confirmar</>
        ) : (
          <Trash2 size={12} />
        )}
      </button>
    </div>
  );
};

const inputClass = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all';

export default function MentorAvailabilityPanel() {
  const { availabilities, loading, error, setError, add, remove, refresh } = useAvailability();

  const [viewMode, setViewMode] = useState('grid');
  
  // Grid interactive state
  const [selectedSet, setSelectedSet] = useState(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState(null); // 'add' or 'remove'
  const [saving, setSaving] = useState(false);

  // Initialize selectedSet from server data
  useEffect(() => {
    setSelectedSet(buildSavedSet(availabilities));
    setIsDirty(false);
  }, [availabilities]);

  const toggleSlot = useCallback((dayIdx, hour, forceAction = null) => {
    const key = `${dayIdx}-${hour}`;
    setSelectedSet(prev => {
      const next = new Set(prev);
      const isActive = next.has(key);
      let shouldBeActive = !isActive;
      if (forceAction === 'add') shouldBeActive = true;
      if (forceAction === 'remove') shouldBeActive = false;
      
      if (shouldBeActive) next.add(key);
      else next.delete(key);
      return next;
    });
    setIsDirty(true);
  }, []);

  const handleDragStart = useCallback((dayIdx, hour) => {
    setIsDragging(true);
    const isActive = selectedSet.has(`${dayIdx}-${hour}`);
    const newAction = isActive ? 'remove' : 'add';
    setDragAction(newAction);
    toggleSlot(dayIdx, hour, newAction);
  }, [selectedSet, toggleSlot]);

  const handleDragEnter = useCallback((dayIdx, hour) => {
    if (isDragging && dragAction) {
      toggleSlot(dayIdx, hour, dragAction);
    }
  }, [isDragging, dragAction, toggleSlot]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragAction(null);
  }, []);

  const handleDiscard = () => {
    setSelectedSet(buildSavedSet(availabilities));
    setIsDirty(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const savedSet = buildSavedSet(availabilities);
      
      // Compute differences
      const toDeleteKeys = new Set([...savedSet].filter(x => !selectedSet.has(x)));
      const toAddKeys = new Set([...selectedSet].filter(x => !savedSet.has(x)));

      // Remove API calls
      const blocksToRemove = new Set();
      toDeleteKeys.forEach(key => {
        const [d, h] = key.split('-').map(Number);
        // Find which DB block this hour belonged to
        const av = availabilities.find(a => {
          const avDay = (typeof a.dia_semana === 'number' ? a.dia_semana : DIA_STR_TO_INT[a.dia_semana] ?? 1) - 1;
          if (avDay !== d) return false;
          const startH = parseInt((a.hora_inicio ?? '').split(':')[0], 10) || 0;
          const endH = parseInt((a.hora_fin ?? '').split(':')[0], 10) || 0;
          return h >= startH && h < endH;
        });
        if (av) blocksToRemove.add(av.id);
      });
      for (const id of blocksToRemove) {
        await remove(id);
      }

      // Add API calls
      const newBlocks = groupContiguous(toAddKeys);
      for (const block of newBlocks) {
        const dayStr = DAYS[block.dayIdx];
        const hora_inicio = `${String(block.startH).padStart(2, '0')}:00`;
        const hora_fin = block.endH === 24 ? '23:59' : `${String(block.endH).padStart(2, '00')}:00`;
        await add({ dia_semana: dayStr, hora_inicio, hora_fin });
      }

      await refresh();
      setIsDirty(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="h-[300px] bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card-md p-6 sm:p-8 space-y-6">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Define tu Disponibilidad</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Marca en la cuadrícula las horas en las que <span className="text-primary-600 font-bold">estarás libre</span> (UTC).
          </p>
        </div>

        <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'grid' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Grid size={14} />Grilla
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <List size={14} />Lista
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center gap-5 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-2" title="Haz clic en una celda para desmarcarla">
                <div className="w-5 h-5 rounded-md border-2 border-slate-200 bg-white"></div>
                <span>No Disponible</span>
              </div>
              <div className="flex items-center gap-2" title="Haz clic o arrastra para marcar como disponible">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary-600 to-accent-500 shadow-[0_0_8px_rgba(37,99,235,0.3)] border-transparent"></div>
                <span>Disponible</span>
              </div>
            </div>

            <div className="bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="text-primary-600 font-black text-lg">{selectedSet.size}</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">horas activas</span>
            </div>
          </div>

          <WeekGrid
            selectedSet={selectedSet}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
          />

          <div className={`flex justify-end gap-3 pt-2 transition-all duration-300 ${isDirty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
            >
              Descartar cambios
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-white shadow-sm hover:shadow active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
              ) : (
                <><CalendarCheck size={16} />Guardar disponibilidad</>
              )}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Plus size={16} className="text-primary-500" />
              Añadir bloque manual
            </h3>
            <ListForm onSubmit={add} error={error} onClearError={() => setError(null)} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              Bloques guardados {availabilities.length > 0 && <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md text-xs">{availabilities.length}</span>}
            </h3>
            {availabilities.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center bg-slate-50">
                <Clock size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">Aún no tienes horarios configurados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availabilities.map(av => (
                  <SlotCard key={av.id} slot={av} onDelete={remove} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const INITIAL_FORM = { day: 'Lunes', startTime: '', endTime: '' };

const ListForm = ({ onSubmit, error: globalError, onClearError }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const displayError = localError || globalError;

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    setLocalError(null);
    onClearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    if (!form.startTime || !form.endTime) { setLocalError('Completa ambas horas.'); return; }
    if (form.startTime >= form.endTime) { setLocalError('La hora de fin debe ser posterior.'); return; }
    setSubmitting(true);
    try {
      await onSubmit({ dia_semana: form.day, hora_inicio: form.startTime, hora_fin: form.endTime });
      setForm(INITIAL_FORM);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Día</label>
          <select value={form.day} onChange={set('day')} className={inputClass}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Inicio (UTC)</label>
          <input type="time" value={form.startTime} onChange={set('startTime')} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Fin (UTC)</label>
          <input type="time" value={form.endTime} min={form.startTime || undefined} onChange={set('endTime')} className={inputClass} />
        </div>
      </div>

      {displayError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
          <AlertCircle size={16} className="flex-shrink-0" />{displayError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
          ) : (
            <><Plus size={16} />Agregar bloque</>
          )}
        </button>
      </div>
    </form>
  );
};
