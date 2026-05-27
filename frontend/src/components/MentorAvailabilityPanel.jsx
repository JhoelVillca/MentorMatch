import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';

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

/* ── Hook de datos ─────────────────────────────────────────── */
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

/* ── Helpers ───────────────────────────────────────────────── */

/** Convierte las disponibilidades del backend en un Set de claves "day-hour" */
const buildSavedSet = (availabilities) => {
  const set = new Set();
  availabilities.forEach(av => {
    const dayIdx = typeof av.dia_semana === 'number'
      ? av.dia_semana - 1
      : (DIA_STR_TO_INT[av.dia_semana] ?? 1) - 1;

    const startStr = typeof av.hora_inicio === 'string' ? av.hora_inicio : '';
    const endStr = typeof av.hora_fin === 'string' ? av.hora_fin : '';
    const startH = parseInt(startStr.split(':')[0], 10) || 0;
    const endH = parseInt(endStr.split(':')[0], 10) || 0;

    for (let h = startH; h < endH; h++) {
      set.add(`${dayIdx}-${h}`);
    }
  });
  return set;
};

/** Agrupa horas contiguas del pending set por día para hacer POSTs eficientes */
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
      if (hours[i] === end) {
        end = hours[i] + 1;
      } else {
        blocks.push({ dayIdx: Number(dayIdx), startH: start, endH: end });
        start = hours[i];
        end = hours[i] + 1;
      }
    }
    blocks.push({ dayIdx: Number(dayIdx), startH: start, endH: end });
  });
  return blocks;
};

/* ── Celda de la grilla ────────────────────────────────────── */
const GridCell = React.memo(({ dayIdx, hour, isSaved, isPending, isRemoving, onMouseDown, onMouseEnter }) => {
  const key = `${dayIdx}-${hour}`;

  let bg = 'bg-[#111] hover:bg-[#1a1a1a]';
  let border = 'border-[#1e1e1e]';
  let cursor = 'cursor-pointer';

  if (isSaved && !isRemoving) {
    bg = 'bg-emerald-900/60 hover:bg-red-900/40';
    border = 'border-emerald-800/50';
  } else if (isPending) {
    bg = 'bg-emerald-600/40 hover:bg-emerald-500/40';
    border = 'border-emerald-500/60 border-dashed';
  } else if (isRemoving) {
    bg = 'bg-red-900/40 hover:bg-red-800/40';
    border = 'border-red-700/50 border-dashed';
  }

  return (
    <td
      data-key={key}
      onMouseDown={() => onMouseDown(dayIdx, hour)}
      onMouseEnter={() => onMouseEnter(dayIdx, hour)}
      className={`${bg} ${border} border ${cursor} select-none transition-colors duration-100 h-7`}
      title={`${DAYS[dayIdx]} ${String(hour).padStart(2, '0')}:00 - ${String(hour + 1).padStart(2, '0')}:00 UTC`}
    />
  );
});
GridCell.displayName = 'GridCell';

