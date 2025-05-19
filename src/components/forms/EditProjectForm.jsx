import { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Calendar, 
  Building, 
  Users, 
  ChevronDown, 
  Plus, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';

/**
 * Formulario para editar un proyecto existente
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto a editar
 * @param {Function} props.onCancel - Función a llamar al cancelar
 * @param {Function} props.onSave - Función a llamar después de guardar
 */
const VALIDATION_RULES = {
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  COMPANY_MAX_LENGTH: 100,
  MAX_TAGS: 10,
  TAG_MAX_LENGTH: 30
};

const EditProjectForm = ({ projectId, onCancel, onSave }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    startDate: '',
    endDate: '',
    company: '',
    team: [],
    phase: 'Define'
  });
  
  // Estado para nuevo miembro del equipo
  const [teamMember, setTeamMember] = useState({
    name: '',
    role: ''
  });
  
  // Cargar datos del proyecto
  useEffect(() => {
    const project = getProject(projectId);
    
    if (project) {
      // Formatear fechas para el formato de input date
      const formattedStartDate = project.startDate ? project.startDate.split('T')[0] : '';
      const formattedEndDate = project.endDate ? project.endDate.split('T')[0] : '';
      
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        company: project.company || '',
        team: project.team || [],
        phase: project.phase || 'Define'
      });
    }
    
    setIsLoading(false);
  }, [projectId, getProject]);
  
  // Función para manejar cambios en los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar error cuando se modifica un campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
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
    
    setFormData({
      ...formData,
      team: [...formData.team, newMember]
    });
    
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
    setFormData({
      ...formData,
      team: formData.team.filter(member => member.id !== id)
    });
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
    
    // Validación de la categoría si existe en el modelo de datos
    if (formData.category !== undefined) {
      if (!formData.category) {
        newErrors.category = 'La categoría es requerida';
      } else if (!PROJECT_CATEGORIES.includes(formData.category)) {
        newErrors.category = 'Selecciona una categoría válida';
      }
    }
    
    // Validación de etiquetas si existen en el modelo de datos
    if (formData.tags) {
      if (formData.tags.length > VALIDATION_RULES.MAX_TAGS) {
        newErrors.tags = `No puedes agregar más de ${VALIDATION_RULES.MAX_TAGS} etiquetas`;
      }
      if (formData.tags.some(tag => tag.length > VALIDATION_RULES.TAG_MAX_LENGTH)) {
        newErrors.tags = `Cada etiqueta no puede exceder ${VALIDATION_RULES.TAG_MAX_LENGTH} caracteres`;
      }
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
  
  // Función para enviar el formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Actualizar proyecto
      updateProject(projectId, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      // Notificar que se ha guardado correctamente
      setTimeout(() => {
        setIsSaving(false);
        if (onSave) onSave();
      }, 800);
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      setIsSaving(false);
    }
  };
  
  // Si está cargando, mostrar spinner
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw size={24} className="text-blue-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden"
    >
      <form onSubmit={handleSubmit}>
        {/* Cabecera del formulario */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Editar Proyecto
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md flex items-center text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              <X size={16} className="mr-1.5" /> Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md flex items-center text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-1.5" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Contenido del formulario */}
        <div className="p-6 grid grid-cols-1 gap-6">
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
                  Estado
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="active">Activo</option>
                    <option value="planning">Planificación</option>
                    <option value="on_hold">En Espera</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fase DMAIC
                </label>
                <div className="relative">
                  <select
                    name="phase"
                    value={formData.phase}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Define">Define</option>
                    <option value="Measure">Measure</option>
                    <option value="Analyze">Analyze</option>
                    <option value="Improve">Improve</option>
                    <option value="Control">Control</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Equipo */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Equipo del Proyecto
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
                    {formData.team.map(member => (
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
                  Puedes añadir a los integrantes del equipo usando el formulario de arriba
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default EditProjectForm;
