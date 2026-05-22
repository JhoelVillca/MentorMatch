import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

const API_URL = '/api/disponibilidad/';

const DAYS_OF_WEEK = [
  'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'
];

const MentorAvailabilityPanel = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [day, setDay] = useState('Lunes');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAvailabilities = async () => {
    setLoading(true);
    try {
      const data = await apiClient(API_URL);
      setAvailabilities(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        setLoading(true);
      }
      try {
        const data = await apiClient(API_URL);
        if (isMounted) {
          setAvailabilities(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (startTime >= endTime) {
      setError('La hora de fin debe ser posterior a la de inicio.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient(API_URL, {
        method: 'POST',
        body: { dia_semana: day, hora_inicio: startTime, hora_fin: endTime }
      });

      setStartTime('');
      setEndTime('');
      setDay('Lunes');
      setError(null);
      fetchAvailabilities();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este horario?')) return;
    
    try {
      await apiClient(`${API_URL}${id}`, { method: 'DELETE' });
      setAvailabilities(availabilities.filter(av => av.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        Configuracion de Disponibilidad
      </h2>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleAddSchedule} className="bg-gray-50 p-5 rounded-xl mb-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Dia</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-black"
            >
              {DAYS_OF_WEEK.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Hora Inicio</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-black"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">Hora Fin</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-black"
            />
          </div>

          <div className="flex flex-col">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Anadir Horario'}
            </button>
          </div>
        </div>
      </form>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Horarios Guardados</h3>
        {loading ? (
          <p className="text-gray-500 text-center py-4 animate-pulse">Cargando...</p>
        ) : availabilities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No tienes horarios configurados aun.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availabilities.map((av) => (
              <div 
                key={av.id} 
                className="group bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-bold text-gray-800">{av.dia_semana}</p>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {av.hora_inicio} - {av.hora_fin}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(av.id)}
                  className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Eliminar horario"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorAvailabilityPanel;