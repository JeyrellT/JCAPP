import React, { useState, useEffect } from 'react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { motion } from 'framer-motion';
import {
  Save,
  Edit,
  Plus,
  Trash2,
  MessageSquare,
  Download,
  FileText,
  Target,
  Users,
  Tag,
  Filter,
  BarChart2,
  HelpCircle,
  Check,
  AlertTriangle
} from 'lucide-react';
import html2canvas from 'html2canvas';

/**
 * Componente Visualizador de VOC (Voice of Customer)
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const VocVisualizer = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const chartRef = React.useRef(null);

  // Estado para VOC
  const [voc, setVoc] = useState(() => {
    return project?.voc || {
      customerVoices: [],
      segments: [],
      needs: []
    };
  });

  // Estados de UI
  const [editMode, setEditMode] = useState(!project?.voc);
  const [activeTab, setActiveTab] = useState('voices');
  const [showHelp, setShowHelp] = useState(false);

  // Estados para filtrado y análisis
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [sortBy, setSortBy] = useState('frequency');
  const [analysisSummary, setAnalysisSummary] = useState({
    topNeeds: [],
    topVoices: [],
    segmentDistribution: {}
  });

  // Actualizar el proyecto cuando cambia el VOC
  useEffect(() => {
    if (!editMode && project) {
      updateProject(projectId, { voc });
    }
  }, [editMode]);

  // Generamos análisis cuando cambian las voces o necesidades
  useEffect(() => {
    analyzeVoc();
  }, [voc.customerVoices, voc.needs, voc.segments, selectedSegment, sortBy]);

  // Función para analizar los datos del VOC
  const analyzeVoc = () => {
    // Filtrar por segmento si es necesario
    const filteredVoices = selectedSegment === 'all' 
      ? voc.customerVoices
      : voc.customerVoices.filter(voice => voice.segment === selectedSegment);
    
    // Contar frecuencia de cada necesidad
    const needsCount = {};
    filteredVoices.forEach(voice => {
      if (voice.need) {
        needsCount[voice.need] = (needsCount[voice.need] || 0) + 1;
      }
    });
    
    // Obtener necesidades ordenadas por frecuencia
    const sortedNeeds = Object.keys(needsCount)
      .map(need => ({ 
        id: need, 
        name: voc.needs.find(n => n.id === need)?.name || 'Desconocido',
        count: needsCount[need],
        priority: voc.needs.find(n => n.id === need)?.priority || 'Media'
      }))
      .sort((a, b) => {
        if (sortBy === 'frequency') return b.count - a.count;
        if (sortBy === 'priority') {
          const priorityValue = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
          return priorityValue[b.priority] - priorityValue[a.priority];
        }
        return 0;
      });
    
    // Contar frecuencia de cada comentario
    const voiceTexts = {};
    filteredVoices.forEach(voice => {
      voiceTexts[voice.text] = (voiceTexts[voice.text] || 0) + 1;
    });
    
    // Obtener comentarios más frecuentes
    const topVoices = Object.keys(voiceTexts)
      .map(text => ({ text, count: voiceTexts[text] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Distribución por segmento
    const segmentDistribution = {};
    voc.customerVoices.forEach(voice => {
      const segmentName = voc.segments.find(s => s.id === voice.segment)?.name || 'Sin segmento';
      segmentDistribution[segmentName] = (segmentDistribution[segmentName] || 0) + 1;
    });
    
    setAnalysisSummary({
      topNeeds: sortedNeeds.slice(0, 5),
      topVoices,
      segmentDistribution
    });
  };

  // Función para añadir un nuevo comentario de cliente
  const addCustomerVoice = () => {
    const newVoice = {
      id: `voice-${Date.now()}`,
      text: '',
      source: 'Entrevista',
      sentiment: 'neutral',
      date: new Date().toISOString().split('T')[0],
      segment: voc.segments.length > 0 ? voc.segments[0].id : '',
      need: voc.needs.length > 0 ? voc.needs[0].id : ''
    };
    
    setVoc(prev => ({
      ...prev,
      customerVoices: [...prev.customerVoices, newVoice]
    }));
  };

  // Función para actualizar un comentario
  const updateCustomerVoice = (id, data) => {
    setVoc(prev => ({
      ...prev,
      customerVoices: prev.customerVoices.map(voice => 
        voice.id === id ? { ...voice, ...data } : voice
      )
    }));
  };

  // Función para eliminar un comentario
  const deleteCustomerVoice = (id) => {
    setVoc(prev => ({
      ...prev,
      customerVoices: prev.customerVoices.filter(voice => voice.id !== id)
    }));
  };

  // Función para añadir un nuevo segmento de cliente
  const addSegment = () => {
    const newSegment = {
      id: `segment-${Date.now()}`,
      name: 'Nuevo Segmento',
      description: ''
    };
    
    setVoc(prev => ({
      ...prev,
      segments: [...prev.segments, newSegment]
    }));
  };

  // Función para actualizar un segmento
  const updateSegment = (id, data) => {
    setVoc(prev => ({
      ...prev,
      segments: prev.segments.map(segment => 
        segment.id === id ? { ...segment, ...data } : segment
      )
    }));
  };

  // Función para eliminar un segmento
  const deleteSegment = (id) => {
    // Actualizar también las voces que usaban este segmento
    const updatedVoices = voc.customerVoices.map(voice => 
      voice.segment === id ? { ...voice, segment: '' } : voice
    );
    
    setVoc(prev => ({
      ...prev,
      segments: prev.segments.filter(segment => segment.id !== id),
      customerVoices: updatedVoices
    }));
  };

  // Función para añadir una nueva necesidad del cliente
  const addNeed = () => {
    const newNeed = {
      id: `need-${Date.now()}`,
      name: 'Nueva Necesidad',
      description: '',
      priority: 'Media',
      category: 'General'
    };
    
    setVoc(prev => ({
      ...prev,
      needs: [...prev.needs, newNeed]
    }));
  };

  // Función para actualizar una necesidad
  const updateNeed = (id, data) => {
    setVoc(prev => ({
      ...prev,
      needs: prev.needs.map(need => 
        need.id === id ? { ...need, ...data } : need
      )
    }));
  };

  // Función para eliminar una necesidad
  const deleteNeed = (id) => {
    // Actualizar también las voces que usaban esta necesidad
    const updatedVoices = voc.customerVoices.map(voice => 
      voice.need === id ? { ...voice, need: '' } : voice
    );
    
    setVoc(prev => ({
      ...prev,
      needs: prev.needs.filter(need => need.id !== id),
      customerVoices: updatedVoices
    }));
  };

  // Función para exportar el análisis como imagen
  const exportAsImage = async () => {
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: null,
          scale: 2
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `voc_analysis_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
      } catch (error) {
        console.error('Error al exportar la imagen:', error);
      }
    }
  };

  // Renderizar tabla de voces del cliente
  const renderVoicesTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border text-left">Comentario</th>
              <th className="py-2 px-3 border text-left">Fuente</th>
              <th className="py-2 px-3 border text-left">Sentimiento</th>
              <th className="py-2 px-3 border text-left">Fecha</th>
              <th className="py-2 px-3 border text-left">Segmento</th>
              <th className="py-2 px-3 border text-left">Necesidad</th>
              {editMode && <th className="py-2 px-3 border text-left">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {voc.customerVoices.length === 0 ? (
              <tr>
                <td colSpan={editMode ? 7 : 6} className="py-4 px-3 border text-center text-gray-500">
                  No hay comentarios de clientes. {editMode && "Haz clic en 'Añadir' para crear uno."}
                </td>
              </tr>
            ) : (
              voc.customerVoices.map(voice => (
                <tr key={voice.id} className="hover:bg-gray-50">
                  {editMode ? (
                    <>
                      <td className="py-2 px-3 border">
                        <textarea
                          className="w-full p-1 border rounded"
                          value={voice.text}
                          onChange={(e) => updateCustomerVoice(voice.id, { text: e.target.value })}
                          rows={2}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <select
                          className="w-full p-1 border rounded"
                          value={voice.source}
                          onChange={(e) => updateCustomerVoice(voice.id, { source: e.target.value })}
                        >
                          <option value="Entrevista">Entrevista</option>
                          <option value="Encuesta">Encuesta</option>
                          <option value="Redes Sociales">Redes Sociales</option>
                          <option value="Reclamación">Reclamación</option>
                          <option value="Observación">Observación</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 border">
                        <select
                          className="w-full p-1 border rounded"
                          value={voice.sentiment}
                          onChange={(e) => updateCustomerVoice(voice.id, { sentiment: e.target.value })}
                        >
                          <option value="positivo">Positivo</option>
                          <option value="neutral">Neutral</option>
                          <option value="negativo">Negativo</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 border">
                        <input
                          type="date"
                          className="w-full p-1 border rounded"
                          value={voice.date}
                          onChange={(e) => updateCustomerVoice(voice.id, { date: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <select
                          className="w-full p-1 border rounded"
                          value={voice.segment}
                          onChange={(e) => updateCustomerVoice(voice.id, { segment: e.target.value })}
                        >
                          <option value="">Sin segmento</option>
                          {voc.segments.map(segment => (
                            <option key={segment.id} value={segment.id}>
                              {segment.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 border">
                        <select
                          className="w-full p-1 border rounded"
                          value={voice.need}
                          onChange={(e) => updateCustomerVoice(voice.id, { need: e.target.value })}
                        >
                          <option value="">Sin necesidad</option>
                          {voc.needs.map(need => (
                            <option key={need.id} value={need.id}>
                              {need.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 border">
                        <button
                          onClick={() => deleteCustomerVoice(voice.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3 border">{voice.text}</td>
                      <td className="py-2 px-3 border">{voice.source}</td>
                      <td className="py-2 px-3 border">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          voice.sentiment === 'positivo' ? 'bg-green-100 text-green-800' :
                          voice.sentiment === 'negativo' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {voice.sentiment.charAt(0).toUpperCase() + voice.sentiment.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-3 border">{voice.date}</td>
                      <td className="py-2 px-3 border">
                        {voc.segments.find(s => s.id === voice.segment)?.name || '—'}
                      </td>
                      <td className="py-2 px-3 border">
                        {voc.needs.find(n => n.id === voice.need)?.name || '—'}
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

  // Renderizar tabla de segmentos
  const renderSegmentsTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border text-left">Nombre</th>
              <th className="py-2 px-3 border text-left">Descripción</th>
              <th className="py-2 px-3 border text-left">Comentarios</th>
              {editMode && <th className="py-2 px-3 border text-left">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {voc.segments.length === 0 ? (
              <tr>
                <td colSpan={editMode ? 4 : 3} className="py-4 px-3 border text-center text-gray-500">
                  No hay segmentos de cliente. {editMode && "Haz clic en 'Añadir' para crear uno."}
                </td>
              </tr>
            ) : (
              voc.segments.map(segment => {
                const voiceCount = voc.customerVoices.filter(v => v.segment === segment.id).length;
                
                return (
                  <tr key={segment.id} className="hover:bg-gray-50">
                    {editMode ? (
                      <>
                        <td className="py-2 px-3 border">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={segment.name}
                            onChange={(e) => updateSegment(segment.id, { name: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3 border">
                          <textarea
                            className="w-full p-1 border rounded"
                            value={segment.description}
                            onChange={(e) => updateSegment(segment.id, { description: e.target.value })}
                            rows={2}
                          />
                        </td>
                        <td className="py-2 px-3 border text-center">{voiceCount}</td>
                        <td className="py-2 px-3 border">
                          <button
                            onClick={() => deleteSegment(segment.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 border">{segment.name}</td>
                        <td className="py-2 px-3 border">{segment.description}</td>
                        <td className="py-2 px-3 border text-center">
                          <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {voiceCount}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar tabla de necesidades
  const renderNeedsTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border text-left">Nombre</th>
              <th className="py-2 px-3 border text-left">Descripción</th>
              <th className="py-2 px-3 border text-left">Prioridad</th>
              <th className="py-2 px-3 border text-left">Categoría</th>
              <th className="py-2 px-3 border text-left">Comentarios</th>
              {editMode && <th className="py-2 px-3 border text-left">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {voc.needs.length === 0 ? (
              <tr>
                <td colSpan={editMode ? 6 : 5} className="py-4 px-3 border text-center text-gray-500">
                  No hay necesidades definidas. {editMode && "Haz clic en 'Añadir' para crear una."}
                </td>
              </tr>
            ) : (
              voc.needs.map(need => {
                const voiceCount = voc.customerVoices.filter(v => v.need === need.id).length;
                
                return (
                  <tr key={need.id} className="hover:bg-gray-50">
                    {editMode ? (
                      <>
                        <td className="py-2 px-3 border">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={need.name}
                            onChange={(e) => updateNeed(need.id, { name: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3 border">
                          <textarea
                            className="w-full p-1 border rounded"
                            value={need.description}
                            onChange={(e) => updateNeed(need.id, { description: e.target.value })}
                            rows={2}
                          />
                        </td>
                        <td className="py-2 px-3 border">
                          <select
                            className="w-full p-1 border rounded"
                            value={need.priority}
                            onChange={(e) => updateNeed(need.id, { priority: e.target.value })}
                          >
                            <option value="Alta">Alta</option>
                            <option value="Media">Media</option>
                            <option value="Baja">Baja</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 border">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={need.category}
                            onChange={(e) => updateNeed(need.id, { category: e.target.value })}
                          />
                        </td>
                        <td className="py-2 px-3 border text-center">{voiceCount}</td>
                        <td className="py-2 px-3 border">
                          <button
                            onClick={() => deleteNeed(need.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 border">{need.name}</td>
                        <td className="py-2 px-3 border">{need.description}</td>
                        <td className="py-2 px-3 border">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            need.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                            need.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {need.priority}
                          </span>
                        </td>
                        <td className="py-2 px-3 border">{need.category}</td>
                        <td className="py-2 px-3 border text-center">
                          <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {voiceCount}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar análisis
  const renderAnalysis = () => {    
    // Calcular colores para las barras de necesidades
    const getBarColor = (priority) => {
      switch (priority) {
        case 'Alta': return 'bg-red-500';
        case 'Media': return 'bg-yellow-500';
        case 'Baja': return 'bg-green-500';
        default: return 'bg-gray-500';
      }
    };
    
    // Encontrar el valor máximo para escalar las barras
    const maxNeedCount = Math.max(...analysisSummary.topNeeds.map(need => need.count), 1);
    
    return (
      <div className="mt-4 space-y-6" ref={chartRef}>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Target className="mr-2" size={20} />
            Necesidades Principales
          </h3>
          
          {analysisSummary.topNeeds.length === 0 ? (
            <p className="text-gray-500">No hay suficientes datos para mostrar necesidades principales.</p>
          ) : (
            <div className="space-y-3">
              {analysisSummary.topNeeds.map(need => (
                <div key={need.id} className="flex items-center">
                  <div className="w-1/4 text-sm font-medium truncate" title={need.name}>
                    {need.name}
                  </div>
                  <div className="w-3/4 flex items-center">
                    <div 
                      className={`h-6 rounded ${getBarColor(need.priority)}`}
                      style={{ width: `${(need.count / maxNeedCount) * 100}%` }}
                    ></div>
                    <span className="ml-2 text-sm">{need.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Comentarios Más Frecuentes
          </h3>
          
          {analysisSummary.topVoices.length === 0 ? (
            <p className="text-gray-500">No hay suficientes datos para mostrar comentarios frecuentes.</p>
          ) : (
            <div className="space-y-2">
              {analysisSummary.topVoices.map((voice, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded border">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">"{voice.text}"</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 rounded">{voice.count}x</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Users className="mr-2" size={20} />
            Distribución por Segmento
          </h3>
          
          {Object.keys(analysisSummary.segmentDistribution).length === 0 ? (
            <p className="text-gray-500">No hay suficientes datos para mostrar distribución por segmento.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysisSummary.segmentDistribution).map(([segmentName, count], index) => {
                const colors = ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-yellow-100 text-yellow-800', 'bg-red-100 text-red-800'];
                const colorClass = colors[index % colors.length];
                
                return (
                  <div key={segmentName} className={`px-3 py-2 rounded-lg ${colorClass}`}>
                    <span className="font-medium">{segmentName}:</span> {count} ({Math.round(count / voc.customerVoices.length * 100)}%)
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Panel de opciones de filtrado
  const renderFilterOptions = () => {
    if (activeTab !== 'analysis') return null;
    
    return (
      <div className="flex flex-wrap gap-3 items-center mb-4 bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center">
          <Filter size={16} className="mr-1 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">Filtrar por:</span>
        </div>
        
        <div>
          <select
            className="p-1 border rounded text-sm"
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
          >
            <option value="all">Todos los segmentos</option>
            {voc.segments.map(segment => (
              <option key={segment.id} value={segment.id}>
                {segment.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center ml-4">
          <BarChart2 size={16} className="mr-1 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">Ordenar por:</span>
        </div>
        
        <div>
          <select
            className="p-1 border rounded text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="frequency">Frecuencia</option>
            <option value="priority">Prioridad</option>
          </select>
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
          Ayuda del VOC
        </h3>
        
        <div className="space-y-2 text-sm">
          <p><strong>Comentarios:</strong> Registra lo que dicen tus clientes textualmente.</p>
          <p><strong>Segmentos:</strong> Clasifica a tus clientes en grupos con características similares.</p>
          <p><strong>Necesidades:</strong> Identifica y prioriza lo que realmente necesitan tus clientes.</p>
          <p><strong>Análisis:</strong> Visualiza patrones y prioridades basados en la frecuencia y relevancia.</p>
          <p className="text-blue-600 font-medium mt-2">Consejos:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Primero, define segmentos y necesidades antes de registrar comentarios.</li>
            <li>Asigna cada comentario a un segmento y a una necesidad específica.</li>
            <li>Usa el análisis para identificar las necesidades más importantes.</li>
          </ul>
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

  // Renderizar advertencia si faltan datos
  const renderWarningBanner = () => {
    if (voc.segments.length === 0 || voc.needs.length === 0) {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {voc.segments.length === 0 && voc.needs.length === 0 ? (
                  <span>Para comenzar, debes definir segmentos de clientes y necesidades.</span>
                ) : voc.segments.length === 0 ? (
                  <span>Debes definir al menos un segmento de cliente para categorizar las voces.</span>
                ) : (
                  <span>Debes definir al menos una necesidad para clasificar las voces.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <MessageSquare className="mr-2" />
          Voice of Customer (VOC)
        </h2>
        
        <div className="flex gap-2">
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            onClick={() => setShowHelp(!showHelp)}
            title="Ayuda"
          >
            <HelpCircle size={20} />
          </button>
          
          {activeTab === 'analysis' && (
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
      {renderWarningBanner()}
      
      {/* Tabs para navegar entre las diferentes vistas */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex -mb-px">
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'voices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('voices')}
          >
            <MessageSquare size={16} className="inline mr-1" />
            Comentarios
          </button>
          
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'segments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('segments')}
          >
            <Users size={16} className="inline mr-1" />
            Segmentos
          </button>
          
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'needs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('needs')}
          >
            <Target size={16} className="inline mr-1" />
            Necesidades
          </button>
          
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('analysis')}
          >
            <BarChart2 size={16} className="inline mr-1" />
            Análisis
          </button>
        </nav>
      </div>
      
      {renderFilterOptions()}
      
      {/* Contenido según la pestaña activa */}
      <div className="relative">
        {activeTab === 'voices' && (
          <>
            {editMode && (
              <div className="mb-4">
                <button
                  onClick={addCustomerVoice}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Añadir Comentario
                </button>
              </div>
            )}
            
            {renderVoicesTable()}
          </>
        )}
        
        {activeTab === 'segments' && (
          <>
            {editMode && (
              <div className="mb-4">
                <button
                  onClick={addSegment}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Añadir Segmento
                </button>
              </div>
            )}
            
            {renderSegmentsTable()}
          </>
        )}
        
        {activeTab === 'needs' && (
          <>
            {editMode && (
              <div className="mb-4">
                <button
                  onClick={addNeed}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Añadir Necesidad
                </button>
              </div>
            )}
            
            {renderNeedsTable()}
          </>
        )}
        
        {activeTab === 'analysis' && renderAnalysis()}
      </div>
    </div>
  );
};

export default VocVisualizer;
