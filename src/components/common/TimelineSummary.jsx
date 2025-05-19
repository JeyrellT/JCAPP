import React from 'react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { Calendar, AlertTriangle, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO, differenceInDays } from 'date-fns';

/**
 * Componente para mostrar un resumen del timeline de un proyecto
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const TimelineSummary = ({ projectId }) => {
  const { getProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // Si no hay datos de timeline o no hay proyecto, mostrar mensaje para configurar timeline
  if (!project || !project['project-timeline']) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
        <div className="flex justify-center mb-3">
          <div className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-full">
            <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} />
          </div>
        </div>
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
          Timeline del Proyecto Pendiente
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Utiliza la herramienta Timeline para planificar y visualizar las tareas del proyecto.
        </p>
        <button 
          onClick={() => window.location.href = `/projects/${projectId}/tools/project-timeline`}
          className="text-sm px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
        >
          Configurar Timeline
        </button>
      </div>
    );
  }

  // Obtener datos del timeline
  const timelineData = project['project-timeline'];
  const tasks = timelineData.data?.tasks || [];
  
  // Calcular estadísticas
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const delayedTasks = tasks.filter(task => task.status === 'delayed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const notStartedTasks = tasks.filter(task => task.status === 'not_started').length;
  
  // Calcular progreso general
  const progressPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;
  
  // Obtener próximas fechas importantes
  const upcomingTasks = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .slice(0, 2);
  
  // Determinar estado del proyecto
  const getProjectStatus = () => {
    if (delayedTasks > 0) return 'at-risk';
    if (completedTasks === totalTasks && totalTasks > 0) return 'completed';
    if (notStartedTasks === totalTasks) return 'not-started';
    return 'on-track';
  };
  
  const projectStatus = getProjectStatus();
  
  // Verificar si hay una fecha de última actualización
  const lastUpdated = timelineData.updatedAt 
    ? format(new Date(timelineData.updatedAt), 'dd MMM yyyy')
    : 'No disponible';
  
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
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Calcular días restantes para próxima tarea
  const calculateDaysRemaining = (dateString) => {
    const today = new Date();
    const taskDate = parseISO(dateString);
    return differenceInDays(taskDate, today);
  };
  
  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-4 bg-indigo-500 dark:bg-indigo-700 text-white">
        <h3 className="text-lg font-medium flex items-center">
          <Calendar className="mr-2" size={18} />
          Timeline del Proyecto
        </h3>
      </div>
      
      <div className="p-4">
        <motion.div variants={itemVariants} className="flex items-center mb-4">
          <div className={`p-2 rounded-full ${
            projectStatus === 'at-risk' ? 'bg-red-100 dark:bg-red-900/30' : 
            projectStatus === 'on-track' ? 'bg-green-100 dark:bg-green-900/30' :
            projectStatus === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30' :
            'bg-amber-100 dark:bg-amber-900/30'
          } mr-3`}>
            {projectStatus === 'at-risk' ? (
              <AlertTriangle className="text-red-600 dark:text-red-400" size={18} />
            ) : projectStatus === 'on-track' ? (
              <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
            ) : projectStatus === 'completed' ? (
              <CheckCircle className="text-blue-600 dark:text-blue-400" size={18} />
            ) : (
              <Clock className="text-amber-600 dark:text-amber-400" size={18} />
            )}
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Estado</div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {projectStatus === 'at-risk' ? 'En Riesgo' : 
               projectStatus === 'on-track' ? 'En curso' :
               projectStatus === 'completed' ? 'Completado' : 
               'No iniciado'}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Progreso</div>
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {progressPercentage}%
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
            <div 
              className={`h-2.5 rounded-full ${
                projectStatus === 'at-risk' ? 'bg-red-500' : 
                projectStatus === 'on-track' ? 'bg-green-500' :
                projectStatus === 'completed' ? 'bg-blue-500' :
                'bg-amber-500'
              }`}
              style={{width: `${progressPercentage}%`}}
            ></div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{totalTasks}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
              <div className="text-xs text-blue-500 dark:text-blue-400">Completadas</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{completedTasks}</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
              <div className="text-xs text-amber-500 dark:text-amber-400">En progreso</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{inProgressTasks}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
              <div className="text-xs text-red-500 dark:text-red-400">Retrasadas</div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{delayedTasks}</div>
            </div>
          </div>
        </motion.div>
        
        {upcomingTasks.length > 0 && (
          <motion.div variants={itemVariants} className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Próximas tareas</h4>
            <div className="space-y-2">
              {upcomingTasks.map((task, index) => {
                const daysRemaining = calculateDaysRemaining(task.endDate);
                return (
                  <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        daysRemaining < 0 ? 'bg-red-500' :
                        daysRemaining < 3 ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}></div>
                      <span className="text-sm text-gray-800 dark:text-gray-200 truncate" style={{maxWidth: '150px'}}>
                        {task.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(parseISO(task.endDate), 'dd MMM')}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        
        <motion.div variants={itemVariants} className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Actualizado: {lastUpdated}
              </span>
            </div>
            <button 
              onClick={() => window.location.href = `/projects/${projectId}/tools/project-timeline`}
              className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
            >
              Ver detalles
              <ExternalLink size={12} className="ml-1" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TimelineSummary;
