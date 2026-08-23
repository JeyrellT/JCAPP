import { useMemo, useState } from 'react';
import { Search, CheckCircle2 } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { PHASE_ORDER, formatPhase } from '../../lib/phases';
import PhaseBadge from '../common/PhaseBadge';
import StatusBadge from '../common/StatusBadge';
import GradientButton from '../common/GradientButton';
import Notification from '../common/Notification';

/**
 * Planificador de herramientas del proyecto: añade herramientas del catálogo
 * al plan (`project.tools`), que hoy siempre contiene las 14 disponibles
 * para cualquier proyecto — "añadir" significa incorporarlas al plan real.
 * Sin cabecera ni overlay propios: se monta dentro de un `<Modal>`.
 *
 * @param {Object} props
 * @param {string} props.projectId
 * @param {Function} [props.onClose] - Se llama al cancelar o al terminar de añadir.
 * @param {Function} [props.onToolAdded] - Recibe el array de ids de herramientas añadidas.
 */
export default function AddToolForm({ projectId, onClose, onToolAdded }) {
  const { getProject, tools, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const planEntries = project?.tools || {};

  const filteredTools = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return tools.filter((tool) => {
      if (selectedPhase !== 'all' && tool.phase !== selectedPhase) return false;
      if (
        term &&
        !tool.name.toLowerCase().includes(term) &&
        !tool.description.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [tools, searchTerm, selectedPhase]);

  const toggleTool = (toolId) => {
    if (planEntries[toolId]) return; // ya está en el plan: no seleccionable
    setSelectedIds((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]));
  };

  const handleAdd = () => {
    if (!project || selectedIds.length === 0) return;
    setIsSubmitting(true);

    const nowIso = new Date().toISOString();
    const additions = Object.fromEntries(
      selectedIds.map((id) => [id, { status: 'not_started', updatedAt: nowIso, notes: '' }])
    );
    updateProject(projectId, { tools: { ...project.tools, ...additions } });

    const involvedPhases = [
      ...new Set(selectedIds.map((id) => formatPhase(tools.find((t) => t.id === id)?.phase))),
    ];
    const message =
      selectedIds.length === 1
        ? `Herramienta agregada a la fase ${involvedPhases[0]}`
        : `${selectedIds.length} herramientas agregadas al plan`;
    setNotice({ message, type: 'success' });

    // Deja ver la confirmación un momento antes de cerrar el modal.
    setTimeout(() => {
      onToolAdded?.(selectedIds);
      onClose?.();
    }, 900);
  };

  if (!project) return null;

  return (
    <div className="flex max-h-[70vh] flex-col">
      <Notification
        message={notice?.message}
        type={notice?.type || 'success'}
        show={Boolean(notice)}
        onClose={() => setNotice(null)}
        duration={2000}
      />

      <div className="flex flex-col gap-3 border-b border-line-subtle pb-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
            aria-hidden="true"
          />
          <label className="sr-only" htmlFor="add-tool-search">
            Buscar herramientas
          </label>
          <input
            id="add-tool-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar herramientas…"
            className="input w-full pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-content-secondary" htmlFor="add-tool-phase">
          Fase
          <select
            id="add-tool-phase"
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="input w-auto"
          >
            <option value="all">Todas</option>
            {PHASE_ORDER.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {filteredTools.length === 0 ? (
          <p className="py-8 text-center text-sm text-content-secondary">
            Ninguna herramienta coincide con la búsqueda o la fase seleccionada.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredTools.map((tool) => {
              const inPlan = Boolean(planEntries[tool.id]);
              const selected = selectedIds.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  disabled={inPlan}
                  onClick={() => toggleTool(tool.id)}
                  aria-pressed={selected}
                  className={`rounded-lg border p-3 text-left transition-colors duration-fast ${
                    inPlan
                      ? 'cursor-not-allowed border-line-subtle bg-surface-sunken opacity-70'
                      : selected
                        ? 'border-brand bg-brand/5'
                        : 'border-line hover:border-line-strong hover:bg-surface-sunken'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-content">{tool.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-content-secondary">{tool.description}</p>
                    </div>
                    {selected && !inPlan && (
                      <CheckCircle2 size={18} className="shrink-0 text-brand" aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <PhaseBadge phase={tool.phase} size="xs" />
                    {inPlan ? (
                      <StatusBadge status={planEntries[tool.id].status} kind="tool" size="xs" />
                    ) : selected ? (
                      <span className="text-xs font-medium text-brand">Seleccionada</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line-subtle pt-4">
        <p className="text-sm text-content-secondary">
          {selectedIds.length} herramienta{selectedIds.length === 1 ? '' : 's'} seleccionada
          {selectedIds.length === 1 ? '' : 's'}
        </p>
        <div className="flex gap-2">
          <GradientButton variant="ghost" onClick={onClose}>
            Cancelar
          </GradientButton>
          <GradientButton
            variant="solid"
            onClick={handleAdd}
            disabled={selectedIds.length === 0}
            loading={isSubmitting}
          >
            Añadir al plan
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
