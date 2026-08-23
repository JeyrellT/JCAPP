import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  Download,
  PauseCircle,
  PlayCircle,
  Mail,
  Plus,
  ChevronDown,
  BarChart2,
  Layers,
  DollarSign,
} from 'lucide-react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ErrorBoundary from '../components/common/ErrorBoundary';
import EmptyState from '../components/common/EmptyState';
import PhaseBadge from '../components/common/PhaseBadge';
import StatusBadge from '../components/common/StatusBadge';
import { SkeletonStat, SkeletonTable } from '../components/common/Skeleton';
import GradientButton from '../components/common/GradientButton';
import StatCard from '../components/common/StatCard';
import Notification from '../components/common/Notification';
import Modal from '../components/ui/Modal';
import Dropdown from '../components/ui/Dropdown';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { PHASE_ORDER, PHASE_META, normalizePhase, formatPhase } from '../lib/phases';
import { formatDate, formatPercent, formatNumber, formatRelative, daysUntil, isOverdue } from '../lib/format';
import { exportProject } from '../utils/export';
import ProjectDetails from '../components/common/ProjectDetails';
import ToolRecommendation from '../components/common/ToolRecommendation';
import AddToolForm from '../components/forms/AddToolForm';
import EditProjectForm from '../components/forms/EditProjectForm';
import TeamMemberForm from '../components/forms/TeamMemberForm';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'herramientas', label: 'Herramientas' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'riesgos', label: 'Riesgos e issues' },
];

const LESSON_CATEGORIES = ['Positivo', 'Desafío', 'Mejora'];

// Fórmula canónica 0.4.1: el avance se deriva del plan, nunca se pinta un
// campo `progress` crudo.
function getPlanProgress(project) {
  const planned = Object.keys(project.tools || {});
  const done = planned.filter((id) => project.tools[id].status === 'completed').length;
  const pct = planned.length ? Math.round((done / planned.length) * 100) : 0;
  return { planned, done, pct };
}

// Fórmula canónica 0.4.3: recorre PHASE_ORDER, solo herramientas del plan.
// Gana la primera 'in_progress'; si no hay, la primera 'not_started'.
// Plan completo (o vacío) -> null.
function getNextPlannedTool(project, catalog) {
  const planIds = new Set(Object.keys(project.tools || {}));
  if (planIds.size === 0) return null;

  const byId = Object.fromEntries(catalog.map((t) => [t.id, t]));
  const orderedPlanIds = PHASE_ORDER.flatMap((phase) =>
    catalog.filter((t) => normalizePhase(t.phase) === phase).map((t) => t.id)
  ).filter((id) => planIds.has(id));

  const inProgress = orderedPlanIds.find((id) => project.tools[id].status === 'in_progress');
  if (inProgress) return byId[inProgress];

  const notStarted = orderedPlanIds.find((id) => project.tools[id].status === 'not_started');
  if (notStarted) return byId[notStarted];

  return null;
}

// Tabla de urgencia canónica 0.4.4, sobre `endDate` (no `startDate`).
function getEndDateUrgency(project) {
  const { status, endDate } = project;
  if (!endDate) return null;
  if (status === 'completed') return { text: `Cerrado el ${formatDate(endDate)}`, tone: 'neutral' };
  if (isOverdue(endDate)) return { text: `Vencido ${formatRelative(endDate)}`, tone: 'danger' };
  const days = daysUntil(endDate);
  if (days !== null && days <= 14) return { text: `Vence ${formatRelative(endDate)}`, tone: 'warning' };
  return { text: `Vence el ${formatDate(endDate)}`, tone: 'neutral' };
}

