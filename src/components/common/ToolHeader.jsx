import { 
  Save, 
  Edit, 
  X, 
  Maximize2, 
  Minimize2,
  Info,
  HelpCircle,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * Componente de encabezado común para las herramientas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.icon - Icono de la herramienta
 * @param {string} props.title - Título de la herramienta
 * @param {string} props.description - Descripción corta de la herramienta
 * @param {boolean} props.isEditing - Estado de edición
 * @param {function} props.setIsEditing - Función para cambiar el estado de edición
 * @param {boolean} props.isFullscreen - Estado de pantalla completa
 * @param {function} props.toggleFullscreen - Función para alternar pantalla completa
 * @param {function} props.saveChanges - Función para guardar cambios
 * @param {boolean} props.isSaving - Estado de guardado en progreso
 * @param {function} props.exportData - Función opcional para exportar datos
 */
const ToolHeader = ({ 
  icon: Icon, 
  title, 
  description, 
  isEditing, 
  setIsEditing, 
  isFullscreen, 
  toggleFullscreen, 
  saveChanges, 
  isSaving,
  exportData
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent dark:from-blue-900 dark:to-transparent opacity-50 rounded-bl-full -z-10"></div>
      
      <div className="flex justify-between items-center mb-2">
        <motion.h1 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold text-gray-800 dark:text-white flex items-center"
        >
          <Icon className="mr-3" size={32} />
          {title}
        </motion.h1>
        
        <div className="flex space-x-2">
          {!isEditing ? (
            <>
              {exportData && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={exportData}
                  className="px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
                  title="Exportar datos"
                >
                  <Download size={16} className="mr-1" /> Exportar
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Edit size={16} className="mr-2" /> Editar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="p-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Ayuda"
              >
                <HelpCircle size={16} />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveChanges}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" /> Guardar
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <X size={16} className="mr-2" /> Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="p-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </motion.button>
            </>
          )}
        </div>
      </div>
      
      <motion.p 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-sm text-gray-600 dark:text-gray-400 flex items-center"
      >
        <Info size={14} className="mr-1 flex-shrink-0" />
        {description}
      </motion.p>
      
      {/* Panel de ayuda */}
      {showHelp && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mt-4 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-100 dark:border-gray-600"
        >
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
            <HelpCircle size={16} className="mr-2" />
            Ayuda rápida: {title}
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-200">
            {title === "Diagrama Causa-Efecto" && (
              <ul className="space-y-1 list-disc pl-5">
                <li>También conocido como diagrama de Ishikawa o espina de pescado.</li>
                <li>Ayuda a identificar posibles causas de un problema organizadas por categorías.</li>
                <li>Utiliza el modo de edición para añadir o modificar el problema central, categorías y causas.</li>
                <li>Puedes personalizar las "6M" (Método, Mano de obra, etc.) según tus necesidades.</li>
              </ul>
            )}
            
            {title === "Gráfico de Control" && (
              <ul className="space-y-1 list-disc pl-5">
                <li>Monitorea la estabilidad de un proceso a lo largo del tiempo.</li>
                <li>Detecta variaciones anómalas fuera de los límites de control.</li>
                <li>Utiliza la pestaña de datos para añadir o modificar puntos de medición.</li>
                <li>Configura los límites de control y el objetivo en la pestaña de configuración.</li>
                <li>Exporta los datos en formato CSV para análisis adicional.</li>
              </ul>
            )}
            
            {title === "Diagrama de Pareto" && (
              <ul className="space-y-1 list-disc pl-5">
                <li>Visualiza causas de problemas ordenadas por frecuencia o impacto.</li>
                <li>Sigue el principio 80/20 (el 80% de los efectos proviene del 20% de las causas).</li>
                <li>Identifica las causas más significativas para priorizar acciones.</li>
                <li>Añade o modifica causas y sus valores en el modo de edición.</li>
                <li>Los resultados se ordenan automáticamente de mayor a menor impacto.</li>
              </ul>
            )}
            
            {title === "Metodología 5S" && (
              <ul className="space-y-1 list-disc pl-5">
                <li>Organiza el lugar de trabajo mediante 5 principios japoneses.</li>
                <li>Seiri (Clasificar): Eliminar lo innecesario.</li>
                <li>Seiton (Ordenar): Un lugar para cada cosa y cada cosa en su lugar.</li>
                <li>Seiso (Limpiar): Mantener limpio el espacio de trabajo.</li>
                <li>Seiketsu (Estandarizar): Crear normas para mantener el orden.</li>
                <li>Shitsuke (Mantener): Crear hábitos basados en las 4S anteriores.</li>
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ToolHeader;
