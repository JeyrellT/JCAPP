import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Activity,
  BarChart,
  Layers,
  Award,
  ArrowLeft,
  Menu,
  ChevronRight,
  DollarSign,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import tools from '../../data/tools'; // Import the centralized tools catalog

/**
 * Componente de navegación entre herramientas de Lean Six Sigma
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.currentTool - El nombre de la herramienta actual
 * @param {string} props.projectId - ID del proyecto actual
 */
const ToolsNavigation = ({ currentTool, projectId }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar herramientas comunes para la navegación
  const navigationTools = [
    { 
      id: 'cause-effect-diagram', 
      name: 'Diagrama Causa-Efecto', 
      path: `/projects/${projectId}/tools/cause-effect-diagram`,
      icon: GitBranch,
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      id: 'control-chart', 
      name: 'Gráfico de Control', 
      path: `/projects/${projectId}/tools/control-chart`,
      icon: Activity,
      color: 'from-green-500 to-teal-600'
    },
    { 
      id: 'pareto-chart', 
      name: 'Diagrama de Pareto', 
      path: `/projects/${projectId}/tools/pareto-chart`,
      icon: BarChart,
      color: 'from-orange-500 to-amber-600'
    },
    { 
      id: 'five-s', 
      name: '5S', 
      path: `/projects/${projectId}/tools/five-s`,
      icon: Layers,
      color: 'from-purple-500 to-pink-600'
    },
    { 
      id: 'roi-calculator', 
      name: 'Calculadora de ROI', 
      path: `/projects/${projectId}/tools/roi-calculator`,
      icon: DollarSign,
      color: 'from-yellow-500 to-amber-600'
    },
    { 
      id: 'project-timeline', 
      name: 'Timeline / Gantt', 
      path: `/projects/${projectId}/tools/project-timeline`,
      icon: Calendar,
      color: 'from-cyan-500 to-blue-600'
    }
  ];

  // Encontrar índice de la herramienta actual
  const currentIndex = navigationTools.findIndex(tool => tool.id === currentTool);
  
  // Encontrar herramientas anterior y siguiente
  const prevTool = currentIndex > 0 ? navigationTools[currentIndex - 1] : null;
  const nextTool = currentIndex < navigationTools.length - 1 ? navigationTools[currentIndex + 1] : null;

  // Función para navegar a una herramienta
  const navigateToTool = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  // Navegar de vuelta a la página de detalles del proyecto
  const navigateToProject = () => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <>
      {/* Navegación flotante */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center p-1">
          {/* Botón para volver al proyecto */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={navigateToProject}
            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full"
            title="Volver al proyecto"
          >
            <ArrowLeft size={20} />
          </motion.button>
          
          {/* Botón para mostrar/ocultar menú de herramientas */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="ml-2 bg-blue-500 text-white p-2 rounded-full flex items-center"
          >
            <Menu size={20} />
            <span className="ml-2 mr-2">Herramientas</span>
          </motion.button>
          
          {/* Navegación rápida a herramienta anterior */}
          {prevTool && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateToTool(prevTool.path)}
              className="mx-1 p-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full flex items-center shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600"
              title={`Anterior: ${prevTool.name}`}
            >
              <prevTool.icon size={18} className="mr-1" />
              <span className="text-xs hidden sm:inline">{prevTool.name}</span>
            </motion.button>
          )}
          
          {/* Navegación rápida a herramienta siguiente */}
          {nextTool && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateToTool(nextTool.path)}
              className="ml-1 p-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full flex items-center shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600"
              title={`Siguiente: ${nextTool.name}`}
            >
              <span className="text-xs hidden sm:inline">{nextTool.name}</span>
              <nextTool.icon size={18} className="ml-1" />
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Menú completo de herramientas */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                  <Award className="mr-2" size={22} />
                  Herramientas Lean Six Sigma
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3 mt-2">
                {navigationTools.map(tool => (
                  <motion.button
                    key={tool.id}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateToTool(tool.path)}
                    className={`p-3 rounded-lg flex items-center justify-between text-left transition-all
                      ${tool.id === currentTool 
                        ? `bg-gradient-to-r ${tool.color} text-white font-medium shadow-md` 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${tool.id === currentTool ? 'bg-white bg-opacity-20' : 'bg-white dark:bg-gray-800'}`}>
                        <tool.icon size={18} className={tool.id === currentTool ? 'text-white' : 'text-blue-500 dark:text-blue-400'} />
                      </div>
                      <span>{tool.name}</span>
                    </div>
                    {tool.id === currentTool ? (
                      <span className="bg-white bg-opacity-20 text-xs py-1 px-2 rounded">Actual</span>
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </motion.button>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={navigateToProject}
                  className="text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto hover:underline"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Volver al proyecto
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ToolsNavigation;
