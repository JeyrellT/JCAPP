import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Calendar, AlertTriangle, BarChart2,
  Filter, Search, Download, GitBranch,
} from 'lucide-react';
import { addDays, isAfter, isBefore, isSameDay, differenceInCalendarDays, parseISO } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid, Cell, Scatter,
} from 'recharts';
import { formatDate, isOverdue } from '../../lib/format';
import { exportToJson } from '../../utils/export';

/**
 * @deprecated No se monta en ninguna parte de la aplicación. Duplica
 * `src/tools/ProjectTimeline.jsx` (enrutada, persistente y la que el usuario
 * realmente usa). Se conserva reparada — apuntada a la ruta real de datos
 * (`project.tools['project-timeline'].data`), migrada a tokens del sistema
 * de diseño y sin campos inventados (ya no lee `task.priority`/`task.riskLevel`,
 * que no existen en ningún proyecto) — como candidata a consolidación o
 * borrado en un ciclo futuro; esa decisión le corresponde al usuario, no a
 * este ciclo. Ver brief Ciclo 2, sección 0.2 punto 12 y sección 0.8.
 *
 * @param {Object} props
 * @param {string} props.projectId
 */
const EnhancedTimeline = ({ projectId }) => {
  const { isDark } = useTheme();
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const entry = project?.tools?.['project-timeline'];

  // Estado
  const [view, setView] = useState('gantt'); // 'gantt', 'kanban', 'risk'
  const [tasks, setTasks] = useState([]);
  const [criticalPath, setCriticalPath] = useState([]);
  const [filter, setFilter] = useState({ status: 'all', resource: 'all', search: '' });

  // Colores para recharts: los atributos de presentación SVG no resuelven var(),
  // así que se leen los tokens ya calculados por el navegador. Se recalculan
  // cuando cambia el tema.
  const chartColors = useMemo(() => {
    if (typeof document === 'undefined') {
      return { danger: '#b91c1c', warning: '#b86a00', success: '#12793a', brand: '#0c7c72', line: '#dfe4ea' };
    }
    const cssVar = (name) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;
    return {
      danger: cssVar('--jc-danger'),
      warning: cssVar('--jc-warning'),
      success: cssVar('--jc-success'),
      brand: cssVar('--jc-brand'),
      line: cssVar('--jc-line'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  /**
   * Method del Camino Crítico (CPM): calcula inicio/fin temprano, inicio/fin
   * tardío y holgura por tarea. La duración se deriva de `start`/`end`
   * (los datos reales no traen `duration`); las dependencias vienen del
   * array `dependencies` de cada tarea (ids de tareas predecesoras), no de
   * una lista aparte a nivel de proyecto (esa lista nunca existió en los datos).
   */
  const calculateCriticalPath = useCallback((taskList) => {
    if (!taskList?.length) {
      setCriticalPath([]);
      return taskList;
    }

    const workingTasks = taskList.map((task) => {
      const duration = task.start && task.end ? Math.max(1, differenceInCalendarDays(parseISO(task.end), parseISO(task.start))) : 1;
      return { ...task, duration, earlyStart: 0, earlyFinish: duration, lateStart: 0, lateFinish: 0, slack: 0 };
    });

    const taskMap = Object.fromEntries(workingTasks.map((t) => [t.id, t]));
    const predecessors = {};
    const successors = {};
    workingTasks.forEach((t) => {
      predecessors[t.id] = [];
      successors[t.id] = [];
    });
    workingTasks.forEach((t) => {
      (t.dependencies || []).forEach((depId) => {
        if (predecessors[t.id] && taskMap[depId]) predecessors[t.id].push(depId);
        if (successors[depId]) successors[depId].push(t.id);
      });
    });

    // Forward pass
    const visitedForward = new Set();
    const processForward = (task) => {
      if (visitedForward.has(task.id)) return;
      const preds = predecessors[task.id] || [];
      if (preds.length > 0) {
        let maxEarlyFinish = 0;
        preds.forEach((predId) => {
          if (!visitedForward.has(predId) && taskMap[predId]) processForward(taskMap[predId]);
          maxEarlyFinish = Math.max(maxEarlyFinish, taskMap[predId]?.earlyFinish || 0);
        });
        task.earlyStart = maxEarlyFinish;
        task.earlyFinish = task.earlyStart + task.duration;
      }
      visitedForward.add(task.id);
      (successors[task.id] || []).forEach((succId) => taskMap[succId] && processForward(taskMap[succId]));
    };
    workingTasks.filter((t) => (predecessors[t.id] || []).length === 0).forEach(processForward);

    const projectEnd = Math.max(...workingTasks.map((t) => t.earlyFinish));

    // Backward pass
    const visitedBackward = new Set();
    const processBackward = (task) => {
      if (visitedBackward.has(task.id)) return;
      const succs = successors[task.id] || [];
      if (succs.length > 0) {
        let minLateStart = Infinity;
        succs.forEach((succId) => {
          if (!visitedBackward.has(succId) && taskMap[succId]) processBackward(taskMap[succId]);
          minLateStart = Math.min(minLateStart, taskMap[succId]?.lateStart ?? Infinity);
        });
        task.lateFinish = minLateStart;
      } else {
        task.lateFinish = projectEnd;
      }
      task.lateStart = task.lateFinish - task.duration;
      task.slack = task.lateStart - task.earlyStart;
      visitedBackward.add(task.id);
      (predecessors[task.id] || []).forEach((predId) => taskMap[predId] && processBackward(taskMap[predId]));
    };
    workingTasks.filter((t) => (successors[t.id] || []).length === 0).forEach(processBackward);

    setCriticalPath(workingTasks.filter((t) => t.slack === 0).map((t) => t.id));
    return workingTasks;
  }, []);

  useEffect(() => {
    const projectTasks = entry?.data?.tasks || [];
    setTasks(calculateCriticalPath(projectTasks));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.data?.tasks]);

  // Estado derivado de una tarea real: no existe `status`, se deriva de `complete`.
  const taskStatus = (task) => {
    if ((task.complete || 0) >= 100) return 'done';
    if ((task.complete || 0) > 0) return 'in_progress';
    return 'todo';
  };

  const resourceOptions = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => (t.resources || []).forEach((r) => set.add(r)));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter.status !== 'all' && taskStatus(task) !== filter.status) return false;
      if (filter.resource !== 'all' && !(task.resources || []).includes(filter.resource)) return false;
      if (filter.search && !task.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filter]);

  const tasksByStatus = useMemo(() => {
    const grouped = { todo: [], in_progress: [], done: [] };
    filteredTasks.forEach((task) => {
      grouped[taskStatus(task)].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const dateRange = useMemo(() => {
    if (!tasks.length) return { start: new Date(), end: addDays(new Date(), 30) };
    let minDate = new Date();
    let maxDate = new Date();
    tasks.forEach((task) => {
      if (task.start) {
        const d = parseISO(task.start);
        if (isBefore(d, minDate)) minDate = d;
      }
      if (task.end) {
        const d = parseISO(task.end);
        if (isAfter(d, maxDate)) maxDate = d;
      }
    });
    return { start: addDays(minDate, -2), end: addDays(maxDate, 5) };
  }, [tasks]);

  const timelineDays = useMemo(() => {
    const days = [];
    let currentDate = new Date(dateRange.start);
    while (isBefore(currentDate, dateRange.end) || isSameDay(currentDate, dateRange.end)) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    return days;
  }, [dateRange]);

  // Persiste en la ruta real: project.tools['project-timeline'].data.tasks.
  const persistTasks = useCallback(
    (nextTasks) => {
      if (!project || !entry) return;
      updateProject(projectId, {
        tools: {
          ...project.tools,
          'project-timeline': {
            ...entry,
            data: { ...entry.data, tasks: nextTasks },
            updatedAt: new Date().toISOString(),
          },
        },
      });
    },
    [project, entry, projectId, updateProject]
  );

  // Arrastrar una tarjeta a otra columna cambia su `complete`, el único
  // campo real que existe para representar avance (no hay `status` propio).
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const target = destination.droppableId;
    const nextTasks = tasks.map((task) => {
      if (task.id !== draggableId) return task;
      let complete = task.complete || 0;
      if (target === 'todo') complete = 0;
      else if (target === 'done') complete = 100;
      else if (target === 'in_progress') complete = complete === 0 || complete === 100 ? 50 : complete;
      return { ...task, complete };
    });

    const cleanTasks = nextTasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.start,
      end: t.end,
      dependencies: t.dependencies,
      complete: t.complete,
      resources: t.resources,
    }));
    setTasks(calculateCriticalPath(cleanTasks));
    persistTasks(cleanTasks);
  };

  // "Riesgo" real, derivado de datos reales (crítico + vencida), nunca de un
  // campo `riskLevel` inventado (ningún proyecto lo tiene).
  const riskData = useMemo(
    () =>
      tasks.map((task) => {
        const overdue = isOverdue(task.end) && (task.complete || 0) < 100;
        const critical = criticalPath.includes(task.id);
        const riskValue = critical && overdue ? 3 : critical || overdue ? 2 : 1;
        return {
          name: task.name,
          risk: riskValue,
          progress: task.complete || 0,
          isCritical: critical,
          overdue,
        };
      }),
    [tasks, criticalPath]
  );

  const projectMetrics = useMemo(() => {
    if (!tasks.length) return { completion: 0, onTrack: 0, atRisk: 0, critical: 0 };
    const completion = tasks.reduce((sum, task) => sum + (task.complete || 0), 0) / tasks.length;
    const atRisk = riskData.filter((r) => r.risk >= 2).length;
    return {
      completion,
      onTrack: tasks.length - atRisk,
      atRisk,
      critical: criticalPath.length,
    };
  }, [tasks, riskData, criticalPath]);

  const handleExport = () => {
    exportToJson(
      { project: project?.name, phases: entry?.data?.phases || [], tasks },
      `timeline_${projectId}.json`
    );
  };

  if (!project) return null;

  const renderGanttView = () => (
    <div className="mt-4">
      <div className="flex items-center border-b border-line-subtle p-2 text-sm font-medium text-content-secondary">
        <div className="w-1/4">Tarea</div>
        <div className="w-1/6">Recursos</div>
        <div className="w-1/6">Inicio</div>
        <div className="w-1/6">Fin</div>
        <div className="w-1/6">Estado</div>
      </div>

      <div className="relative">
        <div className="flex border-b border-line-subtle">
          <div className="w-3/4" />
          <div className="flex w-1/4">
            {timelineDays.slice(0, 14).map((day, i) => (
              <div key={i} className="flex-1 border-r border-line-subtle p-1 text-center text-xs text-content-muted">
                {day.getDate()}
              </div>
            ))}
          </div>
        </div>

        <div>
          {filteredTasks.map((task) => {
            const critical = criticalPath.includes(task.id);
            const status = taskStatus(task);
            return (
              <div
                key={task.id}
                className={`flex items-center border-b border-line-subtle hover:bg-surface-sunken ${critical ? 'bg-danger-soft/40' : ''}`}
              >
                <div className="w-1/4 truncate p-2 text-content">{task.name}</div>
                <div className="w-1/6 truncate p-2 text-content-secondary">{(task.resources || []).join(', ') || '—'}</div>
                <div className="w-1/6 p-2 text-content-secondary">{formatDate(task.start)}</div>
                <div className="w-1/6 p-2 text-content-secondary">{formatDate(task.end)}</div>
                <div className="w-1/6 p-2">
                  <span
                    className={`badge text-2xs ${
                      status === 'done' ? 'bg-success-soft text-success-on' : status === 'in_progress' ? 'bg-warning-soft text-warning-on' : 'bg-surface-sunken text-content-secondary'
                    }`}
                  >
                    {status === 'done' ? 'Completa' : status === 'in_progress' ? 'En progreso' : 'Sin iniciar'}
                  </span>
                </div>
                <div className="relative w-1/4 p-2">
                  <div
                    className={`absolute h-4 rounded-sm ${critical ? 'bg-danger' : 'bg-brand'}`}
                    style={{
                      width: `${((task.duration || 1) / 14) * 100}%`,
                      left: `${(differenceInCalendarDays(parseISO(task.start), dateRange.start) / 14) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const KANBAN_COLUMNS = [
    { id: 'todo', label: 'Sin iniciar' },
    { id: 'in_progress', label: 'En progreso' },
    { id: 'done', label: 'Completa' },
  ];

  const renderKanbanView = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(({ id: status, label }) => {
          const statusTasks = tasksByStatus[status] || [];
          return (
            <div key={status} className="w-[280px] min-w-[280px] rounded-lg bg-surface-sunken">
              <div className="flex items-center justify-between border-b border-line-subtle p-3 font-medium text-content">
                <h3>{label}</h3>
                <span className="rounded bg-surface px-2 py-1 text-xs text-content-secondary">{statusTasks.length}</span>
              </div>

              <Droppable droppableId={status}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[80px] space-y-2 p-2">
                    {statusTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`rounded-md border border-line bg-surface p-3 shadow-xs ${snapshot.isDragging ? 'shadow-md' : ''} ${
                              criticalPath.includes(task.id) ? 'border-l-4 border-l-danger' : ''
                            }`}
                          >
                            <h4 className="text-sm font-medium text-content">{task.name}</h4>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken">
                                  <div className="h-full bg-brand" style={{ width: `${task.complete || 0}%` }} />
                                </div>
                                <span className="text-xs text-content-secondary">{task.complete || 0}%</span>
                              </div>
                              {task.resources?.length > 0 && (
                                <span className="truncate rounded-full bg-surface-sunken px-2 py-0.5 text-2xs text-content-secondary">
                                  {task.resources[0]}
                                  {task.resources.length > 1 ? ` +${task.resources.length - 1}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );

  const renderRiskView = () => (
    <div className="mt-4">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-4">
          <h3 className="text-xs font-medium text-content-muted">Avance</h3>
          <div className="mt-1 text-2xl font-bold text-content">{Math.round(projectMetrics.completion)}%</div>
        </div>
        <div className="card p-4">
          <h3 className="text-xs font-medium text-content-muted">En curso normal</h3>
          <div className="mt-1 text-2xl font-bold text-success">{projectMetrics.onTrack}</div>
        </div>
        <div className="card p-4">
          <h3 className="text-xs font-medium text-content-muted">En riesgo</h3>
          <div className="mt-1 text-2xl font-bold text-warning">{projectMetrics.atRisk}</div>
        </div>
        <div className="card p-4">
          <h3 className="text-xs font-medium text-content-muted">Camino crítico</h3>
          <div className="mt-1 text-2xl font-bold text-danger">{projectMetrics.critical}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-4 text-sm font-medium text-content">Riesgo vs. avance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={riskData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.line} />
                <XAxis dataKey="name" scale="band" tick={{ fontSize: 10 }} hide />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="right" dataKey="risk" name="Nivel de riesgo">
                  {riskData.map((entry_, index) => (
                    <Cell key={index} fill={entry_.isCritical ? chartColors.danger : chartColors.warning} />
                  ))}
                </Bar>
                <Line yAxisId="left" type="monotone" dataKey="progress" name="Avance %" stroke={chartColors.brand} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-4 text-sm font-medium text-content">Dispersión de riesgo</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={riskData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.line} />
                <XAxis dataKey="progress" name="Avance %" tick={{ fontSize: 11 }} />
                <YAxis dataKey="risk" name="Riesgo" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Scatter data={riskData} name="Tareas">
                  {riskData.map((entry_, index) => (
                    <Cell key={index} fill={entry_.risk === 3 ? chartColors.danger : entry_.risk === 2 ? chartColors.warning : chartColors.success} />
                  ))}
                </Scatter>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center text-xl font-semibold text-content">
          <Calendar className="mr-2" size={20} aria-hidden="true" />
          Línea de tiempo de {project.name}
        </h2>

        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md bg-brand/10 px-3 py-1.5 text-sm text-brand hover:bg-brand/15"
        >
          <Download size={14} aria-hidden="true" />
          Exportar
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" size={14} aria-hidden="true" />
            <input
              type="text"
              className="input h-9 w-48 pl-8"
              placeholder="Buscar tareas…"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>

          <select
            className="input h-9 w-auto"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="all">Todos los estados</option>
            <option value="todo">Sin iniciar</option>
            <option value="in_progress">En progreso</option>
            <option value="done">Completa</option>
          </select>

          {resourceOptions.length > 0 && (
            <select
              className="input h-9 w-auto"
              value={filter.resource}
              onChange={(e) => setFilter({ ...filter, resource: e.target.value })}
            >
              <option value="all">Todos los recursos</option>
              {resourceOptions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-content-secondary hover:bg-surface-sunken"
            onClick={() => setFilter({ status: 'all', resource: 'all', search: '' })}
          >
            <Filter size={14} aria-hidden="true" />
            Reiniciar
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-surface-sunken p-1">
          {[
            { id: 'gantt', label: 'Gantt', Icon: Calendar },
            { id: 'kanban', label: 'Kanban', Icon: GitBranch },
            { id: 'risk', label: 'Riesgo', Icon: BarChart2 },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors duration-fast ${
                view === id ? 'bg-surface text-content shadow-xs' : 'text-content-secondary hover:text-content'
              }`}
              onClick={() => setView(id)}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <p className="flex items-center gap-2 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning-on">
          <AlertTriangle size={14} aria-hidden="true" />
          Ningún resultado con los filtros actuales.
        </p>
      )}

      <div className="relative">
        {view === 'gantt' && renderGanttView()}
        {view === 'kanban' && renderKanbanView()}
        {view === 'risk' && renderRiskView()}
      </div>
    </div>
  );
};

export default EnhancedTimeline;
