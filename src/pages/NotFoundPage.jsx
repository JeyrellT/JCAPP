import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, ArrowLeft, LayoutDashboard, FolderKanban, Wrench, BarChart3, Plus } from 'lucide-react';
import GradientButton from '../components/common/GradientButton';

// Curvas del sistema de movimiento (ver brief Ciclo 1, sección 2.8).
// Se declaran localmente: src/lib/motion.js es propiedad de otro carril
// y esta página no depende de su existencia para compilar.
const EASE_DECELERATE = [0.05, 0.7, 0.1, 1];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_DECELERATE } },
};

// Destinos reales de la app. Ninguno cae en el catch-all.
const destinations = [
  { label: 'Panel', to: '/', icon: LayoutDashboard },
  { label: 'Proyectos', to: '/projects', icon: FolderKanban },
  { label: 'Herramientas', to: '/tools', icon: Wrench },
  { label: 'Reportes', to: '/reports', icon: BarChart3 },
  { label: 'Nuevo proyecto', to: '/projects/new', icon: Plus },
];

// Motivo de marca: una línea de control con un punto fuera de los límites.
// Alturas relativas de los puntos (positivo = arriba de la línea central).
const CONTROL_POINTS = [8, -4, 2, -10, 6, -2, 34, 4];
const OUTLIER_INDEX = 6;

/**
 * Ilustración simple, inline y sin dependencias: una línea de control
 * estadístico con límites punteados y un punto que se sale del rango.
 * Es la firma visual del error: algo salió de los límites esperados.
 */
function ControlLineIllustration({ reduceMotion }) {
  const width = 320;
  const height = 96;
  const midY = height / 2;
  const stepX = width / (CONTROL_POINTS.length - 1);
  const scaleY = 1.6;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      role="img"
      aria-label="Línea de control con un punto fuera de los límites"
      className="max-w-full text-line-strong"
    >
      {/* Límites de control superior e inferior */}
      <line x1="0" y1={midY - 26} x2={width} y2={midY - 26} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="0" y1={midY + 26} x2={width} y2={midY + 26} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      {/* Línea central */}
      <line x1="0" y1={midY} x2={width} y2={midY} stroke="currentColor" strokeWidth="1" opacity="0.5" />

      {/* Trazo que une los puntos */}
      <motion.polyline
        points={CONTROL_POINTS.map((v, i) => `${i * stepX},${midY - v * scaleY}`).join(' ')}
        fill="none"
        className="text-brand"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_DECELERATE, delay: 0.15 }}
      />

      {CONTROL_POINTS.map((v, i) => {
        const isOutlier = i === OUTLIER_INDEX;
        const cx = i * stepX;
        const cy = midY - v * scaleY;
        return (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r={isOutlier ? 5 : 3}
            className={isOutlier ? 'text-danger' : 'text-brand'}
            fill="currentColor"
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
            transition={
              isOutlier
                ? { type: 'spring', stiffness: 420, damping: 34, mass: 0.9, delay: 0.65 }
                : { duration: 0.2, ease: EASE_DECELERATE, delay: 0.2 + i * 0.05 }
            }
          />
        );
      })}
    </svg>
  );
}

const NotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  // "Volver atrás" solo tiene sentido si hay una entrada previa en el historial
  // de esta pestaña; si no, el botón queda oculto en vez de quedar inerte.
  const [canGoBack] = useState(() => typeof window !== 'undefined' && window.history.length > 1);

  return (
    <motion.div
      variants={reduceMotion ? undefined : containerVariants}
      initial={reduceMotion ? undefined : 'hidden'}
      animate={reduceMotion ? undefined : 'visible'}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 text-center"
    >
      <motion.div variants={reduceMotion ? undefined : itemVariants} className="mb-8">
        <ControlLineIllustration reduceMotion={reduceMotion} />
      </motion.div>

      <motion.p
        variants={reduceMotion ? undefined : itemVariants}
        className="mb-3 text-2xs font-semibold uppercase tracking-wider text-content-muted"
      >
        Error 404
      </motion.p>

      <motion.h1
        variants={reduceMotion ? undefined : itemVariants}
        className="mb-4 max-w-xl text-3xl font-semibold text-content sm:text-4xl"
      >
        Fuera de los límites de control
      </motion.h1>

      <motion.p
        variants={reduceMotion ? undefined : itemVariants}
        className="mb-5 max-w-md text-sm text-content-secondary"
      >
        La dirección solicitada no existe o cambió de ubicación. Como todo punto fuera de
        control: investíguela o vuelva al proceso.
      </motion.p>

      <motion.div variants={reduceMotion ? undefined : itemVariants} className="mb-8 max-w-full">
        <p className="mb-1.5 text-2xs font-medium uppercase tracking-wider text-content-muted">
          Ruta solicitada
        </p>
        <code className="inline-block max-w-full truncate rounded-md border border-line bg-surface-sunken px-2.5 py-1.5 font-mono text-xs text-content-secondary">
          {location.pathname}
        </code>
      </motion.div>

      <motion.div
        variants={reduceMotion ? undefined : itemVariants}
        className="mb-10 flex flex-col items-center gap-3 sm:flex-row"
      >
        <GradientButton to="/" className="inline-flex items-center justify-center">
          <Home size={18} className="mr-2" aria-hidden="true" /> Ir al inicio
        </GradientButton>

        {canGoBack && (
          <GradientButton
            variant="secondary"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" aria-hidden="true" /> Volver atrás
          </GradientButton>
        )}
      </motion.div>

      <motion.nav
        variants={reduceMotion ? undefined : itemVariants}
        aria-label="Destinos disponibles"
        className="flex max-w-lg flex-wrap items-center justify-center gap-2"
      >
        {destinations.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:border-line-strong hover:bg-surface-sunken hover:text-content"
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </motion.nav>
    </motion.div>
  );
};

export default NotFoundPage;
