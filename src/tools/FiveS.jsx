import { useMemo, useState, useRef } from 'react';
import { Plus, Trash2, Check, Loader2, AlertTriangle, Eye, Undo2 } from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatNumber, formatPercent, formatRelative } from '../lib/format';
import { transition } from '../lib/motion';

const TOOL_ID = '5s';

// Las 5S en su nombre japonés + traducción. `key` coincide con las llaves de
// currentState/targetState tanto en la semilla (projects.js: siempre null
// para '5s', sin excepción) como en el ejemplo de src/data/toolsData.js —
// por eso no hace falta `adaptExample`: la forma del ejemplo ES la forma
// canónica de esta herramienta.
const STEP_DEFS = [
  { key: 'sort', label: 'Seiri', translation: 'Clasificar' },
  { key: 'setInOrder', label: 'Seiton', translation: 'Ordenar' },
  { key: 'shine', label: 'Seiso', translation: 'Limpiar' },
  { key: 'standardize', label: 'Seiketsu', translation: 'Estandarizar' },
  { key: 'sustain', label: 'Shitsuke', translation: 'Sostener' },
];

const SCORES = [0, 1, 2, 3, 4, 5];

// Forma completa del estado vacío. `projects.js` siembra `data: null` para
// '5s' en los 4 proyectos de ejemplo (no hay legado que rescatar), así que
// esta es también la forma canónica que queda escrita en project.tools['5s'].data.
const DEFAULT_DATA = {
  areas: [],
  currentState: { sort: 0, setInOrder: 0, shine: 0, standardize: 0, sustain: 0 },
  targetState: { sort: 0, setInOrder: 0, shine: 0, standardize: 0, sustain: 0 },
  improvements: [],
};

