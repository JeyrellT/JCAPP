import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  PanelLeft,
  PanelLeftClose,
  Sun,
  Moon,
  Settings2,
  ChevronsUpDown,
  Settings,
  Layers,
  Info,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { popover } from '../../lib/motion';

/**
 * Barra superior fija de 64px. Contiene el control de navegación del sidebar,
 * la marca, el interruptor de tema y un menú de usuario reducido (sin datos
 * ficticios: no hay sesión ni notificaciones simuladas en esta versión).
 */
const Navbar = ({ onMenuClick, sidebarCollapsed }) => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const menuId = useId();
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar el menú de usuario al hacer clic fuera o presionar Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) setAboutOpen(false);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-navbar h-16 border-b border-line transition-colors duration-base ${
        scrolled ? 'bg-surface/90 shadow-sm backdrop-blur-md' : 'bg-surface'
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Izquierda: control de navegación + marca */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content lg:hidden"
            aria-label="Abrir menú de navegación"
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            onClick={onMenuClick}
            className="hidden h-9 w-9 items-center justify-center rounded-md text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content lg:inline-flex"
            aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {sidebarCollapsed ? <PanelLeft size={19} /> : <PanelLeftClose size={19} />}
          </button>

          <Link to="/" className="flex min-w-0 items-center gap-2.5 rounded-md">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-contrast">
              JC
            </span>
            <span className="hidden truncate text-lg font-semibold text-content sm:inline-block">
              JC Analytic
            </span>
          </Link>
        </div>

        {/* Derecha: tema + menú reducido */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label="Más opciones"
            >
              <Settings2 size={18} />
              <ChevronsUpDown size={13} className="hidden sm:inline" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  id={menuId}
                  role="menu"
                  aria-label="Más opciones"
                  className="absolute right-0 z-dropdown mt-2 w-64 origin-top-right rounded-lg border border-line bg-surface-raised p-1 shadow-lg"
                  initial={reduceMotion ? false : popover.hidden}
                  animate={popover.visible}
                  exit={popover.exit}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleTheme}
                    className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-content transition-colors duration-fast hover:bg-surface-sunken"
                  >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    <span className="flex-1">Tema {theme === 'dark' ? 'claro' : 'oscuro'}</span>
                  </button>

                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-content transition-colors duration-fast hover:bg-surface-sunken"
                  >
                    <Settings size={16} />
                    <span>Configuración</span>
                  </Link>

                  <Link
                    to="/methodology"
                    role="menuitem"
                    onClick={closeMenu}
                    className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-content transition-colors duration-fast hover:bg-surface-sunken"
                  >
                    <Layers size={16} />
                    <span>Metodología</span>
                  </Link>

                  <div className="my-1 -mx-1 h-px bg-line-subtle" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setAboutOpen((prev) => !prev)}
                    aria-expanded={aboutOpen}
                    className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-content transition-colors duration-fast hover:bg-surface-sunken"
                  >
                    <Info size={16} />
                    <span>Acerca de JC Analytic</span>
                  </button>
                  <AnimatePresence>
                    {aboutOpen && (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.14 }}
                        className="overflow-hidden px-2.5"
                      >
                        <p className="pb-2 pt-1 text-xs leading-relaxed text-content-muted">
                          JC Analytic · Lean Six Sigma · v0.1.0
                          <br />
                          Los datos se guardan localmente en este navegador.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
