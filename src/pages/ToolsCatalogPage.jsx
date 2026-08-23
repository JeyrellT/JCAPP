import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Target,
  BarChart2,
  GitBranch,
  Layers,
  CheckCircle2,
  Calendar,
  Clipboard,
  GitMerge,
  MessageSquare,
  Users,
  Grid,
  BarChart,
  AlertTriangle,
  LineChart,
  DollarSign,
  Wrench,
} from 'lucide-react';
import tools from '../data/tools';
import GradientButton from '../components/common/GradientButton';

// ---------------------------------------------------------------------------
// Vocabulario visual local de fases DMAIC.
// (Duplicado deliberadamente aquí: src/lib/phases.js es propiedad de otro
// carril del Ciclo 1 y esta página solo puede tocar este archivo. Las clases
// de fase se escriben literalmente -nunca interpoladas- porque Tailwind JIT
// no detecta `bg-${phase.color}-100`.)
// ---------------------------------------------------------------------------
const PHASE_ORDER = ['Define', 'Measure', 'Analyze', 'Improve', 'Control'];

const PHASE_META = {
  Define: { letter: 'D', icon: Target, bg: 'bg-phase-define', bgSoft: 'bg-phase-define-soft', text: 'text-phase-define-on' },
  Measure: { letter: 'M', icon: BarChart2, bg: 'bg-phase-measure', bgSoft: 'bg-phase-measure-soft', text: 'text-phase-measure-on' },
  Analyze: { letter: 'A', icon: GitBranch, bg: 'bg-phase-analyze', bgSoft: 'bg-phase-analyze-soft', text: 'text-phase-analyze-on' },
  Improve: { letter: 'I', icon: Layers, bg: 'bg-phase-improve', bgSoft: 'bg-phase-improve-soft', text: 'text-phase-improve-on' },
  Control: { letter: 'C', icon: CheckCircle2, bg: 'bg-phase-control', bgSoft: 'bg-phase-control-soft', text: 'text-phase-control-on' },
};

// Iconos usados por src/data/tools.js (campo `icon`, nombre de lucide-react).
// Fallback a Wrench si algún día se agrega una herramienta con un icono no listado aquí.
const TOOL_ICONS = {
  Calendar,
  Clipboard,
  GitMerge,
  MessageSquare,
  BarChart2,
  GitBranch,
  Users,
  Grid,
  BarChart,
  AlertTriangle,
  LineChart,
  Layers,
  DollarSign,
};

// Badges de dificultad sobre tokens semánticos existentes.
const DIFFICULTY_STYLES = {
  Baja: 'bg-success-soft text-success-on',
  Media: 'bg-warning-soft text-warning-on',
  Alta: 'bg-danger-soft text-danger-on',
};

// Variantes de animación (equivalentes a src/lib/motion.js, sin depender del archivo).
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.05, 0.7, 0.1, 1] } },
};

const ToolsCatalogPage = () => {
  const shouldReduceMotion = useReducedMotion();

  const toolsByPhase = PHASE_ORDER.reduce((acc, phase) => {
    acc[phase] = tools.filter((t) => t.phase === phase);
    return acc;
  }, {});

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
        <h1 className="text-2xl font-semibold text-content">Catálogo de Herramientas</h1>
        <p className="text-sm text-content-secondary mt-1">
          {tools.length} herramientas Lean Six Sigma organizadas por fase DMAIC.
        </p>
      </motion.div>

      {/* Grupos por fase */}
      {PHASE_ORDER.map((phase) => {
        const phaseTools = toolsByPhase[phase];
        if (phaseTools.length === 0) return null;
        const meta = PHASE_META[phase];
        const PhaseIcon = meta.icon;

        return (
          <motion.div key={phase} variants={shouldReduceMotion ? undefined : item}>
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${meta.bg} text-white`}
              >
                {meta.letter}
              </span>
              <h2 className="text-lg font-semibold text-content flex items-center gap-1.5">
                {phase}
              </h2>
              <span className="text-xs text-content-muted">
                {phaseTools.length} herramienta{phaseTools.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {phaseTools.map((tool) => {
                const ToolIcon = TOOL_ICONS[tool.icon] || Wrench;
                return (
                  <div
                    key={tool.id}
                    className="bg-surface border border-line rounded-xl shadow-xs p-5 transition-shadow duration-base ease-standard hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${meta.bgSoft} ${meta.text}`}>
                        <ToolIcon size={18} />
                      </span>
                      <span
                        className={`text-2xs font-medium px-2 py-1 rounded-md whitespace-nowrap ${
                          DIFFICULTY_STYLES[tool.difficulty] || 'bg-surface-sunken text-content-muted'
                        }`}
                      >
                        {tool.difficulty}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-content mt-3">{tool.name}</h3>
                    <p className="text-sm text-content-muted mt-1 line-clamp-2">{tool.description}</p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <PhaseIcon size={12} className={meta.text} />
                      <span className="text-2xs font-medium text-content-muted">{phase}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* Cierre */}
      <motion.div variants={shouldReduceMotion ? undefined : item} className="pt-2 text-center">
        <GradientButton to="/projects" className="inline-flex items-center gap-2">
          Ver mis proyectos
        </GradientButton>
      </motion.div>
    </motion.div>
  );
};

export default ToolsCatalogPage;