// Top N herramientas del plan por última actualización real (sustituye el
// bloque de "Actividad Reciente" inventado que traía la página anterior).
function getRecentActivity(project, catalog, limit = 5) {
  const byId = Object.fromEntries(catalog.map((t) => [t.id, t]));
  return Object.entries(project.tools || {})
    .filter(([, entry]) => entry.updatedAt)
    .sort((a, b) => new Date(b[1].updatedAt) - new Date(a[1].updatedAt))
    .slice(0, limit)
    .map(([id, entry]) => ({ id, name: byId[id]?.name || id, status: entry.status, updatedAt: entry.updatedAt }));
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Badge de nivel (probabilidad/impacto de riesgo: 'alta'/'media'/'baja'). */
function LevelBadge({ value }) {
  const tone =
    value === 'alta'
      ? 'bg-danger-soft text-danger-on'
      : value === 'media'
        ? 'bg-warning-soft text-warning-on'
        : value === 'baja'
          ? 'bg-success-soft text-success-on'
          : 'bg-surface-sunken text-content-secondary';
  return <span className={`badge text-2xs capitalize ${tone}`}>{value || '—'}</span>;
}

/** Badge de estado de un issue ('open'/'resolved'). */
function IssueStatusBadge({ status }) {
  const tone =
    status === 'open'
      ? 'bg-warning-soft text-warning-on'
      : status === 'resolved'
        ? 'bg-success-soft text-success-on'
        : 'bg-surface-sunken text-content-secondary';
  const label = status === 'open' ? 'Abierto' : status === 'resolved' ? 'Resuelto' : status || '—';
  return <span className={`badge text-2xs ${tone}`}>{label}</span>;
}

/**
 * Vista de detalle de un proyecto: cabecera con acciones reales, franja de
 * estadísticas, y pestañas Resumen / Herramientas / Equipo / Riesgos e issues.
 */
const ProjectDetailsPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getProject, tools, loading, updateProject, updateToolStatus, deleteProject } = useLeanSixSigma();
  const project = getProject(projectId);

  useDocumentTitle(project?.name);

  const [activeTab, setActiveTab] = useState('resumen');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [addToolOpen, setAddToolOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const notify = (message, type = 'success') => setToast({ show: true, message, type });

  const { planned, done, pct } = useMemo(() => (project ? getPlanProgress(project) : { planned: [], done: 0, pct: 0 }), [project]);
  const nextTool = useMemo(() => (project ? getNextPlannedTool(project, tools) : null), [project, tools]);
  const urgency = useMemo(() => (project ? getEndDateUrgency(project) : null), [project]);
  const recentActivity = useMemo(() => (project ? getRecentActivity(project, tools) : []), [project, tools]);

  const toolsByPhaseSection = useMemo(() => {
    if (!project) return [];
    return PHASE_ORDER.map((phase) => {
      const catalogInPhase = tools.filter((t) => normalizePhase(t.phase) === phase);
      const inPlan = catalogInPhase.filter((t) => planned.includes(t.id));
      const completed = inPlan.filter((t) => project.tools[t.id].status === 'completed').length;
      return { phase, catalogTotal: catalogInPhase.length, inPlan, completed };
    });
  }, [project, tools, planned]);

  const availableTools = useMemo(() => tools.filter((t) => !planned.includes(t.id)), [tools, planned]);

  if (loading) {
    return (
      <PageContainer gap="lg">
        <div role="status" aria-busy="true" className="space-y-6">
          <span className="sr-only">Cargando proyecto…</span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
          <SkeletonTable rows={6} cols={4} />
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer gap="lg">
        <PageHeader title="Proyecto no encontrado" backTo="/projects" backLabel="Volver a proyectos" />
        <EmptyState
          variant="no-encontrado"
          title="Proyecto no encontrado"
          description="Puede que lo hayas eliminado o que el enlace esté mal."
          action={<GradientButton to="/projects">Ver proyectos</GradientButton>}
        />
      </PageContainer>
    );
  }

  const phaseKey = normalizePhase(project.phase);
  const roiResults = project.roiData?.results;

  const handleTogglePause = () => {
    const nextStatus = project.status === 'on_hold' ? 'active' : 'on_hold';
    updateProject(projectId, { status: nextStatus });
    notify(nextStatus === 'on_hold' ? 'Proyecto puesto en pausa' : 'Proyecto reactivado');
  };

  const handleExport = () => {
    if (exportProject(project)) notify('Proyecto exportado');
  };

  const handleConfirmDelete = () => {
    deleteProject(projectId);
    navigate('/projects');
  };

  // Nota: se pasan elementos ya renderizados (`<Icon .../>`), no la referencia
  // cruda del componente. lucide-react 0.292 exporta íconos como componentes
  // forwardRef (`typeof Icon === 'object'`), y `DropdownItem` (src/components/ui/Dropdown.jsx,
  // fuera de este carril) solo envuelve en `<Icon/>` cuando `typeof === 'function'`;
  // en cualquier otro caso reenvía la prop tal cual como hijo, y un objeto
  // forwardRef crudo ahí revienta con "Objects are not valid as a React child".
  const actionItems = [
    { id: 'export', label: 'Exportar proyecto', icon: <Download size={16} aria-hidden="true" />, onSelect: handleExport },
    {
      id: 'pause',
      label: project.status === 'on_hold' ? 'Reactivar' : 'Poner en pausa',
      icon: project.status === 'on_hold' ? <PlayCircle size={16} aria-hidden="true" /> : <PauseCircle size={16} aria-hidden="true" />,
      onSelect: handleTogglePause,
    },
    { id: 'sep', separator: true },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: <Trash2 size={16} aria-hidden="true" />,
      danger: true,
      onSelect: () => setDeleteOpen(true),
    },
  ];

  return (
    <PageContainer gap="lg">
      <PageHeader
        breadcrumbs={[{ label: 'Proyectos', to: '/projects' }, { label: project.name }]}
        title={project.name}
        description={project.description}
        meta={
          <>
            <StatusBadge status={project.status} />
            <PhaseBadge phase={project.phase} />
            {project.company && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={14} aria-hidden="true" />
                {project.company}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} aria-hidden="true" />
              {formatDate(project.startDate)} – {formatDate(project.endDate)}
            </span>
          </>
        }
        actions={
          <>
            {nextTool && (
              <GradientButton to={`/projects/${projectId}/tools/${nextTool.id}`}>
                Continuar con {nextTool.name}
              </GradientButton>
            )}
            <GradientButton variant="outline" leadingIcon={<Pencil size={14} aria-hidden="true" />} onClick={() => setEditOpen(true)}>
              Editar
            </GradientButton>
            <Dropdown
              trigger={
                <button
                  type="button"
                  aria-label="Más acciones"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
                >
                  <MoreVertical size={16} aria-hidden="true" />
                </button>
              }
              items={actionItems}
              align="end"
            />
          </>
        }
      />

      {/* Franja de estadísticas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avance"
          value={`${pct}%`}
          description={`${done}/${planned.length} herramientas`}
          icon={<BarChart2 size={18} aria-hidden="true" />}
          color="brand"
        />
        <StatCard
          title="Fase actual"
          value={formatPhase(project.phase)}
          description={PHASE_META[phaseKey]?.desc || 'Sin fase asignada'}
          icon={<Layers size={18} aria-hidden="true" />}
          color="brand"
        />
        <StatCard
          title="Fin"
          value={formatDate(project.endDate)}
          description={urgency ? urgency.text : 'Sin fecha definida'}
          icon={<Calendar size={18} aria-hidden="true" />}
          color={urgency?.tone === 'danger' ? 'danger' : urgency?.tone === 'warning' ? 'warning' : 'neutral'}
        />
        <StatCard
          title="ROI"
          value={roiResults ? formatPercent(roiResults.roi) : '—'}
          description={roiResults ? `Payback ${formatNumber(roiResults.paybackMonths, { maximumFractionDigits: 1 })} meses` : 'Sin análisis financiero aún'}
          icon={<DollarSign size={18} aria-hidden="true" />}
          color={roiResults ? 'success' : 'neutral'}
          to={roiResults ? undefined : `/projects/${projectId}/tools/roi-calculator`}
        />
      </div>

      {/* Pestañas */}
      <div className="card overflow-hidden">
        <div role="tablist" aria-label="Secciones del proyecto" className="flex overflow-x-auto border-b border-line-subtle px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-fast ${
                activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-content-secondary hover:text-content'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Resumen */}
          <div role="tabpanel" id="panel-resumen" aria-labelledby="tab-resumen" hidden={activeTab !== 'resumen'}>
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                <ErrorBoundary resetKeys={[projectId]}>
                  <ProjectDetails projectId={projectId} />
                </ErrorBoundary>

                <ErrorBoundary resetKeys={[projectId]}>
                  <ToolRecommendation projectId={projectId} limit={3} />
                </ErrorBoundary>

                <div className="card p-5">
                  <h2 className="section-label mb-4">Actividad reciente</h2>
                  {recentActivity.length > 0 ? (
                    <ul className="space-y-3">
                      {recentActivity.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <StatusBadge status={item.status} kind="tool" size="xs" />
                            <span className="truncate text-sm text-content">{item.name}</span>
                          </span>
                          <span className="shrink-0 text-xs text-content-muted">{formatRelative(item.updatedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-content-secondary">Aún no hay actividad registrada en las herramientas del plan.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Herramientas */}
          <div role="tabpanel" id="panel-herramientas" aria-labelledby="tab-herramientas" hidden={activeTab !== 'herramientas'}>
            {activeTab === 'herramientas' && (
              <div>
                {planned.length === 0 ? (
                  <EmptyState
                    variant="sin-datos"
                    title="Todo proyecto empieza en Definir"
                    description="Aún no hay herramientas en el plan. El Project Charter es el mejor primer paso: define el problema antes de medirlo."
                    action={
                      <GradientButton leadingIcon={<Plus size={14} aria-hidden="true" />} onClick={() => setAddToolOpen(true)}>
                        Añadir herramientas
                      </GradientButton>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {toolsByPhaseSection.map(({ phase, catalogTotal, inPlan, completed }) => (
                      <details key={phase} className="card overflow-hidden" open>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 hover:bg-surface-sunken">
                          <span className="flex items-center gap-3">
                            <PhaseBadge phase={phase} />
                            <span className="text-sm font-medium text-content">
                              {phase} · {completed}/{catalogTotal}
                            </span>
                          </span>
                          <ChevronDown size={16} className="text-content-muted" aria-hidden="true" />
                        </summary>
                        <div className="border-t border-line-subtle p-4">
                          {inPlan.length === 0 ? (
                            <p className="text-sm text-content-secondary">Sin herramientas planificadas en esta fase.</p>
                          ) : (
                            <div className="space-y-3">
                              {inPlan.map((tool) => {
                                const entry = project.tools[tool.id];
                                return (
                                  <div
                                    key={tool.id}
                                    className="flex flex-col gap-3 rounded-lg border border-line-subtle p-3 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-medium text-content">{tool.name}</h4>
                                        <StatusBadge status={entry.status} kind="tool" />
                                      </div>
                                      {entry.notes && <p className="mt-1 text-sm text-content-secondary">{entry.notes}</p>}
                                      <p className="mt-1 text-xs text-content-muted">
                                        {entry.updatedAt ? `Actualizada ${formatRelative(entry.updatedAt)}` : 'Sin actualizar'}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                      <label className="sr-only" htmlFor={`status-${tool.id}`}>
                                        Estado de {tool.name}
                                      </label>
                                      <select
                                        id={`status-${tool.id}`}
                                        className="input h-9 w-auto"
                                        value={entry.status}
                                        onChange={(e) => updateToolStatus(projectId, tool.id, e.target.value)}
                                      >
                                        <option value="not_started">Sin iniciar</option>
                                        <option value="in_progress">En progreso</option>
                                        <option value="completed">Completada</option>
                                      </select>
                                      <GradientButton size="sm" to={`/projects/${projectId}/tools/${tool.id}`}>
                                        Abrir
                                      </GradientButton>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </details>
                    ))}

                    {availableTools.length > 0 && (
                      <details className="card overflow-hidden">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 hover:bg-surface-sunken">
                          <span className="text-sm font-medium text-content">Disponibles para añadir ({availableTools.length})</span>
                          <ChevronDown size={16} className="text-content-muted" aria-hidden="true" />
                        </summary>
                        <div className="border-t border-line-subtle p-4">
                          <GradientButton size="sm" leadingIcon={<Plus size={14} aria-hidden="true" />} onClick={() => setAddToolOpen(true)}>
                            Añadir herramientas al plan
                          </GradientButton>
                          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {availableTools.map((t) => (
                              <li key={t.id} className="flex items-center gap-2 rounded-md bg-surface-sunken px-3 py-2 text-sm text-content-secondary">
                                <PhaseBadge phase={t.phase} showLabel={false} size="xs" />
                                {t.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Equipo */}
          <div role="tabpanel" id="panel-equipo" aria-labelledby="tab-equipo" hidden={activeTab !== 'equipo'}>
            {activeTab === 'equipo' && (
              <div>
                {(project.team || []).length === 0 ? (
                  <EmptyState
                    variant="sin-datos"
                    size="sm"
                    title="Sin miembros de equipo"
                    description="Añade a las personas que trabajan en este proyecto."
                    action={
                      <GradientButton size="sm" onClick={() => setTeamOpen(true)}>
                        Gestionar equipo
                      </GradientButton>
                    }
                  />
                ) : (
                  <div>
                    <div className="mb-4 flex justify-end">
                      <GradientButton size="sm" variant="outline" onClick={() => setTeamOpen(true)}>
                        Gestionar equipo
                      </GradientButton>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {project.team.map((member) => (
                        <div key={member.id} className="card flex items-center gap-3 p-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-medium text-brand">
                            {initials(member.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-content">{member.name}</p>
                            <p className="truncate text-xs text-content-secondary">
                              {member.role}
                              {member.position ? ` · ${member.position}` : ''}
                            </p>
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand hover:underline"
                              >
                                <Mail size={12} aria-hidden="true" />
                                {member.email}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Riesgos e issues */}
          <div role="tabpanel" id="panel-riesgos" aria-labelledby="tab-riesgos" hidden={activeTab !== 'riesgos'}>
            {activeTab === 'riesgos' && (
              <div className="space-y-8">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-content">Riesgos</h3>
                  {(project.risks || []).length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="w-full text-left text-sm">
                        <caption className="sr-only">Riesgos identificados del proyecto</caption>
                        <thead className="bg-surface-sunken text-xs text-content-muted">
                          <tr>
                            <th className="px-4 py-2 font-medium">Descripción</th>
                            <th className="px-4 py-2 font-medium">Probabilidad</th>
                            <th className="px-4 py-2 font-medium">Impacto</th>
                            <th className="px-4 py-2 font-medium">Mitigación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-subtle">
                          {project.risks.map((risk) => (
                            <tr key={risk.id}>
                              <td className="px-4 py-3 text-content">{risk.description}</td>
                              <td className="px-4 py-3">
                                <LevelBadge value={risk.probability} />
                              </td>
                              <td className="px-4 py-3">
                                <LevelBadge value={risk.impact} />
                              </td>
                              <td className="px-4 py-3 text-content-secondary">{risk.mitigation || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState variant="sin-datos" size="sm" title="Sin riesgos registrados" description="Este proyecto no tiene riesgos documentados." />
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-content">Issues</h3>
                  {(project.issues || []).length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="w-full text-left text-sm">
                        <caption className="sr-only">Issues del proyecto</caption>
                        <thead className="bg-surface-sunken text-xs text-content-muted">
                          <tr>
                            <th className="px-4 py-2 font-medium">Descripción</th>
                            <th className="px-4 py-2 font-medium">Estado</th>
                            <th className="px-4 py-2 font-medium">Resolución</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-subtle">
                          {project.issues.map((issue) => (
                            <tr key={issue.id}>
                              <td className="px-4 py-3 text-content">{issue.description}</td>
                              <td className="px-4 py-3">
                                <IssueStatusBadge status={issue.status} />
                              </td>
                              <td className="px-4 py-3 text-content-secondary">{issue.resolution || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState variant="sin-datos" size="sm" title="Sin issues registrados" description="No hay problemas reportados en este proyecto." />
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-content">Lecciones aprendidas</h3>
                  {(project.lessons || []).length > 0 ? (
                    <div className="space-y-4">
                      {LESSON_CATEGORIES.filter((cat) => project.lessons.some((l) => l.category === cat)).map((cat) => (
                        <div key={cat}>
                          <p className="section-label mb-2">{cat}</p>
                          <ul className="space-y-2">
                            {project.lessons
                              .filter((l) => l.category === cat)
                              .map((l) => (
                                <li key={l.id} className="rounded-lg bg-surface-sunken px-3 py-2 text-sm text-content-secondary">
                                  {l.description}
                                </li>
                              ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      variant="sin-datos"
                      size="sm"
                      title="Sin lecciones registradas"
                      description="Todavía no hay lecciones aprendidas documentadas para este proyecto."
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: eliminar proyecto */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={`¿Eliminar «${project.name}»?`}
        footer={
          <>
            <GradientButton variant="ghost" onClick={() => setDeleteOpen(false)}>
              Conservar
            </GradientButton>
            <GradientButton variant="danger" onClick={handleConfirmDelete}>
              Eliminar proyecto
            </GradientButton>
          </>
        }
      >
        <p className="text-sm text-content-secondary">
          Se borrará el proyecto, su equipo y las notas de sus {planned.length} herramientas de este navegador. Esta
          acción no se puede deshacer.
        </p>
      </Modal>

      {/* Modal: editar proyecto */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar proyecto" size="lg">
        <EditProjectForm
          projectId={projectId}
          onCancel={() => setEditOpen(false)}
          onSave={() => {
            setEditOpen(false);
            notify('Cambios guardados');
          }}
        />
      </Modal>

      {/* Modal: gestionar equipo */}
      <Modal open={teamOpen} onClose={() => setTeamOpen(false)} title="Equipo del proyecto" size="lg">
        <TeamMemberForm projectId={projectId} onClose={() => setTeamOpen(false)} onSave={() => setTeamOpen(false)} />
      </Modal>

      {/* Modal: añadir herramientas al plan */}
      <Modal open={addToolOpen} onClose={() => setAddToolOpen(false)} title="Añadir herramientas al plan" size="lg">
        <AddToolForm
          projectId={projectId}
          onClose={() => setAddToolOpen(false)}
          onToolAdded={() => {
            setAddToolOpen(false);
            notify('Herramientas añadidas al plan');
          }}
        />
      </Modal>

      <Notification
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
        duration={3000}
      />
    </PageContainer>
  );
};

export default ProjectDetailsPage;
