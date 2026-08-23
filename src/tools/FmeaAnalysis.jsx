import { useState, useRef, useEffect } from 'react';
import { AlertTriangle, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatNumber, formatRelative } from '../lib/format';
import { transition, fadeInUp } from '../lib/motion';

/**
 * FMEA (Failure Mode and Effects Analysis)
 *
 * NOTA DE ADOPCIÓN (Ciclo 3): `src/components/tools/ToolToolbar.jsx` (el
 * componente compartido descrito en el brief del Agente 0) no existe todavía
 * en el árbol de trabajo. Para no bloquear la persistencia de esta
 * herramienta se construyó aquí una barra equivalente y autocontenida
 * (mismo contrato visual y de copy que el brief especifica para
 * ToolToolbar). Si el orquestador crea el componente compartido, esta barra
 * debería migrarse a `<ToolToolbar tool={t} />` para no duplicar lógica
 * entre las 14 herramientas.
 */

const TOOL_ID = 'fmea';

// Forma completa del estado vacío, alineada 1:1 a la semilla de
// src/data/projects.js y al ejemplo de src/data/toolsData.js: no hace falta
// adaptExample.
const DEFAULT_DATA = {
  process: '',
  failureModes: [],
};

const SCORE_MIN = 1;
const SCORE_MAX = 10;
// Umbral de atención habitual en FMEA (NPR alto → prioridad de acción).
const RPN_HIGH_THRESHOLD = 150;

const clampScore = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return SCORE_MIN;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(n)));
};

const computeRpn = (severity, occurrence, detection) =>
  clampScore(severity) * clampScore(occurrence) * clampScore(detection);

const makeFailureMode = () => ({
  id: crypto.randomUUID(),
  mode: '',
  effect: '',
  causes: '',
  severity: 5,
  occurrence: 5,
  detection: 5,
  rpn: computeRpn(5, 5, 5),
  actions: '',
});

const inputClass =
  'w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-content placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

const scoreInputClass =
  'w-16 rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-sm tabular-nums text-content focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

/** Estado de guardado: única fuente de verdad es la comparación borrador/persistido. */
function SaveStatus({ tool }) {
  // Fuerza un re-render cada 60s para que "hace 3 minutos" no se congele.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  let icon = <span className="h-2 w-2 rounded-full bg-neutral-400" aria-hidden="true" />;
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
    <p role="status" aria-live="polite" className={`flex items-center gap-2 text-sm ${tone}`}>
      {icon}
      <span>{text}</span>
      {tool.error && (
        <button
          type="button"
          onClick={() => tool.save()}
          className="ml-1 font-medium underline underline-offset-2 hover:no-underline"
        >
          Reintentar
        </button>
      )}
    </p>
  );
}

