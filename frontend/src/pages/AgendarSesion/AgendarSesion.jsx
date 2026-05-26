import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

/* ── Constantes ────────────────────────────────────────────── */
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DIA_STR_TO_INT = {
  'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4,
  'Viernes': 5, 'Sábado': 6, 'Domingo': 7,
  'Miercoles': 3, 'Sabado': 6,
};

/* ── Helpers UTC → Local ───────────────────────────────────── */
const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Devuelve el offset local en horas (ej: America/La_Paz = -4) */
const getLocalOffsetHours = () => -(new Date().getTimezoneOffset() / 60);

/**
 * Convierte (dia_semana_utc [0-6], hora_utc [0-23]) a local.
 * Retorna { dayIdx, hour } en índices locales.
 */
const utcToLocal = (dayIdx, hour) => {
  const offset = getLocalOffsetHours();
  let localHour = hour + offset;
  let localDay = dayIdx;
  if (localHour < 0) { localHour += 24; localDay = (localDay - 1 + 7) % 7; }
  if (localHour >= 24) { localHour -= 24; localDay = (localDay + 1) % 7; }
  return { dayIdx: localDay, hour: Math.floor(localHour) };
};

/**
 * Convierte (dia_semana_local [0-6], hora_local [0-23]) a UTC.
 */
const localToUTC = (dayIdx, hour) => {
  const offset = getLocalOffsetHours();
  let utcHour = hour - offset;
  let utcDay = dayIdx;
  if (utcHour < 0) { utcHour += 24; utcDay = (utcDay - 1 + 7) % 7; }
  if (utcHour >= 24) { utcHour -= 24; utcDay = (utcDay + 1) % 7; }
  return { dayIdx: utcDay, hour: Math.floor(utcHour) };
};

/**
 * Construye un Set de claves "dayIdx-hour" en hora LOCAL a partir de la disponibilidad UTC.
 */
const buildAvailableSetLocal = (disponibilidades) => {
  const set = new Set();
  disponibilidades.forEach(d => {
    const dayInt = typeof d.dia_semana === 'number'
      ? d.dia_semana
      : (DIA_STR_TO_INT[d.dia_semana] ?? 1);
    const dayIdx = dayInt - 1; // 0-based

    const startStr = typeof d.hora_inicio === 'string' ? d.hora_inicio : '';
    const endStr = typeof d.hora_fin === 'string' ? d.hora_fin : '';
    const startH = parseInt(startStr.split(':')[0], 10) || 0;
    const endH = parseInt(endStr.split(':')[0], 10) || 0;

    for (let h = startH; h < endH; h++) {
      const local = utcToLocal(dayIdx, h);
      set.add(`${local.dayIdx}-${local.hour}`);
    }
  });
  return set;
};

/**
 * Construye un Set de claves "dayIdx-hour" en hora LOCAL a partir de sesiones ocupadas UTC.
 */
const buildOccupiedSetLocal = (sesiones) => {
  const set = new Set();
  sesiones.forEach(s => {
    const start = new Date(s.fecha_hora_inicio_utc);
    const end = new Date(s.fecha_hora_fin_utc);

    // Iterar hora por hora
    const current = new Date(start);
    while (current < end) {
      const dayIdx = current.getDay() === 0 ? 6 : current.getDay() - 1; // JS 0=Sunday → 6
      const hour = current.getHours();
      set.add(`${dayIdx}-${hour}`);
      current.setHours(current.getHours() + 1);
    }
  });
  return set;
};

/**
 * Próxima ocurrencia de un día ISO (0=Lun) + hora UTC como Date.
 */
const nextOccurrence = (dayIdxLocal, hourLocal) => {
  const utc = localToUTC(dayIdxLocal, hourLocal);
  const now = new Date();
  const nowUTCDay = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1; // 0-based Mon
  let diff = utc.dayIdx - nowUTCDay;
  if (diff <= 0) diff += 7;

  return new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff,
    utc.hour, 0, 0, 0
  ));
};

