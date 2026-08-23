import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  BarChart2,
  ClipboardList,
  Settings,
  Wrench,
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
  Layers,
  Calendar,
  DollarSign,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { PHASE_ORDER, formatPhase, getPhaseToken } from '../../lib/phases';

// Mapa estático icono -> componente. Nunca construir el nombre dinámicamente.
const TOOL_ICONS = {
  Clipboard: ClipboardList,
  GitMerge,
  MessageSquare,
  BarChart2,
  GitBranch,
  Users,
  Grid,
  BarChart,
  AlertTriangle,
  LineChart,
  Layers,
  Calendar,
  DollarSign,
};

const getToolIcon = (iconName, size = 16) => {
  const IconComponent = TOOL_ICONS[iconName] || HelpCircle;
  return <IconComponent size={size} />;
};

const rowBase =
  'group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-fast';
const rowActive = 'bg-brand/10 text-brand';
const rowInactive = 'text-content-secondary hover:bg-surface-sunken hover:text-content';

const ActiveBar = ({ show }) =>
  show ? (
    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand" aria-hidden="true" />
  ) : null;

/** Etiqueta flotante mostrada al pasar el cursor o enfocar, solo en modo rail (colapsado). */
const RailLabel = ({ children }) => (
  <span
    role="tooltip"
    className="pointer-events-none absolute left-full top-1/2 z-tooltip ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-neutral-900 px-2 py-1 text-xs font-medium text-neutral-25 opacity-0 shadow-lg transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100"
  >
    {children}
  </span>
);

/** Fila de navegación simple (sin submenú). En modo rail muestra solo el icono + tooltip. */
const NavRow = ({ to, icon, label, collapsed, onNavigate, end = false }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    aria-label={collapsed ? label : undefined}
    className={({ isActive }) =>
      `${rowBase} ${isActive ? rowActive : rowInactive} ${collapsed ? 'justify-center px-0' : ''}`
    }
  >
    {({ isActive }) => (
      <>
        <ActiveBar show={isActive} />
        {icon}
        {!collapsed && <span className="truncate">{label}</span>}
        {collapsed && <RailLabel>{label}</RailLabel>}
      </>
    )}
  </NavLink>
);

