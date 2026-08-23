import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Trash2,
  MessageSquare,
  Users,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatRelative, formatPercent } from '../lib/format';
import { fadeInUp } from '../lib/motion';

const TOOL_ID = 'voc';

// Forma canónica: alineada a `project.tools.voc.data` en src/data/projects.js
// (cada proyecto de ejemplo ya siembra `customers: [{ type, comment, importance }]`).
const DEFAULT_DATA = {
  customers: [],
};

const TYPE_OPTIONS = ['Interno', 'Externo'];
const IMPORTANCE_OPTIONS = [1, 2, 3, 4, 5];

const emptyVoice = () => ({ type: 'Externo', comment: '', importance: 3 });

// El ejemplo de toolsData.js guarda las voces bajo `keyInsights`, no `customers`.
const adaptVocExample = (example, defaultData) => ({
  ...defaultData,
  customers: Array.isArray(example?.keyInsights) ? example.keyInsights : defaultData.customers,
});

// Rescate de la clave legacy `project.voc` (raíz del proyecto). Si ya tiene
// forma canónica (`customers`) se usa tal cual; si es el modelo viejo de
// comentarios/segmentos/necesidades se convierte a la forma canónica en la
// medida de lo posible en vez de descartarlo.
const legacyVoc = (project) => {
  const legacy = project?.voc;
  if (!legacy || typeof legacy !== 'object') return null;

  if (Array.isArray(legacy.customers) && legacy.customers.length > 0) {
    return { customers: legacy.customers };
  }

  if (Array.isArray(legacy.customerVoices) && legacy.customerVoices.length > 0) {
    const needsById = Object.fromEntries((legacy.needs || []).map((need) => [need.id, need]));
    const PRIORITY_TO_IMPORTANCE = { Alta: 5, Media: 3, Baja: 1 };
    const customers = legacy.customerVoices
      .filter((voice) => voice.text)
      .map((voice) => ({
        type: 'Externo',
        comment: voice.text,
        importance: PRIORITY_TO_IMPORTANCE[needsById[voice.need]?.priority] || 3,
      }));
    return customers.length > 0 ? { customers } : null;
  }

  return null;
};

