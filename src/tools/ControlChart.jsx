import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertTriangle,
  Eye,
  Undo2,
  Download,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatNumber, formatRelative } from '../lib/format';
import { transition, fadeInUp } from '../lib/motion';

const TOOL_ID = 'control-chart';

// Forma completa del estado vacío, alineada a la semilla de src/data/projects.js
// (measurements es un arreglo plano de números, en el orden de la muestra).
const DEFAULT_DATA = {
  metricName: '',
  centerLine: 0,
  upperControlLimit: 0,
  lowerControlLimit: 0,
  measurements: [],
  outOfControl: false,
};

function computeOutOfControl(measurements, upperControlLimit, lowerControlLimit) {
  return measurements.some(
    (v) => Number(v) > Number(upperControlLimit) || Number(v) < Number(lowerControlLimit)
  );
}

/** Recalcula `outOfControl` a partir de mediciones y límites. Se usa en cada edición. */
function withOutOfControl(next) {
  return {
    ...next,
    outOfControl: computeOutOfControl(next.measurements, next.upperControlLimit, next.lowerControlLimit),
  };
}

/**
 * Rescate de datos legacy: antes este componente escribía en `project.controlChart`
 * con forma { title, metric, unit, target, upperLimit, lowerLimit, data:[{id,date,value}] }.
 * Se invoca solo si `tools['control-chart'].data` está vacío.
 */
function legacyControlChart(project) {
  const legacy = project?.controlChart;
  if (!legacy) return null;
  const measurements = Array.isArray(legacy.data) ? legacy.data.map((d) => Number(d.value) || 0) : [];
  if (measurements.length === 0 && !legacy.metric && !legacy.title) return null;
  const upperControlLimit = Number(legacy.upperLimit) || 0;
  const lowerControlLimit = Number(legacy.lowerLimit) || 0;
  return {
    metricName: legacy.metric || legacy.title || '',
    centerLine: Number(legacy.target) || 0,
    upperControlLimit,
    lowerControlLimit,
    measurements,
    outOfControl: computeOutOfControl(measurements, upperControlLimit, lowerControlLimit),
  };
}

function calculateStats(measurements) {
  if (!measurements || measurements.length === 0) return { mean: 0, stdDev: 0, max: 0, min: 0 };
  const values = measurements.map((v) => Number(v) || 0);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return { mean, stdDev: Math.sqrt(variance), max: Math.max(...values), min: Math.min(...values) };
}

