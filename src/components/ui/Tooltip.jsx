/**
 * Tooltip.jsx
 * ---------------------------------------------------------------------------
 * Tooltip accesible, montado en portal, con delay razonable, posicionamiento
 * automático con flip (top/bottom/left/right) y una ventana de "grupo": si
 * ya había un tooltip abierto hace poco, el siguiente aparece sin delay
 * (útil al recorrer una barra de iconos).
 *
 * Uso:
 *   <Tooltip content="Cerrar" side="bottom">
 *     <button aria-label="Cerrar"><X size={16} /></button>
 *   </Tooltip>
 *
 * Si `content` es falsy, el hijo se devuelve tal cual (sin envoltorio ni
 * overhead). `children` debe ser un único elemento válido: se clona con
 * `cloneElement` para inyectar los manejadores y `aria-describedby`.
 * ---------------------------------------------------------------------------
 */
import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else ref.current = node;
    });
  };
}

function isFocusVisible(el) {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

// Ventana de grupo a nivel de módulo: si el tooltip anterior se cerró hace
// menos de GROUP_WINDOW ms, el siguiente abre sin esperar el delay.
let lastCloseTimestamp = 0;
const GROUP_WINDOW = 300;

function buildVariants(placement) {
  const offsetMap = { top: { y: 4 }, bottom: { y: -4 }, left: { x: 4 }, right: { x: -4 } };
  const from = offsetMap[placement] || offsetMap.top;
  return {
    hidden: { opacity: 0, scale: 0.98, ...from },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.14, ease: [0.05, 0.7, 0.1, 1] },
    },
    exit: { opacity: 0, transition: { duration: 0.1, ease: [0.3, 0, 0.8, 0.15] } },
  };
}

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

/**
 * @param {import('react').ReactNode} content contenido del tooltip; si es falsy no se envuelve el hijo
 * @param {import('react').ReactElement} children único elemento que dispara el tooltip
 * @param {'top'|'bottom'|'left'|'right'} [side='top']
 * @param {'start'|'center'|'end'} [align='center']
 * @param {number} [delay=300] ms antes de abrir
 * @param {number} [closeDelay=80] ms antes de cerrar
 * @param {number} [offset=8] separación en px respecto al trigger
 * @param {number} [maxWidth=260]
 * @param {boolean} [showArrow=true]
 * @param {boolean} [interactive=false] permite mover el mouse sobre el tooltip sin que se cierre
 * @param {boolean} [disabled=false]
 */
