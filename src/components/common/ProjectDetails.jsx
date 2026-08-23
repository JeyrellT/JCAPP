import { Building2, Calendar, Users, AlertTriangle } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { PHASE_ORDER, PHASE_META, normalizePhase } from '../../lib/phases';
import { formatDate, formatRelative, daysUntil, isOverdue } from '../../lib/format';
import PhaseBadge from './PhaseBadge';
import RoiSummary from './RoiSummary';
import TimelineSummary from './TimelineSummary';

/**
 * Resuelve el texto y el tono de urgencia respecto a `endDate`, siguiendo la
 * tabla de urgencia canónica (proyecto cerrado / vencido / por vencer / normal).
 * `null` cuando el proyecto no tiene `endDate`: la línea simplemente no se pinta.
 */
function getEndDateUrgency(project) {
  const { status, endDate } = project;
  if (!endDate) return null;
  if (status === 'completed') return { text: `Cerrado el ${formatDate(endDate)}`, tone: 'text-content-secondary' };
  if (isOverdue(endDate)) return { text: `Vencido ${formatRelative(endDate)}`, tone: 'text-danger' };
  const days = daysUntil(endDate);
  if (days !== null && days <= 14) return { text: `Vence ${formatRelative(endDate)}`, tone: 'text-warning' };
  return { text: `Vence el ${formatDate(endDate)}`, tone: 'text-content-secondary' };
}

// Intenta separar "45 días" / "87%" en { value, suffix }. Devuelve null si el
// texto no empieza con un número: nunca se inventa un valor.
function parseKpiValue(raw) {
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^(-?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(',', '.'));
  if (Number.isNaN(value)) return null;
  return { value, suffix: match[2].trim().toLowerCase() };
}

/**
 * Fila de KPI: texto plano siempre, y una barra de avance hacia la meta
 * únicamente cuando `baseLine`/`current`/`target` parsean a número y
 * comparten la misma unidad. Nunca se inventa un delta.
 */
function KpiRow({ kpi }) {
  const base = parseKpiValue(kpi.baseLine);
  const current = parseKpiValue(kpi.current);
  const target = parseKpiValue(kpi.target);

  const canChart =
    base && current && target && base.suffix === current.suffix && current.suffix === target.suffix && target.value !== base.value;

  let pct = null;
  if (canChart) {
    pct = ((current.value - base.value) / (target.value - base.value)) * 100;
    pct = Math.max(0, Math.min(100, Math.round(pct)));
  }

  return (
    <div className="grid grid-cols-1 gap-2 border-b border-line-subtle py-3 last:border-b-0 sm:grid-cols-[1.4fr_repeat(3,1fr)] sm:items-center sm:gap-4">
      <p className="text-sm font-medium text-content">{kpi.name}</p>
      <p className="text-sm text-content-secondary">
        <span className="text-content-muted">Línea base </span>
        {kpi.baseLine || '—'}
      </p>
      <p className="text-sm text-content-secondary">
        <span className="text-content-muted">Actual </span>
        {kpi.current || '—'}
      </p>
      <div>
        <p className="text-sm text-content-secondary">
          <span className="text-content-muted">Meta </span>
          {kpi.target || '—'}
        </p>
        {pct !== null && (
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={`h-full rounded-full ${pct >= 100 ? 'bg-success' : 'bg-warning'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Panel de detalle de un proyecto: ficha, KPIs, ROI, timeline y avance por
 * fase DMAIC. Se monta dentro de la pestaña "Resumen" de ProjectDetailsPage.
 *
 * @param {Object} props
 * @param {string} props.projectId
 * @param {string} [props.className]
 */
const ProjectDetails = ({ projectId, className = '' }) => {
  const { getProject, getProjectToolsByPhase } = useLeanSixSigma();
  const project = getProject(projectId);

  if (!project) {
    return (
      <div className={`card flex items-center gap-3 p-5 text-sm text-content-secondary ${className}`}>
        <AlertTriangle size={16} className="text-content-muted" aria-hidden="true" />
        Cargando detalles del proyecto…
      </div>
    );
  }

  const planned = Object.keys(project.tools || {});
  const done = planned.filter((id) => project.tools[id].status === 'completed').length;
  const pct = planned.length ? Math.round((done / planned.length) * 100) : 0;

  const urgency = getEndDateUrgency(project);
  const kpis = project.kpis || [];

  const toolsByPhase = getProjectToolsByPhase(projectId);
  const planIds = new Set(planned);
  const phaseBreakdown = PHASE_ORDER.map((phase) => {
    const all = toolsByPhase[phase] || [];
    const inPlan = all.filter((t) => planIds.has(t.id));
    const completed = inPlan.filter((t) => t.status === 'completed').length;
    return { phase, completed, total: inPlan.length };
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Ficha */}
      <div className="card p-5">
        <h2 className="section-label mb-4">Ficha del proyecto</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Building2 size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden="true" />
            <div>
              <dt className="text-xs text-content-muted">Empresa</dt>
              <dd className="text-sm text-content">{project.company || 'No especificada'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden="true" />
            <div>
              <dt className="text-xs text-content-muted">Fechas</dt>
              <dd className="text-sm text-content">
                {formatDate(project.startDate)} – {formatDate(project.endDate)}
                {urgency && <span className={`block text-xs ${urgency.tone}`}>{urgency.text}</span>}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users size={16} className="mt-0.5 shrink-0 text-content-muted" aria-hidden="true" />
            <div>
              <dt className="text-xs text-content-muted">Equipo</dt>
              <dd className="text-sm text-content">{(project.team || []).length} personas</dd>
            </div>
          </div>
          <div>
            <dt className="text-xs text-content-muted">Avance del plan</dt>
            <dd className="mt-1">
              <div className="flex items-center justify-between text-sm text-content">
                <span>{done}/{planned.length} herramientas</span>
                <span className="text-content-secondary">{pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
            </dd>
          </div>
        </dl>
      </div>

      {/* KPIs */}
      <div className="card p-5">
        <h2 className="section-label mb-2">Indicadores clave</h2>
        {kpis.length > 0 ? (
          <div>
            {kpis.map((kpi) => (
              <KpiRow key={kpi.id} kpi={kpi} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-content-secondary">Este proyecto aún no tiene KPIs definidos.</p>
        )}
      </div>

      {/* ROI y timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RoiSummary projectId={projectId} />
        <TimelineSummary projectId={projectId} />
      </div>

      {/* Avance por fase */}
      <div className="card p-5">
        <h2 className="section-label mb-4">Avance por fase DMAIC</h2>
        <div className="space-y-3">
          {phaseBreakdown.map(({ phase, completed, total }) => {
            const phasePct = total ? Math.round((completed / total) * 100) : 0;
            return (
              <div key={phase} className="flex items-center gap-3">
                <PhaseBadge phase={phase} className="w-24 shrink-0 justify-center" />
                <div className="min-w-0 flex-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div className={`h-full rounded-full ${PHASE_META[normalizePhase(phase)].solid}`} style={{ width: `${phasePct}%` }} />
                  </div>
                </div>
                <span className="w-14 shrink-0 text-right text-xs text-content-secondary">
                  {total ? `${completed}/${total}` : 'Sin plan'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
