import React from 'react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Componente para mostrar un resumen del ROI de un proyecto
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const RoiSummary = ({ projectId }) => {
  const { getProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // Si no hay datos de ROI o no hay proyecto, mostrar mensaje para configurar ROI
  if (!project || !project.roiData || !project.roiData.results) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
        <div className="flex justify-center mb-3">
          <div className="bg-amber-100 dark:bg-amber-800/50 p-2 rounded-full">
            <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
          </div>
        </div>
        <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
          Análisis Financiero Pendiente
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Utiliza la calculadora de ROI para evaluar el impacto financiero de este proyecto.
        </p>
        <button 
          onClick={() => window.location.href = `/projects/${projectId}/tools/roi-calculator`}
          className="text-sm px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
        >
          Configurar ROI
        </button>
      </div>
    );
  }
  
  // Obtener datos de resultados
  const { hoursSaved, fteEquivalent, moneySaved, roi, paybackMonths, lastUpdated } = project.roiData.results;
  
  // Calcular distribución de beneficios (35% ahorro, 65% ingresos)
  const savings = moneySaved * 0.35;
  const revenue = moneySaved * 0.65;
  
  // Formatear número con comas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };
  
  // Formatear número con decimales
  const formatDecimal = (num, decimals = 1) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };
  
  // Obtener fecha de última actualización
  const lastUpdatedDate = new Date(lastUpdated);
  const formattedDate = lastUpdatedDate.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Verificar si el ROI es bueno (tiene un tiempo de recuperación <= 8 meses)
  const isGoodRoi = paybackMonths <= 8;
  
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
    hidden: { y: 10, opacity: 0 },
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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-4 bg-blue-500 dark:bg-blue-700 text-white">
        <h3 className="text-lg font-medium flex items-center">
          <DollarSign className="mr-2" size={18} />
          Análisis Financiero
        </h3>
      </div>
      
      <div className="p-4">
        <motion.div variants={itemVariants} className="flex items-center mb-4">
          <div className={`p-2 rounded-full ${isGoodRoi ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'} mr-3`}>
            {isGoodRoi ? (
              <TrendingUp className="text-green-600 dark:text-green-400" size={18} />
            ) : (
              <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={18} />
            )}
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">ROI del proyecto</div>
            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {formatDecimal(roi)}%
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payback period</div>
            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {formatDecimal(paybackMonths)} <span className="text-sm font-normal">meses</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Ahorro Operativo (35%)</div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              ${formatNumber(savings)}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Ingresos Adicionales (65%)</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ${formatNumber(revenue)}
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-gray-400 mr-1" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Última actualización: {formattedDate}
              </span>
            </div>
            <button 
              onClick={() => window.location.href = `/projects/${projectId}/tools/roi-calculator`}
              className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver detalles
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RoiSummary;
