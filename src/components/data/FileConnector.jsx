import React, { useState, useRef } from 'react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { 
  Upload, 
  FileText, 
  Database, 
  Download, 
  X, 
  Check, 
  AlertTriangle, 
  Table
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Componente para importar y exportar datos desde diferentes fuentes
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 * @param {Function} props.onDataImported - Función a llamar cuando se importan datos
 * @param {string} props.targetTool - ID de la herramienta objetivo (opcional)
 */
const FileConnector = ({ projectId, onDataImported, targetTool }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  const [activeTab, setActiveTab] = useState('csv'); // csv, excel, api
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Opciones disponibles
  const sources = [
    { id: 'csv', name: 'CSV', icon: FileText },
    { id: 'excel', name: 'Excel', icon: Table },
    { id: 'api', name: 'API', icon: Database },
  ];
  
  // Disparar clic en input de archivo
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  // Manejar carga de archivo
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Simulación de progreso
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Procesar el archivo según el tipo
      let parsedData;
      
      if (activeTab === 'csv') {
        parsedData = await parseCSV(file);
      } else if (activeTab === 'excel') {
        parsedData = await parseExcel(file);
      }
      
      setPreviewData(parsedData);
      
      // Completar progreso
      clearInterval(interval);
      setUploadProgress(100);
      
      // Resetear después de 1 segundo
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      setUploadError(error.message);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Analizar archivo CSV
  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\\n');
          const headers = lines[0].split(',').map(header => header.trim());
          
          const rows = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',').map(value => value.trim());
            const row = {};
            
            headers.forEach((header, j) => {
              row[header] = values[j];
            });
            
            rows.push(row);
          }
          
          resolve({
            headers,
            rows,
            sourceType: 'csv',
            fileName: file.name
          });
        } catch (error) {
          reject(new Error('Error al procesar el archivo CSV. Verifique el formato.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo.'));
      };
      
      reader.readAsText(file);
    });
  };
  
  // Analizar archivo Excel (simulado, requeriría librería como xlsx en la implementación real)
  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      // En una implementación real, usaríamos una librería como xlsx
      // Por ahora, simplemente simularemos el resultado
      setTimeout(() => {
        try {
          // Simulación de datos de Excel
          const headers = ['Fecha', 'Cliente', 'Producto', 'Cantidad', 'Precio'];
          const rows = [
            { Fecha: '2025-01-15', Cliente: 'ABC Corp', Producto: 'Widget A', Cantidad: '10', Precio: '150.00' },
            { Fecha: '2025-01-20', Cliente: 'XYZ Inc', Producto: 'Widget B', Cantidad: '5', Precio: '320.00' },
            { Fecha: '2025-02-03', Cliente: 'Acme Ltd', Producto: 'Widget C', Cantidad: '8', Precio: '220.00' }
          ];
          
          resolve({
            headers,
            rows,
            sourceType: 'excel',
            fileName: file.name
          });
        } catch (error) {
          reject(new Error('Error al procesar el archivo Excel. Verifique el formato.'));
        }
      }, 800);
    });
  };
  
  // Conectar a API
  const connectToAPI = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Simulación de progreso
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Simulación de conexión a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Datos simulados de API
      const headers = ['ID', 'Fecha', 'Transacción', 'Monto', 'Estado'];
      const rows = [
        { ID: '001', Fecha: '2025-03-10', Transacción: 'Compra', Monto: '1200.00', Estado: 'Completada' },
        { ID: '002', Fecha: '2025-03-11', Transacción: 'Venta', Monto: '850.00', Estado: 'Pendiente' },
        { ID: '003', Fecha: '2025-03-15', Transacción: 'Reembolso', Monto: '320.00', Estado: 'Procesando' }
      ];
      
      setPreviewData({
        headers,
        rows,
        sourceType: 'api',
        endpoint: apiEndpoint
      });
      
      // Completar progreso
      clearInterval(interval);
      setUploadProgress(100);
      
      // Resetear después de 1 segundo
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      setUploadError('Error al conectar con la API. Verifique la URL y credenciales.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Importar datos previsualizado
  const importData = () => {
    if (!previewData) return;
    
    // Actualizar el proyecto con los datos
    if (targetTool) {
      // Si hay una herramienta objetivo, asignar los datos a esa herramienta
      const toolData = {
        ...project[targetTool + 'Data'] || {},
        importedData: previewData,
        lastUpdated: new Date().toISOString()
      };
      
      const updateData = {};
      updateData[targetTool + 'Data'] = toolData;
      
      updateProject(projectId, updateData);
    } else {
      // Si no hay herramienta objetivo, guardar los datos en el proyecto general
      updateProject(projectId, { 
        importedData: previewData,
        lastDataImport: new Date().toISOString() 
      });
    }
    
    // Llamar a la función de callback si existe
    if (onDataImported && typeof onDataImported === 'function') {
      onDataImported(previewData);
    }
    
    // Limpiar previsualización
    setPreviewData(null);
  };
  
  // Cancelar importación
  const cancelImport = () => {
    setPreviewData(null);
    setUploadError(null);
  };
  
  // Si no hay proyecto, no mostrar nada
  if (!project) {
    return <div className="p-4 text-center text-gray-500">Cargando datos del proyecto...</div>;
  }
  
  return (
    <div className="file-connector bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 bg-indigo-600 dark:bg-indigo-800 text-white">
        <h3 className="text-lg font-medium flex items-center">
          <Database className="mr-2" size={18} />
          Conector de Datos
        </h3>
        <p className="text-sm opacity-80">
          Importa datos desde diferentes fuentes para análisis
        </p>
      </div>
      
      {/* Selector de fuente */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          {sources.map(source => (
            <button
              key={source.id}
              className={`px-3 py-2 rounded-md flex items-center text-sm ${
                activeTab === source.id 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab(source.id)}
            >
              <source.icon className="mr-2" size={16} />
              {source.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Área de carga */}
      <div className="p-6">
        {/* Si hay datos previsualizados, mostrarlos */}
        {previewData ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">
                  Vista previa de datos
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {previewData.sourceType === 'csv' || previewData.sourceType === 'excel' 
                    ? `Archivo: ${previewData.fileName}` 
                    : `API: ${previewData.endpoint}`}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={cancelImport}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Cancelar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {/* Tabla de previsualización */}
            <div className="overflow-x-auto mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {previewData.headers.map((header, index) => (
                      <th 
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {previewData.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''}>
                      {previewData.headers.map((header, cellIndex) => (
                        <td 
                          key={cellIndex}
                          className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400"
                        >
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {previewData.rows.length > 5 && (
                    <tr>
                      <td 
                        colSpan={previewData.headers.length}
                        className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center italic"
                      >
                        ... {previewData.rows.length - 5} más filas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="text-center">
              <button
                onClick={importData}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm flex items-center mx-auto"
              >
                <Check className="mr-2" size={16} />
                Importar datos
              </button>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'csv' || activeTab === 'excel' ? (
              <div className="text-center">
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 mb-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                  onClick={triggerFileInput}
                >
                  <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                    <Upload className="text-indigo-600 dark:text-indigo-400" size={24} />
                  </div>
                  
                  <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                    {activeTab === 'csv' ? 'Sube un archivo CSV' : 'Sube un archivo Excel'}
                  </h4>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Arrastra y suelta tu archivo aquí o haz clic para buscar
                  </p>
                  
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {activeTab === 'csv' 
                      ? 'Archivos .csv de hasta 10MB' 
                      : 'Archivos .xlsx, .xls de hasta 10MB'}
                  </p>
                  
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload}
                    accept={activeTab === 'csv' ? '.csv' : '.xlsx,.xls'}
                  />
                </div>
                
                {uploadError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center mb-4">
                    <AlertTriangle className="mr-2" size={16} />
                    {uploadError}
                  </div>
                )}
                
                {isUploading && (
                  <div className="mb-4">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {uploadProgress}%
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                  <p className="mb-1 font-medium">Formatos soportados:</p>
                  <ul className="list-disc list-inside text-left">
                    {activeTab === 'csv' ? (
                      <>
                        <li>Valores separados por comas (.csv)</li>
                        <li>UTF-8 o Latin-1 encoding</li>
                        <li>Primera fila como encabezados</li>
                      </>
                    ) : (
                      <>
                        <li>Libros de Excel (.xlsx, .xls)</li>
                        <li>Primera hoja de cálculo</li>
                        <li>Primera fila como encabezados</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Conectar a una API
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      URL del Endpoint
                    </label>
                    <input 
                      type="text" 
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="https://api.ejemplo.com/datos"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 bg-white dark:bg-gray-800 dark:text-gray-200" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Autenticación
                      </label>
                      <button 
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      >
                        {showApiKeyInput ? 'Ocultar' : 'Mostrar API Key'}
                      </button>
                    </div>
                    
                    {showApiKeyInput && (
                      <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="API Key o Token"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 bg-white dark:bg-gray-800 dark:text-gray-200 mb-3" 
                      />
                    )}
                  </div>
                  
                  {uploadError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center">
                      <AlertTriangle className="mr-2" size={16} />
                      {uploadError}
                    </div>
                  )}
                  
                  {isUploading && (
                    <div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                        {uploadProgress}%
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <button
                      onClick={connectToAPI}
                      disabled={!apiEndpoint}
                      className={`px-4 py-2 rounded-md text-white flex items-center ${
                        apiEndpoint 
                          ? 'bg-indigo-600 hover:bg-indigo-700' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Database className="mr-2" size={16} />
                      Conectar y previsualizar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileConnector;
