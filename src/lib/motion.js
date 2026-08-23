// Fuente única de duraciones, curvas y variantes de animación del sistema.
export const duration = { instant: 0.08, fast: 0.14, base: 0.2, slow: 0.28, page: 0.22 };

export const ease = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0.05, 0.7, 0.1, 1],
  accelerate: [0.3, 0, 0.8, 0.15],
  emphasized: [0.16, 1, 0.3, 1],
};

export const spring = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 };

export const transition = {
  fast: { duration: duration.fast, ease: ease.standard },
  base: { duration: duration.base, ease: ease.standard },
  enter: { duration: duration.base, ease: ease.decelerate },
  exit: { duration: duration.fast, ease: ease.accelerate },
  modalIn: { duration: duration.slow, ease: ease.emphasized },
  modalOut: { duration: 0.16, ease: ease.accelerate },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: transition.enter },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0, when: 'beforeChildren' },
  },
};

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.page, ease: ease.decelerate } },
};

export const backdropMotion = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: ease.standard } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: ease.accelerate } },
};

export const modalPanel = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transition.modalIn },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: transition.modalOut },
};

export const popover = {
  hidden: { opacity: 0, scale: 0.98, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.fast, ease: ease.decelerate } },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.1, ease: ease.accelerate } },
};

export const tooltipMotion = {
  hidden: { opacity: 0, scale: 0.98, y: 4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.fast, ease: ease.decelerate } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: ease.accelerate } },
};

// Variantes neutras para prefers-reduced-motion (usar con useReducedMotion()).
export const still = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0 } }, exit: { opacity: 0, transition: { duration: 0 } } };
