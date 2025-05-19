import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Activity, Users, Package, FileInput, BarChart3, ArrowRight, RefreshCw, Truck, Save, Edit, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';

/**
 * Componente de visualización SIPOC (Supplier, Input, Process, Output, Customer)
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const SipocViewer = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // Estados locales
  const [activeTab, setActiveTab] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sipocData, setSipocData] = useState([]);
  
  // Cargar datos del proyecto
  useEffect(() => {
    if (project) {
      // Si el proyecto tiene datos SIPOC, cargarlos
      if (project.sipocs && Array.isArray(project.sipocs)) {
        setSipocData(project.sipocs);
      } else {
        // Si no, crear datos SIPOC por defecto
        setSipocData([
          {
            id: 1,
            title: "Apertura y Desbloqueo de Clientes",
            icon: "Users",
            color: "bg-blue-600",
            hoverColor: "hover:bg-blue-700",
            textColor: "text-blue-600",
            data: [
              {
                suppliers: "Agente, Cliente, Personal de Sala",
                inputs: "Datos Cliente (vía Formulario, Foto WhatsApp, Verbal). Solicitud implícita de crédito/desbloqueo.",
                process: "1. Recibir/Solicitar datos del cliente (Canal informal/formal).",
                outputs: "Cliente creado/actualizado en FACTUAPP (si es vía Agente).",
                customers: "Agentes, Personal de Sala (necesitan cliente operativo)"
              },
              {
                suppliers: "FACTUAPP, FinanzasPRO (Sistemas actuales)",
                inputs: "Estado actual de CxC del cliente (obtenido reactivamente).",
                process: "2. (Si aplica) Digitación manual de datos.",
                outputs: "Cliente creado/actualizado en FinanzasPRO.",
                customers: "Dpto. Finanzas, Contabilidad (necesitan datos correctos)"
              }
            ]
          }
        ]);
      }
    }
  }, [project]);

  // Función para guardar cambios en el proyecto
  const saveChanges = () => {
    if (!project) return;
    
    setIsSaving(true);
    
    // Actualizar el proyecto con los datos SIPOC
    updateProject(projectId, {
      sipocs: sipocData,
      // Actualizar la propiedad tools para marcar el SIPOC como completado
      tools: {
        ...project.tools,
        'sipoc': {
          ...project.tools['sipoc'],
          status: 'completed',
          updatedAt: new Date().toISOString()
        }
      }
    });
    
    // Simular guardado
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      // Aquí se podría mostrar una notificación de éxito
    }, 1000);
  };

  // Función para alternar filas expandidas
  const toggleRow = (rowIndex) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowIndex]: !prev[rowIndex]
    }));
  };
  
  // Función para añadir un nuevo SIPOC
  const addNewSipoc = () => {
    const newId = sipocData.length > 0 ? Math.max(...sipocData.map(s => s.id)) + 1 : 1;
    
    setSipocData([
      ...sipocData,
      {
        id: newId,
        title: `Nuevo Proceso ${newId}`,
        icon: "Package",
        color: "bg-purple-600",
        hoverColor: "hover:bg-purple-700",
        textColor: "text-purple-600",
        data: [
          {
            suppliers: "Proveedor",
            inputs: "Entradas",
            process: "Proceso",
            outputs: "Salidas",
            customers: "Clientes"
          }
        ]
      }
    ]);
  };
  
  // Función para eliminar un SIPOC
  const deleteSipoc = (sipocId) => {
    setSipocData(sipocData.filter(sipoc => sipoc.id !== sipocId));
  };
  
  // Función para actualizar un SIPOC
  const updateSipoc = (sipocId, updatedData) => {
    setSipocData(sipocData.map(sipoc => 
      sipoc.id === sipocId ? { ...sipoc, ...updatedData } : sipoc
    ));
  };
  
  // Función para añadir una fila a un SIPOC
  const addRowToSipoc = (sipocId) => {
    setSipocData(sipocData.map(sipoc => {
      if (sipoc.id === sipocId) {
        return {
          ...sipoc,
          data: [
            ...sipoc.data,
            {
              suppliers: "",
              inputs: "",
              process: `${sipoc.data.length + 1}. `,
              outputs: "",
              customers: ""
            }
          ]
        };
      }
      return sipoc;
    }));
  };
  
  // Función para actualizar una fila específica de un SIPOC
  const updateSipocRow = (sipocId, rowIndex, updatedRow) => {
    setSipocData(sipocData.map(sipoc => {
      if (sipoc.id === sipocId) {
        const newData = [...sipoc.data];
        newData[rowIndex] = updatedRow;
        return { ...sipoc, data: newData };
      }
      return sipoc;
    }));
  };
  
  // Función para eliminar una fila específica de un SIPOC
  const deleteSipocRow = (sipocId, rowIndex) => {
    setSipocData(sipocData.map(sipoc => {
      if (sipoc.id === sipocId) {
        const newData = sipoc.data.filter((_, i) => i !== rowIndex);
        return { ...sipoc, data: newData };
      }
      return sipoc;
    }));
  };
  
  // Función para obtener el icono del SIPOC
  const getSipocIcon = (iconName, size = 20) => {
    const icons = {
      'Users': <Users className="w-5 h-5" />,
      'Package': <Package className="w-5 h-5" />,
      'Activity': <Activity className="w-5 h-5" />,
      'FileInput': <FileInput className="w-5 h-5" />,
      'BarChart3': <BarChart3 className="w-5 h-5" />,
      'RefreshCw': <RefreshCw className="w-5 h-5" />
    };
    
    return icons[iconName] || <Package className="w-5 h-5" />;
  };
  
  // Colores por columna
  const columnStyles = {
    suppliers: {
      icon: <Truck className="w-5 h-5" />,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
      darkBgColor: "bg-blue-700"
    },
    inputs: {
      icon: <FileInput className="w-5 h-5" />,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
      darkBgColor: "bg-purple-700"
    },
    process: {
      icon: <Activity className="w-5 h-5" />,
      color: "text-red-500",
      bgColor: "bg-red-100",
      darkBgColor: "bg-red-700"
    },
    outputs: {
      icon: <ArrowRight className="w-5 h-5" />,
      color: "text-green-500",
      bgColor: "bg-green-100",
      darkBgColor: "bg-green-700"
    },
    customers: {
      icon: <Users className="w-5 h-5" />,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
      darkBgColor: "bg-amber-700"
    }
  };
  
  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };
  
  // Si no hay proyecto, no mostrar nada
  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando proyecto...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col min-h-screen bg-gray-900"
    >
      <motion.div
        variants={itemVariants}
        className="bg-gray-800 shadow-lg rounded-lg p-6 m-4 border-b-4 border-indigo-600 transition-all duration-300 hover:shadow-xl"
      >
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-center text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-300">
              SIPOCs - {project.name}
            </span>
          </h1>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Edit size={16} className="mr-2" /> Editar
            </button>
          ) : (
            <div className="flex space-x-2">
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
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-400 text-center max-w-2xl mx-auto">
          Diagramas Supplier-Input-Process-Output-Customer para visualizar los procesos clave de negocio
        </p>
      </motion.div>
      
      {/* Tabs Navigation */}
      <motion.div variants={itemVariants} className="flex flex-wrap justify-center mb-6 px-4">
        {sipocData.map((sipoc, index) => (
          <button
            key={sipoc.id}
            onClick={() => setActiveTab(index)}
            className={`flex items-center px-5 py-3 m-1 rounded-lg transition-all duration-300 transform ${
              activeTab === index 
                ? `${sipoc.color} text-white shadow-md scale-105` 
                : 'bg-gray-800 text-gray-300 hover:shadow-md hover:scale-105'
            } ${sipoc.hoverColor}`}
          >
            <div className={`mr-2 ${activeTab !== index ? sipoc.textColor : ''}`}>
              {getSipocIcon(sipoc.icon)}
            </div>
            <span className="font-medium">{sipoc.title}</span>
            
            {isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSipoc(sipoc.id);
                }}
                className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-700"
              >
                <Trash2 size={14} />
              </button>
            )}
          </button>
        ))}
        
        {isEditing && (
          <button
            onClick={addNewSipoc}
            className="flex items-center px-5 py-3 m-1 rounded-lg transition-all duration-300 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Plus size={20} className="mr-2" />
            <span>Nuevo SIPOC</span>
          </button>
        )}
      </motion.div>
      
      {/* Current SIPOC Table */}
      <motion.div
        variants={itemVariants}
        className="bg-gray-800 shadow-lg rounded-lg overflow-hidden mx-4 mb-6 border border-gray-700 transition-all duration-500 animate-fadeIn"
      >
        {sipocData.length > 0 && activeTab < sipocData.length && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-3xl font-bold ${sipocData[activeTab].textColor} flex items-center`}>
                {getSipocIcon(sipocData[activeTab].icon)}
                <span className="ml-2">{sipocData[activeTab].title}</span>
              </h2>
              
              {isEditing && (
                <button
                  onClick={() => addRowToSipoc(sipocData[activeTab].id)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center text-sm"
                >
                  <Plus size={14} className="mr-1" /> Añadir Fila
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    {Object.entries(columnStyles).map(([key, style]) => (
                      <th key={key} scope="col" className={`p-4 text-left text-lg font-bold uppercase tracking-wider ${style.darkBgColor}`}>
                        <div className="flex items-center justify-center">
                          <div className="mr-2 text-white">
                            {style.icon}
                          </div>
                          <span className="text-white">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        </div>
                      </th>
                    ))}
                    {isEditing && (
                      <th scope="col" className="p-4 text-left text-lg font-bold uppercase tracking-wider bg-gray-700">
                        <span className="text-white">Acciones</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {sipocData[activeTab].data.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex} 
                      className={`
                        ${rowIndex % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800'} 
                        hover:bg-gray-700 transition-colors duration-150 cursor-pointer
                        ${expandedRows[rowIndex] ? 'border-l-4 border-indigo-500' : ''}
                      `}
                      onClick={() => !isEditing && toggleRow(rowIndex)}
                    >
                      {Object.entries(columnStyles).map(([key, style]) => (
                        <td 
                          key={key} 
                          className={`p-4 text-sm text-gray-300 align-top ${expandedRows[rowIndex] ? 'font-medium' : ''}`}
                        >
                          {isEditing ? (
                            <textarea
                              value={row[key] || ''}
                              onChange={(e) => {
                                const updatedRow = { ...row };
                                updatedRow[key] = e.target.value;
                                updateSipocRow(sipocData[activeTab].id, rowIndex, updatedRow);
                              }}
                              className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white"
                              rows="3"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className={`transition-all duration-300 rounded p-2 ${expandedRows[rowIndex] ? style.bgColor + ' ' + style.color : ''}`}>
                              {row[key] || '-'}
                            </div>
                          )}
                        </td>
                      ))}
                      
                      {isEditing && (
                        <td className="p-4 text-sm text-gray-300 align-top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSipocRow(sipocData[activeTab].id, rowIndex);
                            }}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            title="Eliminar fila"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {sipocData.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-400 mb-4">No hay SIPOCs disponibles</p>
            {isEditing && (
              <button
                onClick={addNewSipoc}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <Plus size={16} className="mr-2" /> Crear Primer SIPOC
              </button>
            )}
          </div>
        )}
      </motion.div>
      
      {/* Interactive Footer with Instructions */}
      <motion.div
        variants={itemVariants}
        className="mt-auto bg-gray-800 p-4 rounded-lg mx-4 mb-4 shadow-inner text-center border-t border-gray-700"
      >
        <p className="text-sm text-indigo-300">
          <span className="font-medium">Interactividad:</span> {isEditing 
            ? "Edita el contenido de las celdas y añade nuevas filas o SIPOCs." 
            : "Haz clic en cualquier fila para destacarla. Cambia entre pestañas para ver los diferentes procesos."}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Aplicación de visualización de SIPOCs - Proyecto de mejora de procesos
        </p>
      </motion.div>
      
      {/* Add animation CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </motion.div>
  );
};

export default SipocViewer;
