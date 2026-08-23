import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { PHASE_ORDER, normalizePhase, formatPhase } from '../../lib/phases';
import PhaseBadge from './PhaseBadge';

// Prerrequisitos de dominio entre herramientas (lógica de negocio, no de UI).
const TOOL_PREREQUISITES = {
  'project-charter': [],
  sipoc: ['project-charter'],
  voc: ['project-charter'],
  'stakeholder-analysis': ['project-charter'],
  ctq: ['voc'],
  'value-stream-map': ['sipoc'],
  'cause-effect-diagram': ['sipoc'],
  'pareto-chart': ['ctq', 'value-stream-map'],
  fmea: ['cause-effect-diagram'],
  'prioritization-matrix': ['pareto-chart', 'cause-effect-diagram'],
  '5s': [],
  'control-chart': ['pareto-chart', 'ctq'],
  'roi-calculator': ['value-stream-map'],
  'project-timeline': ['project-charter', 'sipoc'],
};

// Secuencias óptimas de mejores prácticas: si los pasos previos ya están
// completados, la siguiente herramienta de la secuencia recibe un bonus y
// ese es el motivo que se muestra (más específico que el genérico de fase).
const OPTIMAL_SEQUENCES = [
  {
    sequence: ['project-charter', 'sipoc', 'value-stream-map'],
    bonus: 15,
    message: 'Sigue la secuencia recomendada para mapear el proceso',
  },
  {
    sequence: ['project-charter', 'stakeholder-analysis', 'voc', 'ctq'],
    bonus: 15,
    message: 'Continúa la secuencia enfocada en los requisitos del cliente',
  },
  {
    sequence: ['value-stream-map', 'cause-effect-diagram', 'pareto-chart', 'prioritization-matrix'],
    bonus: 10,
    message: 'Continúa el análisis y la priorización de problemas',
  },
  {
    sequence: ['prioritization-matrix', 'fmea', '5s'],
    bonus: 10,
    message: 'Sigue la secuencia para implementar la mejora',
  },
  {
    sequence: ['fmea', 'control-chart', 'roi-calculator'],
    bonus: 10,
    message: 'Continúa para controlar y cuantificar el beneficio',
  },
];

function getPhaseOrderIndex(phase) {
  const idx = PHASE_ORDER.indexOf(normalizePhase(phase));
  return idx === -1 ? 0 : idx + 1;
}

function getSequenceBonus(toolId, completedIds) {
  let maxBonus = 0;
  let message = '';
  OPTIMAL_SEQUENCES.forEach(({ sequence, bonus, message: msg }) => {
    const idx = sequence.indexOf(toolId);
    if (idx <= 0) return; // debe ser una continuación, no el primer paso de la secuencia
    const previousCompleted = sequence.slice(0, idx).every((id) => completedIds.includes(id));
    if (previousCompleted && bonus > maxBonus) {
      maxBonus = bonus;
      message = msg;
    }
  });
  return { bonus: maxBonus, message };
}

// Motor de puntuación: para cada herramienta del catálogo aún no completada,
// calcula un puntaje y un motivo (una frase) según la fase del proyecto, los
// prerrequisitos y las secuencias óptimas de mejores prácticas.
function buildRecommendations(project, catalog) {
  if (!project) return [];

  const projectPhase = normalizePhase(project.phase);
  const projectPhaseOrder = getPhaseOrderIndex(projectPhase);
  const planEntries = project.tools || {};
  const completedIds = Object.keys(planEntries).filter((id) => planEntries[id].status === 'completed');
  const inProgressIds = Object.keys(planEntries).filter((id) => planEntries[id].status === 'in_progress');

  const scored = catalog
    .filter((tool) => !completedIds.includes(tool.id))
    .map((tool) => {
      let score = 50;
      let reason = `Pertenece a una fase futura (${formatPhase(tool.phase)})`;

      if (normalizePhase(tool.phase) === projectPhase) {
        score += 25;
        reason = `Corresponde a la fase actual del proyecto (${formatPhase(tool.phase)})`;
      } else if (getPhaseOrderIndex(tool.phase) < projectPhaseOrder) {
        score += 15;
        reason = `Herramienta pendiente de una fase anterior (${formatPhase(tool.phase)})`;
      } else {
        score -= 10;
      }

      if (inProgressIds.includes(tool.id)) {
        score += 30;
        reason = 'Ya la comenzaste: retómala para avanzar';
      }

      const prerequisites = TOOL_PREREQUISITES[tool.id] || [];
      if (prerequisites.length > 0) {
        const completedPrereqs = prerequisites.filter((id) => completedIds.includes(id));
        const pct = completedPrereqs.length / prerequisites.length;
        if (pct === 1) score += 20;
        else if (pct === 0) score -= 25;
      }

      const { bonus, message } = getSequenceBonus(tool.id, completedIds);
      if (bonus > 0) {
        score += bonus;
        reason = message;
      }

      return { tool, score, reason };
    });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Sistema de recomendación de herramientas Lean Six Sigma. Sugiere las
 * siguientes herramientas a usar según la fase actual del proyecto, las ya
 * completadas/en progreso y las secuencias recomendadas de buenas prácticas.
 *
 * @param {Object} props
 * @param {string} props.projectId
 * @param {number} [props.limit=3] - Máximo de sugerencias a mostrar.
 * @param {string} [props.className]
 */
export default function ToolRecommendation({ projectId, limit = 3, className = '' }) {
  const { getProject, tools } = useLeanSixSigma();
  const project = getProject(projectId);

  const recommendations = useMemo(
    () => (project ? buildRecommendations(project, tools).slice(0, limit) : []),
    [project, tools, limit]
  );

  if (!project) return null;

  return (
    <div className={`card p-5 ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb size={18} className="text-brand" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-content">Siguientes pasos sugeridos</h3>
      </div>

      {recommendations.length > 0 ? (
        <ul className="space-y-2.5">
          {recommendations.map(({ tool, reason }) => (
            <li key={tool.id}>
              <Link
                to={`/projects/${projectId}/tools/${tool.id}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-line p-3 transition-colors duration-fast hover:border-line-strong hover:bg-surface-sunken"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PhaseBadge phase={tool.phase} showLabel={false} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">{tool.name}</p>
                    <p className="truncate text-xs text-content-secondary">{reason}</p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-content-muted transition-transform duration-fast group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-content-secondary">No hay más recomendaciones por ahora: vas al día con el plan.</p>
      )}
    </div>
  );
}
