import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Users, AlertTriangle } from 'lucide-react';
import PhaseBadge from './PhaseBadge';
import StatusBadge from './StatusBadge';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { PHASE_ORDER, normalizePhase } from '../../lib/phases';
import { formatDate, formatRelative, daysUntil, isOverdue, formatPercent } from '../../lib/format';

/**
 * Próxima herramienta pendiente del plan del proyecto (fórmula 0.4.3 del brief):
 * recorre PHASE_ORDER considerando solo herramientas del plan (`project.tools`);
 * gana la primera 'in_progress' encontrada; si no hay ninguna, la primera
 * 'not_started'. Si el plan está completo (o vacío), devuelve null.
 *
 * @param {Object} project
 * @param {Array} catalog - Catálogo completo de herramientas (`tools` del contexto).
 * @returns {Object|null}
 */
function getNextPlannedTool(project, catalog) {
  const plan = project.tools || {};
  const planIds = Object.keys(plan);
  if (planIds.length === 0) return null;

  const byPhase = PHASE_ORDER.map((phase) =>
    catalog.filter((t) => planIds.includes(t.id) && normalizePhase(t.phase) === phase)
  );

  for (const phaseTools of byPhase) {
    const inProgress = phaseTools.find((t) => plan[t.id].status === 'in_progress');
    if (inProgress) return inProgress;
  }
  for (const phaseTools of byPhase) {
    const notStarted = phaseTools.find((t) => plan[t.id].status === 'not_started');
    if (notStarted) return notStarted;
  }
  return null;
}

/**
 * Urgencia por fecha de fin (fórmula 0.4.4 del brief). Devuelve null si el
 * proyecto no tiene `endDate` (la línea simplemente no se renderiza).
 *
 * @param {Object} project
 * @returns {{ text: string, tone: 'neutral'|'warning'|'danger' }|null}
 */
function getUrgency(project) {
  const { status, endDate } = project;
  if (!endDate) return null;

  if (status === 'completed') {
    return { text: `Cerrado el ${formatDate(endDate)}`, tone: 'neutral' };
  }
  if (isOverdue(endDate)) {
    return { text: `Vencido ${formatRelative(endDate)}`, tone: 'danger' };
  }
  const remaining = daysUntil(endDate);
  if (remaining !== null && remaining <= 14) {
    return { text: `Vence ${formatRelative(endDate)}`, tone: 'warning' };
  }
  return { text: `Vence el ${formatDate(endDate)}`, tone: 'neutral' };
}

const URGENCY_TONE_CLASS = {
  neutral: 'text-content-secondary',
  warning: 'text-warning',
  danger: 'text-danger',
};

/**
 * Tarjeta de proyecto: el patrón "stretched link" hace de toda la tarjeta un
 * destino navegable manteniendo HTML válido (un único `<Link>` con
 * `after:absolute after:inset-0`, alcanzable con Tab y activable con Enter).
 * Los enlaces/acciones secundarios internos (siguiente herramienta) se elevan
 * con `relative z-10` para seguir siendo pulsables por encima del overlay.
 *
 * Muestra fase y estado reales (`PhaseBadge`/`StatusBadge`), avance derivado
 * de `project.tools` (nunca `project.progress` crudo) y la urgencia según
 * `endDate`. No pinta `category` ni `tags`: no existen en los datos reales.
 *
 * @param {Object} props
 * @param {Object} props.project - Proyecto completo (ver `src/data/projects.js`).
 * @param {string} [props.className]
 */
const ProjectCard = ({ project, className = '' }) => {
  const { tools: catalog } = useLeanSixSigma();

  const planIds = Object.keys(project.tools || {});
  const doneCount = planIds.filter((id) => project.tools[id].status === 'completed').length;
  const pct = planIds.length ? Math.round((doneCount / planIds.length) * 100) : 0;

  const nextTool = getNextPlannedTool(project, catalog || []);
  const urgency = getUrgency(project);
  const openIssues = (project.issues || []).filter((i) => i.status === 'open').length;

  return (
    <motion.article
      whileTap={{ scale: 0.99 }}
      className={`card card-hover relative overflow-hidden focus-within:shadow-md ${className}`}
    >
      {/* Barra de progreso superior */}
      <div className="h-0.5 w-full bg-surface-sunken">
        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <PhaseBadge phase={project.phase} />
          <StatusBadge status={project.status} kind="project" />
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold text-content">
          <Link to={`/projects/${project.id}`} className="rounded after:absolute after:inset-0 after:content-['']">
            {project.name}
          </Link>
        </h3>

        {project.company && (
          <div className="flex items-center gap-1.5 text-sm text-content-secondary">
            <Building size={14} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{project.company}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm text-content-secondary">
            <span>
              {doneCount}/{planIds.length} herramientas
            </span>
            <span className="font-medium text-content">{formatPercent(pct)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {urgency && (
          <div className={`flex items-center gap-1.5 text-sm ${URGENCY_TONE_CLASS[urgency.tone]}`}>
            {urgency.tone === 'danger' && <AlertTriangle size={14} aria-hidden="true" className="shrink-0" />}
            <span>{urgency.text}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line-subtle pt-3">
          {nextTool ? (
            <Link
              to={`/projects/${project.id}/tools/${nextTool.id}`}
              className="relative z-10 truncate rounded text-sm font-medium text-brand transition-colors duration-fast hover:text-brand-hover"
            >
              Siguiente: {nextTool.name}
            </Link>
          ) : planIds.length > 0 ? (
            <span className="text-sm font-medium text-success">Plan completo</span>
          ) : (
            <span className="text-sm text-content-muted">Sin plan de herramientas</span>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {project.team?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-content-muted">
                <Users size={12} aria-hidden="true" />
                {project.team.length} {project.team.length === 1 ? 'persona' : 'personas'}
              </span>
            )}
            {openIssues > 0 && (
              <span className="badge bg-danger-soft text-danger-on">
                {openIssues === 1 ? '1 asunto abierto' : `${openIssues} asuntos abiertos`}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ProjectCard;
