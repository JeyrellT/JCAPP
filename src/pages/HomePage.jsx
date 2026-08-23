import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Plus,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  CalendarClock,
  Flag,
  Wrench,
  Sparkles,
  Target,
  BarChart2,
  GitBranch,
  Layers,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';

// Componentes
import StatCard from '../components/common/StatCard';
import ProjectCard from '../components/common/ProjectCard';
import GradientButton from '../components/common/GradientButton';

// ---------------------------------------------------------------------------
// Vocabulario visual local de fases DMAIC.
// (Duplicado deliberadamente aquí: src/lib/phases.js es propiedad de otro
// carril del Ciclo 1 y esta página solo puede tocar este archivo. Cuando
// exista, esta sección puede sustituirse por getPhaseToken()/PHASE_ORDER.)
// ---------------------------------------------------------------------------
const PHASE_ORDER = ['Define', 'Measure', 'Analyze', 'Improve', 'Control'];

const PHASE_META = {
  Define: { letter: 'D', icon: Target, bg: 'bg-phase-define-soft', text: 'text-phase-define-on' },
  Measure: { letter: 'M', icon: BarChart2, bg: 'bg-phase-measure-soft', text: 'text-phase-measure-on' },
  Analyze: { letter: 'A', icon: GitBranch, bg: 'bg-phase-analyze-soft', text: 'text-phase-analyze-on' },
  Improve: { letter: 'I', icon: Layers, bg: 'bg-phase-improve-soft', text: 'text-phase-improve-on' },
  Control: { letter: 'C', icon: CheckCircle2, bg: 'bg-phase-control-soft', text: 'text-phase-control-on' },
};

// Días de calendario entre hoy y una fecha ISO. Positivo = futuro, negativo = pasado.
function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((startOfTarget - startOfToday) / 86400000);
}

