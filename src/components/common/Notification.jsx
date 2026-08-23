import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/**
 * Tipos de notificación
 * @typedef {'success'|'error'|'info'|'warning'} NotificationType
 */

/**
 * Notificación tipo toast, sobre los tokens del sistema de diseño.
 *
 * @param {Object} props
 * @param {string} props.message - Mensaje a mostrar
 * @param {NotificationType} props.type - Tipo de notificación
 * @param {boolean} props.show - Si se debe mostrar la notificación
 * @param {Function} props.onClose - Función para cerrar la notificación
 * @param {number} props.duration - Duración en ms antes de cerrarse (0 para no cerrarse automáticamente)
 */

// Icono + tono semántico por tipo (base/soft/on de la sección 2.3 del brief).
const TYPE_CONFIG = {
  success: { icon: CheckCircle2, bg: 'bg-success-soft', text: 'text-success-on', border: 'border-success/30', bar: 'bg-success' },
  error: { icon: XCircle, bg: 'bg-danger-soft', text: 'text-danger-on', border: 'border-danger/30', bar: 'bg-danger' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-soft', text: 'text-warning-on', border: 'border-warning/30', bar: 'bg-warning' },
  info: { icon: Info, bg: 'bg-info-soft', text: 'text-info-on', border: 'border-info/30', bar: 'bg-info' },
};

const ENTER_TRANSITION = { duration: 0.22, ease: [0.05, 0.7, 0.1, 1] };
const EXIT_TRANSITION = { duration: 0.14, ease: [0.3, 0, 0.8, 0.15] };

const Notification = ({ message, type = 'info', show, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(show);
  const shouldReduceMotion = useReducedMotion();

  // Configurar temporizador para ocultar automáticamente
  useEffect(() => {
    setIsVisible(show);

    let timer;
    if (show && duration > 0) {
      timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300); // Dar tiempo a la animación de salida
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, duration, onClose]);

  const { icon: Icon, bg, text, border, bar } = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300); // Dar tiempo a la animación de salida
  };

  const motionProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0 } },
        exit: { opacity: 0, transition: { duration: 0 } },
      }
    : {
        initial: { opacity: 0, y: -8, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1, transition: ENTER_TRANSITION },
        exit: { opacity: 0, y: -8, scale: 0.98, transition: EXIT_TRANSITION },
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          role="status"
          aria-live="polite"
          {...motionProps}
          className={`fixed top-6 right-6 z-toast max-w-md overflow-hidden rounded-xl border shadow-xl ${bg} ${border}`}
        >
          <div className="relative p-4 pr-10">
            <div className="flex items-center">
              <Icon className={`mr-3 shrink-0 ${text}`} size={20} aria-hidden="true" />
              <div className={`text-sm font-medium ${text}`}>{message}</div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar notificación"
                className={`absolute right-3 top-3.5 rounded-md p-0.5 ${text} hover:opacity-70`}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Barra de progreso si hay duración */}
          {duration > 0 && (
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: duration / 1000, ease: 'linear' }}
              className={`h-1 ${bar}`}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
