import { useState, useEffect } from 'react';
import { 
  Layers, 
  Save, 
  Edit, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Camera,
  Image,
  Upload,
  BarChart,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { motion } from 'framer-motion';

/**
 * Componente para implementar metodología 5S
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const FiveS = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // Estados locales
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [fiveSData, setFiveSData] = useState({
    area: '',
    date: '',
    assessor: '',
    steps: [
      { name: 'Seiri (Clasificar)', items: [], score: 0 },
      { name: 'Seiton (Ordenar)', items: [], score: 0 },
      { name: 'Seiso (Limpiar)', items: [], score: 0 },
      { name: 'Seiketsu (Estandarizar)', items: [], score: 0 },
      { name: 'Shitsuke (Mantener)', items: [], score: 0 }
    ]
  });
  
  // Cargar datos del proyecto
  useEffect(() => {
    if (project) {
      // Aquí cargaríamos datos del 5S desde el proyecto
    }
  }, [project]);

  // Función para guardar cambios
  const saveChanges = () => {
    if (!project) return;
    
    setIsSaving(true);
    
    // Aquí guardaríamos los cambios al proyecto
    
    // Simular guardado
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 1000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Cabecera */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Metodología 5S
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Metodología para organizar el lugar de trabajo: Seiri (Clasificar), Seiton (Ordenar), Seiso (Limpiar), Seiketsu (Estandarizar) y Shitsuke (Mantener).
          </p>
        </div>
        
        {/* Tabs de navegación */}
        <div className="flex flex-wrap justify-center mb-6">
          {fiveSData.steps.map((step, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`px-4 py-2 m-1 rounded-lg transition-all duration-300 ${
                activeTab === index 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {step.name}
            </button>
          ))}
        </div>
        
        {/* Contenido principal */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 min-h-[500px]">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              Componente 5S - Implementación pendiente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiveS;
