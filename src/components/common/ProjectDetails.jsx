import React from 'react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Tag, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  ChevronRight,
  AlertOctagon,
  Folder
} from 'lucide-react';
import RoiSummary from './RoiSummary';

/**
 * Componente para mostrar información detallada del proyecto
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const ProjectDetails = ({ projectId }) => {
  const { getProject } = useLeanSixSigma();
  const navigate = useNavigate();
  const project = getProject(projectId);
  
  if (!project) {
    return <div>Cargando detalles del proyecto...</div>;
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Get badge color for category
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
      'Otros': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return colors[category] || colors['Otros'];
  };
  
  // Calcular progreso del proyecto
  const calculateProgress = () => {
    if (!project.milestones || project.milestones.length === 0) return 0;
    
    const completed = project.milestones.filter(m => m.completed).length;
    return Math.round((completed / project.milestones.length) * 100);
  };
  
  const handleNavigateToRoi = () => {
    navigate(`/projects/${projectId}/tools/roi-calculator`);
  };
  
  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-blue-500 dark:bg-blue-700 text-white">
          <h3 className="text-lg font-medium">Información del Proyecto</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">{project.name}</h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${project.phase === 'Define' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    project.phase === 'Measure' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    project.phase === 'Analyze' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    project.phase === 'Improve' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {project.phase}
                </span>
                
                {/* Category Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(project.category)}`}>
                  <Folder size={12} className="mr-1" />
                  {project.category}
                </span>

                {/* Tags */}
                {project.tags && project.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    <Tag size={12} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {project.description || 'Sin descripción disponible.'}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-sm">Fecha de inicio: {formatDate(project.startDate)}</span>
                </div>
                
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">Fecha estimada de finalización: {formatDate(project.endDate)}</span>
                </div>
                
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm">Equipo: {project.team?.length || 0} miembros</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Progress Stats */}
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</h3>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-end">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{project.progress || 0}%</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Budget Stats */}
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Presupuesto</h3>
                  <DollarSign className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-end">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project.configuration?.budget?.planned ? 
                      new Intl.NumberFormat('es-CR', { style: 'currency', currency: project.configuration.budget.currency || 'CRC' })
                        .format(project.configuration.budget.planned) : 
                      'No definido'
                    }
                  </span>
                </div>
                {project.configuration?.budget?.actual && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Ejecutado: {new Intl.NumberFormat('es-CR', { style: 'currency', currency: project.configuration.budget.currency || 'CRC' })
                      .format(project.configuration.budget.actual)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Objetivos del Proyecto */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 bg-green-500 dark:bg-green-700 text-white">
          <h3 className="text-lg font-medium">Objetivos del Proyecto</h3>
        </div>
        
        <div className="p-6">
          {project.objectives && project.objectives.length > 0 ? (
            <ul className="space-y-4">
              {project.objectives.map((objective, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full mr-3 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200">{objective.description}</p>
                    {objective.metrics && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Métrica: {objective.metrics}
                      </p>
                    )}
                    {objective.target && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Meta: {objective.target}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <AlertOctagon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No se han definido objetivos para este proyecto.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Riesgos del Proyecto (opcional) */}
      {project.risks && project.risks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-4 bg-amber-500 dark:bg-amber-700 text-white">
            <h3 className="text-lg font-medium">Riesgos Identificados</h3>
          </div>
          
          <div className="p-6">
            <ul className="space-y-4">
              {project.risks.map((risk, index) => (
                <li key={index} className="flex items-start">
                  <div className={`p-1 rounded-full mr-3 mt-0.5 ${
                    risk.severity === 'Alta' ? 'bg-red-100 dark:bg-red-900/30' :
                    risk.severity === 'Media' ? 'bg-amber-100 dark:bg-amber-900/30' :
                    'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <AlertOctagon className={`w-4 h-4 ${
                      risk.severity === 'Alta' ? 'text-red-600 dark:text-red-400' :
                      risk.severity === 'Media' ? 'text-amber-600 dark:text-amber-400' :
                      'text-green-600 dark:text-green-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-gray-800 dark:text-gray-200">{risk.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        risk.severity === 'Alta' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        risk.severity === 'Media' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        Severidad: {risk.severity}
                      </span>
                      {risk.mitigationPlan && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Plan de mitigación definido
                        </span>
                      )}
                    </div>
                    {risk.mitigationPlan && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Mitigación: {risk.mitigationPlan}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
