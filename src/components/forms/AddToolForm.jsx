import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  X, 
  Search, 
  Filter, 
  CheckCircle2, 
  ChevronDown,
  Info
} from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';

/**
 * Formulario para añadir herramientas a un proyecto
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 * @param {Function} props.onClose - Función a llamar al cerrar
 * @param {Function} props.onToolAdded - Función a llamar cuando se añade una herramienta
 */
const AddToolForm = ({ projectId, onClose, onToolAdded }) => {
  const { getProject, tools, updateProject } = useLeanSixSigma();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState(null);
  const [selectedTools, setSelectedTools] = useState([]);
  
  // Fases DMAIC
  const phases = [
    { id: 'define', name: 'Define' },
    { id: 'measure', name: 'Measure' },
    { id: 'analyze', name: 'Analyze' },
    { id: 'improve', name: 'Improve' },
    { id: 'control', name: 'Control' }
  ];
  
  // Cargar proyecto
  useEffect(() => {
    const projectData = getProject(projectId);
    if (projectData) {
      setProject(projectData);
    }
  }, [projectId, getProject]);
  
  // Filtrar herramientas
  const filteredTools = tools.filter(tool => {
    // Filtrar por fase
    if (selectedPhase !== 'all' && tool.phase.toLowerCase() !== selectedPhase) {
      return false;
    }
    
    // Filtrar por búsqueda
    if (searchTerm && !tool.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !tool.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Verificar si la herramienta ya está en el proyecto
    const isInProject = project?.tools && project.tools[tool.id];
    return !isInProject;
  });
  
  // Manejar cambio en la selección
  const handleToolSelect = (toolId) => {
    setSelectedTools(prev => {
      if (prev.includes(toolId)) {
        return prev.filter(id => id !== toolId);
      } else {
        return [...prev, toolId];
      }
    });
  };
  
  // Añadir herramientas seleccionadas al proyecto
  const handleAddTools = () => {
    if (!project || selectedTools.length === 0) return;
    
    setIsSubmitting(true);
    
    // Preparar objeto de herramientas actualizadas
    const updatedTools = { ...project.tools };
    
    // Añadir nuevas herramientas
    selectedTools.forEach(toolId => {
      updatedTools[toolId] = { 
        status: 'not_started',
        updatedAt: new Date().toISOString()
      };
    });
    
    // Actualizar proyecto
    updateProject(projectId, {
      tools: updatedTools,
      updatedAt: new Date().toISOString()
    });
    
    // Notificar que se han añadido herramientas
    setTimeout(() => {
      setIsSubmitting(false);
      if (onToolAdded) onToolAdded(selectedTools);
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
          <Plus size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
          Añadir Herramientas al Proyecto
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Filtros */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar herramientas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <div className="flex items-center">
            <Filter size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Fase:</span>
            <div className="relative">
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todas</option>
                {phases.map(phase => (
                  <option key={phase.id} value={phase.id.toLowerCase()}>
                    {phase.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Lista de herramientas */}
      <div className="overflow-y-auto max-h-96 p-6">
        {filteredTools.length === 0 ? (
          <div className="text-center py-8">
            <Info size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              No se encontraron herramientas disponibles
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Prueba con otros criterios de búsqueda o fase
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTools.map(tool => (
              <div
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={`border ${selectedTools.includes(tool.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-4 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors relative`}
              >
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${selectedTools.includes(tool.id) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {selectedTools.includes(tool.id) ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <tool.icon size={16} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {tool.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs py-1 px-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    {tool.phase}
                  </span>
                  {selectedTools.includes(tool.id) && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Seleccionada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Pie */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedTools.length} herramienta(s) seleccionada(s)
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddTools}
            disabled={selectedTools.length === 0 || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Añadiendo...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-1.5" /> Añadir Herramientas
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default AddToolForm;
