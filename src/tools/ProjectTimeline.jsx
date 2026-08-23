import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { useForm, Controller } from 'react-hook-form';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  Edit2,
  Save,
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
  ChevronLeft,
  ArrowRightCircle,
  AlertCircle,
  FileCheck,
  X,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { addDays, isAfter, differenceInDays } from 'date-fns';
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
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { useTheme } from '../contexts/ThemeContext';
import useToolData from '../hooks/useToolData';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import PhaseBadge from '../components/common/PhaseBadge';
import { formatDate, formatPercent, formatRelative } from '../lib/format';
import { fadeInUp } from '../lib/motion';

const TOOL_ID = 'project-timeline';

const DEFAULT_PHASE_NAMES = ['Define', 'Measure', 'Analyze', 'Improve', 'Control'];

// Forma canónica: la que siembra src/data/projects.js y la que ya leen
// src/components/project/EnhancedTimeline.jsx y src/components/common/TimelineSummary.jsx
// (`tools['project-timeline'].data.{phases,tasks}`). Cada tarea persiste además
// unos campos propios de esta herramienta (assignee, status, project, order)
// que esas dos pantallas ignoran sin problema, así no se pierde nada al ir y
// volver de esta herramienta.
const DEFAULT_DATA = {
  phases: DEFAULT_PHASE_NAMES.map((name) => ({ name, start: null, end: null, complete: 0 })),
  tasks: [],
};

const TASK_STATUS_META = {
  not_started: { label: 'Por iniciar', bg: 'bg-surface-sunken', text: 'text-content-secondary', dot: 'bg-neutral-400' },
  in_progress: { label: 'En progreso', bg: 'bg-warning-soft', text: 'text-warning-on', dot: 'bg-warning' },
  delayed: { label: 'Retrasada', bg: 'bg-danger-soft', text: 'text-danger-on', dot: 'bg-danger' },
  completed: { label: 'Completada', bg: 'bg-success-soft', text: 'text-success-on', dot: 'bg-success' },
};

const RISK_DOT = { high: 'bg-danger', medium: 'bg-warning', low: 'bg-success', completed: 'bg-info' };

const slugifyPhase = (name) => String(name || '').trim().toLowerCase();

const toIsoDateOnly = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/**
 * Rescate desde la ruta legada rota: `src/tools/ProjectTimeline.jsx` escribía
 * históricamente en la raíz del proyecto (`project.tasks`, `project.dependencies`)
 * en vez de `project.tools['project-timeline'].data`. Se invoca solo si la ruta
 * canónica está vacía. Normaliza al vuelo al mismo vocabulario canónico
 * (`complete`/`resources`) para que a partir de aquí exista una sola forma.
 */
function legacyRescue(rootProject) {
  if (!Array.isArray(rootProject?.tasks) || rootProject.tasks.length === 0) return null;
  const tasks = rootProject.tasks.map((rt) => {
    const resources = Array.isArray(rt.resources) ? rt.resources : rt.assignee ? [rt.assignee] : [];
    return {
      id: rt.id || `task-${Math.random().toString(36).slice(2, 10)}`,
      name: rt.name || 'Sin nombre',
      description: rt.description || '',
      start: toIsoDateOnly(rt.start ?? rt.startDate) || toIsoDateOnly(new Date()),
      end: toIsoDateOnly(rt.end ?? rt.endDate) || toIsoDateOnly(addDays(new Date(), 7)),
      dependencies: Array.isArray(rt.dependencies) ? rt.dependencies : [],
      complete: typeof rt.progress === 'number' ? rt.progress : typeof rt.complete === 'number' ? rt.complete : 0,
      resources,
      assignee: rt.assignee || resources.join(', '),
      status: rt.status || undefined,
      project: rt.project || undefined,
      order: typeof rt.order === 'number' ? rt.order : undefined,
    };
  });
  return { phases: DEFAULT_DATA.phases, tasks };
}

/**
 * Calcula el estado de riesgo de una tarea (enriquecida: `end` es un objeto Date).
 */
function calculateRiskStatus(task) {
  if (!task) return 'low';
  const today = new Date();
  const endDate = task.end instanceof Date ? task.end : task.end ? new Date(task.end) : addDays(today, 7);

  if (task.status === 'completed') return 'completed';
  if (task.status === 'delayed' || (isAfter(today, endDate) && task.progress < 100)) return 'high';
  if (differenceInDays(endDate, today) <= 3 && task.progress < 90) return 'medium';
  return 'low';
}

/** Nivel de riesgo agregado del proyecto a partir de las tareas enriquecidas. */
function calculateProjectRiskExposure(taskList) {
  const highRiskCount = taskList.filter((t) => calculateRiskStatus(t) === 'high').length;
  const mediumRiskCount = taskList.filter((t) => calculateRiskStatus(t) === 'medium').length;
  const total = taskList.length;
  if (total === 0) return 'low';
  const highPct = (highRiskCount / total) * 100;
  const mediumPct = (mediumRiskCount / total) * 100;
  if (highPct > 20 || (highRiskCount > 0 && highRiskCount === total)) return 'high';
  if (mediumPct > 30 || highRiskCount > 0) return 'medium';
  return 'low';
}

/**
 * Encuentra todos los caminos hasta `targetId` recorriendo `task.dependencies`
 * (ids de tareas predecesoras) de cada tarea — la misma fuente que ya usa
 * `EnhancedTimeline.jsx` para su propio cálculo de ruta crítica.
 */
function findAllPaths(taskList, targetId, currentPath = []) {
  const newPath = [...currentPath, targetId];
  const target = taskList.find((t) => t.id === targetId);
  const parentIds = (target?.dependencies || []).filter((id) => taskList.some((t) => t.id === id));
  if (parentIds.length === 0) return [newPath];
  let allPaths = [];
  parentIds.forEach((parentId) => {
    if (!currentPath.includes(parentId)) {
      allPaths = [...allPaths, ...findAllPaths(taskList, parentId, newPath)];
    }
  });
  return allPaths.length ? allPaths : [newPath];
}

/** Ruta crítica: la cadena de dependencias más larga entre las tareas sin sucesoras. */
function calculateCriticalPath(taskList) {
  if (taskList.length === 0) return [];
  const hasSuccessor = new Set();
  taskList.forEach((t) => (t.dependencies || []).forEach((depId) => hasSuccessor.add(depId)));
  const endTasks = taskList.filter((t) => !hasSuccessor.has(t.id));

  let criticalPath = [];
  let maxLen = 0;
  endTasks.forEach((endTask) => {
    findAllPaths(taskList, endTask.id).forEach((path) => {
      if (path.length > maxLen) {
        maxLen = path.length;
        criticalPath = path;
      }
    });
  });
  return criticalPath;
}

