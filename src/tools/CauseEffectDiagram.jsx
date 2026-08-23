import { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Move,
  Check,
  X,
  Lightbulb,
  GitBranch,
  Info,
  Flag,
  Eye,
  Undo2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder, useReducedMotion } from 'framer-motion';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatRelative } from '../lib/format';
import { transition, fadeInUp } from '../lib/motion';

const TOOL_ID = 'cause-effect-diagram';

// Forma completa del estado vacío, alineada a la semilla de src/data/projects.js:
// categories es un array de { name, causes: [string, ...] } — las causas son
// texto plano, no objetos con id (así se guarda hoy en projects.js y en el
// ejemplo de toolsData.js, así que el adaptador por defecto del hook encaja
// tal cual, sin necesitar `adaptExample`).
const DEFAULT_DATA = {
  problem: '',
  categories: [
    { name: 'Maquinaria', causes: [] },
    { name: 'Materiales', causes: [] },
    { name: 'Métodos', causes: [] },
    { name: 'Mano de Obra', causes: [] },
    { name: 'Medio Ambiente', causes: [] },
    { name: 'Medición', causes: [] },
  ],
};

// Rescate legacy: antes de este ciclo, el guardado escribía en la raíz del
// proyecto (`project.causeEffectDiagram`) en vez de la ruta canónica
// `project.tools['cause-effect-diagram'].data`. Sin esto, un proyecto con
// trabajo legacy abriría la herramienta en blanco.
const legacy = (project) => project?.causeEffectDiagram || null;

