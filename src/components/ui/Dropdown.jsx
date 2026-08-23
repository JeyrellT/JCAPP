/**
 * Dropdown.jsx
 * ---------------------------------------------------------------------------
 * Menú desplegable accesible (role="menu"), montado en portal, con
 * posicionamiento automático (flip vertical + clamp horizontal), navegación
 * completa por teclado (flechas, Home/End, type-ahead) y cierre por click
 * afuera, Escape, scroll o resize.
 *
 * Modo rápido (array de items):
 *   <Dropdown
 *     trigger={<button className="...">Opciones</button>}
 *     items={[
 *       { id: 'edit', label: 'Editar', icon: Pencil, onSelect: () => {} },
 *       { id: 'sep', separator: true },
 *       { id: 'del', label: 'Eliminar', icon: Trash2, danger: true, onSelect: () => {} },
 *     ]}
 *   />
 *
 * Modo composición (control total del contenido):
 *   <Dropdown trigger={<button>...</button>}>
 *     <DropdownLabel>Cuenta</DropdownLabel>
 *     <DropdownItem label="Configuración" to="/settings" />
 *     <DropdownSeparator />
 *     <DropdownItem label="Salir" onSelect={logout} danger />
 *   </Dropdown>
 *
 * `trigger` puede ser un elemento (se clona con los handlers y aria-*
 * necesarios) o una función `({ open }) => ReactNode` para reaccionar al
 * estado abierto/cerrado (p. ej. rotar un chevron).
 * ---------------------------------------------------------------------------
 */
import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') ref(node);
      else ref.current = node;
    });
  };
}

function getTransformOrigin(placement, align) {
  const vertical = placement === 'top' ? 'bottom' : 'top';
  const horizontal = align === 'end' ? 'right' : align === 'center' ? 'center' : 'left';
  return `${vertical} ${horizontal}`;
}

function buildVariants(placement) {
  const y = placement === 'top' ? 4 : -4;
  return {
    hidden: { opacity: 0, scale: 0.98, y },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.14, ease: [0.05, 0.7, 0.1, 1] } },
    exit: { opacity: 0, scale: 0.98, y, transition: { duration: 0.1, ease: [0.3, 0, 0.8, 0.15] } },
  };
}

const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

