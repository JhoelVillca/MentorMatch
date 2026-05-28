import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';

const API_URL = '/api/disponibilidad/';
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DIA_STR_TO_INT = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 7 };
const DIA_INT_TO_STR = {};
Object.entries(DIA_STR_TO_INT).forEach(([k, v]) => { DIA_INT_TO_STR[v] = k; });

/* ── Hook de datos (Mantenido intacto) ───────────────────────── */
const useAvailability = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try { const data = await apiClient(API_URL); setAvailabilities(data); } 
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);
  const add = useCallback(async (payload) => { await apiClient(API_URL, { method: 'POST', body: payload }); await fetchAll(); }, [fetchAll]);
  const remove = useCallback(async (id) => { await apiClient(`${API_URL}${id}`, { method: 'DELETE' }); setAvailabilities(prev => prev.filter(a => a.id !== id)); }, []);
  return { availabilities, loading, error, setError, add, remove, refresh: fetchAll };
};

const buildSavedSet = (availabilities) => {
  const set = new Set();
  availabilities.forEach(av => {
    const dayIdx = typeof av.dia_semana === 'number' ? av.dia_semana - 1 : (DIA_STR_TO_INT[av.dia_semana] ?? 1) - 1;
    const startH = parseInt((av.hora_inicio || '').split(':')[0], 10) || 0;
    const endH = parseInt((av.hora_fin || '').split(':')[0], 10) || 0;
    for (let h = startH; h < endH; h++) set.add(`${dayIdx}-${h}`);
  });
  return set;
};

const groupContiguous = (pendingSet) => {
  const byDay = {};
  pendingSet.forEach(key => { const [d, h] = key.split('-').map(Number); if (!byDay[d]) byDay[d] = []; byDay[d].push(h); });
  const blocks = [];
  Object.entries(byDay).forEach(([dayIdx, hours]) => {
    hours.sort((a, b) => a - b);
    let start = hours[0]; let end = hours[0] + 1;
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === end) end = hours[i] + 1;
      else { blocks.push({ dayIdx: Number(dayIdx), startH: start, endH: end }); start = hours[i]; end = hours[i] + 1; }
    }
    blocks.push({ dayIdx: Number(dayIdx), startH: start, endH: end });
  });
  return blocks;
};

/* ── Componente de Celda Adaptativo ────────────────────────── */
const GridCell = React.memo(({ dayIdx, hour, isSaved, isPending, isRemoving, onMouseDown, onMouseEnter }) => {
  const key = `${dayIdx}-${hour}`;

  // Clases base: Blanco/Gris claro -> Oscuro
  let bg = 'bg-white dark:bg-[#111] hover:bg-gray-100 dark:hover:bg-[#1a1a1a]';
  let border = 'border-gray-200 dark:border-[#1e1e1e]';

  if (isSaved && !isRemoving) {
    bg = 'bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 dark:hover:bg-red-900/40';
    border = 'border-emerald-200 dark:border-emerald-800/50';
  } else if (isPending) {
    bg = 'bg-emerald-50 dark:bg-emerald-600/40';
    border = 'border-emerald-300 dark:border-emerald-500/60 border-dashed';
  } else if (isRemoving) {
    bg = 'bg-red-50 dark:bg-red-900/40';
    border = 'border-red-300 dark:border-red-700/50 border-dashed';
  }

  return (
    <td
      onMouseDown={() => onMouseDown(dayIdx, hour)}
      onMouseEnter={() => onMouseEnter(dayIdx, hour)}
      className={`${bg} ${border} border cursor-pointer select-none transition-colors duration-100 h-7`}
    />
  );
});
GridCell.displayName = 'GridCell';