/* ── Leyenda ──────────────────────────────────────────────── */
const Legend = () => (
  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded bg-emerald-900/60 border border-emerald-800/50" />
      <span>Disponible</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded bg-amber-800/50 border border-amber-700/50" />
      <span>Ocupado</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded bg-blue-700/50 border border-blue-500/60" />
      <span>Tu selección</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded bg-[#111] border border-[#1e1e1e]" />
      <span>No disponible</span>
    </div>
  </div>
);

/* ── Celda de grilla del mentee ─────────────────────────────── */
const MenteeGridCell = ({ dayIdx, hour, isAvailable, isOccupied, isSelected, onMouseDown, onMouseEnter }) => {
  let bg = 'bg-[#111]';
  let border = 'border-[#1e1e1e]';
  let cursor = 'cursor-default';
  let opacity = 'opacity-40';

  if (isOccupied) {
    bg = 'bg-amber-800/50';
    border = 'border-amber-700/50';
    cursor = 'cursor-not-allowed';
    opacity = 'opacity-100';
  } else if (isSelected) {
    bg = 'bg-blue-700/50 hover:bg-blue-600/50';
    border = 'border-blue-500/60';
    cursor = 'cursor-pointer';
    opacity = 'opacity-100';
  } else if (isAvailable) {
    bg = 'bg-emerald-900/60 hover:bg-emerald-800/60';
    border = 'border-emerald-800/50';
    cursor = 'cursor-pointer';
    opacity = 'opacity-100';
  }

  return (
    <td
      onMouseDown={() => { if (isAvailable && !isOccupied) onMouseDown(dayIdx, hour); }}
      onMouseEnter={() => { if (isAvailable && !isOccupied) onMouseEnter(dayIdx, hour); }}
      className={`${bg} ${border} ${cursor} ${opacity} border select-none transition-colors duration-100 h-7`}
      title={`${DAYS[dayIdx]} ${String(hour).padStart(2, '0')}:00 (hora local)`}
    />
  );
};

/* ── Grilla del mentee ─────────────────────────────────────── */
const MenteeWeekGrid = ({ availableSet, occupiedSet, selectedSet, onDragStart, onDragEnter, onDragEnd }) => {
  useEffect(() => {
    const handleUp = () => onDragEnd();
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
  }, [onDragEnd]);

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-[#0a0a0a]">
      <table className="w-full border-collapse min-w-[600px]" onMouseLeave={onDragEnd}>
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-[#0a0a0a] text-[10px] text-gray-600 font-medium w-12 py-2">
              Hora
            </th>
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
                  <MenteeGridCell
                    key={key}
                    dayIdx={dayIdx}
                    hour={h}
                    isAvailable={availableSet.has(key)}
                    isOccupied={occupiedSet.has(key)}
                    isSelected={selectedSet.has(key)}
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

/* ── Vista de Lista (legacy) ───────────────────────────────── */
const parseTimeUTC = (timeStr) => {
  const [h, m] = (timeStr ?? '00:00').split(':').map(Number);
  return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
};

const getNextOccurrenceUTC = (targetDayISO, startH, startM) => {
  const now = new Date();
  const nowUTCDay = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
  let diff = targetDayISO - nowUTCDay;
  if (diff <= 0) diff += 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff, startH, startM, 0, 0));
};

const utcDateToLocalTime24h = (date) =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

const buildSlots = (disponibilidades) =>
  disponibilidades.map((d) => {
    const diaInt = typeof d.dia_semana === 'number' ? d.dia_semana : (DIA_STR_TO_INT[d.dia_semana] ?? 1);
    const { h: sh, m: sm } = parseTimeUTC(d.hora_inicio);
    const { h: eh, m: em } = parseTimeUTC(d.hora_fin);
    const startUTC = getNextOccurrenceUTC(diaInt, sh, sm);
    const endUTC = getNextOccurrenceUTC(diaInt, eh, em);
    const localStart = utcDateToLocalTime24h(startUTC);
    const localEnd = utcDateToLocalTime24h(endUTC);
    const localDate = startUTC.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
    return {
      id: d.id,
      diaLabel: typeof d.dia_semana === 'string' ? d.dia_semana : `Dia ${diaInt}`,
      localDate, localStart, localEnd, startUTC, endUTC,
      label: `${localDate} — ${localStart} a ${localEnd} (hora local)`,
    };
  });

const buildUTCPayload = (slotStartUTC, localTime24h) => {
  const [h, m] = localTime24h.split(':').map(Number);
  const local = new Date(slotStartUTC.getTime());
  local.setHours(h, m, 0, 0);
  return local.toISOString();
};

/* ── Componente principal ─────────────────────────────────── */
export default function AgendarSesion() {
  const navigate = useNavigate();

  const [contratos, setContratos] = useState([]);
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [sesionesOcupadas, setSesionesOcupadas] = useState([]);

  const [selectedContratoId, setSelectedContratoId] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Estado grilla
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [dragMode, setDragMode] = useState(null);
  const [dragDay, setDragDay] = useState(null);

  // Estado lista (legacy)
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  const [loadingContratos, setLoadingContratos] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Cargar contratos
  useEffect(() => {
    apiClient('/api/contratos/me', { method: 'GET' })
      .then(data => setContratos(data.filter(c => c.estado === 'activo')))
      .catch(err => setError(err.message))
      .finally(() => setLoadingContratos(false));
  }, []);

  const contratoSeleccionado = contratos.find(c => c.id_contrato === selectedContratoId);

  // Cargar disponibilidad + sesiones ocupadas cuando cambia el contrato
  const cargarDatos = useCallback(async (idMentor) => {
    setLoadingSlots(true);
    setDisponibilidades([]);
    setSesionesOcupadas([]);
    setSlots([]);
    setSelectedSlotId('');
    setSelectedCells(new Set());
    setHoraInicio('');
    setHoraFin('');
    try {
      const [dispData, ocupData] = await Promise.all([
        apiClient(`/api/disponibilidad/mentor/${idMentor}`, { method: 'GET' }),
        apiClient(`/api/sesiones/ocupadas/${idMentor}`, { method: 'GET' }),
      ]);
      setDisponibilidades(dispData);
      setSesionesOcupadas(ocupData);
      setSlots(buildSlots(dispData));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (!contratoSeleccionado?.id_mentor) return;
    cargarDatos(contratoSeleccionado.id_mentor);
  }, [contratoSeleccionado, cargarDatos]);

  // Sets para la grilla
  const availableSet = buildAvailableSetLocal(disponibilidades);
  const occupiedSet = buildOccupiedSetLocal(sesionesOcupadas);

  /* ── Drag handlers para la grilla ─────────────────────────── */
  const handleDragStart = useCallback((dayIdx, hour) => {
    const key = `${dayIdx}-${hour}`;
    if (occupiedSet.has(key)) return;

    if (selectedCells.has(key)) {
      setDragMode('deselect');
      setDragDay(dayIdx);
      setSelectedCells(prev => { const n = new Set(prev); n.delete(key); return n; });
    } else {
      setDragMode('select');
      setDragDay(dayIdx);
      setSelectedCells(prev => { const n = new Set(prev); n.add(key); return n; });
    }
  }, [occupiedSet, selectedCells]);

  const handleDragEnter = useCallback((dayIdx, hour) => {
    if (!dragMode || dayIdx !== dragDay) return;
    const key = `${dayIdx}-${hour}`;
    if (occupiedSet.has(key)) return;

    if (dragMode === 'select') {
      setSelectedCells(prev => { const n = new Set(prev); n.add(key); return n; });
    } else {
      setSelectedCells(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [dragMode, dragDay, occupiedSet]);

  const handleDragEnd = useCallback(() => {
    setDragMode(null);
    setDragDay(null);
  }, []);

  /* ── Validación de selección contigua ──────────────────────── */
  const validateSelection = () => {
    if (selectedCells.size === 0) return null;

    // Agrupar por día
    const byDay = {};
    selectedCells.forEach(key => {
      const [d, h] = key.split('-').map(Number);
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(h);
    });

    const days = Object.keys(byDay);
    if (days.length > 1) return 'Solo puedes seleccionar horas de un mismo día por sesión.';

    const dayIdx = Number(days[0]);
    const hours = byDay[dayIdx].sort((a, b) => a - b);

    // Verificar contigüidad
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] !== hours[i - 1] + 1) return 'Las horas seleccionadas deben ser contiguas.';
    }

    // Verificar mínimo 1 hora
    if (hours.length < 1) return 'Selecciona al menos 1 hora.';

    return null; // válido
  };

  const getSelectionSummary = () => {
    if (selectedCells.size === 0) return null;
    const byDay = {};
    selectedCells.forEach(key => {
      const [d, h] = key.split('-').map(Number);
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(h);
    });
    const dayIdx = Number(Object.keys(byDay)[0]);
    const hours = byDay[dayIdx].sort((a, b) => a - b);
    const startH = hours[0];
    const endH = hours[hours.length - 1] + 1;
    return {
      dayIdx,
      dayName: DAYS[dayIdx],
      startLocal: `${String(startH).padStart(2, '0')}:00`,
      endLocal: `${String(endH).padStart(2, '0')}:00`,
      duration: hours.length,
    };
  };

  /* ── Submit grilla ────────────────────────────────────────── */
  const handleSubmitGrid = async () => {
    const validationError = validateSelection();
    if (validationError) { setError(validationError); return; }

    const summary = getSelectionSummary();
    if (!summary) return;

    // Convertir la selección de hora local a UTC
    const startUTC = localToUTC(summary.dayIdx, parseInt(summary.startLocal));
    const endUTC = localToUTC(summary.dayIdx, parseInt(summary.endLocal));

    // Construir fechas absolutas (próxima ocurrencia)
    const startDate = nextOccurrence(summary.dayIdx, parseInt(summary.startLocal));
    const endDate = new Date(startDate.getTime() + summary.duration * 3600000);

    setSubmitting(true);
    setError(null);
    try {
      await apiClient('/api/sesiones/agendar', {
        method: 'POST',
        body: {
          id_contrato: selectedContratoId,
          fecha_hora_inicio_utc: startDate.toISOString(),
          fecha_hora_fin_utc: endDate.toISOString(),
        },
      });
      setSuccess(true);
      setTimeout(() => navigate('/mentee/contratos'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Submit lista (legacy) ────────────────────────────────── */
  const slotActivo = slots.find(s => s.id === selectedSlotId);

  const validarHorario = () => {
    if (!selectedContratoId || !selectedSlotId || !horaInicio || !horaFin) {
      setError('Completa todos los campos antes de continuar.'); return false;
    }
    if (horaInicio >= horaFin) { setError('La hora de fin debe ser posterior a la de inicio.'); return false; }
    if (horaInicio < slotActivo.localStart || horaFin > slotActivo.localEnd) {
      setError(`El horario escapa de la ventana: ${slotActivo.localStart} - ${slotActivo.localEnd}.`);
      return false;
    }
    return true;
  };

  const handleSubmitList = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validarHorario()) return;

    const inicioISO = buildUTCPayload(slotActivo.startUTC, horaInicio);
    const finISO = buildUTCPayload(slotActivo.startUTC, horaFin);

    setSubmitting(true);
    try {
      await apiClient('/api/sesiones/agendar', {
        method: 'POST',
        body: { id_contrato: selectedContratoId, fecha_hora_inicio_utc: inicioISO, fecha_hora_fin_utc: finISO },
      });
      setSuccess(true);
      setTimeout(() => navigate('/mentee/contratos'), 2000);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  /* ── Render ──────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-[#141414] border border-green-600 rounded-2xl p-10 text-center shadow-[0_0_20px_rgba(22,163,74,0.2)]">
          <div className="w-14 h-14 rounded-full bg-green-900/40 border border-green-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Sesión confirmada</h2>
          <p className="text-gray-400 text-sm">Redirigiendo a tus contratos...</p>
        </div>
      </div>
    );
  }

  const selectionSummary = getSelectionSummary();
  const selectionError = validateSelection();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Agendar Sesión</h1>
            <p className="text-gray-500 text-sm mt-1">
              Horarios en tu zona:{' '}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs font-semibold">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {userTZ}
              </span>
            </p>
          </div>

          {/* Toggle vista */}
          <div className="flex bg-[#141414] border border-gray-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-red-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grilla
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-red-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
            >
              <svg className="w-3.5 h-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Lista
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-950/50 border border-red-700 rounded-xl p-4 flex gap-3 items-start">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        {/* Selector de contrato */}
        <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 shadow-lg mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Contrato activo
          </label>
          {loadingContratos ? (
            <div className="h-11 bg-[#0d0d0d] rounded-lg animate-pulse" />
          ) : contratos.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No tienes contratos activos. Ve al marketplace.</p>
          ) : (
            <select
              value={selectedContratoId}
              onChange={(e) => setSelectedContratoId(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
            >
              <option value="">Selecciona un contrato</option>
              {contratos.map(c => (
                <option key={c.id_contrato} value={c.id_contrato}>
                  {c.paquete} — {c.horas_consumidas}h usadas
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Loading slots */}
        {loadingSlots && (
          <div className="h-[400px] bg-[#0d0d0d] rounded-2xl animate-pulse" />
        )}

        {/* Vista Grilla */}
        {viewMode === 'grid' && selectedContratoId && !loadingSlots && (
          <div className="space-y-4">
            <div className="bg-[#141414] border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Selecciona las horas que quieres reservar. Solo bloques contiguos del mismo día.
                </p>
                <Legend />
              </div>

              <MenteeWeekGrid
                availableSet={availableSet}
                occupiedSet={occupiedSet}
                selectedSet={selectedCells}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
              />
            </div>

            {/* Resumen de selección + submit */}
            {selectedCells.size > 0 && (
              <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 shadow-lg space-y-4">
                {selectionError ? (
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {selectionError}
                  </div>
                ) : selectionSummary && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {selectionSummary.dayName} — {selectionSummary.startLocal} a {selectionSummary.endLocal}
                          <span className="text-gray-500 ml-2 font-normal">(hora local)</span>
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Duración: {selectionSummary.duration}h
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCells(new Set())}
                          disabled={submitting}
                          className="px-4 py-2 rounded-lg text-xs font-semibold border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white transition-all"
                        >
                          Limpiar
                        </button>
                        <button
                          onClick={handleSubmitGrid}
                          disabled={submitting}
                          className="px-5 py-2 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-600 text-white transition-all disabled:opacity-60 flex items-center gap-2 active:scale-[0.97]"
                        >
                          {submitting ? (
                            <>
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Confirmando...
                            </>
                          ) : 'Confirmar Sesión'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vista Lista */}
        {viewMode === 'list' && selectedContratoId && !loadingSlots && (
          <form onSubmit={handleSubmitList} className="bg-[#141414] border border-gray-800 rounded-2xl p-7 space-y-6 shadow-xl">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Bloque disponible del mentor
                <span className="ml-2 normal-case font-normal text-gray-500">(horario en tu zona local)</span>
              </label>
              <select
                value={selectedSlotId}
                onChange={(e) => { setSelectedSlotId(e.target.value); setHoraInicio(''); setHoraFin(''); }}
                disabled={slots.length === 0}
                className="w-full bg-[#0d0d0d] border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:opacity-40 transition-all"
              >
                <option value="">
                  {slots.length === 0 ? 'Este mentor no tiene horarios configurados' : 'Selecciona un bloque'}
                </option>
                {slots.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {slotActivo && (
              <div className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Ventana disponible</span>
                  <span className="text-gray-300 font-mono">{slotActivo.localStart} — {slotActivo.localEnd}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Hora de inicio</label>
                    <input type="time" value={horaInicio} min={slotActivo.localStart} max={slotActivo.localEnd}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full bg-[#141414] border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Hora de fin</label>
                    <input type="time" value={horaFin} min={horaInicio || slotActivo.localStart} max={slotActivo.localEnd}
                      onChange={(e) => setHoraFin(e.target.value)}
                      className="w-full bg-[#141414] border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                    />
                  </div>
                </div>
                {horaInicio && horaFin && horaInicio < horaFin && (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Duración: {(() => {
                      const [ih, im] = horaInicio.split(':').map(Number);
                      const [fh, fm] = horaFin.split(':').map(Number);
                      const mins = (fh * 60 + fm) - (ih * 60 + im);
                      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
                    })()}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || contratos.length === 0 || !slotActivo || !horaInicio || !horaFin}
              className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] text-sm"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Confirmando reserva...
                </span>
              ) : 'Confirmar Sesión'}
            </button>
          </form>
        )}

        {/* Sin contrato seleccionado */}
        {!selectedContratoId && !loadingContratos && contratos.length > 0 && (
          <div className="border border-dashed border-gray-800 rounded-xl py-16 text-center">
            <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-sm">Selecciona un contrato para ver la disponibilidad del mentor.</p>
          </div>
        )}
      </div>
    </div>
  );
}