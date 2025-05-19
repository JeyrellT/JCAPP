import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock,
  BarChart2,
  Building,
  ChevronRight,
  Tag,
  Folder
} from 'lucide-react';

/**
 * Componente para mostrar una tarjeta de proyecto
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.project - Datos del proyecto
 */
const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  
  // Cálculo del número de herramientas completadas
  const toolsData = project.tools ? Object.values(project.tools) : [];
  const completedToolsCount = toolsData.filter(tool => tool.status === 'completed').length;
  const totalToolsCount = toolsData.length;
  const completionPercentage = totalToolsCount > 0 
    ? Math.round((completedToolsCount / totalToolsCount) * 100) 
    : 0;
  
  // Obtener el color según el estado del proyecto
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-300',
          dot: 'bg-green-500'
        };
      case 'active':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-800 dark:text-blue-300',
          dot: 'bg-blue-500'
        };
      case 'planning':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-800 dark:text-amber-300',
          dot: 'bg-amber-500'
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          text: 'text-gray-800 dark:text-gray-300',
          dot: 'bg-gray-500'
        };
    }
  };
  
  // Get category badge color
  const getCategoryColor = (category) => {
    const colors = {
      'Calidad': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Logística': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Producción': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Servicio al Cliente': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'Finanzas': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      'Procesos': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      'TI/Sistemas': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
      'Recursos Humanos': 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      'Otros': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    return colors[category] || colors['Otros'];
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };
  
  // Obtener el texto del estado
  const getStatusText = (status) => {
    const statusMap = {
      'completed': 'Completado',
      'active': 'Activo',
      'planning': 'Planificación',
      'on_hold': 'En pausa',
      'cancelled': 'Cancelado'
    };
    
    return statusMap[status] || status;
  };
  
  // Obtener colores según estado
  const statusColors = getStatusColor(project.status);
  
  return (
    <div 
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] cursor-pointer"
    >
      {/* Barra de progreso */}
      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700">
        <div 
          className="h-full bg-primary-500 dark:bg-primary-600"
          style={{ width: `${project.progress || 0}%` }}
        ></div>
      </div>
      
      <div className="p-6">
        {/* Cabecera */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-2">
            {project.name}
          </h3>
          
          <div className={`flex items-center px-2.5 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text} text-xs font-medium`}>
            <span className={`w-2 h-2 rounded-full ${statusColors.dot} mr-1`}></span>
            {getStatusText(project.status)}
          </div>
        </div>
        
        {/* Categoría y Etiquetas */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Insignia de categoría */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(project.category)}`}>
            <Folder size={12} className="mr-1" />
            {project.category}
          </span>

          {/* Etiquetas */}
          {project.tags && project.tags.slice(0, 2).map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              <Tag size={12} className="mr-1" />
              {tag}
            </span>
          ))}
          {project.tags && project.tags.length > 2 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              +{project.tags.length - 2}
            </span>
          )}
        </div>
        
        {/* Descripción */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {project.description}
        </p>
        
        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center">
            <CheckCircle size={16} className="text-green-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {completedToolsCount}/{totalToolsCount} herramientas
            </span>
          </div>
          
          <div className="flex items-center">
            <Clock size={16} className="text-amber-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formatDate(project.startDate)}
            </span>
          </div>
          
          <div className="flex items-center">
            <BarChart2 size={16} className="text-blue-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {project.progress || 0}% completado
            </span>
          </div>
          
          <div className="flex items-center">
            <Building size={16} className="text-purple-500 mr-2" />
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
              {project.company}
            </span>
          </div>
        </div>
        
        {/* Pie de tarjeta */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/projects/${project.id}`);
            }}
            className="w-full flex items-center justify-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Ver detalles
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
