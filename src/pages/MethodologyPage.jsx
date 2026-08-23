import { motion, useReducedMotion } from 'framer-motion';
import {
  Target,
  BarChart2,
  GitBranch,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Repeat,
  Clock,
  Users,
  Truck,
  Package,
  Move,
  Layers3,
  LineChart,
  Activity,
  Gauge,
} from 'lucide-react';
import GradientButton from '../components/common/GradientButton';

// ---------------------------------------------------------------------------
// Vocabulario visual local de fases DMAIC.
// (Duplicado deliberadamente aquí: src/lib/phases.js es propiedad de otro
// carril del Ciclo 1 y esta página solo puede tocar este archivo. Las clases
// de fase se escriben literalmente -nunca interpoladas- porque Tailwind JIT
// no detecta `bg-${phase.color}-100`.)
// ---------------------------------------------------------------------------
const DMAIC_PHASES = [
  {
    key: 'define',
    letter: 'D',
    name: 'Define',
    description: 'Identificar el problema y requisitos',
    tools: ['Project Charter', 'VOC'],
    icon: Target,
    bg: 'bg-phase-define',
    bgSoft: 'bg-phase-define-soft',
    text: 'text-phase-define-on',
  },
  {
    key: 'measure',
    letter: 'M',
    name: 'Measure',
    description: 'Medir y establecer línea base',
    tools: ['CTQ Dashboard', 'Control Chart'],
    icon: BarChart2,
    bg: 'bg-phase-measure',
    bgSoft: 'bg-phase-measure-soft',
    text: 'text-phase-measure-on',
  },
  {
    key: 'analyze',
    letter: 'A',
    name: 'Analyze',
    description: 'Identificar causas raíz',
    tools: ['Pareto Chart', 'Cause-Effect'],
    icon: GitBranch,
    bg: 'bg-phase-analyze',
    bgSoft: 'bg-phase-analyze-soft',
    text: 'text-phase-analyze-on',
  },
  {
    key: 'improve',
    letter: 'I',
    name: 'Improve',
    description: 'Implementar soluciones',
    tools: ['FMEA', 'Priorization'],
    icon: Layers,
    bg: 'bg-phase-improve',
    bgSoft: 'bg-phase-improve-soft',
    text: 'text-phase-improve-on',
  },
  {
    key: 'control',
    letter: 'C',
    name: 'Control',
    description: 'Mantener mejoras',
    tools: ['Control Plans', '5S'],
    icon: CheckCircle2,
    bg: 'bg-phase-control',
    bgSoft: 'bg-phase-control-soft',
    text: 'text-phase-control-on',
  },
];

const LEAN_WASTES = [
  { name: 'Defectos', icon: AlertTriangle },
  { name: 'Sobreproducción', icon: Repeat },
  { name: 'Espera', icon: Clock },
  { name: 'Talento no utilizado', icon: Users },
  { name: 'Transporte', icon: Truck },
  { name: 'Inventario', icon: Package },
  { name: 'Movimiento', icon: Move },
  { name: 'Exceso de procesamiento', icon: Layers3 },
];

const SIX_SIGMA_POINTS = [
  {
    title: 'Análisis estadístico',
    description: 'Herramientas avanzadas para examinar datos y tendencias',
    icon: LineChart,
  },
  {
    title: 'Gráficos de control',
    description: 'Monitoreo de procesos en tiempo real',
    icon: Activity,
  },
  {
    title: 'Métricas de rendimiento',
    description: 'Evaluación continua de la calidad del proceso',
    icon: Gauge,
  },
];

// Variantes de animación (equivalentes a src/lib/motion.js, sin depender del archivo).
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.05, 0.7, 0.1, 1] } },
};

const MethodologyPage = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : container}
      initial={shouldReduceMotion ? undefined : 'hidden'}
      animate={shouldReduceMotion ? undefined : 'visible'}
      className="space-y-8"
    >
      {/* Cabecera */}
      <motion.div variants={shouldReduceMotion ? undefined : item}>
        <p className="text-2xs font-semibold uppercase tracking-wider text-content-muted mb-1">
          Referencia
        </p>
        <h1 className="text-2xl font-semibold text-content">Metodología</h1>
        <p className="text-sm text-content-secondary mt-1">
          El ciclo DMAIC y los principios Lean Six Sigma que guían cada proyecto.
        </p>
      </motion.div>

      {/* DMAIC */}
      <motion.div variants={shouldReduceMotion ? undefined : item}>
        <h2 className="text-lg font-semibold text-content mb-4">Ciclo DMAIC</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {DMAIC_PHASES.map((phase) => {
            const PhaseIcon = phase.icon;
            return (
              <div
                key={phase.key}
                className="bg-surface border border-line rounded-xl shadow-xs p-5 transition-shadow duration-base ease-standard hover:shadow-md"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-lg ${phase.bg} text-white`}
                >
                  {phase.letter}
                </div>
                <h3 className="text-base font-semibold text-content mt-4 flex items-center gap-1.5">
                  <PhaseIcon size={15} className={phase.text} />
                  {phase.name}
                </h3>
                <p className="text-sm text-content-secondary mt-1">{phase.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {phase.tools.map((toolName) => (
                    <span
                      key={toolName}
                      className={`text-2xs font-medium px-2 py-1 rounded-md ${phase.bgSoft} ${phase.text}`}
                    >
                      {toolName}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Lean: eliminar desperdicios */}
      <motion.div variants={shouldReduceMotion ? undefined : item}>
        <div className="bg-surface border border-line rounded-xl shadow-xs p-6">
          <h2 className="text-lg font-semibold text-content">Lean: Eliminar desperdicios</h2>
          <p className="text-sm text-content-secondary mt-1">
            Aplicamos principios Lean para eliminar los 8 tipos de desperdicios en tus procesos.
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LEAN_WASTES.map((waste) => {
              const WasteIcon = waste.icon;
              return (
                <div
                  key={waste.name}
                  className="flex flex-col items-center text-center gap-2 rounded-lg border border-line-subtle bg-surface-sunken px-3 py-4"
                >
                  <span className="w-9 h-9 rounded-full bg-danger-soft text-danger-on flex items-center justify-center">
                    <WasteIcon size={16} />
                  </span>
                  <span className="text-xs font-medium text-content">{waste.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Six Sigma: reducir variación */}
      <motion.div variants={shouldReduceMotion ? undefined : item}>
        <div className="bg-surface border border-line rounded-xl shadow-xs p-6">
          <h2 className="text-lg font-semibold text-content">Six Sigma: Reducir variación</h2>
          <p className="text-sm text-content-secondary mt-1">
            Aplica técnicas de Six Sigma para reducir la variabilidad de tus procesos.
          </p>
          <ol className="mt-5 space-y-4">
            {SIX_SIGMA_POINTS.map((point, index) => {
              const PointIcon = point.icon;
              return (
                <li key={point.title} className="flex items-start gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content flex items-center gap-1.5">
                      <PointIcon size={14} className="text-content-muted" />
                      {point.title}
                    </p>
                    <p className="text-sm text-content-muted mt-0.5">{point.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </motion.div>

      {/* Cierre */}
      <motion.div variants={shouldReduceMotion ? undefined : item} className="pt-2 text-center">
        <GradientButton to="/tools" className="inline-flex items-center gap-2">
          Explorar catálogo de herramientas
        </GradientButton>
      </motion.div>
    </motion.div>
  );
};

export default MethodologyPage;
