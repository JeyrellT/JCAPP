import { useState, useEffect, useRef } from 'react';
import { Truck, FileInput, Activity, ArrowRight, Users, Plus, X, Check, Loader2, AlertTriangle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatRelative } from '../lib/format';
import { fadeInUp } from '../lib/motion';

/**
 * SIPOC (Supplier-Input-Process-Output-Customer).
 *
 * ToolPage ya monta título, breadcrumbs, PhaseBadge/StatusBadge, navegación
 * Anterior/Siguiente, pantalla completa y "Descargar JSON" — este componente
 * solo aporta su propio contenido, sin tarjeta exterior ni encabezado propio.
 */
const TOOL_ID = 'sipoc';

const DEFAULT_DATA = {
  processName: '',
  suppliers: [],
  inputs: [],
  process: [],
  outputs: [],
  customers: [],
};

const COLUMNS = [
  { key: 'suppliers', label: 'Proveedores', icon: Truck },
  { key: 'inputs', label: 'Entradas', icon: FileInput },
  { key: 'process', label: 'Proceso', icon: Activity },
  { key: 'outputs', label: 'Salidas', icon: ArrowRight },
  { key: 'customers', label: 'Clientes', icon: Users },
];

/**
 * Rescate de datos viejos: hasta este ciclo SIPOC escribía en `project.sipocs`
 * (un arreglo de diagramas con pestañas, cada uno con filas
 * `{ suppliers, inputs, process, outputs, customers }`). La forma canónica de
 * `project.tools.sipoc.data` es un único proceso con listas independientes por
 * categoría, así que se toma el primer diagrama con contenido y se aplanan sus
 * filas por columna, descartando celdas vacías.
 */
const legacyFromRoot = (project) => {
  const list = Array.isArray(project?.sipocs) ? project.sipocs : null;
  if (!list || list.length === 0) return null;

  const first = list.find((s) => Array.isArray(s?.data) && s.data.length > 0) || list[0];
  const rows = Array.isArray(first?.data) ? first.data : [];
  const collect = (key) => rows.map((row) => (row?.[key] || '').toString().trim()).filter(Boolean);

  const rescued = {
    processName: first?.title || '',
    suppliers: collect('suppliers'),
    inputs: collect('inputs'),
    process: collect('process'),
    outputs: collect('outputs'),
    customers: collect('customers'),
  };

  const hasContent = rescued.processName || COLUMNS.some(({ key }) => rescued[key].length > 0);
  return hasContent ? rescued : null;
};

