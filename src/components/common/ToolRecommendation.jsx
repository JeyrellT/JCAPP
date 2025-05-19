import React, { useState, useEffect } from 'react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Lightbulb,
  Wrench,
  CheckCircle,
  ArrowRight,
  Info,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Sistema de recomendación de herramientas Lean Six Sigma
 * 
 * Recomienda la siguiente herramienta a utilizar basándose en:
 * - La fase actual del proyecto
 * - Las herramientas ya completadas
 * - El nivel de dificultad apropiado
 * - Las mejores prácticas de Lean Six Sigma
 */
const ToolRecommendation = ({ projectId }) => {
  const { getProject, getTool, getTools, updateToolStatus } = useLeanSixSigma();
  const { isDark } = useTheme();
  const project = getProject(projectId);
  const allTools = getTools();
  
  // Estados
  const [recommendations, setRecommendations] = useState([]);
  const [showDetails, setShowDetails] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  
  // Genera recomendaciones cuando cambia el proyecto
  useEffect(() => {
    if (project) {
      generateRecommendations();
    }
  }, [project]);
  
  // Sistema de reglas para recomendaciones
  const generateRecommendations = () => {
    if (!project) return;
    
    const projectPhase = project.phase; // Fase actual del proyecto
    const completedTools = Object.keys(project.tools || {})
      .filter(id => project.tools[id].status === 'completed')
      .map(id => allTools.find(tool => tool.id === id))
      .filter(Boolean);
    
    const inProgressTools = Object.keys(project.tools || {})
      .filter(id => project.tools[id].status === 'in_progress')
      .map(id => allTools.find(tool => tool.id === id))
      .filter(Boolean);
    
    const notStartedTools = Object.keys(project.tools || {})
      .filter(id => !project.tools[id] || project.tools[id].status === 'not_started')
      .map(id => allTools.find(tool => tool.id === id))
      .filter(Boolean);
    
    // Obtener todas las herramientas por fase
    const toolsByPhase = {
      'Define': allTools.filter(tool => tool.phase === 'Define'),
      'Measure': allTools.filter(tool => tool.phase === 'Measure'),
      'Analyze': allTools.filter(tool => tool.phase === 'Analyze'),
      'Improve': allTools.filter(tool => tool.phase === 'Improve'),
      'Control': allTools.filter(tool => tool.phase === 'Control')
    };
    
    // Array para almacenar las recomendaciones con puntajes
    let recommendationsWithScores = [];
    
    // Aplicar reglas de recomendación
    allTools.forEach(tool => {
      // Ignorar herramientas ya completadas
      if (completedTools.some(t => t.id === tool.id)) {
        return;
      }
      
      // Base inicial de puntaje
      let score = 50;
      let reasons = [];
      
      // Regla 1: Priorizar herramientas de la fase actual
      if (tool.phase === projectPhase) {
        score += 30;
        reasons.push(`Corresponde a la fase actual del proyecto (${projectPhase})`);
      } else if (getPhaseOrder(tool.phase) < getPhaseOrder(projectPhase)) {
        // Herramientas de fases anteriores no completadas
        score += 20;
        reasons.push(`Herramienta importante de la fase ${tool.phase} que aún no se ha completado`);
      } else if (getPhaseOrder(tool.phase) > getPhaseOrder(projectPhase)) {
        // Penalizar un poco herramientas de fases futuras
        score -= 10;
        reasons.push(`Pertenece a una fase futura (${tool.phase})`);
      }
      
      // Regla 2: Priorizar herramientas que ya estén en progreso
      if (inProgressTools.some(t => t.id === tool.id)) {
        score += 25;
        reasons.push('Ya has comenzado a trabajar en esta herramienta');
      }
      
      // Regla 3: Verificar prerrequisitos completados
      const prerequisites = getToolPrerequisites(tool.id);
      const completedPrereqs = prerequisites.filter(p => 
        completedTools.some(t => t.id === p)
      );
      
      if (prerequisites.length > 0) {
        const prereqPercentage = (completedPrereqs.length / prerequisites.length) * 100;
        
        if (prereqPercentage === 100) {
          score += 20;
          reasons.push('Todos los prerrequisitos están completados');
        } else if (prereqPercentage >= 50) {
          score += 10;
          reasons.push(`El ${prereqPercentage.toFixed(0)}% de los prerrequisitos están completados`);
        } else if (prereqPercentage === 0 && prerequisites.length > 0) {
          score -= 30;
          reasons.push('No se ha completado ningún prerrequisito necesario');
        }
      }
      
      // Regla 4: Considerar dificultad
      if (tool.difficulty === 'Baja') {
        // Herramientas fáciles pueden ser buenas para empezar
        score += 5;
        reasons.push('Herramienta de baja dificultad, buena para avanzar rápido');
      } else if (tool.difficulty === 'Alta') {
        // Herramientas complejas requieren más preparación
        const easyToolsCompleted = completedTools.filter(t => t.difficulty === 'Baja').length;
        const mediumToolsCompleted = completedTools.filter(t => t.difficulty === 'Media').length;
        
        if (easyToolsCompleted + mediumToolsCompleted < 3) {
          score -= 15;
          reasons.push('Herramienta avanzada que requiere experiencia previa');
        } else {
          score += 10;
          reasons.push('Herramienta avanzada para la que ya tienes suficiente experiencia');
        }
      }
      
      // Regla 5: Herramientas básicas fundamentales
      if (tool.category === 'Básica' && getPhaseOrder(tool.phase) <= getPhaseOrder(projectPhase)) {
        score += 15;
        reasons.push('Herramienta fundamental para cualquier proyecto Lean Six Sigma');
      }
      
      // Regla 6: Considerar secuencias específicas DMAIC
      score += getSequenceBonus(tool.id, completedTools, reasons);
      
      // Añadir a la lista con puntaje y razones
      recommendationsWithScores.push({
        tool,
        score,
        reasons
      });
    });
    
    // Ordenar por puntaje y tomar las 3 mejores recomendaciones
    recommendationsWithScores.sort((a, b) => b.score - a.score);
    setRecommendations(recommendationsWithScores.slice(0, 3));
  };
  
  // Obtener el orden numérico de la fase DMAIC
  const getPhaseOrder = (phase) => {
    const phases = {
      'Define': 1,
      'Measure': 2,
      'Analyze': 3,
      'Improve': 4,
      'Control': 5
    };
    return phases[phase] || 0;
  };
  
  // Obtener prerrequisitos para cada herramienta
  const getToolPrerequisites = (toolId) => {
    // Definir las dependencias entre herramientas
    const prerequisites = {
      'project-charter': [],
      'sipoc': ['project-charter'],
      'voc': ['project-charter'],
      'stakeholder-analysis': ['project-charter'],
      'ctq': ['voc'],
      'value-stream-map': ['sipoc'],
      'cause-effect-diagram': ['sipoc'],
      'pareto-chart': ['ctq', 'value-stream-map'],
      'fmea': ['cause-effect-diagram'],
      'prioritization-matrix': ['pareto-chart', 'cause-effect-diagram'],
      '5s': [],
      'control-chart': ['pareto-chart', 'ctq'],
      'roi-calculator': ['value-stream-map'],
      'project-timeline': ['project-charter', 'sipoc']
    };
    
    return prerequisites[toolId] || [];
  };
  
  // Bonus por secuencias específicas de mejores prácticas
  const getSequenceBonus = (toolId, completedTools, reasons) => {
    // Definir secuencias óptimas con bonus
    const optimalSequences = [
      {
        sequence: ['project-charter', 'sipoc', 'value-stream-map'],
        bonus: 15,
        message: 'Secuencia recomendada para mapear y entender el proceso'
      },
      {
        sequence: ['project-charter', 'stakeholder-analysis', 'voc', 'ctq'],
        bonus: 15,
        message: 'Secuencia óptima para enfocarse en los requerimientos del cliente'
      },
      {
        sequence: ['value-stream-map', 'cause-effect-diagram', 'pareto-chart', 'prioritization-matrix'],
        bonus: 10,
        message: 'Flujo de análisis y priorización de problemas'
      },
      {
        sequence: ['prioritization-matrix', 'fmea', '5s'],
        bonus: 10,
        message: 'Secuencia efectiva para implementar mejoras'
      },
      {
        sequence: ['fmea', 'control-chart', 'roi-calculator'],
        bonus: 10,
        message: 'Secuencia para controlar y cuantificar beneficios'
      }
    ];
    
    let maxBonus = 0;
    let maxMessage = '';
    
    // Verificar si la herramienta es el siguiente paso en alguna secuencia óptima
    optimalSequences.forEach(({ sequence, bonus, message }) => {
      // Obtener el índice de la herramienta actual en la secuencia
      const toolIndex = sequence.indexOf(toolId);
      
      // Si la herramienta no está en la secuencia, saltar
      if (toolIndex === -1) return;
      
      // Si está en la secuencia, verificar si los pasos anteriores están completados
      if (toolIndex > 0) {
        const previousSteps = sequence.slice(0, toolIndex);
        const allPreviousCompleted = previousSteps.every(step => 
          completedTools.some(t => t.id === step)
        );
        
        if (allPreviousCompleted) {
          if (bonus > maxBonus) {
            maxBonus = bonus;
            maxMessage = message;
          }
        }
      }
    });
    
    if (maxBonus > 0) {
      reasons.push(maxMessage);
    }
    
    return maxBonus;
  };
  
  // Generar la URL de la herramienta
  const getToolUrl = (toolId) => {
    return `/projects/${projectId}/tools/${toolId}`;
  };
  
  // Si no hay proyecto, mostrar cargando
  if (!project) {
    return <div>Cargando recomendaciones...</div>;
  }
  
  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div
        className={`flex justify-between items-center p-4 cursor-pointer ${
          isDark ? 'bg-indigo-800' : 'bg-indigo-600'
        } text-white`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Lightbulb className="mr-2" />
          <h3 className="text-lg font-semibold">Asistente de Recomendaciones</h3>
        </div>
        <div className="transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}>
          <ChevronRight />
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <p className="text-sm mb-4">
                Basado en tu fase actual <strong>({project.phase})</strong> y el progreso de tu proyecto,
                te recomendamos las siguientes herramientas:
              </p>
              
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map(({ tool, score, reasons }) => (
                    <div 
                      key={tool.id}
                      className={`p-4 rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div 
                            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-3 ${
                              score > 80 ? 'bg-green-100 text-green-700' : 
                              score > 60 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <Wrench size={18} />
                          </div>
                          
                          <div>
                            <h4 className="font-medium">{tool.name}</h4>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs mr-2 ${
                                tool.phase === 'Define' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                tool.phase === 'Measure' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                tool.phase === 'Analyze' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                tool.phase === 'Improve' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {tool.phase}
                              </span>
                              <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                {tool.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => setShowDetails(showDetails === tool.id ? null : tool.id)}
                            aria-label="Mostrar detalles"
                          >
                            <Info size={16} />
                          </button>
                          <a
                            href={getToolUrl(tool.id)}
                            className={`inline-flex items-center px-3 py-1 rounded-md text-sm ${
                              score > 80 ? 'bg-green-600 hover:bg-green-700' : 
                              score > 60 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                            } text-white transition-colors`}
                          >
                            <span>Usar</span>
                            <ArrowRight size={14} className="ml-1" />
                          </a>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {showDetails === tool.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className={`mt-3 text-sm p-3 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                              <p className="mb-2 text-gray-600 dark:text-gray-300">{tool.description}</p>
                              <div className="mt-3">
                                <h5 className="font-medium mb-1 text-xs uppercase text-gray-500 dark:text-gray-400">Por qué recomendamos esta herramienta:</h5>
                                <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                  {reasons.map((reason, idx) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 text-gray-500 dark:text-gray-400">
                    <p>No tenemos recomendaciones adicionales en este momento.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolRecommendation;
