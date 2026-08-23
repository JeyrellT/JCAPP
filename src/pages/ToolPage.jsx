import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Info, Maximize2, Minimize2, MoreHorizontal, Download, Link as LinkIcon, XCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import GradientButton from '../components/common/GradientButton';
import Dropdown from '../components/ui/Dropdown';
import Tooltip from '../components/ui/Tooltip';
import Notification from '../components/common/Notification';
import ErrorBoundary from '../components/common/ErrorBoundary';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import PhaseBadge from '../components/common/PhaseBadge';
import StatusBadge from '../components/common/StatusBadge';
import { SkeletonCard, SkeletonText } from '../components/common/Skeleton';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { PHASE_ORDER, normalizePhase, formatPhase } from '../lib/phases';
import { spring } from '../lib/motion';
import { exportProjectTool } from '../utils/export';

// Importar componentes de herramientas (lazy: cada uno en su propio chunk)
const ProjectCharter = lazy(() => import('../tools/ProjectCharter'));
const SipocViewer = lazy(() => import('../tools/SipocViewer'));
const VocVisualizer = lazy(() => import('../tools/VocVisualizer'));
const CtqDashboard = lazy(() => import('../tools/CtqDashboard'));
const ValueStreamMap = lazy(() => import('../tools/ValueStreamMap'));
const StakeholderAnalysis = lazy(() => import('../tools/StakeholderAnalysis'));
const PriorizationMatrix = lazy(() => import('../tools/PriorizationMatrix'));
const CauseEffectDiagram = lazy(() => import('../tools/CauseEffectDiagram'));
const ParetoChart = lazy(() => import('../tools/ParetoChart'));
const FmeaAnalysis = lazy(() => import('../tools/FmeaAnalysis'));
const ControlChart = lazy(() => import('../tools/ControlChart'));
const FiveS = lazy(() => import('../tools/FiveS'));
const RoiCalculator = lazy(() => import('../tools/RoiCalculator'));
const ProjectTimeline = lazy(() => import('../tools/ProjectTimeline'));

const STATUS_LABELS = { not_started: 'Sin iniciar', in_progress: 'En progreso', completed: 'Completada' };

