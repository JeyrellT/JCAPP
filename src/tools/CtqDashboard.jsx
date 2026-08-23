import { useEffect, useRef, useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Download,
  HelpCircle,
  Check,
  Loader2,
  AlertTriangle,
  Sparkles,
  List,
  LayoutGrid,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatNumber, formatRelative } from '../lib/format';

const TOOL_ID = 'ctq';

// Forma canónica: la que siembra src/data/projects.js y la que usan los
// ejemplos de src/data/toolsData.js. Un requisito CTQ es un nodo del árbol
// "voz del cliente -> impulsor -> cómo se mide -> meta", no una serie de
// mediciones numéricas: eso es lo que de verdad exportan el JSON y la semilla.
const DEFAULT_DATA = {
  requirements: [],
};

const genId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyRequirement = () => ({ id: genId(), need: '', driver: '', measure: '', target: '' });

/**
 * Rescate de la clave legacy `project.ctqData` (forma antigua del
 * componente: name/category/uom/lsl/usl/target numéricos + measurements[]).
 * Se reconstruye lo mejor posible al modelo canónico need/driver/measure/target
 * para que quien ya tenía trabajo guardado no lo vea desaparecer.
 */
const legacyCtq = (project) => {
  const old = project?.ctqData;
  if (!old || !Array.isArray(old.requirements) || old.requirements.length === 0) return null;
  return {
    requirements: old.requirements.map((r) => {
      const specParts = [];
      if (r.target !== null && r.target !== undefined && r.target !== '') {
        specParts.push(`Meta: ${r.target}${r.uom ? ` ${r.uom}` : ''}`);
      }
      if (r.lsl !== null && r.lsl !== undefined && r.lsl !== '') {
        specParts.push(`LSL: ${r.lsl}${r.uom ? ` ${r.uom}` : ''}`);
      }
      if (r.usl !== null && r.usl !== undefined && r.usl !== '') {
        specParts.push(`USL: ${r.usl}${r.uom ? ` ${r.uom}` : ''}`);
      }
      return {
        id: r.id || genId(),
        need: r.name || '',
        driver: r.category || '',
        measure: r.description || r.uom || '',
        target: specParts.join(' · '),
      };
    }),
  };
};

const inputClass =
  'w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-content placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand';

const viewToggleClass = (active) =>
  `inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-fast ${
    active ? 'bg-brand text-brand-contrast' : 'text-content-secondary hover:bg-surface-sunken'
  }`;

/** Indicador de estado de guardado: máquina de estados única, sin `setTimeout` decorativo. */
function SaveStatus({ t }) {
  let icon = <span className="h-2 w-2 rounded-full bg-content-muted" aria-hidden="true" />;
  let text = 'Sin cambios';
  let tone = 'text-content-muted';

  if (t.error) {
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = 'No se pudo guardar';
    tone = 'text-danger-on';
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
    <p role="status" aria-live="polite" className={`flex items-center gap-2 text-sm tabular-nums ${tone}`}>
      {icon}
      <span>{text}</span>
      {t.error && (
        <button
          type="button"
          onClick={() => t.save()}
          className="font-medium text-brand underline underline-offset-2"
        >
          Reintentar
        </button>
      )}
    </p>
  );
}

/**
 * Dashboard CTQ (Critical to Quality): traduce la voz del cliente en
 * requisitos medibles (árbol necesidad -> impulsor -> cómo se mide -> meta).
 *
 * @param {Object} props
 * @param {string} props.projectId
 */