function dueLabel(days) {
  if (days === null) return '';
  if (days < 0) return `Vencido hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Vence hoy';
  return `Vence en ${days} día${days === 1 ? '' : 's'}`;
}

// Variantes de animación (equivalentes a src/lib/motion.js, sin depender del archivo).
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.05, 0.7, 0.1, 1] } },
};

const HomePage = () => {
  const { projects, tools, getStats } = useLeanSixSigma();
  const stats = getStats();
  const shouldReduceMotion = useReducedMotion();

  const activeCount = projects.filter((p) => p.status === 'active').length;

  // Descripción de la cabecera construida enteramente desde datos reales.
  const dueSoonProjects = projects.filter((p) => {
    if (p.status === 'completed' || p.status === 'cancelled') return false;
    const d = daysUntil(p.endDate);
    return d !== null && d >= 0 && d <= 30;
  });

  const headerDescription =
    stats.totalProjects === 0
      ? 'Sin proyectos registrados'
      : `${stats.totalProjects} proyecto${stats.totalProjects === 1 ? '' : 's'} · ${activeCount} activo${
          activeCount === 1 ? '' : 's'
        }${
          dueSoonProjects.length > 0
            ? ` · ${dueSoonProjects.length} vence${dueSoonProjects.length === 1 ? '' : 'n'} en 30 días`
            : ''
        }`;

  // Asuntos abiertos (issues con status 'open') en todos los proyectos.
  const openIssuesCount = projects.reduce(
    (sum, p) => sum + (p.issues || []).filter((i) => i.status === 'open').length,
    0
  );

  // --- Banda "Requiere atención" ---------------------------------------
  // Prioridad: vencidos > por vencer (<=30 días) > asuntos abiertos > riesgos altos > herramientas en progreso.
  const attentionItems = [];

  projects.forEach((p) => {
    if (p.status === 'completed' || p.status === 'cancelled') return;
    const d = daysUntil(p.endDate);
    if (d !== null && d < 0) {
      attentionItems.push({
        id: `overdue-${p.id}`,
        tone: 'danger',
        icon: AlertTriangle,
        text: p.name,
        meta: dueLabel(d),
        to: `/projects/${p.id}`,
      });
    }
  });

  dueSoonProjects.forEach((p) => {
    attentionItems.push({
      id: `duesoon-${p.id}`,
      tone: 'warning',
      icon: CalendarClock,
      text: p.name,
      meta: dueLabel(daysUntil(p.endDate)),
      to: `/projects/${p.id}`,
    });
  });

  projects.forEach((p) => {
    (p.issues || [])
      .filter((i) => i.status === 'open')
      .forEach((i) => {
        attentionItems.push({
          id: `issue-${i.id}`,
          tone: 'warning',
          icon: Flag,
          text: i.description,
          meta: p.name,
          to: `/projects/${p.id}`,
        });
      });
  });

  projects.forEach((p) => {
    (p.risks || [])
      .filter((r) => r.probability === 'alta' || r.impact === 'alta')
      .forEach((r) => {
        attentionItems.push({
          id: `risk-${r.id}`,
          tone: 'warning',
          icon: AlertTriangle,
          text: `Riesgo alto: ${r.description}`,
          meta: p.name,
          to: `/projects/${p.id}`,
        });
      });
  });

  projects.forEach((p) => {
    Object.entries(p.tools || {})
      .filter(([, t]) => t.status === 'in_progress')
      .forEach(([toolId]) => {
        const toolDef = tools.find((t) => t.id === toolId);
        attentionItems.push({
          id: `tool-${p.id}-${toolId}`,
          tone: 'info',
          icon: Wrench,
          text: `${toolDef ? toolDef.name : toolId} en progreso`,
          meta: p.name,
          to: `/projects/${p.id}/tools/${toolId}`,
        });
      });
  });

  const attentionRows = attentionItems.slice(0, 6);

  const toneClasses = {
    danger: 'bg-danger-soft text-danger-on',
    warning: 'bg-warning-soft text-warning-on',
    info: 'bg-info-soft text-info-on',
  };

  // --- Banda "Continuar donde se dejó" ----------------------------------
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  // --- Banda "Fases DMAIC" ----------------------------------------------
  const toolCountByPhase = PHASE_ORDER.reduce((acc, phase) => {
    acc[phase] = tools.filter(
      (t) => t.phase && t.phase.toLowerCase() === phase.toLowerCase()
    ).length;
    return acc;
  }, {});

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : container}
      initial={shouldReduceMotion ? undefined : 'hidden'}
      animate={shouldReduceMotion ? undefined : 'visible'}
      className="space-y-8"
    >
      {/* Cabecera: contexto real, una sola acción primaria */}
      <motion.div
        variants={shouldReduceMotion ? undefined : item}
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-content-muted mb-1">
            Panel
          </p>
          <h1 className="text-2xl font-semibold text-content">Panel de control</h1>
          <p className="text-sm text-content-secondary mt-1">{headerDescription}</p>
        </div>
        <GradientButton to="/projects/new" className="inline-flex items-center gap-2 shrink-0">
          <Plus size={16} />
          Nuevo proyecto
        </GradientButton>
      </motion.div>

      {/* Indicadores agregados, todos derivados de getStats() y de los proyectos reales */}
      <motion.div variants={shouldReduceMotion ? undefined : item}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Proyectos activos"
            value={stats.activeProjects}
            icon={<Building />}
            color="teal"
            description={`de ${stats.totalProjects} en total`}
          />
          <StatCard
            title="Herramientas completadas"
            value={stats.completedTools}
            icon={<CheckCircle2 />}
            color="green"
            description={`${stats.completionRate}% de ${stats.totalTools} registradas`}
          />
          <StatCard
            title="Vencen en 30 días"
            value={dueSoonProjects.length}
            icon={<CalendarClock />}
            color="orange"
            description="Fecha de cierre próxima"
          />
          <StatCard
            title="Asuntos abiertos"
            value={openIssuesCount}
            icon={<Flag />}
            color="red"
            description="Requieren decisión"
          />
        </div>
      </motion.div>

      {/* Requiere atención */}
      <motion.div variants={shouldReduceMotion ? undefined : item}>
        <h2 className="text-lg font-semibold text-content mb-4">Requiere atención</h2>

        {attentionRows.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl shadow-xs p-8 text-center">
            <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-success-soft text-success-on flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-sm font-medium text-content">Sin asuntos pendientes</p>
            <p className="text-sm text-content-muted mt-1 max-w-md mx-auto">
              Ningún proyecto vencido ni asunto abierto. Cuando algo se salga de los límites,
              aparecerá aquí.
            </p>
          </div>
        ) : (
          <ul className="bg-surface border border-line rounded-xl shadow-xs divide-y divide-line-subtle">
            {attentionRows.map((row) => {
              const RowIcon = row.icon;
              return (
                <li key={row.id}>
                  <Link
                    to={row.to}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-sunken transition-colors duration-fast"
                  >
                    <span
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${toneClasses[row.tone]}`}
                    >
                      <RowIcon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-content truncate">
                        {row.text}
                      </span>
                      <span className="block text-xs text-content-muted truncate">{row.meta}</span>
                    </span>
                    <ArrowUpRight size={16} className="shrink-0 text-content-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>

      {/* Continuar donde se dejó */}
      <motion.div variants={shouldReduceMotion ? undefined : item}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-content">Continuar donde se dejó</h2>
          <Link
            to="/projects"
            className="text-sm font-medium text-brand hover:text-brand-hover inline-flex items-center gap-1"
          >
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl shadow-xs p-8 text-center">
            <p className="text-sm font-medium text-content">Sin proyectos registrados</p>
            <p className="text-sm text-content-muted mt-1">
              Todo proyecto empieza por definir el problema. El ciclo DMAIC hace el resto.
            </p>
            <GradientButton to="/projects/new" className="inline-flex items-center gap-2 mt-4">
              <Plus size={16} />
              Crear proyecto
            </GradientButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Fases DMAIC: cierre ligero, navegable */}
      <motion.div variants={shouldReduceMotion ? undefined : item} className="pt-2">
        <h2 className="text-lg font-semibold text-content mb-4">Fases DMAIC</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PHASE_ORDER.map((phase) => {
            const meta = PHASE_META[phase];
            const PhaseIcon = meta.icon;
            return (
              <Link
                key={phase}
                to={`/tools#${phase.toLowerCase()}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface shadow-xs px-4 py-3 hover:shadow-md hover:-translate-y-px transition-all duration-base"
              >
                <span
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-semibold ${meta.bg} ${meta.text}`}
                >
                  {meta.letter}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-content">{phase}</span>
                  <span className="block text-xs text-content-muted flex items-center gap-1">
                    <PhaseIcon size={12} />
                    {toolCountByPhase[phase]} herramienta{toolCountByPhase[phase] === 1 ? '' : 's'}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <p className="text-sm text-content-muted mt-4 flex items-center gap-1.5">
          <Sparkles size={14} className="text-brand" />
          ¿Necesita repasar el método?{' '}
          <Link to="/methodology" className="text-brand hover:text-brand-hover font-medium">
            Ver metodología
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default HomePage;