const ToolPage = () => {
  const { projectId, toolId } = useParams();
  const { getProject, getTool, updateToolStatus, tools } = useLeanSixSigma();

  const project = getProject(projectId);
  const tool = getTool(toolId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [pulseKey, setPulseKey] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useDocumentTitle(project && tool ? `${tool.name} — ${project.name}` : undefined);

  // Escape cierra la pantalla completa.
  useEffect(() => {
    if (!isFullscreen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!project || !tool) {
    return (
      <PageContainer gap="lg">
        <EmptyState
          variant="no-encontrado"
          title="Herramienta no encontrada"
          description="El proyecto o la herramienta que buscas no existen, o el enlace está mal escrito."
          action={<GradientButton to="/projects">Ver proyectos</GradientButton>}
        />
      </PageContainer>
    );
  }

  const toolInProject = project.tools?.[toolId];
  const toolStatus = toolInProject?.status || 'not_started';

  // Navegación anterior/siguiente sobre el PLAN del proyecto, en orden DMAIC
  // (fórmula 0.4.3 adaptada a un recorrido secuencial en vez de "próxima pendiente").
  const planIds = Object.keys(project.tools || {});
  const orderedPlan = PHASE_ORDER.flatMap((phase) =>
    tools.filter((t) => planIds.includes(t.id) && normalizePhase(t.phase) === phase)
  );
  const currentPlanIndex = orderedPlan.findIndex((t) => t.id === toolId);
  const prevTool = currentPlanIndex > 0 ? orderedPlan[currentPlanIndex - 1] : null;
  const nextTool =
    currentPlanIndex >= 0 && currentPlanIndex < orderedPlan.length - 1 ? orderedPlan[currentPlanIndex + 1] : null;

  const handleToolStatusChange = (status) => {
    updateToolStatus(projectId, toolId, status);

    if (status === 'completed') {
      setPulseKey((k) => k + 1);

      const phaseKey = normalizePhase(tool.phase);
      const effectivePlanIds = planIds.includes(toolId) ? planIds : [...planIds, toolId];
      const phaseToolIds = effectivePlanIds.filter((id) => {
        const catalogTool = tools.find((t) => t.id === id);
        return catalogTool && normalizePhase(catalogTool.phase) === phaseKey;
      });
      const phaseComplete = phaseToolIds.every((id) => (id === toolId ? true : project.tools[id]?.status === 'completed'));

      if (phaseComplete) {
        setNotice({ message: `Fase ${formatPhase(tool.phase)} completada`, type: 'success' });
      } else {
        const nextPhase = PHASE_ORDER[PHASE_ORDER.indexOf(phaseKey) + 1];
        setNotice({
          message: nextPhase ? `${tool.name} completada — ${nextPhase} está más cerca` : `${tool.name} completada`,
          type: 'success',
        });
      }
    } else {
      setNotice({ message: `Estado actualizado: ${STATUS_LABELS[status] || status}`, type: 'info' });
    }
  };

  const handleDownloadJson = () => {
    const ok = exportProjectTool(project, toolId);
    setNotice(
      ok
        ? { message: 'Datos descargados en JSON', type: 'success' }
        : { message: 'Esta herramienta aún no tiene datos guardados en el proyecto', type: 'error' }
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice({ message: 'Enlace copiado al portapapeles', type: 'success' });
    } catch {
      setNotice({ message: 'No se pudo copiar el enlace', type: 'error' });
    }
  };

  // Función para renderizar el componente de la herramienta
  const renderToolComponent = () => {
    switch (tool.component) {
      case 'ProjectCharter':
        return <ProjectCharter projectId={projectId} />;
      case 'SipocViewer':
        return <SipocViewer projectId={projectId} />;
      case 'VocVisualizer':
        return <VocVisualizer projectId={projectId} />;
      case 'CtqDashboard':
        return <CtqDashboard projectId={projectId} />;
      case 'ValueStreamMap':
        return <ValueStreamMap projectId={projectId} />;
      case 'StakeholderAnalysis':
        return <StakeholderAnalysis projectId={projectId} />;
      case 'PriorizationMatrix':
        return <PriorizationMatrix projectId={projectId} />;
      case 'CauseEffectDiagram':
        return <CauseEffectDiagram projectId={projectId} />;
      case 'ParetoChart':
        return <ParetoChart projectId={projectId} />;
      case 'FmeaAnalysis':
        return <FmeaAnalysis projectId={projectId} />;
      case 'ControlChart':
        return <ControlChart projectId={projectId} />;
      case 'FiveS':
        return <FiveS projectId={projectId} />;
      case 'RoiCalculator':
        return <RoiCalculator projectId={projectId} />;
      case 'ProjectTimeline':
        return <ProjectTimeline projectId={projectId} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-sunken">
              <XCircle size={32} className="text-content-muted" aria-hidden="true" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-content">Componente no implementado</h3>
            <p className="max-w-md text-content-secondary">
              El componente para esta herramienta aún no está implementado. Estamos trabajando en ello.
            </p>
          </div>
        );
    }
  };

  const infoContent = (
    <div className="space-y-3 text-left">
      <p className="text-sm text-content-secondary">{tool.description}</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-medium text-content">Categoría</p>
          <p className="text-content-secondary">{tool.category}</p>
        </div>
        <div>
          <p className="font-medium text-content">Dificultad</p>
          <p className="text-content-secondary">{tool.difficulty}</p>
        </div>
      </div>
      {tool.bestPractices?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-content">Buenas prácticas</p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-content-secondary">
            {tool.bestPractices.slice(0, 3).map((practice) => (
              <li key={practice}>{practice}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const menuItems = [
    { id: 'download', label: 'Descargar JSON', icon: Download, onSelect: handleDownloadJson },
    { id: 'copy-link', label: 'Copiar enlace', icon: LinkIcon, onSelect: handleCopyLink },
  ];

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-modal overflow-y-auto bg-app p-4 sm:p-6' : ''}>
      <Notification
        message={notice?.message}
        type={notice?.type || 'info'}
        show={Boolean(notice)}
        onClose={() => setNotice(null)}
        duration={3000}
      />

      <PageContainer gap="lg">
        <PageHeader
          breadcrumbs={[
            { label: 'Proyectos', to: '/projects' },
            { label: project.name, to: `/projects/${projectId}` },
            { label: tool.name },
          ]}
          title={tool.name}
          description={tool.description}
          meta={
            <>
              <PhaseBadge phase={tool.phase} />
              <motion.span
                key={pulseKey}
                initial={shouldReduceMotion ? false : { scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={spring}
              >
                <StatusBadge status={toolStatus} kind="tool" />
              </motion.span>
            </>
          }
          actions={
            <>
              <GradientButton
                variant="outline"
                size="sm"
                disabled={!prevTool}
                to={prevTool ? `/projects/${projectId}/tools/${prevTool.id}` : undefined}
              >
                Anterior
              </GradientButton>
              <GradientButton
                variant="outline"
                size="sm"
                disabled={!nextTool}
                to={nextTool ? `/projects/${projectId}/tools/${nextTool.id}` : undefined}
              >
                Siguiente
              </GradientButton>

              <label className="sr-only" htmlFor="tool-status-select">
                Estado de la herramienta
              </label>
              <select
                id="tool-status-select"
                value={toolStatus}
                onChange={(e) => handleToolStatusChange(e.target.value)}
                className="input h-9 w-auto text-sm"
              >
                <option value="not_started">Sin iniciar</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completada</option>
              </select>

              <Tooltip content={infoContent} interactive side="bottom" maxWidth={320}>
                <button
                  type="button"
                  className="rounded-lg border border-line bg-surface p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken"
                  aria-label="Información de la herramienta"
                >
                  <Info size={16} />
                </button>
              </Tooltip>

              <button
                type="button"
                onClick={() => setIsFullscreen((v) => !v)}
                className="rounded-lg border border-line bg-surface p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <Dropdown
                trigger={
                  <button
                    type="button"
                    className="rounded-lg border border-line bg-surface p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken"
                    aria-label="Más opciones"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                }
                items={menuItems}
                align="end"
              />
            </>
          }
        />

        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
          <ErrorBoundary resetKeys={[toolId, projectId]}>
            <Suspense
              fallback={
                <div role="status" aria-busy="true" className="space-y-4 p-8">
                  <span className="sr-only">Cargando…</span>
                  <SkeletonCard />
                  <SkeletonText lines={4} />
                </div>
              }
            >
              {renderToolComponent()}
            </Suspense>
          </ErrorBoundary>
        </div>
      </PageContainer>
    </div>
  );
};

export default ToolPage;
