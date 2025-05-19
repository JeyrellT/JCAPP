import html2canvas from 'html2canvas';

import { useState, useEffect, useRef } from 'react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { motion } from 'framer-motion';
import {
  Save,
  Edit,
  Plus,
  Trash2,
  Download,
  HelpCircle,
  CheckSquare,
  ListFilter,
  Filter,
  Copy,
  ArrowUpRight,
  Square,
  Move
} from 'lucide-react';

/**
 * Componente Matriz de Priorización
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const PriorizationMatrix = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const matrixRef = useRef(null);

  // Estado para la matriz de priorización
  const [priorityMatrix, setPriorityMatrix] = useState(() => {
    return project?.priorityMatrix || {
      criteria: [],
      options: [],
      weights: {},
      scores: {}
    };
  });

  // Estados de UI
  const [editMode, setEditMode] = useState(!project?.priorityMatrix);
  const [activeTab, setActiveTab] = useState('matrix');
  const [showHelp, setShowHelp] = useState(false);
  const [draggedOption, setDraggedOption] = useState(null);

  // Actualizar el proyecto cuando cambia la matriz
  useEffect(() => {
    if (!editMode && project) {
      updateProject(projectId, { priorityMatrix });
    }
  }, [editMode]);

  // Función para añadir un nuevo criterio
  const addCriterion = () => {
    const newCriterion = {
      id: `criterion-${Date.now()}`,
      name: 'Nuevo Criterio',
      description: '',
      weight: 5
    };
    
    const newWeights = { ...priorityMatrix.weights };
    newWeights[newCriterion.id] = newCriterion.weight;
    
    setPriorityMatrix(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion],
      weights: newWeights
    }));
  };

  // Función para actualizar un criterio
  const updateCriterion = (id, data) => {
    setPriorityMatrix(prev => {
      const updatedCriteria = prev.criteria.map(criterion => 
        criterion.id === id ? { ...criterion, ...data } : criterion
      );
      
      // Si cambia el peso, actualizamos también el objeto de pesos
      const updatedWeights = { ...prev.weights };
      if (data.weight !== undefined) {
        updatedWeights[id] = data.weight;
      }
      
      return {
        ...prev,
        criteria: updatedCriteria,
        weights: updatedWeights
      };
    });
  };

  // Función para eliminar un criterio
  const deleteCriterion = (id) => {
    setPriorityMatrix(prev => {
      // Eliminamos el criterio del array
      const updatedCriteria = prev.criteria.filter(criterion => criterion.id !== id);
      
      // Eliminamos los pesos y puntuaciones relacionados
      const updatedWeights = { ...prev.weights };
      delete updatedWeights[id];
      
      const updatedScores = { ...prev.scores };
      Object.keys(updatedScores).forEach(optionId => {
        if (updatedScores[optionId] && updatedScores[optionId][id]) {
          delete updatedScores[optionId][id];
        }
      });
      
      return {
        ...prev,
        criteria: updatedCriteria,
        weights: updatedWeights,
        scores: updatedScores
      };
    });
  };

  // Función para añadir una nueva opción
  const addOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      name: 'Nueva Opción',
      description: '',
      category: 'General'
    };
    
    // Inicializamos las puntuaciones para esta opción
    const updatedScores = { ...priorityMatrix.scores };
    updatedScores[newOption.id] = {};
    priorityMatrix.criteria.forEach(criterion => {
      updatedScores[newOption.id][criterion.id] = 3; // Valor por defecto
    });
    
    setPriorityMatrix(prev => ({
      ...prev,
      options: [...prev.options, newOption],
      scores: updatedScores
    }));
  };

  // Función para actualizar una opción
  const updateOption = (id, data) => {
    setPriorityMatrix(prev => ({
      ...prev,
      options: prev.options.map(option => 
        option.id === id ? { ...option, ...data } : option
      )
    }));
  };

  // Función para eliminar una opción
  const deleteOption = (id) => {
    setPriorityMatrix(prev => {
      // Eliminamos la opción del array
      const updatedOptions = prev.options.filter(option => option.id !== id);
      
      // Eliminamos las puntuaciones relacionadas
      const updatedScores = { ...prev.scores };
      delete updatedScores[id];
      
      return {
        ...prev,
        options: updatedOptions,
        scores: updatedScores
      };
    });
  };

  // Función para actualizar una puntuación
  const updateScore = (optionId, criterionId, score) => {
    setPriorityMatrix(prev => {
      const updatedScores = { ...prev.scores };
      
      if (!updatedScores[optionId]) {
        updatedScores[optionId] = {};
      }
      
      updatedScores[optionId][criterionId] = parseInt(score);
      
      return {
        ...prev,
        scores: updatedScores
      };
    });
  };

  // Función para normalizar los pesos de los criterios (sumar 100%)
  const normalizeWeights = () => {
    const totalWeight = priorityMatrix.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    
    if (totalWeight === 0) return;
    
    setPriorityMatrix(prev => {
      const updatedCriteria = prev.criteria.map(criterion => ({
        ...criterion,
        weight: Math.round((criterion.weight / totalWeight) * 100)
      }));
      
      const updatedWeights = {};
      updatedCriteria.forEach(criterion => {
        updatedWeights[criterion.id] = criterion.weight;
      });
      
      return {
        ...prev,
        criteria: updatedCriteria,
        weights: updatedWeights
      };
    });
  };

  // Función para calcular la puntuación total ponderada para una opción
  const calculateWeightedScore = (optionId) => {
    if (!priorityMatrix.scores[optionId]) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    priorityMatrix.criteria.forEach(criterion => {
      const weight = priorityMatrix.weights[criterion.id] || 0;
      const score = priorityMatrix.scores[optionId][criterion.id] || 0;
      
      totalScore += weight * score;
      totalWeight += weight;
    });
    
    return totalWeight === 0 ? 0 : Math.round((totalScore / totalWeight) * 10) / 10;
  };

  // Obtener opciones ordenadas por puntuación
  const getRankedOptions = () => {
    return [...priorityMatrix.options]
      .map(option => ({
        ...option,
        score: calculateWeightedScore(option.id)
      }))
      .sort((a, b) => b.score - a.score);
  };

  // Función para exportar la matriz como imagen
  const exportAsImage = async () => {
    if (matrixRef.current) {
      try {
        const canvas = await html2canvas(matrixRef.current, {
          backgroundColor: null,
          scale: 2
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `priority_matrix_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
      } catch (error) {
        console.error('Error al exportar la imagen:', error);
      }
    }
  };

  // Crear un nuevo criterio copiando uno existente
  const cloneCriterion = (criterionId) => {
    const sourceCriterion = priorityMatrix.criteria.find(c => c.id === criterionId);
    if (!sourceCriterion) return;
    
    const newCriterion = {
      ...sourceCriterion,
      id: `criterion-${Date.now()}`,
      name: `${sourceCriterion.name} (Copia)`
    };
    
    const newWeights = { ...priorityMatrix.weights };
    newWeights[newCriterion.id] = newCriterion.weight;
    
    setPriorityMatrix(prev => ({
      ...prev,
      criteria: [...prev.criteria, newCriterion],
      weights: newWeights
    }));
  };

  // Crear una nueva opción copiando una existente
  const cloneOption = (optionId) => {
    const sourceOption = priorityMatrix.options.find(o => o.id === optionId);
    if (!sourceOption) return;
    
    const newOption = {
      ...sourceOption,
      id: `option-${Date.now()}`,
      name: `${sourceOption.name} (Copia)`
    };
    
    // Copiar también las puntuaciones
    const updatedScores = { ...priorityMatrix.scores };
    updatedScores[newOption.id] = { ...updatedScores[optionId] };
    
    setPriorityMatrix(prev => ({
      ...prev,
      options: [...prev.options, newOption],
      scores: updatedScores
    }));
  };

  // Renderizar tabla de criterios
  const renderCriteriaTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border text-left">Criterio</th>
              <th className="py-2 px-3 border text-left">Descripción</th>
              <th className="py-2 px-3 border text-center">Peso</th>
              {editMode && <th className="py-2 px-3 border text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {priorityMatrix.criteria.length === 0 ? (
              <tr>
                <td colSpan={editMode ? 4 : 3} className="py-4 px-3 border text-center text-gray-500">
                  No hay criterios definidos. {editMode && "Haz clic en 'Añadir' para crear uno."}
                </td>
              </tr>
            ) : (
              priorityMatrix.criteria.map(criterion => (
                <tr key={criterion.id} className="hover:bg-gray-50">
                  {editMode ? (
                    <>
                      <td className="py-2 px-3 border">
                        <input
                          type="text"
                          className="w-full p-1 border rounded"
                          value={criterion.name}
                          onChange={(e) => updateCriterion(criterion.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <textarea
                          className="w-full p-1 border rounded"
                          value={criterion.description}
                          onChange={(e) => updateCriterion(criterion.id, { description: e.target.value })}
                          rows={2}
                        />
                      </td>
                      <td className="py-2 px-3 border text-center">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className="w-16 p-1 border rounded text-center"
                          value={criterion.weight}
                          onChange={(e) => updateCriterion(criterion.id, { weight: parseInt(e.target.value) || 1 })}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => cloneCriterion(criterion.id)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            title="Duplicar"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => deleteCriterion(criterion.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3 border">{criterion.name}</td>
                      <td className="py-2 px-3 border">{criterion.description}</td>
                      <td className="py-2 px-3 border text-center">
                        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800">
                          {criterion.weight}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {editMode && priorityMatrix.criteria.length > 0 && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={normalizeWeights}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded inline-flex items-center text-sm"
            >
              <ListFilter size={14} className="mr-1" />
              Normalizar Pesos
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizar tabla de opciones
  const renderOptionsTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border text-left">Opción</th>
              <th className="py-2 px-3 border text-left">Descripción</th>
              <th className="py-2 px-3 border text-left">Categoría</th>
              {!editMode && <th className="py-2 px-3 border text-center">Puntuación</th>}
              {editMode && <th className="py-2 px-3 border text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {priorityMatrix.options.length === 0 ? (
              <tr>
                <td colSpan={editMode ? 4 : 4} className="py-4 px-3 border text-center text-gray-500">
                  No hay opciones definidas. {editMode && "Haz clic en 'Añadir' para crear una."}
                </td>
              </tr>
            ) : (
              priorityMatrix.options.map(option => (
                <tr key={option.id} className="hover:bg-gray-50">
                  {editMode ? (
                    <>
                      <td className="py-2 px-3 border">
                        <input
                          type="text"
                          className="w-full p-1 border rounded"
                          value={option.name}
                          onChange={(e) => updateOption(option.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <textarea
                          className="w-full p-1 border rounded"
                          value={option.description}
                          onChange={(e) => updateOption(option.id, { description: e.target.value })}
                          rows={2}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <input
                          type="text"
                          className="w-full p-1 border rounded"
                          value={option.category}
                          onChange={(e) => updateOption(option.id, { category: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => cloneOption(option.id)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            title="Duplicar"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => deleteOption(option.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3 border">{option.name}</td>
                      <td className="py-2 px-3 border">{option.description}</td>
                      <td className="py-2 px-3 border">{option.category}</td>
                      <td className="py-2 px-3 border text-center">
                        <span className={`inline-block px-2 py-1 rounded font-medium ${
                          calculateWeightedScore(option.id) >= 7 ? 'bg-green-100 text-green-800' :
                          calculateWeightedScore(option.id) >= 4 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {calculateWeightedScore(option.id)}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar la matriz de puntuación
  const renderScoringMatrix = () => {
    if (priorityMatrix.criteria.length === 0 || priorityMatrix.options.length === 0) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
          Necesitas definir criterios y opciones para poder puntuar.
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border"></th>
              {priorityMatrix.criteria.map(criterion => (
                <th key={criterion.id} className="py-2 px-3 border text-center">
                  <div className="font-medium">{criterion.name}</div>
                  <div className="text-xs text-gray-500">Peso: {criterion.weight}</div>
                </th>
              ))}
              <th className="py-2 px-3 border text-center bg-gray-200">Puntuación Total</th>
            </tr>
          </thead>
          <tbody>
            {priorityMatrix.options.map(option => (
              <tr key={option.id} className="hover:bg-gray-50">
                <td className="py-2 px-3 border font-medium">{option.name}</td>
                {priorityMatrix.criteria.map(criterion => (
                  <td key={criterion.id} className="py-2 px-3 border text-center">
                    {editMode ? (
                      <select
                        className="w-16 p-1 border rounded text-center"
                        value={priorityMatrix.scores[option.id]?.[criterion.id] || 0}
                        onChange={(e) => updateScore(option.id, criterion.id, e.target.value)}
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                          <option key={score} value={score}>{score}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center ${
                        (priorityMatrix.scores[option.id]?.[criterion.id] || 0) >= 7 ? 'bg-green-100 text-green-800' :
                        (priorityMatrix.scores[option.id]?.[criterion.id] || 0) >= 4 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {priorityMatrix.scores[option.id]?.[criterion.id] || 0}
                      </span>
                    )}
                  </td>
                ))}
                <td className="py-2 px-3 border text-center bg-gray-100 font-bold">
                  {calculateWeightedScore(option.id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar el ranking de opciones
  const renderRanking = () => {
    if (priorityMatrix.options.length === 0) {
      return (
        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
          No hay opciones para mostrar en el ranking.
        </div>
      );
    }
    
    const rankedOptions = getRankedOptions();
    const maxScore = Math.max(...rankedOptions.map(option => option.score), 1);
    
    return (
      <div className="mt-4" ref={matrixRef}>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ArrowUpRight className="mr-2" size={20} />
            Ranking de Opciones
          </h3>
          
          <div className="space-y-4">
            {rankedOptions.map((option, index) => {
              let barColor = 'bg-green-500';
              if (option.score < 4) barColor = 'bg-red-500';
              else if (option.score < 7) barColor = 'bg-yellow-500';
              
              return (
                <div key={option.id} className="relative">
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-2">
                      {index + 1}
                    </div>
                    <div className="font-medium">{option.name}</div>
                    <div className="ml-auto font-bold">{option.score}</div>
                  </div>
                  
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${barColor} rounded-full`}
                      style={{ width: `${(option.score / 10) * 100}%` }}
                    ></div>
                  </div>
                  
                  {option.category && (
                    <div className="mt-1 text-xs text-gray-500">
                      Categoría: {option.category}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border mt-4">
          <h3 className="text-lg font-semibold mb-2">Leyenda de Puntuación</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-1"></div>
              <span>Alto (7-10)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-1"></div>
              <span>Medio (4-6)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-1"></div>
              <span>Bajo (0-3)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Panel de ayuda
  const renderHelpPanel = () => {
    if (!showHelp) return null;
    
    return (
      <div className="absolute top-20 right-4 bg-white p-4 rounded-lg shadow-lg w-80 z-50">
        <h3 className="font-bold text-lg mb-2 flex items-center">
          <HelpCircle size={18} className="mr-2" />
          Ayuda de la Matriz de Priorización
        </h3>
        
        <div className="space-y-2 text-sm">
          <p><strong>Criterios:</strong> Define los factores por los que evaluarás las opciones.</p>
          <p><strong>Peso:</strong> Asigna importancia relativa a cada criterio (1-10).</p>
          <p><strong>Opciones:</strong> Alternativas que deseas evaluar y comparar.</p>
          <p><strong>Puntuación:</strong> Califica cada opción según cada criterio (0-10).</p>
          <p className="text-blue-600 font-medium mt-2">Pasos recomendados:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Define los criterios de evaluación y sus pesos.</li>
            <li>Añade las opciones a evaluar.</li>
            <li>Califica cada opción para cada criterio.</li>
            <li>Revisa el ranking para tomar decisiones.</li>
          </ol>
        </div>
        
        <button 
          className="mt-3 w-full bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded"
          onClick={() => setShowHelp(false)}
        >
          Cerrar
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <CheckSquare className="mr-2" />
          Matriz de Priorización
        </h2>
        
        <div className="flex gap-2">
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            onClick={() => setShowHelp(!showHelp)}
            title="Ayuda"
          >
            <HelpCircle size={20} />
          </button>
          
          {activeTab === 'ranking' && (
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
              onClick={exportAsImage}
              title="Exportar como imagen"
            >
              <Download size={20} />
            </button>
          )}
          
          <button
            className={`p-2 rounded ${editMode ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? (
              <>
                <Save size={18} className="mr-1 inline" />
                <span>Guardar</span>
              </>
            ) : (
              <>
                <Edit size={18} className="mr-1 inline" />
                <span>Editar</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {renderHelpPanel()}
      
      {/* Tabs para navegar entre las diferentes vistas */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex -mb-px">
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'criteria'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('criteria')}
          >
            <Filter size={16} className="inline mr-1" />
            Criterios
          </button>
          
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'options'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('options')}
          >
            <Square size={16} className="inline mr-1" />
            Opciones
          </button>
          
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'matrix'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('matrix')}
          >
            <Move size={16} className="inline mr-1" />
            Matriz
          </button>
          
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'ranking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('ranking')}
          >
            <ArrowUpRight size={16} className="inline mr-1" />
            Ranking
          </button>
        </nav>
      </div>
      
      {/* Contenido según la pestaña activa */}
      <div className="relative">
        {activeTab === 'criteria' && (
          <>
            {editMode && (
              <div className="mb-4">
                <button
                  onClick={addCriterion}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Añadir Criterio
                </button>
              </div>
            )}
            
            {renderCriteriaTable()}
          </>
        )}
        
        {activeTab === 'options' && (
          <>
            {editMode && (
              <div className="mb-4">
                <button
                  onClick={addOption}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Añadir Opción
                </button>
              </div>
            )}
            
            {renderOptionsTable()}
          </>
        )}
        
        {activeTab === 'matrix' && renderScoringMatrix()}
        
        {activeTab === 'ranking' && renderRanking()}
      </div>
    </div>
  );
};

export default PriorizationMatrix;
