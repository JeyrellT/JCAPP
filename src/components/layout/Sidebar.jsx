import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart2, 
  ClipboardList, 
  Settings, 
  FileText, 
  Users, 
  HelpCircle, 
  X,
  ChevronDown,
  ChevronRight,
  GitMerge,
  BarChart,
  GitBranch,
  MessageSquare,
  Grid,
  AlertTriangle,
  LineChart,
  Layers
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';

const Sidebar = ({ closeSidebar }) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(null);
  const { projects, tools } = useLeanSixSigma();
  
  // Agrupar herramientas por fase
  const toolsByPhase = tools.reduce((acc, tool) => {
    if (!acc[tool.phase]) {
      acc[tool.phase] = [];
    }
    acc[tool.phase].push(tool);
    return acc;
  }, {});
  
  // Obtener el icono para una herramienta
  const getToolIcon = (iconName, size = 18) => {
    const icons = {
      'Clipboard': <ClipboardList size={size} />,
      'GitMerge': <GitMerge size={size} />,
      'MessageSquare': <MessageSquare size={size} />,
      'BarChart2': <BarChart2 size={size} />,
      'GitBranch': <GitBranch size={size} />,
      'Users': <Users size={size} />,
      'Grid': <Grid size={size} />,
      'BarChart': <BarChart size={size} />,
      'AlertTriangle': <AlertTriangle size={size} />,
      'LineChart': <LineChart size={size} />,
      'Layers': <Layers size={size} />
    };
    
    return icons[iconName] || <HelpCircle size={size} />;
  };
  
  // Automáticamente abrir la sección según la ruta actual
  useEffect(() => {
    if (location.pathname === '/') {
      setActiveSection(null);
    } else if (location.pathname.startsWith('/projects')) {
      setActiveSection('projects');
    } else if (location.pathname.startsWith('/tools')) {
      setActiveSection('tools');
    } else if (location.pathname.startsWith('/reports')) {
      setActiveSection('reports');
    }
  }, [location]);

  return (
    <aside className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg flex flex-col">
      {/* Cerrar sidebar en móvil */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex lg:hidden justify-end">
        <button 
          onClick={closeSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Menú principal */}
      <nav className="flex-1 pt-5 pb-4 overflow-y-auto">
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Principal
          </h2>
          
          <div className="mt-3 space-y-1">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              onClick={closeSidebar}
            >
              <Home size={18} />
              <span>Dashboard</span>
            </NavLink>
            
            <button 
              onClick={() => setActiveSection(activeSection === 'projects' ? null : 'projects')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                activeSection === 'projects' || location.pathname.includes('/projects')
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ClipboardList size={18} />
                <span>Proyectos</span>
              </div>
              {activeSection === 'projects' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {/* Submenu de proyectos */}
            {activeSection === 'projects' && (
              <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-2">
                <NavLink 
                  to="/projects" 
                  className={({ isActive }) => 
                    `flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-sm ${
                      isActive && !location.pathname.includes('/projects/')
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`
                  }
                  onClick={closeSidebar}
                >
                  <span>Todos los proyectos</span>
                </NavLink>
                
                {/* Lista de proyectos recientes */}
                {projects.slice(0, 3).map(project => (
                  <NavLink 
                    key={project.id}
                    to={`/projects/${project.id}`} 
                    className={({ isActive }) => 
                      `flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-sm truncate ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                    onClick={closeSidebar}
                  >
                    <span className="truncate">{project.name}</span>
                  </NavLink>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setActiveSection(activeSection === 'tools' ? null : 'tools')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                activeSection === 'tools'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Tool size={18} />
                <span>Herramientas</span>
              </div>
              {activeSection === 'tools' ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {/* Submenu de herramientas */}
            {activeSection === 'tools' && (
              <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-2">
                {Object.entries(toolsByPhase).map(([phase, phaseTools]) => (
                  <div key={phase} className="mt-2 first:mt-0">
                    <p className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {phase}
                    </p>
                    <div className="space-y-1 mt-1">
                      {phaseTools.map(tool => (
                        <div 
                          key={tool.id}
                          className="flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={closeSidebar}
                        >
                          {getToolIcon(tool.icon, 16)}
                          <span className="truncate">{tool.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <NavLink 
              to="/reports" 
              className={({ isActive }) => 
                `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              onClick={closeSidebar}
            >
              <BarChart2 size={18} />
              <span>Reportes</span>
            </NavLink>
          </div>
        </div>
        
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Recursos
          </h2>
          
          <div className="mt-3 space-y-1">
            <div
              className="flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={closeSidebar}
            >
              <FileText size={18} />
              <span>Documentación</span>
            </div>
            <div
              className="flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={closeSidebar}
            >
              <Users size={18} />
              <span>Comunidad</span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Pie del sidebar */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <NavLink 
          to="/settings" 
          className="flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={closeSidebar}
        >
          <Settings size={18} />
          <span>Configuración</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
