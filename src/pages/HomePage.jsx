import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, CheckCircle, Clock, FileText, GitBranch, Layers, Target, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';

// Componentes
import StatCard from '../components/common/StatCard';
import ProjectCard from '../components/common/ProjectCard';
import GradientButton from '../components/common/GradientButton';

const HomePage = () => {
  const { projects, tools, getStats } = useLeanSixSigma();
  const stats = getStats();
  
  // Proyectos recientes ordenados por fecha de última actualización
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);
  
  // Herramientas más usadas
  const topTools = tools
    .filter(tool => tool.component) // Solo herramientas con componente implementado
    .slice(0, 4);
  
  // Variantes para las animaciones
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
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Cabecera */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-8 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">Bienvenido a JC Analytics</h1>
        <p className="text-lg opacity-90 mb-6 max-w-2xl">
          Plataforma integral para el seguimiento de tus proyectos Lean Six Sigma. Utiliza herramientas avanzadas para mejorar la calidad, reducir desperdicios y optimizar procesos.
        </p>
        <div className="flex flex-wrap gap-3">
          <GradientButton to="/projects" className="flex items-center">
            Ver Proyectos <ArrowRight size={16} className="ml-2" />
          </GradientButton>
          <GradientButton variant="secondary" to="/new-project" className="flex items-center">
            Nuevo Proyecto <FileText size={16} className="ml-2" />
          </GradientButton>
        </div>
      </motion.div>
      
      {/* Estadísticas */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resumen General</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Proyectos Activos" 
            value={stats.activeProjects} 
            icon={<Clock />} 
            trend={+10}
            description="En ejecución"
          />
          <StatCard 
            title="Proyectos Totales" 
            value={stats.totalProjects} 
            icon={<FileText />} 
            color="blue"
          />
          <StatCard 
            title="Herramientas Completadas" 
            value={stats.completedTools} 
            icon={<CheckCircle />} 
            color="green"
            description={`${stats.completionRate}% completado`}
          />
          <StatCard 
            title="Mejoras Implementadas" 
            value="18" 
            icon={<Target />} 
            color="purple"
            description="Último trimestre"
          />
        </div>
      </motion.div>
      
      {/* Proyectos recientes */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Proyectos Recientes</h2>
          <Link to="/projects" className="text-primary-600 dark:text-primary-400 hover:underline flex items-center">
            Ver todos <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </motion.div>
      
      {/* Herramientas destacadas */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Herramientas Destacadas</h2>
          <Link to="/tools" className="text-primary-600 dark:text-primary-400 hover:underline flex items-center">
            Ver todas <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topTools.map(tool => {
            // Obtener el icono adecuado para cada herramienta
            let ToolIcon;
            switch (tool.icon) {
              case 'GitMerge': ToolIcon = GitBranch; break;
              case 'BarChart2': ToolIcon = BarChart2; break;
              case 'Users': ToolIcon = Users; break;
              case 'Layers': ToolIcon = Layers; break;
              default: ToolIcon = FileText;
            }
            
            return (
              <div key={tool.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-3">
                  <ToolIcon size={20} />
                </div>
                <h3 className="font-semibold mb-1 text-gray-800 dark:text-white">{tool.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 h-10">
                  {tool.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300 rounded-full px-2 py-1">
                    {tool.phase}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-2 py-1">
                    {tool.difficulty}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
      
      {/* Sección informativa interactiva */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Metodología y Flujo de Trabajo</h2>
        
        {/* Mapa interactivo de proceso */}
        <motion.div className="relative mb-12 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start relative z-10 pt-10">
            {/* Línea de conexión en escritorio */}
            <div className="hidden md:block absolute top-28 left-10 right-10 h-1 bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-red-500 to-purple-500"></div>
            
            {/* Fases DMAIC */}
            {[
              {letter: 'D', name: 'Define', color: 'blue', icon: <Target size={24} />, 
               desc: 'Identificar el problema y requisitos', tools: ['Project Charter', 'VOC']},
              {letter: 'M', name: 'Measure', color: 'green', icon: <BarChart2 size={24} />, 
               desc: 'Medir y establecer línea base', tools: ['CTQ Dashboard', 'Control Chart']},
              {letter: 'A', name: 'Analyze', color: 'yellow', icon: <GitBranch size={24} />, 
               desc: 'Identificar causas raíz', tools: ['Pareto Chart', 'Cause-Effect']},
              {letter: 'I', name: 'Improve', color: 'red', icon: <Layers size={24} />, 
               desc: 'Implementar soluciones', tools: ['FMEA', 'Priorization']},
              {letter: 'C', name: 'Control', color: 'purple', icon: <CheckCircle size={24} />, 
               desc: 'Mantener mejoras', tools: ['Control Plans', '5S']}
            ].map((phase, index) => (
              <motion.div 
                key={phase.letter}
                whileHover={{ y: -5 }}
                className="w-full md:w-1/5 mb-8 md:mb-0 flex flex-col items-center"
              >
                <div className={`w-16 h-16 rounded-full bg-${phase.color}-100 dark:bg-${phase.color}-900 
                  flex items-center justify-center text-${phase.color}-600 dark:text-${phase.color}-400 
                  shadow-lg mb-4 border-2 border-${phase.color}-500 transition-transform duration-300 hover:scale-110`}>
                  <span className="text-2xl font-bold">{phase.letter}</span>
                </div>
                
                <h3 className={`text-lg font-semibold text-${phase.color}-600 dark:text-${phase.color}-400 mb-2`}>
                  {phase.name}
                </h3>
                
                <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-3 px-2">
                  {phase.desc}
                </p>
                
                <div className="flex flex-col items-center space-y-1">
                  {phase.tools.map(tool => (
                    <span key={tool} className="text-xs bg-gray-100 dark:bg-gray-700 
                      text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                      {tool}
                    </span>
                  ))}
                </div>
                
                {/* Línea de conexión en móvil */}
                {index < 4 && (
                  <div className="md:hidden w-1 h-8 bg-gradient-to-b from-current to-gray-300 dark:to-gray-600 my-2"></div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Explicación complementaria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 p-6 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-semibold mb-3 text-primary-700 dark:text-primary-300 flex items-center">
              <div className="w-8 h-8 mr-2 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center">
                <CheckCircle size={18} className="text-primary-700 dark:text-primary-300" />
              </div>
              Lean: Eliminar desperdicios
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              En JC Analytics, aplicamos principios Lean para eliminar los 8 tipos de desperdicios en tus procesos:
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="mt-1 flex-shrink-0 text-green-500" />
                <span className="text-sm">Defectos</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="mt-1 flex-shrink-0 text-green-500" />
                <span className="text-sm">Sobreproducción</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="mt-1 flex-shrink-0 text-green-500" />
                <span className="text-sm">Espera</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="mt-1 flex-shrink-0 text-green-500" />
                <span className="text-sm">Talento no utilizado</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="mt-1 flex-shrink-0 text-green-500" />
                <span className="text-sm">Transporte</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="mt-1 flex-shrink-0 text-green-500" />
                <span className="text-sm">Inventario</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="mt-1 flex-shrink-0 text-green-500" />
                <span className="text-sm">Movimiento</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle size={16} className="mt-1 flex-shrink-0 text-green-500" />
                <span className="text-sm">Exceso de procesamiento</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/30 dark:to-secondary-800/30 p-6 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-semibold mb-3 text-secondary-700 dark:text-secondary-300 flex items-center">
              <div className="w-8 h-8 mr-2 rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center">
                <BarChart2 size={18} className="text-secondary-700 dark:text-secondary-300" />
              </div>
              Six Sigma: Reducir variación
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Nuestra plataforma te permite aplicar técnicas de Six Sigma para reducir la variabilidad de tus procesos:
            </p>
            
            <ul className="space-y-2">
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-secondary-700 dark:text-secondary-300">1</span>
                </div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  <strong>Análisis estadístico</strong> - Herramientas avanzadas para examinar datos y tendencias
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-secondary-700 dark:text-secondary-300">2</span>
                </div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  <strong>Gráficos de control</strong> - Monitoreo de procesos en tiempo real
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-secondary-700 dark:text-secondary-300">3</span>
                </div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  <strong>Métricas de rendimiento</strong> - Evaluación continua de la calidad del proceso
                </span>
              </li>
            </ul>
          </motion.div>
        </div>
        
        <div className="mt-8 text-center">
          <GradientButton to="/projects" className="flex items-center mx-auto">
            Explorar herramientas <ArrowRight size={16} className="ml-2" />
          </GradientButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HomePage;
