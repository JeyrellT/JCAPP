import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Menu, Wrench, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import tools from '../../data/tools';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { PHASE_ORDER } from '../../lib/phases';
import { still, transition } from '../../lib/motion';
import PhaseBadge from '../common/PhaseBadge';
import StatusBadge from '../common/StatusBadge';

// Fondo del overlay: mismo valor literal que usa Modal.jsx (no hay token de
// color para esto en el sistema, así que se replica el mismo RGB estático).
const OVERLAY_BG = 'bg-[rgb(12_17_22_/_0.5)] backdrop-blur-[2px]';

/**
 * Navegación flotante entre las herramientas del catálogo de Lean Six
 * Sigma. La monta `src/tools/CauseEffectDiagram.jsx` (fuera de este
 * carril) — las props no cambian: `{ currentTool, projectId }`.
 *
 * `currentTool` puede ser el id exacto del catálogo o un prefijo suyo
 * (compatibilidad con llamadores que pasan un alias corto).
 *
 * @param {Object} props
 * @param {string} props.currentTool - Id (o prefijo de id) de la herramienta activa.
 * @param {string} props.projectId - Id del proyecto actual.
 */
const ToolsNavigation = ({ currentTool, projectId }) => {
  const { getProject } = useLeanSixSigma();
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const project = getProject(projectId);

  // Todo el catálogo con componente enrutado, en el orden de src/data/tools.js.
  const navigationTools = tools.filter((tool) => Boolean(tool.component));

  const isCurrentTool = (id) => id === currentTool || id.startsWith(currentTool);
  const currentIndex = navigationTools.findIndex((tool) => isCurrentTool(tool.id));

  const prevTool = currentIndex > 0 ? navigationTools[currentIndex - 1] : null;
  const nextTool =
    currentIndex >= 0 && currentIndex < navigationTools.length - 1 ? navigationTools[currentIndex + 1] : null;

  const toolPath = (id) => `/projects/${projectId}/tools/${id}`;
  const toolStatus = (id) => project?.tools?.[id]?.status || 'not_started';

  const groupedTools = PHASE_ORDER.map((phase) => ({
    phase,
    items: navigationTools.filter((tool) => tool.phase === phase),
  })).filter((group) => group.items.length > 0);

  const overlayVariants = shouldReduceMotion
    ? still
    : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: transition.base }, exit: { opacity: 0, transition: transition.fast } };

  const panelVariants = shouldReduceMotion
    ? still
    : {
        hidden: { opacity: 0, y: 16, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: transition.enter },
        exit: { opacity: 0, y: 8, scale: 0.98, transition: transition.exit },
      };

  return (
    <>
      {/* Barra flotante: volver, abrir menú, atajos de anterior/siguiente. */}
      <div className="fixed bottom-6 left-1/2 z-dropdown -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-lg">
          <Link
            to={`/projects/${projectId}`}
            className="rounded-full p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
            title="Volver al proyecto"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="ml-1 inline-flex items-center gap-2 rounded-full bg-brand px-3 py-2 text-sm font-medium text-brand-contrast transition-colors duration-fast hover:bg-brand-hover"
            aria-expanded={isOpen}
          >
            <Menu size={18} aria-hidden="true" />
            Herramientas
          </button>

          {prevTool && (
            <Link
              to={toolPath(prevTool.id)}
              className="ml-1 hidden items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-2 text-xs text-content-secondary transition-colors duration-fast hover:bg-surface-raised sm:flex"
              title={`Anterior: ${prevTool.name}`}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              {prevTool.name}
            </Link>
          )}

          {nextTool && (
            <Link
              to={toolPath(nextTool.id)}
              className="ml-1 hidden items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-2 text-xs text-content-secondary transition-colors duration-fast hover:bg-surface-raised sm:flex"
              title={`Siguiente: ${nextTool.name}`}
            >
              {nextTool.name}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      {/* Menú completo, agrupado por fase DMAIC. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className={`fixed inset-0 z-modal flex items-end justify-center p-4 sm:items-center ${OVERLAY_BG}`}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              variants={panelVariants}
              className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-content">
                  <Wrench size={18} aria-hidden="true" />
                  Herramientas Lean Six Sigma
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1 text-content-muted transition-colors duration-fast hover:text-content"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                {groupedTools.map(({ phase, items }) => (
                  <div key={phase}>
                    <div className="mb-2">
                      <PhaseBadge phase={phase} size="xs" />
                    </div>
                    <div className="space-y-1.5">
                      {items.map((tool) => {
                        const isCurrent = isCurrentTool(tool.id);
                        return (
                          <Link
                            key={tool.id}
                            to={toolPath(tool.id)}
                            aria-current={isCurrent ? 'page' : undefined}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-fast ${
                              isCurrent
                                ? 'bg-brand/10 font-medium text-brand'
                                : 'text-content-secondary hover:bg-surface-sunken hover:text-content'
                            }`}
                          >
                            <span className="truncate">{tool.name}</span>
                            <StatusBadge status={toolStatus(tool.id)} kind="tool" size="xs" withDot={false} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 text-center">
                <Link
                  to={`/projects/${projectId}`}
                  className="inline-flex items-center gap-1.5 rounded text-sm text-brand transition-colors duration-fast hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  Volver al proyecto
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ToolsNavigation;
