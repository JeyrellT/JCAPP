import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import NewProjectForm from '../components/forms/NewProjectForm';

/**
 * Página para crear un nuevo proyecto
 */
const NewProjectPage = () => {
  // Cambiar el título de la página
  useEffect(() => {
    document.title = 'Nuevo Proyecto | Lean Six Sigma App';
    
    // Limpiar al desmontar
    return () => {
      document.title = 'Lean Six Sigma App';
    };
  }, []);
  
  // Variantes para animaciones
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="container mx-auto p-4"
    >
      {/* Cabecera */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <Link 
              to="/projects" 
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-2"
            >
              <ArrowLeft size={16} className="mr-1" /> Volver a Proyectos
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
              <Plus size={24} className="mr-2 text-blue-600 dark:text-blue-400" />
              Nuevo Proyecto Lean Six Sigma
            </h1>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Completa el formulario para crear un nuevo proyecto Lean Six Sigma con todas sus herramientas asociadas.
        </p>
      </motion.div>
      
      {/* Formulario */}
      <motion.div variants={itemVariants}>
        <NewProjectForm />
      </motion.div>
    </motion.div>
  );
};

export default NewProjectPage;
