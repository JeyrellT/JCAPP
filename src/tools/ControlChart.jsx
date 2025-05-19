import { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Save, 
  Edit, 
  Plus, 
  Trash2, 
  Activity, 
  Calendar, 
  Filter,
  Download, 
  Upload,
  Maximize2,
  Minimize2,
  Info,
  Check,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente para visualizar Control Charts (gráficos de control)
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const ControlChart = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const chartRef = useRef(null);
  
  // Estados locales
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'data', 'settings'
  const [editingDataPoint, setEditingDataPoint] = useState(null);
  const [newDataPoint, setNewDataPoint] = useState({ date: '', value: '' });
  const [chartData, setChartData] = useState({
    title: 'Gráfico de Control',
    metric: 'Tiempo de Ciclo',
    unit: 'minutos',
    target: 10,
    upperLimit: 13,
    lowerLimit: 7,
    data: [
      { id: '1', date: '2025-01-01', value: 9.5 },
      { id: '2', date: '2025-01-08', value: 10.2 },
      { id: '3', date: '2025-01-15', value: 8.7 },
      { id: '4', date: '2025-01-22', value: 11.3 },
      { id: '5', date: '2025-01-29', value: 9.8 },
      { id: '6', date: '2025-02-05', value: 10.5 },
      { id: '7', date: '2025-02-12', value: 12.1 },
      { id: '8', date: '2025-02-19', value: 9.2 },
      { id: '9', date: '2025-02-26', value: 10.0 },
      { id: '10', date: '2025-03-05', value: 8.5 }
    ]
  });
  
  // Cargar datos del proyecto
  useEffect(() => {
    if (project && project.controlChart) {
      setChartData(project.controlChart);
    }
  }, [project]);

  // Calcular estadísticas del gráfico
  const calculateStats = () => {
    if (!chartData.data || chartData.data.length === 0) {
      return { mean: 0, stdDev: 0, max: 0, min: 0 };
    }

    const values = chartData.data.map(d => parseFloat(d.value));
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { mean, stdDev, max, min };
  };

  const stats = calculateStats();

  // Función para guardar cambios
  const saveChanges = () => {
    if (!project) return;
    
    setIsSaving(true);
    
    // Guardar los cambios al proyecto
    updateProject(projectId, {
      ...project,
      controlChart: chartData
    });
    
    // Simular tiempo de guardado
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 800);
  };

  // Función para alternar el modo pantalla completa
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Función para añadir un nuevo punto de datos
  const addDataPoint = () => {
    if (!newDataPoint.date || !newDataPoint.value) return;
    
    const value = parseFloat(newDataPoint.value);
    if (isNaN(value)) return;
    
    setChartData(prev => ({
      ...prev,
      data: [
        ...prev.data,
        {
          id: Date.now().toString(),
          date: newDataPoint.date,
          value: value
        }
      ].sort((a, b) => new Date(a.date) - new Date(b.date)) // Ordenar por fecha
    }));
    
    setNewDataPoint({ date: '', value: '' });
  };

  // Función para editar un punto de datos existente
  const startEditDataPoint = (id) => {
    const dataPoint = chartData.data.find(d => d.id === id);
    if (!dataPoint) return;
    
    setEditingDataPoint({
      id: dataPoint.id,
      date: dataPoint.date,
      value: dataPoint.value.toString()
    });
  };

  // Función para guardar un punto de datos editado
  const saveDataPoint = () => {
    if (!editingDataPoint) return;
    
    const value = parseFloat(editingDataPoint.value);
    if (isNaN(value)) return;
    
    setChartData(prev => ({
      ...prev,
      data: prev.data.map(d => 
        d.id === editingDataPoint.id 
          ? { ...d, date: editingDataPoint.date, value: value }
          : d
      ).sort((a, b) => new Date(a.date) - new Date(b.date)) // Ordenar por fecha
    }));
    
    setEditingDataPoint(null);
  };

  // Función para eliminar un punto de datos
  const deleteDataPoint = (id) => {
    setChartData(prev => ({
      ...prev,
      data: prev.data.filter(d => d.id !== id)
    }));
  };

  // Función para actualizar los ajustes del gráfico
  const updateChartSettings = (field, value) => {
    if (field === 'target' || field === 'upperLimit' || field === 'lowerLimit') {
      value = parseFloat(value);
      if (isNaN(value)) return;
    }
    
    setChartData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para exportar datos
  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Fecha,Valor\n" 
      + chartData.data.map(row => `${row.date},${row.value}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `control_chart_${projectId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Si no hay proyecto, no mostrar nada
  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando proyecto...</p>
      </div>
    );
  }

  // Clase condicional para el contenedor principal cuando está en pantalla completa
  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 overflow-auto bg-white dark:bg-gray-900 p-4"
    : "min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-gray-900 p-4";

  return (
    <div className={containerClass}>
      <div className={`${isFullscreen ? '' : 'max-w-6xl mx-auto'}`}>
        {/* Cabecera */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
              <Activity className="mr-2" size={28} />
              Gráfico de Control
            </h1>
            
            <div className="flex space-x-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Edit size={16} className="mr-2" /> Editar
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveChanges}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin mr-2">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" /> Guardar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <X size={16} className="mr-2" /> Cancelar
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <Info size={14} className="mr-1" />
            Gráfico utilizado para monitorear la estabilidad de un proceso a lo largo del tiempo y detectar variaciones anómalas.
          </p>
        </div>
        
        {/* Pestañas de navegación */}
        <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('chart')}
            className={`py-2 px-4 font-medium text-sm flex items-center ${
              activeTab === 'chart'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Activity size={16} className="mr-2" /> Gráfico
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2 px-4 font-medium text-sm flex items-center ${
              activeTab === 'data'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Calendar size={16} className="mr-2" /> Datos
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-4 font-medium text-sm flex items-center ${
              activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Filter size={16} className="mr-2" /> Configuración
          </button>
        </div>
        
        {/* Contenido principal */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeTab === 'chart' && (
              <motion.div 
                key="chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {chartData.title}: {chartData.metric} ({chartData.unit})
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={exportData}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded flex items-center text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Download size={14} className="mr-1" /> Exportar CSV
                    </button>
                  )}
                </div>
                
                {/* Visualización del gráfico de control */}
                <div 
                  ref={chartRef}
                  className="w-full h-64 md:h-80 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700 relative"
                >
                  {/* Representación visual del gráfico */}
                  <div className="absolute inset-0 p-4">
                    {/* Líneas de límite superior, objetivo y límite inferior */}
                    <div className="absolute top-1/4 left-0 right-0 h-px bg-red-400 border-t border-dashed border-red-400 flex items-center justify-end">
                      <span className="bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded absolute right-0">UCL: {chartData.upperLimit} {chartData.unit}</span>
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-green-500 border-t border-green-500 flex items-center justify-end">
                      <span className="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded absolute right-0">Objetivo: {chartData.target} {chartData.unit}</span>
                    </div>
                    <div className="absolute top-3/4 left-0 right-0 h-px bg-red-400 border-t border-dashed border-red-400 flex items-center justify-end">
                      <span className="bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded absolute right-0">LCL: {chartData.lowerLimit} {chartData.unit}</span>
                    </div>
                    
                    {/* Puntos de datos */}
                    {chartData.data.length > 0 && (
                      <>
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-xs text-gray-500 dark:text-gray-400">
                          {chartData.data.slice(0, 10).map((point, index) => (
                            <div key={point.id} className="text-center">
                              {new Date(point.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                            </div>
                          ))}
                        </div>                        
                        
                        <svg className="w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="none">
                          {/* Línea que conecta los puntos */}
                          <polyline
                            points={chartData.data.slice(0, 10).map((point, index) => {
                              const x = (index / (chartData.data.length - 1 || 1)) * 1000;
                              const range = chartData.upperLimit - chartData.lowerLimit;
                              const normalized = (point.value - chartData.lowerLimit) / (range || 1);
                              const y = 500 - (normalized * 400 + 50);
                              return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                          />
                          
                          {/* Puntos individuales */}
                          {chartData.data.slice(0, 10).map((point, index) => {
                            const x = (index / (chartData.data.length - 1 || 1)) * 1000;
                            const range = chartData.upperLimit - chartData.lowerLimit;
                            const normalized = (point.value - chartData.lowerLimit) / (range || 1);
                            const y = 500 - (normalized * 400 + 50);
                            
                            // Determinar el color del punto según si está fuera de límites
                            let color = "#3b82f6"; // Azul normal
                            if (point.value > chartData.upperLimit) color = "#ef4444"; // Rojo para valores sobre el límite superior
                            if (point.value < chartData.lowerLimit) color = "#ef4444"; // Rojo para valores bajo el límite inferior
                            
                            return (
                              <g key={point.id}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="6"
                                  fill={color}
                                />
                                <text
                                  x={x}
                                  y={y - 15}
                                  textAnchor="middle"
                                  fill="currentColor"
                                  fontSize="12"
                                  className="text-gray-700 dark:text-gray-300"
                                >
                                  {point.value}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </>
                    )}
                    
                    {chartData.data.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">
                          No hay datos disponibles para mostrar
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Media</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.mean.toFixed(2)} {chartData.unit}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Desviación Estándar</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.stdDev.toFixed(2)} {chartData.unit}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Valor Máximo</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.max.toFixed(2)} {chartData.unit}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Valor Mínimo</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.min.toFixed(2)} {chartData.unit}</p>
                  </div>
                </div>
                
                {/* Observaciones y anomalías */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2 flex items-center">
                    <Info size={16} className="mr-2" /> Análisis Automático
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {chartData.data.length === 0 && (
                      <li className="text-gray-500">Añade datos para generar un análisis automático.</li>
                    )}
                    
                    {chartData.data.length > 0 && (
                      <>
                        {stats.mean > chartData.target && (
                          <li className="flex items-center text-yellow-700 dark:text-yellow-400">
                            <ArrowUp size={14} className="mr-2" /> La media está por encima del valor objetivo.
                          </li>
                        )}
                        
                        {stats.mean < chartData.target && (
                          <li className="flex items-center text-yellow-700 dark:text-yellow-400">
                            <ArrowDown size={14} className="mr-2" /> La media está por debajo del valor objetivo.
                          </li>
                        )}
                        
                        {chartData.data.some(d => d.value > chartData.upperLimit) && (
                          <li className="flex items-center text-red-700 dark:text-red-400">
                            <Info size={14} className="mr-2" /> Hay puntos fuera del límite de control superior.
                          </li>
                        )}
                        
                        {chartData.data.some(d => d.value < chartData.lowerLimit) && (
                          <li className="flex items-center text-red-700 dark:text-red-400">
                            <Info size={14} className="mr-2" /> Hay puntos fuera del límite de control inferior.
                          </li>
                        )}
                        
                        {stats.stdDev < (chartData.upperLimit - chartData.lowerLimit) / 6 && (
                          <li className="flex items-center text-green-700 dark:text-green-400">
                            <Check size={14} className="mr-2" /> El proceso muestra buena estabilidad.
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'data' && (
              <motion.div 
                key="data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Datos del Gráfico de Control
                  </h2>
                  {isEditing && (
                    <button
                      onClick={() => document.getElementById('fileInput').click()}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded flex items-center text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <Upload size={14} className="mr-1" /> Importar CSV
                      <input 
                        id="fileInput" 
                        type="file"
                        accept=".csv"
                        className="hidden"
                      />
                    </button>
                  )}
                </div>
                
                {/* Tabla de datos */}
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Valor ({chartData.unit})</th>
                        {isEditing && <th className="py-2 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.data.map((point) => (
                        <tr key={point.id} className="border-t border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">
                            {editingDataPoint && editingDataPoint.id === point.id ? (
                              <input
                                type="date"
                                value={editingDataPoint.date}
                                onChange={(e) => setEditingDataPoint({...editingDataPoint, date: e.target.value})}
                                className="border rounded p-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            ) : (
                              new Date(point.date).toLocaleDateString('es-ES')
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">
                            {editingDataPoint && editingDataPoint.id === point.id ? (
                              <input
                                type="number"
                                step="0.1"
                                value={editingDataPoint.value}
                                onChange={(e) => setEditingDataPoint({...editingDataPoint, value: e.target.value})}
                                className="border rounded p-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            ) : (
                              point.value
                            )}
                          </td>
                          {isEditing && (
                            <td className="py-3 px-4 text-sm">
                              {editingDataPoint && editingDataPoint.id === point.id ? (
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={saveDataPoint}
                                    className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setEditingDataPoint(null)}
                                    className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => startEditDataPoint(point.id)}
                                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button 
                                    onClick={() => deleteDataPoint(point.id)}
                                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      
                      {isEditing && (
                        <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                          <td className="py-3 px-4 text-sm">
                            <input
                              type="date"
                              value={newDataPoint.date}
                              onChange={(e) => setNewDataPoint({...newDataPoint, date: e.target.value})}
                              className="border rounded p-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="YYYY-MM-DD"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <input
                              type="number"
                              step="0.1"
                              value={newDataPoint.value}
                              onChange={(e) => setNewDataPoint({...newDataPoint, value: e.target.value})}
                              className="border rounded p-1 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              placeholder="Valor"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <button 
                              onClick={addDataPoint}
                              className="p-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-800"
                            >
                              <Plus size={16} />
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Configuración del Gráfico
                  </h2>
                </div>
                
                {/* Configuración general */}
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Título del Gráfico
                      </label>
                      <input
                        type="text"
                        value={chartData.title}
                        disabled={!isEditing}
                        onChange={(e) => updateChartSettings('title', e.target.value)}
                        className="border rounded-md p-2 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Métrica
                      </label>
                      <input
                        type="text"
                        value={chartData.metric}
                        disabled={!isEditing}
                        onChange={(e) => updateChartSettings('metric', e.target.value)}
                        className="border rounded-md p-2 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unidad de Medida
                      </label>
                      <input
                        type="text"
                        value={chartData.unit}
                        disabled={!isEditing}
                        onChange={(e) => updateChartSettings('unit', e.target.value)}
                        className="border rounded-md p-2 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Límites de control */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-3">Límites de Control</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Valor Objetivo
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={chartData.target}
                        disabled={!isEditing}
                        onChange={(e) => updateChartSettings('target', e.target.value)}
                        className="border rounded-md p-2 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Límite Superior (UCL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={chartData.upperLimit}
                        disabled={!isEditing}
                        onChange={(e) => updateChartSettings('upperLimit', e.target.value)}
                        className="border rounded-md p-2 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Límite Inferior (LCL)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={chartData.lowerLimit}
                        disabled={!isEditing}
                        onChange={(e) => updateChartSettings('lowerLimit', e.target.value)}
                        className="border rounded-md p-2 w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ControlChart;
   