export default function CauseEffectDiagram({ projectId }) {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, { legacy });
  const shouldReduceMotion = useReducedMotion();

  const [editingItem, setEditingItem] = useState(null); // { categoryIndex, causeIndex, isNew }
  const [newItemText, setNewItemText] = useState('');

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmKind, setConfirmKind] = useState(null); // 'example' | 'discard' | null
  const exampleSnapshotRef = useRef(null);
  // El CTA del estado vacío no escribe un dato falso solo para "desbloquear"
  // el formulario: revela el editor y deja que el usuario escriba el efecto.
  const [showEditor, setShowEditor] = useState(false);

  if (!t.ready) return null;

  const hasContent = Boolean(t.data.problem.trim()) || t.data.categories.some((c) => c.causes.length > 0);
  const isEmpty = !hasContent && !showEditor;

  // --- Edición del problema y las categorías ------------------------------
  const updateProblem = (value) => t.patch({ problem: value });

  const updateCategoryName = (categoryIndex, value) => {
    t.setData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, idx) => (idx === categoryIndex ? { ...cat, name: value } : cat)),
    }));
  };

  // --- Edición de causas ---------------------------------------------------
  const addCause = (categoryIndex) => {
    setEditingItem({ categoryIndex, causeIndex: null, isNew: true });
    setNewItemText('');
  };

  const editCause = (categoryIndex, causeIndex, text) => {
    setEditingItem({ categoryIndex, causeIndex, isNew: false });
    setNewItemText(text);
  };

  const cancelCauseEdit = () => {
    setEditingItem(null);
    setNewItemText('');
  };

  const saveCause = () => {
    if (!editingItem || !newItemText.trim()) {
      setEditingItem(null);
      return;
    }
    const { categoryIndex, causeIndex, isNew } = editingItem;
    t.setData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, idx) => {
        if (idx !== categoryIndex) return cat;
        if (isNew) {
          return { ...cat, causes: [...cat.causes, newItemText.trim()] };
        }
        return { ...cat, causes: cat.causes.map((c, ci) => (ci === causeIndex ? newItemText.trim() : c)) };
      }),
    }));
    setEditingItem(null);
    setNewItemText('');
  };

  const deleteCause = (categoryIndex, causeIndex) => {
    t.setData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, idx) =>
        idx !== categoryIndex ? cat : { ...cat, causes: cat.causes.filter((_, ci) => ci !== causeIndex) }
      ),
    }));
  };

  const reorderCauses = (categoryIndex, order) => {
    t.setData((prev) => ({
      ...prev,
      categories: prev.categories.map((cat, idx) =>
        idx !== categoryIndex ? cat : { ...cat, causes: order.map((i) => cat.causes[i]) }
      ),
    }));
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

      <div className={exampleMode ? 'space-y-6 rounded-xl p-1 ring-1 ring-info/30' : 'space-y-6'}>
        {isEmpty ? (
          <EmptyState
            title="Toda causa tiene una raíz"
            description="Define el efecto que quieres explicar y despliega las espinas: Personal, Métodos, Máquinas, Materiales…"
            action={
              <GradientButton onClick={() => setShowEditor(true)} leadingIcon={<Plus size={16} aria-hidden="true" />}>
                Definir el efecto
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
            {/* Problema central */}
            <motion.div
              initial={shouldReduceMotion ? false : 'hidden'}
              animate="visible"
              variants={fadeInUp}
              className="rounded-xl border border-line bg-surface p-4 sm:p-6"
            >
              <label htmlFor="cause-effect-problem" className="mb-1.5 block text-xs font-medium text-content-secondary">
                Problema central (el &ldquo;efecto&rdquo; del diagrama)
              </label>
              <input
                id="cause-effect-problem"
                type="text"
                value={t.data.problem}
                onChange={(e) => updateProblem(e.target.value)}
                placeholder="Ej. Ciclo de cobranza extendido"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-lg font-semibold text-content placeholder:font-normal placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </motion.div>

            {/* Categorías y causas */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {t.data.categories.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transition.enter, delay: shouldReduceMotion ? 0 : categoryIndex * 0.03 }}
                  className="flex flex-col rounded-xl border border-line bg-surface p-4"
                >
                  <div className="mb-3 flex items-center gap-2 border-b border-line-subtle pb-2">
                    <label htmlFor={`cause-effect-cat-${categoryIndex}`} className="sr-only">
                      Nombre de la categoría {categoryIndex + 1}
                    </label>
                    <input
                      id={`cause-effect-cat-${categoryIndex}`}
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                      placeholder={`Categoría ${categoryIndex + 1}`}
                      className="w-full truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-semibold text-brand placeholder:text-content-muted hover:border-line focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                    <span className="tabular-nums shrink-0 rounded-full bg-surface-sunken px-1.5 py-0.5 text-2xs font-medium text-content-muted">
                      {category.causes.length}
                    </span>
                  </div>

                  <Reorder.Group
                    axis="y"
                    values={category.causes.map((_, i) => i)}
                    onReorder={(order) => reorderCauses(categoryIndex, order)}
                    className="flex-1 space-y-2"
                  >
                    {category.causes.map((cause, causeIndex) => (
                      <Reorder.Item key={causeIndex} value={causeIndex}>
                        <div className="group flex items-center gap-2 rounded-lg border-l-4 border-brand bg-surface-sunken p-2.5 shadow-xs">
                          <Move size={13} className="shrink-0 cursor-move text-content-muted" aria-hidden="true" />
                          <span className="flex-1 text-sm text-content">{cause}</span>
                          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-within:opacity-100">
                            <button
                              type="button"
                              onClick={() => editCause(categoryIndex, causeIndex, cause)}
                              aria-label={`Editar causa: ${cause}`}
                              className="rounded-md p-1 text-content-muted transition-colors duration-fast hover:bg-brand/10 hover:text-brand"
                            >
                              <Pencil size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCause(categoryIndex, causeIndex)}
                              aria-label={`Eliminar causa: ${cause}`}
                              className="rounded-md p-1 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>

                  {/* Formulario para añadir/editar causa */}
                  {editingItem && editingItem.categoryIndex === categoryIndex ? (
                    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-line bg-surface-sunken p-2.5">
                      <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCause();
                          if (e.key === 'Escape') cancelCauseEdit();
                        }}
                        placeholder="Escribir causa…"
                        aria-label="Texto de la causa"
                        className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-content focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring/30"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <GradientButton variant="ghost" size="sm" onClick={cancelCauseEdit} leadingIcon={<X size={13} aria-hidden="true" />}>
                          Cancelar
                        </GradientButton>
                        <GradientButton variant="success" size="sm" onClick={saveCause} leadingIcon={<Check size={13} aria-hidden="true" />}>
                          Guardar
                        </GradientButton>
                      </div>
                    </div>
                  ) : (
                    <GradientButton
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => addCause(categoryIndex)}
                      leadingIcon={<Plus size={14} aria-hidden="true" />}
                      className="mt-3"
                    >
                      Añadir causa
                    </GradientButton>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}

        {/* Cómo utilizar el diagrama */}
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="visible"
          variants={fadeInUp}
          className="rounded-xl border border-line bg-surface p-4 sm:p-6"
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
            <Info size={16} className="text-brand" aria-hidden="true" /> Cómo utilizar el diagrama
          </h3>
          <div className="grid grid-cols-1 gap-4 text-sm text-content-secondary md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info-soft text-info-on">
                <Lightbulb size={16} aria-hidden="true" />
              </div>
              <div>
                <p className="mb-1 font-medium text-content">Define el problema</p>
                <p>Establece claramente el efecto central que deseas analizar.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-soft text-success-on">
                <GitBranch size={16} aria-hidden="true" />
              </div>
              <div>
                <p className="mb-1 font-medium text-content">Identifica categorías</p>
                <p>Utiliza las &ldquo;6M&rdquo;: Método, Mano de obra, Materiales, Maquinaria, Medición y Medio ambiente.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Plus size={16} aria-hidden="true" />
              </div>
              <div>
                <p className="mb-1 font-medium text-content">Añade causas</p>
                <p>Para cada categoría, identifica todas las posibles causas del problema.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-on">
                <Flag size={16} aria-hidden="true" />
              </div>
              <div>
                <p className="mb-1 font-medium text-content">Analiza y prioriza</p>
                <p>Evalúa las causas para identificar las más significativas y planificar acciones.</p>
              </div>
            </div>
          </div>
        </motion.div>
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