const Sidebar = ({ collapsed = false, onToggleCollapse, onCloseMobile, isMobile = false }) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(null);
  const { projects, tools } = useLeanSixSigma();

  // Agrupar herramientas por fase, en el orden canónico DMAIC.
  const toolsByPhase = PHASE_ORDER.reduce((acc, phase) => {
    const phaseTools = tools.filter((tool) => tool.phase === phase);
    if (phaseTools.length) acc.push([phase, phaseTools]);
    return acc;
  }, []);

  // Abrir automáticamente la sección según la ruta actual.
  useEffect(() => {
    if (location.pathname.startsWith('/projects')) {
      setActiveSection('projects');
    } else if (location.pathname.startsWith('/tools')) {
      setActiveSection('tools');
    } else {
      setActiveSection(null);
    }
  }, [location.pathname]);

  // En modo rail no hay espacio para submenús: se cierran al colapsar.
  useEffect(() => {
    if (collapsed) setActiveSection(null);
  }, [collapsed]);

  const handleNavigate = () => {
    if (isMobile) onCloseMobile?.();
  };

  const toggleSection = (section) => {
    if (collapsed) return;
    setActiveSection((prev) => (prev === section ? null : section));
  };

  return (
    <aside className="flex h-full flex-col bg-surface">
      {/* Cabecera: colapso (escritorio) / cierre (móvil) */}
      <div className={`flex h-14 items-center border-b border-line-subtle px-2 ${collapsed ? 'justify-center' : 'justify-end'}`}>
        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
            aria-label="Cerrar menú de navegación"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden h-9 w-9 items-center justify-center rounded-md text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content lg:inline-flex"
            aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="mb-6">
          {!collapsed && (
            <h2 className="section-label px-3">Principal</h2>
          )}

          <div className={`space-y-1 ${!collapsed ? 'mt-3' : ''}`}>
            <NavRow to="/" end icon={<Home size={18} />} label="Panel" collapsed={collapsed} onNavigate={handleNavigate} />

            {/* Proyectos: en modo rail es un enlace directo; expandido, despliega submenú */}
            {collapsed ? (
              <NavRow to="/projects" icon={<ClipboardList size={18} />} label="Proyectos" collapsed onNavigate={handleNavigate} />
            ) : (
              <>
                <NavLink
                  to="/projects"
                  onClick={() => toggleSection('projects')}
                  className={({ isActive }) =>
                    `${rowBase} justify-between ${
                      isActive || activeSection === 'projects' ? rowActive : rowInactive
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <ActiveBar show={isActive} />
                      <span className="flex items-center gap-3">
                        <ClipboardList size={18} />
                        <span>Proyectos</span>
                      </span>
                      {activeSection === 'projects' ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </>
                  )}
                </NavLink>

                {activeSection === 'projects' && (
                  <div className="ml-[22px] space-y-1 border-l border-line-subtle py-1 pl-2">
                    <NavLink
                      to="/projects"
                      end
                      onClick={handleNavigate}
                      className={({ isActive }) =>
                        `flex h-8 items-center rounded-md px-2.5 text-sm transition-colors duration-fast ${
                          isActive ? 'bg-brand/10 text-brand' : 'text-content-secondary hover:bg-surface-sunken hover:text-content'
                        }`
                      }
                    >
                      Todos los proyectos
                    </NavLink>

                    {projects.slice(0, 3).map((project) => (
                      <NavLink
                        key={project.id}
                        to={`/projects/${project.id}`}
                        onClick={handleNavigate}
                        className={({ isActive }) =>
                          `flex h-8 items-center truncate rounded-md px-2.5 text-sm transition-colors duration-fast ${
                            isActive ? 'bg-brand/10 text-brand' : 'text-content-secondary hover:bg-surface-sunken hover:text-content'
                          }`
                        }
                      >
                        <span className="truncate">{project.name}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Herramientas: en modo rail es un enlace directo; expandido, despliega submenú agrupado por fase */}
            {collapsed ? (
              <NavRow to="/tools" icon={<Wrench size={18} />} label="Herramientas" collapsed onNavigate={handleNavigate} />
            ) : (
              <>
                <NavLink
                  to="/tools"
                  onClick={() => toggleSection('tools')}
                  className={({ isActive }) =>
                    `${rowBase} justify-between ${
                      isActive || activeSection === 'tools' ? rowActive : rowInactive
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <ActiveBar show={isActive} />
                      <span className="flex items-center gap-3">
                        <Wrench size={18} />
                        <span>Herramientas</span>
                      </span>
                      {activeSection === 'tools' ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </>
                  )}
                </NavLink>

                {activeSection === 'tools' && (
                  <div className="ml-[22px] space-y-2 border-l border-line-subtle py-1 pl-2">
                    {toolsByPhase.map(([phase, phaseTools]) => (
                      <div key={phase}>
                        <p className="flex items-center gap-1.5 px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider text-content-muted">
                          <span className={`h-1.5 w-1.5 rounded-full ${getPhaseToken(phase).dot}`} aria-hidden="true" />
                          {formatPhase(phase)}
                        </p>
                        <div className="space-y-0.5">
                          {phaseTools.map((tool) => (
                            <NavLink
                              key={tool.id}
                              to={`/tools#${tool.id}`}
                              onClick={handleNavigate}
                              className="flex h-8 items-center gap-2 rounded-md px-2.5 text-sm text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
                            >
                              {getToolIcon(tool.icon, 15)}
                              <span className="truncate">{tool.name}</span>
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <NavRow to="/reports" icon={<BarChart2 size={18} />} label="Reportes" collapsed={collapsed} onNavigate={handleNavigate} />
          </div>
        </div>

        <div>
          {!collapsed && <h2 className="section-label px-3">Recursos</h2>}
          <div className={`space-y-1 ${!collapsed ? 'mt-3' : ''}`}>
            <NavRow to="/methodology" icon={<Layers size={18} />} label="Metodología" collapsed={collapsed} onNavigate={handleNavigate} />
          </div>
        </div>
      </nav>

      <div className="border-t border-line-subtle p-2">
        <NavRow to="/settings" icon={<Settings size={18} />} label="Configuración" collapsed={collapsed} onNavigate={handleNavigate} />
      </div>
    </aside>
  );
};

export default Sidebar;
