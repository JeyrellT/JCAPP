import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, ChevronDown, Bell } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';

const Navbar = ({ toggleSidebar }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // Manejar scroll para cambiar estilo de navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Cerrar dropdowns al cambiar de ruta
  useEffect(() => {
    setDropdownOpen(false);
    setNotificationOpen(false);
  }, [location]);

  // Obtener título para la página actual
  const getPageTitle = () => {
    const pathname = location.pathname;
    
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/projects') return 'Proyectos';
    if (pathname.includes('/projects/')) {
      if (pathname.includes('/tools/')) {
        return 'Herramienta';
      }
      return 'Detalles del Proyecto';
    }
    
    return 'Lean Six Sigma App';
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md' 
          : 'bg-white dark:bg-gray-900'
      }`}
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center py-4 px-4">
          {/* Logo y título */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center text-white font-bold">
                JC
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white hidden sm:inline-block">
                JC Analytics
              </span>
            </Link>
          </div>
          
          {/* Título de página en móvil */}
          <div className="lg:hidden text-center">
            <h1 className="text-lg font-medium text-gray-800 dark:text-white">
              {getPageTitle()}
            </h1>
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center space-x-2">
            {/* Tema */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium">Notificaciones</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <p className="text-sm font-medium">Actualización de proyecto</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">El Project Charter ha sido aprobado</p>
                        <p className="text-xs text-gray-400 mt-1">Hace 2 horas</p>
                      </div>
                      <div className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <p className="text-sm font-medium">Recordatorio</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Reunión de equipo mañana a las 10:00 AM</p>
                        <p className="text-xs text-gray-400 mt-1">Hace 5 horas</p>
                      </div>
                    </div>
                    <div className="p-2 text-center">
                      <button className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                        Ver todas
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Perfil de usuario */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full overflow-hidden flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium">
                  JD
                </div>
                <span className="hidden md:inline-block text-sm font-medium">
                  John Doe
                </span>
                <ChevronDown size={16} />
              </button>
              
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-hidden z-50 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">john.doe@example.com</p>
                    </div>
                    <div>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Perfil
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Configuración
                      </button>
                      <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        Cerrar sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