/** Fecha estimada de finalización: la más tardía entre las tareas de la ruta crítica. */
function estimateProjectCompletion(taskList) {
  if (taskList.length === 0) return null;
  const criticalIds = calculateCriticalPath(taskList);
  let latest = null;
  taskList
    .filter((t) => criticalIds.includes(t.id))
    .forEach((t) => {
      const d = t.end instanceof Date ? t.end : t.end ? new Date(t.end) : null;
      if (d && !Number.isNaN(d.getTime()) && (!latest || isAfter(d, latest))) latest = d;
    });
  return latest;
}

function calculatePhaseProgress(phaseTasks) {
  if (!phaseTasks.length) return 0;
  return phaseTasks.reduce((sum, task) => sum + task.progress, 0) / phaseTasks.length;
}

/**
 * Componente para visualizar y gestionar la línea de tiempo del proyecto con
 * vista Gantt, Kanban y Dashboard.
 *
 * Persistencia: vía `useToolData`, en `project.tools['project-timeline'].data`
 * (antes escribía en la raíz del proyecto — ver `legacyRescue` arriba).
 */
const ProjectTimeline = ({ projectId }) => {
  const { isDark } = useTheme();
  const { getProject } = useLeanSixSigma();
  const project = getProject(projectId);

  // El adaptador de ejemplo necesita `project.startDate` para "rebasar" las
  // fechas del ejemplo (de toolsData.js, ancladas a 2025) contra el proyecto
  // real, preservando la duración relativa de cada fase/tarea.
  const adaptExample = useCallback(
    (example, defaultData) => {
      const { title: _title, phases: exPhases = [], tasks: exTasks = [], ...rest } = example || {};
      const allDates = [...exPhases.flatMap((p) => [p.start, p.end]), ...exTasks.flatMap((tk) => [tk.start, tk.end])]
        .filter(Boolean)
        .map((d) => new Date(d))
        .filter((d) => !Number.isNaN(d.getTime()));
      const earliest = allDates.length ? new Date(Math.min(...allDates.map((d) => d.getTime()))) : new Date();
      const anchorSource = project?.startDate ? new Date(project.startDate) : new Date();
      const anchor = Number.isNaN(anchorSource.getTime()) ? new Date() : anchorSource;
      const deltaMs = anchor.getTime() - earliest.getTime();
      const shift = (iso) => {
        if (!iso) return iso;
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? iso : toIsoDateOnly(new Date(d.getTime() + deltaMs));
      };
      return {
        ...defaultData,
        ...rest,
        phases: exPhases.map((p) => ({ ...p, start: shift(p.start), end: shift(p.end) })),
        tasks: exTasks.map((tk) => ({ ...tk, start: shift(tk.start), end: shift(tk.end) })),
      };
    },
    [project?.startDate]
  );

  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, { adaptExample, legacy: legacyRescue });

  // ToolPage ya muestra un Skeleton mientras el contexto carga.
  if (!t.ready) return null;

  return <ProjectTimelineBody t={t} isDark={isDark} />;
};

/**
 * Cuerpo real del componente. Separado para poder llamar hooks incondicionalmente
 * una vez que `t.ready` es verdadero (patrón de referencia del hook compartido).
 */
