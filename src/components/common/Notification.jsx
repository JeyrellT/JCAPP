import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';

/**
 * Tipos de notificación
 * @typedef {'success'|'error'|'info'|'warning'} NotificationType
 */

/**
 * Componente para mostrar notificaciones
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.message - Mensaje a mostrar
 * @param {NotificationType} props.type - Tipo de notificación
 * @param {boolean} props.show - Si se debe mostrar la notificación
 * @param {function} props.onClose - Función para cerrar la notificación
 * @param {number} props.duration - Duración en ms antes de cerrarse (0 para no cerrarse automáticamente)
 */
const Notification = ({ 
  message, 
  type = 'info', 
  show, 
  onClose,
  duration = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  
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
  
  // Configurar icono y colores según el tipo
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-100 dark:bg-green-900',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-100 dark:bg-red-900',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bgColor: 'bg-yellow-100 dark:bg-yellow-900',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
      default: // info
        return {
          icon: AlertCircle,
          bgColor: 'bg-blue-100 dark:bg-blue-900',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
    }
  };
  
  const { icon: Icon, bgColor, textColor, borderColor } = getTypeConfig();
  
  // Manejar cierre
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) setTimeout(onClose, 300); // Dar tiempo a la animación de salida
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 right-6 z-50 max-w-md shadow-lg rounded-lg border ${bgColor} ${borderColor} overflow-hidden`}
        >
          <div className="relative p-4 pr-10">
            <div className="flex items-center">
              <Icon className={`mr-3 ${textColor}`} size={20} />
              <div className={`font-medium ${textColor}`}>
                {message}
              </div>
              <button 
                onClick={handleClose}
                className={`absolute top-4 right-4 ${textColor} hover:opacity-70`}
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
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`h-1 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
