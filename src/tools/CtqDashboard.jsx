import React, { useState, useEffect } from 'react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { motion } from 'framer-motion';
import {
  Save,
  Edit,
  Plus,
  Trash2,
  BarChart2,
  Download,
  HelpCircle,
  Target,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  CheckSquare,
  Bell,
  AlertTriangle,
  XCircle,
  CheckCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';

/**
 * Componente Dashboard CTQ (Critical to Quality)
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const CtqDashboard = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const dashboardRef = React.useRef(null);

  // Estado para los datos CTQ
  const [ctqData, setCtqData] = useState(() => {
    return project?.ctqData || {
      requirements: [],
      measurements: [],
      targets: {}
    };
  });

  // Estados de UI
  const [editMode, setEditMode] = useState(!project?.ctqData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHelp, setShowHelp] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);

  // Actualizar el proyecto cuando cambian los datos de CTQ
  useEffect(() => {
    if (!editMode && project) {
      updateProject(projectId, { ctqData });
    }
  }, [editMode]);

  // Función para añadir un nuevo requisito CTQ
  const addRequirement = () => {
    const newRequirement = {
      id: `req-${Date.now()}`,
      name: 'Nuevo Requisito CTQ',
      description: '',
      category: 'Calidad',
      importance: 'Alta',
      uom: '', // Unidad de medida
      lsl: null, // Límite inferior de especificación
      usl: null, // Límite superior de especificación
      target: null // Valor objetivo
    };
    
    setCtqData(prev => ({
      ...prev,
      requirements: [...prev.requirements, newRequirement]
    }));
    
    setSelectedRequirement(newRequirement);
  };

  // Función para actualizar un requisito
  const updateRequirement = (id, data) => {
    setCtqData(prev => ({
      ...prev,
      requirements: prev.requirements.map(req => 
        req.id === id ? { ...req, ...data } : req
      )
    }));
    
    if (selectedRequirement && selectedRequirement.id === id) {
      setSelectedRequirement(prev => ({ ...prev, ...data }));
    }
  };

  // Función para eliminar un requisito
  const deleteRequirement = (id) => {
    // Eliminar también las mediciones relacionadas
    const updatedMeasurements = ctqData.measurements.filter(
      measurement => measurement.requirementId !== id
    );
    
    // Eliminar los objetivos relacionados
    const updatedTargets = { ...ctqData.targets };
    delete updatedTargets[id];
    
    setCtqData(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req.id !== id),
      measurements: updatedMeasurements,
      targets: updatedTargets
    }));
    
    if (selectedRequirement && selectedRequirement.id === id) {
      setSelectedRequirement(null);
    }
  };

  // Función para añadir una nueva medición
  const addMeasurement = (requirementId) => {
    const requirement = ctqData.requirements.find(req => req.id === requirementId);
    if (!requirement) return;
    
    const newMeasurement = {
      id: `measure-${Date.now()}`,
      requirementId,
      value: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    };
    
    setCtqData(prev => ({
      ...prev,
      measurements: [...prev.measurements, newMeasurement]
    }));
  };

  // Función para actualizar una medición
  const updateMeasurement = (id, data) => {
    setCtqData(prev => ({
      ...prev,
      measurements: prev.measurements.map(measure => 
        measure.id === id ? { ...measure, ...data } : measure
      )
    }));
  };

  // Función para eliminar una medición
  const deleteMeasurement = (id) => {
    setCtqData(prev => ({
      ...prev,
      measurements: prev.measurements.filter(measure => measure.id !== id)
    }));
  };

  // Función para establecer un objetivo
  const setTarget = (requirementId, target) => {
    setCtqData(prev => ({
      ...prev,
      targets: {
        ...prev.targets,
        [requirementId]: target
      }
    }));
  };

  // Función para exportar el dashboard como imagen
  const exportAsImage = async () => {
    if (dashboardRef.current) {
      try {
        const canvas = await html2canvas(dashboardRef.current, {
          backgroundColor: null,
          scale: 2
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `ctq_dashboard_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
      } catch (error) {
        console.error('Error al exportar la imagen:', error);
      }
    }
  };

  // Obtener mediciones para un requisito específico
  const getMeasurementsForRequirement = (requirementId) => {
    return ctqData.measurements
      .filter(m => m.requirementId === requirementId)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calcular estadísticas para un requisito
  const calculateStats = (requirementId) => {
    const measurements = getMeasurementsForRequirement(requirementId)
      .map(m => parseFloat(m.value))
      .filter(value => !isNaN(value));
    
    if (measurements.length === 0) {
      return { mean: 0, min: 0, max: 0, count: 0, latest: null };
    }
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    const mean = sum / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const latest = measurements[measurements.length - 1];
    
    return { mean, min, max, count: measurements.length, latest };
  };

  // Verificar si un requisito cumple con las especificaciones
  const checkRequirementStatus = (requirement) => {
    const stats = calculateStats(requirement.id);
    
    if (stats.count === 0) return 'nodata';
    
    const latestValue = stats.latest;
    
    if (
      (requirement.lsl !== null && latestValue < requirement.lsl) ||
      (requirement.usl !== null && latestValue > requirement.usl)
    ) {
      return 'outofspec';
    }
    
    // Si hay un valor objetivo y la última medición está dentro del 5% del objetivo
    if (requirement.target !== null) {
      const tolerance = requirement.target * 0.05;
      if (Math.abs(latestValue - requirement.target) <= tolerance) {
        return 'ontarget';
      }
    }
    
    return 'inspec';
  };

  // Renderizar tarjetas de resumen para el dashboard
  const renderSummaryCards = () => {
    // Contar requisitos por estado
    const statusCounts = {
      ontarget: 0,
      inspec: 0,
      outofspec: 0,
      nodata: 0
    };
    
    ctqData.requirements.forEach(req => {
      const status = checkRequirementStatus(req);
      statusCounts[status]++;
    });
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-green-800">En Objetivo</h3>
              <p className="text-sm text-green-600">Cumpliendo el valor objetivo</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-green-800">{statusCounts.ontarget}</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">En Especificación</h3>
              <p className="text-sm text-blue-600">Dentro de límites aceptables</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <CheckSquare className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-blue-800">{statusCounts.inspec}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Fuera de Especificación</h3>
              <p className="text-sm text-red-600">Requiere acción inmediata</p>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-800">{statusCounts.outofspec}</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sin Datos</h3>
              <p className="text-sm text-gray-600">Pendiente de medición</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-full">
              <Bell className="text-gray-600" size={24} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-800">{statusCounts.nodata}</p>
        </div>
      </div>
    );
  };

  // Renderizar indicadores de CTQ
  const renderCtqIndicators = () => {
    if (ctqData.requirements.length === 0) {
      return (
        <div className="bg-gray-50 p-8 rounded-lg text-center my-4">
          <p className="text-gray-500 mb-4">No hay requisitos CTQ definidos.</p>
          {editMode && (
            <button
              onClick={addRequirement}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center"
            >
              <Plus size={18} className="mr-1" />
              Añadir Requisito CTQ
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
        {ctqData.requirements.map(requirement => {
          const measurements = getMeasurementsForRequirement(requirement.id);
          const stats = calculateStats(requirement.id);
          const status = checkRequirementStatus(requirement);
          
          // Determinar colores y clases según el estado
          const getStatusColor = () => {
            switch (status) {
              case 'ontarget': return 'bg-green-50 border-green-200';
              case 'inspec': return 'bg-blue-50 border-blue-200';
              case 'outofspec': return 'bg-red-50 border-red-200';
              default: return 'bg-gray-50 border-gray-200';
            }
          };
          
          const getStatusIcon = () => {
            switch (status) {
              case 'ontarget': return <CheckCircle className="text-green-600" size={20} />;
              case 'inspec': return <CheckSquare className="text-blue-600" size={20} />;
              case 'outofspec': return <XCircle className="text-red-600" size={20} />;
              default: return <Bell className="text-gray-600" size={20} />;
            }
          };
          
          // Determinar la tendencia
          const getTrendIcon = () => {
            if (measurements.length < 2) return null;
            
            const lastValue = parseFloat(measurements[measurements.length - 1].value);
            const prevValue = parseFloat(measurements[measurements.length - 2].value);
            
            if (isNaN(lastValue) || isNaN(prevValue)) return null;
            
            if (lastValue > prevValue) {
              return <ArrowUpRight className="text-green-600" size={16} />;
            } else if (lastValue < prevValue) {
              return <ArrowDownRight className="text-red-600" size={16} />;
            }
            
            return null;
          };
          
          return (
            <div 
              key={requirement.id} 
              className={`border rounded-lg p-4 shadow-sm ${getStatusColor()}`}
              onClick={() => setSelectedRequirement(requirement)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{requirement.name}</h3>
                <div className="flex gap-1">
                  {getTrendIcon()}
                  {getStatusIcon()}
                </div>
              </div>
              
              <div className="text-sm text-gray-500">{requirement.category}</div>
              
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-500">Último</div>
                  <div className="font-bold text-gray-900">
                    {stats.latest !== null ? stats.latest : '—'} {requirement.uom}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Promedio</div>
                  <div className="font-bold text-gray-900">
                    {stats.count > 0 ? stats.mean.toFixed(2) : '—'} {requirement.uom}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Objetivo</div>
                  <div className="font-bold text-gray-900">
                    {requirement.target !== null ? requirement.target : '—'} {requirement.uom}
                  </div>
                </div>
              </div>
              
              {stats.count > 0 && (
                <div className="mt-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${status === 'outofspec' ? 'bg-red-500' : status === 'ontarget' ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ 
                        width: `${Math.min(100, (stats.latest / (requirement.usl || stats.max * 1.2)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {requirement.lsl !== null ? (
                      <span>LSL: {requirement.lsl}</span>
                    ) : (
                      <span>Min: {stats.min}</span>
                    )}
                    
                    {requirement.target !== null && (
                      <span>Target: {requirement.target}</span>
                    )}
                    
                    {requirement.usl !== null ? (
                      <span>USL: {requirement.usl}</span>
                    ) : (
                      <span>Max: {stats.max}</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-500">
                {`${stats.count} medición${stats.count !== 1 ? 'es' : ''}`}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar tabla de requisitos
  const renderRequirementsTable = () => {
    return (
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3 border text-left">Nombre</th>
              <th className="py-2 px-3 border text-left">Categoría</th>
              <th className="py-2 px-3 border text-left">Importancia</th>
              <th className="py-2 px-3 border text-left">Uni. Medida</th>
              <th className="py-2 px-3 border text-center">LSL</th>
              <th className="py-2 px-3 border text-center">Objetivo</th>
              <th className="py-2 px-3 border text-center">USL</th>
              {editMode && <th className="py-2 px-3 border text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {ctqData.requirements.length === 0 ? (
              <tr>
                <td colSpan={editMode ? 8 : 7} className="py-4 px-3 border text-center text-gray-500">
                  No hay requisitos CTQ definidos. {editMode && "Haz clic en 'Añadir' para crear uno."}
                </td>
              </tr>
            ) : (
              ctqData.requirements.map(requirement => (
                <tr 
                  key={requirement.id} 
                  className={`hover:bg-gray-50 ${selectedRequirement?.id === requirement.id ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedRequirement(requirement)}
                >
                  {editMode ? (
                    <>
                      <td className="py-2 px-3 border">
                        <input
                          type="text"
                          className="w-full p-1 border rounded"
                          value={requirement.name}
                          onChange={(e) => updateRequirement(requirement.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <input
                          type="text"
                          className="w-full p-1 border rounded"
                          value={requirement.category}
                          onChange={(e) => updateRequirement(requirement.id, { category: e.target.value })}
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <select
                          className="w-full p-1 border rounded"
                          value={requirement.importance}
                          onChange={(e) => updateRequirement(requirement.id, { importance: e.target.value })}
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
                          value={requirement.uom}
                          onChange={(e) => updateRequirement(requirement.id, { uom: e.target.value })}
                          placeholder="ej. mm, kg, %"
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <input
                          type="number"
                          className="w-full p-1 border rounded"
                          value={requirement.lsl === null ? '' : requirement.lsl}
                          onChange={(e) => updateRequirement(requirement.id, { 
                            lsl: e.target.value === '' ? null : parseFloat(e.target.value) 
                          })}
                          placeholder="Min"
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <input
                          type="number"
                          className="w-full p-1 border rounded"
                          value={requirement.target === null ? '' : requirement.target}
                          onChange={(e) => updateRequirement(requirement.id, { 
                            target: e.target.value === '' ? null : parseFloat(e.target.value) 
                          })}
                          placeholder="Objetivo"
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <input
                          type="number"
                          className="w-full p-1 border rounded"
                          value={requirement.usl === null ? '' : requirement.usl}
                          onChange={(e) => updateRequirement(requirement.id, { 
                            usl: e.target.value === '' ? null : parseFloat(e.target.value) 
                          })}
                          placeholder="Max"
                        />
                      </td>
                      <td className="py-2 px-3 border">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRequirement(requirement.id);
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3 border">{requirement.name}</td>
                      <td className="py-2 px-3 border">{requirement.category}</td>
                      <td className="py-2 px-3 border">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          requirement.importance === 'Alta' ? 'bg-red-100 text-red-800' :
                          requirement.importance === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {requirement.importance}
                        </span>
                      </td>
                      <td className="py-2 px-3 border">{requirement.uom}</td>
                      <td className="py-2 px-3 border text-center">{requirement.lsl !== null ? requirement.lsl : '—'}</td>
                      <td className="py-2 px-3 border text-center">{requirement.target !== null ? requirement.target : '—'}</td>
                      <td className="py-2 px-3 border text-center">{requirement.usl !== null ? requirement.usl : '—'}</td>
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

  // Renderizar el detalle de un requisito seleccionado, incluyendo sus mediciones
  const renderRequirementDetail = () => {
    if (!selectedRequirement) {
      return (
        <div className="bg-gray-50 p-8 rounded-lg text-center my-4">
          <p className="text-gray-500">Selecciona un requisito CTQ para ver su detalle.</p>
        </div>
      );
    }
    
    const measurements = getMeasurementsForRequirement(selectedRequirement.id);
    
    return (
      <div className="bg-white border rounded-lg p-4 my-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{selectedRequirement.name}</h3>
            <div className="text-sm text-gray-500">
              {selectedRequirement.category} • Importancia: {selectedRequirement.importance}
            </div>
          </div>
          
          {editMode && (
            <button
              onClick={() => addMeasurement(selectedRequirement.id)}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-md text-sm inline-flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Añadir Medición
            </button>
          )}
        </div>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Especificaciones</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500">Límite Inferior (LSL)</div>
              <div className="font-bold">{selectedRequirement.lsl !== null ? selectedRequirement.lsl : '—'} {selectedRequirement.uom}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500">Objetivo</div>
              <div className="font-bold">{selectedRequirement.target !== null ? selectedRequirement.target : '—'} {selectedRequirement.uom}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-500">Límite Superior (USL)</div>
              <div className="font-bold">{selectedRequirement.usl !== null ? selectedRequirement.usl : '—'} {selectedRequirement.uom}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-2">Historial de Mediciones</h4>
          {measurements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay mediciones registradas para este requisito.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 border text-left">Fecha</th>
                    <th className="py-2 px-3 border text-left">Valor</th>
                    <th className="py-2 px-3 border text-left">Nota</th>
                    <th className="py-2 px-3 border text-center">Estado</th>
                    {editMode && <th className="py-2 px-3 border text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {measurements.map(measure => {
                    const value = parseFloat(measure.value);
                    const isOutOfSpec = 
                      (selectedRequirement.lsl !== null && value < selectedRequirement.lsl) || 
                      (selectedRequirement.usl !== null && value > selectedRequirement.usl);
                    
                    const isOnTarget = selectedRequirement.target !== null && 
                      Math.abs(value - selectedRequirement.target) <= selectedRequirement.target * 0.05;
                    
                    return (
                      <tr key={measure.id} className="hover:bg-gray-50">
                        {editMode ? (
                          <>
                            <td className="py-2 px-3 border">
                              <input
                                type="date"
                                className="w-full p-1 border rounded"
                                value={measure.date}
                                onChange={(e) => updateMeasurement(measure.id, { date: e.target.value })}
                              />
                            </td>
                            <td className="py-2 px-3 border">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full p-1 border rounded"
                                value={measure.value}
                                onChange={(e) => updateMeasurement(measure.id, { value: e.target.value })}
                              />
                            </td>
                            <td className="py-2 px-3 border">
                              <input
                                type="text"
                                className="w-full p-1 border rounded"
                                value={measure.note}
                                onChange={(e) => updateMeasurement(measure.id, { note: e.target.value })}
                                placeholder="Notas opcionales"
                              />
                            </td>
                            <td className="py-2 px-3 border text-center">
                              {isNaN(value) ? (
                                <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">N/A</span>
                              ) : isOutOfSpec ? (
                                <span className="inline-block px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs">Fuera de Spec</span>
                              ) : isOnTarget ? (
                                <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">En Objetivo</span>
                              ) : (
                                <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">En Spec</span>
                              )}
                            </td>
                            <td className="py-2 px-3 border text-center">
                              <button
                                onClick={() => deleteMeasurement(measure.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 border">{measure.date}</td>
                            <td className="py-2 px-3 border">{measure.value} {selectedRequirement.uom}</td>
                            <td className="py-2 px-3 border">{measure.note}</td>
                            <td className="py-2 px-3 border text-center">
                              {isNaN(value) ? (
                                <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">N/A</span>
                              ) : isOutOfSpec ? (
                                <span className="inline-block px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs">Fuera de Spec</span>
                              ) : isOnTarget ? (
                                <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">En Objetivo</span>
                              ) : (
                                <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">En Spec</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
          Ayuda del Dashboard CTQ
        </h3>
        
        <div className="space-y-2 text-sm">
          <p><strong>CTQ (Critical to Quality):</strong> Son las características críticas para la calidad desde la perspectiva del cliente.</p>
          <p><strong>Requisitos CTQ:</strong> Define los parámetros que deben medirse y controlarse.</p>
          <p><strong>Especificaciones:</strong> LSL (límite inferior) y USL (límite superior) definen el rango aceptable.</p>
          <p><strong>Mediciones:</strong> Registra valores periódicos para cada requisito CTQ.</p>
          <p className="text-blue-600 font-medium mt-2">Pasos recomendados:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Define los requisitos CTQ, incluyendo sus especificaciones.</li>
            <li>Registra mediciones periódicas para cada requisito.</li>
            <li>Monitorea el dashboard para identificar tendencias y problemas.</li>
            <li>Toma acciones correctivas cuando los valores estén fuera de especificación.</li>
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
          <BarChart2 className="mr-2" />
          Dashboard CTQ (Critical to Quality)
        </h2>
        
        <div className="flex gap-2">
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            onClick={() => setShowHelp(!showHelp)}
            title="Ayuda"
          >
            <HelpCircle size={20} />
          </button>
          
          {activeTab === 'dashboard' && (
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
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart2 size={16} className="inline mr-1" />
            Dashboard
          </button>
          
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'requirements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('requirements')}
          >
            <Target size={16} className="inline mr-1" />
            Requisitos CTQ
          </button>
          
          <button
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'measurements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('measurements')}
          >
            <LineChart size={16} className="inline mr-1" />
            Mediciones
          </button>
        </nav>
      </div>
      
      {/* Contenido según la pestaña activa */}
      <div className="relative" ref={dashboardRef}>
        {activeTab === 'dashboard' && (
          <>
            {renderSummaryCards()}
            {renderCtqIndicators()}
          </>
        )}
        
        {activeTab === 'requirements' && (
          <>
            {editMode && (
              <div className="mb-4">
                <button
                  onClick={addRequirement}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Añadir Requisito CTQ
                </button>
              </div>
            )}
            
            {renderRequirementsTable()}
          </>
        )}
        
        {activeTab === 'measurements' && renderRequirementDetail()}
      </div>
    </div>
  );
};

export default CtqDashboard;
