import { useMemo, useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertTriangle,
  Eye,
  Undo2,
  ArrowDownWideNarrow,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatNumber, formatPercent, formatRelative } from '../lib/format';
import { transition, fadeInUp } from '../lib/motion';

const TOOL_ID = 'pareto-chart';

// Forma completa del estado vacío, alineada a la semilla de src/data/projects.js
// (categories/values/cumulative en paralelo, ya ordenadas de mayor a menor).
const DEFAULT_DATA = {
  categories: [],
  values: [],
  cumulative: [],
};

/** Recalcula porcentaje y porcentaje acumulado a partir de values, en el orden dado. */
function withCumulative(categories, values) {
  const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
  let running = 0;
  const cumulative = values.map((v) => {
    const pct = total > 0 ? ((Number(v) || 0) / total) * 100 : 0;
    running += pct;
    return Math.round(running * 10) / 10;
  });
  return { categories, values, cumulative };
}

/** Ordena categorías/valores de mayor a menor frecuencia y recalcula el acumulado. */
function sortDescending(categories, values) {
  const rows = categories.map((name, i) => ({ name, value: Number(values[i]) || 0 }));
  rows.sort((a, b) => b.value - a.value);
  return withCumulative(rows.map((r) => r.name), rows.map((r) => r.value));
}

