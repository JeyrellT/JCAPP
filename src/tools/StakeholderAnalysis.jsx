import { Fragment, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Plus,
  Trash2,
  Users,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  Search,
  Table2,
  LayoutGrid,
  X,
} from 'lucide-react';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatRelative, formatNumber } from '../lib/format';
import { fadeInUp } from '../lib/motion';

const TOOL_ID = 'stakeholder-analysis';

// Forma canónica: alineada a `project.tools['stakeholder-analysis'].data` en
// src/data/projects.js (cada proyecto de ejemplo ya siembra
// `stakeholders: [{ name, interest, influence, concerns, strategy }]`).
const DEFAULT_DATA = {
  stakeholders: [],
};

const LEVELS = ['alto', 'medio', 'bajo'];
const LEVEL_LABEL = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };

const emptyStakeholder = () => ({ name: '', interest: 'medio', influence: 'medio', concerns: '', strategy: '' });

// Zona de gestión (matriz clásica de poder/interés) a partir de los niveles
// categóricos alto/medio/bajo que usa la forma canónica de esta herramienta.
const ZONE_BY_PAIR = {
  'alto|alto': 'Gestionar de cerca',
  'alto|medio': 'Mantener satisfecho',
  'alto|bajo': 'Mantener satisfecho',
  'medio|alto': 'Mantener informado',
  'medio|medio': 'Mantener informado',
  'medio|bajo': 'Monitorear',
  'bajo|alto': 'Mantener informado',
  'bajo|medio': 'Monitorear',
  'bajo|bajo': 'Monitorear',
};

const ZONE_ORDER = ['Gestionar de cerca', 'Mantener satisfecho', 'Mantener informado', 'Monitorear'];

const ZONE_META = {
  'Gestionar de cerca': { bg: 'bg-warning-soft', text: 'text-warning-on', dot: 'bg-warning' },
  'Mantener satisfecho': { bg: 'bg-info-soft', text: 'text-info-on', dot: 'bg-info' },
  'Mantener informado': { bg: 'bg-success-soft', text: 'text-success-on', dot: 'bg-success' },
  Monitorear: { bg: 'bg-surface-sunken', text: 'text-content-secondary', dot: 'bg-neutral-400' },
};

const ZONE_SUGGESTION = {
  'Gestionar de cerca': 'Mantenerlo informado de cerca e involucrarlo en las decisiones clave del proyecto.',
  'Mantener satisfecho': 'Mantenerlo satisfecho sin saturarlo de detalle; consultarlo en los momentos clave.',
  'Mantener informado': 'Mantenerlo informado con actualizaciones periódicas; es una fuente valiosa de información.',
  Monitorear: 'Monitorear con esfuerzo mínimo; comunicar solo si hay cambios relevantes.',
};

const getZone = (influence, interest) => ZONE_BY_PAIR[`${influence}|${interest}`] || 'Monitorear';

// El ejemplo de toolsData.js guarda los stakeholders bajo `analysisMatrix`
// (además de `stakeholderGroups`, que no forma parte del estado canónico).
const adaptStakeholderExample = (example, defaultData) => ({
  ...defaultData,
  stakeholders: Array.isArray(example?.analysisMatrix)
    ? example.analysisMatrix.map((s) => ({
        name: s.name || '',
        interest: LEVELS.includes(s.interest) ? s.interest : 'medio',
        influence: LEVELS.includes(s.influence) ? s.influence : 'medio',
        concerns: s.concerns || '',
        strategy: s.strategy || '',
      }))
    : defaultData.stakeholders,
});

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
 * Análisis de Stakeholders (matriz de poder/interés).
 *
 * @param {Object} props
 * @param {string} props.projectId
 */
