import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer } from '../../lib/motion';

/**
 * PageLayout: estructura consistente para el contenido de una página dentro
 * del shell (MainLayout ya aporta el ancho máximo y el padding exterior).
 * Mantiene la API existente (title, children, animate, className) para no
 * romper a los consumidores actuales.
 *
 * @param {string} title - Título de la página (renderiza un h1)
 * @param {ReactNode} children - Contenido de la página
 * @param {boolean} animate - Si se anima la entrada del contenido (default: true)
 * @param {string} className - Clases adicionales para el contenedor
 */
const PageLayout = ({ title, children, animate = true, className = '' }) => {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animate && !reduceMotion;
  const Container = shouldAnimate ? motion.div : 'div';

  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-content">{title}</h1>
        </header>
      )}

      <Container
        variants={shouldAnimate ? staggerContainer : undefined}
        initial={shouldAnimate ? 'hidden' : undefined}
        animate={shouldAnimate ? 'visible' : undefined}
      >
        {children}
      </Container>
    </div>
  );
};

export default PageLayout;