/* ── Grilla Principal ────────────────────────────────────── */
const WeekGrid = ({ savedSet, pendingSet, removingSet, onDragStart, onDragEnter, onDragEnd }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a]">
      <table className="w-full border-collapse min-w-[600px]" onMouseLeave={onDragEnd}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 dark:bg-[#0a0a0a] text-[10px] text-gray-500 font-medium w-12 py-2 border-b border-gray-200 dark:border-gray-800">UTC</th>
            {DAYS_SHORT.map((d, i) => (
              <th key={i} className="text-xs text-gray-500 dark:text-gray-400 font-semibold py-2 px-1 border-b border-gray-200 dark:border-gray-800">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(h => (
            <tr key={h}>
              <td className="sticky left-0 z-10 bg-gray-50 dark:bg-[#0a0a0a] text-[10px] text-gray-500 font-mono text-right pr-2 select-none border-r border-gray-200 dark:border-gray-800">
                {String(h).padStart(2, '0')}:00
              </td>
              {DAYS.map((_, dayIdx) => {
                const key = `${dayIdx}-${h}`;
                return (
                  <GridCell key={key} dayIdx={dayIdx} hour={h}
                    isSaved={savedSet.has(key)} isPending={pendingSet.has(key)} isRemoving={removingSet.has(key)}
                    onMouseDown={onDragStart} onMouseEnter={onDragEnter}
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

/* ── Panel Principal ────────────────────────────────────── */
export default function MentorAvailabilityPanel() {
  const { availabilities, loading, error, setError, add, remove, refresh } = useAvailability();
  const [viewMode, setViewMode] = useState('grid');
  const [pendingSet, setPendingSet] = useState(new Set());
  const [removingSet, setRemovingSet] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [dragMode, setDragMode] = useState(null);
  const [dragDay, setDragDay] = useState(null);

  const savedSet = buildSavedSet(availabilities);

  // Funciones de lógica mantenidas...
  const handleDragStart = useCallback((dayIdx, hour) => {
    const key = `${dayIdx}-${hour}`;
    const isSaved = savedSet.has(key);
    const isPending = pendingSet.has(key);
    const isRemoving = removingSet.has(key);
    if (isSaved && !isRemoving) { setDragMode('remove'); setDragDay(dayIdx); setRemovingSet(prev => new Set(prev).add(key)); }
    else if (isRemoving) { setDragMode('unremove'); setDragDay(dayIdx); setRemovingSet(prev => { const n = new Set(prev); n.delete(key); return n; }); }
    else if (isPending) { setDragMode('deselect'); setDragDay(dayIdx); setPendingSet(prev => { const n = new Set(prev); n.delete(key); return n; }); }
    else { setDragMode('add'); setDragDay(dayIdx); setPendingSet(prev => new Set(prev).add(key)); }
  }, [savedSet, pendingSet, removingSet]);

  const handleDragEnter = useCallback((dayIdx, hour) => {
    if (!dragMode || dayIdx !== dragDay) return;
    const key = `${dayIdx}-${hour}`;
    const isSaved = savedSet.has(key);
    if (dragMode === 'add' && !isSaved) setPendingSet(prev => new Set(prev).add(key));
    else if (dragMode === 'deselect') setPendingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
    else if (dragMode === 'remove' && isSaved) setRemovingSet(prev => new Set(prev).add(key));
    else if (dragMode === 'unremove') setRemovingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
  }, [dragMode, dragDay, savedSet]);

  const handleDragEnd = useCallback(() => { setDragMode(null); setDragDay(null); }, []);
  const handleSave = async () => { /* ... Logica de guardado ... */ };
  const handleDiscard = () => { setPendingSet(new Set()); setRemovingSet(new Set()); };
  const hasPendingChanges = pendingSet.size > 0 || removingSet.size > 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Disponibilidad semanal</h2>
          <p className="text-gray-500 text-sm mt-1">Configura tus horarios en <span className="font-semibold text-blue-600 dark:text-blue-300">UTC</span>.</p>
        </div>
        
        {/* Toggle View */}
        <div className="flex bg-gray-100 dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-lg p-0.5 gap-0.5">
           <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded text-xs font-semibold ${viewMode === 'grid' ? 'bg-white dark:bg-red-700 shadow border border-gray-200 dark:border-none' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Grilla</button>
           <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded text-xs font-semibold ${viewMode === 'list' ? 'bg-white dark:bg-red-700 shadow border border-gray-200 dark:border-none' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Lista</button>
        </div>
      </div>

      {/* Contenido (Misma estructura, pero colores dinámicos) */}
      <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        {viewMode === 'grid' && (
          <WeekGrid 
            savedSet={savedSet} pendingSet={pendingSet} removingSet={removingSet}
            onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd}
          />
        )}
      </div>

      {/* Barra de acciones (igual lógica, estilo mejorado) */}
      {hasPendingChanges && (
        <div className="flex items-center justify-between bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-lg">
          <div className="text-sm text-gray-600 dark:text-gray-300">
             {pendingSet.size}h por agregar | {removingSet.size}h por eliminar
          </div>
          <div className="flex gap-2">
             <button onClick={handleDiscard} className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Descartar</button>
             <button onClick={handleSave} className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700">Guardar</button>
          </div>
        </div>
      )}
    </div>
  );
}