const StakeholderAnalysis = ({ projectId }) => {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, {
    adaptExample: adaptStakeholderExample,
    // Sin `legacy`: esta herramienta nunca persistió nada antes de este ciclo
    // (solo destructuraba `getProject`), así que no hay clave vieja que rescatar.
  });
  const shouldReduceMotion = useReducedMotion();

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmExampleOpen, setConfirmExampleOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const snapshotRef = useRef(null);

  const [viewMode, setViewMode] = useState('table'); // 'table' | 'matrix'
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!t.ready) return null;

  const stakeholders = t.data.stakeholders || [];
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

  const addStakeholder = () => {
    t.setData((prev) => ({ ...prev, stakeholders: [...(prev.stakeholders || []), emptyStakeholder()] }));
  };

  const updateStakeholderAt = (index, patch) => {
    t.setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  const deleteStakeholderAt = (index) => {
    t.setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.filter((_, i) => i !== index),
    }));
    setSelectedIndex((current) => (current === index ? null : current));
  };

  const applySuggestedStrategy = (index, zone) => {
    updateStakeholderAt(index, { strategy: ZONE_SUGGESTION[zone] });
  };

  // Zonas por estatus, para las tarjetas de resumen y el filtro.
  const zoneCounts = ZONE_ORDER.reduce((acc, zone) => ({ ...acc, [zone]: 0 }), {});
  stakeholders.forEach((s) => {
    const zone = getZone(s.influence, s.interest);
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });

  const term = searchTerm.trim().toLowerCase();
  const filtered = stakeholders
    .map((s, index) => ({ s, index, zone: getZone(s.influence, s.interest) }))
    .filter(({ s, zone }) => {
      const matchesTerm =
        !term ||
        s.name.toLowerCase().includes(term) ||
        (s.concerns || '').toLowerCase().includes(term);
      const matchesZone = !zoneFilter || zone === zoneFilter;
      return matchesTerm && matchesZone;
    });

  const selected = selectedIndex !== null ? stakeholders[selectedIndex] : null;
  const selectedZone = selected ? getZone(selected.influence, selected.interest) : null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Barra de estado + acciones. Contenedor local: no hay ToolToolbar compartido aún
          (src/components/tools/ está vacío al momento de este cambio; ver reporte final). */}
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

      {stakeholders.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todo proyecto vive o muere por su gente"
          description="Mapea a los interesados por interés e influencia y define una estrategia para cada uno."
          action={
            <GradientButton leadingIcon={<Plus size={16} aria-hidden="true" />} onClick={addStakeholder}>
              Agregar stakeholder
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
          {/* Resumen por zona de gestión */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {ZONE_ORDER.map((zone) => {
              const meta = ZONE_META[zone];
              return (
                <div key={zone} className={`rounded-lg border border-line-subtle p-3 ${meta.bg}`}>
                  <p className={`text-2xl font-bold tabular-nums ${meta.text}`}>
                    {formatNumber(zoneCounts[zone])}
                  </p>
                  <p className={`mt-0.5 flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                    {zone}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Cambio de vista + filtros */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-1">
              <button
                type="button"
                aria-pressed={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-fast ${
                  viewMode === 'table' ? 'bg-brand text-brand-contrast' : 'text-content-secondary hover:bg-surface-sunken'
                }`}
              >
                <Table2 size={14} aria-hidden="true" />
                Tabla
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'matrix'}
                onClick={() => setViewMode('matrix')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-fast ${
                  viewMode === 'matrix' ? 'bg-brand text-brand-contrast' : 'text-content-secondary hover:bg-surface-sunken'
                }`}
              >
                <LayoutGrid size={14} aria-hidden="true" />
                Matriz
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="relative sm:w-64">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted"
                  aria-hidden="true"
                />
                <label className="sr-only" htmlFor="stakeholder-search">
                  Buscar stakeholder
                </label>
                <input
                  id="stakeholder-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o inquietud…"
                  className="w-full rounded-md border border-line bg-surface py-1.5 pl-8 pr-2 text-sm text-content placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <label className="sr-only" htmlFor="stakeholder-zone-filter">
                Filtrar por zona
              </label>
              <select
                id="stakeholder-zone-filter"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">Todas las zonas</option>
                {ZONE_ORDER.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              variant="sin-resultados"
              size="sm"
              action={
                <GradientButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setZoneFilter('');
                  }}
                >
                  Limpiar filtros
                </GradientButton>
              }
            />
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-surface-sunken">
                  <tr>
                    <th scope="col" className="w-48 px-3 py-2 text-left font-medium text-content-secondary">
                      Stakeholder
                    </th>
                    <th scope="col" className="w-28 px-3 py-2 text-left font-medium text-content-secondary">
                      Interés
                    </th>
                    <th scope="col" className="w-28 px-3 py-2 text-left font-medium text-content-secondary">
                      Influencia
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-content-secondary">
                      Inquietudes
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-content-secondary">
                      Estrategia
                    </th>
                    <th scope="col" className="w-32 px-3 py-2 text-left font-medium text-content-secondary">
                      Zona
                    </th>
                    <th scope="col" className="w-12 px-3 py-2 text-right font-medium text-content-secondary">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface">
                  {filtered.map(({ s, index, zone }) => {
                    const meta = ZONE_META[zone];
                    return (
                      <tr key={index}>
                        <td className="px-3 py-2 align-top">
                          <input
                            type="text"
                            value={s.name}
                            onChange={(e) => updateStakeholderAt(index, { name: e.target.value })}
                            placeholder="Nombre o rol"
                            className="w-full rounded-md border border-line bg-surface px-2 py-1 text-content placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={s.interest}
                            onChange={(e) => updateStakeholderAt(index, { interest: e.target.value })}
                            className="w-full rounded-md border border-line bg-surface px-2 py-1 text-content focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                          >
                            {LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {LEVEL_LABEL[lvl]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={s.influence}
                            onChange={(e) => updateStakeholderAt(index, { influence: e.target.value })}
                            className="w-full rounded-md border border-line bg-surface px-2 py-1 text-content focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                          >
                            {LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>
                                {LEVEL_LABEL[lvl]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <textarea
                            value={s.concerns}
                            onChange={(e) => updateStakeholderAt(index, { concerns: e.target.value })}
                            rows={2}
                            placeholder="¿Qué le preocupa de este proyecto?"
                            className="w-full rounded-md border border-line bg-surface px-2 py-1 text-content placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <textarea
                            value={s.strategy}
                            onChange={(e) => updateStakeholderAt(index, { strategy: e.target.value })}
                            rows={2}
                            placeholder="¿Cómo vas a gestionarlo?"
                            className="w-full rounded-md border border-line bg-surface px-2 py-1 text-content placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                          />
                          <button
                            type="button"
                            onClick={() => applySuggestedStrategy(index, zone)}
                            className="mt-1 text-xs font-medium text-brand underline decoration-dotted underline-offset-2 hover:text-brand-hover"
                          >
                            Usar estrategia sugerida
                          </button>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className={`badge px-2 py-0.5 text-xs ${meta.bg} ${meta.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
                            {zone}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right align-top">
                          <button
                            type="button"
                            onClick={() => deleteStakeholderAt(index)}
                            className="rounded p-1.5 text-content-muted hover:bg-danger-soft hover:text-danger-on"
                            aria-label={`Eliminar stakeholder${s.name ? ` ${s.name}` : ''}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="sr-only">
                Vista visual de la matriz de poder e interés. Usa la vista de Tabla para navegar con lector de
                pantalla.
              </p>
              <div className="overflow-x-auto">
                <div className="grid min-w-[640px] grid-cols-[96px_repeat(3,1fr)] gap-2">
                  <div />
                  {LEVELS.slice()
                    .reverse()
                    .map((lvl) => (
                      <div key={lvl} className="text-center text-xs font-medium text-content-secondary">
                        Interés {LEVEL_LABEL[lvl]}
                      </div>
                    ))}
                  {LEVELS.map((infl) => (
                    <Fragment key={`row-${infl}`}>
                      <div className="flex items-center justify-end pr-2 text-xs font-medium text-content-secondary">
                        Influencia {LEVEL_LABEL[infl]}
                      </div>
                      {LEVELS.slice()
                        .reverse()
                        .map((interest) => {
                          const zone = getZone(infl, interest);
                          const meta = ZONE_META[zone];
                          const cellItems = filtered.filter(
                            ({ s }) => s.influence === infl && s.interest === interest
                          );
                          return (
                            <div
                              key={`${infl}-${interest}`}
                              className={`min-h-[92px] rounded-lg border border-line-subtle p-2 ${meta.bg}`}
                            >
                              <div className="flex flex-wrap gap-1.5">
                                {cellItems.map(({ s, index }) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => setSelectedIndex(index)}
                                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.text} border-line-subtle bg-surface/70 hover:bg-surface`}
                                  >
                                    {s.name || 'Sin nombre'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {viewMode === 'matrix' && selected && (
              <motion.div
                initial={shouldReduceMotion ? false : 'hidden'}
                animate="visible"
                exit="hidden"
                variants={fadeInUp}
                className="rounded-lg border border-line bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Users size={16} aria-hidden="true" />
                    {selected.name || 'Sin nombre'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(null)}
                    className="rounded p-1 text-content-muted hover:bg-surface-sunken hover:text-content"
                    aria-label="Cerrar detalle"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-content-secondary">Inquietudes</p>
                    <p className="mt-0.5 text-sm text-content">{selected.concerns || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-content-secondary">Estrategia</p>
                    <p className="mt-0.5 text-sm text-content">{selected.strategy || '—'}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="badge px-2 py-0.5 text-xs bg-surface-sunken text-content-secondary">
                    Interés: {LEVEL_LABEL[selected.interest]}
                  </span>
                  <span className="badge px-2 py-0.5 text-xs bg-surface-sunken text-content-secondary">
                    Influencia: {LEVEL_LABEL[selected.influence]}
                  </span>
                  <span className={`badge px-2 py-0.5 text-xs ${ZONE_META[selectedZone].bg} ${ZONE_META[selectedZone].text}`}>
                    {selectedZone}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <GradientButton
            variant="outline"
            size="sm"
            leadingIcon={<Plus size={14} aria-hidden="true" />}
            onClick={addStakeholder}
          >
            Agregar stakeholder
          </GradientButton>
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

export default StakeholderAnalysis;
