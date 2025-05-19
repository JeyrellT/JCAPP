import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import GradientButton from '../components/common/GradientButton';

const NotFoundPage = () => {
  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
    >
      <motion.div
        variants={itemVariants}
        className="w-24 h-24 mb-8 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center"
      >
        <Search size={40} className="text-gray-500" />
      </motion.div>
      
      <motion.h1 
        variants={itemVariants}
        className="text-6xl font-bold text-gray-800 dark:text-white mb-4"
      >
        404
      </motion.h1>
      
      <motion.h2 
        variants={itemVariants}
        className="text-2xl font-medium text-gray-700 dark:text-gray-300 mb-6"
      >
        Página no encontrada
      </motion.h2>
      
      <motion.p 
        variants={itemVariants}
        className="max-w-md text-gray-600 dark:text-gray-400 mb-8"
      >
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
        Por favor, verifica la URL o regresa a la página de inicio.
      </motion.p>
      
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4"
      >
        <GradientButton to="/" className="flex items-center justify-center">
          <Home size={18} className="mr-2" /> Ir al inicio
        </GradientButton>
        
        <GradientButton
          variant="secondary"
          onClick={() => window.history.back()}
          className="flex items-center justify-center"
        >
          <ArrowLeft size={18} className="mr-2" /> Volver atrás
        </GradientButton>
      </motion.div>
      
      {/* Ilustración de fondo */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-5 pointer-events-none overflow-hidden">
        <svg width="800" height="800" viewBox="0 0 300 300">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#gradient)" strokeWidth="2">
            <circle cx="150" cy="150" r="100" />
            <circle cx="150" cy="150" r="80" />
            <circle cx="150" cy="150" r="60" />
            <circle cx="150" cy="150" r="40" />
            <circle cx="150" cy="150" r="20" />
            <line x1="50" y1="150" x2="250" y2="150" />
            <line x1="150" y1="50" x2="150" y2="250" />
            <line x1="75" y1="75" x2="225" y2="225" />
            <line x1="75" y1="225" x2="225" y2="75" />
          </g>
        </svg>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;
