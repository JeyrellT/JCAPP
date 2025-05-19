import React, { useState, useEffect, useRef } from 'react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { motion } from 'framer-motion';
import {
  Save,
  Edit,
  Plus,
  Trash2,
  GitBranch,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowRight,
  RotateCcw,
  Download,
  Package,
  Truck,
  AlertTriangle,
  Clipboard,
  HelpCircle
} from 'lucide-react';
import html2canvas from 'html2canvas';

/**
 * Componente Mapa de Flujo de Valor (Value Stream Mapping)
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const ValueStreamMap = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const mapRef = useRef(null);

  // Estado para el VSM
  const [vsm, setVsm] = useState(() => {
    return project?.valueStreamMap || {
      processes: [],
      connections: [],
      metrics: {
        leadTime: 0,
        processTime: 0,
        waitingTime: 0,
        valueAddedRatio: 0
      },
      customer: { name: 'Cliente', demands: '' },
      supplier: { name: 'Proveedor', supplies: '' },
      currentState: true
    };
  });

  // Estado para edición
  const [editMode, setEditMode] = useState(!project?.valueStreamMap);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [creatingConnection, setCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // Actualizar el proyecto cuando cambia el VSM
  useEffect(() => {
    if (!editMode && project) {
      updateProject(projectId, { valueStreamMap: vsm });
    }
  }, [editMode]);

  // Calcular métricas del VSM
  useEffect(() => {
    if (vsm.processes.length > 0) {
      const leadTime = vsm.processes.reduce((sum, process) => sum + (parseFloat(process.cycleTime) || 0) + (parseFloat(process.waitTime) || 0), 0);
      const processTime = vsm.processes.reduce((sum, process) => sum + (parseFloat(process.cycleTime) || 0), 0);
      const waitingTime = vsm.processes.reduce((sum, process) => sum + (parseFloat(process.waitTime) || 0), 0);
      const valueAddedRatio = leadTime > 0 ? (processTime / leadTime) * 100 : 0;

      setVsm(prev => ({
        ...prev,
        metrics: {
          leadTime,
          processTime,
          waitingTime,
          valueAddedRatio
        }
      }));
    }
  }, [vsm.processes]);

  // Función para añadir un nuevo proceso
  const addProcess = () => {
    const newProcess = {
      id: `proc-${Date.now()}`,
      name: 'Nuevo Proceso',
      cycleTime: 0,
      waitTime: 0,
      operators: 1,
      uptime: 100,
      inventory: 0,
      defectRate: 0,
      x: vsm.processes.length * 180 + 200,
      y: 200
    };

    setVsm(prev => ({
      ...prev,
      processes: [...prev.processes, newProcess]
    }));

    setSelectedProcess(newProcess);
  };

  // Función para actualizar un proceso
  const updateProcess = (id, data) => {
    setVsm(prev => ({
      ...prev,
      processes: prev.processes.map(proc => 
        proc.id === id ? { ...proc, ...data } : proc
      )
    }));
  };

  // Función para eliminar un proceso
  const deleteProcess = (id) => {
    setVsm(prev => ({
      ...prev,
      processes: prev.processes.filter(proc => proc.id !== id),
      connections: prev.connections.filter(
        conn => conn.source !== id && conn.target !== id
      )
    }));

    if (selectedProcess?.id === id) {
      setSelectedProcess(null);
    }
  };

  // Función para iniciar la creación de una conexión
  const startConnection = (processId) => {
    setCreatingConnection(true);
    setConnectionStart(processId);
  };

  // Función para completar la creación de una conexión
  const completeConnection = (targetId) => {
    if (connectionStart && connectionStart !== targetId) {
      const newConnection = {
        id: `conn-${Date.now()}`,
        source: connectionStart,
        target: targetId,
        type: 'material', // material o information
        pushPull: 'push',
        quantity: 0,
        frequency: 'diaria'
      };

      setVsm(prev => ({
        ...prev,
        connections: [...prev.connections, newConnection]
      }));

      setSelectedConnection(newConnection);
    }

    setCreatingConnection(false);
    setConnectionStart(null);
  };

  // Función para actualizar una conexión
  const updateConnection = (id, data) => {
    setVsm(prev => ({
      ...prev,
      connections: prev.connections.map(conn => 
        conn.id === id ? { ...conn, ...data } : conn
      )
    }));
  };

  // Función para eliminar una conexión
  const deleteConnection = (id) => {
    setVsm(prev => ({
      ...prev,
      connections: prev.connections.filter(conn => conn.id !== id)
    }));

    if (selectedConnection?.id === id) {
      setSelectedConnection(null);
    }
  };

  // Función para actualizar proveedor o cliente
  const updateActor = (type, data) => {
    setVsm(prev => ({
      ...prev,
      [type]: { ...prev[type], ...data }
    }));
  };

  // Función para exportar el mapa como imagen
  const exportAsImage = async () => {
    if (mapRef.current) {
      try {
        const canvas = await html2canvas(mapRef.current, {
          backgroundColor: null,
          scale: 2
        });
        
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `vsm_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
      } catch (error) {
        console.error('Error al exportar la imagen:', error);
      }
    }
  };

  // Función para cambiar entre estado actual y futuro
  const toggleState = () => {
    setVsm(prev => ({
      ...prev,
      currentState: !prev.currentState
    }));
  };

  // Renderizado del proceso
  const renderProcess = (process) => {
    const isSelected = selectedProcess?.id === process.id;
    
    return (
      <motion.div
        key={process.id}
        className={`absolute px-3 py-2 rounded-md border-2 ${isSelected ? 'border-blue-500' : 'border-gray-400'} bg-white shadow-md w-40`}
        style={{ 
          left: process.x, 
          top: process.y,
          cursor: editMode ? 'move' : 'pointer'
        }}
        whileHover={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)' }}
        onClick={() => setSelectedProcess(process)}
        drag={editMode}
        dragMomentum={false}
        onDragEnd={(e, info) => {
          updateProcess(process.id, {
            x: process.x + info.offset.x,
            y: process.y + info.offset.y
          });
        }}
      >
        <div className="font-semibold text-center border-b pb-1">{process.name}</div>
        <div className="text-xs mt-1 grid grid-cols-2 gap-1">
          <div>CT: {process.cycleTime} min</div>
          <div>WT: {process.waitTime} min</div>
          <div>Op: {process.operators}</div>
          <div>Up: {process.uptime}%</div>
        </div>
        
        {editMode && (
          <div className="absolute -right-2 -top-2 flex gap-1">
            {creatingConnection ? (
              <button 
                className="bg-green-500 text-white rounded-full p-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  completeConnection(process.id);
                }}
              >
                <ArrowRight size={14} />
              </button>
            ) : (
              <button 
                className="bg-blue-500 text-white rounded-full p-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  startConnection(process.id);
                }}
              >
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  // Renderizado de las conexiones
  const renderConnections = () => {
    return vsm.connections.map(conn => {
      const source = vsm.processes.find(p => p.id === conn.source);
      const target = vsm.processes.find(p => p.id === conn.target);
      
      if (!source || !target) return null;
      
      const isSelected = selectedConnection?.id === conn.id;
      
      // Calcular puntos de inicio y fin
      const startX = source.x + 70;
      const startY = source.y + 40;
      const endX = target.x;
      const endY = target.y + 40;
      
      // Crear path para la flecha
      const path = `M${startX},${startY} L${endX},${endY}`;
      
      return (
        <g key={conn.id} onClick={() => setSelectedConnection(conn)} className="cursor-pointer">
          <path 
            d={path} 
            stroke={isSelected ? "blue" : (conn.type === "information" ? "#888" : "#333")} 
            strokeWidth={isSelected ? 3 : 2} 
            fill="none" 
            strokeDasharray={conn.type === "information" ? "5,5" : "none"}
          />
          
          {/* Flecha */}
          <polygon 
            points={`${endX},${endY} ${endX-10},${endY-5} ${endX-10},${endY+5}`} 
            fill={isSelected ? "blue" : (conn.type === "information" ? "#888" : "#333")} 
          />
          
          {/* Etiqueta de la conexión */}
          <text 
            x={(startX + endX) / 2} 
            y={(startY + endY) / 2 - 10} 
            fontSize="10" 
            textAnchor="middle" 
            fill={isSelected ? "blue" : "#666"}
            className="bg-white px-1"
          >
            {conn.quantity > 0 ? `${conn.quantity} uds/${conn.frequency}` : ''}
          </text>
          
          {/* Icono según tipo push/pull */}
          {conn.pushPull === 'pull' && (
            <text 
              x={(startX + endX) / 2} 
              y={(startY + endY) / 2 + 15} 
              fontSize="14" 
              textAnchor="middle" 
              fill="#006600"
            >
              ⟲
            </text>
          )}
        </g>
      );
    });
  };

  // Renderizado del proveedor y cliente
  const renderEndpoints = () => {
    return (
      <>
        {/* Proveedor */}
        <motion.div
          className="absolute px-3 py-2 rounded-md border-2 border-gray-400 bg-yellow-50 shadow-md w-40"
          style={{ left: 50, top: 200 }}
          whileHover={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)' }}
          onClick={() => editMode && setSelectedProcess('supplier')}
        >
          <div className="font-semibold text-center border-b pb-1 flex items-center justify-center">
            <Truck size={16} className="mr-1" />
            {vsm.supplier.name}
          </div>
          <div className="text-xs mt-1">
            {vsm.supplier.supplies}
          </div>
        </motion.div>

        {/* Cliente */}
        <motion.div
          className="absolute px-3 py-2 rounded-md border-2 border-gray-400 bg-green-50 shadow-md w-40"
          style={{ left: Math.max(...vsm.processes.map(p => p.x), 200) + 200, top: 200 }}
          whileHover={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)' }}
          onClick={() => editMode && setSelectedProcess('customer')}
        >
          <div className="font-semibold text-center border-b pb-1 flex items-center justify-center">
            <Package size={16} className="mr-1" />
            {vsm.customer.name}
          </div>
          <div className="text-xs mt-1">
            {vsm.customer.demands}
          </div>
        </motion.div>
      </>
    );
  };

  // Panel de propiedades para editar un proceso/conexión seleccionada
  const renderPropertiesPanel = () => {
    if (!editMode) return null;
    
    if (selectedProcess === 'supplier') {
      return (
        <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-xs">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <Truck size={18} className="mr-2" />
            Proveedor
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={vsm.supplier.name}
                onChange={(e) => updateActor('supplier', { name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Suministros</label>
              <textarea
                className="w-full p-2 border rounded"
                value={vsm.supplier.supplies}
                onChange={(e) => updateActor('supplier', { supplies: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>
      );
    }
    
    if (selectedProcess === 'customer') {
      return (
        <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-xs">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <Package size={18} className="mr-2" />
            Cliente
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={vsm.customer.name}
                onChange={(e) => updateActor('customer', { name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Demanda</label>
              <textarea
                className="w-full p-2 border rounded"
                value={vsm.customer.demands}
                onChange={(e) => updateActor('customer', { demands: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>
      );
    }
    
    if (selectedProcess) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-xs">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <GitBranch size={18} className="mr-2" />
            Propiedades del Proceso
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={selectedProcess.name}
                onChange={(e) => updateProcess(selectedProcess.id, { name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Clock size={14} className="inline mr-1" />
                  Tiempo de Ciclo (min)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full p-2 border rounded"
                  value={selectedProcess.cycleTime}
                  onChange={(e) => updateProcess(selectedProcess.id, { cycleTime: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Clock size={14} className="inline mr-1" />
                  Tiempo de Espera (min)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full p-2 border rounded"
                  value={selectedProcess.waitTime}
                  onChange={(e) => updateProcess(selectedProcess.id, { waitTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Operadores</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border rounded"
                  value={selectedProcess.operators}
                  onChange={(e) => updateProcess(selectedProcess.id, { operators: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Disponibilidad (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full p-2 border rounded"
                  value={selectedProcess.uptime}
                  onChange={(e) => updateProcess(selectedProcess.id, { uptime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Inventario</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border rounded"
                  value={selectedProcess.inventory}
                  onChange={(e) => updateProcess(selectedProcess.id, { inventory: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">% Defectos</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full p-2 border rounded"
                  value={selectedProcess.defectRate}
                  onChange={(e) => updateProcess(selectedProcess.id, { defectRate: e.target.value })}
                />
              </div>
            </div>
            
            <button
              onClick={() => deleteProcess(selectedProcess.id)}
              className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center justify-center"
            >
              <Trash2 size={16} className="mr-1" />
              Eliminar Proceso
            </button>
          </div>
        </div>
      );
    }
    
    if (selectedConnection) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-xs">
          <h3 className="font-bold text-lg mb-3 flex items-center">
            <ArrowRight size={18} className="mr-2" />
            Propiedades de la Conexión
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedConnection.type}
                onChange={(e) => updateConnection(selectedConnection.id, { type: e.target.value })}
              >
                <option value="material">Material</option>
                <option value="information">Información</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Método</label>
              <select
                className="w-full p-2 border rounded"
                value={selectedConnection.pushPull}
                onChange={(e) => updateConnection(selectedConnection.id, { pushPull: e.target.value })}
              >
                <option value="push">Push (Empujar)</option>
                <option value="pull">Pull (Jalar)</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border rounded"
                  value={selectedConnection.quantity}
                  onChange={(e) => updateConnection(selectedConnection.id, { quantity: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Frecuencia</label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedConnection.frequency}
                  onChange={(e) => updateConnection(selectedConnection.id, { frequency: e.target.value })}
                >
                  <option value="horaria">Horaria</option>
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={() => deleteConnection(selectedConnection.id)}
              className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded flex items-center justify-center"
            >
              <Trash2 size={16} className="mr-1" />
              Eliminar Conexión
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-xs">
        <p className="text-gray-500">Selecciona un elemento para editar sus propiedades.</p>
        
        <button
          onClick={addProcess}
          className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center"
        >
          <Plus size={16} className="mr-1" />
          Añadir Proceso
        </button>
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
          Ayuda del VSM
        </h3>
        
        <div className="space-y-2 text-sm">
          <p><strong>Modo Edición:</strong> Activa/desactiva con el botón Editar.</p>
          <p><strong>Añadir Proceso:</strong> Botón '+' en panel de propiedades.</p>
          <p><strong>Conectar Procesos:</strong> Haz clic en el botón de flecha azul y luego en el proceso destino.</p>
          <p><strong>Editar Elementos:</strong> Haz clic en cualquier elemento para modificar sus propiedades.</p>
          <p><strong>Mover Procesos:</strong> Arrastra los procesos en modo edición.</p>
          <p><strong>Guardar Cambios:</strong> Desactiva el modo edición o usa el botón Guardar.</p>
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

  // Renderizar métricas
  const renderMetrics = () => {
    return (
      <div className="bg-gray-100 p-3 rounded-md shadow-sm mb-4">
        <h3 className="font-semibold text-lg mb-2 flex items-center">
          <Clipboard size={18} className="mr-2" />
          Métricas del Proceso
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-2 rounded shadow-sm">
            <div className="text-sm text-gray-600">Lead Time Total</div>
            <div className="font-bold text-lg flex items-center">
              <Clock size={16} className="mr-1 text-blue-500" />
              {vsm.metrics.leadTime.toFixed(1)} min
            </div>
          </div>
          
          <div className="bg-white p-2 rounded shadow-sm">
            <div className="text-sm text-gray-600">Tiempo de Proceso</div>
            <div className="font-bold text-lg flex items-center">
              <Zap size={16} className="mr-1 text-green-500" />
              {vsm.metrics.processTime.toFixed(1)} min
            </div>
          </div>
          
          <div className="bg-white p-2 rounded shadow-sm">
            <div className="text-sm text-gray-600">Tiempo de Espera</div>
            <div className="font-bold text-lg flex items-center">
              <Clock size={16} className="mr-1 text-red-500" />
              {vsm.metrics.waitingTime.toFixed(1)} min
            </div>
          </div>
          
          <div className="bg-white p-2 rounded shadow-sm">
            <div className="text-sm text-gray-600">Ratio Valor Añadido</div>
            <div className="font-bold text-lg flex items-center">
              {vsm.metrics.valueAddedRatio > 30 ? (
                <TrendingUp size={16} className="mr-1 text-green-500" />
              ) : (
                <TrendingDown size={16} className="mr-1 text-red-500" />
              )}
              {vsm.metrics.valueAddedRatio.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <GitBranch className="mr-2" />
          {vsm.currentState ? 'Mapa de Flujo de Valor - Estado Actual' : 'Mapa de Flujo de Valor - Estado Futuro'}
        </h2>
        
        <div className="flex gap-2">
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            onClick={() => setShowHelp(!showHelp)}
            title="Ayuda"
          >
            <HelpCircle size={20} />
          </button>
          
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            onClick={toggleState}
            title="Cambiar entre estado actual y futuro"
          >
            <RotateCcw size={20} />
          </button>
          
          <button
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            onClick={exportAsImage}
            title="Exportar como imagen"
          >
            <Download size={20} />
          </button>
          
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
      
      {renderMetrics()}

      <div className="flex h-[calc(100vh-300px)] relative">
        <div className={`flex-grow overflow-auto border border-gray-200 rounded-lg relative ${editMode ? 'bg-gray-50' : 'bg-white'}`}>
          {/* Indicador cuando estamos en modo de conexión */}
          {creatingConnection && (
            <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm border border-yellow-300 flex items-center z-10">
              <AlertTriangle size={14} className="mr-1" />
              Selecciona un proceso destino para la conexión
            </div>
          )}
          
          <div 
            className="relative w-full h-full min-h-[500px]"
            ref={mapRef}
            onClick={() => {
              if (creatingConnection) {
                setCreatingConnection(false);
                setConnectionStart(null);
              } else {
                setSelectedProcess(null);
                setSelectedConnection(null);
              }
            }}
          >
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {renderConnections()}
            </svg>
            
            {renderEndpoints()}
            
            {vsm.processes.map(process => renderProcess(process))}
          </div>
        </div>
        
        {editMode && (
          <div className="w-64 ml-4 overflow-y-auto">
            {renderPropertiesPanel()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValueStreamMap;