const FmeaAnalysis = ({ projectId }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA);

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmLoadExample, setConfirmLoadExample] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const snapshotRef = useRef(null);

  if (!t.ready) return null;

  const { data } = t;
  const exampleTitle = t.exampleTitles?.[0];

  const updateFailureMode = (id, changes) => {
    t.setData((prev) => ({
      ...prev,
      failureModes: prev.failureModes.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...changes };
        if ('severity' in changes || 'occurrence' in changes || 'detection' in changes) {
          next.severity = clampScore(next.severity);
          next.occurrence = clampScore(next.occurrence);
          next.detection = clampScore(next.detection);
          next.rpn = computeRpn(next.severity, next.occurrence, next.detection);
        }
        return next;
      }),
    }));
  };

  const addFailureMode = () => {
    t.setData((prev) => ({ ...prev, failureModes: [...prev.failureModes, makeFailureMode()] }));
  };

  const removeFailureMode = (id) => {
    t.setData((prev) => ({ ...prev, failureModes: prev.failureModes.filter((f) => f.id !== id) }));
  };

  const requestViewExample = () => {
    if (t.isDirty) {
      setConfirmLoadExample(true);
      return;
    }
    snapshotRef.current = t.data;
    t.loadExample(0);
    setExampleMode(true);
  };

  const confirmAndLoadExample = () => {
    snapshotRef.current = t.data;
    t.loadExample(0);
    setExampleMode(true);
    setConfirmLoadExample(false);
  };

  const useExampleAsStartingPoint = () => {
    t.save();
    setExampleMode(false);
    snapshotRef.current = null;
  };

  const undoExample = () => {
    if (snapshotRef.current) t.setData(snapshotRef.current);
    setExampleMode(false);
    snapshotRef.current = null;
  };

  const requestCancel = () => {
    if (!t.isDirty) return;
    setConfirmDiscard(true);
  };

  const confirmAndDiscard = () => {
    t.discard();
    setConfirmDiscard(false);
    if (exampleMode) {
      setExampleMode(false);
      snapshotRef.current = null;
    }
  };

  const sortedFailureModes = [...data.failureModes].sort((a, b) => (b.rpn || 0) - (a.rpn || 0));
  const vacio = data.failureModes.length === 0;

  return (
    <div className="p-4 sm:p-6">
      {/* Barra de estado y acciones (equivalente autocontenido de ToolToolbar, ver nota arriba) */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <SaveStatus tool={t} />
        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && !exampleMode && (
            <GradientButton variant="outline" size="sm" onClick={requestViewExample}>
              Ver un ejemplo
            </GradientButton>
          )}
          {t.isDirty && (
            <GradientButton variant="outline" size="sm" onClick={requestCancel}>
              Cancelar
            </GradientButton>
          )}
          <GradientButton
            variant="success"
            size="sm"
            disabled={!t.isDirty || t.isSaving}
            onClick={() => t.save()}
          >
            Guardar
          </GradientButton>
        </div>
      </div>

      {exampleMode && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.enter}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3 ring-1 ring-inset ring-info/20"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-info px-2 py-0.5 text-xs font-medium text-white">Ejemplo</span>
            <span className="font-medium text-content">{exampleTitle}</span>
            <span className="text-content-secondary">
              Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GradientButton variant="outline" size="sm" onClick={undoExample}>
              Deshacer
            </GradientButton>
            <GradientButton variant="success" size="sm" onClick={useExampleAsStartingPoint}>
              Usar como punto de partida
            </GradientButton>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="fmea-process" className="mb-1.5 block text-sm font-medium text-content">
            Proceso analizado
          </label>
          <input
            id="fmea-process"
            type="text"
            value={data.process ?? ''}
            onChange={(e) => t.patch({ process: e.target.value })}
            placeholder="Ej. Atención de Reclamaciones"
            className={inputClass}
          />
        </div>

        {vacio ? (
          <EmptyState
            title="Anticípate al fallo"
            description="Registra un modo de falla y evalúa Severidad, Ocurrencia y Detección para calcular su NPR."
            action={
              <GradientButton leadingIcon={<Plus size={16} />} onClick={addFailureMode}>
                Agregar modo de falla
              </GradientButton>
            }
            secondaryAction={
              t.hasExamples && (
                <GradientButton variant="outline" onClick={requestViewExample}>
                  Ver un ejemplo
                </GradientButton>
              )
            }
          />
        ) : (
          <motion.div
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            variants={fadeInUp}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-content-secondary">
                NPR = Severidad × Ocurrencia × Detección. Prioriza los modos de falla con NPR más alto.
              </p>
              <GradientButton variant="outline" size="sm" leadingIcon={<Plus size={14} />} onClick={addFailureMode}>
                Agregar modo de falla
              </GradientButton>
            </div>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-sunken text-left text-xs font-medium text-content-secondary">
                    <th scope="col" className="px-3 py-2">Modo de falla</th>
                    <th scope="col" className="px-3 py-2">Efecto</th>
                    <th scope="col" className="px-3 py-2">Causas</th>
                    <th scope="col" className="px-2 py-2 text-center">S</th>
                    <th scope="col" className="px-2 py-2 text-center">O</th>
                    <th scope="col" className="px-2 py-2 text-center">D</th>
                    <th scope="col" className="px-2 py-2 text-center">NPR</th>
                    <th scope="col" className="px-3 py-2">Acciones recomendadas</th>
                    <th scope="col" className="px-2 py-2 text-center">
                      <span className="sr-only">Eliminar</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFailureModes.map((f, index) => (
                    <tr
                      key={f.id}
                      className={`border-b border-line-subtle last:border-b-0 ${
                        f.rpn >= RPN_HIGH_THRESHOLD ? 'bg-danger-soft/40' : ''
                      }`}
                    >
                      <td className="px-3 py-2 align-top">
                        <textarea
                          value={f.mode}
                          onChange={(e) => updateFailureMode(f.id, { mode: e.target.value })}
                          placeholder="Ej. Registro incorrecto de información"
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <textarea
                          value={f.effect}
                          onChange={(e) => updateFailureMode(f.id, { effect: e.target.value })}
                          placeholder="Consecuencia para el cliente o el proceso"
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <textarea
                          value={f.causes}
                          onChange={(e) => updateFailureMode(f.id, { causes: e.target.value })}
                          placeholder="Causa raíz probable"
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <label className="sr-only" htmlFor={`severity-${f.id}`}>
                          Severidad, fila {index + 1}
                        </label>
                        <input
                          id={`severity-${f.id}`}
                          type="number"
                          min={SCORE_MIN}
                          max={SCORE_MAX}
                          value={f.severity}
                          onChange={(e) => updateFailureMode(f.id, { severity: e.target.value })}
                          className={scoreInputClass}
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <label className="sr-only" htmlFor={`occurrence-${f.id}`}>
                          Ocurrencia, fila {index + 1}
                        </label>
                        <input
                          id={`occurrence-${f.id}`}
                          type="number"
                          min={SCORE_MIN}
                          max={SCORE_MAX}
                          value={f.occurrence}
                          onChange={(e) => updateFailureMode(f.id, { occurrence: e.target.value })}
                          className={scoreInputClass}
                        />
                      </td>
                      <td className="px-2 py-2 align-top">
                        <label className="sr-only" htmlFor={`detection-${f.id}`}>
                          Detección, fila {index + 1}
                        </label>
                        <input
                          id={`detection-${f.id}`}
                          type="number"
                          min={SCORE_MIN}
                          max={SCORE_MAX}
                          value={f.detection}
                          onChange={(e) => updateFailureMode(f.id, { detection: e.target.value })}
                          className={scoreInputClass}
                        />
                      </td>
                      <td className="px-2 py-2 align-top text-center">
                        <span
                          className={`inline-flex min-w-[2.5rem] justify-center rounded-md px-2 py-1 text-sm font-semibold tabular-nums ${
                            f.rpn >= RPN_HIGH_THRESHOLD
                              ? 'bg-danger-soft text-danger-on'
                              : 'bg-surface-sunken text-content'
                          }`}
                        >
                          {formatNumber(f.rpn)}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <textarea
                          value={f.actions}
                          onChange={(e) => updateFailureMode(f.id, { actions: e.target.value })}
                          placeholder="Acción para mitigar o eliminar la causa"
                          rows={2}
                          className={`${inputClass} resize-none`}
                        />
                      </td>
                      <td className="px-2 py-2 align-top text-center">
                        <button
                          type="button"
                          onClick={() => removeFailureMode(f.id)}
                          aria-label={`Eliminar modo de falla: ${f.mode || 'sin nombre'}`}
                          className="rounded-md p-1.5 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      <Modal
        open={confirmLoadExample}
        onClose={() => setConfirmLoadExample(false)}
        title="¿Cargar el ejemplo?"
        description="Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar."
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmLoadExample(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="success" onClick={confirmAndLoadExample}>
              Ver el ejemplo
            </GradientButton>
          </>
        }
      />

      <Modal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="¿Descartar los cambios sin guardar?"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmDiscard(false)}>
              Seguir editando
            </GradientButton>
            <GradientButton variant="danger" onClick={confirmAndDiscard}>
              Descartar
            </GradientButton>
          </>
        }
      />
    </div>
  );
};

export default FmeaAnalysis;