/** Estado de guardado en texto, calculado — nunca simulado con setTimeout. */
function SaveStatus({ tool }) {
  // Fuerza un re-render cada 60s para que "hace 3 minutos" no se congele.
  const [, tick] = useState(0);
  useEffect(() => {
    if (!tool.lastSavedAt) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, [tool.lastSavedAt]);

  let icon = <span className="h-1.5 w-1.5 rounded-full bg-content-muted" aria-hidden="true" />;
  let text = 'Sin cambios';
  let className = 'text-content-muted';

  if (tool.error) {
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = 'No se pudo guardar';
    className = 'text-danger-on';
  } else if (tool.isSaving) {
    icon = <Loader2 size={14} className="animate-spin" aria-hidden="true" />;
    text = 'Guardando cambios…';
    className = 'text-content-secondary';
  } else if (tool.justSaved) {
    icon = <Check size={14} aria-hidden="true" />;
    text = 'Guardado';
    className = 'text-success-on';
  } else if (tool.isDirty) {
    icon = <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />;
    text = 'Cambios sin guardar';
    className = 'text-warning-on';
  } else if (tool.lastSavedAt) {
    icon = <Check size={14} aria-hidden="true" />;
    text = `Guardado ${formatRelative(tool.lastSavedAt)}`;
    className = 'text-success-on';
  }

  return (
    <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm ${className}`}>
      {icon}
      <span className="tabular-nums">{text}</span>
      {tool.error && (
        <button type="button" onClick={() => tool.save()} className="ml-1 font-medium underline underline-offset-2">
          Reintentar
        </button>
      )}
    </p>
  );
}

const SipocViewer = ({ projectId }) => {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, { legacy: legacyFromRoot });
  const shouldReduceMotion = useReducedMotion();

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmLoadExample, setConfirmLoadExample] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const snapshotRef = useRef(null);

  if (!t.ready) return null;

  const requestExample = () => {
    if (t.isDirty) {
      setConfirmLoadExample(true);
    } else {
      applyExample();
    }
  };

  const applyExample = () => {
    snapshotRef.current = t.data;
    t.loadExample(0);
    setExampleMode(true);
    setConfirmLoadExample(false);
  };

  const acceptExample = () => {
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
    if (t.isDirty) setConfirmDiscard(true);
  };

  const confirmDiscardChanges = () => {
    t.discard();
    setConfirmDiscard(false);
    setExampleMode(false);
    snapshotRef.current = null;
  };

  const addItem = (key) => {
    t.setData((prev) => ({ ...prev, [key]: [...prev[key], ''] }));
  };
  const updateItem = (key, index, value) => {
    t.setData((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  };
  const removeItem = (key, index) => {
    t.setData((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const isEmpty = !t.data.processName && COLUMNS.every(({ key }) => (t.data[key] || []).length === 0);
  const maxRows = Math.max(0, ...COLUMNS.map(({ key }) => (t.data[key] || []).length));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Barra de guardado y acciones */}
      <div className="sticky top-0 z-10 -mx-4 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <SaveStatus tool={t} />
        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && (
            <GradientButton variant="outline" size="sm" onClick={requestExample}>
              Ver un ejemplo
            </GradientButton>
          )}
          {t.isDirty && (
            <GradientButton variant="ghost" size="sm" onClick={requestCancel}>
              Cancelar
            </GradientButton>
          )}
          <GradientButton variant="success" size="sm" disabled={!t.isDirty || t.isSaving} onClick={() => t.save()}>
            Guardar
          </GradientButton>
        </div>
      </div>

      {exampleMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info bg-info-soft px-4 py-3 ring-1 ring-inset ring-info/30">
          <div className="flex items-center gap-2 text-sm text-info-on">
            <span className="badge bg-info text-white">Ejemplo</span>
            <span>Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.</span>
          </div>
          <div className="flex items-center gap-2">
            <GradientButton variant="outline" size="sm" onClick={undoExample}>
              Deshacer
            </GradientButton>
            <GradientButton variant="success" size="sm" onClick={acceptExample}>
              Usar como punto de partida
            </GradientButton>
          </div>
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          title="Antes de mejorar un proceso hay que verlo entero"
          description="Nombra el proceso y mapea Proveedores, Entradas, Proceso, Salidas y Clientes."
          action={
            <GradientButton onClick={() => t.patch({ processName: t.data.processName || 'Nuevo proceso' })}>
              Nombrar el proceso
            </GradientButton>
          }
          secondaryAction={
            t.hasExamples ? (
              <GradientButton variant="outline" onClick={requestExample}>
                Ver un ejemplo
              </GradientButton>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="visible"
          variants={fadeInUp}
          className="space-y-6"
        >
          <div>
            <label htmlFor="sipoc-process-name" className="mb-1 block text-sm font-medium text-content-secondary">
              Nombre del proceso
            </label>
            <input
              id="sipoc-process-name"
              value={t.data.processName ?? ''}
              onChange={(e) => t.patch({ processName: e.target.value })}
              placeholder="Ej. Gestión de Cobranza"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-content"
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="min-w-full divide-y divide-line">
              <thead>
                <tr>
                  {COLUMNS.map(({ key, label, icon: Icon }) => (
                    <th
                      key={key}
                      scope="col"
                      className="bg-surface-sunken p-3 text-left text-xs font-semibold uppercase tracking-wide text-content-secondary"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={16} className="text-content-muted" aria-hidden="true" />
                        <span>{label}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle">
                {maxRows === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="p-4 text-center text-sm text-content-muted">
                      Agrega el primer elemento en cualquier columna para empezar la fila.
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: maxRows }).map((_, rowIndex) => (
                    <tr key={rowIndex}>
                      {COLUMNS.map(({ key, label }) => {
                        const value = (t.data[key] || [])[rowIndex];
                        if (value === undefined) return <td key={key} className="p-3 align-top" />;
                        return (
                          <td key={key} className="p-3 align-top">
                            <div className="flex items-start gap-1">
                              <textarea
                                value={value}
                                onChange={(e) => updateItem(key, rowIndex, e.target.value)}
                                rows={2}
                                className="w-full resize-none rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content"
                                aria-label={`${label} ${rowIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeItem(key, rowIndex)}
                                className="mt-1 rounded p-1 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                                aria-label={`Eliminar ${label.toLowerCase()} ${rowIndex + 1}`}
                              >
                                <X size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  {COLUMNS.map(({ key, label }) => (
                    <td key={key} className="border-t border-line p-3">
                      <button
                        type="button"
                        onClick={() => addItem(key)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                      >
                        <Plus size={14} aria-hidden="true" /> Agregar {label.toLowerCase()}
                      </button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}

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
            <GradientButton variant="success" onClick={applyExample}>
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
            <GradientButton variant="danger" onClick={confirmDiscardChanges}>
              Descartar
            </GradientButton>
          </>
        }
      />
    </div>
  );
};

export default SipocViewer;