export default function ParetoChart({ projectId }) {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA);
  const shouldReduceMotion = useReducedMotion();

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmKind, setConfirmKind] = useState(null); // 'example' | 'discard' | null
  const exampleSnapshotRef = useRef(null);

  const total = useMemo(
    () => t.data.values.reduce((sum, v) => sum + (Number(v) || 0), 0),
    [t.data.values]
  );
  const maxValue = useMemo(() => Math.max(1, ...t.data.values.map((v) => Number(v) || 0)), [t.data.values]);

  if (!t.ready) return null;

  const isEmpty = t.data.categories.length === 0;

  // --- Edición de filas ------------------------------------------------
  const addCategory = () => {
    t.setData((prev) => {
      const categories = [...prev.categories, ''];
      const values = [...prev.values, 0];
      return withCumulative(categories, values);
    });
  };

  const updateName = (index, name) => {
    t.setData((prev) => {
      const categories = prev.categories.map((c, i) => (i === index ? name : c));
      return { ...prev, categories };
    });
  };

  const updateValue = (index, rawValue) => {
    const value = Math.max(0, Number(rawValue) || 0);
    t.setData((prev) => {
      const values = prev.values.map((v, i) => (i === index ? value : v));
      return withCumulative(prev.categories, values);
    });
  };

  const removeCategory = (index) => {
    t.setData((prev) => {
      const categories = prev.categories.filter((_, i) => i !== index);
      const values = prev.values.filter((_, i) => i !== index);
      return withCumulative(categories, values);
    });
  };

  const sortByFrequency = () => {
    t.setData((prev) => sortDescending(prev.categories, prev.values));
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

      {/* Banner de modo ejemplo. Montaje/desmontaje condicional simple: solo se anima
          la entrada (motion.div sin AnimatePresence, para no depender del ciclo de
          salida de la librería en un elemento que además puede desaparecer por un
          guardado, no solo por el propio banner). */}
      {exampleMode && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
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

      <div className={exampleMode ? 'space-y-6 rounded-xl ring-1 ring-info/30 p-1' : 'space-y-6'}>
        {isEmpty ? (
          <EmptyState
            title="Pocas causas, casi todo el problema"
            description="Registra tus categorías de defectos y sus frecuencias para separar las pocas vitales de las muchas triviales."
            action={
              <GradientButton onClick={addCategory} leadingIcon={<Plus size={16} aria-hidden="true" />}>
                Agregar primera categoría
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
            <ParetoVisualization categories={t.data.categories} values={t.data.values} cumulative={t.data.cumulative} maxValue={maxValue} />

            <motion.div
              initial={shouldReduceMotion ? false : 'hidden'}
              animate="visible"
              variants={fadeInUp}
              className="overflow-x-auto rounded-xl border border-line bg-surface"
            >
              <table className="w-full min-w-[560px] text-sm">
                <caption className="sr-only">Categorías de defectos con su frecuencia y porcentaje acumulado</caption>
                <thead>
                  <tr className="border-b border-line bg-surface-sunken text-left text-xs font-medium uppercase tracking-wide text-content-muted">
                    <th scope="col" className="px-4 py-2.5">Categoría</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Frecuencia</th>
                    <th scope="col" className="px-4 py-2.5 text-right">% del total</th>
                    <th scope="col" className="px-4 py-2.5 text-right">% acumulado</th>
                    <th scope="col" className="px-2 py-2.5 text-right">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {t.data.categories.map((name, index) => {
                    const value = Number(t.data.values[index]) || 0;
                    const percent = total > 0 ? (value / total) * 100 : 0;
                    return (
                      <tr key={index} className="border-b border-line-subtle last:border-0">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => updateName(index, e.target.value)}
                            placeholder="Nombre de la categoría"
                            aria-label={`Nombre de la categoría ${index + 1}`}
                            className="input"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={value}
                            onChange={(e) => updateValue(index, e.target.value)}
                            aria-label={`Frecuencia de ${name || `categoría ${index + 1}`}`}
                            className="input w-24 text-right tabular-nums"
                          />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-content-secondary">
                          {formatPercent(percent, 1)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium text-content">
                          {formatPercent(t.data.cumulative[index] ?? 0, 1)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeCategory(index)}
                            aria-label={`Eliminar categoría ${name || index + 1}`}
                            className="rounded-lg p-1.5 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-sunken">
                    <td className="px-4 py-2 text-xs font-medium text-content-secondary">Total</td>
                    <td className="px-4 py-2 text-right text-xs font-medium tabular-nums text-content-secondary">
                      {formatNumber(total)}
                    </td>
                    <td className="px-4 py-2 text-right text-xs tabular-nums text-content-muted">100%</td>
                    <td className="px-4 py-2" />
                    <td className="px-2 py-2" />
                  </tr>
                </tfoot>
              </table>
            </motion.div>

            <div className="flex flex-wrap items-center gap-2">
              <GradientButton variant="outline" size="sm" onClick={addCategory} leadingIcon={<Plus size={14} aria-hidden="true" />}>
                Agregar categoría
              </GradientButton>
              <GradientButton
                variant="ghost"
                size="sm"
                onClick={sortByFrequency}
                leadingIcon={<ArrowDownWideNarrow size={14} aria-hidden="true" />}
              >
                Ordenar de mayor a menor
              </GradientButton>
            </div>
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

/** Barras de frecuencia + línea de acumulado con corte en 80%. Vista visual del Pareto. */
function ParetoVisualization({ categories, values, cumulative, maxValue }) {
  const shouldReduceMotion = useReducedMotion();
  const chartHeight = 220;
  const count = categories.length;
  // Centro de cada barra en porcentaje del ancho, para ubicar la línea de acumulado.
  const points = useMemo(() => {
    return values.map((_, i) => {
      const x = count > 0 ? ((i + 0.5) / count) * 100 : 0;
      const y = chartHeight - (Math.min(100, cumulative[i] ?? 0) / 100) * chartHeight;
      return { x, y };
    });
  }, [values, cumulative, count]);

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const cutoffY = chartHeight - 0.8 * chartHeight;

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-content-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand" aria-hidden="true" /> Frecuencia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-warning" aria-hidden="true" /> % acumulado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t-2 border-dashed border-content-muted" aria-hidden="true" /> Corte 80%
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <div className="relative" style={{ height: chartHeight, minWidth: Math.max(360, count * 72) }}>
          {/* Línea de corte 80% */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-content-muted"
            style={{ top: cutoffY }}
          >
            <span className="absolute -top-4 right-0 text-[10px] tabular-nums text-content-muted">80%</span>
          </div>

          {/* Barras: grid de columnas iguales, sin separación entre celdas, para que
              coincidan en X con los puntos de la línea de acumulado (ambos usan el
              mismo sistema de coordenadas 0-100%). */}
          <div
            className="absolute inset-0 grid items-end"
            style={{ gridTemplateColumns: `repeat(${count}, minmax(48px, 1fr))` }}
          >
            {values.map((v, i) => {
              const value = Number(v) || 0;
              const heightPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const vitalFew = (cumulative[i] ?? 0) <= 80.001;
              return (
                <div key={i} className="flex h-full flex-col items-center justify-end px-1.5">
                  <span className="mb-1 text-[11px] tabular-nums text-content-secondary">{formatNumber(value)}</span>
                  <motion.div
                    initial={shouldReduceMotion ? false : { height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={transition.enter}
                    className={`w-full rounded-t-sm ${vitalFew ? 'bg-brand' : 'bg-line-strong'}`}
                    style={{ minHeight: value > 0 ? 3 : 0 }}
                  />
                </div>
              );
            })}
          </div>

          {/* Línea de porcentaje acumulado */}
          {count > 0 && (
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`0 0 100 ${chartHeight}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points={polylinePoints}
                fill="none"
                style={{ stroke: 'rgb(var(--jc-warning))' }}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2" style={{ fill: 'rgb(var(--jc-warning))' }} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          )}
        </div>

        {/* Etiquetas de categoría: mismo grid que las barras para alinear con exactitud. */}
        <div
          className="grid pt-2"
          style={{ gridTemplateColumns: `repeat(${count}, minmax(48px, 1fr))`, minWidth: Math.max(360, count * 72) }}
        >
          {categories.map((name, i) => (
            <div key={i} className="truncate px-1.5 text-center text-[11px] text-content-secondary" title={name}>
              {name || `Categoría ${i + 1}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
