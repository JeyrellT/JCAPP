import { useState, useEffect, useRef } from 'react';
import { 
  GitBranch, 
  Save, 
  Edit, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Info,
  Maximize2,
  Minimize2,
  Move,
  Check,
  X,
  Lightbulb,
  Clock,
  Eye,
  EyeOff,
  AlertTriangle,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import ToolHeader from '../components/common/ToolHeader';
import ToolsNavigation from '../components/navigation/ToolsNavigation';
import Notification from '../components/common/Notification';

/**
 * Componente para visualizar un Diagrama Causa-Efecto (Ishikawa/Espina de Pescado)
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const CauseEffectDiagram = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const diagramRef = useRef(null);
  
  // Estados locales
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemText, setNewItemText] = useState('');
  const [diagramData, setDiagramData] = useState({
    problem: 'Definir el problema central',
    categories: [
      { id: '1', name: 'Maquinaria', causes: [] },
      { id: '2', name: 'Materiales', causes: [] },
      { id: '3', name: 'Métodos', causes: [] },
      { id: '4', name: 'Mano de Obra', causes: [] },
      { id: '5', name: 'Medio Ambiente', causes: [] },
      { id: '6', name: 'Medición', causes: [] }
    ]
  });
  
  // Cargar datos del proyecto
  useEffect(() => {
    if (project && project.causeEffectDiagram) {
      setDiagramData(project.causeEffectDiagram);
    }
  }, [project]);

  // Función para guardar cambios
  const saveChanges = () => {
    if (!project) return;
    
    setIsSaving(true);
    
    // Guardar los cambios al proyecto
    updateProject(projectId, {
      ...project,
      causeEffectDiagram: diagramData
    });
    
    // Simular tiempo de guardado
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
      showNotification("Diagrama guardado correctamente", "success");
    }, 800);
  };

  // Función para alternar el modo pantalla completa
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Función para añadir una nueva causa
  const addCause = (categoryId) => {
    setActiveCategory(categoryId);
    setEditingItem({
      isNew: true,
      categoryId: categoryId
    });
    setNewItemText('');
  };

  // Función para editar una causa existente
  const editCause = (categoryId, causeId, text) => {
    setActiveCategory(categoryId);
    setEditingItem({
      isNew: false,
      categoryId: categoryId,
      causeId: causeId
    });
    setNewItemText(text);
  };

  // Función para eliminar una causa
  const deleteCause = (categoryId, causeId) => {
    setDiagramData(prev => ({
      ...prev,
      categories: prev.categories.map(category => 
        category.id === categoryId 
          ? { 
              ...category, 
              causes: category.causes.filter(cause => cause.id !== causeId) 
            }
          : category
      )
    }));
    
    showNotification("Causa eliminada correctamente", "info");
  };

  // Función para guardar una causa (nueva o editada)
  const saveCause = () => {
    if (!editingItem || !newItemText.trim()) {
      setEditingItem(null);
      return;
    }

    setDiagramData(prev => ({
      ...prev,
      categories: prev.categories.map(category => {
        if (category.id === editingItem.categoryId) {
          if (editingItem.isNew) {
            // Añadir nueva causa
            showNotification("Causa añadida correctamente", "success");
            return {
              ...category,
              causes: [
                ...category.causes,
                { id: Date.now().toString(), text: newItemText.trim() }
              ]
            };
          } else {
            // Actualizar causa existente
            showNotification("Causa actualizada correctamente", "success");
            return {
              ...category,
              causes: category.causes.map(cause => 
                cause.id === editingItem.causeId
                  ? { ...cause, text: newItemText.trim() }
                  : cause
              )
            };
          }
        }
        return category;
      })
    }));

    setEditingItem(null);
    setNewItemText('');
  };

  // Función para cancelar la edición de una causa
  const cancelCauseEdit = () => {
    setEditingItem(null);
    setNewItemText('');
  };

  // Función para editar el problema central
  const editProblem = () => {
    if (!isEditing) return;
    
    const newProblem = prompt("Define el problema central:", diagramData.problem);
    if (newProblem && newProblem.trim()) {
      setDiagramData(prev => ({
        ...prev,
        problem: newProblem.trim()
      }));
    }
  };

  // Función para editar el nombre de una categoría
  const editCategory = (categoryId) => {
    if (!isEditing) return;
    
    const category = diagramData.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const newName = prompt("Nombre de la categoría:", category.name);
    if (newName && newName.trim()) {
      setDiagramData(prev => ({
        ...prev,
        categories: prev.categories.map(c => 
          c.id === categoryId ? { ...c, name: newName.trim() } : c
        )
      }));
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

  // Estados para notificaciones
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Función para mostrar notificación
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  // Función para cerrar notificación
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Clase condicional para el contenedor principal cuando está en pantalla completa
  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 overflow-auto bg-white dark:bg-gray-900 p-4"
    : "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-gray-900 p-4";

  return (
    <div className={containerClass}>
      <div className={`${isFullscreen ? '' : 'max-w-6xl mx-auto'}`}>
        {/* Componente de notificación */}
        <Notification
          message={notification.message}
          type={notification.type}
          show={notification.show}
          onClose={closeNotification}
          duration={3000}
        />
        
        {/* Cabecera */}
        <ToolHeader
          icon={GitBranch}
          title="Diagrama Causa-Efecto"
          description="También conocido como diagrama de Ishikawa o espina de pescado, identifica posibles causas de un problema."
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          saveChanges={saveChanges}
          isSaving={isSaving}
        />
        
        {/* Contenido principal */}
        <div 
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 min-h-[600px] relative overflow-hidden mb-6"
          ref={diagramRef}
        >
          {/* Diagrama Causa-Efecto (Ishikawa) */}
          <div className="w-full h-full flex flex-col">
            {/* Problema central */}
            <motion.div 
              className="flex justify-center mb-8 mt-4"
              whileHover={isEditing ? { scale: 1.05 } : {}}
            >
              <div 
                className={`px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md text-center max-w-md transform transition-all duration-300 ${isEditing ? 'cursor-pointer hover:shadow-lg' : ''}`}
                onClick={isEditing ? editProblem : undefined}
              >
                <h3 className="font-bold text-xl">{diagramData.problem}</h3>
                {isEditing && <p className="text-xs mt-1 opacity-80">(Clic para editar)</p>}
              </div>
            </motion.div>

            {/* Línea principal horizontal con decoración */}
            <div className="relative flex-1 flex flex-col justify-center">
              <div className="absolute left-0 right-0 h-2 bg-gradient-to-r from-gray-300 via-blue-300 to-gray-300 dark:from-gray-700 dark:via-blue-700 dark:to-gray-700 rounded-full"></div>
              
              {/* Flecha decorativa hacia el problema */}
              <div className="absolute right-1/2 transform translate-x-1/2 -translate-y-5 text-blue-500 dark:text-blue-400">
                <ArrowRight size={20} />
              </div>
              
              {/* Categorías y causas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {diagramData.categories.map((category) => (
                  <motion.div 
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col"
                  >
                    {/* Título de la categoría */}
                    <div 
                      className={`mb-2 text-center font-bold text-blue-600 dark:text-blue-400 group ${isEditing ? 'cursor-pointer hover:text-blue-800 dark:hover:text-blue-300' : ''}`}
                      onClick={() => isEditing && editCategory(category.id)}
                    >
                      <span className="text-lg border-b-2 border-blue-300 dark:border-blue-700 pb-1 inline-block transition-all duration-300 group-hover:border-blue-600 dark:group-hover:border-blue-400">
                        {category.name}
                      </span>
                      {isEditing && <p className="text-xs font-normal text-gray-500 dark:text-gray-400">(Clic para editar)</p>}
                    </div>
                    
                    {/* Línea de conexión vertical con decoración */}
                    <div className="relative">
                      <div className="h-20 w-1.5 bg-gradient-to-b from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-800 mx-auto rounded-full"></div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 h-3 w-3 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                    </div>
                    
                    {/* Lista de causas */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750 rounded-lg p-4 flex-1 border border-blue-100 dark:border-gray-600 overflow-y-auto max-h-[250px] shadow-md">
                      <Reorder.Group 
                        axis="y" 
                        values={category.causes.map(c => c.id)} 
                        onReorder={(ids) => {
                          if (!isEditing) return;
                          
                          setDiagramData(prev => ({
                            ...prev,
                            categories: prev.categories.map(c => 
                              c.id === category.id
                                ? {
                                    ...c,
                                    causes: ids.map(id => c.causes.find(cause => cause.id === id))
                                  }
                                : c
                            )
                          }));
                        }}
                        className="space-y-2"
                      >
                        {category.causes.map((cause) => (
                          <Reorder.Item
                            key={cause.id}
                            value={cause.id}
                            disabled={!isEditing}
                          >
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              whileHover={{ scale: isEditing ? 1.02 : 1 }}
                              className={`flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border-l-4 border-blue-400 dark:border-blue-600 ${isEditing ? 'cursor-move' : ''}`}
                            >
                              <div className="flex items-center">
                                {isEditing && <Move size={14} className="mr-2 text-gray-400" />}
                                <span className="text-sm">{cause.text}</span>
                              </div>
                              {isEditing && (
                                <div className="flex space-x-1 shrink-0">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => editCause(category.id, cause.id, cause.text)}
                                    className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700"
                                  >
                                    <Edit size={14} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => deleteCause(category.id, cause.id)}
                                    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-gray-700"
                                  >
                                    <Trash2 size={14} />
                                  </motion.button>
                                </div>
                              )}
                            </motion.div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                      
                      {/* Formulario para añadir/editar causa */}
                      {isEditing && editingItem && editingItem.categoryId === category.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col space-y-2 p-3 mt-2 bg-blue-100 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-gray-600"
                        >
                          <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            placeholder="Escribir causa..."
                            className="text-sm p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            autoFocus
                          />
                          <div className="flex justify-end space-x-2">
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={saveCause}
                              className="p-1.5 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
                            >
                              <Check size={12} className="mr-1" /> Guardar
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={cancelCauseEdit}
                              className="p-1.5 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center"
                            >
                              <X size={12} className="mr-1" /> Cancelar
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Botón para añadir nueva causa */}
                      {isEditing && (!editingItem || editingItem.categoryId !== category.id) && (
                        <motion.button
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => addCause(category.id)}
                          className="w-full text-sm py-2 px-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md flex items-center justify-center hover:from-blue-600 hover:to-blue-700 shadow-sm mt-3"
                        >
                          <Plus size={16} className="mr-1" /> Añadir causa
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Marca de agua decorativa */}
          <div className="absolute bottom-2 right-2 text-gray-200 dark:text-gray-800 opacity-30 select-none pointer-events-none">
            <GitBranch size={80} />
          </div>
        </div>
        
        {/* Leyenda o información adicional */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6"
        >
          <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-3 flex items-center">
            <Info size={18} className="mr-2 text-blue-500" /> Cómo utilizar el diagrama
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
                <Lightbulb size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Define el problema</p>
                <p>Establece claramente el problema central que deseas analizar.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full mr-3">
                <GitBranch size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Identifica categorías</p>
                <p>Utiliza las "6M": Método, Mano de obra, Materiales, Maquinaria, Medición y Medio ambiente.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full mr-3">
                <Plus size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Añade causas</p>
                <p>Para cada categoría, identifica todas las posibles causas del problema.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full mr-3">
                <Flag size={18} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Analiza y prioriza</p>
                <p>Evalúa las causas para identificar las más significativas y planificar acciones.</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Componente de navegación entre herramientas */}
        <ToolsNavigation currentTool="cause-effect" projectId={projectId} />
      </div>
    </div>
  );
};

export default CauseEffectDiagram;
