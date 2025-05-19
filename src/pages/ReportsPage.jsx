import { useState } from 'react';
import { 
  BarChart2, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  List, 
  Download,
  Share2,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';

const ReportsPage = () => {
  const { projects, tools, getStats } = useLeanSixSigma();
  const [activeTab, setActiveTab] = useState('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('month');
  
  // Estadísticas generales
  const stats = getStats();
  
  // Función para generar reporte
  const generateReport = () => {
    setIsLoading(true);
    
    // Aquí iría la lógica para generar un reporte
    
    // Simulando carga
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };
  
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
      className="container mx-auto p-4"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Reportes y Análisis
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualiza y descarga reportes de progreso y rendimiento de tus proyectos Lean Six Sigma
        </p>
      </motion.div>
      
      {/* Pestañas */}
      <motion.div variants={itemVariants} className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-3 px-4 font-medium ${
            activeTab === 'summary'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`py-3 px-4 font-medium ${
            activeTab === 'projects'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          Proyectos
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`py-3 px-4 font-medium ${
            activeTab === 'tools'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          Herramientas
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`py-3 px-4 font-medium ${
            activeTab === 'custom'
              ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
          }`}
        >
          Reporte Personalizado
        </button>
      </motion.div>
      
      {/* Controles de filtrado */}
      <motion.div variants={itemVariants} className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Periodo:
          </span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Este trimestre</option>
            <option value="year">Este año</option>
            <option value="all">Todo</option>
          </select>
          
          <button className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600">
            <Filter size={16} className="mr-2" />
            Más filtros
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download size={16} className="mr-2" /> 
            Descargar
          </button>
          <button className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            <Share2 size={16} className="mr-2" /> 
            Compartir
          </button>
          <button className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            <Printer size={16} className="mr-2" /> 
            Imprimir
          </button>
        </div>
      </motion.div>
      
      {/* Contenido principal */}
      <div className="grid grid-cols-1 gap-6">
        {/* Si estamos en la vista de resumen */}
        {activeTab === 'summary' && (
          <>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-4">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Proyectos</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalProjects}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full mr-4">
                  <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Proyectos Activos</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.activeProjects}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mr-4">
                  <List size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Herramientas</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalTools}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full mr-4">
                  <PieChart size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Completitud</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.completionRate}%</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Proyectos por Estado
                </h3>
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500 dark:text-gray-400">
                    [Aquí iría un gráfico de proyectos por estado]
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Herramientas más utilizadas
                </h3>
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500 dark:text-gray-400">
                    [Aquí iría un gráfico de herramientas más utilizadas]
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
        
        {/* Si estamos en la vista de proyectos */}
        {activeTab === 'projects' && (
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Estado de Proyectos
            </h3>
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400">
                [Aquí iría una tabla detallada de proyectos]
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Si estamos en la vista de herramientas */}
        {activeTab === 'tools' && (
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Uso de Herramientas
            </h3>
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500 dark:text-gray-400">
                [Aquí iría un análisis de uso de herramientas]
              </p>
            </div>
          </motion.div>
        )}
        
        {/* Si estamos en la vista de reporte personalizado */}
        {activeTab === 'custom' && (
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Generar Reporte Personalizado
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Reporte
                </label>
                <select className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Resumen Ejecutivo</option>
                  <option>Detalle de Proyectos</option>
                  <option>Análisis de Herramientas</option>
                  <option>Reporte Completo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Periodo de Tiempo
                </label>
                <div className="flex space-x-2">
                  <input type="date" className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="date" className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyectos a Incluir
              </label>
              <select multiple className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={generateReport}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Generando Reporte...</span>
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    <span>Generar Reporte</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ReportsPage;
