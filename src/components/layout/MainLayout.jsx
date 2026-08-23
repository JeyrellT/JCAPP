import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { pageTransition } from '../../lib/motion';

const SIDEBAR_COLLAPSE_KEY = 'jc_sidebar_collapsed';

/**
 * Marco de trabajo persistente de la aplicación: barra superior, barra lateral,
 * contenido enrutado y pie de página. No se remonta al navegar entre rutas:
 * solo el contenido dentro de <Outlet /> cambia.
 */
const MainLayout = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  // Estado de colapso del sidebar en escritorio (rail de 64px). Persistente.
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Estado del drawer móvil (<lg).
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(collapsed));
    } catch {
      // localStorage no disponible: la preferencia simplemente no persiste.
    }
  }, [collapsed]);

  // Cerrar el drawer móvil en cada cambio de ruta.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Bloquear el scroll del body mientras el drawer móvil está abierto.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // El botón de menú de la barra superior tiene doble función: en escritorio
  // alterna el colapso del sidebar; en móvil abre/cierra el drawer.
  const handleMenuClick = () => {
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      setCollapsed((prev) => !prev);
    } else {
      setMobileOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app text-content">
      <a
        href="#contenido"
        className="fixed left-3 top-3 z-toast -translate-y-16 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast shadow-lg transition-transform duration-fast focus:translate-y-0 focus-visible:translate-y-0"
      >
        Saltar al contenido
      </a>

      <Navbar
        onMenuClick={handleMenuClick}
        sidebarCollapsed={collapsed}
        mobileOpen={mobileOpen}
      />

      <div className="flex flex-1 pt-16">
        {/* Sidebar de escritorio: en flujo, ancho controlado por clase (nunca animado por framer-motion). */}
        <div
          className={`hidden shrink-0 border-r border-line bg-surface transition-[width] duration-slow ease-standard lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] ${
            collapsed ? 'lg:w-16' : 'lg:w-[264px]'
          }`}
        >
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((prev) => !prev)}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>

        {/* Drawer móvil. Dos AnimatePresence independientes: envolver ambos motion.div
            en un Fragment dentro de un único AnimatePresence rompe la animación de entrada. */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="sidebar-backdrop"
              className="fixed inset-0 z-backdrop bg-content/50 backdrop-blur-[2px] lg:hidden"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="sidebar-drawer"
              className="fixed inset-y-0 left-0 z-sidebar w-[264px] border-r border-line bg-surface shadow-overlay lg:hidden"
              initial={reduceMotion ? false : { x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Navegación principal"
            >
              <Sidebar
                collapsed={false}
                onToggleCollapse={() => setCollapsed((prev) => !prev)}
                onCloseMobile={() => setMobileOpen(false)}
                isMobile
              />
            </motion.div>
          )}
        </AnimatePresence>

        <main id="contenido" className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-page px-4 py-8 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={reduceMotion ? false : pageTransition.initial}
                animate={pageTransition.animate}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MainLayout;
