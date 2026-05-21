import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

function nextWeekday(targetIso) {
  const today = new Date();
  const todayIso = today.getDay() === 0 ? 7 : today.getDay();
  let diff = targetIso - todayIso;
  if (diff <= 0) diff += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
}

function buildDatetimeUTC(date, timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export default function AgendarSesion() {
  const navigate = useNavigate();

  const [contratos, setContratos] = useState([]);
  const [disponibilidades, setDisponibilidades] = useState([]);

  const [selectedContrato, setSelectedContrato] = useState('');
  const [selectedDia, setSelectedDia] = useState('');
  const [selectedDisp, setSelectedDisp] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  const [loadingContratos, setLoadingContratos] = useState(true);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [conflicto, setConflicto] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiClient('/api/contratos/me', { method: 'GET' })
      .then((data) => setContratos(data.filter((c) => c.estado === 'activo')))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingContratos(false));
  }, []);

  const contratoSeleccionado = contratos.find((c) => c.id_contrato === selectedContrato);

  useEffect(() => {
    if (!selectedContrato) return;
    setLoadingDisp(true);
    setDisponibilidades([]);
    setSelectedDia('');
    setSelectedDisp('');

    apiClient('/api/disponibilidad/', { method: 'GET' })
      .then((data) => setDisponibilidades(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingDisp(false));
  }, [selectedContrato]);

  const diasDisponibles = [...new Set(disponibilidades.map((d) => d.dia_semana))];

  const franjasDia = disponibilidades.filter((d) => d.dia_semana === selectedDia);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setConflicto(false);

    if (!selectedContrato || !selectedDisp || !horaInicio || !horaFin) {
      setError('Completa todos los campos antes de agendar.');
      return;
    }

    const franja = disponibilidades.find((d) => d.id === selectedDisp);
    if (!franja) {
      setError('Franja horaria invalida.');
      return;
    }

    const diaIso = DAYS.indexOf(franja.dia_semana) + 1;
    const fecha = nextWeekday(diaIso);

    const inicio = buildDatetimeUTC(fecha, horaInicio);
    const fin = buildDatetimeUTC(fecha, horaFin);

    if (new Date(fin) <= new Date(inicio)) {
      setError('La hora de fin debe ser posterior a la de inicio.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient('/api/sesiones/agendar', {
        method: 'POST',
        body: {
          id_contrato: selectedContrato,
          fecha_hora_inicio_utc: inicio,
          fecha_hora_fin_utc: fin,
        },
      });
      setSuccess(true);
      setTimeout(() => navigate('/mentee/contratos'), 2000);
    } catch (err) {
      if (err.message.includes('double-booking') || err.message.includes('ya tiene una sesion')) {
        setConflicto(true);
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-[#141414] border border-green-600/40 rounded-2xl p-10 text-center max-w-sm w-full">
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-white mb-2">Sesion agendada</h2>
          <p className="text-gray-400 text-sm">Redirigiendo a tus contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Agendar Sesion</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Elige tu contrato activo y un bloque horario disponible del mentor.
          </p>
        </div>

        {conflicto && (
          <div className="mb-6 bg-yellow-900/30 border border-yellow-600/50 rounded-xl p-4">
            <p className="text-yellow-300 font-semibold text-sm">Conflicto de horario detectado</p>
            <p className="text-yellow-400/80 text-xs mt-1">
              El mentor ya tiene una sesion en ese bloque. Elige otro horario.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-600/50 rounded-xl p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-[#141414] border border-red-900/30 rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-red-200 mb-2">
              Contrato activo
            </label>
            {loadingContratos ? (
              <div className="h-10 bg-[#0a0a0a] rounded-lg animate-pulse" />
            ) : contratos.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No tienes contratos activos.</p>
            ) : (
              <select
                value={selectedContrato}
                onChange={(e) => setSelectedContrato(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-600 transition-colors"
              >
                <option value="">-- Selecciona un contrato --</option>
                {contratos.map((c) => (
                  <option key={c.id_contrato} value={c.id_contrato}>
                    {c.paquete} ({c.horas_consumidas}h usadas)
                  </option>
                ))}
              </select>
            )}
            {contratoSeleccionado && (
              <p className="text-xs text-gray-500 mt-1">
                Horas consumidas: {contratoSeleccionado.horas_consumidas}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-red-200 mb-2">
              Dia disponible
            </label>
            {loadingDisp ? (
              <div className="h-10 bg-[#0a0a0a] rounded-lg animate-pulse" />
            ) : (
              <select
                value={selectedDia}
                onChange={(e) => {
                  setSelectedDia(e.target.value);
                  setSelectedDisp('');
                  setHoraInicio('');
                  setHoraFin('');
                }}
                disabled={!selectedContrato || diasDisponibles.length === 0}
                className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-600 transition-colors disabled:opacity-40"
              >
                <option value="">-- Selecciona un dia --</option>
                {diasDisponibles.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-red-200 mb-2">
              Franja horaria del mentor
            </label>
            <select
              value={selectedDisp}
              onChange={(e) => setSelectedDisp(e.target.value)}
              disabled={!selectedDia}
              className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-600 transition-colors disabled:opacity-40"
            >
              <option value="">-- Selecciona una franja --</option>
              {franjasDia.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.hora_inicio} — {f.hora_fin}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-red-200 mb-2">
                Hora inicio (UTC)
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={!selectedDisp}
                className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-600 transition-colors disabled:opacity-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-red-200 mb-2">
                Hora fin (UTC)
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                disabled={!selectedDisp}
                className="w-full bg-[#0a0a0a] border border-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-red-600 transition-colors disabled:opacity-40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || contratos.length === 0}
            className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all active:scale-95"
          >
            {submitting ? 'Agendando...' : 'Confirmar Sesion'}
          </button>
        </form>
      </div>
    </div>
  );
}