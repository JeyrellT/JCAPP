import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Save, 
  X, 
  Trash2, 
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';

/**
 * Formulario para gestionar miembros del equipo
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 * @param {Function} props.onClose - Función a llamar al cerrar
 * @param {Function} props.onSave - Función a llamar después de guardar
 */
const TeamMemberForm = ({ projectId, onClose, onSave }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Nuevo miembro
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: ''
  });
  
  // Roles comunes para autocompletar
  const commonRoles = [
    'Líder del Proyecto',
    'Patrocinador',
    'Black Belt',
    'Green Belt',
    'Analista de Datos',
    'Stakeholder',
    'Experto en Procesos',
    'Representante de Operaciones',
    'Ingeniero de Calidad'
  ];
  
  // Cargar datos del proyecto
  useEffect(() => {
    const project = getProject(projectId);
    if (project) {
      setProjectData(project);
      setTeamMembers(project.team || []);
    }
    setIsLoading(false);
  }, [projectId, getProject]);
  
  // Función para añadir un nuevo miembro
  const handleAddMember = () => {
    if (!newMember.name.trim() || !newMember.role.trim()) {
      return;
    }
    
    const memberWithId = {
      ...newMember,
      id: `team-${Date.now()}`
    };
    
    setTeamMembers([...teamMembers, memberWithId]);
    
    // Limpiar formulario
    setNewMember({
      name: '',
      role: '',
      email: ''
    });
  };
  
  // Función para eliminar un miembro
  const handleRemoveMember = (id) => {
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };
  
  // Función para actualizar un miembro existente
  const handleUpdateMember = (id, field, value) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));
  };
  
  // Función para guardar cambios
  const handleSave = () => {
    if (!projectData) return;
    
    setIsSaving(true);
    
    // Actualizar proyecto con los miembros del equipo
    updateProject(projectId, {
      team: teamMembers,
      updatedAt: new Date().toISOString()
    });
    
    // Simular tiempo de guardado
    setTimeout(() => {
      setIsSaving(false);
      if (onSave) onSave(teamMembers);
      if (onClose) onClose();
    }, 800);
  };
  
  // Variantes para animaciones
  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw size={24} className="text-blue-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden max-w-4xl w-full"
    >
      {/* Cabecera */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
          <Users size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
          Gestionar Equipo del Proyecto
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Contenido */}
      <div className="p-6">
        {/* Formulario para añadir miembro */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Añadir Nuevo Miembro
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({...newMember, name: e.target.value})}
              placeholder="Nombre o Cargo"
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            
            <div className="relative">
              <input
                type="text"
                value={newMember.role}
                onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                placeholder="Rol en el Proyecto"
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
                list="rolesList"
              />
              <datalist id="rolesList">
                {commonRoles.map((role, index) => (
                  <option key={index} value={role} />
                ))}
              </datalist>
            </div>
            
            <input
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({...newMember, email: e.target.value})}
              placeholder="Email (opcional)"
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            type="button"
            onClick={handleAddMember}
            disabled={!newMember.name.trim() || !newMember.role.trim()}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md flex justify-center items-center text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus size={16} className="mr-1.5" /> Añadir Miembro
          </button>
        </div>
        
        {/* Lista de miembros */}
        {teamMembers.length > 0 ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {teamMembers.map(member => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                        className="w-full border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1 text-gray-800 dark:text-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}
                        className="w-full border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1 text-gray-800 dark:text-gray-200"
                        list="rolesList"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={member.email || ''}
                        onChange={(e) => handleUpdateMember(member.id, 'email', e.target.value)}
                        className="w-full border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-2 py-1 text-gray-800 dark:text-gray-200"
                        placeholder="Sin email"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center text-center">
            <Users size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay miembros en el equipo
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Usa el formulario de arriba para añadir miembros al equipo
            </p>
          </div>
        )}
      </div>
      
      {/* Pie */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {teamMembers.length} miembro(s) en el equipo
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
    </motion.div>
  );
};

export default TeamMemberForm;