export default function FiveS({ projectId }) {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA);
  const shouldReduceMotion = useReducedMotion();

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmKind, setConfirmKind] = useState(null); // 'example' | 'discard' | null
  const exampleSnapshotRef = useRef(null);

  const { avgCurrent, avgTarget } = useMemo(() => {
    const cs = t.data.currentState || {};
    const ts = t.data.targetState || {};
    const sum = (obj) => STEP_DEFS.reduce((acc, s) => acc + (Number(obj[s.key]) || 0), 0);
    return {
      avgCurrent: sum(cs) / STEP_DEFS.length,
      avgTarget: sum(ts) / STEP_DEFS.length,
    };
  }, [t.data.currentState, t.data.targetState]);

  if (!t.ready) return null;

  const vacio = t.data.areas.length === 0;

  // --- Áreas evaluadas -----------------------------------------------------
  const addArea = () => {
    t.setData((prev) => ({ ...prev, areas: [...prev.areas, ''] }));
  };
  const updateArea = (index, value) => {
    t.setData((prev) => ({ ...prev, areas: prev.areas.map((a, i) => (i === index ? value : a)) }));
  };
  const removeArea = (index) => {
    t.setData((prev) => ({ ...prev, areas: prev.areas.filter((_, i) => i !== index) }));
  };

  // --- Puntajes por S --------------------------------------------------------
  const updateScore = (kind, key, rawValue) => {
    const value = Math.max(0, Math.min(5, Number(rawValue) || 0));
    t.setData((prev) => ({ ...prev, [kind]: { ...prev[kind], [key]: value } }));
  };

  // --- Plan de mejora --------------------------------------------------------
  const addImprovement = () => {
    t.setData((prev) => ({ ...prev, improvements: [...prev.improvements, ''] }));
  };
  const updateImprovement = (index, value) => {
    t.setData((prev) => ({
      ...prev,
      improvements: prev.improvements.map((imp, i) => (i === index ? value : imp)),
    }));
  };
  const removeImprovement = (index) => {
    t.setData((prev) => ({ ...prev, improvements: prev.improvements.filter((_, i) => i !== index) }));
  };

  // --- Modo ejemplo ------------------------------------------------------
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

  // --- Cancelar / descartar cambios --------------------------------------
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
              <GradientButton variant="outline" size="sm" onClick={discardExample} leadingIcon={<Undo2 size={14} aria-hidden="true" />}>
                Deshacer
              </GradientButton>
              <GradientButton variant="solid" size="sm" onClick={adoptExample}>
                Usar como punto de partida
              </GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={exampleMode ? 'space-y-6 rounded-xl ring-1 ring-info/30 p-1' : 'space-y-6'}>
        {vacio ? (
          <EmptyState
            title="Un lugar para cada cosa"
            description="Evalúa tu área paso a paso: Clasificar, Ordenar, Limpiar, Estandarizar, Sostener."
            action={
              <GradientButton onClick={addArea} leadingIcon={<Plus size={16} aria-hidden="true" />}>
                Iniciar evaluación
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
            {/* Resumen */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-content-muted">Áreas evaluadas</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-content">{formatNumber(t.data.areas.length)}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-content-muted">Puntaje actual promedio</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-content">{formatPercent((avgCurrent / 5) * 100, 0)}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-content-muted">Meta promedio</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-content">{formatPercent((avgTarget / 5) * 100, 0)}</p>
              </div>
            </div>

            {/* Áreas evaluadas */}
            <section className="rounded-xl border border-line bg-surface p-4 sm:p-6">
              <h2 className="mb-3 text-sm font-semibold text-content">Áreas evaluadas</h2>
              <div className="space-y-2">
                {t.data.areas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => updateArea(index, e.target.value)}
                      placeholder={`Área ${index + 1}`}
                      aria-label={`Área evaluada ${index + 1}`}
                      className="input"
                    />
                    <button
                      type="button"
                      onClick={() => removeArea(index)}
                      aria-label={`Eliminar área ${area || index + 1}`}
                      className="rounded-lg p-1.5 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              <GradientButton
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={addArea}
                leadingIcon={<Plus size={14} aria-hidden="true" />}
              >
                Agregar área
              </GradientButton>
            </section>

            {/* Evaluación por S: puntaje actual, meta y brecha. Tabla accesible
                que sirve a la vez de vista de datos y de control de edición —
                la barra de progreso es decorativa (aria-hidden) porque el
                puntaje ya está expuesto como texto en la celda contigua. */}
            <section className="overflow-x-auto rounded-xl border border-line bg-surface">
              <table className="w-full min-w-[560px] text-sm">
                <caption className="sr-only">Evaluación 5S por dimensión: puntaje actual, meta y brecha</caption>
                <thead>
                  <tr className="border-b border-line bg-surface-sunken text-left text-xs font-medium uppercase tracking-wide text-content-muted">
                    <th scope="col" className="px-4 py-2.5">Dimensión</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Puntaje actual</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Meta</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Brecha</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {STEP_DEFS.map((step) => {
                    const current = t.data.currentState?.[step.key] ?? 0;
                    const target = t.data.targetState?.[step.key] ?? 0;
                    const gap = target - current;
                    const progressPct = (current / 5) * 100;
                    return (
                      <tr key={step.key} className="border-b border-line-subtle last:border-0">
                        <th scope="row" className="whitespace-nowrap px-4 py-2.5 text-left font-medium text-content">
                          {step.label} <span className="font-normal text-content-muted">({step.translation})</span>
                        </th>
                        <td className="px-4 py-2.5 text-right">
                          <select
                            value={current}
                            onChange={(e) => updateScore('currentState', step.key, e.target.value)}
                            aria-label={`Puntaje actual de ${step.label} (${step.translation})`}
                            className="input w-16 text-right tabular-nums"
                          >
                            {SCORES.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <select
                            value={target}
                            onChange={(e) => updateScore('targetState', step.key, e.target.value)}
                            aria-label={`Meta de ${step.label} (${step.translation})`}
                            className="input w-16 text-right tabular-nums"
                          >
                            {SCORES.map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {gap > 0 ? (
                            <span className="text-warning-on">+{gap}</span>
                          ) : (
                            <span className="text-success-on">Alcanzada</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="ml-auto h-2 w-24 overflow-hidden rounded-full bg-surface-sunken" aria-hidden="true">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${progressPct}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            {/* Plan de mejora */}
            <section className="rounded-xl border border-line bg-surface p-4 sm:p-6">
              <h2 className="mb-3 text-sm font-semibold text-content">Plan de mejora</h2>
              {t.data.improvements.length === 0 ? (
                <p className="text-sm text-content-muted">Aún no hay acciones de mejora registradas.</p>
              ) : (
                <ul className="space-y-2">
                  {t.data.improvements.map((imp, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <input
                        type="text"
                        value={imp}
                        onChange={(e) => updateImprovement(index, e.target.value)}
                        placeholder="Describe la acción de mejora"
                        aria-label={`Acción de mejora ${index + 1}`}
                        className="input"
                      />
                      <button
                        type="button"
                        onClick={() => removeImprovement(index)}
                        aria-label={`Eliminar acción de mejora ${index + 1}`}
                        className="mt-1 rounded-lg p-1.5 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <GradientButton
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={addImprovement}
                leadingIcon={<Plus size={14} aria-hidden="true" />}
              >
                Agregar acción de mejora
              </GradientButton>
            </section>
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

/** Máquina de estados de guardado (idéntica en las 14 herramientas). */
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