const CtqDashboard = ({ projectId }) => {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, { legacy: legacyCtq });
  const dashboardRef = useRef(null);

  const [showHelp, setShowHelp] = useState(false);
  const [view, setView] = useState('table');
  const [exporting, setExporting] = useState(false);

  // Modo ejemplo: el hook no lo gestiona, así que la vista guarda su propio
  // snapshot y nunca persiste nada hasta que el usuario decide adoptarlo.
  const [previewing, setPreviewing] = useState(false);
  const [confirmExampleOpen, setConfirmExampleOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const snapshotRef = useRef(null);

  // El texto relativo ("hace 3 minutos") se congela si nadie re-renderiza.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  if (!t.ready) return null;

  const requirements = t.data.requirements || [];
  const isEmpty = requirements.length === 0;

  const openExamplePrompt = () => {
    if (previewing) return;
    if (t.isDirty) {
      setConfirmExampleOpen(true);
      return;
    }
    startExample();
  };

  const startExample = () => {
    snapshotRef.current = t.data;
    t.loadExample(0);
    setPreviewing(true);
    setConfirmExampleOpen(false);
  };

  const adoptExample = () => {
    t.save();
    setPreviewing(false);
    snapshotRef.current = null;
  };

  const undoExample = () => {
    if (snapshotRef.current) t.setData(snapshotRef.current);
    setPreviewing(false);
    snapshotRef.current = null;
  };

  const requestCancel = () => {
    if (t.isDirty) setConfirmCancelOpen(true);
  };

  const confirmCancel = () => {
    t.discard();
    setPreviewing(false);
    setConfirmCancelOpen(false);
  };

  const addRequirement = () => {
    t.setData((prev) => ({ ...prev, requirements: [...prev.requirements, emptyRequirement()] }));
  };

  const updateRequirement = (id, fields) => {
    t.setData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) => (r.id === id ? { ...r, ...fields } : r)),
    }));
  };

  const deleteRequirement = (id) => {
    t.setData((prev) => ({ ...prev, requirements: prev.requirements.filter((r) => r.id !== id) }));
  };

  const exportAsImage = async () => {
    if (!dashboardRef.current || isEmpty) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, { backgroundColor: null, scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      const projectName = (t.project?.name || 'proyecto').replace(/\s+/g, '_');
      link.download = `ctq_${projectName}_${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (err) {
      console.error('[CtqDashboard] error al exportar imagen', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Barra: estado de guardado + acciones */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <SaveStatus t={t} />

        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && (
            <GradientButton
              variant="outline"
              size="sm"
              leadingIcon={<Sparkles size={14} />}
              onClick={openExamplePrompt}
              disabled={previewing}
            >
              Ver un ejemplo
            </GradientButton>
          )}
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="rounded-lg border border-line bg-surface p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken"
            aria-label="Mostrar ayuda del dashboard CTQ"
            aria-pressed={showHelp}
          >
            <HelpCircle size={16} />
          </button>
          <button
            type="button"
            onClick={exportAsImage}
            disabled={exporting || isEmpty}
            className="rounded-lg border border-line bg-surface p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Exportar dashboard CTQ como imagen PNG"
            title="Exportar PNG"
          >
            <Download size={16} />
          </button>
          {t.isDirty && (
            <GradientButton variant="outline" size="sm" onClick={requestCancel}>
              Cancelar
            </GradientButton>
          )}
          <GradientButton
            variant="success"
            size="sm"
            loading={t.isSaving}
            leadingIcon={!t.isSaving ? <Check size={14} /> : undefined}
            disabled={!t.isDirty || t.isSaving}
            onClick={() => t.save()}
          >
            Guardar
          </GradientButton>
        </div>
      </div>

      {/* Banner de modo ejemplo */}
      {previewing && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 ring-1 ring-inset ring-brand/20">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
              Ejemplo
            </span>
            <span className="font-medium text-content">{t.exampleTitles[0]}</span>
            <span className="text-content-secondary">
              Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GradientButton size="sm" variant="success" onClick={adoptExample}>
              Usar como punto de partida
            </GradientButton>
            <GradientButton size="sm" variant="outline" onClick={undoExample}>
              Deshacer
            </GradientButton>
          </div>
        </div>
      )}

      {/* Panel de ayuda */}
      {showHelp && (
        <div className="mb-6 rounded-lg border border-line bg-surface-sunken p-4 text-sm">
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-content">
            <HelpCircle size={16} aria-hidden="true" />
            Cómo se arma un árbol CTQ
          </h3>
          <div className="space-y-2 text-content-secondary">
            <p>
              <strong className="text-content">Necesidad del cliente:</strong> lo que el cliente pide, en sus
              propias palabras (voz del cliente).
            </p>
            <p>
              <strong className="text-content">Impulsor (driver):</strong> la categoría o dimensión de calidad
              detrás de esa necesidad (tiempo, exactitud, satisfacción…).
            </p>
            <p>
              <strong className="text-content">Cómo se mide:</strong> el indicador concreto que se va a rastrear.
            </p>
            <p>
              <strong className="text-content">Meta / especificación:</strong> el valor o rango que define si se
              cumple (ej. &ldquo;≥ 95%&rdquo;, &ldquo;≤ 30 días&rdquo;).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="mt-3 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-content-secondary hover:bg-surface-sunken"
          >
            Cerrar
          </button>
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          title="De la voz del cliente al requisito medible"
          description="Define características críticas para la calidad con meta y límite de especificación."
          action={
            <GradientButton onClick={addRequirement} leadingIcon={<Plus size={16} />}>
              Definir primer CTQ
            </GradientButton>
          }
          secondaryAction={
            t.hasExamples && !previewing ? (
              <GradientButton variant="outline" leadingIcon={<Sparkles size={16} />} onClick={openExamplePrompt}>
                Ver un ejemplo
              </GradientButton>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <Target size={16} className="text-brand" aria-hidden="true" />
              <span>
                <span className="tabular-nums font-semibold text-content">{formatNumber(requirements.length)}</span>{' '}
                {requirements.length === 1 ? 'requisito CTQ definido' : 'requisitos CTQ definidos'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setView('table')}
                  className={viewToggleClass(view === 'table')}
                  aria-pressed={view === 'table'}
                >
                  <List size={14} aria-hidden="true" />
                  <span>Tabla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView('tree')}
                  className={viewToggleClass(view === 'tree')}
                  aria-pressed={view === 'tree'}
                >
                  <LayoutGrid size={14} aria-hidden="true" />
                  <span>Árbol</span>
                </button>
              </div>
              <GradientButton size="sm" leadingIcon={<Plus size={14} />} onClick={addRequirement}>
                Agregar requisito
              </GradientButton>
            </div>
          </div>

          <div ref={dashboardRef}>
            {view === 'table' ? (
              <div className="overflow-x-auto rounded-lg border border-line">
                <table className="min-w-full divide-y divide-line text-sm">
                  <thead className="bg-surface-sunken">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-content-secondary">
                        Necesidad del cliente
                      </th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-content-secondary">
                        Impulsor (driver)
                      </th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-content-secondary">
                        Cómo se mide
                      </th>
                      <th scope="col" className="px-3 py-2 text-left font-medium text-content-secondary">
                        Meta / especificación
                      </th>
                      <th scope="col" className="px-3 py-2 text-center font-medium text-content-secondary">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-surface">
                    {requirements.map((req) => (
                      <tr key={req.id}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className={inputClass}
                            value={req.need}
                            onChange={(e) => updateRequirement(req.id, { need: e.target.value })}
                            placeholder="Ej. Resolución en primera llamada"
                            aria-label="Necesidad del cliente"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className={inputClass}
                            value={req.driver}
                            onChange={(e) => updateRequirement(req.id, { driver: e.target.value })}
                            placeholder="Ej. Eficiencia"
                            aria-label="Impulsor (driver)"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className={inputClass}
                            value={req.measure}
                            onChange={(e) => updateRequirement(req.id, { measure: e.target.value })}
                            placeholder="Ej. % de casos resueltos sin transferencia"
                            aria-label="Cómo se mide"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            className={`${inputClass} tabular-nums`}
                            value={req.target}
                            onChange={(e) => updateRequirement(req.id, { target: e.target.value })}
                            placeholder="Ej. ≥ 85%"
                            aria-label="Meta o especificación"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => deleteRequirement(req.id)}
                            aria-label={`Eliminar requisito ${req.need || 'sin nombre'}`}
                            className="rounded p-1.5 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requirements.map((req) => (
                  <div key={req.id} className="rounded-lg border border-line bg-surface p-4 shadow-xs">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-content">{req.need || 'Sin nombre'}</h3>
                      <button
                        type="button"
                        onClick={() => deleteRequirement(req.id)}
                        aria-label={`Eliminar requisito ${req.need || 'sin nombre'}`}
                        className="rounded p-1 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                    {req.driver && (
                      <span className="inline-block rounded-full bg-info-soft px-2 py-0.5 text-xs text-info-on">
                        {req.driver}
                      </span>
                    )}
                    <dl className="mt-3 space-y-2 text-xs">
                      <div>
                        <dt className="text-content-muted">Cómo se mide</dt>
                        <dd className="text-content">{req.measure || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-content-muted">Meta / especificación</dt>
                        <dd className="tabular-nums font-medium text-content">{req.target || '—'}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmación: cargar ejemplo con borrador sucio */}
      <Modal
        open={confirmExampleOpen}
        onClose={() => setConfirmExampleOpen(false)}
        title="¿Cargar el ejemplo?"
        description="Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar."
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmExampleOpen(false)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="success" onClick={startExample}>
              Ver el ejemplo
            </GradientButton>
          </>
        }
      />

      {/* Confirmación: descartar cambios sin guardar */}
      <Modal
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title="¿Descartar los cambios sin guardar?"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmCancelOpen(false)}>
              Seguir editando
            </GradientButton>
            <GradientButton variant="danger" onClick={confirmCancel}>
              Descartar
            </GradientButton>
          </>
        }
      />
    </div>
  );
};

export default CtqDashboard;
