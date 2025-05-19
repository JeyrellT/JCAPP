import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Calendar, 
  Edit2, 
  Save, 
  Link, 
  X, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  GanttChartSquare,
  KanbanSquare, 
  PieChart,
  Users,
  ChevronRight,
  ArrowRightCircle,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { format, parseISO, isAfter, differenceInDays, addDays, isSameDay, isBefore } from 'date-fns';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useForm, Controller } from "react-hook-form";

dayjs.extend(isoWeek);

/**
 * Componente para visualizar y gestionar la línea de tiempo del proyecto con vista Gantt y Kanban
 */
const ProjectTimeline = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const { isDark } = useTheme();
  const project = getProject(projectId);
  const ganttRef = useRef(null);
  
  // Estados para la interfaz
  const [view, setView] = useState('gantt'); // 'gantt', 'kanban', 'dashboard'
  const [viewMode, setViewMode] = useState(ViewMode.Week);
  const [isEditing, setIsEditing] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [dependencies, setDependencies] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [zoom, setZoom] = useState(100); // Cambio a un valor porcentual base 100%
  const [scrollPosition, setScrollPosition] = useState(0);
  const ganttContainerRef = useRef(null);
  
  // Función para cambiar entre modos de edición
  const toggleEdit = () => {
    if (isEditing && hasUnsavedChanges) {
      saveChanges();
    } else {
      setIsEditing(!isEditing);
    }
  };
  
  // Función para cambiar entre tipos de vista
  const handleViewChange = (newView) => {
    setView(newView);
  };

  const [executiveSummary, setExecutiveSummary] = useState({
    onTrack: 0,
    atRisk: 0,
    delayed: 0,
    completed: 0,
    total: 0,
    criticalPath: [],
    riskExposure: 'low', // 'low', 'medium', 'high'
    estimatedCompletion: null
  });
  // Estado para las tareas y fases
  const [tasks, setTasks] = useState([]);
  const [phases, setPhases] = useState([
    { id: 'define', name: 'Define', type: 'project' },
    { id: 'measure', name: 'Measure', type: 'project' },
    { id: 'analyze', name: 'Analyze', type: 'project' },
    { id: 'improve', name: 'Improve', type: 'project' },
    { id: 'control', name: 'Control', type: 'project' }
  ]);

  // Sensores para dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [newTask, setNewTask] = useState({
    id: '',
    name: '',
    description: '',
    start: new Date(),
    end: new Date(),
    status: 'not_started',
    progress: 0,
    assignee: '',
    riskLevel: 'low',
    dependencies: [],
    type: 'task',
    project: 'define', // Phase
    criticalPathItem: false,
    riskFactors: []
  });
  
  // Estado de filtros
  const [filters, setFilters] = useState({
    showDelayed: true,
    showHigh: true,
    showMedium: true,
    showLow: true,
    showCriticalPath: false
  });
  
  // Carga las tareas del proyecto cuando cambia el proyecto
  useEffect(() => {
    if (project && project.tasks) {
      // Inicializar campo order
      const orderedTasks = project.tasks.map((t, idx) => ({
        ...t,
        order: typeof t.order === 'number' ? t.order : idx + 1
      }));
      setTasks(orderedTasks);
      setDependencies(project.dependencies || []);
    } else if (project) {
      setTasks([]);
      setDependencies([]);
    }
  }, [project]);
  
  // Guarda los cambios en el proyecto
  const saveChanges = () => {
    if (!project) return;
    
    updateProject(projectId, {
      ...project,
      tasks: tasks,
      dependencies: dependencies
    });
    
    setIsEditing(false);
    setShowTaskForm(false);
    setHasUnsavedChanges(false);
  };

  // Marcar cambios sin guardar
  const markUnsavedChanges = () => {
    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };
  
  // Calcula el estado de riesgo en base a la fecha de fin y progreso
  const calculateRiskStatus = (task) => {
    if (!task) return 'low';
    
    const today = new Date();
    
    // Handle different date property names (endDate or end)
    let endDate;
    try {
      // First try to use endDate property
      if (task.endDate) {
        endDate = typeof task.endDate === 'string' ? parseISO(task.endDate) : new Date(task.endDate);
      } 
      // Fall back to end property
      else if (task.end) {
        endDate = task.end instanceof Date ? task.end : new Date(task.end);
      } 
      // If no date is available, use current date + 1 week as fallback
      else {
        endDate = addDays(today, 7);
      }
    } catch (err) {
      console.warn('Error parsing task end date:', err);
      endDate = addDays(today, 7); // Fallback to a week from now
    }
    
    if (task.status === 'completed') {
      return 'completed';
    } else if (task.status === 'delayed' || (isAfter(today, endDate) && task.progress < 100)) {
      return 'high';
    } else if (differenceInDays(endDate, today) <= 3 && task.progress < 90) {
      return 'medium';
    } else {
      return 'low';
    }
  };
  
  // Obtiene el color según el nivel de riesgo
  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Añadir nueva tarea
  const addNewTask = () => {
    // Validaciones básicas
    if (!newTask.name || !newTask.start || !newTask.end) {
      setErrorMessage('Nombre, fecha de inicio y fecha de fin son obligatorios');
      return;
    }
    
    const taskId = `task-${Date.now()}`;
    const taskOrder = tasks.filter(t => t.status === newTask.status).length + 1;
    const taskToAdd = { ...newTask, id: taskId, order: taskOrder };
    
    setTasks([...tasks, taskToAdd]);
    setNewTask({
      id: '',
      name: '',
      description: '',
      start: new Date(),
      end: new Date(),
      status: 'not_started',
      progress: 0,
      assignee: '',
      riskLevel: 'low',
      dependencies: []
    });
    
    setShowTaskForm(false);
    setErrorMessage('');
    markUnsavedChanges();
  };
  
  // Eliminar tarea
  const deleteTask = (taskId) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta tarea?')) return;
    // Eliminar la tarea
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    
    // Eliminar dependencias relacionadas con esta tarea
    const updatedDependencies = dependencies.filter(
      dep => dep.predecessor !== taskId && dep.successor !== taskId
    );
    
    setTasks(updatedTasks);
    setDependencies(updatedDependencies);
    markUnsavedChanges();
  };
  
  // Actualizar tarea
  const updateTask = (taskId, updatedFields) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, ...updatedFields } : task
    ));
    markUnsavedChanges();
  };
  
  // Crear dependencia entre tareas
  const createDependency = (predecessorId, successorId) => {
    // Evitar dependencias circulares o duplicadas
    const isDuplicate = dependencies.some(
      dep => dep.predecessor === predecessorId && dep.successor === successorId
    );
    
    const wouldCreateCycle = checkForCycle(predecessorId, successorId);
    
    if (isDuplicate) {
      setErrorMessage('Esta dependencia ya existe');
      return false;
    }
    
    if (wouldCreateCycle) {
      setErrorMessage('Esta dependencia crearía un ciclo');
      return false;
    }
    
    const newDependency = {
      id: `dep-${Date.now()}`,
      predecessor: predecessorId,
      successor: successorId,
      type: 'finish-to-start' // Por defecto, la tarea sucesora solo puede comenzar cuando la predecesora finaliza
    };
    
    setDependencies([...dependencies, newDependency]);
    markUnsavedChanges();
    return true;
  };
  
  // Verificar si crear una dependencia generaría un ciclo
  const checkForCycle = (predecessorId, successorId) => {
    // Si son la misma tarea, es un ciclo
    if (predecessorId === successorId) return true;
    
    // Construir un grafo a partir de las dependencias existentes
    const graph = {};
    tasks.forEach(task => { graph[task.id] = []; });
    
    dependencies.forEach(dep => {
      if (graph[dep.predecessor]) {
        graph[dep.predecessor].push(dep.successor);
      }
    });
    
    // Añadir la nueva dependencia
    if (graph[predecessorId]) {
      graph[predecessorId].push(successorId);
    }
    
    // Verificar ciclo con DFS
    const visited = new Set();
    const recStack = new Set();
    
    function dfs(node) {
      if (!visited.has(node)) {
        visited.add(node);
        recStack.add(node);
        
        const neighbors = graph[node] || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && dfs(neighbor)) {
            return true;
          } else if (recStack.has(neighbor)) {
            return true;
          }
        }
      }
      
      recStack.delete(node);
      return false;
    }
    
    return dfs(predecessorId);
  };
  
  // Eliminar dependencia
  const deleteDependency = (dependencyId) => {
    setDependencies(dependencies.filter(dep => dep.id !== dependencyId));
    markUnsavedChanges();
  };
  
  // Actualiza el resumen ejecutivo
  const updateExecutiveSummary = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const delayed = tasks.filter(task => task.status === 'delayed').length;
    const onTrack = tasks.filter(task => task.status === 'in_progress' && calculateRiskStatus(task) !== 'high').length;
    const atRisk = tasks.filter(task => task.status === 'in_progress' && calculateRiskStatus(task) === 'high').length;
    
    // Calcular ruta crítica
    const criticalPath = calculateCriticalPath();
    
    // Estimación de finalización
    const estimatedCompletion = calculateEstimatedCompletion(criticalPath);
    
    // Exposición al riesgo
    const riskExposure = calculateRiskExposure(criticalPath);
    
    setExecutiveSummary({
      total,
      completed,
      delayed,
      onTrack,
      atRisk,
      criticalPath,
      estimatedCompletion,
      riskExposure
    });
  };
  
  // Calcular y actualizar el resumen ejecutivo al cambiar las tareas
  useEffect(() => {
    if (tasks.length > 0) {
      const summary = {
        onTrack: tasks.filter(t => t.status === 'in_progress' && calculateRiskStatus(t) === 'low').length,
        atRisk: tasks.filter(t => (t.status === 'in_progress' && calculateRiskStatus(t) !== 'low') || t.status === 'delayed').length,
        delayed: tasks.filter(t => t.status === 'delayed').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        total: tasks.length,
        criticalPath: calculateCriticalPath(tasks, dependencies),
        riskExposure: calculateProjectRiskExposure(tasks),
        estimatedCompletion: estimateProjectCompletion(tasks, dependencies)
      };
      
      setExecutiveSummary(summary);
      
      // Actualizar tareas críticas
      const updatedTasks = tasks.map(task => ({
        ...task,
        criticalPathItem: summary.criticalPath.includes(task.id)
      }));
      
      if (JSON.stringify(updatedTasks) !== JSON.stringify(tasks)) {
        setTasks(updatedTasks);
      }
    }
  }, [tasks, dependencies]);
  
  /**
   * Calcula la exposición a riesgo del proyecto basado en tareas
   * @param {Array} taskList - Lista de tareas
   * @returns {string} - Nivel de riesgo ('low', 'medium', 'high')
   */
  const calculateProjectRiskExposure = (taskList) => {
    const highRiskCount = taskList.filter(t => calculateRiskStatus(t) === 'high').length;
    const mediumRiskCount = taskList.filter(t => calculateRiskStatus(t) === 'medium').length;
    const totalTasks = taskList.length;
    
    if (totalTasks === 0) return 'low';
    
    const highRiskPercentage = (highRiskCount / totalTasks) * 100;
    const mediumRiskPercentage = (mediumRiskCount / totalTasks) * 100;
    
    if (highRiskPercentage > 20 || (highRiskCount > 0 && highRiskCount === totalTasks)) {
      return 'high';
    } else if (mediumRiskPercentage > 30 || highRiskCount > 0) {
      return 'medium';
    }
    
    return 'low';
  };
  
  /**
   * Calcula la ruta crítica del proyecto
   * @param {Array} taskList - Lista de tareas
   * @param {Array} deps - Lista de dependencias
   * @returns {Array} - IDs de tareas en la ruta crítica
   */
  const calculateCriticalPath = (taskList, deps) => {
    // Algoritmo simplificado de ruta crítica
    // En un escenario real usaríamos un algoritmo más complejo
    
    // Identificar tareas sin dependientes (tareas finales)
    const endTasks = taskList.filter(task => 
      !deps.some(dep => dep.fromId === task.id)
    );
    
    // Encontrar la ruta más larga desde cualquier tarea inicial a cualquier tarea final
    let criticalPath = [];
    let maxPathLength = 0;
    
    // Para cada tarea final
    endTasks.forEach(endTask => {
      const paths = findAllPaths(taskList, deps, endTask.id);
      
      // Encontrar la ruta más larga
      paths.forEach(path => {
        if (path.length > maxPathLength) {
          maxPathLength = path.length;
          criticalPath = path;
        }
      });
    });
    
    return criticalPath;
  };
  
  /**
   * Encuentra todos los caminos posibles al nodo destino
   * @param {Array} taskList - Lista de tareas
   * @param {Array} deps - Lista de dependencias
   * @param {string} targetId - ID de la tarea destino
   * @returns {Array} - Array de caminos (cada uno es un array de IDs)
   */
  const findAllPaths = (taskList, deps, targetId, visited = [], currentPath = []) => {
    // Añadir el nodo actual a la ruta
    const newPath = [...currentPath, targetId];
    
    // Si es un nodo inicial (sin padres), retornar la ruta
    const parentIds = deps
      .filter(dep => dep.toId === targetId)
      .map(dep => dep.fromId);
    
    if (parentIds.length === 0) {
      return [newPath];
    }
    
    // Recursión para cada padre
    let allPaths = [];
    parentIds.forEach(parentId => {
      // Evitar ciclos
      if (!visited.includes(parentId) && !currentPath.includes(parentId)) {
        const paths = findAllPaths(
          taskList,
          deps,
          parentId,
          [...visited, targetId],
          newPath
        );
        allPaths = [...allPaths, ...paths];
      }
    });
    
    return allPaths;
  };
  
  /**
   * Calcula la fecha estimada de finalización basada en tareas y dependencias
   * @param {Array} taskList - Lista de tareas
   * @param {Array} deps - Lista de dependencias
   * @returns {Date|null} - Fecha estimada de finalización
   */
  const estimateProjectCompletion = (taskList, deps) => {
    if (taskList.length === 0) return null;
    
    const criticalPathIds = calculateCriticalPath(taskList, deps);
    const criticalTasks = taskList.filter(task => criticalPathIds.includes(task.id));
    
    // Ordena las tareas por dependencia
    let orderedTasks = [];
    let remainingTasks = [...criticalTasks];
    
    while (remainingTasks.length > 0) {
      const nextBatch = remainingTasks.filter(task => 
        task.dependencies.every(depId => 
          orderedTasks.some(ordered => ordered.id === depId) || 
          !criticalPathIds.includes(depId)
        )
      );
      
      if (nextBatch.length === 0) break; // Evita bucles infinitos
      
      orderedTasks = [...orderedTasks, ...nextBatch];
      remainingTasks = remainingTasks.filter(task => !nextBatch.includes(task));
    }
    
    // Calcula la fecha más tardía
    let latestDate = null;
    orderedTasks.forEach(task => {
      if (task.endDate) {
        const taskDate = parseISO(task.endDate);
        if (!latestDate || isAfter(taskDate, latestDate)) {
          latestDate = taskDate;
        }
      }
    });
    
    return latestDate;
  };
  
  // Filtra las tareas según los criterios seleccionados
  const filteredTasks = tasks.filter(task => {
    const isDelayed = task.status === 'delayed';
    const isHighRisk = task.riskLevel === 'high';
    const isMediumRisk = task.riskLevel === 'medium';
    const isLowRisk = task.riskLevel === 'low';
    const isCriticalPath = task.criticalPathItem;
    
    const showDelayed = filters.showDelayed || !isDelayed;
    const showHigh = filters.showHigh || !isHighRisk;
    const showMedium = filters.showMedium || !isMediumRisk;
    const showLow = filters.showLow || !isLowRisk;
    const showCriticalPath = filters.showCriticalPath || !isCriticalPath;
    
    return showDelayed && showHigh && showMedium && showLow && showCriticalPath;
  });
  
  // Format tasks for Gantt
  const formatGanttTasks = () => {
    return tasks.map(task => ({
      id: task.id,
      name: task.name,
      start: task.startDate,
      end: task.endDate,
      progress: task.progress,
      dependencies: task.dependencies || [],
      assignee: task.assignee,
      status: task.status,
      riskLevel: task.riskLevel
    }));
  };
  
  // Calcula el progreso de una fase basado en sus tareas
  const calculatePhaseProgress = (phaseTasks) => {
    if (!phaseTasks.length) return 0;
    const totalProgress = phaseTasks.reduce((sum, task) => sum + task.progress, 0);
    return totalProgress / phaseTasks.length;
  };
  
  // Obtiene los estilos para una tarea basado en su estado y riesgo
  const getTaskStyles = (task) => {
    const baseStyles = {
      backgroundColor: '#4338ca',
      backgroundSelectedColor: '#3730a3',
      progressColor: '#818cf8',
      progressSelectedColor: '#6366f1',
      textColor: '#ffffff',
      arrowColor: '#374151',
      handleWidth: 8,
      borderRadius: 4,
    };

    if (task.status === 'completed') {
      return {
        ...baseStyles,
        backgroundColor: '#059669',
        backgroundSelectedColor: '#047857',
        progressColor: '#34d399',
        progressSelectedColor: '#10b981'
      };
    } else if (task.status === 'delayed' || task.riskLevel === 'high') {
      return {
        ...baseStyles,
        backgroundColor: '#dc2626',
        backgroundSelectedColor: '#b91c1c',
        progressColor: '#f87171',
        progressSelectedColor: '#ef4444'
      };
    } else if (task.riskLevel === 'medium') {
      return {
        ...baseStyles,
        backgroundColor: '#d97706',
        backgroundSelectedColor: '#b45309',
        progressColor: '#fbbf24',
        progressSelectedColor: '#f59e0b'
      };
    }

    return baseStyles;
  };
  
  // Formatea las tareas para el componente Gantt
  const formatTasksForGantt = useMemo(() => {
    // Agrupar las tareas por fase
    const tasksByPhase = {};
    phases.forEach(phase => {
      tasksByPhase[phase.id] = [];
    });

    // Distribuir las tareas a sus respectivas fases
    tasks.forEach(task => {
      const phaseId = task.project || 'define';
      if (tasksByPhase[phaseId]) {
        tasksByPhase[phaseId].push(task);
      } else {
        tasksByPhase['define'].push(task);
      }
    });

    // Crear array para el resultado final
    let resultTasks = [];

    // Solo incluir fases que tengan tareas
    phases.forEach(phase => {
      const phaseTasks = tasksByPhase[phase.id];
      
      if (phaseTasks.length > 0) {
        // Calcular fechas de inicio y fin para la fase
        const validStartDates = phaseTasks
          .filter(t => t.start || t.startDate)
          .map(t => {
            if (t.start instanceof Date) return t.start;
            if (t.startDate) return new Date(t.startDate);
            return new Date();
          });
        
        const validEndDates = phaseTasks
          .filter(t => t.end || t.endDate)
          .map(t => {
            if (t.end instanceof Date) return t.end;
            if (t.endDate) return new Date(t.endDate);
            return addDays(new Date(), 7);
          });
        
        const start = validStartDates.length > 0 
          ? new Date(Math.min(...validStartDates)) 
          : new Date();
        
        const end = validEndDates.length > 0 
          ? new Date(Math.max(...validEndDates))
          : addDays(new Date(), 30);
        
        // Añadir la fase primero
        resultTasks.push({
          id: phase.id,
          name: phase.name,
          type: 'project',
          start,
          end,
          progress: calculatePhaseProgress(phaseTasks),
          hideChildren: false,
          styles: {
            backgroundColor: '#6366f1',
            backgroundSelectedColor: '#4f46e5',
            progressColor: '#818cf8',
            progressSelectedColor: '#6366f1',
            borderRadius: 4,
          }
        });
        
        // Luego añadir cada tarea de esta fase
        phaseTasks.forEach(task => {
          // Ensure we always have valid date objects
          const start = task.start instanceof Date ? task.start : 
                      (task.startDate ? new Date(task.startDate) : new Date());
          const end = task.end instanceof Date ? task.end : 
                     (task.endDate ? new Date(task.endDate) : addDays(new Date(), 1));
                     
          resultTasks.push({
            id: task.id,
            name: task.name || "Sin nombre",
            type: 'task',
            start,
            end,
            progress: typeof task.progress === 'number' ? task.progress : 0,
            project: phase.id, // Asociar con la fase correcta
            dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
            styles: getTaskStyles(task),
            isDisabled: !isEditing,
          });
        });
      }
    });

    return resultTasks;
  }, [tasks, phases, isEditing]);

  // Manejadores de eventos para el componente Gantt
  const handleTaskChange = (task) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          start: task.start,
          end: task.end,
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    markUnsavedChanges();
  };

  const handleProgressChange = (task) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          progress: task.progress,
          status: task.progress === 100 ? 'completed' : t.status,
        };
      }
      return t;
    });
    setTasks(updatedTasks);
    markUnsavedChanges();
  };

  const handleTaskClick = (task) => {
    setCurrentTask(task);
    setShowTaskDrawer(true);
  };

  const handleTaskDelete = (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    markUnsavedChanges();
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };
  
  // Prepare columns for Kanban view
  const getKanbanColumns = () => {
    const columns = [
      { id: 'not_started', name: 'Por Iniciar', icon: <Clock size={16} className="mr-2" /> },
      { id: 'in_progress', name: 'En Progreso', icon: <ArrowRightCircle size={16} className="mr-2" /> },
      { id: 'delayed', name: 'Retrasado', icon: <AlertCircle size={16} className="mr-2" /> },
      { id: 'completed', name: 'Completado', icon: <FileCheck size={16} className="mr-2" /> }
    ];
    
    return columns;
  };
  
  // Handle dnd-kit drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Reorden interno en la misma columna
    const activeTask = active.data.current.task;
    const overTask  = tasks.find(t => t.id === over.id);
    if (active.data.current.type === 'task' && overTask?.status === activeTask.status) {
      const colTasks = tasks
        .filter(t => t.status === activeTask.status)
        .sort((a,b) => a.order - b.order);
      const oldIndex = colTasks.findIndex(t => t.id === active.id);
      const newIndex = colTasks.findIndex(t => t.id === over.id);
      const newOrderIds = arrayMove(colTasks.map(t => t.id), oldIndex, newIndex);
      const updated = tasks.map(t => 
        t.status === activeTask.status 
          ? { ...t, order: newOrderIds.indexOf(t.id) + 1 } 
          : t
      );
      setTasks(updated);
      markUnsavedChanges();
      return;
    }

    // Mover a otra columna (al final)
    if (active.id.includes('task-') && over.id.startsWith('column-')) {
      const newStatus = over.id.replace('column-', '');
      const maxOrder  = tasks.filter(t => t.status === newStatus).length;
      updateTask(active.id, {
        status: newStatus,
        order: maxOrder + 1,
        progress: newStatus === 'completed' ? 100 : activeTask.progress
      });
    }
  };
  
  // --- Kanban Card tweaks for drag visuals ---
  const SortableKanbanCard = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: task.id,
      data: { type: 'task', task }
    });
    const style = {
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.05)`
        : undefined,
      transition: transition || 'transform 200ms',
      opacity: isDragging ? 0.5 : 1
    };
    
    const riskStatus = calculateRiskStatus(task);
    
    return (
      <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-white dark:bg-gray-700 p-3 rounded-md shadow mb-3 cursor-move hover:shadow-md transition-shadow"
        onClick={() => handleTaskClick(task)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium">{task.name}</h4>
          <div className={`w-3 h-3 rounded-full ${getRiskColor(riskStatus)}`}></div>
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Calendar size={12} className="mr-1" />
          <span>
            {format(task.start instanceof Date ? task.start : new Date(task.start), 'dd/MM/yyyy')} - 
            {format(task.end instanceof Date ? task.end : new Date(task.end), 'dd/MM/yyyy')}
          </span>
        </div>
        
        {task.assignee && (
          <div className="text-xs flex items-center mb-2">
            <Users size={12} className="mr-1" />
            <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
              {task.assignee}
            </span>
          </div>
        )}
        
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full ${
              task.status === 'completed' ? 'bg-blue-500' :
              riskStatus === 'high' ? 'bg-red-500' :
              riskStatus === 'medium' ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${task.progress}%` }}
          ></div>
        </div>
        
        {isEditing && (
          <div className="flex justify-end mt-2 space-x-2">
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentTask(task);
                setShowTaskDrawer(true);
              }}
            >
              <Edit2 size={14} />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(task.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderiza la vista Kanban con dnd-kit
  const renderKanbanView = () => {
    const columns = getKanbanColumns();
    
    return (
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(column => {
            const columnTasks = tasks.filter(task => task.status === column.id);
            
            // Sort tasks by progress in descending order
            const sortedTasks = [...columnTasks].sort((a, b) => b.progress - a.progress);
            
            return (
              <div 
                key={column.id} 
                id={`column-${column.id}`}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[200px] flex flex-col"
              >
                <h3 className="font-bold mb-4 flex justify-between items-center">
                  <div className="flex items-center">
                    {column.icon}
                    {column.name}
                  </div>
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                    {columnTasks.length}
                  </span>
                </h3>
                
                <div className="space-y-3 flex-grow">
                  <SortableContext 
                    items={sortedTasks.map(task => task.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedTasks.map(task => (
                      <SortableKanbanCard key={task.id} task={task} />
                    ))}
                  </SortableContext>
                </div>
                
                {isEditing && column.id === 'not_started' && (
                  <button
                    className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 mt-3"
                    onClick={() => {
                      setCurrentTask(null);
                      setNewTask({
                        ...newTask,
                        status: column.id
                      });
                      setShowTaskDrawer(true);
                    }}
                  >
                    <Plus size={16} className="mr-1" />
                    Agregar Tarea
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </DndContext>
    );
  };

  // Renderiza la vista Dashboard
  const renderDashboardView = () => {
    // Progress by phase
    const phaseProgress = phases.map(phase => {
      const phaseTasks = tasks.filter(t => t.project === phase.id);
      return {
        ...phase,
        progress: calculatePhaseProgress(phaseTasks),
        taskCount: phaseTasks.length
      };
    }).filter(phase => phase.taskCount > 0);

    // Calculate overall progress
    const totalProgress = tasks.length > 0 
      ? tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
      : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Project Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow col-span-1 md:col-span-2">
          <h3 className="text-xl font-bold mb-4">Estado General del Proyecto</h3>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Progreso Total</p>
              <p className="text-3xl font-bold">{Math.round(totalProgress)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Riesgo Global</p>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  executiveSummary.riskExposure === 'high' ? 'bg-red-500' :
                  executiveSummary.riskExposure === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                }`}></div>
                <p className="font-semibold">
                  {executiveSummary.riskExposure === 'high' ? 'Alto' :
                   executiveSummary.riskExposure === 'medium' ? 'Medio' : 'Bajo'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Estimada</p>
              <p className="font-semibold">
                {executiveSummary.estimatedCompletion ? 
                  format(new Date(executiveSummary.estimatedCompletion), 'dd/MM/yyyy') : 
                  'No disponible'}
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-6">
            <div 
              className="h-4 rounded-full bg-indigo-600" 
              style={{ width: `${totalProgress}%` }}
            ></div>
          </div>

          {/* Task Status Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">En Tiempo</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{executiveSummary.onTrack}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">En Riesgo</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{executiveSummary.atRisk}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Retrasadas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{executiveSummary.delayed}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{executiveSummary.completed}</p>
            </div>
          </div>

          {/* Critical Path */}
          {executiveSummary.criticalPath.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <AlertTriangle size={16} className="mr-2 text-amber-500" />
                Ruta Crítica
              </h4>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {executiveSummary.criticalPath.map((taskId, index) => {
                    const task = tasks.find(t => t.id === taskId);
                    return task ? (
                      <React.Fragment key={taskId}>
                        <div 
                          className="bg-white dark:bg-gray-700 px-3 py-1 rounded-md text-sm whitespace-nowrap shadow-sm"
                          onClick={() => handleTaskClick(task)}
                        >
                          {task.name}
                        </div>
                        {index < executiveSummary.criticalPath.length - 1 && (
                          <ChevronRight size={16} className="flex-shrink-0 text-amber-500" />
                        )}
                      </React.Fragment>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phase Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4">Progreso por Fase</h3>
          <div className="space-y-4">
            {phaseProgress.map(phase => (
              <div key={phase.id}>
                <div className="flex justify-between mb-1">
                  <p className="font-medium">{phase.name}</p>
                  <p className="text-sm">{Math.round(phase.progress)}%</p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-indigo-600" 
                    style={{ width: `${phase.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{phase.taskCount} tareas</p>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <AlertCircle size={20} className="mr-2 text-red-500" />
            Tareas de Alto Riesgo
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {tasks.filter(t => calculateRiskStatus(t) === 'high').map(task => (
              <div 
                key={task.id}
                className="p-3 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-md cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{task.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(task.end), 'dd/MM/yyyy')} • {task.progress}% completado
                    </p>
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200`}>
                    {task.status === 'delayed' ? 'Retrasada' : 'En Riesgo'}
                  </div>
                </div>
              </div>
            ))}
            {tasks.filter(t => calculateRiskStatus(t) === 'high').length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay tareas de alto riesgo</p>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Si no hay proyecto, mostrar un mensaje
  if (!project) {
    return <div>Cargando proyecto...</div>;
  }
  
  // Función para ajustar el zoom del gráfico Gantt
  const handleZoomChange = (newZoom) => {
    // Limitamos el zoom entre 50% y 200%
    const clampedZoom = Math.max(50, Math.min(200, newZoom));
    setZoom(clampedZoom);
  };

  // Funciones para controlar el desplazamiento horizontal
  const scrollLeft = () => {
    if (ganttContainerRef.current) {
      ganttContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (ganttContainerRef.current) {
      ganttContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Función para gestionar el scroll con la rueda del ratón mientras se presiona Ctrl
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      // Zoom in/out con la rueda mientras se presiona Ctrl
      const newZoom = zoom + (e.deltaY > 0 ? -5 : 5);
      handleZoomChange(newZoom);
    }
  };

  // Función para calcular el ancho dinámico de columnas basado en zoom y vista
  const calculateColumnWidth = () => {
    const baseWidth = viewMode === ViewMode.Month ? 160 : viewMode === ViewMode.Week ? 80 : 40;
    return Math.max(20, Math.round(baseWidth * zoom / 100));
  };
  
  // Calcular un ancho dinámico para la celda de lista según el zoom
  const calculateListCellWidth = () => {
    return Math.max(150, Math.round(240 * zoom / 100));
  };

  // Función para personalizar el formato de las fechas según el nivel de zoom y vista
  const customDateFormat = (date) => {
    if (!date) return '';
    
    switch(viewMode) {
      case ViewMode.Month:
        return format(date, 'MMM yy');
      case ViewMode.Week:
        return zoom < 70 ? format(date, 'd/M') : format(date, 'dd MMM');
      case ViewMode.Day:
        return zoom < 70 ? format(date, 'd') : format(date, 'EEE d');
      default:
        return format(date, 'dd/MM/yyyy');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controles superiores */}
      <div className="flex justify-between items-center mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          {/* Segmented control for view switching */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            <button 
              className={`flex items-center px-3 py-2 ${view === 'gantt' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              onClick={() => handleViewChange('gantt')}
            >
              <GanttChartSquare size={16} className="mr-2" />
              Gantt
            </button>
            <button 
              className={`flex items-center px-3 py-2 ${view === 'kanban' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              onClick={() => handleViewChange('kanban')}
            >
              <KanbanSquare size={16} className="mr-2" />
              Kanban
            </button>
            <button 
              className={`flex items-center px-3 py-2 ${view === 'dashboard' 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              onClick={() => handleViewChange('dashboard')}
            >
              <PieChart size={16} className="mr-2" />
              Dashboard
            </button>
          </div>

          {view === 'gantt' && (
            <>
              <select 
                value={viewMode}
                onChange={(e) => handleViewModeChange(e.target.value)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700"
              >
                <option value={ViewMode.Day}>Día</option>
                <option value={ViewMode.Week}>Semana</option>
                <option value={ViewMode.Month}>Mes</option>
              </select>
              
              {/* Controles de zoom y navegación para Gantt */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleZoomChange(zoom - 10)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Reducir zoom"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
                <div className="text-sm font-medium">{zoom}%</div>
                <button 
                  onClick={() => handleZoomChange(zoom + 10)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Aumentar zoom"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
                
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                
                <button 
                  onClick={scrollLeft}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Desplazar a la izquierda"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button 
                  onClick={scrollRight}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Desplazar a la derecha"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setCurrentTask(null);
              setShowTaskDrawer(true);
            }}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </button>

          <button 
            onClick={toggleEdit}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isEditing 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                {hasUnsavedChanges ? "Guardar*" : "Guardar"}
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Editar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Vista principal según la selección */}
      <div className="flex-grow min-h-0 relative">
        <div 
          className={view === 'gantt' ? 'block h-full overflow-hidden' : 'hidden'}
          onWheel={handleWheel}
        >
          {tasks.length > 0 ? (
            <div 
              ref={ganttContainerRef} 
              className="h-full overflow-auto"
            >
              <Gantt
                tasks={formatTasksForGantt}
                viewMode={viewMode}
                onDateChange={handleTaskChange}
                onProgressChange={handleProgressChange}
                onDoubleClick={handleTaskClick}
                onDelete={handleTaskDelete}
                onSelect={handleTaskClick}
                listCellWidth={calculateListCellWidth()}
                columnWidth={calculateColumnWidth()}
                ganttHeight={500}
                barFill={75}
                barCornerRadius={4}
                handleWidth={8}
                rtl={false}
                fontSize={`${Math.max(10, 14 * zoom / 100)}px`}
                rowHeight={Math.max(30, 50 * zoom / 100)}
                headerHeight={50}
                arrowColor="#374151"
                todayColor="rgba(99, 102, 241, 0.15)"
                projectProgressBar={true}
                projectProgressColors={{
                  background: '#6366f1',
                  progress: '#818cf8'
                }}
                TooltipContent={({ task }) => (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-sm mb-2">{task.name}</h4>
                    <div className="space-y-1 text-xs">
                      <p className="text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Inicio:</span> {format(task.start, 'dd/MM/yy')}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Fin:</span> {format(task.end, 'dd/MM/yy')}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Progreso:</span> {Math.round(task.progress)}%
                      </p>
                      {task.type === 'task' && (
                        <p className={`font-medium ${
                          task.status === 'completed' ? 'text-green-600' :
                          task.status === 'delayed' ? 'text-red-600' :
                          task.status === 'in_progress' ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {task.status === 'completed' ? 'Completado' :
                          task.status === 'delayed' ? 'Retrasado' :
                          task.status === 'in_progress' ? 'En Progreso' : 'Por Iniciar'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
              <p className="text-gray-500 mb-4">No hay tareas en este proyecto</p>
              <button
                onClick={() => {
                  setCurrentTask(null);
                  setShowTaskDrawer(true);
                }}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Primera Tarea
              </button>
            </div>
          )}
        </div>

        <div className={view === 'kanban' ? 'block' : 'hidden'}>
          {renderKanbanView()}
        </div>

        <div className={view === 'dashboard' ? 'block' : 'hidden'}>
          {renderDashboardView()}
        </div>
      </div>

      {/* Resumen ejecutivo (en vistas Gantt y Kanban) */}
      {view !== 'dashboard' && (
        <div className="mt-4 grid grid-cols-4 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">En Tiempo</p>
            <p className="text-2xl font-semibold text-green-600">{executiveSummary.onTrack}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">En Riesgo</p>
            <p className="text-2xl font-semibold text-yellow-600">{executiveSummary.atRisk}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Retrasadas</p>
            <p className="text-2xl font-semibold text-red-600">{executiveSummary.delayed}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completadas</p>
            <p className="text-2xl font-semibold text-blue-600">{executiveSummary.completed}</p>
          </div>
        </div>
      )}

      {/* Task Drawer Panel */}
      {showTaskDrawer && (
        <TaskDrawer
          task={currentTask}
          phases={phases}
          allTasks={tasks}
          onSave={(taskData) => {
            if (currentTask) {
              // Update existing task
              const updatedTasks = tasks.map(t => 
                t.id === taskData.id ? { ...taskData } : t
              );
              setTasks(updatedTasks);
            } else {
              // Add new task
              const newTaskId = `task-${Date.now()}`;
              setTasks([...tasks, { ...taskData, id: newTaskId }]);
            }
            setShowTaskDrawer(false);
            setCurrentTask(null);
            markUnsavedChanges();
          }}
          onDelete={taskId => {
            if (window.confirm('¿Seguro que quieres eliminar esta tarea?')) {
              deleteTask(taskId);
              setShowTaskDrawer(false);
              setCurrentTask(null);
            }
          }}
          onClose={() => {
            setShowTaskDrawer(false);
            setCurrentTask(null);
          }}
        />
      )}
      
      {/* Inyectar estilos para mejorar la visualización de Gantt */}
      <style>{`
        .gantt-container {
          position: relative;
          overflow: hidden;
        }
        
        .gantt__bar .bar-text {
          white-space: normal;
          overflow-wrap: break-word;
          text-align: left;
          padding-left: 4px;
          font-size: ${Math.max(10, 14 * zoom / 100)}px;
        }
        
        .gantt__task-list-header-cell, .gantt__task-list-item {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        /* Rotación vertical de las etiquetas de fecha para evitar solapamiento */
        .gantt-header-title {
          writing-mode: ${zoom < 80 ? 'vertical-rl' : 'horizontal-tb'};
          transform: ${zoom < 80 ? 'rotate(180deg)' : 'none'};
          transform-origin: center;
          height: ${zoom < 80 ? '100px' : 'auto'};
          padding: 4px;
          font-size: ${Math.max(9, 12 * zoom / 100)}px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }
        
        /* Mejora de visibilidad de fechas actuales */
        .gantt-today-highlight {
          background-color: rgba(99, 102, 241, 0.15);
          position: absolute;
          height: 100%;
          z-index: 0;
        }
        
        /* Resaltado de barra al pasar el mouse */
        .gantt__bar:hover {
          filter: brightness(1.1);
        }
        
        /* Mejorar indicadores de redimensionamiento */
        .gantt__bar-handle {
          visibility: hidden;
        }
        
        .gantt__bar:hover .gantt__bar-handle {
          visibility: visible;
          background-color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default ProjectTimeline;

// Task Drawer Component with react-hook-form
const TaskDrawer = ({ task, phases, allTasks, onSave, onDelete, onClose }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: task || {
      name: '',
      description: '',
      start: new Date(),
      end: addDays(new Date(), 7),
      progress: 0,
      type: 'task',
      project: 'define', // Phase
      status: 'not_started',
      riskLevel: 'low',
      assignee: '',
      dependencies: []
    }
  });

  const onSubmit = (data) => {
    if (data.end < data.start) {
      alert('La fecha fin debe ser igual o posterior a la fecha de inicio');
      return;
    }
    onSave({
      ...data,
      id: task?.id || `task-${Date.now()}`
    });
  };

  // Filter out the current task from potential dependencies to prevent circular references
  const availableDependencies = allTasks.filter(t => !task || t.id !== task.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-end z-50">
      {/* Overlay to close on click outside */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Drawer panel */}
      <div className="bg-white dark:bg-gray-800 w-full max-w-md relative z-10 overflow-y-auto shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {task ? 'Editar Tarea' : 'Nueva Tarea'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name", { required: "El nombre es obligatorio" })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                placeholder="Título de la tarea"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                placeholder="Descripción detallada de la tarea..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fase <span className="text-red-500">*</span>
              </label>
              <select
                {...register("project", { required: "La fase es obligatoria" })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
              >
                {phases.map(phase => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Inicio <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="start"
                  control={control}
                  rules={{ required: "La fecha de inicio es obligatoria" }}
                  render={({ field }) => (
                    <input
                      type="date"
                      value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                    />
                  )}
                />
                {errors.start && <p className="mt-1 text-sm text-red-600">{errors.start.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha Fin <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="end"
                  control={control}
                  rules={{ required: "La fecha de fin es obligatoria" }}
                  render={({ field }) => (
                    <input
                      type="date"
                      value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                    />
                  )}
                />
                {errors.end && <p className="mt-1 text-sm text-red-600">{errors.end.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Progreso (0-100%)
              </label>
              <div className="flex items-center">
                <Controller
                  name="progress"
                  control={control}
                  rules={{
                    min: { value: 0, message: "El progreso debe ser al menos 0%" },
                    max: { value: 100, message: "El progreso no puede superar 100%" }
                  }}
                  render={({ field }) => (
                    <>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={field.value}
                        onChange={field.onChange}
                        className="flex-grow h-2 rounded-full accent-indigo-600"
                      />
                      <span className="ml-3 w-12 text-center">{field.value}%</span>
                    </>
                  )}
                />
              </div>
              {errors.progress && <p className="mt-1 text-sm text-red-600">{errors.progress.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                >
                  <option value="not_started">Por Iniciar</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="delayed">Retrasado</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nivel de Riesgo
                </label>
                <select
                  {...register("riskLevel")}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                >
                  <option value="low">Bajo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Responsable
              </label>
              <input
                {...register("assignee")}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700"
                placeholder="Nombre del responsable"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dependencias
              </label>
              <Controller
                name="dependencies"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <select
                    multiple
                    value={field.value || []}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      field.onChange(selectedOptions);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 min-h-[100px]"
                  >
                    {availableDependencies.map(depTask => (
                      <option key={depTask.id} value={depTask.id}>
                        {depTask.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar múltiples tareas
              </p>
            </div>

            <div className="pt-5 flex justify-between">
              {task && (
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </button>
              )}
              <div className="flex space-x-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {task ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
