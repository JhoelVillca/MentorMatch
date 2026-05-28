      import { useState, useEffect } from 'react';
      import { useNavigate } from 'react-router-dom';
      import { apiClient } from '../services/apiClient';

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
            setMessage({ text: 'Por favor, completa todos los campos.', type: 'error' });
            setIsLoading(false);
            return;
          }

          try {
            const data = await apiClient('/api/skills/mentor', {
              method: 'POST',
              body: {
                id_habilidad: selectedSkill,
                anios_experiencia: parseInt(yearsOfExperience),
                nivel: level
              }
            });

            setMessage({ text: data.detail || 'Habilidad guardada exitosamente.', type: 'success' });
            setSelectedSkill('');
            setYearsOfExperience('');
            setLevel('Basico');
          } catch (error) {
            if (error.message.includes("Debe completar su perfil")) {
              navigate('/mentor/completar-perfil');
            } else {
              setMessage({ text: error.message || 'Error al guardar la habilidad.', type: 'error' });
            }
          } finally {
            setIsLoading(false);
          }
        };

        return (
          <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Declarar Habilidad</h2>
            
            {message.text && (
              <div className={`p-3 mb-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Habilidad</label>
                <select 
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="" disabled>Selecciona una habilidad</option>
                  {categories.map((category) => (
                    category.habilidades && category.habilidades.length > 0 && (
                      <optgroup key={category.id_categoria} label={category.nombre_categoria}>
                        {category.habilidades.map((skill) => (
                          <option key={skill.id_habilidad} value={skill.id_habilidad}>
                            {skill.nombre_habilidad}
                          </option>
                        ))}
                      </optgroup>
                    )
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Años de Experiencia</label>
                <input 
                  type="number" 
                  min="0"
                  max="50"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Dominio</label>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="Basico">Basico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Experto">Experto</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'} transition-colors duration-200`}
              >
                {isLoading ? 'Guardando...' : 'Guardar Habilidad'}
              </button>
            </form>
          </div>
        );
      }
