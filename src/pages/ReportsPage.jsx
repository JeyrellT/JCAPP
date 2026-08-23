import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  CheckCircle2,
  PieChart as PieChartIcon,
  Download,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { useTheme } from '../contexts/ThemeContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import EmptyState from '../components/common/EmptyState';
import PhaseBadge from '../components/common/PhaseBadge';
import StatusBadge from '../components/common/StatusBadge';
import StatCard from '../components/common/StatCard';
import GradientButton from '../components/common/GradientButton';
import Notification from '../components/common/Notification';
import Dropdown from '../components/ui/Dropdown';
import { SkeletonStat, SkeletonTable } from '../components/common/Skeleton';
import {
  PHASE_ORDER,
  PROJECT_STATUS,
  getStatusToken,
  getToolStatusToken,
  formatPhase,
  normalizePhase,
} from '../lib/phases';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatRelative,
  daysUntil,
  isOverdue,
} from '../lib/format';
import { fadeInUp, staggerContainer } from '../lib/motion';
import { exportAllProjects, exportKpiComparison, exportProject, exportToCsv } from '../utils/export';

// Fórmula única de avance (0.4.1): nunca se pinta project.progress crudo.
function getPlanProgress(project) {
  const planned = Object.keys(project.tools || {});
  const done = planned.filter((id) => project.tools[id]?.status === 'completed').length;
  const pct = planned.length ? Math.round((done / planned.length) * 100) : 0;
  return { planned: planned.length, done, pct };
}

// Urgencia por fecha de fin (0.4.4). El eje temporal del gerente es endDate.
function getEndDateUrgency(project) {
  if (!project.endDate) return null;
  if (project.status === 'completed') {
    return { text: `Cerrado el ${formatDate(project.endDate)}`, tone: 'neutral' };
  }
  if (isOverdue(project.endDate)) {
    return { text: `Vencido ${formatRelative(project.endDate)}`, tone: 'danger' };
  }
  const days = daysUntil(project.endDate);
  if (days !== null && days <= 14) {
    return { text: `Vence ${formatRelative(project.endDate)}`, tone: 'warning' };
  }
  return { text: `Vence el ${formatDate(project.endDate)}`, tone: 'neutral' };
}

function getProjectLead(project) {
  return project.team?.find((member) => member.role === 'Líder del Proyecto') || null;
}

// Resuelve un token de color del sistema de diseño a un string de color real
// (recharts recibe strings de color en sus props, no var() en atributos SVG).
function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `rgb(${raw})` : fallback;
}

const TONE_CLASS = {
  neutral: 'text-content-secondary',
  warning: 'text-warning',
  danger: 'text-danger',
};

// primary/secondary/accent son escalas estáticas del sistema (no CSS vars,
// no cambian con el tema); neutral-400 tampoco. `info` sí es un token
// reactivo al tema y se resuelve en vivo con cssVar().
const SERIES_STATIC = { primary: '#189C90', secondary: '#6366E8', accent: '#E08700' };
const NOT_STARTED_FALLBACK = '#9AA5B4';

/**
 * Informe ejecutivo de la cartera de proyectos: estadísticas generales,
 * tabla de cartera, KPIs reales, impacto financiero y dos gráficos, todo
 * sobre datos reales del contexto. Sin estados de carga simulados: las
 * descargas usan directamente `src/utils/export.js`.
 */
