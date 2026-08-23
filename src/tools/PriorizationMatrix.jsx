import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Trash2,
  HelpCircle,
  ListFilter,
  Filter,
  Copy,
  ArrowUpRight,
  Square,
  Move,
  Check,
  Loader2,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';

import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatRelative } from '../lib/format';
import { transition, fadeInUp } from '../lib/motion';

const TOOL_ID = 'prioritization-matrix';

// Forma canónica: fijada por la semilla de src/data/projects.js, NO por el
// estado interno original del componente (que usaba criterios/opciones como
// objetos con peso y mapas de puntuación por id). `criteria` es un array de
// nombres; cada iniciativa lleva un array de puntuaciones alineado por índice
// a `criteria`, más el total (suma simple, sin ponderar).
const DEFAULT_DATA = {
  criteria: [],
  initiatives: [],
};

const SCORE_OPTIONS = [1, 2, 3, 4, 5];

const recalcTotal = (scores) => scores.reduce((sum, s) => sum + (Number(s) || 0), 0);

/**
 * Rescate de datos legacy: antes de este ciclo el componente escribía en
 * `project.priorityMatrix` con un modelo distinto (criterios como objetos con
 * peso, opciones con mapa de puntuaciones por id). Se traduce a la forma
 * canónica simple (nombres + arrays de puntuación) para no perder el trabajo
 * de quien ya tenía algo guardado.
 */
function legacyRescue(project) {
  const legacy = project?.priorityMatrix;
  if (!legacy || !Array.isArray(legacy.criteria) || legacy.criteria.length === 0) return null;

  const criteriaNames = legacy.criteria.map((c) => (typeof c === 'string' ? c : c?.name || ''));

  // Ya viene en forma canónica (criterios como strings, sin `options`/`scores` legacy).
  if (typeof legacy.criteria[0] === 'string') {
    return {
      criteria: criteriaNames,
      initiatives: Array.isArray(legacy.initiatives) ? legacy.initiatives : [],
    };
  }

  const initiatives = (legacy.options || []).map((opt) => {
    const scores = legacy.criteria.map((c) => {
      const raw = legacy.scores?.[opt.id]?.[c.id];
      return typeof raw === 'number' ? raw : 0;
    });
    return { name: opt.name || 'Sin nombre', scores, total: recalcTotal(scores) };
  });

  return { criteria: criteriaNames, initiatives };
}

const TABS = [
  { id: 'criteria', label: 'Criterios', Icon: Filter },
  { id: 'initiatives', label: 'Iniciativas', Icon: Square },
  { id: 'matrix', label: 'Matriz', Icon: Move },
  { id: 'ranking', label: 'Ranking', Icon: ArrowUpRight },
];

const scoreTone = (score, max) => {
  if (max <= 0) return 'bg-surface-sunken text-content-muted';
  const ratio = score / max;
  if (ratio >= 0.7) return 'bg-success-soft text-success-on';
  if (ratio >= 0.4) return 'bg-warning-soft text-warning-on';
  return 'bg-danger-soft text-danger-on';
};

