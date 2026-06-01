import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

const API_URL = '/api/disponibilidad/';
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DIA_STR_TO_INT = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 7 };

/* ── Hook de datos (Intacto) ───────────────────────── */
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
  return { availabilities, loading, error, setError, refresh: fetchAll };
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

/* ── Componente de Celda Adaptativo (Glassmorphism) ── */
const GridCell = React.memo(({ dayIdx, hour, isSaved, isPending, isRemoving, onMouseDown, onMouseEnter }) => {
  let bg = 'bg-white/5 hover:bg-white/10';
  let border = 'border-white/5';

  if (isSaved && !isRemoving) {
    bg = 'bg-emerald-500/40 hover:bg-emerald-500/60';
    border = 'border-emerald-500/20';
  } else if (isPending) {
    bg = 'bg-emerald-500/20';
    border = 'border-emerald-500/50 border-dashed';
  } else if (isRemoving) {
    bg = 'bg-red-500/20';
    border = 'border-red-500/50 border-dashed';
  }

  return (
    <td
      onMouseDown={() => onMouseDown(dayIdx, hour)}
      onMouseEnter={() => onMouseEnter(dayIdx, hour)}
      className={`${bg} ${border} border cursor-pointer transition-all duration-200 h-8`}
    />
  );
});
GridCell.displayName = 'GridCell';

/* ── Grilla Principal ──────────────────────────────── */
const WeekGrid = ({ savedSet, pendingSet, removingSet, onDragStart, onDragEnter, onDragEnd }) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md">
      <table className="w-full border-collapse min-w-[600px]" onMouseLeave={onDragEnd}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-black/50 text-[10px] text-slate-400 font-medium w-12 py-3 border-b border-white/10">UTC</th>
            {DAYS_SHORT.map((d, i) => (
              <th key={i} className="text-xs text-slate-300 font-semibold py-3 px-1 border-b border-white/10">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(h => (
            <tr key={h}>
              <td className="sticky left-0 z-10 bg-black/50 text-[10px] text-slate-500 font-mono text-right pr-2 select-none border-r border-white/5">
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

/* ── Panel Principal ──────────────────────────────── */
export default function MentorAvailabilityPanel() {
  const { availabilities } = useAvailability();
  const [viewMode, setViewMode] = useState('grid');
  const [pendingSet, setPendingSet] = useState(new Set());
  const [removingSet, setRemovingSet] = useState(new Set());
  const [dragMode, setDragMode] = useState(null);
  const [dragDay, setDragDay] = useState(null);

  const savedSet = buildSavedSet(availabilities);

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
    else if (dragMode === 'remove' && isSaved) setRemovingSet(prev => { const n = new Set(prev); n.add(key); return n; });
    else if (dragMode === 'unremove') setRemovingSet(prev => { const n = new Set(prev); n.delete(key); return n; });
  }, [dragMode, dragDay, savedSet]);

  const handleDragEnd = useCallback(() => { setDragMode(null); setDragDay(null); }, []);
  const hasPendingChanges = pendingSet.size > 0 || removingSet.size > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#1a0b2e] to-[#4a044e] p-6 md:p-12 text-white font-sans bg-fixed">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Glassmorphism */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 shadow-2xl">
          <div>
            <h2 className="text-2xl font-bold">Disponibilidad semanal</h2>
            <p className="text-slate-400 text-sm mt-1">Configura tus horarios en <span className="text-purple-400 font-semibold">UTC</span>.</p>
          </div>
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
             <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-lg text-xs font-semibold ${viewMode === 'grid' ? 'bg-purple-600' : 'hover:bg-white/5'}`}>Grilla</button>
             <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-xs font-semibold ${viewMode === 'list' ? 'bg-purple-600' : 'hover:bg-white/5'}`}>Lista</button>
          </div>
        </div>

        {/* Grid Contenido */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
          {viewMode === 'grid' && (
            <WeekGrid 
              savedSet={savedSet} pendingSet={pendingSet} removingSet={removingSet}
              onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd}
            />
          )}
        </div>

        {/* Barra de acciones */}
        {hasPendingChanges && (
          <div className="flex items-center justify-between bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="text-sm text-slate-300">
               <span className="font-bold text-emerald-400">{pendingSet.size}h</span> por agregar | 
               <span className="font-bold text-red-400 ml-3">{removingSet.size}h</span> por eliminar
            </div>
            <div className="flex gap-3">
               <button onClick={() => { setPendingSet(new Set()); setRemovingSet(new Set()); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/10 hover:bg-white/5">Descartar</button>
               <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-900/50">Guardar Cambios</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}