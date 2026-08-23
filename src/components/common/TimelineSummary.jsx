import { Calendar, AlertTriangle } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { formatDate, formatRelative, daysUntil, isOverdue } from '../../lib/format';
import PhaseBadge from './PhaseBadge';
import EmptyState from './EmptyState';
import GradientButton from './GradientButton';

/**
 * Deriva un estado legible de una tarea real (`{ complete, end }`, sin
 * `status` ni `endDate` propios) para pintar un punto de color.
 */
function taskTone(task) {
  if (task.complete >= 100) return 'bg-success';
  if (isOverdue(task.end) && task.complete < 100) return 'bg-danger';
  if (task.complete > 0) return 'bg-warning';
  return 'bg-neutral-400';
}

/**
 * Resumen de la línea de tiempo de un proyecto (herramienta `project-timeline`).
 * Lee de `project.tools['project-timeline'].data`, no de una ruta legada en
 * la raíz del proyecto. Solo `project-1` trae timeline hoy: el estado vacío
 * es el camino normal para la mayoría de los proyectos.
 *
 * @param {Object} props
 * @param {string} props.projectId
 * @param {string} [props.className]
 */
const TimelineSummary = ({ projectId, className = '' }) => {
  const { getProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const entry = project?.tools?.['project-timeline'];
  const data = entry?.data;
  const tasks = data?.tasks || [];
  const phases = data?.phases || [];

  if (!project || !entry || tasks.length === 0) {
    return (
      <div className={`card p-5 ${className}`}>
        <h2 className="section-label mb-4">Línea de tiempo</h2>
        <EmptyState
          variant="sin-datos"
          size="sm"
          title="Línea de tiempo sin configurar"
          description="Usa la herramienta Timeline para planificar las tareas de este proyecto."
          action={
            <GradientButton size="sm" to={`/projects/${projectId}/tools/project-timeline`}>
              Configurar
            </GradientButton>
          }
        />
      </div>
    );
  }

  const upcoming = tasks
    .filter((t) => (t.complete || 0) < 100)
    .slice()
    .sort((a, b) => new Date(a.end) - new Date(b.end))
    .slice(0, 3);

  return (
    <div className={`card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-label flex items-center gap-1.5">
          <Calendar size={14} aria-hidden="true" />
          Línea de tiempo
        </h2>
        {entry.updatedAt && (
          <span className="text-xs text-content-muted">Actualizado {formatRelative(entry.updatedAt)}</span>
        )}
      </div>

      {phases.length > 0 && (
        <div className="mb-5 space-y-2.5">
          {phases.map((phase) => (
            <div key={phase.name} className="flex items-center gap-3">
              <PhaseBadge phase={phase.name} className="w-24 shrink-0 justify-center" />
              <div className="h-1.5 w-full flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full rounded-full bg-brand" style={{ width: `${phase.complete || 0}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right text-xs text-content-secondary">{phase.complete || 0}%</span>
            </div>
          ))}
        </div>
      )}

      {upcoming.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-medium text-content">Próximas tareas</h3>
          <ul className="space-y-2">
            {upcoming.map((task) => {
              const overdue = isOverdue(task.end) && (task.complete || 0) < 100;
              const days = daysUntil(task.end);
              return (
                <li key={task.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-sunken px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${taskTone(task)}`} aria-hidden="true" />
                    <span className="truncate text-sm text-content">{task.name}</span>
                  </span>
                  <span className={`shrink-0 text-xs ${overdue ? 'text-danger' : 'text-content-secondary'}`}>
                    {overdue ? (
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle size={12} aria-hidden="true" />
                        Vencida {formatRelative(task.end)}
                      </span>
                    ) : days !== null && days <= 14 ? (
                      `Vence ${formatRelative(task.end)}`
                    ) : (
                      formatDate(task.end)
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-content-secondary">Todas las tareas del plan están completas.</p>
      )}
    </div>
  );
};

export default TimelineSummary;
