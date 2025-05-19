import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Robot,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  BarChart,
  Check,
  X,
  Trash2,
  Edit2,
  Save,
  Copy,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Módulo de automatización RPA para LSS
 * Permite describir un proceso y generar checklist + estimación de horas ahorradas
 */
const RpaWizard = () => {
  const { isDark } = useTheme();
  
  // Estados
  const [currentStep, setCurrentStep] = useState(0);
  const [processDescription, setProcessDescription] = useState('');
  const [processActivities, setProcessActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState({
    name: '',
    time: 0,
    frequency: 'daily',
    automated: false,
    automationComplexity: 'medium'
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [savingResults, setSavingResults] = useState(false);
  const [error, setError] = useState(null);
  
  // Resultados calculados
  const [results, setResults] = useState({
    totalHoursSaved: 0,
    totalFTESaved: 0,
    automationTasks: [],
    timeToImplement: 0,
    roi: 0
  });
  
  // Configuración de frecuencias para cálculos
  const frequencyFactors = {
    hourly: 8 * 5 * 4 * 12, // 8 horas × 5 días × 4 semanas × 12 meses
    daily: 5 * 4 * 12,      // 5 días × 4 semanas × 12 meses
    weekly: 4 * 12,         // 4 semanas × 12 meses
    monthly: 12,            // 12 meses
    quarterly: 4,           // 4 veces al año
    annual: 1               // 1 vez al año
  };
  
  // Configuración de complejidad para estimación de implementación
  const complexityFactors = {
    low: 8,        // 1 día (8 horas)
    medium: 24,    // 3 días (24 horas)
    high: 80,      // 2 semanas (80 horas)
    veryHigh: 160  // 1 mes (160 horas)
  };
  
  // Calcular resultados basados en las actividades
  const calculateResults = () => {
    let totalHoursSaved = 0;
    let timeToImplement = 0;
    const automationTasks = [];
    
    processActivities.forEach(activity => {
      if (activity.automated) {
        // Calcular horas ahorradas anualmente
        const hoursSaved = (activity.time / 60) * frequencyFactors[activity.frequency];
        totalHoursSaved += hoursSaved;
        
        // Estimar tiempo de implementación
        const implementationTime = complexityFactors[activity.automationComplexity];
        timeToImplement += implementationTime;
        
        // Crear tarea de automatización
        automationTasks.push({
          name: activity.name,
          hoursSaved,
          implementationTime
        });
      }
    });
    
    // Calcular FTE (Full Time Equivalent) basado en 1,880 horas laborales por año
    const totalFTESaved = totalHoursSaved / 1880;
    
    // Calcular ROI simple (ahorro anual / tiempo de implementación)
    const roi = timeToImplement > 0 ? totalHoursSaved / timeToImplement : 0;
    
    setResults({
      totalHoursSaved,
      totalFTESaved,
      automationTasks,
      timeToImplement,
      roi
    });
  };
  
  // Maneja cambios en la descripción del proceso
  const handleDescriptionChange = (e) => {
    setProcessDescription(e.target.value);
  };
  
  // Maneja cambios en la actividad actual
  const handleActivityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentActivity({
      ...currentActivity,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Añadir nueva actividad
  const addActivity = () => {
    // Validar
    if (!currentActivity.name.trim()) {
      setError('El nombre de la actividad es obligatorio');
      return;
    }
    
    if (isEditing && editingIndex !== null) {
      // Actualizar actividad existente
      const updatedActivities = [...processActivities];
      updatedActivities[editingIndex] = currentActivity;
      setProcessActivities(updatedActivities);
      setIsEditing(false);
      setEditingIndex(null);
    } else {
      // Añadir nueva actividad
      setProcessActivities([...processActivities, currentActivity]);
    }
    
    // Resetear el formulario
    setCurrentActivity({
      name: '',
      time: 0,
      frequency: 'daily',
      automated: false,
      automationComplexity: 'medium'
    });
    
    setError(null);
  };
  
  // Editar actividad existente
  const editActivity = (index) => {
    setCurrentActivity(processActivities[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };
  
  // Eliminar actividad
  const deleteActivity = (index) => {
    const updatedActivities = [...processActivities];
    updatedActivities.splice(index, 1);
    setProcessActivities(updatedActivities);
  };
  
  // Reiniciar el formulario
  const resetForm = () => {
    setCurrentActivity({
      name: '',
      time: 0,
      frequency: 'daily',
      automated: false,
      automationComplexity: 'medium'
    });
    setIsEditing(false);
    setEditingIndex(null);
    setError(null);
  };
  
  // Generar el siguiente paso
  const nextStep = () => {
    // Validar paso actual antes de avanzar
    if (currentStep === 0 && !processDescription.trim()) {
      setError('La descripción del proceso es obligatoria');
      return;
    }
    
    if (currentStep === 1 && processActivities.length === 0) {
      setError('Debes añadir al menos una actividad');
      return;
    }
    
    // Calcular resultados antes de mostrar el resumen
    if (currentStep === 1) {
      calculateResults();
    }
    
    setCurrentStep(currentStep + 1);
    setError(null);
  };
  
  // Volver al paso anterior
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };
  
  // Simular guardado de resultados
  const saveResults = () => {
    setSavingResults(true);
    
    // Simulamos procesamiento
    setTimeout(() => {
      setSavingResults(false);
      alert('¡Proceso de automatización guardado correctamente!');
      
      // Reiniciar wizard
      setCurrentStep(0);
      setProcessDescription('');
      setProcessActivities([]);
      setResults({
        totalHoursSaved: 0,
        totalFTESaved: 0,
        automationTasks: [],
        timeToImplement: 0,
        roi: 0
      });
    }, 1500);
  };
  
  // Renderizado de consejos
  const renderTips = () => (
    <AnimatePresence>
      {showTips && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Consejos para identificar oportunidades de automatización:</h3>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => setShowTips(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 pl-5 list-disc">
              <li>Busca actividades repetitivas que se realicen con alta frecuencia</li>
              <li>Identifica tareas que involucren manejo de datos entre sistemas</li>
              <li>Prioriza procesos con reglas claras y pocas excepciones</li>
              <li>Considera actividades con alto volumen y bajo valor agregado</li>
              <li>Los procesos relacionados con extracción, transformación y carga de datos suelen ser buenos candidatos</li>
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  // Renderizado del formulario de descripción de proceso
  const renderStepOne = () => (
    <div>
      <h2 className="text-lg font-medium mb-4">Paso 1: Descripción del Proceso</h2>
      
      {renderTips()}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1" htmlFor="process-description">
          Describe el proceso que deseas automatizar
        </label>
        <textarea
          id="process-description"
          value={processDescription}
          onChange={handleDescriptionChange}
          rows="4"
          className="w-full px-3 py-2 border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
          placeholder="Ej: Proceso de extracción diaria de datos de ventas desde sistema SAP, transformación en Excel y carga en PowerBI..."
        ></textarea>
      </div>
    </div>
  );
  
  // Renderizado del formulario de actividades
  const renderStepTwo = () => (
    <div>
      <h2 className="text-lg font-medium mb-4">Paso 2: Actividades del Proceso</h2>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-start">
          <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      <div className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium mb-3">
          {isEditing ? 'Editar Actividad' : 'Añadir Nueva Actividad'}
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="activity-name">
              Nombre de la Actividad
            </label>
            <input
              type="text"
              id="activity-name"
              name="name"
              value={currentActivity.name}
              onChange={handleActivityChange}
              className="w-full px-3 py-2 text-sm border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="Ej: Exportar reporte desde SAP"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="activity-time">
                Tiempo (minutos)
              </label>
              <input
                type="number"
                id="activity-time"
                name="time"
                min="0"
                value={currentActivity.time}
                onChange={handleActivityChange}
                className="w-full px-3 py-2 text-sm border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="activity-frequency">
                Frecuencia
              </label>
              <select
                id="activity-frequency"
                name="frequency"
                value={currentActivity.frequency}
                onChange={handleActivityChange}
                className="w-full px-3 py-2 text-sm border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              >
                <option value="hourly">Cada hora</option>
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="annual">Anual</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="activity-automated"
              name="automated"
              checked={currentActivity.automated}
              onChange={handleActivityChange}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm" htmlFor="activity-automated">
              ¿Candidata para automatización?
            </label>
          </div>
          
          {currentActivity.automated && (
            <div>
              <label className="block text-xs font-medium mb-1" htmlFor="automation-complexity">
                Complejidad de Automatización
              </label>
              <select
                id="automation-complexity"
                name="automationComplexity"
                value={currentActivity.automationComplexity}
                onChange={handleActivityChange}
                className="w-full px-3 py-2 text-sm border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              >
                <option value="low">Baja (scripts simples, macros)</option>
                <option value="medium">Media (RPA básico, integraciones simples)</option>
                <option value="high">Alta (múltiples sistemas, reglas complejas)</option>
                <option value="veryHigh">Muy Alta (AI, análisis de documentos)</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button
            type="button"
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
            onClick={addActivity}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-1" />
                Actualizar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Añadir
              </>
            )}
          </button>
          
          {isEditing && (
            <button
              type="button"
              className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md flex items-center"
              onClick={resetForm}
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </button>
          )}
        </div>
      </div>
      
      {/* Lista de actividades */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Actividades del Proceso ({processActivities.length})</h3>
        
        {processActivities.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center border dark:border-gray-700 rounded-md">
            No has añadido ninguna actividad todavía
          </div>
        ) : (
          <div className="border dark:border-gray-700 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actividad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiempo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Frecuencia</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Automatizar</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {processActivities.map((activity, index) => (
                  <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-4 py-2 text-sm">{activity.name}</td>
                    <td className="px-4 py-2 text-sm">{activity.time} min</td>
                    <td className="px-4 py-2 text-sm capitalize">{activity.frequency}</td>
                    <td className="px-4 py-2 text-sm">
                      {activity.automated ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => editActivity(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteActivity(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
  
  // Renderizado del resumen y checklist
  const renderStepThree = () => (
    <div>
      <h2 className="text-lg font-medium mb-4">Paso 3: Resumen y Checklist de Automatización</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Horas Ahorradas (Anual)
          </h3>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {results.totalHoursSaved.toFixed(0)}
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2 flex items-center">
            <BarChart className="w-4 h-4 mr-1" />
            FTE Liberados
          </h3>
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {results.totalFTESaved.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2 flex items-center">
            <Robot className="w-4 h-4 mr-1" />
            ROI Estimado
          </h3>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {results.roi.toFixed(1)}x
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Checklist de Automatización</h3>
        
        {results.automationTasks.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center border dark:border-gray-700 rounded-md">
            No hay tareas candidatas para automatización
          </div>
        ) : (
          <div className="border dark:border-gray-700 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actividad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Horas Ahorradas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiempo Implementación</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ROI</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {results.automationTasks.map((task, index) => (
                  <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-800'}>
                    <td className="px-4 py-2 text-sm">{task.name}</td>
                    <td className="px-4 py-2 text-sm">{task.hoursSaved.toFixed(1)} horas</td>
                    <td className="px-4 py-2 text-sm">{task.implementationTime} horas</td>
                    <td className="px-4 py-2 text-sm">
                      {(task.hoursSaved / task.implementationTime).toFixed(1)}x
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 dark:bg-gray-700 font-medium">
                  <td className="px-4 py-2 text-sm">Total</td>
                  <td className="px-4 py-2 text-sm">{results.totalHoursSaved.toFixed(1)} horas</td>
                  <td className="px-4 py-2 text-sm">{results.timeToImplement} horas</td>
                  <td className="px-4 py-2 text-sm">{results.roi.toFixed(1)}x</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium mb-2">Resumen del Proceso</h3>
        <p className="text-sm mb-4">{processDescription}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total de actividades:</span>{' '}
            <span className="font-medium">{processActivities.length}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Actividades automatizables:</span>{' '}
            <span className="font-medium">{processActivities.filter(a => a.automated).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Renderizar navegación entre pasos
  const renderNavigation = () => (
    <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-700">
      {currentStep > 0 ? (
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md flex items-center"
          onClick={prevStep}
        >
          <ChevronUp className="w-4 h-4 mr-1 rotate-90" />
          Anterior
        </button>
      ) : (
        <div></div>
      )}
      
      {currentStep < 2 ? (
        <button
          type="button"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
          onClick={nextStep}
        >
          Siguiente
          <ChevronDown className="w-4 h-4 ml-1 -rotate-90" />
        </button>
      ) : (
        <button
          type="button"
          className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center ${
            savingResults ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          onClick={saveResults}
          disabled={savingResults}
        >
          {savingResults ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              Finalizar
            </>
          )}
        </button>
      )}
    </div>
  );
  
  // Renderizado principal
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Encabezado */}
      <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <div className="flex items-center">
          <Robot className="h-6 w-6 mr-2" />
          <h2 className="text-xl font-bold">Asistente de Automatización RPA</h2>
        </div>
        <p className="mt-1 text-sm text-purple-100">
          Describe un proceso y genera un checklist de automatización con estimación de horas ahorradas
        </p>
      </div>
      
      {/* Indicador de progreso */}
      <div className="px-6 pt-6">
        <div className="relative">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
            <div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
              style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
            ></div>
          </div>
          <div className="flex text-xs mt-1 text-gray-500 dark:text-gray-400 justify-between">
            <div className={currentStep >= 0 ? 'text-blue-500 font-medium' : ''}>Descripción</div>
            <div className={currentStep >= 1 ? 'text-blue-500 font-medium' : ''}>Actividades</div>
            <div className={currentStep >= 2 ? 'text-blue-500 font-medium' : ''}>Resultados</div>
          </div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="p-6">
        {error && currentStep !== 1 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-start">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        {currentStep === 0 && renderStepOne()}
        {currentStep === 1 && renderStepTwo()}
        {currentStep === 2 && renderStepThree()}
        
        {renderNavigation()}
      </div>
    </div>
  );
};

export default RpaWizard;
