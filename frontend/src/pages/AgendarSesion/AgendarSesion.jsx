import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

const DAYS_MAP = {
  'Lunes': 1, 'Martes': 2, 'Miercoles': 3, 'Jueves': 4,
  'Viernes': 5, 'Sabado': 6, 'Domingo': 7
};

// Genera la proxima fecha especifica en UTC
const getNextDateUTC = (diaString, horaString) => {
  const targetDay = DAYS_MAP[diaString];
  const [hours, minutes] = horaString.split(':').map(Number);
  
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, 0));
  
  let currentDay = d.getUTCDay() || 7;
  let diff = targetDay - currentDay;
  if (diff <= 0) diff += 7;
  
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
};

// Extractor estricto en 24h para compatibilidad con <input type="time">
const format24h = (d) => {
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Ensambla el Date final basado en el dia elegido y la hora local ingresada (24h)
const buildFinalDate = (baseDate, timeLocal24h) => {
  const [h, m] = timeLocal24h.split(':').map(Number);
  const d = new Date(baseDate.getTime());
  d.setHours(h, m, 0, 0);
  return d;
};

export default function AgendarSesion() {
  const navigate = useNavigate();

  const [contratos, setContratos] = useState([]);
  const [disponibilidades, setDisponibilidades] = useState([]);

  const [selectedContrato, setSelectedContrato] = useState('');
  const [selectedDispId, setSelectedDispId] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  const [loadingContratos, setLoadingContratos] = useState(true);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiClient('/api/contratos/me', { method: 'GET' })
      .then((data) => setContratos(data.filter((c) => c.estado === 'activo')))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingContratos(false));
  }, []);

  const contratoSeleccionado = contratos.find((c) => c.id_contrato === selectedContrato);

  useEffect(() => {
    if (!contratoSeleccionado) return;
    setLoadingDisp(true);
    setDisponibilidades([]);
    setSelectedDispId('');
    setHoraInicio('');
    setHoraFin('');

    apiClient(`/api/disponibilidad/mentor/${contratoSeleccionado.id_mentor}`, { method: 'GET' })
      .then((data) => {
        const slotsFormateados = data.map(d => {
          const startUTC = getNextDateUTC(d.dia_semana, d.hora_inicio);
          const endUTC = getNextDateUTC(d.dia_semana, d.hora_fin);
          
          const localStart24h = format24h(startUTC);
          const localEnd24h = format24h(endUTC);
          
          return {
            id: d.id,
            startUTC,
            endUTC,
            localStart24h,
            localEnd24h,
            localDateStr: startUTC.toLocaleDateString(),
            localDisplay: `${startUTC.toLocaleDateString()} (De ${localStart24h} a ${localEnd24h})`
          };
        });
        setDisponibilidades(slotsFormateados);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingDisp(false));
  }, [contratoSeleccionado]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedContrato || !selectedDispId || !horaInicio || !horaFin) {
      setError('Operacion abortada. Completa todos los campos para agendar.');
      return;
    }

    if (horaInicio >= horaFin) {
      setError('Incoherencia temporal: La hora de fin debe ser estrictamente posterior a la hora de inicio.');
      return;
    }

    const franja = disponibilidades.find((d) => d.id === selectedDispId);
    
    // Verificacion usando formato estricto militar (String comparison safe)
    if (horaInicio < franja.localStart24h || horaFin > franja.localEnd24h) {
      setError(`Violacion de limites: El horario escapa de la disponibilidad del mentor (${franja.localStart24h} - ${franja.localEnd24h}).`);
      return;
    }

    const startPayload = buildFinalDate(franja.startUTC, horaInicio);
    const endPayload = buildFinalDate(franja.startUTC, horaFin);

    setSubmitting(true);
    try {
      await apiClient('/api/sesiones/agendar', {
        method: 'POST',
        body: {
          id_contrato: selectedContrato,
          fecha_hora_inicio_utc: startPayload.toISOString(),
          fecha_hora_fin_utc: endPayload.toISOString(),
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-[#141414] border border-green-600 rounded-2xl p-10 text-center shadow-[0_0_20px_rgba(22,163,74,0.3)]">
          <h2 className="text-xl font-bold text-green-400 mb-2">Transaccion Confirmada</h2>
          <p className="text-gray-400 text-sm">Registro inyectado. Redirigiendo a tus contratos...</p>
        </div>
      </div>
    );
  }

  const selectedSlot = disponibilidades.find(d => d.id === selectedDispId);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Agendar Sesion</h1>
        
        {error && (
          <div className="mb-6 bg-red-950/50 border border-red-500 p-4 rounded-xl text-red-200 font-semibold shadow-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#141414] border border-gray-800 rounded-2xl p-8 space-y-6 shadow-xl">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Contrato Activo</label>
            <select
              value={selectedContrato}
              onChange={(e) => setSelectedContrato(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
            >
              <option value="">Selecciona una entidad de contrato</option>
              {contratos.map((c) => (
                <option key={c.id_contrato} value={c.id_contrato}>{c.paquete}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bloque Disponible (Ajustado a tu reloj local)</label>
            <select
              value={selectedDispId}
              onChange={(e) => {
                setSelectedDispId(e.target.value);
                setHoraInicio('');
                setHoraFin('');
              }}
              disabled={!selectedContrato || loadingDisp}
              className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:opacity-40 transition-all"
            >
              <option value="">Selecciona franja matriz del mentor</option>
              {disponibilidades.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.localDisplay}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hora de Entrada</label>
              <input
                type="time"
                value={horaInicio}
                min={selectedSlot?.localStart24h}
                max={selectedSlot?.localEnd24h}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={!selectedDispId}
                className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:opacity-40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Hora de Salida</label>
              <input
                type="time"
                value={horaFin}
                min={selectedSlot?.localStart24h}
                max={selectedSlot?.localEnd24h}
                onChange={(e) => setHoraFin(e.target.value)}
                disabled={!selectedDispId}
                className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-lg p-3 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:opacity-40 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full bg-red-700 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all disabled:bg-gray-800 disabled:text-gray-500 active:scale-[0.98]"
          >
            {submitting ? 'Asegurando bloqueo y persistiendo...' : 'Ejecutar Reserva'}
          </button>
        </form>
      </div>
    </div>
  );
}