/** Estado de guardado, calculado — nunca simulado con setTimeout. */
function SaveStatus({ t }) {
  const [, forceTick] = useState(0);

  // Un único intervalo para refrescar el texto relativo ("hace 3 minutos"),
  // que de otro modo se congela hasta el próximo render.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  let icon = <span className="h-2 w-2 rounded-full bg-content-muted" aria-hidden="true" />;
  let text = 'Sin cambios';
  let tone = 'text-content-muted';
  let extra = null;

  if (t.error) {
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = 'No se pudo guardar';
    tone = 'text-danger-on';
    extra = (
      <button
        type="button"
        onClick={() => t.save()}
        className="ml-2 underline decoration-dotted underline-offset-2 hover:text-danger-on"
      >
        Reintentar
      </button>
    );
  } else if (t.isSaving) {
    icon = <Loader2 size={14} className="animate-spin" aria-hidden="true" />;
    text = 'Guardando cambios…';
    tone = 'text-content-secondary';
  } else if (t.justSaved) {
    icon = <Check size={14} aria-hidden="true" />;
    text = 'Guardado';
    tone = 'text-success-on';
  } else if (t.isDirty) {
    icon = <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />;
    text = 'Cambios sin guardar';
    tone = 'text-warning-on';
  } else if (t.lastSavedAt) {
    icon = <Check size={14} aria-hidden="true" />;
    text = `Guardado ${formatRelative(t.lastSavedAt)}`;
    tone = 'text-success-on';
  }

  return (
    <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm ${tone}`}>
      {icon}
      <span>{text}</span>
      {extra}
    </p>
  );
}

const PriorizationMatrix = ({ projectId }) => {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, { legacy: legacyRescue });
  const shouldReduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState('criteria');
  const [showHelp, setShowHelp] = useState(false);

  // Modo ejemplo: el hook no lo gestiona (loadExample nunca guarda). Se
  // recuerda el borrador previo para poder "Deshacer".
  const [exampleActive, setExampleActive] = useState(false);
  const exampleSnapshotRef = useRef(null);

  // Confirmaciones — siempre vía Modal, nunca window.confirm/alert.
  const [confirmExample, setConfirmExample] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const { criteria, initiatives } = t.data;
  const maxPossible = criteria.length * 5;
  const isEmpty = criteria.length === 0 && initiatives.length === 0;
  const exampleTitle = t.exampleTitles?.[0] || 'Ejemplo';

  const rankedInitiatives = useMemo(
    () => [...initiatives].sort((a, b) => b.total - a.total),
    [initiatives]
  );

  if (!t.ready) return null;

  // --- Criterios -------------------------------------------------------
  const addCriterion = () => {
    t.setData((prev) => ({
      ...prev,
      criteria: [...prev.criteria, ''],
      initiatives: prev.initiatives.map((init) => {
        const scores = [...init.scores, 3];
        return { ...init, scores, total: recalcTotal(scores) };
      }),
    }));
    setActiveTab('criteria');
  };

  const updateCriterionName = (index, name) => {
    t.setData((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c, i) => (i === index ? name : c)),
    }));
  };

  const removeCriterion = (index) => {
    t.setData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
      initiatives: prev.initiatives.map((init) => {
        const scores = init.scores.filter((_, i) => i !== index);
        return { ...init, scores, total: recalcTotal(scores) };
      }),
    }));
  };

  // --- Iniciativas -------------------------------------------------------
  const addInitiative = () => {
    t.setData((prev) => {
      const scores = prev.criteria.map(() => 3);
      return {
        ...prev,
        initiatives: [...prev.initiatives, { name: 'Nueva iniciativa', scores, total: recalcTotal(scores) }],
      };
    });
    setActiveTab('initiatives');
  };

  const updateInitiativeName = (index, name) => {
    t.setData((prev) => ({
      ...prev,
      initiatives: prev.initiatives.map((init, i) => (i === index ? { ...init, name } : init)),
    }));
  };

  const removeInitiative = (index) => {
    t.setData((prev) => ({
      ...prev,
      initiatives: prev.initiatives.filter((_, i) => i !== index),
    }));
  };

  const cloneInitiative = (index) => {
    t.setData((prev) => {
      const source = prev.initiatives[index];
      if (!source) return prev;
      return {
        ...prev,
        initiatives: [
          ...prev.initiatives,
          { ...source, name: `${source.name} (copia)`, scores: [...source.scores] },
        ],
      };
    });
  };

  const updateScore = (initiativeIndex, criterionIndex, value) => {
    t.setData((prev) => ({
      ...prev,
      initiatives: prev.initiatives.map((init, i) => {
        if (i !== initiativeIndex) return init;
        const scores = init.scores.map((s, ci) => (ci === criterionIndex ? Number(value) : s));
        return { ...init, scores, total: recalcTotal(scores) };
      }),
    }));
  };

  // --- Modo ejemplo --------------------------------------------------------
  const requestLoadExample = () => {
    if (t.isDirty) {
      setConfirmExample(true);
    } else {
      applyExample();
    }
  };

  const applyExample = () => {
    exampleSnapshotRef.current = t.data;
    t.loadExample(0);
    setExampleActive(true);
    setConfirmExample(false);
    setActiveTab('matrix');
  };

  const adoptExample = () => {
    t.save();
    setExampleActive(false);
  };

  const discardExample = () => {
    if (exampleSnapshotRef.current) t.setData(exampleSnapshotRef.current);
    setExampleActive(false);
  };

  // --- Cancelar --------------------------------------------------------
  const requestDiscard = () => setConfirmDiscard(true);
  const confirmDiscardChanges = () => {
    t.discard();
    setConfirmDiscard(false);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Barra de estado y guardado — equivalente local a ToolToolbar (no
          existía en src/components/tools/ al momento de este ciclo). */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <SaveStatus t={t} />
        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && !exampleActive && (
            <GradientButton variant="outline" size="sm" onClick={requestLoadExample}>
              Ver un ejemplo
            </GradientButton>
          )}
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            aria-label="Ayuda de la matriz de priorización"
            className="flex h-8 w-8 items-center justify-center rounded-md text-content-secondary hover:bg-surface-sunken hover:text-content"
          >
            <HelpCircle size={18} aria-hidden="true" />
          </button>
          {t.isDirty && !exampleActive && (
            <GradientButton variant="ghost" size="sm" onClick={requestDiscard}>
              Cancelar
            </GradientButton>
          )}
          <GradientButton
            variant="success"
            size="sm"
            disabled={!t.isDirty || t.isSaving || exampleActive}
            onClick={() => t.save()}
          >
            Guardar
          </GradientButton>
        </div>
      </div>

      {/* Banner de modo ejemplo */}
      <AnimatePresence>
        {exampleActive && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={transition.base}
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/40 bg-brand/5 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                <Sparkles size={12} aria-hidden="true" />
                Ejemplo
              </span>
              <span className="font-medium text-content">{exampleTitle}</span>
              <span className="text-content-secondary">
                Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GradientButton variant="solid" size="sm" onClick={adoptExample}>
                Usar como punto de partida
              </GradientButton>
              <GradientButton variant="ghost" size="sm" onClick={discardExample}>
                Deshacer
              </GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de ayuda */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={transition.base}
            className="relative z-20 mb-6 w-full max-w-md rounded-lg border border-line bg-surface p-4 shadow-md sm:absolute sm:right-6"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-content">
                <HelpCircle size={16} aria-hidden="true" />
                Ayuda de la Matriz de Priorización
              </h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Cerrar ayuda"
                className="rounded p-1 text-content-muted hover:bg-surface-sunken hover:text-content"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-content-secondary">
              <p><strong className="text-content">Criterios:</strong> los factores por los que evaluarás las iniciativas.</p>
              <p><strong className="text-content">Iniciativas:</strong> las alternativas que deseas comparar.</p>
              <p><strong className="text-content">Puntuación:</strong> califica cada iniciativa por criterio, de 1 a 5.</p>
              <p className="mt-2 font-medium text-brand">Pasos recomendados:</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Define los criterios de evaluación.</li>
                <li>Añade las iniciativas a evaluar.</li>
                <li>Califica cada iniciativa para cada criterio.</li>
                <li>Revisa el ranking para tomar decisiones.</li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEmpty ? (
        <EmptyState
          title="No todo pesa igual"
          description="Define tus criterios, pondéralos y puntúa cada alternativa."
          action={<GradientButton onClick={addCriterion}>Definir criterios</GradientButton>}
          secondaryAction={
            t.hasExamples && (
              <GradientButton variant="outline" onClick={requestLoadExample}>
                Ver un ejemplo
              </GradientButton>
            )
          }
        />
      ) : (
        <div className={exampleActive ? 'space-y-6 rounded-lg ring-1 ring-brand/30' : 'space-y-6'}>
          {/* Navegación por pestañas */}
          <div className="border-b border-line">
            <nav className="-mb-px flex flex-wrap gap-1">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium ${
                    activeTab === id
                      ? 'border-brand text-brand'
                      : 'border-transparent text-content-secondary hover:border-line hover:text-content'
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'criteria' && (
            <motion.div
              initial={shouldReduceMotion ? false : fadeInUp.hidden}
              animate={fadeInUp.visible}
              transition={transition.base}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <GradientButton size="sm" leadingIcon={<Plus size={16} aria-hidden="true" />} onClick={addCriterion}>
                  Añadir criterio
                </GradientButton>
              </div>

              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="min-w-full divide-y divide-line">
                  <thead className="bg-surface-sunken">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-sm font-medium text-content-secondary">
                        Criterio
                      </th>
                      <th scope="col" className="w-24 px-3 py-2 text-center text-sm font-medium text-content-secondary">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {criteria.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-6 text-center text-sm text-content-muted">
                          No hay criterios definidos. Haz clic en &ldquo;Añadir criterio&rdquo; para crear uno.
                        </td>
                      </tr>
                    ) : (
                      criteria.map((criterion, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={criterion}
                              placeholder="Nombre del criterio"
                              onChange={(e) => updateCriterionName(index, e.target.value)}
                              className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-content focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeCriterion(index)}
                              aria-label={`Eliminar criterio ${criterion || index + 1}`}
                              className="rounded p-1.5 text-danger-on hover:bg-danger-soft"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {criteria.length > 1 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-content-muted">
                  <ListFilter size={12} aria-hidden="true" />
                  Cada iniciativa se puntúa de 1 a 5 en cada criterio; el total es la suma simple.
                </p>
              )}
            </motion.div>
          )}

          {activeTab === 'initiatives' && (
            <motion.div
              initial={shouldReduceMotion ? false : fadeInUp.hidden}
              animate={fadeInUp.visible}
              transition={transition.base}
            >
              <div className="mb-4">
                <GradientButton size="sm" leadingIcon={<Plus size={16} aria-hidden="true" />} onClick={addInitiative}>
                  Añadir iniciativa
                </GradientButton>
              </div>

              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="min-w-full divide-y divide-line">
                  <thead className="bg-surface-sunken">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-sm font-medium text-content-secondary">
                        Iniciativa
                      </th>
                      <th scope="col" className="px-3 py-2 text-center text-sm font-medium text-content-secondary">
                        Puntuación total
                      </th>
                      <th scope="col" className="w-24 px-3 py-2 text-center text-sm font-medium text-content-secondary">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {initiatives.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-sm text-content-muted">
                          No hay iniciativas definidas. Haz clic en &ldquo;Añadir iniciativa&rdquo; para crear una.
                        </td>
                      </tr>
                    ) : (
                      initiatives.map((initiative, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={initiative.name}
                              onChange={(e) => updateInitiativeName(index, e.target.value)}
                              className="w-full rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-content focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block rounded px-2 py-1 text-sm font-medium tabular-nums ${scoreTone(initiative.total, maxPossible)}`}>
                              {initiative.total}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => cloneInitiative(index)}
                                aria-label={`Duplicar iniciativa ${initiative.name}`}
                                className="rounded p-1.5 text-content-secondary hover:bg-surface-sunken hover:text-content"
                              >
                                <Copy size={16} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeInitiative(index)}
                                aria-label={`Eliminar iniciativa ${initiative.name}`}
                                className="rounded p-1.5 text-danger-on hover:bg-danger-soft"
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'matrix' && (
            <motion.div
              initial={shouldReduceMotion ? false : fadeInUp.hidden}
              animate={fadeInUp.visible}
              transition={transition.base}
            >
              {criteria.length === 0 || initiatives.length === 0 ? (
                <div className="rounded-lg border border-line-subtle bg-surface-sunken p-4 text-center text-sm text-content-muted">
                  Necesitas definir criterios e iniciativas para poder puntuar.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="min-w-full divide-y divide-line">
                    <thead className="bg-surface-sunken">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-sm font-medium text-content-secondary">
                          Iniciativa
                        </th>
                        {criteria.map((criterion, ci) => (
                          <th key={ci} scope="col" className="px-3 py-2 text-center text-sm font-medium text-content-secondary">
                            {criterion || `Criterio ${ci + 1}`}
                          </th>
                        ))}
                        <th scope="col" className="bg-surface-sunken px-3 py-2 text-center text-sm font-semibold text-content">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {initiatives.map((initiative, ii) => (
                        <tr key={ii}>
                          <td className="px-3 py-2 font-medium text-content">{initiative.name}</td>
                          {criteria.map((criterion, ci) => (
                            <td key={ci} className="px-3 py-2 text-center">
                              <select
                                value={initiative.scores[ci] ?? 3}
                                onChange={(e) => updateScore(ii, ci, e.target.value)}
                                aria-label={`Puntuación de ${initiative.name} en ${criterion || `criterio ${ci + 1}`}`}
                                className="w-16 rounded-md border border-line bg-surface px-1 py-1 text-center text-sm tabular-nums text-content focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                              >
                                {SCORE_OPTIONS.map((score) => (
                                  <option key={score} value={score}>
                                    {score}
                                  </option>
                                ))}
                              </select>
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block rounded px-2 py-1 text-sm font-bold tabular-nums ${scoreTone(initiative.total, maxPossible)}`}>
                              {initiative.total}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'ranking' && (
            <motion.div
              initial={shouldReduceMotion ? false : fadeInUp.hidden}
              animate={fadeInUp.visible}
              transition={transition.base}
              className="space-y-6"
            >
              {initiatives.length === 0 ? (
                <div className="rounded-lg border border-line-subtle bg-surface-sunken p-4 text-center text-sm text-content-muted">
                  No hay iniciativas para mostrar en el ranking.
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-line bg-surface p-4">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-content">
                      <ArrowUpRight size={18} aria-hidden="true" />
                      Ranking de iniciativas
                    </h3>
                    <div className="space-y-4">
                      {rankedInitiatives.map((initiative, index) => {
                        const ratio = maxPossible > 0 ? initiative.total / maxPossible : 0;
                        const barTone =
                          ratio >= 0.7 ? 'bg-success' : ratio >= 0.4 ? 'bg-warning' : 'bg-danger';
                        return (
                          <div key={`${initiative.name}-${index}`}>
                            <div className="mb-1 flex items-center gap-2">
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                                {index + 1}
                              </div>
                              <div className="font-medium text-content">{initiative.name}</div>
                              <div className="ml-auto font-bold tabular-nums text-content">{initiative.total}</div>
                            </div>
                            <div className="h-3 overflow-hidden rounded-full bg-surface-sunken">
                              <div
                                className={`h-full rounded-full ${barTone}`}
                                style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vista de tabla equivalente, para lectores de pantalla y usuarios de teclado. */}
                  <div className="overflow-x-auto rounded-lg border border-line">
                    <table className="min-w-full divide-y divide-line">
                      <caption className="sr-only">Tabla de ranking de iniciativas por puntuación total</caption>
                      <thead className="bg-surface-sunken">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-sm font-medium text-content-secondary">
                            #
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-sm font-medium text-content-secondary">
                            Iniciativa
                          </th>
                          <th scope="col" className="px-3 py-2 text-center text-sm font-medium text-content-secondary">
                            Puntuación total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {rankedInitiatives.map((initiative, index) => (
                          <tr key={`${initiative.name}-table-${index}`}>
                            <td className="px-3 py-2 text-content-secondary tabular-nums">{index + 1}</td>
                            <td className="px-3 py-2 font-medium text-content">{initiative.name}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-block rounded px-2 py-1 text-sm font-medium tabular-nums ${scoreTone(initiative.total, maxPossible)}`}>
                                {initiative.total}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-lg border border-line bg-surface p-4">
                    <h3 className="mb-2 text-sm font-semibold text-content">Leyenda de puntuación</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-content-secondary">
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded bg-success" aria-hidden="true" /> Alto (≥70%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded bg-warning" aria-hidden="true" /> Medio (40–69%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded bg-danger" aria-hidden="true" /> Bajo (&lt;40%)
                      </span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Confirmación: cargar ejemplo con borrador sucio */}
      <Modal
        open={confirmExample}
        onClose={() => setConfirmExample(false)}
        title="¿Cargar el ejemplo?"
        description="Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar."
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmExample(false)}>
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

export default PriorizationMatrix;