export default function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delay = 300,
  closeDelay = 80,
  offset = 8,
  maxWidth = 260,
  showArrow = true,
  interactive = false,
  disabled = false,
  className = '',
}) {
  const instanceId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: -9999, left: -9999, arrowLeft: undefined, arrowTop: undefined });
  const [placement, setPlacement] = useState(side);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  function clearTimers() {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function show(immediate = false) {
    if (disabled || !content) return;
    clearTimers();
    const withinGroupWindow = Date.now() - lastCloseTimestamp < GROUP_WINDOW;
    const effectiveDelay = immediate || withinGroupWindow ? 0 : delay;
    if (effectiveDelay === 0) {
      setIsOpen(true);
    } else {
      openTimer.current = setTimeout(() => setIsOpen(true), effectiveDelay);
    }
  }

  function hide(withDelay = true) {
    clearTimers();
    if (withDelay && closeDelay > 0) {
      closeTimer.current = setTimeout(() => {
        setIsOpen(false);
        lastCloseTimestamp = Date.now();
      }, closeDelay);
    } else {
      setIsOpen(false);
      lastCloseTimestamp = Date.now();
    }
  }

  useEffect(() => () => clearTimers(), []);

  // Posicionamiento: calcula al abrir, con flip hacia el lado opuesto si no
  // cabe, alineación start/center/end en el eje transversal, y clamp de 8px
  // a los bordes del viewport. La flecha se limita a 12px de las esquinas.
  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    function updatePosition() {
      const triggerEl = triggerRef.current;
      const tipEl = tooltipRef.current;
      if (!triggerEl || !tipEl) return;

      const tRect = triggerEl.getBoundingClientRect();
      const pRect = tipEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const fits = {
        top: tRect.top - offset - pRect.height >= 0,
        bottom: tRect.bottom + offset + pRect.height <= vh,
        left: tRect.left - offset - pRect.width >= 0,
        right: tRect.right + offset + pRect.width <= vw,
      };
      let finalSide = side;
      if (!fits[side]) {
        const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];
        if (fits[opposite]) finalSide = opposite;
      }

      let top;
      let left;
      if (finalSide === 'top' || finalSide === 'bottom') {
        top = finalSide === 'top' ? tRect.top - offset - pRect.height : tRect.bottom + offset;
        const center = tRect.left + tRect.width / 2;
        left = align === 'start' ? tRect.left : align === 'end' ? tRect.right - pRect.width : center - pRect.width / 2;
      } else {
        left = finalSide === 'left' ? tRect.left - offset - pRect.width : tRect.right + offset;
        const centerY = tRect.top + tRect.height / 2;
        top =
          align === 'start' ? tRect.top : align === 'end' ? tRect.bottom - pRect.height : centerY - pRect.height / 2;
      }

      left = Math.min(Math.max(left, 8), vw - pRect.width - 8);
      top = Math.min(Math.max(top, 8), vh - pRect.height - 8);

      let arrowLeft;
      let arrowTop;
      if (finalSide === 'top' || finalSide === 'bottom') {
        const rawArrowLeft = tRect.left + tRect.width / 2 - left;
        arrowLeft = Math.min(Math.max(rawArrowLeft, 12), Math.max(pRect.width - 12, 12));
      } else {
        const rawArrowTop = tRect.top + tRect.height / 2 - top;
        arrowTop = Math.min(Math.max(rawArrowTop, 12), Math.max(pRect.height - 12, 12));
      }

      setPlacement(finalSide);
      setPos({ top, left, arrowLeft, arrowTop });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isOpen, side, align, offset]);

  // Cierre en scroll (fuera del propio tooltip) y con Escape.
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleScroll(event) {
      if (tooltipRef.current?.contains(event.target)) return;
      hide(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') hide(false);
    }
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!content) {
    return children ?? null;
  }
  if (!isValidElement(children)) {
    return children ?? null;
  }

  const childProps = children.props || {};
  const clonedChild = cloneElement(children, {
    ref: mergeRefs(triggerRef, children.ref),
    'aria-describedby': isOpen ? instanceId : childProps['aria-describedby'],
    onMouseEnter: (event) => {
      childProps.onMouseEnter?.(event);
      show();
    },
    onMouseLeave: (event) => {
      childProps.onMouseLeave?.(event);
      hide();
    },
    onFocus: (event) => {
      childProps.onFocus?.(event);
      show(isFocusVisible(event.target));
    },
    onBlur: (event) => {
      childProps.onBlur?.(event);
      hide(false);
    },
    onKeyDown: (event) => {
      childProps.onKeyDown?.(event);
      if (event.key === 'Escape') hide(false);
    },
  });

  const variants = shouldReduceMotion ? reducedVariants : buildVariants(placement);
  const arrowPositionStyle =
    placement === 'top' || placement === 'bottom' ? { left: pos.arrowLeft } : { top: pos.arrowTop };
  const arrowSideStyle =
    placement === 'top'
      ? { bottom: -4 }
      : placement === 'bottom'
      ? { top: -4 }
      : placement === 'left'
      ? { right: -4 }
      : { left: -4 };

  return (
    <>
      {clonedChild}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={tooltipRef}
              id={instanceId}
              role="tooltip"
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseEnter={interactive ? () => clearTimers() : undefined}
              onMouseLeave={interactive ? () => hide() : undefined}
              style={{ position: 'fixed', top: pos.top, left: pos.left, maxWidth }}
              className={`z-[80] rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_4px_6px_-2px_rgba(12,17,22,0.06),0_12px_16px_-4px_rgba(12,17,22,0.14)] dark:border dark:border-white/10 dark:bg-neutral-800 ${className}`}
            >
              {content}
              {showArrow && (
                <span
                  aria-hidden="true"
                  className="absolute h-2 w-2 rotate-45 bg-neutral-900 dark:border-b dark:border-r dark:border-white/10 dark:bg-neutral-800"
                  style={{ ...arrowPositionStyle, ...arrowSideStyle }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