/** Fila del menú. Se usa tanto internamente (modo `items`) como en composición manual. */
export function DropdownItem({
  id,
  label,
  icon: Icon,
  onSelect,
  to,
  href,
  disabled = false,
  danger = false,
  shortcut,
  description,
  children,
  className = '',
  ...rest
}) {
  const content = (
    <>
      {Icon ? (
        typeof Icon === 'function' ? (
          <Icon size={16} className="shrink-0" aria-hidden="true" />
        ) : (
          Icon
        )
      ) : null}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate">{children ?? label}</span>
        {description && (
          <span className="block truncate text-2xs" style={{ color: 'rgb(var(--color-muted))' }}>
            {description}
          </span>
        )}
      </span>
      {shortcut && (
        <span className="ml-auto shrink-0 font-mono text-2xs" style={{ color: 'rgb(var(--color-muted))' }}>
          {shortcut}
        </span>
      )}
    </>
  );

  const sharedClassName = [
    'flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm outline-none transition-colors duration-100',
    disabled
      ? 'cursor-not-allowed opacity-50'
      : 'cursor-pointer hover:bg-[rgb(var(--color-background))] focus:bg-[rgb(var(--color-background))]',
    danger ? 'text-red-600 dark:text-red-400' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  function handleClick(event) {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onSelect?.(event, id);
  }

  const commonProps = {
    role: 'menuitem',
    id: id ? `dropdown-item-${id}` : undefined,
    tabIndex: -1,
    'aria-disabled': disabled || undefined,
    className: sharedClassName,
    style: !danger ? { color: 'rgb(var(--color-card-foreground))' } : undefined,
    onClick: handleClick,
    ...rest,
  };

  if (to && !disabled) {
    return (
      <Link to={to} {...commonProps}>
        {content}
      </Link>
    );
  }
  if (href && !disabled) {
    return (
      <a href={href} {...commonProps}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" disabled={disabled} {...commonProps}>
      {content}
    </button>
  );
}

/** Separador visual entre grupos de items. */
export function DropdownSeparator({ className = '' }) {
  return (
    <div
      role="separator"
      className={`-mx-1 my-1 h-px ${className}`}
      style={{ backgroundColor: 'rgb(var(--color-border))' }}
    />
  );
}

/** Etiqueta de sección no interactiva dentro del menú. */
export function DropdownLabel({ children, className = '' }) {
  return (
    <div
      className={`px-2.5 py-1.5 text-2xs font-semibold uppercase tracking-wider ${className}`}
      style={{ color: 'rgb(var(--color-muted))' }}
    >
      {children}
    </div>
  );
}

/**
 * @param {import('react').ReactNode | ((state: {open: boolean}) => import('react').ReactNode)} trigger
 * @param {Array<object>} [items] atajo declarativo; alternativa a pasar children
 * @param {'start'|'center'|'end'} [align='start']
 * @param {'bottom'|'top'} [side='bottom']
 * @param {number} [offset=6]
 * @param {boolean} [matchTriggerWidth=false]
 * @param {boolean} [open] uso controlado
 * @param {(open: boolean) => void} [onOpenChange]
 * @param {boolean} [closeOnSelect=true]
 * @param {boolean} [disabled=false]
 * @param {string} [menuClassName]
 */
export default function Dropdown({
  trigger,
  items,
  align = 'start',
  side = 'bottom',
  offset = 6,
  matchTriggerWidth = false,
  open: controlledOpen,
  onOpenChange,
  closeOnSelect = true,
  disabled = false,
  menuClassName = '',
  children,
}) {
  const instanceId = useId();
  const menuId = `dropdown-menu-${instanceId}`;
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const typeaheadRef = useRef({ buffer: '', timer: null });
  const [pos, setPos] = useState({ top: -9999, left: -9999, width: undefined });
  const [placement, setPlacement] = useState(side);
  const shouldReduceMotion = useReducedMotion();

  function setOpen(next) {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }
  function close() {
    setOpen(false);
  }

  // Posicionamiento: se calcula una vez al abrir (getBoundingClientRect +
  // flip vertical + clamp horizontal). El cierre en scroll/resize evita
  // tener que reposicionar continuamente.
  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    function updatePosition() {
      const triggerEl = triggerRef.current;
      const menuEl = menuRef.current;
      if (!triggerEl || !menuEl) return;

      const triggerRect = triggerEl.getBoundingClientRect();
      const menuRect = menuEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let finalPlacement = side;
      if (side === 'bottom') {
        const fitsBelow = triggerRect.bottom + offset + menuRect.height <= vh;
        if (!fitsBelow && triggerRect.top - offset - menuRect.height >= 0) finalPlacement = 'top';
      } else {
        const fitsAbove = triggerRect.top - offset - menuRect.height >= 0;
        if (!fitsAbove && triggerRect.bottom + offset + menuRect.height <= vh) finalPlacement = 'bottom';
      }

      const top =
        finalPlacement === 'bottom' ? triggerRect.bottom + offset : triggerRect.top - offset - menuRect.height;

      const width = matchTriggerWidth ? triggerRect.width : menuRect.width;
      let left;
      if (align === 'end') left = triggerRect.right - width;
      else if (align === 'center') left = triggerRect.left + triggerRect.width / 2 - width / 2;
      else left = triggerRect.left;

      left = Math.min(Math.max(left, 8), vw - width - 8);

      setPlacement(finalPlacement);
      setPos({ top, left, width: matchTriggerWidth ? triggerRect.width : undefined });
    }

    updatePosition();
    // Recalcula una vez más tras el primer paint por si el menú cambió de
    // tamaño (p. ej. fuente cargando), sin suscribirse a scroll continuo.
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, align, side, offset, matchTriggerWidth]);

  // Foco inicial en el primer item habilitado al abrir.
  useEffect(() => {
    if (!isOpen) return undefined;
    const raf = requestAnimationFrame(() => {
      const first = menuRef.current?.querySelector(MENU_ITEM_SELECTOR);
      (first || menuRef.current)?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  // Cierre por click/tap fuera del trigger y del menú.
  useEffect(() => {
    if (!isOpen) return undefined;
    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target)) return;
      if (triggerRef.current?.contains(event.target)) return;
      close();
    }
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cierre en scroll (fuera del propio menú) y resize de ventana.
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleScroll(event) {
      if (menuRef.current?.contains(event.target)) return;
      close();
    }
    function handleResize() {
      close();
    }
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function getMenuItems() {
    return Array.from(menuRef.current?.querySelectorAll(MENU_ITEM_SELECTOR) ?? []);
  }

  function moveActive(direction) {
    const menuItems = getMenuItems();
    if (menuItems.length === 0) return;
    const currentIndex = menuItems.findIndex((el) => el === document.activeElement);
    let nextIndex;
    if (currentIndex === -1) nextIndex = direction > 0 ? 0 : menuItems.length - 1;
    else nextIndex = (currentIndex + direction + menuItems.length) % menuItems.length;
    menuItems[nextIndex]?.focus();
  }

  function handleTypeAhead(char) {
    const state = typeaheadRef.current;
    state.buffer += char.toLowerCase();
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.buffer = '';
    }, 500);

    const menuItems = getMenuItems();
    if (menuItems.length === 0) return;
    const currentIndex = menuItems.findIndex((el) => el === document.activeElement);
    const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
    const ordered = [...menuItems.slice(startIndex), ...menuItems.slice(0, startIndex)];
    const match = ordered.find((el) => el.textContent.trim().toLowerCase().startsWith(state.buffer));
    match?.focus();
  }

  function handleMenuKeyDown(event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveActive(-1);
        break;
      case 'Home': {
        event.preventDefault();
        const menuItems = getMenuItems();
        menuItems[0]?.focus();
        break;
      }
      case 'End': {
        event.preventDefault();
        const menuItems = getMenuItems();
        menuItems[menuItems.length - 1]?.focus();
        break;
      }
      case 'Escape':
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case 'Tab':
        close();
        break;
      default:
        if (event.key.length === 1 && /[a-z0-9]/i.test(event.key)) {
          handleTypeAhead(event.key);
        }
    }
  }

  function handleMenuClick(event) {
    const itemEl = event.target.closest('[role="menuitem"]');
    if (!itemEl || itemEl.getAttribute('aria-disabled') === 'true') return;
    if (closeOnSelect) close();
  }

  const triggerNode = typeof trigger === 'function' ? trigger({ open: isOpen }) : trigger;
  const clonedTrigger = isValidElement(triggerNode)
    ? cloneElement(triggerNode, {
        ref: mergeRefs(triggerRef, triggerNode.ref),
        'aria-haspopup': 'menu',
        'aria-expanded': isOpen,
        'aria-controls': isOpen ? menuId : undefined,
        disabled: disabled || triggerNode.props.disabled,
        onClick: (event) => {
          triggerNode.props.onClick?.(event);
          if (!disabled) setOpen(!isOpen);
        },
        onKeyDown: (event) => {
          triggerNode.props.onKeyDown?.(event);
          if (disabled) return;
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (!isOpen) setOpen(true);
          }
        },
      })
    : triggerNode;

  const variants = shouldReduceMotion ? reducedVariants : buildVariants(placement);

  function renderDeclarativeItem(item) {
    if (item.separator) return <DropdownSeparator key={item.id ?? Math.random()} />;
    if (item.heading) return <DropdownLabel key={item.id ?? item.label}>{item.label}</DropdownLabel>;
    return <DropdownItem key={item.id} {...item} />;
  }

  return (
    <>
      {clonedTrigger}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-orientation="vertical"
              tabIndex={-1}
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onKeyDown={handleMenuKeyDown}
              onClick={handleMenuClick}
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: pos.width,
                transformOrigin: getTransformOrigin(placement, align),
                borderColor: 'rgb(var(--color-border))',
                backgroundColor: 'rgb(var(--color-card))',
              }}
              className={`z-[70] min-w-[200px] max-w-[320px] rounded-[10px] border p-1 shadow-[0_4px_6px_-2px_rgba(12,17,22,0.06),0_12px_16px_-4px_rgba(12,17,22,0.14)] outline-none ${menuClassName}`}
            >
              {items ? items.map(renderDeclarativeItem) : children}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