/** Máquina de estados de guardado (copy y tokens fijados por el brief del ciclo). */
function SaveStatus({ isDirty, isSaving, justSaved, lastSavedAt, error, onRetry }) {
  // Fuerza un re-render cada 60s para que "hace 3 minutos" no se congele.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  let icon = <span className="h-2 w-2 rounded-full bg-content-muted" aria-hidden="true" />;
  let text = 'Sin cambios';
  let tone = 'text-content-muted';

  if (error) {
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = 'No se pudo guardar';
    tone = 'text-danger-on';
  } else if (isSaving) {
    icon = <Loader2 size={14} className="animate-spin" aria-hidden="true" />;
    text = 'Guardando cambios…';
    tone = 'text-content-secondary';
  } else if (justSaved) {
    icon = <Check size={14} aria-hidden="true" />;
    text = 'Guardado';
    tone = 'text-success-on';
  } else if (isDirty) {
    icon = <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />;
    text = 'Cambios sin guardar';
    tone = 'text-warning-on';
  } else if (lastSavedAt) {
    icon = <Check size={14} aria-hidden="true" />;
    text = `Guardado ${formatRelative(lastSavedAt)}`;
    tone = 'text-success-on';
  }

  return (
    <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm ${tone}`}>
      {icon}
      <span className="tabular-nums">{text}</span>
      {error && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-1 font-medium underline decoration-dotted underline-offset-2 hover:text-content"
        >
          Reintentar
        </button>
      )}
    </p>
  );
}

/**
 * Voice of Customer (VOC).
 *
 * @param {Object} props
 * @param {string} props.projectId
 */
const VocVisualizer = ({ projectId }) => {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, {
    adaptExample: adaptVocExample,
    legacy: legacyVoc,
  });
  const shouldReduceMotion = useReducedMotion();

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmExampleOpen, setConfirmExampleOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const snapshotRef = useRef(null);

  if (!t.ready) return null;

  const customers = t.data.customers || [];
  const exampleTitle = t.exampleTitles?.[0] || 'Ejemplo';

  const startExample = () => {
    snapshotRef.current = t.data;
    t.loadExample(0);
    setExampleMode(true);
  };

  const handleViewExample = () => {
    if (t.isDirty) {
      setConfirmExampleOpen(true);
    } else {
      startExample();
    }
  };

  const handleAdoptExample = () => {
    t.save();
    setExampleMode(false);
  };

  const handleDiscardExample = () => {
    t.setData(snapshotRef.current ?? DEFAULT_DATA);
    setExampleMode(false);
  };

  const handleCancel = () => {
    if (t.isDirty) {
      setConfirmDiscardOpen(true);
    }
  };

  const addCustomer = () => {
    t.setData((prev) => ({ ...prev, customers: [...(prev.customers || []), emptyVoice()] }));
  };

  const updateCustomerAt = (index, patch) => {
    t.setData((prev) => ({
      ...prev,
      customers: prev.customers.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  };

  const deleteCustomerAt = (index) => {
    t.setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((_, i) => i !== index),
    }));
  };

  // Análisis derivado: top comentarios por importancia y distribución por tipo.
  const sortedByImportance = [...customers].sort((a, b) => (b.importance || 0) - (a.importance || 0));
  const topVoices = sortedByImportance.slice(0, 5);
  const maxImportance = Math.max(...customers.map((c) => c.importance || 0), 1);
  const typeCounts = TYPE_OPTIONS.map((type) => ({
    type,
    count: customers.filter((c) => c.type === type).length,
  }));

  const importanceTone = (importance) => {
    if (importance >= 5) return 'bg-danger-soft text-danger-on';
    if (importance >= 3) return 'bg-warning-soft text-warning-on';
    return 'bg-success-soft text-success-on';
  };

  const typeTone = (type) => (type === 'Interno' ? 'bg-info-soft text-info-on' : 'bg-brand/10 text-brand');

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Barra de estado + acciones. Contenedor local (no hay ToolToolbar compartido aún). */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle pb-4">
        <SaveStatus
          isDirty={t.isDirty}
          isSaving={t.isSaving}
          justSaved={t.justSaved}
          lastSavedAt={t.lastSavedAt}
          error={t.error}
          onRetry={() => t.save()}
        />

        <div className="flex flex-wrap items-center gap-2">
          {exampleMode ? (
            <>
              <GradientButton variant="outline" size="sm" onClick={handleDiscardExample}>
                Deshacer
              </GradientButton>
              <GradientButton variant="success" size="sm" onClick={handleAdoptExample}>
                Usar como punto de partida
              </GradientButton>
            </>
          ) : (
            <>
              {t.hasExamples && (
                <GradientButton
                  variant="outline"
                  size="sm"
                  leadingIcon={<Sparkles size={14} aria-hidden="true" />}
                  onClick={handleViewExample}
                >
                  Ver un ejemplo
                </GradientButton>
              )}
              {t.isDirty && (
                <GradientButton variant="ghost" size="sm" onClick={handleCancel}>
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
            </>
          )}
        </div>
      </div>

      {/* Banner de modo ejemplo */}
      <AnimatePresence>
        {exampleMode && (
          <motion.div
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            exit="hidden"
            variants={fadeInUp}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 ring-1 ring-brand/20"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
              Ejemplo
            </span>
            <span className="text-sm font-medium text-content">{exampleTitle}</span>
            <span className="text-sm text-content-secondary">
              Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {customers.length === 0 ? (
        <EmptyState
          title="El cliente ya te está diciendo qué mejorar"
          description="Captura sus comentarios y tradúcelos en necesidades medibles."
          action={
            <GradientButton leadingIcon={<Plus size={16} aria-hidden="true" />} onClick={addCustomer}>
              Registrar primera voz
            </GradientButton>
          }
          secondaryAction={
            t.hasExamples && !exampleMode ? (
              <GradientButton variant="outline" onClick={handleViewExample}>
                Ver un ejemplo
              </GradientButton>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                <MessageSquare size={18} aria-hidden="true" />
                Voces del cliente
              </h3>
              <GradientButton
                variant="outline"
                size="sm"
                leadingIcon={<Plus size={14} aria-hidden="true" />}
                onClick={addCustomer}
              >
                Añadir comentario
              </GradientButton>
            </div>

            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-surface-sunken">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-content-secondary">
                      Comentario
                    </th>
                    <th scope="col" className="w-40 px-3 py-2 text-left font-medium text-content-secondary">
                      Tipo
                    </th>
                    <th scope="col" className="w-36 px-3 py-2 text-left font-medium text-content-secondary">
                      Importancia
                    </th>
                    <th scope="col" className="w-12 px-3 py-2 text-right font-medium text-content-secondary">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {customers.map((voice, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 align-top">
                        <textarea
                          value={voice.comment}
                          onChange={(e) => updateCustomerAt(index, { comment: e.target.value })}
                          rows={2}
                          placeholder="¿Qué dijo el cliente, textualmente?"
                          className="w-full rounded-md border border-line bg-surface px-2 py-1 text-content placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <select
                          value={voice.type}
                          onChange={(e) => updateCustomerAt(index, { type: e.target.value })}
                          className="w-full rounded-md border border-line bg-surface px-2 py-1 text-content focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        >
                          {TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <select
                          value={voice.importance}
                          onChange={(e) => updateCustomerAt(index, { importance: Number(e.target.value) })}
                          className="w-full rounded-md border border-line bg-surface px-2 py-1 text-content tabular-nums focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        >
                          {IMPORTANCE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right align-top">
                        <button
                          type="button"
                          onClick={() => deleteCustomerAt(index)}
                          className="rounded p-1.5 text-content-muted hover:bg-danger-soft hover:text-danger-on"
                          aria-label="Eliminar comentario"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-content">Análisis</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-4">
                <h4 className="mb-3 text-sm font-medium text-content-secondary">Comentarios de mayor importancia</h4>
                {topVoices.length === 0 ? (
                  <p className="text-sm text-content-muted">Aún no hay suficientes datos.</p>
                ) : (
                  <ul className="space-y-2">
                    {topVoices.map((voice, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${((voice.importance || 0) / maxImportance) * 100}%` }}
                          />
                        </div>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums ${importanceTone(voice.importance)}`}
                        >
                          {voice.importance}
                        </span>
                        <span className="w-1/2 truncate text-sm text-content" title={voice.comment}>
                          {voice.comment || '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg border border-line bg-surface p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-content-secondary">
                  <Users size={16} aria-hidden="true" />
                  Distribución por tipo
                </h4>
                <table className="w-full text-sm">
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Tipo</th>
                      <th scope="col">Cantidad</th>
                      <th scope="col">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeCounts.map(({ type, count }) => (
                      <tr key={type}>
                        <td className="py-1.5">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeTone(type)}`}>{type}</span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-content">{count}</td>
                        <td className="py-1.5 pl-2 text-right tabular-nums text-content-secondary">
                          {formatPercent(customers.length > 0 ? Math.round((count / customers.length) * 100) : 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      <Modal
        open={confirmExampleOpen}
        onClose={() => setConfirmExampleOpen(false)}
        title="¿Cargar el ejemplo?"
        description="Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar."
        size="sm"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmExampleOpen(false)}>
              Cancelar
            </GradientButton>
            <GradientButton
              variant="solid"
              onClick={() => {
                startExample();
                setConfirmExampleOpen(false);
              }}
            >
              Ver el ejemplo
            </GradientButton>
          </>
        }
      />

      <Modal
        open={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        title="¿Descartar los cambios sin guardar?"
        size="sm"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmDiscardOpen(false)}>
              Seguir editando
            </GradientButton>
            <GradientButton
              variant="danger"
              onClick={() => {
                t.discard();
                setConfirmDiscardOpen(false);
              }}
            >
              Descartar
            </GradientButton>
          </>
        }
      />
    </div>
  );
};

export default VocVisualizer;
