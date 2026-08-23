/**
 * Modal.jsx
 * ---------------------------------------------------------------------------
 * Diálogo modal accesible, animado y montado en portal.
 *
 * Uso rápido (header/footer generados automáticamente):
 *   <Modal open={open} onClose={() => setOpen(false)} title="Eliminar proyecto"
 *          description="Esta acción no se puede deshacer."
 *          footer={<><Button variant="outline" onClick={close}>Cancelar</Button>
 *                    <Button variant="danger" onClick={confirm}>Eliminar</Button></>}>
 *     <p>El proyecto y sus herramientas asociadas se eliminarán.</p>
 *   </Modal>
 *
 * Uso con composición manual (control total del layout, no usar `title`):
 *   <Modal open={open} onClose={close} showCloseButton={false}>
 *     <ModalHeader>...</ModalHeader>
 *     <ModalBody>...</ModalBody>
 *     <ModalFooter>...</ModalFooter>
 *   </Modal>
 *
 * Accesibilidad: role="dialog" + aria-modal, trampa de foco, devolución de
 * foco al cerrar, Escape cierra solo el modal más alto de la pila, y el
 * scroll del body se bloquea compensando el ancho de la scrollbar.
 * ---------------------------------------------------------------------------
 */
import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZE_CLASSES = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[960px]',
  full: 'max-w-[calc(100vw-2rem)]',
};

// Pila de módulo: permite que Escape cierre solo el modal más alto cuando
// hay varios anidados (p. ej. un modal de confirmación sobre otro modal).
let modalStack = [];

// Contador de módulo para el bloqueo de scroll del body: soporta modales
// anidados sin desbloquear de más si uno se desmonta de forma abrupta
// (por ejemplo, un cambio de ruta mientras estaba abierto).
let scrollLockCount = 0;
let savedBodyOverflow = '';
let savedBodyPaddingRight = '';

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    savedBodyOverflow = document.body.style.overflow;
    savedBodyPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      const currentPaddingRight = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow;
    document.body.style.paddingRight = savedBodyPaddingRight;
  }
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: [0.3, 0, 0.8, 0.15] } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.16, ease: [0.3, 0, 0.8, 0.15] } },
};

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

/** Encabezado del modal para composición manual. */
export function ModalHeader({ children, className = '' }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 border-b px-6 py-4 ${className}`}
      style={{ borderColor: 'rgb(var(--color-border))' }}
    >
      {children}
    </div>
  );
}

/** Cuerpo desplazable del modal para composición manual. */
export function ModalBody({ children, className = '' }) {
  return <div className={`max-h-[min(70vh,640px)] overflow-y-auto px-6 py-5 ${className}`}>{children}</div>;
}

/** Pie del modal para composición manual (acciones alineadas a la derecha). */
export function ModalFooter({ children, className = '' }) {
  return (
    <div
      className={`flex items-center justify-end gap-3 border-t px-6 py-4 ${className}`}
      style={{ borderColor: 'rgb(var(--color-border))' }}
    >
      {children}
    </div>
  );
}

/**
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {import('react').ReactNode} [title]
 * @param {import('react').ReactNode} [description]
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [size='md']
 * @param {import('react').ReactNode} [footer]
 * @param {boolean} [closeOnBackdrop=true]
 * @param {boolean} [closeOnEsc=true]
 * @param {boolean} [showCloseButton=true]
 * @param {import('react').RefObject} [initialFocusRef]
 * @param {boolean} [preventScroll=true]
 * @param {string} [className] clases extra para el contenedor de centrado
 * @param {string} [contentClassName] clases extra para el panel
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  closeOnEsc = true,
  showCloseButton = true,
  initialFocusRef,
  preventScroll = true,
  className = '',
  contentClassName = '',
  children,
}) {
  const instanceId = useId();
  const titleId = `${instanceId}-title`;
  const descriptionId = `${instanceId}-description`;
  const panelRef = useRef(null);
  const previousActiveElement = useRef(null);
  const mouseDownOnBackdrop = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Alta/baja en la pila de módulo + bloqueo de scroll + foco inicial.
  useEffect(() => {
    if (!open) return undefined;

    previousActiveElement.current = document.activeElement;
    modalStack.push(instanceId);
    if (preventScroll) lockBodyScroll();

    const raf = requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current || panelRef.current?.querySelector(FOCUSABLE_SELECTOR) || panelRef.current;
      target?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      modalStack = modalStack.filter((id) => id !== instanceId);
      if (preventScroll) unlockBodyScroll();
      const prev = previousActiveElement.current;
      if (prev && document.body.contains(prev) && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instanceId, preventScroll]);

  // Escape (solo el modal más alto de la pila) + trampa de foco con Tab.
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (closeOnEsc && modalStack[modalStack.length - 1] === instanceId) {
          event.stopPropagation();
          handleClose();
        }
        return;
      }

      if (event.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
          (el) => el.offsetParent !== null
        );
        if (focusables.length === 0) {
          event.preventDefault();
          panel.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, closeOnEsc, instanceId, handleClose]);

  function handleBackdropMouseDown(event) {
    mouseDownOnBackdrop.current = event.target === event.currentTarget;
  }

  function handleBackdropClick(event) {
    const originatedOnBackdrop = mouseDownOnBackdrop.current;
    mouseDownOnBackdrop.current = false;
    if (closeOnBackdrop && originatedOnBackdrop && event.target === event.currentTarget) {
      handleClose();
    }
  }

  const bVariants = shouldReduceMotion ? reducedVariants : backdropVariants;
  const pVariants = shouldReduceMotion ? reducedVariants : panelVariants;
  const hasChrome = Boolean(title || description || showCloseButton);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${className}`}>
          <motion.div
            className="fixed inset-0 bg-[rgb(12_17_22_/_0.5)] backdrop-blur-[2px]"
            variants={bVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onMouseDown={handleBackdropMouseDown}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            variants={pVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative flex w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_64px_-12px_rgba(12,17,22,0.35)] outline-none ${contentClassName}`}
            style={{
              borderColor: 'rgb(var(--color-border))',
              backgroundColor: 'rgb(var(--color-card))',
              color: 'rgb(var(--color-card-foreground))',
            }}
          >
            {hasChrome && (
              <ModalHeader>
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="text-lg font-semibold leading-relaxed">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm" style={{ color: 'rgb(var(--color-muted))' }}>
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Cerrar"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[rgb(var(--color-background))]"
                  >
                    <X size={18} />
                  </button>
                )}
              </ModalHeader>
            )}

            {title ? <ModalBody>{children}</ModalBody> : children}

            {footer && <ModalFooter>{footer}</ModalFooter>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
