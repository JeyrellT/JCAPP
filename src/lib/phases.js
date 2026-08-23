// Léxico visual del dominio: fases DMAIC, estado de proyecto y estado de herramienta.
// Todas las clases son ESTÁTICAS: Tailwind no detecta clases construidas dinámicamente.

export const PHASE_ORDER = ['Define', 'Measure', 'Analyze', 'Improve', 'Control'];

export const PHASE_META = {
  Define: {
    key: 'define', letter: 'D', label: 'Define',
    desc: 'Delimitar el problema, el alcance y los requisitos',
    bg: 'bg-phase-define-soft', text: 'text-phase-define-on',
    dot: 'bg-phase-define', border: 'border-phase-define', solid: 'bg-phase-define',
  },
  Measure: {
    key: 'measure', letter: 'M', label: 'Measure',
    desc: 'Medir el desempeño actual y establecer la línea base',
    bg: 'bg-phase-measure-soft', text: 'text-phase-measure-on',
    dot: 'bg-phase-measure', border: 'border-phase-measure', solid: 'bg-phase-measure',
  },
  Analyze: {
    key: 'analyze', letter: 'A', label: 'Analyze',
    desc: 'Identificar y validar las causas raíz',
    bg: 'bg-phase-analyze-soft', text: 'text-phase-analyze-on',
    dot: 'bg-phase-analyze', border: 'border-phase-analyze', solid: 'bg-phase-analyze',
  },
  Improve: {
    key: 'improve', letter: 'I', label: 'Improve',
    desc: 'Diseñar, priorizar e implementar las soluciones',
    bg: 'bg-phase-improve-soft', text: 'text-phase-improve-on',
    dot: 'bg-phase-improve', border: 'border-phase-improve', solid: 'bg-phase-improve',
  },
  Control: {
    key: 'control', letter: 'C', label: 'Control',
    desc: 'Sostener la mejora y monitorear el proceso',
    bg: 'bg-phase-control-soft', text: 'text-phase-control-on',
    dot: 'bg-phase-control', border: 'border-phase-control', solid: 'bg-phase-control',
  },
};

const PHASE_FALLBACK = {
  key: 'none', letter: '·', label: 'Sin fase', desc: '',
  bg: 'bg-surface-sunken', text: 'text-content-muted',
  dot: 'bg-neutral-400', border: 'border-line', solid: 'bg-neutral-400',
};

// Normaliza 'define' | 'Define' | 'DEFINE' -> 'Define'. Nunca muta los datos de origen.
export function normalizePhase(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  return PHASE_ORDER.find((p) => p.toLowerCase() === v) || null;
}

export function formatPhase(value) {
  return normalizePhase(value) || String(value ?? '');
}

export function getPhaseToken(value) {
  const p = normalizePhase(value);
  return p ? PHASE_META[p] : PHASE_FALLBACK;
}

export const PROJECT_STATUS = {
  active:    { label: 'Activo',        bg: 'bg-info-soft',    text: 'text-info-on',    dot: 'bg-info' },
  planning:  { label: 'Planificación', bg: 'bg-warning-soft', text: 'text-warning-on', dot: 'bg-warning' },
  completed: { label: 'Completado',    bg: 'bg-success-soft', text: 'text-success-on', dot: 'bg-success' },
  on_hold:   { label: 'En pausa',      bg: 'bg-surface-sunken', text: 'text-content-secondary', dot: 'bg-neutral-400' },
  cancelled: { label: 'Cancelado',     bg: 'bg-danger-soft',  text: 'text-danger-on',  dot: 'bg-danger' },
};

const STATUS_FALLBACK = { label: 'Sin estado', bg: 'bg-surface-sunken', text: 'text-content-muted', dot: 'bg-neutral-400' };

export function getStatusToken(status) {
  return PROJECT_STATUS[status] || STATUS_FALLBACK;
}

export const TOOL_STATUS = {
  not_started: { label: 'Sin iniciar',  bg: 'bg-surface-sunken', text: 'text-content-secondary', dot: 'bg-neutral-400' },
  in_progress: { label: 'En progreso',  bg: 'bg-warning-soft',   text: 'text-warning-on',        dot: 'bg-warning' },
  completed:   { label: 'Completada',   bg: 'bg-success-soft',   text: 'text-success-on',        dot: 'bg-success' },
};

export function getToolStatusToken(status) {
  return TOOL_STATUS[status] || TOOL_STATUS.not_started;
}
