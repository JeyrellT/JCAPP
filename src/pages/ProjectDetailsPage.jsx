import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Archive,
  Users,
  Calendar,
  BarChart2,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import GradientButton from '../components/common/GradientButton';
import ToolRecommendation from '../components/common/ToolRecommendation';
import ProjectDetails from '../components/common/ProjectDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import PageLayout from '../components/layout/PageLayout';

const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProject, getProjectToolsByPhase, tools, updateToolStatus } = useLeanSixSigma();
  
  // Obtener proyecto y herramientas por fase
  const project = getProject(projectId);
  const toolsByPhase = getProjectToolsByPhase(projectId);
  
  // Estado para modales y edición
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  
  // Redirigir si el proyecto no existe
  useEffect(() => {
    if (!project) {
      navigate('/projects');
    }
  }, [project, navigate]);
  
  // Si el proyecto no existe, no renderizar nada
  if (!project) {
    return null;
  }
  
  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Función para obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'active':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'planning':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
      case 'on_hold':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300';
    }
  };
  
  // Función para obtener texto de estado
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
  
  // Función para obtener icono según estado
  const getStatusIcon = (status, size = 16) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={size} className="text-green-500" />;
      case 'active':
        return <Clock size={size} className="text-blue-500" />;
      case 'planning':
        return <Clock size={size} className="text-amber-500" />;
      case 'on_hold':
        return <AlertTriangle size={size} className="text-orange-500" />;
      case 'cancelled':
        return <XCircle size={size} className="text-red-500" />;
      default:
        return <Clock size={size} className="text-gray-500" />;
    }
  };
  
  // Función para obtener texto de fase
  const getPhaseText = (phase) => {
    const phaseMap = {
      'Define': 'Definir',
      'Measure': 'Medir',
      'Analyze': 'Analizar',
      'Improve': 'Mejorar',
      'Control': 'Controlar'
    };
    
    return phaseMap[phase] || phase;
  };
  
  // Función para actualizar el estado de una herramienta
  const handleToolStatusChange = (toolId, status) => {
    updateToolStatus(projectId, toolId, status);
  };
  
  // Obtener la lista de miembros del equipo
  const teamMembers = project.team || [];
  
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
  
  // Función para obtener el icono de una herramienta
  const getToolIcon = (iconName) => {
    // Este es un placeholder, deberías implementar una lógica similar
    // a la que utilizaste en el componente Sidebar
    return <Settings size={18} />;
  };
  
  // Función para obtener el color del estatus de una herramienta
  const getToolStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'not_started':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };
  
  // Función para obtener el texto del estatus de una herramienta
  const getToolStatusText = (status) => {
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
  
  return (
    <PageLayout title="Detalles del Proyecto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Cabecera */}
        <motion.div variants={itemVariants} className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <Link 
              to="/projects" 
              className="mr-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{project.name}</h1>
                <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <GradientButton
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="flex items-center"
            >
              <Edit size={16} className="mr-2" /> Editar
            </GradientButton>
            
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <Trash2 size={16} className="mr-2" /> Eliminar
            </button>
          </div>
        </motion.div>
        
        {/* Tabs de navegación */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Información
            </button>
            
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'tools'
                  ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Herramientas
            </button>
            
            <button
              onClick={() => setActiveTab('team')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'team'
                  ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Equipo
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Configuración
            </button>
          </div>
          
          {/* Contenido de la pestaña activa */}
          <div className="p-6">
            {/* Pestaña de Información */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Detalles del Proyecto</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Calendar size={18} className="text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fechas</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Inicio: {formatDate(project.startDate)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Fin: {formatDate(project.endDate)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <BarChart2 size={18} className="text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Fase DMAIC</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getPhaseText(project.phase)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Archive size={18} className="text-gray-500 mr-3 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {project.company || 'No especificada'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Progreso</p>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div 
                        className="h-full rounded-full bg-primary-500"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-right text-xs mt-1 text-gray-600 dark:text-gray-400">
                      {project.progress || 0}% completado
                    </p>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Resumen de Herramientas</h2>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    {Object.entries(toolsByPhase).map(([phase, phaseTools]) => {
                      // Calcular progreso para esta fase
                      const completedTools = phaseTools.filter(tool => tool.status === 'completed').length;
                      const phaseProgress = phaseTools.length > 0 
                        ? Math.round((completedTools / phaseTools.length) * 100) 
                        : 0;
                      
                      return (
                        <div key={phase} className="mb-4 last:mb-0">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{phase}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{completedTools}/{phaseTools.length}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${phaseProgress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Actividad Reciente</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mr-3">
                          <CheckCircle size={14} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">Herramienta SIPOC completada</p>
                          <p className="text-xs text-gray-500">Hace 2 días</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 mr-3">
                          <Edit size={14} />
                        </div>
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">Project Charter actualizado</p>
                          <p className="text-xs text-gray-500">Hace 5 días</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Pestaña de Herramientas */}
            {activeTab === 'tools' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Herramientas del Proyecto</h2>
                  <GradientButton size="sm">
                    Añadir Herramienta
                  </GradientButton>
                </div>
                
                {Object.entries(toolsByPhase).length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(toolsByPhase).map(([phase, phaseTools]) => (
                      <div key={phase} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-md font-medium text-gray-800 dark:text-white mb-4">
                          Fase {getPhaseText(phase)}
                        </h3>
                        
                        <div className="space-y-3">
                          {phaseTools.map(tool => (
                            <div 
                              key={tool.id}
                              className={`border ${getToolStatusColor(tool.status)} rounded-lg p-4 transition-all hover:shadow-md flex justify-between items-center`}
                            >
                              <div className="flex items-center">
                                <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 mr-3">
                                  {getToolIcon(tool.icon)}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-800 dark:text-white">{tool.name}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">{tool.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${getToolStatusColor(tool.status)}`}>
                                  {getToolStatusText(tool.status)}
                                </span>
                                
                                <select
                                  value={tool.status}
                                  onChange={(e) => handleToolStatusChange(tool.id, e.target.value)}
                                  className="text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                                >
                                  <option value="not_started">No Iniciada</option>
                                  <option value="in_progress">En Progreso</option>
                                  <option value="completed">Completada</option>
                                </select>
                                
                                <Link 
                                  to={`/projects/${projectId}/tools/${tool.id}`}
                                  className="px-3 py-1 rounded-md text-white bg-primary-500 hover:bg-primary-600 text-sm transition-colors"
                                >
                                  {tool.component ? 'Abrir' : 'Configurar'}
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Settings size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      No hay herramientas asociadas
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Este proyecto aún no tiene herramientas asociadas. Añade herramientas para comenzar.
                    </p>
                    <GradientButton>
                      Añadir Primera Herramienta
                    </GradientButton>
                  </div>
                )}
              </div>
            )}
            
            {/* Pestaña de Equipo */}
            {activeTab === 'team' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Equipo del Proyecto</h2>
                  <GradientButton size="sm">
                    Añadir Miembro
                  </GradientButton>
                </div>
                
                {teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teamMembers.map(member => (
                      <div 
                        key={member.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium mr-4">
                          {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-white">{member.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Users size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                      No hay miembros en el equipo
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Este proyecto aún no tiene miembros asignados. Añade miembros para comenzar.
                    </p>
                    <GradientButton>
                      Añadir Primer Miembro
                    </GradientButton>
                  </div>
                )}
              </div>
            )}
            
            {/* Pestaña de Configuración */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Configuración del Proyecto</h2>
                
                {/* Aquí irían formularios de configuración del proyecto */}
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Esta sección permitirá cambiar la configuración general del proyecto, permisos, notificaciones y más.
                </p>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Acciones Peligrosas</h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        Las siguientes acciones pueden resultar en pérdida de datos. Asegúrate de lo que estás haciendo.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <button className="w-full flex items-center justify-between px-4 py-2 border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded">
                      <div className="flex items-center">
                        <Archive size={16} className="mr-2" />
                        <span>Archivar Proyecto</span>
                      </div>
                      <ArrowRight size={16} />
                    </button>
                    
                    <button className="w-full flex items-center justify-between px-4 py-2 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded">
                      <div className="flex items-center">
                        <Trash2 size={16} className="mr-2" />
                        <span>Eliminar Proyecto</span>
                      </div>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Modal para confirmar eliminación */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 mx-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Eliminar Proyecto</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                ¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Aquí iría la lógica para eliminar el proyecto
                    setDeleteModalOpen(false);
                    navigate('/projects');
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      
      <div className="mt-6">
        <Tabs defaultValue="documents">
          <TabsList>
            {/* Removed Timeline tab */}
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          {/* Removed Timeline tab content */}
          <TabsContent value="documents">
            {/* Contenido de la pestaña de documentos */}
          </TabsContent>
          <TabsContent value="team">
            {/* Contenido de la pestaña de equipo */}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ProjectDetailsPage;
