import { useState } from 'react';
import { 
  Settings, 
  User, 
  Moon, 
  Sun, 
  Bell, 
  Lock, 
  Globe, 
  Save,
  RefreshCw,
  Check,
  X,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    browser: false,
    updates: true,
    projectReminders: true
  });
  
  // Función para guardar ajustes
  const saveSettings = () => {
    setIsSaving(true);
    
    // Aquí iría la lógica para guardar ajustes
    
    // Simulación
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };
  
  // Función para cambiar configuraciones de notificaciones
  const toggleNotification = (name) => {
    setNotificationSettings({
      ...notificationSettings,
      [name]: !notificationSettings[name]
    });
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto p-4"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Configuración
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personaliza la aplicación según tus preferencias
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Barra lateral */}
        <motion.div variants={itemVariants} className="col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4">
              <h3 className="font-medium text-lg text-gray-800 dark:text-white mb-4">
                Categorías
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center w-full px-3 py-2 rounded-lg ${
                      activeTab === 'general'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Settings size={18} className="mr-2" />
                    General
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center w-full px-3 py-2 rounded-lg ${
                      activeTab === 'profile'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <User size={18} className="mr-2" />
                    Perfil
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('appearance')}
                    className={`flex items-center w-full px-3 py-2 rounded-lg ${
                      activeTab === 'appearance'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {theme === 'dark' ? <Moon size={18} className="mr-2" /> : <Sun size={18} className="mr-2" />}
                    Apariencia
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center w-full px-3 py-2 rounded-lg ${
                      activeTab === 'notifications'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Bell size={18} className="mr-2" />
                    Notificaciones
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center w-full px-3 py-2 rounded-lg ${
                      activeTab === 'security'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Lock size={18} className="mr-2" />
                    Seguridad
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        
        {/* Contenido principal */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {/* General */}
            {activeTab === 'general' && (
              <div>
                <h2 className="text-xl font-medium text-gray-800 dark:text-white mb-6">
                  Configuración General
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Idioma
                    </label>
                    <select className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Formato de fecha
                    </label>
                    <select className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                      <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                      <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unidad de medida
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input type="radio" name="unit" className="form-radio text-blue-600" defaultChecked />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Métrico</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input type="radio" name="unit" className="form-radio text-blue-600" />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Imperial</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Autoguardado
                    </span>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full relative inline-block">
                        <span className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 transform transition-transform duration-200"></span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Perfil */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-medium text-gray-800 dark:text-white mb-6">
                  Perfil de Usuario
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center mr-4 overflow-hidden">
                      <User size={40} className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm">
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        defaultValue="Usuario"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        defaultValue="Ejemplo"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      defaultValue="usuario@ejemplo.com"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Posición
                    </label>
                    <input
                      type="text"
                      defaultValue="Especialista Lean Six Sigma"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organización
                    </label>
                    <input
                      type="text"
                      defaultValue="Empresa de Consultoría"
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Apariencia */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="text-xl font-medium text-gray-800 dark:text-white mb-6">
                  Configuración de Apariencia
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Tema
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => theme !== 'light' && toggleTheme()}
                        className={`p-4 border rounded-lg flex flex-col items-center ${
                          theme === 'light'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        <Sun size={24} className="text-gray-700 dark:text-gray-300 mb-2" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Claro</span>
                        {theme === 'light' && <Check size={18} className="text-blue-500 mt-2" />}
                      </button>
                      
                      <button
                        onClick={() => theme !== 'dark' && toggleTheme()}
                        className={`p-4 border rounded-lg flex flex-col items-center ${
                          theme === 'dark'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                      >
                        <Moon size={24} className="text-gray-700 dark:text-gray-300 mb-2" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Oscuro</span>
                        {theme === 'dark' && <Check size={18} className="text-blue-500 mt-2" />}
                      </button>
                      
                      <button
                        className={`p-4 border rounded-lg flex flex-col items-center border-gray-300 dark:border-gray-700`}
                      >
                        <Globe size={24} className="text-gray-700 dark:text-gray-300 mb-2" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sistema</span>
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tamaño de fuente
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-700 dark:text-gray-300">A</span>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        defaultValue="3"
                        className="flex-1"
                      />
                      <span className="text-xl text-gray-700 dark:text-gray-300">A</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Densidad de elementos
                    </span>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input type="radio" name="density" className="form-radio text-blue-600" />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Compacta</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input type="radio" name="density" className="form-radio text-blue-600" defaultChecked />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Normal</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input type="radio" name="density" className="form-radio text-blue-600" />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Espaciada</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notificaciones */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-medium text-gray-800 dark:text-white mb-6">
                  Configuración de Notificaciones
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">Notificaciones por correo</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Recibir notificaciones por correo electrónico</p>
                    </div>
                    <button
                      onClick={() => toggleNotification('email')}
                      className="w-12 h-6 rounded-full relative transition-colors duration-200 ease-linear"
                    >
                      <div
                        className={`absolute left-0 top-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-linear ${
                          notificationSettings.email ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-linear ${
                            notificationSettings.email ? 'translate-x-6' : 'translate-x-1'
                          }`}
                          style={{ top: '2px' }}
                        />
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">Notificaciones del navegador</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Recibir notificaciones en el navegador</p>
                    </div>
                    <button
                      onClick={() => toggleNotification('browser')}
                      className="w-12 h-6 rounded-full relative transition-colors duration-200 ease-linear"
                    >
                      <div
                        className={`absolute left-0 top-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-linear ${
                          notificationSettings.browser ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-linear ${
                            notificationSettings.browser ? 'translate-x-6' : 'translate-x-1'
                          }`}
                          style={{ top: '2px' }}
                        />
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">Actualizaciones de la aplicación</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Recibir notificaciones sobre nuevas funciones</p>
                    </div>
                    <button
                      onClick={() => toggleNotification('updates')}
                      className="w-12 h-6 rounded-full relative transition-colors duration-200 ease-linear"
                    >
                      <div
                        className={`absolute left-0 top-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-linear ${
                          notificationSettings.updates ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-linear ${
                            notificationSettings.updates ? 'translate-x-6' : 'translate-x-1'
                          }`}
                          style={{ top: '2px' }}
                        />
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg border-gray-200 dark:border-gray-700">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">Recordatorios de proyectos</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Recibir recordatorios de tareas pendientes</p>
                    </div>
                    <button
                      onClick={() => toggleNotification('projectReminders')}
                      className="w-12 h-6 rounded-full relative transition-colors duration-200 ease-linear"
                    >
                      <div
                        className={`absolute left-0 top-0 right-0 bottom-0 rounded-full transition-colors duration-200 ease-linear ${
                          notificationSettings.projectReminders ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div
                          className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-linear ${
                            notificationSettings.projectReminders ? 'translate-x-6' : 'translate-x-1'
                          }`}
                          style={{ top: '2px' }}
                        />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Seguridad */}
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-medium text-gray-800 dark:text-white mb-6">
                  Configuración de Seguridad
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-medium text-gray-800 dark:text-white mb-2">Cambiar contraseña</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contraseña actual
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nueva contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirmar nueva contraseña
                        </label>
                        <input
                          type="password"
                          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Cambiar contraseña
                      </button>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-base font-medium text-gray-800 dark:text-white mb-2">Sesiones activas</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">Chrome en Windows</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Activa ahora • Heredia, Costa Rica</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                          Actual
                        </span>
                      </div>
                      <div className="p-3 border rounded-lg border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">Firefox en macOS</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Hace 2 días • San José, Costa Rica</p>
                        </div>
                        <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Botón de guardar */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={saveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={18} className="mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Guardar cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
