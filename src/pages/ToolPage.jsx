import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Info,
  Save,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Share2,
  Download,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import GradientButton from '../components/common/GradientButton';

// Importar componentes de herramientas
import ProjectCharter from '../tools/ProjectCharter';
import SipocViewer from '../tools/SipocViewer';
import VocVisualizer from '../tools/VocVisualizer';
import CtqDashboard from '../tools/CtqDashboard';
import ValueStreamMap from '../tools/ValueStreamMap';
import StakeholderAnalysis from '../tools/StakeholderAnalysis';
import PriorizationMatrix from '../tools/PriorizationMatrix';
import CauseEffectDiagram from '../tools/CauseEffectDiagram';
import ParetoChart from '../tools/ParetoChart';
import FmeaAnalysis from '../tools/FmeaAnalysis';
import ControlChart from '../tools/ControlChart';
import FiveS from '../tools/FiveS';
import RoiCalculator from '../tools/RoiCalculator';
import ProjectTimeline from '../tools/ProjectTimeline';

const ToolPage = () => {
  const { projectId, toolId } = useParams();
  const navigate = useNavigate();
  const { getProject, getTool, updateToolStatus } = useLeanSixSigma();
  
  // Estados
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Obtener proyecto y herramienta
  const project = getProject(projectId);
  const tool = getTool(toolId);
  
  // Verificar si la herramienta existe en el proyecto
  const toolInProject = project?.tools?.[toolId];
  
  // Redirigir si no existe el proyecto o la herramienta
  useEffect(() => {
    if (!project || !tool) {
      navigate('/projects');
      return;
    }
    
    // Simulación de carga
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [project, tool, navigate]);
  
  // Si el proyecto o la herramienta no existe, no renderizar nada
  if (!project || !tool) {
    return null;
  }
  
  // Función para actualizar el estado de la herramienta
  const handleToolStatusChange = (status) => {
    updateToolStatus(projectId, toolId, status);
  };
  
  // Función para renderizar el componente de la herramienta
  const renderToolComponent = () => {
    switch (tool.component) {
      case 'ProjectCharter':
        return <ProjectCharter projectId={projectId} />;
      case 'SipocViewer':
        return <SipocViewer projectId={projectId} />;
      case 'VocVisualizer':
        return <VocVisualizer projectId={projectId} />;
      case 'CtqDashboard':
        return <CtqDashboard projectId={projectId} />;
      case 'ValueStreamMap':
        return <ValueStreamMap projectId={projectId} />;
      case 'StakeholderAnalysis':
        return <StakeholderAnalysis projectId={projectId} />;
      case 'PriorizationMatrix':
        return <PriorizationMatrix projectId={projectId} />;
      case 'CauseEffectDiagram':
        return <CauseEffectDiagram projectId={projectId} />;
      case 'ParetoChart':
        return <ParetoChart projectId={projectId} />;
      case 'FmeaAnalysis':
        return <FmeaAnalysis projectId={projectId} />;
      case 'ControlChart':
        return <ControlChart projectId={projectId} />;
      case 'FiveS':
        return <FiveS projectId={projectId} />;
      case 'RoiCalculator':
        return <RoiCalculator projectId={projectId} />;
      case 'ProjectTimeline':
        return <ProjectTimeline projectId={projectId} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-4">
              <XCircle size={32} className="text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Componente no implementado
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              El componente para esta herramienta aún no está implementado.
              Estamos trabajando en ello.
            </p>
          </div>
        );
    }
  };
  
  // Obtener estado de la herramienta
  const toolStatus = toolInProject?.status || 'not_started';
  
  // Función para obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'not_started':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };
  
  // Función para obtener texto según estado
  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En Progreso';
      case 'not_started':
        return 'No Iniciada';
      default:
        return status;
    }
  };
  
  // Función para obtener icono según estado
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'not_started':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };
  
  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 p-0 bg-gray-100 dark:bg-gray-900' : ''}`}
    >
      {/* Cabecera */}
      <motion.div 
        variants={itemVariants} 
        className={`${isFullscreen ? 'p-4 bg-white dark:bg-gray-800 shadow-md' : 'mb-6'} flex justify-between items-center`}
      >
        <div className="flex items-center">
          <Link 
            to={`/projects/${projectId}`} 
            className="mr-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{tool.name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{project.name}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(toolStatus)}`}>
            <span>{getStatusIcon(toolStatus)}</span>
            <span>{getStatusText(toolStatus)}</span>
          </span>
          
          <button
            onClick={() => setIsInfoVisible(!isInfoVisible)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            title="Información"
          >
            <Info size={18} />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              title="Más opciones"
            >
              <MoreHorizontal size={18} />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsEditing(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Edit size={16} className="mr-2" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    // Aquí iría la lógica para compartir
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Share2 size={16} className="mr-2" />
                  Compartir
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    // Aquí iría la lógica para descargar
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  Descargar
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Panel de información */}
      {isInfoVisible && (
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6"
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">{tool.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{tool.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fase DMAIC</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tool.phase}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tool.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dificultad</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tool.difficulty}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <select
                value={toolStatus}
                onChange={(e) => handleToolStatusChange(e.target.value)}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="not_started">No Iniciada</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completada</option>
              </select>
              
              <GradientButton 
                size="sm" 
                className="whitespace-nowrap"
                onClick={() => {
                  // Aquí iría la lógica para guardar cambios
                }}
              >
                <Save size={14} className="mr-1" /> Guardar
              </GradientButton>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Contenedor de la herramienta */}
      <motion.div 
        variants={itemVariants}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${isFullscreen ? 'flex-1' : ''}`}
      >
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="animate-spin mb-4">
              <RefreshCw size={32} className="text-primary-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Cargando herramienta...</p>
          </div>
        ) : (
          <div className={`${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[calc(80vh-120px)]'} overflow-auto`}>
            {renderToolComponent()}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ToolPage;
