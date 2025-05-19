import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Save, 
  X, 
  Calendar, 
  Building, 
  Users, 
  ChevronDown, 
  Plus, 
  Trash2,
  HelpCircle,
  Tag
} from 'lucide-react';
import Select from 'react-select';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';

// Lista de categorías de proyectos
const PROJECT_CATEGORIES = [
  'Calidad',
  'Logística',
  'Producción',
  'Servicio al Cliente',
  'Finanzas',
  'Procesos',
  'TI/Sistemas',
  'Recursos Humanos',
  'Otros'
];

// Constantes de validación
const VALIDATION_RULES = {
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  COMPANY_MAX_LENGTH: 100,
  MAX_TAGS: 10,
  TAG_MAX_LENGTH: 30
};

const NewProjectForm = () => {
  const navigate = useNavigate();
  const { addProject } = useLeanSixSigma();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    category: 'Calidad',
    tags: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    company: '',
    team: [],
    tools: {},
    configuration: {
      budget: {},
      customFields: {}
    }
  });
  
  // Options for project tags
  const [availableTags, setAvailableTags] = useState([
    { value: 'mejora-continua', label: 'Mejora Continua' },
    { value: 'reduccion-costos', label: 'Reducción de Costos' },
    { value: 'eficiencia', label: 'Eficiencia' },
    { value: 'calidad', label: 'Calidad' },
    { value: 'automatizacion', label: 'Automatización' },
    { value: 'optimizacion', label: 'Optimización' },
    { value: 'lean', label: 'Lean' },
    { value: 'six-sigma', label: 'Six Sigma' }
  ]);
  
  const [teamMember, setTeamMember] = useState({
    name: '',
    role: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Función para manejar cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Función para validar el formulario
  const validateForm = () => {
    const newErrors = {};
    
    // Validación del nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es requerido';
    } else if (formData.name.length > VALIDATION_RULES.NAME_MAX_LENGTH) {
      newErrors.name = `El nombre no puede exceder ${VALIDATION_RULES.NAME_MAX_LENGTH} caracteres`;
    }
    
    // Validación de la descripción
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length > VALIDATION_RULES.DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `La descripción no puede exceder ${VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} caracteres`;
    }
    
    // Validación de la categoría
    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    } else if (!PROJECT_CATEGORIES.includes(formData.category)) {
      newErrors.category = 'Selecciona una categoría válida';
    }
    
    // Validación de etiquetas
    if (formData.tags.length > VALIDATION_RULES.MAX_TAGS) {
      newErrors.tags = `No puedes agregar más de ${VALIDATION_RULES.MAX_TAGS} etiquetas`;
    }
    if (formData.tags.some(tag => tag.length > VALIDATION_RULES.TAG_MAX_LENGTH)) {
      newErrors.tags = `Cada etiqueta no puede exceder ${VALIDATION_RULES.TAG_MAX_LENGTH} caracteres`;
    }
    
    // Validación de fechas
    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }
    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    // Validación de la empresa
    if (!formData.company.trim()) {
      newErrors.company = 'La empresa es requerida';
    } else if (formData.company.length > VALIDATION_RULES.COMPANY_MAX_LENGTH) {
      newErrors.company = `El nombre de la empresa no puede exceder ${VALIDATION_RULES.COMPANY_MAX_LENGTH} caracteres`;
    }
    
    // Validación del equipo
    formData.team.forEach((member, index) => {
      if (!member.name.trim() || !member.role.trim()) {
        newErrors[`team_${index}`] = 'Nombre y rol son requeridos para cada miembro del equipo';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validación de miembro del equipo antes de añadir
  const validateTeamMember = (member) => {
    if (!member.name.trim()) {
      return 'El nombre del miembro es requerido';
    }
    if (!member.role.trim()) {
      return 'El rol del miembro es requerido';
    }
    return null;
  };
  
  // Función para añadir un miembro al equipo
  const addTeamMember = () => {
    const validationError = validateTeamMember(teamMember);
    if (validationError) {
      setErrors(prev => ({
        ...prev,
        teamMember: validationError
      }));
      return;
    }
    
    const newMember = {
      id: `team-${Date.now()}`,
      name: teamMember.name.trim(),
      role: teamMember.role.trim()
    };
    
    setFormData(prev => ({
      ...prev,
      team: [...prev.team, newMember]
    }));
    
    setTeamMember({
      name: '',
      role: ''
    });
    
    // Limpiar error si existe
    if (errors.teamMember) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.teamMember;
        return newErrors;
      });
    }
  };
  
  // Función para eliminar un miembro del equipo
  const removeTeamMember = (id) => {
    setFormData(prev => ({
      ...prev,
      team: prev.team.filter(member => member.id !== id)
    }));
  };
  
  // Función para enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newProject = await addProject({
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Redirigir al detalle del proyecto
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden"
    >
      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        {/* Cabecera */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Nuevo Proyecto Lean Six Sigma
            </h2>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md flex items-center text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                <X size={16} className="mr-1.5" /> Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1.5" /> Guardar Proyecto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Contenido del formulario */}
        <div className="p-6 space-y-6">
          {/* Información básica */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del Proyecto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Nombre del proyecto"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full border ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  >
                    <option value="">Seleccionar categoría</option>
                    {PROJECT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Etiquetas
                </label>
                <Select
                  isMulti
                  name="tags"
                  options={availableTags}
                  value={formData.tags.map(tag => availableTags.find(t => t.value === tag) || { value: tag, label: tag })}
                  onChange={(selectedOptions) => {
                    const selectedTags = selectedOptions ? selectedOptions.map(option => option.value) : [];
                    setFormData(prev => ({...prev, tags: selectedTags}));
                  }}
                  placeholder="Selecciona o crea etiquetas..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: 'var(--bg-input, white)',
                      borderColor: state.isFocused ? 'var(--border-focus, #3B82F6)' : 'var(--border-input, #D1D5DB)',
                      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                      ':hover': {
                        borderColor: 'var(--border-focus, #3B82F6)'
                      }
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? 'var(--bg-selected, #3B82F6)'
                        : state.isFocused
                        ? 'var(--bg-hover, #EFF6FF)'
                        : 'transparent',
                      color: state.isSelected ? 'white' : 'var(--text-primary, #1F2937)'
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: 'var(--bg-tag, #E5E7EB)'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: 'var(--text-tag, #374151)'
                    })
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Describe el objetivo y alcance del proyecto..."
                ></textarea>
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Fechas y empresa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Inicio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full border ${errors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Fin Estimada
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Empresa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`w-full border ${errors.company ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md pl-10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="Nombre de la empresa"
                />
                <Building className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
              {errors.company && (
                <p className="mt-1 text-sm text-red-500">{errors.company}</p>
              )}
            </div>
          </div>

          {/* Equipo del proyecto */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center">
              Equipo del Proyecto
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                (Opcional)
              </span>
            </h3>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={teamMember.name}
                  onChange={(e) => setTeamMember({...teamMember, name: e.target.value})}
                  placeholder="Nombre o Cargo"
                  className={`border ${errors.teamMember ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
                <input
                  type="text"
                  value={teamMember.role}
                  onChange={(e) => setTeamMember({...teamMember, role: e.target.value})}
                  placeholder="Rol en el Proyecto"
                  className={`border ${errors.teamMember ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
              {errors.teamMember && (
                <p className="mt-1 mb-3 text-sm text-red-500">{errors.teamMember}</p>
              )}
              <button
                type="button"
                onClick={addTeamMember}
                disabled={!teamMember.name.trim() || !teamMember.role.trim()}
                className="w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex justify-center items-center text-sm hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} className="mr-1.5" /> Añadir Miembro
              </button>
            </div>

            {formData.team.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nombre/Cargo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.team.map((member, index) => (
                      <tr key={member.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                          {member.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                          {member.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => removeTeamMember(member.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {Object.keys(errors).some(key => key.startsWith('team_')) && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Hay errores en algunos miembros del equipo. Por favor verifica que todos tengan nombre y rol.
                    </p>
                  </div>
                )}
              </div>
            )}

            {formData.team.length === 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <Users size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  Aún no hay miembros en el equipo
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Puedes añadir a los integrantes del equipo ahora o más tarde
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-start">
            <HelpCircle size={20} className="text-blue-500 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">
                Después de crear el proyecto podrás:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Añadir herramientas Lean Six Sigma al proyecto</li>
                <li>Asignar tareas a los miembros del equipo</li>
                <li>Actualizar el progreso del proyecto</li>
                <li>Generar reportes y análisis</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default NewProjectForm;