const ReportsPage = () => {
  const { projects, tools, loading, getStats } = useLeanSixSigma();
  const { isDark } = useTheme();
  useDocumentTitle('Reportes');

  const [scopeId, setScopeId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  const stats = getStats();
  const scopeProject = scopeId !== 'all' ? projects.find((p) => p.id === scopeId) : null;

  const filteredProjects = useMemo(() => {
    if (scopeId !== 'all') return projects.filter((p) => p.id === scopeId);
    if (statusFilter !== 'all') return projects.filter((p) => p.status === statusFilter);
    return projects;
  }, [projects, scopeId, statusFilter]);

  const csvRows = useMemo(
    () =>
      filteredProjects.map((project) => {
        const { done, planned, pct } = getPlanProgress(project);
        const lead = getProjectLead(project);
        return {
          Proyecto: project.name,
          Empresa: project.company || '—',
          Fase: formatPhase(project.phase),
          Estado: getStatusToken(project.status).label,
          Herramientas: `${done}/${planned}`,
          Avance: `${pct}%`,
          Fin: project.endDate ? formatDate(project.endDate) : '—',
          Responsable: lead?.name || '—',
          ROI: project.roiData?.results?.roi != null ? formatPercent(project.roiData.results.roi, 1) : '—',
        };
      }),
    [filteredProjects]
  );

  const toolPhaseMap = useMemo(() => {
    const map = {};
    tools.forEach((tool) => {
      map[tool.id] = normalizePhase(tool.phase);
    });
    return map;
  }, [tools]);

  const progressChartData = useMemo(
    () =>
      filteredProjects.map((project) => {
        const { pct } = getPlanProgress(project);
        return { name: project.name.length > 22 ? `${project.name.slice(0, 22)}…` : project.name, pct };
      }),
    [filteredProjects]
  );

  const toolsByPhaseData = useMemo(() => {
    const base = PHASE_ORDER.reduce((acc, phase) => {
      acc[phase] = { phase, not_started: 0, in_progress: 0, completed: 0 };
      return acc;
    }, {});
    filteredProjects.forEach((project) => {
      Object.entries(project.tools || {}).forEach(([toolId, entry]) => {
        const phase = toolPhaseMap[toolId];
        if (!phase || !base[phase]) return;
        const status = entry?.status === 'completed' || entry?.status === 'in_progress' ? entry.status : 'not_started';
        base[phase][status] += 1;
      });
    });
    return PHASE_ORDER.map((phase) => base[phase]);
  }, [filteredProjects, toolPhaseMap]);

  const kpiProjects = filteredProjects.filter((p) => p.kpis?.length);

  const financialProjects = filteredProjects.filter((p) => p.roiData?.results);
  const financialTotals = financialProjects.reduce(
    (acc, project) => {
      const r = project.roiData.results;
      acc.moneySaved += r.moneySaved || 0;
      acc.implementationCost += project.roiData.implementationCost || 0;
      acc.hoursSaved += r.hoursSaved || 0;
      acc.fteEquivalent += r.fteEquivalent || 0;
      return acc;
    },
    { moneySaved: 0, implementationCost: 0, hoursSaved: 0, fteEquivalent: 0 }
  );
  // ROI de la cartera derivado de los propios totales (no un promedio de
  // porcentajes individuales, que sobrestima el retorno real — ver brief F6/B1).
  const portfolioRoi = financialTotals.implementationCost
    ? ((financialTotals.moneySaved - financialTotals.implementationCost) / financialTotals.implementationCost) * 100
    : 0;

  // Tokens del gráfico resueltos a color real (recharts recibe strings de
  // color, var() no resuelve en atributos de presentación SVG). Un único
  // useMemo, recalculado cuando cambia el tema, evita 6 objetos separados.
  const { palette, statusColors, axisTick, gridStroke, tooltipStyle, legendStyle } = useMemo(() => {
    const infoFallback = isDark ? '#8189F6' : '#4F46D6';
    return {
      // Paleta de serie de datos del sistema: primary/secondary/accent + info, en orden.
      palette: [SERIES_STATIC.primary, SERIES_STATIC.secondary, SERIES_STATIC.accent, cssVar('--jc-info', infoFallback)],
      statusColors: {
        completed: cssVar('--jc-success', isDark ? '#4ADE80' : '#12793A'),
        in_progress: cssVar('--jc-warning', isDark ? '#FBBF24' : '#B86A00'),
        not_started: NOT_STARTED_FALLBACK,
      },
      axisTick: { fill: cssVar('--jc-content-muted', isDark ? '#96A1B0' : '#6B7787'), fontSize: 12 },
      gridStroke: cssVar('--jc-line-subtle', isDark ? '#1B222B' : '#EDF0F4'),
      tooltipStyle: {
        backgroundColor: cssVar('--jc-surface', isDark ? '#141A22' : '#FFFFFF'),
        border: `1px solid ${cssVar('--jc-line', isDark ? '#242C38' : '#DFE4EA')}`,
        borderRadius: 8,
        fontSize: 12,
        color: cssVar('--jc-content', isDark ? '#E8ECF1' : '#141A22'),
      },
      legendStyle: { fontSize: 12, color: cssVar('--jc-content-secondary', isDark ? '#B6C0CD' : '#4D5766') },
    };
  }, [isDark]);

  function runExport(exportFn, successMessage) {
    const ok = exportFn();
    setToast({
      show: true,
      type: ok ? 'success' : 'error',
      message: ok ? successMessage : 'No se pudo generar el archivo. Intenta de nuevo.',
    });
  }

  const downloadItems = [
    {
      id: 'all-json',
      label: 'Cartera completa (JSON)',
      icon: Download,
      onSelect: () => runExport(() => exportAllProjects(projects), 'Cartera completa descargada.'),
    },
    {
      id: 'kpi-json',
      label: 'Comparativo de KPIs (JSON)',
      icon: Download,
      onSelect: () => runExport(() => exportKpiComparison(projects), 'Comparativo de KPIs descargado.'),
    },
    ...(scopeProject
      ? [
          {
            id: 'project-json',
            label: 'Proyecto seleccionado (JSON)',
            icon: Download,
            onSelect: () => runExport(() => exportProject(scopeProject), `${scopeProject.name} descargado.`),
          },
        ]
      : []),
    {
      id: 'table-csv',
      label: 'Tabla de cartera (CSV)',
      icon: Download,
      onSelect: () => runExport(() => exportToCsv(csvRows, 'reporte_proyectos.csv'), 'Tabla de cartera descargada.'),
    },
  ];

  function clearFilters() {
    setScopeId('all');
    setStatusFilter('all');
  }

  const hasActiveFilters = scopeId !== 'all' || statusFilter !== 'all';

  return (
    <PageContainer gap="lg">
      <PageHeader
        title="Reportes"
        description="Resumen ejecutivo de la cartera de proyectos"
        actions={
          <>
            <GradientButton
              variant="outline"
              size="sm"
              leadingIcon={<Printer size={16} aria-hidden="true" />}
              onClick={() => window.print()}
            >
              Imprimir
            </GradientButton>
            <Dropdown
              align="end"
              items={downloadItems}
              trigger={
                <GradientButton size="sm" leadingIcon={<Download size={16} aria-hidden="true" />}>
                  Descargar
                </GradientButton>
              }
            />
          </>
        }
      />

      {loading ? (
        <div role="status" aria-busy="true" className="space-y-6">
          <span className="sr-only">Cargando…</span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStat key={i} />
            ))}
          </div>
          <SkeletonTable rows={4} cols={6} />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          variant="sin-datos"
          title="Tus reportes aparecerán aquí"
          description="Crea al menos un proyecto para ver aquí el resumen ejecutivo de tu cartera: avance, KPIs e impacto financiero."
          action={<GradientButton to="/projects/new">Crear un proyecto</GradientButton>}
        />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={fadeInUp} className="card flex flex-wrap items-end gap-4 p-4">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="report-scope" className="mb-1 block text-xs font-medium text-content-secondary">
                Alcance
              </label>
              <select
                id="report-scope"
                className="input"
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
              >
                <option value="all">Todos los proyectos</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {scopeId === 'all' && (
              <div className="min-w-[180px] flex-1">
                <label htmlFor="report-status" className="mb-1 block text-xs font-medium text-content-secondary">
                  Estado
                </label>
                <select
                  id="report-status"
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  {Object.entries(PROJECT_STATUS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {hasActiveFilters && (
              <GradientButton variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </GradientButton>
            )}
          </motion.div>

          {filteredProjects.length === 0 ? (
            <EmptyState
              variant="sin-resultados"
              action={
                <GradientButton variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </GradientButton>
              }
            />
          ) : (
            <>
              <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total de proyectos"
                  value={formatNumber(stats.totalProjects)}
                  icon={<FileText size={20} aria-hidden="true" />}
                  color="brand"
                />
                <StatCard
                  title="Proyectos activos"
                  value={formatNumber(stats.activeProjects)}
                  icon={<TrendingUp size={20} aria-hidden="true" />}
                  color="info"
                />
                <StatCard
                  title="Proyectos completados"
                  value={formatNumber(stats.completedProjects)}
                  icon={<CheckCircle2 size={20} aria-hidden="true" />}
                  color="success"
                />
                <StatCard
                  title="Tasa de finalización"
                  value={formatPercent(stats.completionRate)}
                  icon={<PieChartIcon size={20} aria-hidden="true" />}
                  color="warning"
                  description="Herramientas completadas del total"
                />
              </motion.div>

              <motion.div variants={fadeInUp} className="card overflow-hidden">
                <div className="border-b border-line-subtle px-5 py-4">
                  <h2 className="text-sm font-semibold text-content">Cartera de proyectos</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <caption className="sr-only">
                      Tabla de proyectos con fase, estado, avance, fecha de fin, responsable y ROI
                    </caption>
                    <thead>
                      <tr className="border-b border-line-subtle text-xs text-content-muted">
                        <th scope="col" className="px-5 py-3 font-medium">
                          Proyecto
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Empresa
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Fase
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Estado
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Herramientas
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Fin
                        </th>
                        <th scope="col" className="px-5 py-3 font-medium">
                          Responsable
                        </th>
                        <th scope="col" className="px-5 py-3 text-right font-medium">
                          ROI
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-subtle">
                      {filteredProjects.map((project) => {
                        const { done, planned, pct } = getPlanProgress(project);
                        const urgency = getEndDateUrgency(project);
                        const lead = getProjectLead(project);
                        const roi = project.roiData?.results?.roi;
                        return (
                          <tr key={project.id}>
                            <td className="px-5 py-3 font-medium text-content">
                              <Link
                                to={`/projects/${project.id}`}
                                className="rounded transition-colors duration-fast hover:text-brand hover:underline"
                              >
                                {project.name}
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-content-secondary">{project.company || '—'}</td>
                            <td className="px-5 py-3">
                              <PhaseBadge phase={project.phase} />
                            </td>
                            <td className="px-5 py-3">
                              <StatusBadge status={project.status} kind="project" />
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <span className="tabular-nums text-content-secondary">
                                  {done}/{planned}
                                </span>
                                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken">
                                  <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              {urgency ? (
                                <span className={`inline-flex items-center gap-1 ${TONE_CLASS[urgency.tone]}`}>
                                  {urgency.tone === 'danger' && <AlertTriangle size={13} aria-hidden="true" />}
                                  {urgency.text}
                                </span>
                              ) : (
                                <span className="text-content-muted">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-content-secondary">{lead?.name || '—'}</td>
                            <td className="px-5 py-3 text-right tabular-nums text-content">
                              {roi != null ? formatPercent(roi, 1) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="card p-5">
                <h2 className="section-label mb-4">KPIs por proyecto</h2>
                {kpiProjects.length === 0 ? (
                  <EmptyState variant="sin-datos" size="sm" title="Sin KPIs registrados en este alcance" />
                ) : (
                  <div className="space-y-6">
                    {kpiProjects.map((project) => (
                      <div key={project.id}>
                        <h3 className="mb-2 text-sm font-semibold text-content">{project.name}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[480px] text-left text-sm">
                            <caption className="sr-only">KPIs de {project.name}</caption>
                            <thead>
                              <tr className="border-b border-line-subtle text-xs text-content-muted">
                                <th scope="col" className="py-2 pr-4 font-medium">
                                  Indicador
                                </th>
                                <th scope="col" className="py-2 pr-4 font-medium">
                                  Línea base
                                </th>
                                <th scope="col" className="py-2 pr-4 font-medium">
                                  Actual
                                </th>
                                <th scope="col" className="py-2 font-medium">
                                  Meta
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line-subtle">
                              {project.kpis.map((kpi) => (
                                <tr key={kpi.id}>
                                  <td className="py-2 pr-4 text-content">{kpi.name}</td>
                                  <td className="py-2 pr-4 text-content-secondary">{kpi.baseLine}</td>
                                  <td className="py-2 pr-4 font-medium text-content">{kpi.current}</td>
                                  <td className="py-2 text-content-secondary">{kpi.target}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div variants={fadeInUp} className="card overflow-hidden">
                <div className="border-b border-line-subtle px-5 py-4">
                  <h2 className="text-sm font-semibold text-content">Impacto financiero</h2>
                </div>
                {financialProjects.length === 0 ? (
                  <div className="p-5">
                    <EmptyState variant="sin-datos" size="sm" title="Sin datos de ROI en este alcance" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <caption className="sr-only">Impacto financiero por proyecto</caption>
                      <thead>
                        <tr className="border-b border-line-subtle text-xs text-content-muted">
                          <th scope="col" className="px-5 py-3 font-medium">
                            Proyecto
                          </th>
                          <th scope="col" className="px-5 py-3 text-right font-medium">
                            Ahorro estimado
                          </th>
                          <th scope="col" className="px-5 py-3 text-right font-medium">
                            ROI
                          </th>
                          <th scope="col" className="px-5 py-3 text-right font-medium">
                            Recuperación
                          </th>
                          <th scope="col" className="px-5 py-3 text-right font-medium">
                            Horas ahorradas
                          </th>
                          <th scope="col" className="px-5 py-3 text-right font-medium">
                            Equiv. FTE
                          </th>
                          <th scope="col" className="px-5 py-3 text-right font-medium">
                            Costo de implementación
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-subtle">
                        {financialProjects.map((project) => {
                          const r = project.roiData.results;
                          return (
                            <tr key={project.id}>
                              <td className="px-5 py-3 font-medium text-content">{project.name}</td>
                              <td className="px-5 py-3 text-right tabular-nums text-content">
                                {formatCurrency(r.moneySaved)}
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums text-content">
                                {formatPercent(r.roi, 1)}
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums text-content-secondary">
                                {formatNumber(r.paybackMonths, { maximumFractionDigits: 1 })} meses
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums text-content-secondary">
                                {formatNumber(r.hoursSaved)}
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums text-content-secondary">
                                {formatNumber(r.fteEquivalent, { maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums text-content-secondary">
                                {formatCurrency(project.roiData.implementationCost)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-line bg-surface-sunken/60 font-semibold text-content">
                          <td className="px-5 py-3">Total de la cartera</td>
                          <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(financialTotals.moneySaved)}</td>
                          <td className="px-5 py-3 text-right tabular-nums">{formatPercent(portfolioRoi, 1)}</td>
                          <td className="px-5 py-3 text-right text-content-secondary">—</td>
                          <td className="px-5 py-3 text-right tabular-nums">{formatNumber(financialTotals.hoursSaved)}</td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {formatNumber(financialTotals.fteEquivalent, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {formatCurrency(financialTotals.implementationCost)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </motion.div>

              <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="card p-5">
                  <h2 className="mb-4 text-sm font-semibold text-content">Avance por proyecto</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressChartData} margin={{ top: 4, left: -16, right: 8, bottom: 8 }}>
                        <CartesianGrid vertical={false} stroke={gridStroke} />
                        <XAxis
                          dataKey="name"
                          tick={axisTick}
                          tickLine={false}
                          axisLine={{ stroke: gridStroke }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={56}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={axisTick}
                          tickLine={false}
                          axisLine={false}
                          width={44}
                          tickFormatter={(v) => formatPercent(v)}
                        />
                        <RechartsTooltip contentStyle={tooltipStyle} formatter={(value) => [formatPercent(value), 'Avance']} />
                        <Bar dataKey="pct" name="Avance" fill={palette[0]} radius={[4, 4, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-5">
                  <h2 className="mb-4 text-sm font-semibold text-content">Herramientas por estado y fase</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={toolsByPhaseData} margin={{ top: 4, left: -16, right: 8, bottom: 8 }}>
                        <CartesianGrid vertical={false} stroke={gridStroke} />
                        <XAxis
                          dataKey="phase"
                          tickFormatter={(v) => formatPhase(v)}
                          tick={axisTick}
                          tickLine={false}
                          axisLine={{ stroke: gridStroke }}
                        />
                        <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={32} />
                        <RechartsTooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name) => [formatNumber(value), getToolStatusToken(name).label]}
                        />
                        <Legend formatter={(value) => getToolStatusToken(value).label} wrapperStyle={legendStyle} />
                        <Bar dataKey="completed" name="completed" stackId="tools" fill={statusColors.completed} maxBarSize={48} />
                        <Bar dataKey="in_progress" name="in_progress" stackId="tools" fill={statusColors.in_progress} maxBarSize={48} />
                        <Bar
                          dataKey="not_started"
                          name="not_started"
                          stackId="tools"
                          fill={statusColors.not_started}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      )}

      <Notification
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
        duration={3500}
      />
    </PageContainer>
  );
};

export default ReportsPage;
