import { useState } from 'react';
import {
  Bot,
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
  AlertCircle,
  Download,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GradientButton from './GradientButton';
import { formatNumber } from '../../lib/format';
import { transition as motionTransition } from '../../lib/motion';
import { exportToJson } from '../../utils/export';

/**
 * @deprecated No se monta en ninguna parte de la aplicación. Duplica la
 * matemática de ahorro/ROI de `src/tools/RoiCalculator.jsx` (enrutada y con
 * persistencia real). Se conserva reparado — sin el crash de `Robot` y sin
 * el guardado simulado — como candidato a consolidación o a herramienta 15
 * en un ciclo futuro, a decisión del usuario. No se borra este ciclo.
 *
 * Asistente de diagnóstico de automatización RPA: a partir de una
 * descripción de proceso y sus actividades, estima horas ahorradas al año,
 * FTE liberados y un ROI simple (horas ahorradas / horas de implementación).
 * No persiste nada: los resultados solo pueden copiarse o descargarse como
 * JSON, nunca "guardarse" en un proyecto (no está asociado a ninguno).
 */
const RpaWizard = () => {
  // Estados del wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [processDescription, setProcessDescription] = useState('');
  const [processActivities, setProcessActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState({
    name: '',
    time: 0,
    frequency: 'daily',
    automated: false,
    automationComplexity: 'medium',
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Resultados calculados
  const [results, setResults] = useState({
    totalHoursSaved: 0,
    totalFTESaved: 0,
    automationTasks: [],
    timeToImplement: 0,
    roi: 0,
  });

  // Configuración de frecuencias para cálculos
  const frequencyFactors = {
    hourly: 8 * 5 * 4 * 12, // 8 horas × 5 días × 4 semanas × 12 meses
    daily: 5 * 4 * 12, // 5 días × 4 semanas × 12 meses
    weekly: 4 * 12, // 4 semanas × 12 meses
    monthly: 12, // 12 meses
    quarterly: 4, // 4 veces al año
    annual: 1, // 1 vez al año
  };

  const FREQUENCY_LABELS = {
    hourly: 'Cada hora',
    daily: 'Diaria',
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    annual: 'Anual',
  };

  // Configuración de complejidad para estimación de implementación
  const complexityFactors = {
    low: 8, // 1 día (8 horas)
    medium: 24, // 3 días (24 horas)
    high: 80, // 2 semanas (80 horas)
    veryHigh: 160, // 1 mes (160 horas)
  };

  // Calcular resultados basados en las actividades
  const calculateResults = () => {
    let totalHoursSaved = 0;
    let timeToImplement = 0;
    const automationTasks = [];

    processActivities.forEach((activity) => {
      if (activity.automated) {
        const hoursSaved = (activity.time / 60) * frequencyFactors[activity.frequency];
        totalHoursSaved += hoursSaved;

        const implementationTime = complexityFactors[activity.automationComplexity];
        timeToImplement += implementationTime;

        automationTasks.push({ name: activity.name, hoursSaved, implementationTime });
      }
    });

    // FTE (Full Time Equivalent) basado en 1.880 horas laborales por año
    const totalFTESaved = totalHoursSaved / 1880;

    // ROI simple: ahorro anual / tiempo de implementación
    const roi = timeToImplement > 0 ? totalHoursSaved / timeToImplement : 0;

    setResults({ totalHoursSaved, totalFTESaved, automationTasks, timeToImplement, roi });
  };

  const handleDescriptionChange = (e) => setProcessDescription(e.target.value);

  const handleActivityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentActivity({ ...currentActivity, [name]: type === 'checkbox' ? checked : value });
  };

  const addActivity = () => {
    if (!currentActivity.name.trim()) {
      setError('El nombre de la actividad es obligatorio');
      return;
    }

    if (isEditing && editingIndex !== null) {
      const updatedActivities = [...processActivities];
      updatedActivities[editingIndex] = currentActivity;
      setProcessActivities(updatedActivities);
      setIsEditing(false);
      setEditingIndex(null);
    } else {
      setProcessActivities([...processActivities, currentActivity]);
    }

    setCurrentActivity({ name: '', time: 0, frequency: 'daily', automated: false, automationComplexity: 'medium' });
    setError(null);
  };

  const editActivity = (index) => {
    setCurrentActivity(processActivities[index]);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const deleteActivity = (index) => {
    const updatedActivities = [...processActivities];
    updatedActivities.splice(index, 1);
    setProcessActivities(updatedActivities);
  };

  const resetForm = () => {
    setCurrentActivity({ name: '', time: 0, frequency: 'daily', automated: false, automationComplexity: 'medium' });
    setIsEditing(false);
    setEditingIndex(null);
    setError(null);
  };

  const nextStep = () => {
    if (currentStep === 0 && !processDescription.trim()) {
      setError('La descripción del proceso es obligatoria');
      return;
    }

    if (currentStep === 1 && processActivities.length === 0) {
      setError('Debes añadir al menos una actividad');
      return;
    }

    if (currentStep === 1) {
      calculateResults();
    }

    setCurrentStep(currentStep + 1);
    setError(null);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError(null);
  };

  const restart = () => {
    setCurrentStep(0);
    setProcessDescription('');
    setProcessActivities([]);
    setResults({ totalHoursSaved: 0, totalFTESaved: 0, automationTasks: [], timeToImplement: 0, roi: 0 });
    setError(null);
  };

  const buildResultsText = () => {
    const lines = [
      'Estimación de automatización (RPA)',
      '',
      `Proceso: ${processDescription}`,
      '',
      `Horas ahorradas al año: ${formatNumber(results.totalHoursSaved, { maximumFractionDigits: 0 })}`,
      `FTE liberados: ${formatNumber(results.totalFTESaved, { maximumFractionDigits: 2 })}`,
      `Tiempo de implementación: ${formatNumber(results.timeToImplement)} horas`,
      `ROI (horas ahorradas / horas de implementación): ${formatNumber(results.roi, { maximumFractionDigits: 1 })}x`,
      '',
      'Actividades candidatas a automatización:',
    ];
    if (results.automationTasks.length === 0) {
      lines.push('- Ninguna actividad se marcó como candidata.');
    } else {
      results.automationTasks.forEach((task) => {
        lines.push(
          `- ${task.name}: ${formatNumber(task.hoursSaved, { maximumFractionDigits: 1 })} h ahorradas/año, ${task.implementationTime} h de implementación`
        );
      });
    }
    return lines.join('\n');
  };

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(buildResultsText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('No se pudo copiar al portapapeles.');
    }
  };

  const downloadResults = () => {
    exportToJson(
      { processDescription, processActivities, results },
      `estimacion_rpa_${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  // Veredicto honesto: criterio explícito, no una caja negra.
  // Buen candidato si el ahorro anual iguala o supera el tiempo de implementación (ROI >= 1).
  const verdict =
    results.automationTasks.length === 0
      ? { tone: 'neutral', text: 'No se marcó ninguna actividad como candidata a automatización.' }
      : results.roi >= 1
        ? { tone: 'success', text: 'Este proceso es buen candidato para RPA' }
        : { tone: 'warning', text: 'Este proceso aún no es buen candidato — estandarízalo primero' };

  // Renderizado de consejos
  const renderTips = () => (
    <AnimatePresence>
      {showTips && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={motionTransition.base}
          className="overflow-hidden"
        >
          <div className="mb-6 rounded-lg border border-line bg-info-soft p-4">
            <div className="flex items-start justify-between">
              <h3 className="mb-2 text-sm font-medium text-info-on">
                Consejos para identificar oportunidades de automatización:
              </h3>
              <button type="button" className="text-info-on hover:opacity-70" onClick={() => setShowTips(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-info-on">
              <li>Busca actividades repetitivas que se realicen con alta frecuencia</li>
              <li>Identifica tareas que involucren manejo de datos entre sistemas</li>
              <li>Prioriza procesos con reglas claras y pocas excepciones</li>
              <li>Considera actividades con alto volumen y bajo valor agregado</li>
              <li>Los procesos de extracción, transformación y carga de datos suelen ser buenos candidatos</li>
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Paso 1: descripción del proceso
  const renderStepOne = () => (
    <div>
      <h2 className="mb-4 text-lg font-medium text-content">Paso 1: Descripción del Proceso</h2>

      {renderTips()}

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-content" htmlFor="process-description">
          Describe el proceso que deseas automatizar
        </label>
        <textarea
          id="process-description"
          value={processDescription}
          onChange={handleDescriptionChange}
          rows="4"
          className="input"
          placeholder="Ej: Proceso de extracción diaria de datos de ventas desde sistema SAP, transformación en Excel y carga en PowerBI..."
        />
      </div>
    </div>
  );

  // Paso 2: actividades del proceso
  const renderStepTwo = () => (
    <div>
      <h2 className="mb-4 text-lg font-medium text-content">Paso 2: Actividades del Proceso</h2>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-danger-soft p-3 text-sm text-danger-on">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="mb-4 rounded-lg border border-line bg-surface-sunken p-4">
        <h3 className="mb-3 text-sm font-medium text-content">
          {isEditing ? 'Editar Actividad' : 'Añadir Nueva Actividad'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-content" htmlFor="activity-name">
              Nombre de la Actividad
            </label>
            <input
              type="text"
              id="activity-name"
              name="name"
              value={currentActivity.name}
              onChange={handleActivityChange}
              className="input text-sm"
              placeholder="Ej: Exportar reporte desde SAP"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-content" htmlFor="activity-time">
                Tiempo (minutos)
              </label>
              <input
                type="number"
                id="activity-time"
                name="time"
                min="0"
                value={currentActivity.time}
                onChange={handleActivityChange}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-content" htmlFor="activity-frequency">
                Frecuencia
              </label>
              <select
                id="activity-frequency"
                name="frequency"
                value={currentActivity.frequency}
                onChange={handleActivityChange}
                className="input text-sm"
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
              className="h-4 w-4 rounded border-line text-brand focus-visible:outline-2 focus-visible:outline-ring"
            />
            <label className="ml-2 text-sm text-content" htmlFor="activity-automated">
              ¿Candidata para automatización?
            </label>
          </div>

          {currentActivity.automated && (
            <div>
              <label className="mb-1 block text-xs font-medium text-content" htmlFor="automation-complexity">
                Complejidad de Automatización
              </label>
              <select
                id="automation-complexity"
                name="automationComplexity"
                value={currentActivity.automationComplexity}
                onChange={handleActivityChange}
                className="input text-sm"
              >
                <option value="low">Baja (scripts simples, macros)</option>
                <option value="medium">Media (RPA básico, integraciones simples)</option>
                <option value="high">Alta (múltiples sistemas, reglas complejas)</option>
                <option value="veryHigh">Muy Alta (IA, análisis de documentos)</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <GradientButton
            type="button"
            size="sm"
            variant="solid"
            leadingIcon={isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            onClick={addActivity}
          >
            {isEditing ? 'Actualizar' : 'Añadir'}
          </GradientButton>

          {isEditing && (
            <GradientButton type="button" size="sm" variant="ghost" leadingIcon={<X className="h-4 w-4" />} onClick={resetForm}>
              Cancelar
            </GradientButton>
          )}
        </div>
      </div>

      {/* Lista de actividades */}
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-medium text-content">
          Actividades del Proceso ({processActivities.length})
        </h3>

        {processActivities.length === 0 ? (
          <div className="rounded-md border border-line p-4 text-center text-sm text-content-muted">
            No has añadido ninguna actividad todavía
          </div>
        ) : (
          <div className="overflow-hidden overflow-x-auto rounded-md border border-line">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Actividad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Tiempo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Frecuencia</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Automatizar</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {processActivities.map((activity, index) => (
                  <tr key={index} className={index % 2 === 0 ? '' : 'bg-surface-sunken'}>
                    <td className="px-4 py-2 text-sm text-content">{activity.name}</td>
                    <td className="px-4 py-2 text-sm text-content-secondary">{activity.time} min</td>
                    <td className="px-4 py-2 text-sm text-content-secondary">
                      {FREQUENCY_LABELS[activity.frequency] || activity.frequency}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {activity.automated ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <X className="h-4 w-4 text-danger" />
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editActivity(index)}
                          className="text-content-secondary hover:text-content"
                          aria-label={`Editar ${activity.name}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteActivity(index)}
                          className="text-danger hover:opacity-70"
                          aria-label={`Eliminar ${activity.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
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

  // Paso 3: resumen y checklist
  const renderStepThree = () => (
    <div>
      <h2 className="mb-4 text-lg font-medium text-content">Paso 3: Resumen y Checklist de Automatización</h2>

      <div
        className={`mb-6 flex items-center gap-2 rounded-lg border border-line p-4 text-sm font-medium ${
          verdict.tone === 'success'
            ? 'bg-success-soft text-success-on'
            : verdict.tone === 'warning'
              ? 'bg-warning-soft text-warning-on'
              : 'bg-surface-sunken text-content-secondary'
        }`}
      >
        <Bot className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{verdict.text}</span>
      </div>
      {results.automationTasks.length > 0 && (
        <p className="-mt-4 mb-6 text-xs text-content-muted">
          Criterio: el ahorro anual estimado debe igualar o superar las horas de implementación (ROI ≥ 1x).
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-info-soft p-4">
          <h3 className="mb-2 flex items-center text-sm font-medium text-info-on">
            <Clock className="mr-1 h-4 w-4" />
            Horas Ahorradas (Anual)
          </h3>
          <div className="text-2xl font-bold text-info-on">
            {formatNumber(results.totalHoursSaved, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-success-soft p-4">
          <h3 className="mb-2 flex items-center text-sm font-medium text-success-on">
            <BarChart className="mr-1 h-4 w-4" />
            FTE Liberados
          </h3>
          <div className="text-2xl font-bold text-success-on">
            {formatNumber(results.totalFTESaved, { maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-accent-100 p-4">
          <h3 className="mb-2 flex items-center text-sm font-medium text-accent-700">
            <Bot className="mr-1 h-4 w-4" />
            ROI Estimado
          </h3>
          <div className="text-2xl font-bold text-accent-700">
            {formatNumber(results.roi, { maximumFractionDigits: 1 })}x
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-content">Checklist de Automatización</h3>

        {results.automationTasks.length === 0 ? (
          <div className="rounded-md border border-line p-4 text-center text-sm text-content-muted">
            No hay tareas candidatas para automatización
          </div>
        ) : (
          <div className="overflow-hidden overflow-x-auto rounded-md border border-line">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-surface-sunken">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Actividad</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Horas Ahorradas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Tiempo Implementación</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.automationTasks.map((task, index) => (
                  <tr key={index} className={index % 2 === 0 ? '' : 'bg-surface-sunken'}>
                    <td className="px-4 py-2 text-sm text-content">{task.name}</td>
                    <td className="px-4 py-2 text-sm text-content-secondary">
                      {formatNumber(task.hoursSaved, { maximumFractionDigits: 1 })} horas
                    </td>
                    <td className="px-4 py-2 text-sm text-content-secondary">{task.implementationTime} horas</td>
                    <td className="px-4 py-2 text-sm text-content-secondary">
                      {formatNumber(task.hoursSaved / task.implementationTime, { maximumFractionDigits: 1 })}x
                    </td>
                  </tr>
                ))}
                <tr className="bg-surface-sunken font-medium">
                  <td className="px-4 py-2 text-sm text-content">Total</td>
                  <td className="px-4 py-2 text-sm text-content">
                    {formatNumber(results.totalHoursSaved, { maximumFractionDigits: 1 })} horas
                  </td>
                  <td className="px-4 py-2 text-sm text-content">{results.timeToImplement} horas</td>
                  <td className="px-4 py-2 text-sm text-content">
                    {formatNumber(results.roi, { maximumFractionDigits: 1 })}x
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-lg border border-line bg-surface-sunken p-4">
        <h3 className="mb-2 text-sm font-medium text-content">Resumen del Proceso</h3>
        <p className="mb-4 text-sm text-content-secondary">{processDescription}</p>

        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-content-muted">Total de actividades:</span>{' '}
            <span className="font-medium text-content">{processActivities.length}</span>
          </div>
          <div>
            <span className="text-content-muted">Actividades automatizables:</span>{' '}
            <span className="font-medium text-content">{processActivities.filter((a) => a.automated).length}</span>
          </div>
        </div>
      </div>

      <p className="mb-4 text-xs text-content-muted">
        Esta estimación no se guarda: solo vive en esta pantalla. Cópiala o descárgala si quieres conservarla — nada
        se sube a ningún servidor.
      </p>

      <div className="flex flex-wrap gap-2">
        <GradientButton
          type="button"
          variant="outline"
          leadingIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          onClick={copyResults}
        >
          {copied ? 'Copiado' : 'Copiar resultados'}
        </GradientButton>
        <GradientButton type="button" variant="solid" leadingIcon={<Download className="h-4 w-4" />} onClick={downloadResults}>
          Descargar estimación (JSON)
        </GradientButton>
        <GradientButton type="button" variant="ghost" leadingIcon={<RotateCcw className="h-4 w-4" />} onClick={restart}>
          Empezar de nuevo
        </GradientButton>
      </div>
    </div>
  );

  // Navegación entre pasos
  const renderNavigation = () => (
    <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
      {currentStep > 0 ? (
        <GradientButton type="button" variant="outline" leadingIcon={<ChevronUp className="h-4 w-4 rotate-90" />} onClick={prevStep}>
          Anterior
        </GradientButton>
      ) : (
        <div />
      )}

      {currentStep < 2 && (
        <GradientButton type="button" variant="solid" trailingIcon={<ChevronDown className="h-4 w-4 -rotate-90" />} onClick={nextStep}>
          Siguiente
        </GradientButton>
      )}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-md">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 text-white">
        <div className="flex items-center">
          <Bot className="mr-2 h-6 w-6" />
          <h2 className="text-xl font-bold">Asistente de Automatización RPA</h2>
        </div>
        <p className="mt-1 text-sm text-white/80">
          Responde unas preguntas sobre tu proceso y te sugerimos si vale la pena automatizarlo.
        </p>
      </div>

      {/* Indicador de progreso */}
      <div className="px-6 pt-6">
        <div className="relative">
          <div className="flex h-2 overflow-hidden rounded bg-surface-sunken text-xs">
            <div
              className="flex flex-col justify-center whitespace-nowrap bg-brand text-center text-white shadow-none"
              style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-content-muted">
            <div className={currentStep >= 0 ? 'font-medium text-brand' : ''}>Descripción</div>
            <div className={currentStep >= 1 ? 'font-medium text-brand' : ''}>Actividades</div>
            <div className={currentStep >= 2 ? 'font-medium text-brand' : ''}>Resultados</div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {error && currentStep !== 1 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-danger-soft p-3 text-sm text-danger-on">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {currentStep === 0 && renderStepOne()}
        {currentStep === 1 && renderStepTwo()}
        {currentStep === 2 && renderStepThree()}

        {currentStep < 2 && renderNavigation()}
        {currentStep === 2 && (
          <div className="mt-6 flex items-center justify-start border-t border-line pt-4">
            <GradientButton type="button" variant="outline" leadingIcon={<ChevronUp className="h-4 w-4 rotate-90" />} onClick={prevStep}>
              Anterior
            </GradientButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default RpaWizard;