export default function ControlChart({ projectId }) {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, { legacy: legacyControlChart });
  const shouldReduceMotion = useReducedMotion();

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmKind, setConfirmKind] = useState(null); // 'example' | 'discard' | null
  const exampleSnapshotRef = useRef(null);
  const [newValue, setNewValue] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  const stats = useMemo(() => calculateStats(t.data.measurements), [t.data.measurements]);

  if (!t.ready) return null;

  const isEmpty = t.data.measurements.length === 0;
  const { metricName, centerLine, upperControlLimit, lowerControlLimit, measurements } = t.data;

  // --- Edición de mediciones ---------------------------------------------
  const addMeasurement = () => {
    const value = Number(newValue);
    if (newValue === '' || Number.isNaN(value)) return;
    t.setData((prev) => withOutOfControl({ ...prev, measurements: [...prev.measurements, value] }));
    setNewValue('');
  };

  const startEditMeasurement = (index) => {
    setEditingIndex(index);
    setEditingValue(String(measurements[index]));
  };

  const saveEditMeasurement = () => {
    const value = Number(editingValue);
    if (Number.isNaN(value) || editingIndex === null) return;
    t.setData((prev) =>
      withOutOfControl({
        ...prev,
        measurements: prev.measurements.map((v, i) => (i === editingIndex ? value : v)),
      })
    );
    setEditingIndex(null);
    setEditingValue('');
  };

  const removeMeasurement = (index) => {
    t.setData((prev) =>
      withOutOfControl({ ...prev, measurements: prev.measurements.filter((_, i) => i !== index) })
    );
    if (editingIndex === index) setEditingIndex(null);
  };

  const updateField = (field, rawValue) => {
    t.setData((prev) => withOutOfControl({ ...prev, [field]: rawValue }));
  };

  const updateLimit = (field, rawValue) => {
    const value = Number(rawValue);
    if (Number.isNaN(value)) return;
    t.setData((prev) => withOutOfControl({ ...prev, [field]: value }));
  };

  // --- Exportar CSV --------------------------------------------------------
  const exportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Muestra,Valor\n' +
      measurements.map((value, i) => `${i + 1},${value}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `grafico_control_${projectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Modo ejemplo --------------------------------------------------------
  const openExample = () => {
    if (t.isDirty) {
      setConfirmKind('example');
      return;
    }
    applyExample();
  };

  const applyExample = () => {
    exampleSnapshotRef.current = t.data;
    const applied = t.loadExample(0);
    if (applied) setExampleMode(true);
    setConfirmKind(null);
  };

  const adoptExample = () => {
    t.save();
    setExampleMode(false);
    exampleSnapshotRef.current = null;
  };

  const discardExample = () => {
    if (exampleSnapshotRef.current) t.setData(exampleSnapshotRef.current);
    setExampleMode(false);
    exampleSnapshotRef.current = null;
  };

  // --- Cancelar / descartar cambios ----------------------------------------
  const requestDiscard = () => {
    if (!t.isDirty) return;
    setConfirmKind('discard');
  };

  const confirmDiscard = () => {
    t.discard();
    setConfirmKind(null);
  };

  const exampleTitle = t.exampleTitles?.[0] || 'Ejemplo';

  return (
    <div className="p-4 sm:p-6">
      {/* Barra de estado + acciones */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <SaveStatus tool={t} />

        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && (
            <GradientButton
              variant="outline"
              size="sm"
              onClick={openExample}
              leadingIcon={<Eye size={14} aria-hidden="true" />}
            >
              Ver un ejemplo
            </GradientButton>
          )}
          {!isEmpty && (
            <GradientButton
              variant="outline"
              size="sm"
              onClick={exportCsv}
              leadingIcon={<Download size={14} aria-hidden="true" />}
            >
              Exportar CSV
            </GradientButton>
          )}
          {t.isDirty && (
            <GradientButton variant="ghost" size="sm" onClick={requestDiscard}>
              Cancelar
            </GradientButton>
          )}
          <GradientButton
            variant="success"
            size="sm"
            disabled={!t.isDirty || t.isSaving}
            onClick={() => t.save()}
            leadingIcon={t.isSaving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
          >
            Guardar
          </GradientButton>
        </div>
      </div>

      {/* Banner de modo ejemplo */}
      <AnimatePresence>
        {exampleMode && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transition.base}
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-info px-2 py-0.5 text-xs font-medium text-white">Ejemplo</span>
              <span className="font-medium text-content">{exampleTitle}</span>
              <span className="text-content-secondary">
                Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GradientButton
                variant="outline"
                size="sm"
                onClick={discardExample}
                leadingIcon={<Undo2 size={14} aria-hidden="true" />}
              >
                Deshacer
              </GradientButton>
              <GradientButton variant="solid" size="sm" onClick={adoptExample}>
                Usar como punto de partida
              </GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={exampleMode ? 'space-y-6 rounded-xl p-1 ring-1 ring-info/30' : 'space-y-6'}>
        {isEmpty ? (
          <EmptyState
            title="¿Tu proceso está bajo control?"
            description="Ingresa tus mediciones y deja que los límites de control hablen."
            action={
              <GradientButton
                onClick={() => document.getElementById('cc-new-value')?.focus()}
                leadingIcon={<Plus size={16} aria-hidden="true" />}
              >
                Agregar mediciones
              </GradientButton>
            }
            secondaryAction={
              t.hasExamples && (
                <GradientButton variant="outline" onClick={openExample}>
                  Ver un ejemplo
                </GradientButton>
              )
            }
          />
        ) : (
          <>
            {/* Información general */}
            <div className="rounded-xl border border-line bg-surface p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold text-content">Información general</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label htmlFor="cc-metric-name" className="mb-1 block text-xs font-medium text-content-secondary">
                    Métrica monitoreada
                  </label>
                  <input
                    id="cc-metric-name"
                    type="text"
                    value={metricName}
                    onChange={(e) => updateField('metricName', e.target.value)}
                    placeholder="Ej. Tiempo de ciclo, % de errores…"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="cc-cl" className="mb-1 block text-xs font-medium text-content-secondary">
                    Línea central (CL)
                  </label>
                  <input
                    id="cc-cl"
                    type="number"
                    step="0.1"
                    value={centerLine}
                    onChange={(e) => updateLimit('centerLine', e.target.value)}
                    className="input text-right tabular-nums"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cc-ucl" className="mb-1 block text-xs font-medium text-content-secondary">
                      UCL
                    </label>
                    <input
                      id="cc-ucl"
                      type="number"
                      step="0.1"
                      value={upperControlLimit}
                      onChange={(e) => updateLimit('upperControlLimit', e.target.value)}
                      className="input text-right tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="cc-lcl" className="mb-1 block text-xs font-medium text-content-secondary">
                      LCL
                    </label>
                    <input
                      id="cc-lcl"
                      type="number"
                      step="0.1"
                      value={lowerControlLimit}
                      onChange={(e) => updateLimit('lowerControlLimit', e.target.value)}
                      className="input text-right tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visualización */}
            <ControlChartVisualization
              measurements={measurements}
              centerLine={centerLine}
              upperControlLimit={upperControlLimit}
              lowerControlLimit={lowerControlLimit}
              metricName={metricName}
            />

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Media" value={stats.mean} />
              <StatCard label="Desviación estándar" value={stats.stdDev} />
              <StatCard label="Valor máximo" value={stats.max} />
              <StatCard label="Valor mínimo" value={stats.min} />
            </div>

            {/* Análisis automático */}
            <div className="rounded-xl border border-line bg-surface-sunken p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-content">
                <Info size={16} aria-hidden="true" /> Análisis automático
              </h3>
              <ul className="space-y-2 text-sm">
                {stats.mean > centerLine && (
                  <li className="flex items-center gap-2 text-warning-on">
                    <ArrowUp size={14} aria-hidden="true" /> La media está por encima de la línea central.
                  </li>
                )}
                {stats.mean < centerLine && (
                  <li className="flex items-center gap-2 text-warning-on">
                    <ArrowDown size={14} aria-hidden="true" /> La media está por debajo de la línea central.
                  </li>
                )}
                {measurements.some((v) => v > upperControlLimit) && (
                  <li className="flex items-center gap-2 text-danger-on">
                    <AlertTriangle size={14} aria-hidden="true" /> Hay puntos fuera del límite de control superior.
                  </li>
                )}
                {measurements.some((v) => v < lowerControlLimit) && (
                  <li className="flex items-center gap-2 text-danger-on">
                    <AlertTriangle size={14} aria-hidden="true" /> Hay puntos fuera del límite de control inferior.
                  </li>
                )}
                {stats.stdDev < (upperControlLimit - lowerControlLimit) / 6 && (
                  <li className="flex items-center gap-2 text-success-on">
                    <Check size={14} aria-hidden="true" /> El proceso muestra buena estabilidad.
                  </li>
                )}
              </ul>
            </div>

            {/* Tabla de mediciones (vista equivalente accesible del gráfico) */}
            <motion.div
              initial={shouldReduceMotion ? false : 'hidden'}
              animate="visible"
              variants={fadeInUp}
              className="overflow-x-auto rounded-xl border border-line bg-surface"
            >
              <table className="w-full min-w-[420px] text-sm">
                <caption className="sr-only">Mediciones registradas con su valor y estado frente a los límites de control</caption>
                <thead>
                  <tr className="border-b border-line bg-surface-sunken text-left text-xs font-medium uppercase tracking-wide text-content-muted">
                    <th scope="col" className="px-4 py-2.5">Muestra</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Valor</th>
                    <th scope="col" className="px-4 py-2.5">Estado</th>
                    <th scope="col" className="px-2 py-2.5 text-right">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((value, index) => {
                    const outOfLimits = value > upperControlLimit || value < lowerControlLimit;
                    const isEditingRow = editingIndex === index;
                    return (
                      <tr key={index} className="border-b border-line-subtle last:border-0">
                        <td className="px-4 py-2 text-content-secondary">Muestra {index + 1}</td>
                        <td className="px-4 py-2 text-right">
                          {isEditingRow ? (
                            <input
                              type="number"
                              step="0.1"
                              autoFocus
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEditMeasurement()}
                              aria-label={`Valor de la muestra ${index + 1}`}
                              className="input w-24 text-right tabular-nums"
                            />
                          ) : (
                            <span className="tabular-nums text-content">{formatNumber(value, { maximumFractionDigits: 2 })}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {outOfLimits ? (
                            <span className="badge bg-danger-soft text-danger-on">Fuera de control</span>
                          ) : (
                            <span className="badge bg-success-soft text-success-on">En control</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            {isEditingRow ? (
                              <>
                                <button
                                  type="button"
                                  onClick={saveEditMeasurement}
                                  aria-label={`Guardar valor de la muestra ${index + 1}`}
                                  className="rounded-lg p-1.5 text-success-on transition-colors duration-fast hover:bg-success-soft"
                                >
                                  <Check size={15} aria-hidden="true" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditMeasurement(index)}
                                aria-label={`Editar valor de la muestra ${index + 1}`}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
                              >
                                Editar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeMeasurement(index)}
                              aria-label={`Eliminar muestra ${index + 1}`}
                              className="rounded-lg p-1.5 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-line-subtle bg-surface-sunken">
                    <td className="px-4 py-2 text-xs font-medium text-content-secondary">Muestra {measurements.length + 1}</td>
                    <td className="px-4 py-2 text-right" colSpan={3}>
                      <div className="flex items-center justify-end gap-2">
                        <input
                          id="cc-new-value"
                          type="number"
                          step="0.1"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addMeasurement()}
                          placeholder="Nuevo valor"
                          aria-label="Valor de la nueva muestra"
                          className="input w-28 text-right tabular-nums"
                        />
                        <GradientButton
                          variant="outline"
                          size="sm"
                          onClick={addMeasurement}
                          leadingIcon={<Plus size={14} aria-hidden="true" />}
                        >
                          Agregar
                        </GradientButton>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </motion.div>
          </>
        )}
      </div>

      {/* Confirmación: cargar ejemplo con borrador sucio */}
      <Modal
        open={confirmKind === 'example'}
        onClose={() => setConfirmKind(null)}
        title="¿Cargar el ejemplo?"
        description="Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar."
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmKind(null)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="solid" onClick={applyExample}>
              Ver el ejemplo
            </GradientButton>
          </>
        }
      />

      {/* Confirmación: descartar cambios sin guardar */}
      <Modal
        open={confirmKind === 'discard'}
        onClose={() => setConfirmKind(null)}
        title="¿Descartar los cambios sin guardar?"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmKind(null)}>
              Seguir editando
            </GradientButton>
            <GradientButton variant="danger" onClick={confirmDiscard}>
              Descartar
            </GradientButton>
          </>
        }
      />
    </div>
  );
}

/** Máquina de estados de guardado (idéntica a la definida para las 14 herramientas). */
function SaveStatus({ tool }) {
  let icon = <span className="h-2 w-2 rounded-full bg-content-muted" aria-hidden="true" />;
  let text = 'Sin cambios';
  let tone = 'text-content-muted';

  if (tool.error) {
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = 'No se pudo guardar';
    tone = 'text-danger-on';
  } else if (tool.isSaving) {
    icon = <Loader2 size={14} className="animate-spin" aria-hidden="true" />;
    text = 'Guardando cambios…';
    tone = 'text-content-secondary';
  } else if (tool.justSaved) {
    icon = <Check size={14} aria-hidden="true" />;
    text = 'Guardado';
    tone = 'text-success-on';
  } else if (tool.isDirty) {
    icon = <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />;
    text = 'Cambios sin guardar';
    tone = 'text-warning-on';
  } else if (tool.lastSavedAt) {
    icon = <Check size={14} aria-hidden="true" />;
    text = `Guardado ${formatRelative(tool.lastSavedAt)}`;
    tone = 'text-success-on';
  }

  return (
    <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm font-medium ${tone}`}>
      {icon}
      <span className="tabular-nums">{text}</span>
      {tool.error && (
        <button type="button" onClick={() => tool.save()} className="ml-1 underline underline-offset-2 hover:no-underline">
          Reintentar
        </button>
      )}
    </p>
  );
}

/** Tarjeta de estadística simple, cifra en tabular-nums. */
function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="mb-1 text-xs font-medium text-content-muted">{label}</h3>
      <p className="text-xl font-semibold tabular-nums text-content">
        {formatNumber(value, { maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

/**
 * Visualización del gráfico de control: línea central, límites UCL/LCL y
 * puntos de medición, con los puntos fuera de límite resaltados en rojo.
 * El dominio vertical se extiende para siempre incluir CL/UCL/LCL y los
 * valores medidos, aunque se salgan de los límites.
 */
function ControlChartVisualization({ measurements, centerLine, upperControlLimit, lowerControlLimit, metricName }) {
  const width = 1000;
  const height = 360;
  const padding = 30;

  const domain = useMemo(() => {
    const values = [centerLine, upperControlLimit, lowerControlLimit, ...measurements].map(Number);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      min -= 1;
      max += 1;
    }
    const span = max - min;
    return { min: min - span * 0.1, max: max + span * 0.1 };
  }, [measurements, centerLine, upperControlLimit, lowerControlLimit]);

  const toY = useCallback(
    (value) => {
      const range = domain.max - domain.min || 1;
      const normalized = (Number(value) - domain.min) / range;
      return height - padding - normalized * (height - padding * 2);
    },
    [domain]
  );

  const points = useMemo(
    () =>
      measurements.map((value, index) => ({
        x: measurements.length > 1 ? (index / (measurements.length - 1)) * width : width / 2,
        y: toY(value),
        value,
        outOfLimits: value > upperControlLimit || value < lowerControlLimit,
      })),
    [measurements, toY, upperControlLimit, lowerControlLimit]
  );

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-content">
          {metricName || 'Gráfico de control'}
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-xs text-content-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4" style={{ background: 'rgb(var(--jc-brand))' }} aria-hidden="true" /> Línea central
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: 'rgb(var(--jc-danger))' }} aria-hidden="true" /> UCL / LCL
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'rgb(var(--jc-danger))' }} aria-hidden="true" /> Fuera de control
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-64 w-full min-w-[480px] md:h-80"
          role="img"
          aria-label={`Gráfico de control de ${metricName || 'la métrica'}: línea central ${centerLine}, límite superior ${upperControlLimit}, límite inferior ${lowerControlLimit}`}
        >
          {/* Límites y línea central */}
          <line
            x1="0"
            x2={width}
            y1={toY(upperControlLimit)}
            y2={toY(upperControlLimit)}
            style={{ stroke: 'rgb(var(--jc-danger))' }}
            strokeWidth="1.5"
            strokeDasharray="6 5"
          />
          <line
            x1="0"
            x2={width}
            y1={toY(centerLine)}
            y2={toY(centerLine)}
            style={{ stroke: 'rgb(var(--jc-brand))' }}
            strokeWidth="1.5"
          />
          <line
            x1="0"
            x2={width}
            y1={toY(lowerControlLimit)}
            y2={toY(lowerControlLimit)}
            style={{ stroke: 'rgb(var(--jc-danger))' }}
            strokeWidth="1.5"
            strokeDasharray="6 5"
          />

          {/* Línea que conecta los puntos */}
          {points.length > 1 && (
            <polyline
              points={polylinePoints}
              fill="none"
              style={{ stroke: 'rgb(var(--jc-content-muted))' }}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Puntos individuales */}
          {points.map((p, index) => (
            <circle
              key={index}
              cx={p.x}
              cy={p.y}
              r="6"
              style={{ fill: p.outOfLimits ? 'rgb(var(--jc-danger))' : 'rgb(var(--jc-brand))' }}
            />
          ))}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs tabular-nums text-content-muted">
        <span>UCL: {formatNumber(upperControlLimit, { maximumFractionDigits: 2 })}</span>
        <span>CL: {formatNumber(centerLine, { maximumFractionDigits: 2 })}</span>
        <span>LCL: {formatNumber(lowerControlLimit, { maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
