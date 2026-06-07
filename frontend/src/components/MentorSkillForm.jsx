import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { Plus, CircleCheck as CheckCircle } from 'lucide-react';

export default function MentorSkillForm() {
  const [categories, setCategories] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [level, setLevel] = useState('Basico');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient('/api/skills/categories', { method: 'GET' })
      .then(data => setCategories(data))
      .catch(() => setMessage({ text: 'No se pudieron cargar las habilidades.', type: 'error' }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    if (!selectedSkill || !yearsOfExperience || !level) {
      setMessage({ text: 'Completa todos los campos.', type: 'error' });
      setIsLoading(false);
      return;
    }
    try {
      const data = await apiClient('/api/skills/mentor', {
        method: 'POST',
        body: { id_habilidad: selectedSkill, anios_experiencia: parseInt(yearsOfExperience), nivel: level }
      });
      setMessage({ text: data.detail || 'Habilidad guardada.', type: 'success' });
      setSelectedSkill('');
      setYearsOfExperience('');
      setLevel('Basico');
    } catch (error) {
      if (error.message.includes('Debe completar su perfil')) {
        navigate('/mentor/completar-perfil');
      } else {
        setMessage({ text: error.message || 'Error al guardar.', type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-5">Declarar habilidad</h2>

      {message.text && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-4 ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.type === 'success' && <CheckCircle size={14} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Habilidad</label>
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>Selecciona una habilidad</option>
            {categories.map(cat => cat.habilidades?.length > 0 && (
              <optgroup key={cat.id_categoria} label={cat.nombre_categoria}>
                {cat.habilidades.map(skill => (
                  <option key={skill.id_habilidad} value={skill.id_habilidad}>{skill.nombre_habilidad}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Años de experiencia</label>
            <input
              type="number"
              min="0"
              max="50"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              className={inputClass}
              placeholder="Ej: 3"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nivel</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
              <option value="Basico">Básico</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
              <option value="Experto">Experto</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <><Plus size={15} />Agregar habilidad</>
          )}
        </button>
      </form>
    </div>
  );
}