const ProjectTimelineBody = ({ t, isDark }) => {
  const shouldReduceMotion = useReducedMotion();

  const [view, setView] = useState('gantt');
  const [viewMode, setViewMode] = useState(ViewMode.Week);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [zoom, setZoom] = useState(100);
  const ganttContainerRef = useRef(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [exampleMode, setExampleMode] = useState(false);
  const exampleSnapshotRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Colores para las barras del Gantt: la librería solo acepta valores CSS
  // resueltos (no `var()`), así que se leen los tokens ya calculados por el
  // navegador y se recalculan cuando cambia el tema. Mismo patrón que usa
  // `src/components/project/EnhancedTimeline.jsx` para Recharts.
  const chartColors = useMemo(() => {
    if (typeof document === 'undefined') {
      return { success: '#12793a', warning: '#b86a00', danger: '#b91c1c', info: '#4f46e5', brand: '#0c7c72', line: '#dfe4ea' };
    }
    const cssVar = (name) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;
    return {
      success: cssVar('--jc-success'),
      warning: cssVar('--jc-warning'),
      danger: cssVar('--jc-danger'),
      info: cssVar('--jc-info'),
      brand: cssVar('--jc-brand'),
      line: cssVar('--jc-line'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  // Fases con id derivado (define/measure/analyze/improve/control). Solo se
  // leen, no hay UI para editarlas: se guardan de vuelta tal cual se cargaron.
  const phasesWithId = useMemo(() => {
    const list = t.data.phases && t.data.phases.length ? t.data.phases : DEFAULT_DATA.phases;
    return list.map((p) => ({ id: slugifyPhase(p.name), name: p.name, type: 'project' }));
  }, [t.data.phases]);

  // Enriquecimiento de solo-lectura: convierte la forma canónica persistida
  // (`start`/`end` como texto ISO, `complete`, `resources`) a la forma rica que
  // usan el Gantt y el Kanban (`start`/`end` como Date, `progress`, `assignee`).
  const baseEnrichedTasks = useMemo(
    () =>
      (t.data.tasks || []).map((ct, idx) => {
        const start = ct.start ? new Date(ct.start) : new Date();
        const end = ct.end ? new Date(ct.end) : addDays(start, 7);
        const progress = typeof ct.complete === 'number' ? ct.complete : 0;
        const status = ct.status || (progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started');
        return {
          id: ct.id,
          name: ct.name || 'Sin nombre',
          description: ct.description || '',
          start,
          end,
          progress,
          status,
          assignee: ct.assignee || (Array.isArray(ct.resources) ? ct.resources.join(', ') : ''),
          resources: Array.isArray(ct.resources) ? ct.resources : [],
          dependencies: Array.isArray(ct.dependencies) ? ct.dependencies : [],
          type: 'task',
          project: ct.project || phasesWithId[0]?.id || 'define',
          order: typeof ct.order === 'number' ? ct.order : idx + 1,
        };
      }),
    [t.data.tasks, phasesWithId]
  );

  const criticalPathIds = useMemo(() => new Set(calculateCriticalPath(baseEnrichedTasks)), [baseEnrichedTasks]);

  // `tasks`: la vista completa que consume el resto del componente (Gantt,
  // Kanban, Dashboard). Es derivada, no estado: toda mutación pasa por
  // `setCanonicalTasks`, que escribe en `t.data.tasks` (forma canónica).
  const tasks = useMemo(
    () =>
      baseEnrichedTasks.map((bt) => ({
        ...bt,
        riskLevel: calculateRiskStatus(bt),
        criticalPathItem: criticalPathIds.has(bt.id),
      })),
    [baseEnrichedTasks, criticalPathIds]
  );

  const taskById = useMemo(() => new Map(tasks.map((x) => [x.id, x])), [tasks]);

  const executiveSummary = useMemo(() => {
    if (tasks.length === 0) {
      return { onTrack: 0, atRisk: 0, delayed: 0, completed: 0, total: 0, criticalPath: [], riskExposure: 'low', estimatedCompletion: null };
    }
    return {
      onTrack: tasks.filter((x) => x.status === 'in_progress' && x.riskLevel === 'low').length,
      atRisk: tasks.filter((x) => (x.status === 'in_progress' && x.riskLevel !== 'low') || x.status === 'delayed').length,
      delayed: tasks.filter((x) => x.status === 'delayed').length,
      completed: tasks.filter((x) => x.status === 'completed').length,
      total: tasks.length,
      criticalPath: Array.from(criticalPathIds),
      riskExposure: calculateProjectRiskExposure(tasks),
      estimatedCompletion: estimateProjectCompletion(tasks),
    };
  }, [tasks, criticalPathIds]);

  // --- Conversión de vuelta a la forma canónica ---------------------------

  const toCanonicalTask = useCallback((et) => {
    const resources = et.assignee
      ? String(et.assignee).split(',').map((s) => s.trim()).filter(Boolean)
      : Array.isArray(et.resources)
        ? et.resources
        : [];
    return {
      id: et.id,
      name: et.name || 'Sin nombre',
      description: et.description || '',
      start: toIsoDateOnly(et.start) || toIsoDateOnly(new Date()),
      end: toIsoDateOnly(et.end) || toIsoDateOnly(addDays(new Date(), 7)),
      dependencies: Array.isArray(et.dependencies) ? et.dependencies : [],
      complete: typeof et.progress === 'number' ? et.progress : 0,
      resources,
      assignee: et.assignee || resources.join(', '),
      status: et.status || undefined,
      project: et.project || undefined,
      order: typeof et.order === 'number' ? et.order : undefined,
    };
  }, []);

  const setCanonicalTasks = useCallback(
    (updater) => {
      t.setData((prev) => ({
        ...prev,
        tasks: typeof updater === 'function' ? updater(prev.tasks || []) : updater,
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t.setData]
  );

  const updateTask = useCallback(
    (taskId, updatedFields) => {
      setCanonicalTasks((prevCanon) =>
        prevCanon.map((ct) => {
          if (ct.id !== taskId) return ct;
          const enrichedBase = taskById.get(taskId) || {};
          return toCanonicalTask({ ...enrichedBase, ...updatedFields });
        })
      );
    },
    [setCanonicalTasks, taskById, toCanonicalTask]
  );

  const requestDeleteTask = useCallback((taskId) => {
    setConfirmAction({ type: 'delete-task', payload: taskId });
  }, []);

  const doDeleteTask = useCallback(() => {
    const taskId = confirmAction?.payload;
    if (taskId) {
      setCanonicalTasks((prev) => prev.filter((ct) => ct.id !== taskId));
      if (currentTask?.id === taskId) {
        setShowTaskDrawer(false);
        setCurrentTask(null);
      }
    }
    setConfirmAction(null);
  }, [confirmAction, setCanonicalTasks, currentTask]);

  // --- Modo edición (independiente del guardado) ---------------------------

  const toggleEdit = () => setIsEditing((v) => !v);
  const handleViewChange = (newView) => setView(newView);

  // --- Manejadores del Gantt -------------------------------------------------

  const handleTaskChange = (ganttTask) => {
    updateTask(ganttTask.id, { start: ganttTask.start, end: ganttTask.end });
  };

  const handleProgressChange = (ganttTask) => {
    const base = taskById.get(ganttTask.id);
    updateTask(ganttTask.id, {
      progress: ganttTask.progress,
      status: ganttTask.progress === 100 ? 'completed' : base?.status,
    });
  };

  const handleTaskClick = (task) => {
    setCurrentTask(task);
    setShowTaskDrawer(true);
  };

  const handleTaskDelete = (taskId) => requestDeleteTask(taskId);

  const handleViewModeChange = (mode) => setViewMode(mode);

  const getKanbanColumns = () => [
    { id: 'not_started', name: 'Por Iniciar', icon: <Clock size={16} className="mr-2" aria-hidden="true" /> },
    { id: 'in_progress', name: 'En Progreso', icon: <ArrowRightCircle size={16} className="mr-2" aria-hidden="true" /> },
    { id: 'delayed', name: 'Retrasado', icon: <AlertCircle size={16} className="mr-2" aria-hidden="true" /> },
    { id: 'completed', name: 'Completado', icon: <FileCheck size={16} className="mr-2" aria-hidden="true" /> },
  ];

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = taskById.get(active.id);
    if (!activeTask) return;
    const overTask = taskById.get(over.id);

    if (active.data.current?.type === 'task' && overTask?.status === activeTask.status) {
      setCanonicalTasks((prevCanon) => {
        const colIds = prevCanon
          .filter((ct) => (ct.status || 'not_started') === activeTask.status)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((ct) => ct.id);
        const oldIndex = colIds.indexOf(active.id);
        const newIndex = colIds.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return prevCanon;
        const newOrderIds = arrayMove(colIds, oldIndex, newIndex);
        return prevCanon.map((ct) =>
          (ct.status || 'not_started') === activeTask.status ? { ...ct, order: newOrderIds.indexOf(ct.id) + 1 } : ct
        );
      });
      return;
    }

    if (String(active.id).startsWith('task-') && String(over.id).startsWith('column-')) {
      const newStatus = String(over.id).replace('column-', '');
      const maxOrder = tasks.filter((x) => x.status === newStatus).length;
      updateTask(active.id, {
        status: newStatus,
        order: maxOrder + 1,
        progress: newStatus === 'completed' ? 100 : activeTask.progress,
      });
    }
  };

  // --- Kanban: tarjeta arrastrable -------------------------------------------

  const SortableKanbanCard = ({ task }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: task.id,
      data: { type: 'task', task },
    });
    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(1.05)` : undefined,
      transition: transition || 'transform 200ms',
      opacity: isDragging ? 0.5 : 1,
    };
    const statusMeta = TASK_STATUS_META[task.status] || TASK_STATUS_META.not_started;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="mb-3 cursor-move rounded-md bg-surface p-3 shadow-xs transition-shadow hover:shadow-sm"
        onClick={() => handleTaskClick(task)}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <h4 className="font-medium text-content">{task.name}</h4>
          <span
            className={`h-3 w-3 shrink-0 rounded-full ${RISK_DOT[task.riskLevel] || 'bg-neutral-400'}`}
            role="img"
            aria-label={`Riesgo ${task.riskLevel}`}
          />
        </div>

        {task.description && <p className="mb-2 line-clamp-2 text-sm text-content-secondary">{task.description}</p>}

        <div className="mb-2 flex items-center text-xs text-content-muted">
          <Calendar size={12} className="mr-1" aria-hidden="true" />
          <span className="tabular-nums">
            {formatDate(task.start)} – {formatDate(task.end)}
          </span>
        </div>

        {task.assignee && (
          <div className="mb-2 flex items-center text-xs">
            <Users size={12} className="mr-1 text-content-muted" aria-hidden="true" />
            <span className="rounded bg-info-soft px-2 py-1 text-info-on">{task.assignee}</span>
          </div>
        )}

        <div className="mt-2 h-2 w-full rounded-full bg-surface-sunken">
          <div className={`h-2 rounded-full ${statusMeta.dot}`} style={{ width: `${task.progress}%` }} />
        </div>
        <span className="mt-1 block text-right text-xs tabular-nums text-content-muted">{formatPercent(task.progress, 0)}</span>

        {isEditing && (
          <div className="mt-2 flex justify-end space-x-2">
            <button
              type="button"
              aria-label="Editar tarea"
              className="rounded p-1 text-content-secondary hover:bg-surface-sunken"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentTask(task);
                setShowTaskDrawer(true);
              }}
            >
              <Edit2 size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Eliminar tarea"
              className="rounded p-1 text-content-secondary hover:bg-surface-sunken"
              onClick={(e) => {
                e.stopPropagation();
                requestDeleteTask(task.id);
              }}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderKanbanView = () => {
    const columns = getKanbanColumns();
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.id);
            const sortedTasks = [...columnTasks].sort((a, b) => b.progress - a.progress);
            return (
              <div key={column.id} id={`column-${column.id}`} className="flex min-h-[200px] flex-col rounded-lg bg-surface-sunken p-4">
                <h3 className="mb-4 flex items-center justify-between font-bold text-content">
                  <span className="flex items-center">
                    {column.icon}
                    {column.name}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-1 text-xs tabular-nums text-content-secondary">{columnTasks.length}</span>
                </h3>

                <div className="flex-grow space-y-3">
                  <SortableContext items={sortedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                    {sortedTasks.map((task) => (
                      <SortableKanbanCard key={task.id} task={task} />
                    ))}
                  </SortableContext>
                </div>

                {isEditing && column.id === 'not_started' && (
                  <button
                    type="button"
                    className="mt-3 flex w-full items-center justify-center rounded-md border-2 border-dashed border-line py-2 text-content-muted hover:bg-surface"
                    onClick={() => {
                      setCurrentTask(null);
                      setShowTaskDrawer(true);
                    }}
                  >
                    <Plus size={16} className="mr-1" aria-hidden="true" />
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

  const renderDashboardView = () => {
    const phaseProgress = phasesWithId
      .map((phase) => {
        const phaseTasks = tasks.filter((tk) => tk.project === phase.id);
        return { ...phase, progress: calculatePhaseProgress(phaseTasks), taskCount: phaseTasks.length };
      })
      .filter((phase) => phase.taskCount > 0);

    const totalProgress = tasks.length > 0 ? tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length : 0;
    const highRiskTasks = tasks.filter((tk) => calculateRiskStatus(tk) === 'high');

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="col-span-1 rounded-lg bg-surface p-6 shadow-xs md:col-span-2">
          <h3 className="mb-4 text-xl font-bold text-content">Estado General del Proyecto</h3>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-content-muted">Progreso Total</p>
              <p className="text-3xl font-bold tabular-nums text-content">{formatPercent(totalProgress, 0)}</p>
            </div>
            <div>
              <p className="text-sm text-content-muted">Riesgo Global</p>
              <div className="flex items-center">
                <span className={`mr-2 h-3 w-3 rounded-full ${RISK_DOT[executiveSummary.riskExposure] || 'bg-neutral-400'}`} aria-hidden="true" />
                <p className="font-semibold text-content">
                  {executiveSummary.riskExposure === 'high' ? 'Alto' : executiveSummary.riskExposure === 'medium' ? 'Medio' : 'Bajo'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-content-muted">Fecha Estimada</p>
              <p className="font-semibold tabular-nums text-content">
                {executiveSummary.estimatedCompletion ? formatDate(executiveSummary.estimatedCompletion) : 'No disponible'}
              </p>
            </div>
          </div>

          <div className="mb-6 h-4 w-full rounded-full bg-surface-sunken">
            <div className="h-4 rounded-full bg-brand" style={{ width: `${totalProgress}%` }} />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-success-soft p-4">
              <p className="text-sm text-content-secondary">En Tiempo</p>
              <p className="text-2xl font-bold tabular-nums text-success-on">{executiveSummary.onTrack}</p>
            </div>
            <div className="rounded-lg bg-warning-soft p-4">
              <p className="text-sm text-content-secondary">En Riesgo</p>
              <p className="text-2xl font-bold tabular-nums text-warning-on">{executiveSummary.atRisk}</p>
            </div>
            <div className="rounded-lg bg-danger-soft p-4">
              <p className="text-sm text-content-secondary">Retrasadas</p>
              <p className="text-2xl font-bold tabular-nums text-danger-on">{executiveSummary.delayed}</p>
            </div>
            <div className="rounded-lg bg-info-soft p-4">
              <p className="text-sm text-content-secondary">Completadas</p>
              <p className="text-2xl font-bold tabular-nums text-info-on">{executiveSummary.completed}</p>
            </div>
          </div>

          {executiveSummary.criticalPath.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center font-semibold text-content">
                <AlertTriangle size={16} className="mr-2 text-warning" aria-hidden="true" />
                Ruta Crítica
              </h4>
              <div className="rounded-lg bg-warning-soft p-3">
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {executiveSummary.criticalPath.map((taskId, index) => {
                    const task = taskById.get(taskId);
                    return task ? (
                      <span key={taskId} className="flex items-center">
                        <button
                          type="button"
                          className="whitespace-nowrap rounded-md bg-surface px-3 py-1 text-sm text-content shadow-xs"
                          onClick={() => handleTaskClick(task)}
                        >
                          {task.name}
                        </button>
                        {index < executiveSummary.criticalPath.length - 1 && (
                          <ChevronRight size={16} className="ml-2 shrink-0 text-warning" aria-hidden="true" />
                        )}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-surface p-6 shadow-xs">
          <h3 className="mb-4 text-xl font-bold text-content">Progreso por Fase</h3>
          <div className="space-y-4">
            {phaseProgress.map((phase) => (
              <div key={phase.id}>
                <div className="mb-1 flex items-center justify-between">
                  <PhaseBadge phase={phase.name} size="sm" />
                  <p className="text-sm tabular-nums text-content-secondary">{formatPercent(phase.progress, 0)}</p>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-sunken">
                  <div className="h-2.5 rounded-full bg-brand" style={{ width: `${phase.progress}%` }} />
                </div>
                <p className="mt-1 text-xs tabular-nums text-content-muted">{phase.taskCount} tareas</p>
              </div>
            ))}
            {phaseProgress.length === 0 && <p className="text-sm text-content-muted">Sin tareas asignadas a fases todavía.</p>}
          </div>
        </div>

        <div className="rounded-lg bg-surface p-6 shadow-xs">
          <h3 className="mb-4 flex items-center text-xl font-bold text-content">
            <AlertCircle size={20} className="mr-2 text-danger" aria-hidden="true" />
            Tareas de Alto Riesgo
          </h3>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {highRiskTasks.map((task) => (
              <button
                type="button"
                key={task.id}
                className="w-full rounded-md border border-danger/30 bg-danger-soft p-3 text-left hover:bg-danger/15"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-content">{task.name}</p>
                    <p className="text-sm tabular-nums text-content-secondary">
                      {formatDate(task.end)} • {formatPercent(task.progress, 0)} completado
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-danger-soft px-2 py-1 text-xs text-danger-on">
                    {task.status === 'delayed' ? 'Retrasada' : 'En Riesgo'}
                  </span>
                </div>
              </button>
            ))}
            {highRiskTasks.length === 0 && <p className="py-4 text-center text-content-muted">No hay tareas de alto riesgo</p>}
          </div>
        </div>
      </div>
    );
  };

  // --- Zoom / desplazamiento del Gantt --------------------------------------

  const handleZoomChange = (newZoom) => setZoom(Math.max(50, Math.min(200, newZoom)));

  const scrollLeft = () => ganttContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => ganttContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      handleZoomChange(zoom + (e.deltaY > 0 ? -5 : 5));
    }
  };

  const calculateColumnWidth = () => {
    const baseWidth = viewMode === ViewMode.Month ? 160 : viewMode === ViewMode.Week ? 80 : 40;
    return Math.max(20, Math.round((baseWidth * zoom) / 100));
  };

  const calculateListCellWidth = () => Math.max(150, Math.round((240 * zoom) / 100));

  // Overrides de CSS para el DOM interno de gantt-task-react (no expone
  // className/style en esos nodos). Se inyecta imperativamente (elemento de
  // hoja de estilos en el head) en vez de un bloque de estilo en el JSX, para
  // no dejar CSS muerto ni recrear el nodo en cada render; solo se actualiza
  // cuando cambian zoom o la vista.
  useEffect(() => {
    const styleId = 'project-timeline-gantt-overrides';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const fontSize = Math.max(10, (14 * zoom) / 100);
    const headerFontSize = Math.max(9, (12 * zoom) / 100);
    const rotate = zoom < 80;
    styleEl.textContent = `
      .gantt-container { position: relative; overflow: hidden; }
      .gantt__bar .bar-text { white-space: normal; overflow-wrap: break-word; text-align: left; padding-left: 4px; font-size: ${fontSize}px; }
      .gantt__task-list-header-cell, .gantt__task-list-item { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .gantt-header-title {
        writing-mode: ${rotate ? 'vertical-rl' : 'horizontal-tb'};
        transform: ${rotate ? 'rotate(180deg)' : 'none'};
        transform-origin: center;
        height: ${rotate ? '100px' : 'auto'};
        padding: 4px;
        font-size: ${headerFontSize}px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
      }
    `;
  }, [zoom, viewMode]);

  const getTaskStyles = (task) => {
    const base = {
      backgroundColor: chartColors.brand,
      backgroundSelectedColor: chartColors.brand,
      progressColor: chartColors.info,
      progressSelectedColor: chartColors.info,
      textColor: '#ffffff',
      arrowColor: chartColors.line,
      handleWidth: 8,
      borderRadius: 4,
    };
    if (task.status === 'completed') {
      return { ...base, backgroundColor: chartColors.success, backgroundSelectedColor: chartColors.success, progressColor: chartColors.success, progressSelectedColor: chartColors.success };
    }
    if (task.status === 'delayed' || task.riskLevel === 'high') {
      return { ...base, backgroundColor: chartColors.danger, backgroundSelectedColor: chartColors.danger, progressColor: chartColors.danger, progressSelectedColor: chartColors.danger };
    }
    if (task.riskLevel === 'medium') {
      return { ...base, backgroundColor: chartColors.warning, backgroundSelectedColor: chartColors.warning, progressColor: chartColors.warning, progressSelectedColor: chartColors.warning };
    }
    return base;
  };

  const formatTasksForGantt = useMemo(() => {
    const tasksByPhase = {};
    phasesWithId.forEach((phase) => {
      tasksByPhase[phase.id] = [];
    });
    const fallbackPhaseId = phasesWithId[0]?.id;
    tasks.forEach((task) => {
      const phaseId = task.project || fallbackPhaseId;
      const bucket = tasksByPhase[phaseId] || tasksByPhase[fallbackPhaseId];
      if (bucket) bucket.push(task);
    });

    const resultTasks = [];
    phasesWithId.forEach((phase) => {
      const phaseTasks = tasksByPhase[phase.id] || [];
      if (phaseTasks.length === 0) return;

      const starts = phaseTasks.map((tk) => tk.start);
      const ends = phaseTasks.map((tk) => tk.end);
      const start = new Date(Math.min(...starts.map((d) => d.getTime())));
      const end = new Date(Math.max(...ends.map((d) => d.getTime())));

      resultTasks.push({
        id: phase.id,
        name: phase.name,
        type: 'project',
        start,
        end,
        progress: calculatePhaseProgress(phaseTasks),
        hideChildren: false,
        styles: {
          backgroundColor: chartColors.brand,
          backgroundSelectedColor: chartColors.brand,
          progressColor: chartColors.info,
          progressSelectedColor: chartColors.info,
          borderRadius: 4,
        },
      });

      phaseTasks.forEach((task) => {
        resultTasks.push({
          id: task.id,
          name: task.name,
          type: 'task',
          start: task.start,
          end: task.end,
          progress: task.progress,
          project: phase.id,
          dependencies: task.dependencies,
          styles: getTaskStyles(task),
          isDisabled: !isEditing,
        });
      });
    });

    return resultTasks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, phasesWithId, isEditing, chartColors]);

  // --- Ver un ejemplo / confirmaciones --------------------------------------

  const closeConfirm = () => setConfirmAction(null);

  const doLoadExample = () => {
    exampleSnapshotRef.current = t.data;
    t.loadExample(0);
    setExampleMode(true);
    closeConfirm();
  };

  const handleViewExampleClick = () => {
    if (t.isDirty) {
      setConfirmAction({ type: 'load-example' });
      return;
    }
    doLoadExample();
  };

  const handleAdoptExample = () => {
    t.save();
    setExampleMode(false);
  };

  const handleDiscardExample = () => {
    if (exampleSnapshotRef.current) t.setData(exampleSnapshotRef.current);
    setExampleMode(false);
  };

  const handleCancelClick = () => setConfirmAction({ type: 'discard' });
  const doDiscard = () => {
    t.discard();
    closeConfirm();
  };

  // --- Estado de guardado (texto vivo, se refresca cada 60s) ----------------

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  let saveStatus = { text: 'Sin cambios', tone: 'text-content-muted', dotClass: 'bg-neutral-400' };
  if (t.error) {
    saveStatus = { text: 'No se pudo guardar', tone: 'text-danger', icon: AlertTriangle };
  } else if (t.isSaving) {
    saveStatus = { text: 'Guardando cambios…', tone: 'text-content-secondary', icon: Loader2, spin: true };
  } else if (t.justSaved) {
    saveStatus = { text: 'Guardado', tone: 'text-success', icon: CheckCircle };
  } else if (t.isDirty) {
    saveStatus = { text: 'Cambios sin guardar', tone: 'text-warning', dotClass: 'bg-warning' };
  } else if (t.lastSavedAt) {
    saveStatus = { text: `Guardado ${formatRelative(t.lastSavedAt)}`, tone: 'text-success', icon: CheckCircle };
  }

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      {/* Barra de guardado / ejemplo */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <p role="status" aria-live="polite" className={`flex items-center gap-2 text-sm ${saveStatus.tone}`}>
          {saveStatus.icon ? (
            <saveStatus.icon size={14} className={saveStatus.spin ? 'animate-spin' : ''} aria-hidden="true" />
          ) : (
            <span className={`h-1.5 w-1.5 rounded-full ${saveStatus.dotClass}`} aria-hidden="true" />
          )}
          {saveStatus.text}
          {t.error && (
            <button type="button" className="ml-1 underline underline-offset-2" onClick={() => t.save()}>
              Reintentar
            </button>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && (
            <GradientButton variant="outline" size="sm" onClick={handleViewExampleClick}>
              Ver un ejemplo
            </GradientButton>
          )}
          {t.isDirty && (
            <GradientButton variant="ghost" size="sm" onClick={handleCancelClick}>
              Cancelar
            </GradientButton>
          )}
          <GradientButton
            variant="success"
            size="sm"
            disabled={!t.isDirty || t.isSaving}
            onClick={() => t.save()}
            leadingIcon={<Save size={14} aria-hidden="true" />}
          >
            Guardar
          </GradientButton>
        </div>
      </div>

      {exampleMode && (
        <motion.div
          initial={shouldReduceMotion ? false : fadeInUp.hidden}
          animate={fadeInUp.visible}
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 ring-1 ring-brand/20"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm text-content">
            <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info-on">Ejemplo</span>
            <span>{t.exampleTitles[0]}. Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.</span>
          </div>
          <div className="flex items-center gap-2">
            <GradientButton size="sm" variant="outline" onClick={handleDiscardExample}>
              Deshacer
            </GradientButton>
            <GradientButton size="sm" variant="solid" onClick={handleAdoptExample}>
              Usar como punto de partida
            </GradientButton>
          </div>
        </motion.div>
      )}

      {/* Controles superiores */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex overflow-hidden rounded-lg bg-surface-sunken">
            <button
              type="button"
              className={`flex items-center px-3 py-2 text-sm ${view === 'gantt' ? 'bg-brand text-brand-contrast' : 'text-content-secondary hover:bg-surface'}`}
              onClick={() => handleViewChange('gantt')}
            >
              <GanttChartSquare size={16} className="mr-2" aria-hidden="true" />
              Gantt
            </button>
            <button
              type="button"
              className={`flex items-center px-3 py-2 text-sm ${view === 'kanban' ? 'bg-brand text-brand-contrast' : 'text-content-secondary hover:bg-surface'}`}
              onClick={() => handleViewChange('kanban')}
            >
              <KanbanSquare size={16} className="mr-2" aria-hidden="true" />
              Kanban
            </button>
            <button
              type="button"
              className={`flex items-center px-3 py-2 text-sm ${view === 'dashboard' ? 'bg-brand text-brand-contrast' : 'text-content-secondary hover:bg-surface'}`}
              onClick={() => handleViewChange('dashboard')}
            >
              <PieChart size={16} className="mr-2" aria-hidden="true" />
              Dashboard
            </button>
          </div>

          {view === 'gantt' && (
            <>
              <select
                value={viewMode}
                onChange={(e) => handleViewModeChange(e.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-content"
                aria-label="Escala de tiempo del Gantt"
              >
                <option value={ViewMode.Day}>Día</option>
                <option value={ViewMode.Week}>Semana</option>
                <option value={ViewMode.Month}>Mes</option>
              </select>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom - 10)}
                  className="rounded-full bg-surface-sunken p-2 text-content-secondary hover:bg-line-subtle"
                  aria-label="Reducir zoom"
                >
                  <ZoomOut size={16} aria-hidden="true" />
                </button>
                <div className="text-sm font-medium tabular-nums text-content">{zoom}%</div>
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom + 10)}
                  className="rounded-full bg-surface-sunken p-2 text-content-secondary hover:bg-line-subtle"
                  aria-label="Aumentar zoom"
                >
                  <ZoomIn size={16} aria-hidden="true" />
                </button>

                <div className="mx-1 h-6 w-px bg-line" />

                <button
                  type="button"
                  onClick={scrollLeft}
                  className="rounded-full bg-surface-sunken p-2 text-content-secondary hover:bg-line-subtle"
                  aria-label="Desplazar a la izquierda"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={scrollRight}
                  className="rounded-full bg-surface-sunken p-2 text-content-secondary hover:bg-line-subtle"
                  aria-label="Desplazar a la derecha"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <GradientButton
            size="sm"
            leadingIcon={<Plus size={16} aria-hidden="true" />}
            onClick={() => {
              setCurrentTask(null);
              setShowTaskDrawer(true);
            }}
          >
            Nueva Tarea
          </GradientButton>

          <GradientButton
            size="sm"
            variant={isEditing ? 'solid' : 'outline'}
            leadingIcon={isEditing ? <CheckCircle size={16} aria-hidden="true" /> : <Edit2 size={16} aria-hidden="true" />}
            onClick={toggleEdit}
          >
            {isEditing ? 'Terminar edición' : 'Editar'}
          </GradientButton>
        </div>
      </div>

      {/* Vista principal */}
      <div className="relative min-h-0 flex-grow">
        <div className={view === 'gantt' ? 'block h-full overflow-hidden' : 'hidden'} onWheel={handleWheel}>
          {tasks.length > 0 ? (
            <div ref={ganttContainerRef} className="h-full overflow-auto">
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
                fontSize={`${Math.max(10, (14 * zoom) / 100)}px`}
                rowHeight={Math.max(30, (50 * zoom) / 100)}
                headerHeight={50}
                arrowColor={chartColors.line}
                todayColor="rgba(99, 102, 241, 0.15)"
                projectProgressBar
                projectProgressColors={{ background: chartColors.brand, progress: chartColors.info }}
                TooltipContent={({ task }) => (
                  <div className="rounded-lg border border-line bg-surface p-3 shadow-sm">
                    <h4 className="mb-2 text-sm font-medium text-content">{task.name}</h4>
                    <div className="space-y-1 text-xs">
                      <p className="tabular-nums text-content-muted">
                        <span className="font-medium">Inicio:</span> {formatDate(task.start)}
                      </p>
                      <p className="tabular-nums text-content-muted">
                        <span className="font-medium">Fin:</span> {formatDate(task.end)}
                      </p>
                      <p className="tabular-nums text-content-muted">
                        <span className="font-medium">Progreso:</span> {formatPercent(task.progress, 0)}
                      </p>
                      {task.type === 'task' && (
                        <p
                          className={
                            task.status === 'completed'
                              ? 'font-medium text-success'
                              : task.status === 'delayed'
                                ? 'font-medium text-danger'
                                : task.status === 'in_progress'
                                  ? 'font-medium text-info'
                                  : 'font-medium text-content-secondary'
                          }
                        >
                          {task.status === 'completed'
                            ? 'Completado'
                            : task.status === 'delayed'
                              ? 'Retrasado'
                              : task.status === 'in_progress'
                                ? 'En Progreso'
                                : 'Por Iniciar'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              />
            </div>
          ) : (
            <EmptyState
              title="Del Define al Control, el proyecto necesita ruta"
              description="Planifica las fases DMAIC y sus tareas con fechas y responsables."
              action={
                <GradientButton
                  leadingIcon={<Plus size={16} aria-hidden="true" />}
                  onClick={() => {
                    setCurrentTask(null);
                    setShowTaskDrawer(true);
                  }}
                >
                  Planificar fases
                </GradientButton>
              }
              secondaryAction={
                t.hasExamples && (
                  <GradientButton variant="outline" onClick={handleViewExampleClick}>
                    Ver un ejemplo
                  </GradientButton>
                )
              }
            />
          )}
        </div>

        <div className={view === 'kanban' ? 'block' : 'hidden'}>{renderKanbanView()}</div>
        <div className={view === 'dashboard' ? 'block' : 'hidden'}>{renderDashboardView()}</div>
      </div>

      {view !== 'dashboard' && tasks.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-surface p-4 shadow-xs sm:grid-cols-4">
          <div className="text-center">
            <p className="text-sm text-content-muted">En Tiempo</p>
            <p className="text-2xl font-semibold tabular-nums text-success">{executiveSummary.onTrack}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-content-muted">En Riesgo</p>
            <p className="text-2xl font-semibold tabular-nums text-warning">{executiveSummary.atRisk}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-content-muted">Retrasadas</p>
            <p className="text-2xl font-semibold tabular-nums text-danger">{executiveSummary.delayed}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-content-muted">Completadas</p>
            <p className="text-2xl font-semibold tabular-nums text-info">{executiveSummary.completed}</p>
          </div>
        </div>
      )}

      {showTaskDrawer && (
        <TaskDrawer
          task={currentTask}
          phases={phasesWithId}
          allTasks={tasks}
          onSave={(taskData) => {
            const canon = toCanonicalTask({ ...taskData, id: taskData.id || `task-${Date.now()}` });
            setCanonicalTasks((prev) => {
              const exists = prev.some((ct) => ct.id === canon.id);
              return exists ? prev.map((ct) => (ct.id === canon.id ? canon : ct)) : [...prev, canon];
            });
            setShowTaskDrawer(false);
            setCurrentTask(null);
          }}
          onDelete={(taskId) => requestDeleteTask(taskId)}
          onClose={() => {
            setShowTaskDrawer(false);
            setCurrentTask(null);
          }}
        />
      )}

      <Modal
        open={Boolean(confirmAction)}
        onClose={closeConfirm}
        size="sm"
        title={
          confirmAction?.type === 'load-example'
            ? '¿Cargar el ejemplo?'
            : confirmAction?.type === 'discard'
              ? '¿Descartar los cambios sin guardar?'
              : confirmAction?.type === 'delete-task'
                ? '¿Eliminar esta tarea?'
                : ''
        }
        description={
          confirmAction?.type === 'load-example'
            ? 'Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar.'
            : confirmAction?.type === 'delete-task'
              ? 'Esta acción no se puede deshacer.'
              : undefined
        }
        footer={
          confirmAction?.type === 'load-example' ? (
            <>
              <GradientButton variant="outline" onClick={closeConfirm}>
                Cancelar
              </GradientButton>
              <GradientButton variant="solid" onClick={doLoadExample}>
                Ver el ejemplo
              </GradientButton>
            </>
          ) : confirmAction?.type === 'discard' ? (
            <>
              <GradientButton variant="outline" onClick={closeConfirm}>
                Seguir editando
              </GradientButton>
              <GradientButton variant="danger" onClick={doDiscard}>
                Descartar
              </GradientButton>
            </>
          ) : confirmAction?.type === 'delete-task' ? (
            <>
              <GradientButton variant="outline" onClick={closeConfirm}>
                Cancelar
              </GradientButton>
              <GradientButton variant="danger" onClick={doDeleteTask}>
                Eliminar
              </GradientButton>
            </>
          ) : null
        }
      />
    </div>
  );
};

export default ProjectTimeline;

// --- Panel lateral de edición/creación de tarea (react-hook-form) ------------

const TaskDrawer = ({ task, phases, allTasks, onSave, onDelete, onClose }) => {
  const [dateError, setDateError] = useState('');
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues:
      task || {
        name: '',
        description: '',
        start: new Date(),
        end: addDays(new Date(), 7),
        progress: 0,
        type: 'task',
        project: phases[0]?.id || 'define',
        status: 'not_started',
        riskLevel: 'low',
        assignee: '',
        dependencies: [],
      },
  });

  const onSubmit = (data) => {
    if (data.end < data.start) {
      setDateError('La fecha fin debe ser igual o posterior a la fecha de inicio');
      return;
    }
    setDateError('');
    onSave({ ...data, id: task?.id || `task-${Date.now()}` });
  };

  const availableDependencies = allTasks.filter((tk) => !task || tk.id !== task.id);
  const inputClass =
    'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-content shadow-xs focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';
  const labelClass = 'mb-1 block text-sm font-medium text-content-secondary';

  return (
    <div className="fixed inset-0 z-modal flex justify-end bg-[rgb(12_17_22_/_0.5)]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md overflow-y-auto bg-surface shadow-xl">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-content">{task ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
            <button type="button" onClick={onClose} aria-label="Cerrar panel de tarea" className="rounded-full p-2 text-content-secondary hover:bg-surface-sunken">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="td-name">
                Nombre <span className="text-danger">*</span>
              </label>
              <input id="td-name" {...register('name', { required: 'El nombre es obligatorio' })} className={inputClass} placeholder="Título de la tarea" />
              {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
            </div>

            <div>
              <label className={labelClass} htmlFor="td-description">
                Descripción
              </label>
              <textarea id="td-description" {...register('description')} rows={3} className={inputClass} placeholder="Descripción detallada de la tarea..." />
            </div>

            <div>
              <label className={labelClass} htmlFor="td-project">
                Fase <span className="text-danger">*</span>
              </label>
              <select id="td-project" {...register('project', { required: 'La fase es obligatoria' })} className={inputClass}>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Fecha Inicio <span className="text-danger">*</span>
                </label>
                <Controller
                  name="start"
                  control={control}
                  rules={{ required: 'La fecha de inicio es obligatoria' }}
                  render={({ field }) => (
                    <input
                      type="date"
                      value={field.value instanceof Date ? formatDate(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className={inputClass}
                    />
                  )}
                />
                {errors.start && <p className="mt-1 text-sm text-danger">{errors.start.message}</p>}
              </div>
              <div>
                <label className={labelClass}>
                  Fecha Fin <span className="text-danger">*</span>
                </label>
                <Controller
                  name="end"
                  control={control}
                  rules={{ required: 'La fecha de fin es obligatoria' }}
                  render={({ field }) => (
                    <input
                      type="date"
                      value={field.value instanceof Date ? formatDate(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      className={inputClass}
                    />
                  )}
                />
                {errors.end && <p className="mt-1 text-sm text-danger">{errors.end.message}</p>}
              </div>
            </div>
            {dateError && <p className="text-sm text-danger">{dateError}</p>}

            <div>
              <label className={labelClass}>Progreso (0-100%)</label>
              <div className="flex items-center">
                <Controller
                  name="progress"
                  control={control}
                  rules={{ min: { value: 0, message: 'El progreso debe ser al menos 0%' }, max: { value: 100, message: 'El progreso no puede superar 100%' } }}
                  render={({ field }) => (
                    <>
                      <input type="range" min="0" max="100" value={field.value} onChange={field.onChange} className="h-2 flex-grow rounded-full accent-brand" />
                      <span className="ml-3 w-14 text-center text-sm tabular-nums text-content">{field.value}%</span>
                    </>
                  )}
                />
              </div>
              {errors.progress && <p className="mt-1 text-sm text-danger">{errors.progress.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="td-status">
                  Estado
                </label>
                <select id="td-status" {...register('status')} className={inputClass}>
                  <option value="not_started">Por Iniciar</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="delayed">Retrasado</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="td-risk">
                  Nivel de Riesgo
                </label>
                <select id="td-risk" {...register('riskLevel')} className={inputClass}>
                  <option value="low">Bajo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="td-assignee">
                Responsable
              </label>
              <input id="td-assignee" {...register('assignee')} className={inputClass} placeholder="Nombre del responsable" />
            </div>

            <div>
              <label className={labelClass} htmlFor="td-dependencies">
                Dependencias
              </label>
              <Controller
                name="dependencies"
                control={control}
                defaultValue={[]}
                render={({ field }) => (
                  <select
                    id="td-dependencies"
                    multiple
                    value={field.value || []}
                    onChange={(e) => field.onChange(Array.from(e.target.selectedOptions, (option) => option.value))}
                    className={`${inputClass} min-h-[100px]`}
                  >
                    {availableDependencies.map((depTask) => (
                      <option key={depTask.id} value={depTask.id}>
                        {depTask.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="mt-1 text-xs text-content-muted">Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar múltiples tareas</p>
            </div>

            <div className="flex justify-between pt-5">
              {task && (
                <GradientButton type="button" variant="outline" size="sm" leadingIcon={<Trash2 size={16} aria-hidden="true" />} onClick={() => onDelete(task.id)}>
                  Eliminar
                </GradientButton>
              )}
              <div className="ml-auto flex space-x-3">
                <GradientButton type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancelar
                </GradientButton>
                <GradientButton type="submit" size="sm">
                  {task ? 'Actualizar' : 'Crear'}
                </GradientButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