/* ── Grilla principal ──────────────────────────────────────── */
const WeekGrid = ({ savedSet, pendingSet, removingSet, onToggleCell, onDragStart, onDragEnter, onDragEnd }) => {
  const tableRef = useRef(null);

  useEffect(() => {
    const handleUp = () => onDragEnd();
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, [onDragEnd]);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0a0a]">
      <table ref={tableRef} className="w-full border-collapse min-w-[600px]" onMouseLeave={onDragEnd}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-[#0a0a0a] text-[10px] text-gray-600 font-medium w-12 py-2">UTC</th>
            {DAYS_SHORT.map((d, i) => (
              <th key={i} className="text-xs text-gray-400 font-semibold py-2 px-1">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(h => (
            <tr key={h}>
              <td className="sticky left-0 z-10 bg-[#0a0a0a] text-[10px] text-gray-600 font-mono text-right pr-2 select-none border-r border-[#1e1e1e]">
                {String(h).padStart(2, '0')}:00
              </td>
              {DAYS.map((_, dayIdx) => {
                const key = `${dayIdx}-${h}`;
                return (
                  <GridCell
                    key={key}
                    dayIdx={dayIdx}
                    hour={h}
                    isSaved={savedSet.has(key)}
                    isPending={pendingSet.has(key)}
                    isRemoving={removingSet.has(key)}
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

/* ── Vista de lista (cards) ────────────────────────────────── */
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
    <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-3 hover:border-gray-700 transition-colors">
      <div className="min-w-0">
        <p className="font-semibold text-white text-sm truncate">{diaLabel}</p>
        <p className="text-gray-400 text-xs font-mono mt-0.5">
          {slot.hora_inicio} — {slot.hora_fin}
          <span className="text-gray-600 ml-1">UTC</span>
        </p>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
          confirmando
            ? 'bg-red-700 hover:bg-red-600 text-white border border-red-600'
            : 'bg-transparent border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {deleting ? (
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : confirmando ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Confirmar
          </>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </button>
    </div>
  );
};

/* ── Leyenda ──────────────────────────────────────────────── */
const Legend = () => (
  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded bg-emerald-900/60 border border-emerald-800/50" />
      <span>Guardado</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded bg-emerald-600/40 border border-emerald-500/60 border-dashed" />
      <span>Por guardar</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded bg-red-900/40 border border-red-700/50 border-dashed" />
      <span>Por eliminar</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded bg-[#111] border border-[#1e1e1e]" />
      <span>No disponible</span>
    </div>
  </div>
);

/* ── Componente principal ─────────────────────────────────── */
export default function MentorAvailabilityPanel() {
  const { availabilities, loading, error, setError, add, remove, refresh } = useAvailability();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [pendingSet, setPendingSet] = useState(new Set());
  const [removingSet, setRemovingSet] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'add' | 'remove' | null
  const [dragDay, setDragDay] = useState(null);

  const savedSet = buildSavedSet(availabilities);

  // Encuentra el ID del bloque guardado que contiene esta celda
  const findSavedBlockId = (dayIdx, hour) => {
    return availabilities.find(av => {
      const avDay = (typeof av.dia_semana === 'number' ? av.dia_semana : DIA_STR_TO_INT[av.dia_semana] ?? 1) - 1;
      if (avDay !== dayIdx) return false;
      const startH = parseInt((av.hora_inicio ?? '').split(':')[0], 10) || 0;
      const endH = parseInt((av.hora_fin ?? '').split(':')[0], 10) || 0;
      return hour >= startH && hour < endH;
    });
  };

  const handleDragStart = useCallback((dayIdx, hour) => {
    const key = `${dayIdx}-${hour}`;
    const isSaved = savedSet.has(key);
    const isPending = pendingSet.has(key);
    const isRemoving = removingSet.has(key);

    if (isSaved && !isRemoving) {
      // Marcar para eliminar
      setDragMode('remove');
      setDragDay(dayIdx);
      setRemovingSet(prev => { const n = new Set(prev); n.add(key); return n; });
    } else if (isRemoving) {
      // Desmarcar eliminación
      setDragMode('unremove');
      setDragDay(dayIdx);
      setRemovingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
    } else if (isPending) {
      // Deseleccionar pendiente
      setDragMode('deselect');
      setDragDay(dayIdx);
      setPendingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
    } else {
      // Agregar pendiente
      setDragMode('add');
      setDragDay(dayIdx);
      setPendingSet(prev => { const n = new Set(prev); n.add(key); return n; });
    }
  }, [savedSet, pendingSet, removingSet]);

  const handleDragEnter = useCallback((dayIdx, hour) => {
    if (!dragMode || dayIdx !== dragDay) return;
    const key = `${dayIdx}-${hour}`;
    const isSaved = savedSet.has(key);

    if (dragMode === 'add' && !isSaved) {
      setPendingSet(prev => { const n = new Set(prev); n.add(key); return n; });
    } else if (dragMode === 'deselect') {
      setPendingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
    } else if (dragMode === 'remove' && isSaved) {
      setRemovingSet(prev => { const n = new Set(prev); n.add(key); return n; });
    } else if (dragMode === 'unremove') {
      setRemovingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [dragMode, dragDay, savedSet]);

  const handleDragEnd = useCallback(() => {
    setDragMode(null);
    setDragDay(null);
  }, []);

  const hasPendingChanges = pendingSet.size > 0 || removingSet.size > 0;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1. Eliminar bloques marcados para remoción
      const blocksToRemove = new Set();
      removingSet.forEach(key => {
        const [d, h] = key.split('-').map(Number);
        const av = findSavedBlockId(d, h);
        if (av) blocksToRemove.add(av.id);
      });

      for (const id of blocksToRemove) {
        await remove(id);
      }

      // 2. Agregar bloques pendientes
      const newBlocks = groupContiguous(pendingSet);
      for (const block of newBlocks) {
        const dayStr = DAYS[block.dayIdx];
        const hora_inicio = `${String(block.startH).padStart(2, '0')}:00`;
        const hora_fin = block.endH === 24 ? '23:59' : `${String(block.endH).padStart(2, '0')}:00`;
        await add({ dia_semana: dayStr, hora_inicio, hora_fin });
      }

      setPendingSet(new Set());
      setRemovingSet(new Set());
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setPendingSet(new Set());
    setRemovingSet(new Set());
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <div className="h-8 w-64 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="h-[500px] bg-[#0d0d0d] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Disponibilidad semanal</h2>
          <p className="text-gray-500 text-sm mt-1">
            Configura tus horarios en{' '}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs font-semibold">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              UTC
            </span>
            {' '}— los mentees los ven convertidos a su zona local.
          </p>
        </div>

        {/* Toggle vista */}
        <div className="flex bg-[#141414] border border-gray-800 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              viewMode === 'grid'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grilla
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Lista
          </button>
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="flex items-start gap-2 bg-red-950/50 border border-red-700 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-300 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Vista Grilla */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Haz click o arrastra para seleccionar horas. Click en bloques verdes para marcar eliminación.
              </p>
              <Legend />
            </div>

            <WeekGrid
              savedSet={savedSet}
              pendingSet={pendingSet}
              removingSet={removingSet}
              onToggleCell={() => {}}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
            />
          </div>

          {/* Barra de acciones */}
          {hasPendingChanges && (
            <div className="flex items-center justify-between bg-[#141414] border border-gray-800 rounded-xl p-4 shadow-lg animate-in">
              <div className="text-sm text-gray-300">
                {pendingSet.size > 0 && (
                  <span className="inline-flex items-center gap-1 mr-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {pendingSet.size}h por agregar
                  </span>
                )}
                {removingSet.size > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {removingSet.size}h por eliminar
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDiscard}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all disabled:opacity-40"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-600 text-white transition-all disabled:opacity-60 flex items-center gap-2 active:scale-[0.97]"
                >
                  {saving ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Guardando...
                    </>
                  ) : 'Guardar cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Agregar bloque manualmente</h3>
            <ListForm onSubmit={add} error={error} onClearError={() => setError(null)} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">
              Horarios guardados
              {availabilities.length > 0 && (
                <span className="ml-2 text-gray-600 font-normal">({availabilities.length})</span>
              )}
            </h3>
            {availabilities.length === 0 ? (
              <div className="border border-dashed border-gray-800 rounded-xl py-10 text-center">
                <svg className="w-8 h-8 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">Sin horarios configurados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

/* ── Formulario de lista (fallback) ────────────────────────── */
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Día</label>
          <select
            value={form.day}
            onChange={set('day')}
            className="w-full bg-[#0d0d0d] border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
          >
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Inicio (UTC)</label>
          <input
            type="time"
            value={form.startTime}
            onChange={set('startTime')}
            className="w-full bg-[#0d0d0d] border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Fin (UTC)</label>
          <input
            type="time"
            value={form.endTime}
            min={form.startTime || undefined}
            onChange={set('endTime')}
            className="w-full bg-[#0d0d0d] border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
          />
        </div>
      </div>

      {displayError && (
        <div className="flex items-start gap-2 bg-red-950/50 border border-red-700 rounded-lg px-3 py-2.5">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-300 text-sm">{displayError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all active:scale-[0.98] flex items-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Guardando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar horario
          </>
        )}
      </button>
    </form>
  );
};
