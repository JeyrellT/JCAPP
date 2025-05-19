import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  AlertTriangle, 
  Target, 
  ClipboardList, 
  Milestone, 
  Users,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  Info,
  Save
} from 'lucide-react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { motion } from 'framer-motion';

/**
 * Componente Project Charter para visualizar y editar el acta de constitución del proyecto
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const ProjectCharter = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // Estados para controlar la visibilidad y animaciones
  const [pulsingSection, setPulsingSection] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);
  const [hoverSection, setHoverSection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estado para datos editables
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    company: '',
    business: {
      context: '',
      keyProblems: []
    },
    problem: {
      description: '',
      impact: ''
    },
    goal: {
      general: '',
      specific: []
    },
    scopeIn: [],
    scopeOut: [],
    milestones: [],
    team: []
  });
  
  // Cargar datos del proyecto
  useEffect(() => {
    if (project) {
      // Extraer datos del proyecto para el ProjectCharter
      // Esto se puede mejorar para extraer datos más específicos del ProjectCharter
      setProjectData({
        name: project.name || '',
        description: project.description || '',
        company: project.company || '',
        business: project.business || {
          context: 'Contexto empresarial por definir',
          keyProblems: ['Problema clave 1', 'Problema clave 2']
        },
        problem: project.problem || {
          description: 'Descripción del problema por definir',
          impact: 'Impacto del problema por definir'
        },
        goal: project.goal || {
          general: 'Objetivo general por definir',
          specific: ['Objetivo específico 1', 'Objetivo específico 2']
        },
        scopeIn: project.scopeIn || ['Elemento dentro del alcance 1', 'Elemento dentro del alcance 2'],
        scopeOut: project.scopeOut || ['Elemento fuera del alcance 1', 'Elemento fuera del alcance 2'],
        milestones: project.milestones || [
          {phase: 'Fase 1', description: 'Descripción de la fase 1'},
          {phase: 'Fase 2', description: 'Descripción de la fase 2'}
        ],
        team: project.team || []
      });
    }
  }, [project]);
  
  // Efecto para animación de entrada escalonada
  useEffect(() => {
    const timer = setTimeout(() => {
      startPulse();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Función para iniciar el pulso aleatorio
  const startPulse = () => {
    const sections = ['business', 'problem', 'goal', 'scopeIn', 'scopeOut', 'milestones', 'team'];
    const randomSection = sections[Math.floor(Math.random() * sections.length)];
    
    setPulsingSection(randomSection);
    
    setTimeout(() => {
      setPulsingSection(null);
      setTimeout(startPulse, Math.random() * 8000 + 5000);
    }, 2000);
  };
  
  // Función para alternar el modo de pantalla completa
  const toggleFullscreen = (section) => {
    if (isFullscreen === section) {
      setIsFullscreen(null);
    } else {
      setIsFullscreen(section);
    }
  };
  
  // Función para guardar cambios
  const saveChanges = () => {
    if (!project) return;
    
    setIsSaving(true);
    
    // Aquí habría lógica para actualizar el proyecto con los datos de projectData
    // Por ejemplo:
    updateProject(projectId, {
      name: projectData.name,
      description: projectData.description,
      company: projectData.company,
      business: projectData.business,
      problem: projectData.problem,
      goal: projectData.goal,
      scopeIn: projectData.scopeIn,
      scopeOut: projectData.scopeOut,
      milestones: projectData.milestones,
      team: projectData.team,
      // Actualizar la propiedad tools para marcar el Project Charter como completado
      tools: {
        ...project.tools,
        'project-charter': {
          ...project.tools['project-charter'],
          status: 'completed',
          updatedAt: new Date().toISOString()
        }
      }
    });
    
    // Simular guardado
    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
      // Aquí se podría mostrar una notificación de éxito
    }, 1000);
  };
  
  // Paleta de colores para cada sección
  const getSectionColors = (section) => {
    const colors = {
      business: {
        gradient: "bg-gradient-to-br from-blue-800/80 to-blue-900/90",
        gradientHover: "hover:bg-gradient-to-br hover:from-blue-700/80 hover:to-blue-800/90",
        border: "border-blue-400/40",
        text: "text-white",
        subtext: "text-blue-100",
        title: "text-white",
        icon: "text-blue-300",
        shadow: "shadow-blue-500/20",
        hoverShadow: "hover:shadow-blue-400/30"
      },
      problem: {
        gradient: "bg-gradient-to-br from-orange-800/80 to-orange-900/90",
        gradientHover: "hover:bg-gradient-to-br hover:from-orange-700/80 hover:to-orange-800/90",
        border: "border-orange-400/40",
        text: "text-white",
        subtext: "text-orange-100",
        title: "text-white",
        icon: "text-orange-300",
        shadow: "shadow-orange-500/20",
        hoverShadow: "hover:shadow-orange-400/30"
      },
      goal: {
        gradient: "bg-gradient-to-br from-indigo-800/80 to-indigo-900/90",
        gradientHover: "hover:bg-gradient-to-br hover:from-indigo-700/80 hover:to-indigo-800/90",
        border: "border-indigo-400/40",
        text: "text-white",
        subtext: "text-indigo-100",
        title: "text-white",
        icon: "text-indigo-300",
        shadow: "shadow-indigo-500/20",
        hoverShadow: "hover:shadow-indigo-400/30"
      },
      scopeIn: {
        gradient: "bg-gradient-to-br from-teal-800/80 to-teal-900/90",
        gradientHover: "hover:bg-gradient-to-br hover:from-teal-700/80 hover:to-teal-800/90",
        border: "border-teal-400/40",
        text: "text-white",
        subtext: "text-teal-100",
        title: "text-white",
        icon: "text-teal-300",
        shadow: "shadow-teal-500/20",
        hoverShadow: "hover:shadow-teal-400/30"
      },
      scopeOut: {
        gradient: "bg-gradient-to-br from-emerald-800/80 to-emerald-900/90",
        gradientHover: "hover:bg-gradient-to-br hover:from-emerald-700/80 hover:to-emerald-800/90",
        border: "border-emerald-400/40",
        text: "text-white",
        subtext: "text-emerald-100",
        title: "text-white",
        icon: "text-emerald-300",
        shadow: "shadow-emerald-500/20",
        hoverShadow: "hover:shadow-emerald-400/30"
      },
      milestones: {
        gradient: "bg-gradient-to-br from-purple-800/80 to-purple-900/90",
        gradientHover: "hover:bg-gradient-to-br hover:from-purple-700/80 hover:to-purple-800/90",
        border: "border-purple-400/40",
        text: "text-white",
        subtext: "text-purple-100",
        title: "text-white",
        icon: "text-purple-300",
        shadow: "shadow-purple-500/20",
        hoverShadow: "hover:shadow-purple-400/30"
      },
      team: {
        gradient: "bg-gradient-to-br from-red-800/80 to-red-900/90",
        gradientHover: "hover:bg-gradient-to-br hover:from-red-700/80 hover:to-red-800/90",
        border: "border-red-400/40",
        text: "text-white",
        subtext: "text-red-100",
        title: "text-white",
        icon: "text-red-300",
        shadow: "shadow-red-500/20",
        hoverShadow: "hover:shadow-red-400/30"
      },
      header: {
        gradient: "bg-gradient-to-br from-emerald-800/80 to-emerald-900/90",
        gradientHover: "hover:bg-gradient-to-br hover:from-emerald-700/80 hover:to-emerald-800/90",
        border: "border-emerald-400/40",
        text: "text-white",
        subtext: "text-emerald-100",
        title: "text-white",
        icon: "text-emerald-300",
        shadow: "shadow-emerald-500/20",
        hoverShadow: "hover:shadow-emerald-400/30"
      }
    };
    
    return colors[section] || colors.header;
  };
  
  // Obtener icono para cada sección
  const getSectionIcon = (section, size = 24) => {
    const colors = getSectionColors(section);
    
    switch(section) {
      case 'business':
        return <Briefcase size={size} className={colors.icon} />;
      case 'problem':
        return <AlertTriangle size={size} className={colors.icon} />;
      case 'goal':
        return <Target size={size} className={colors.icon} />;
      case 'scopeIn':
        return <CheckCircle size={size} className={colors.icon} />;
      case 'scopeOut':
        return <XCircle size={size} className={colors.icon} />;
      case 'milestones':
        return <Milestone size={size} className={colors.icon} />;
      case 'team':
        return <Users size={size} className={colors.icon} />;
      default:
        return null;
    }
  };
  
  // Estilos para las tarjetas
  const getCardStyle = (section) => {
    const colors = getSectionColors(section);
    let style = `${colors.gradient} ${colors.gradientHover} backdrop-blur-md border border-t-0 border-l-0 ${colors.border} rounded-xl shadow-lg transition-all duration-300 ${colors.hoverShadow}`;
    
    // Aplicar efecto de pulso
    if (pulsingSection === section) {
      style += ` ${colors.shadow} scale-[1.01]`;
    }
    
    // Efecto hover
    if (hoverSection === section) {
      style += ` scale-[1.01] ${colors.shadow}`;
    }
    
    // Manejo de pantalla completa
    if (isFullscreen) {
      if (isFullscreen === section) {
        style += " fixed top-4 left-4 right-4 bottom-4 z-50 overflow-auto";
      } else {
        style += " opacity-40";
      }
    }
    
    return style;
  };

  // Tooltip para explicar secciones
  const getTooltipText = (section) => {
    switch(section) {
      case 'business':
        return "Contexto de negocio y problemática operativa";
      case 'problem':
        return "Definición concreta del problema a resolver";
      case 'goal':
        return "Objetivos generales y específicos del proyecto";
      case 'scopeIn':
        return "Elementos incluidos en el alcance";
      case 'scopeOut':
        return "Elementos excluidos del alcance";
      case 'milestones':
        return "Puntos clave en el cronograma del proyecto";
      case 'team':
        return "Integrantes y roles del equipo de proyecto";
      default:
        return "";
    }
  };
  
  // Botón de guardar flotante
  const SaveButton = () => (
    <motion.button
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      onClick={saveChanges}
      disabled={isSaving}
      className="fixed bottom-6 right-6 px-4 py-2 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 flex items-center transition-all z-50"
    >
      {isSaving ? (
        <>
          <span className="animate-spin mr-2">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          Guardando...
        </>
      ) : (
        <>
          <Save size={18} className="mr-2" />
          Guardar cambios
        </>
      )}
    </motion.button>
  );
  
  // Si no hay proyecto, no mostrar nada
  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando proyecto...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 p-4 font-sans text-white">
      {/* Fondo de textura */}
      <div className="fixed inset-0 -z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMTExMjI3Ij48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')] opacity-10"></div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/30 via-transparent to-transparent pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Fila 1: Título y Logo */}
        <div className="grid grid-cols-3 gap-6">
          {/* Título del Proyecto */}
          <div 
            className={`col-span-2 p-6 ${getCardStyle('header')} overflow-hidden`}
            onMouseEnter={() => setHoverSection('header')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="flex justify-between items-start mb-3">
              <h1 className="text-4xl font-extrabold text-white leading-tight max-w-3xl [text-shadow:_0_1px_3px_rgb(0_0_0_/_50%)]">
                {projectData.name}
              </h1>
              <button 
                onClick={() => toggleFullscreen('title')} 
                className="p-1 hover:bg-emerald-700/50 rounded mt-1 flex-shrink-0 transition-colors"
                title="Ver en pantalla completa"
              >
                {isFullscreen === 'title' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
            
            <p className="text-xl text-white leading-relaxed font-medium">
              {projectData.description}
            </p>
          </div>
          
          {/* Logo */}
          <div 
            className={`p-6 flex items-center justify-center ${getCardStyle('header')} overflow-hidden backdrop-blur-lg`}
            onMouseEnter={() => setHoverSection('header-logo')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="bg-blue-900/40 backdrop-blur-sm rounded-lg p-5 w-full flex flex-col items-center justify-center shadow-lg border border-blue-400/20">
              <div className="relative w-full h-full p-3">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wider text-center relative z-10">
                  {/* Nombre de la empresa dividido en dos partes */}
                  {projectData.company.split(' ')[0] || 'Empresa'}
                </h2>
                <h1 className="text-3xl font-bold text-white uppercase mb-2 text-center relative z-10">
                  {/* Resto del nombre de la empresa */}
                  {projectData.company.split(' ').slice(1).join(' ') || 'Cliente'}
                </h1>
                <div className="w-16 h-16 border-4 border-white/90 rounded-full flex items-center justify-center mb-2 mx-auto relative z-10 shadow-lg">
                  <span className="text-2xl text-white">+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fila 2: Caso de Negocio, Problema, Objetivo */}
        <div className="grid grid-cols-3 gap-6">
          {/* Caso de Negocio */}
          <div 
            className={`relative ${getCardStyle('business')} overflow-hidden`}
            onMouseEnter={() => setHoverSection('business')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {getSectionIcon('business')}
                  <h2 className="text-2xl font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)]">Caso de negocio</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      className="text-blue-300 hover:text-white transition-colors"
                      onMouseEnter={() => setShowTooltip('business')}
                      onMouseLeave={() => setShowTooltip(null)}
                      title="Información sobre esta sección"
                    >
                      <Info size={18} />
                    </button>
                    {showTooltip === 'business' && (
                      <div className="absolute right-0 top-6 w-56 bg-gray-800/95 backdrop-blur-md text-white p-2 rounded shadow-xl text-xs z-10 border border-blue-400/30">
                        {getTooltipText('business')}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleFullscreen('business')} 
                    className="p-1 hover:bg-blue-700/50 rounded transition-colors"
                    title="Ver en pantalla completa"
                  >
                    {isFullscreen === 'business' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-blue-200 font-semibold text-base mb-1">Contexto</h3>
                  <p className="text-xs text-white leading-relaxed">
                    {projectData.business.context}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-blue-200 font-semibold text-base mb-1">Problemas clave</h3>
                  <ul className="list-disc ml-4 text-xs text-white space-y-1">
                    {projectData.business.keyProblems.map((problem, index) => (
                      <li key={index}>{problem}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Efecto decorativo */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-600/20 rounded-full blur-xl pointer-events-none"></div>
            </div>
          </div>
          
          {/* Declaración Problema */}
          <div 
            className={`relative ${getCardStyle('problem')} overflow-hidden`}
            onMouseEnter={() => setHoverSection('problem')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {getSectionIcon('problem')}
                  <h2 className="text-2xl font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)]">Declaración Problema</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      className="text-orange-300 hover:text-white transition-colors"
                      onMouseEnter={() => setShowTooltip('problem')}
                      onMouseLeave={() => setShowTooltip(null)}
                      title="Información sobre esta sección"
                    >
                      <Info size={18} />
                    </button>
                    {showTooltip === 'problem' && (
                      <div className="absolute right-0 top-6 w-56 bg-gray-800/95 backdrop-blur-md text-white p-2 rounded shadow-xl text-xs z-10 border border-orange-400/30">
                        {getTooltipText('problem')}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleFullscreen('problem')} 
                    className="p-1 hover:bg-orange-700/50 rounded transition-colors"
                    title="Ver en pantalla completa"
                  >
                    {isFullscreen === 'problem' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
              
              <p className="text-xs text-white leading-relaxed mb-3">
                {projectData.problem.description}
              </p>
              
              <h3 className="text-orange-200 font-semibold text-base mb-1">Impacto</h3>
              <p className="text-xs text-white leading-relaxed">
                {projectData.problem.impact}
              </p>

              {/* Efecto decorativo */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-orange-600/20 rounded-full blur-xl pointer-events-none"></div>
            </div>
          </div>
          
          {/* Declaración del Objetivo */}
          <div 
            className={`relative ${getCardStyle('goal')} overflow-hidden`}
            onMouseEnter={() => setHoverSection('goal')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {getSectionIcon('goal')}
                  <h2 className="text-2xl font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)]">Declaración del Objetivo</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      className="text-indigo-300 hover:text-white transition-colors"
                      onMouseEnter={() => setShowTooltip('goal')}
                      onMouseLeave={() => setShowTooltip(null)}
                      title="Información sobre esta sección"
                    >
                      <Info size={18} />
                    </button>
                    {showTooltip === 'goal' && (
                      <div className="absolute right-0 top-6 w-56 bg-gray-800/95 backdrop-blur-md text-white p-2 rounded shadow-xl text-xs z-10 border border-indigo-400/30">
                        {getTooltipText('goal')}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleFullscreen('goal')} 
                    className="p-1 hover:bg-indigo-700/50 rounded transition-colors"
                    title="Ver en pantalla completa"
                  >
                    {isFullscreen === 'goal' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-indigo-200 font-semibold text-base mb-1">Objetivo General</h3>
                  <p className="text-xs text-white leading-relaxed">
                    {projectData.goal.general}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-indigo-200 font-semibold text-base mb-1">Objetivos Específicos</h3>
                  <ul className="list-disc ml-4 text-xs text-white space-y-1">
                    {projectData.goal.specific.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Efecto decorativo */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-600/20 rounded-full blur-xl pointer-events-none"></div>
            </div>
          </div>
        </div>
        
        {/* Fila 3: Alcance Dentro y Alcance Fuera */}
        <div className="grid grid-cols-2 gap-6">
          {/* Alcance Dentro */}
          <div 
            className={`relative ${getCardStyle('scopeIn')} overflow-hidden`}
            onMouseEnter={() => setHoverSection('scopeIn')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {getSectionIcon('scopeIn')}
                  <h2 className="text-2xl font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)]">Alcance Dentro</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      className="text-teal-300 hover:text-white transition-colors"
                      onMouseEnter={() => setShowTooltip('scopeIn')}
                      onMouseLeave={() => setShowTooltip(null)}
                      title="Información sobre esta sección"
                    >
                      <Info size={18} />
                    </button>
                    {showTooltip === 'scopeIn' && (
                      <div className="absolute right-0 top-6 w-56 bg-gray-800/95 backdrop-blur-md text-white p-2 rounded shadow-xl text-xs z-10 border border-teal-400/30">
                        {getTooltipText('scopeIn')}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleFullscreen('scopeIn')} 
                    className="p-1 hover:bg-teal-700/50 rounded transition-colors"
                    title="Ver en pantalla completa"
                  >
                    {isFullscreen === 'scopeIn' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
              
              <ul className="list-disc ml-4 text-xs text-white space-y-1.5">
                {projectData.scopeIn.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              {/* Efecto decorativo */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-teal-600/20 rounded-full blur-xl pointer-events-none"></div>
            </div>
          </div>
          
          {/* Alcance Fuera */}
          <div 
            className={`relative ${getCardStyle('scopeOut')} overflow-hidden`}
            onMouseEnter={() => setHoverSection('scopeOut')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {getSectionIcon('scopeOut')}
                  <h2 className="text-2xl font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)]">Alcance Fuera</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      className="text-emerald-300 hover:text-white transition-colors"
                      onMouseEnter={() => setShowTooltip('scopeOut')}
                      onMouseLeave={() => setShowTooltip(null)}
                      title="Información sobre esta sección"
                    >
                      <Info size={18} />
                    </button>
                    {showTooltip === 'scopeOut' && (
                      <div className="absolute right-0 top-6 w-56 bg-gray-800/95 backdrop-blur-md text-white p-2 rounded shadow-xl text-xs z-10 border border-emerald-400/30">
                        {getTooltipText('scopeOut')}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleFullscreen('scopeOut')} 
                    className="p-1 hover:bg-emerald-700/50 rounded transition-colors"
                    title="Ver en pantalla completa"
                  >
                    {isFullscreen === 'scopeOut' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
              
              <ul className="list-disc ml-4 text-xs text-white space-y-1.5">
                {projectData.scopeOut.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>

              {/* Efecto decorativo */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-600/20 rounded-full blur-xl pointer-events-none"></div>
            </div>
          </div>
        </div>
        
        {/* Fila 4: Hitos y Equipo */}
        <div className="grid grid-cols-2 gap-6">
          {/* Hitos Principales */}
          <div 
            className={`relative ${getCardStyle('milestones')} overflow-hidden`}
            onMouseEnter={() => setHoverSection('milestones')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {getSectionIcon('milestones')}
                  <h2 className="text-2xl font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)]">Hitos Principales</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      className="text-purple-300 hover:text-white transition-colors"
                      onMouseEnter={() => setShowTooltip('milestones')}
                      onMouseLeave={() => setShowTooltip(null)}
                      title="Información sobre esta sección"
                    >
                      <Info size={18} />
                    </button>
                    {showTooltip === 'milestones' && (
                      <div className="absolute right-0 top-6 w-56 bg-gray-800/95 backdrop-blur-md text-white p-2 rounded shadow-xl text-xs z-10 border border-purple-400/30">
                        {getTooltipText('milestones')}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleFullscreen('milestones')} 
                    className="p-1 hover:bg-purple-700/50 rounded transition-colors"
                    title="Ver en pantalla completa"
                  >
                    {isFullscreen === 'milestones' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
              
              <ul className="list-disc ml-4 text-xs text-white space-y-1.5">
                {projectData.milestones.map((milestone, index) => (
                  <li key={index}>
                    <strong className="text-purple-200">{milestone.phase}:</strong> {milestone.description}
                  </li>
                ))}
              </ul>

              {/* Efecto decorativo */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-600/20 rounded-full blur-xl pointer-events-none"></div>
            </div>
          </div>
          
          {/* Equipo del Proyecto */}
          <div 
            className={`relative ${getCardStyle('team')} overflow-hidden`}
            onMouseEnter={() => setHoverSection('team')}
            onMouseLeave={() => setHoverSection(null)}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {getSectionIcon('team')}
                  <h2 className="text-2xl font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)]">Equipo del Proyecto</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      className="text-red-300 hover:text-white transition-colors"
                      onMouseEnter={() => setShowTooltip('team')}
                      onMouseLeave={() => setShowTooltip(null)}
                      title="Información sobre esta sección"
                    >
                      <Info size={18} />
                    </button>
                    {showTooltip === 'team' && (
                      <div className="absolute right-0 top-6 w-56 bg-gray-800/95 backdrop-blur-md text-white p-2 rounded shadow-xl text-xs z-10 border border-red-400/30">
                        {getTooltipText('team')}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => toggleFullscreen('team')} 
                    className="p-1 hover:bg-red-700/50 rounded transition-colors"
                    title="Ver en pantalla completa"
                  >
                    {isFullscreen === 'team' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                </div>
              </div>
              
              <ul className="list-disc ml-4 text-xs text-white space-y-1.5">
                {projectData.team.map((member, index) => (
                  <li key={index}>
                    <strong className="text-red-200">{member.role}:</strong> {member.name}
                  </li>
                ))}
                {projectData.team.length === 0 && (
                  <li>No hay miembros asignados al equipo</li>
                )}
              </ul>

              {/* Efecto decorativo */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-red-600/20 rounded-full blur-xl pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Botón para cerrar pantalla completa */}
      {isFullscreen && (
        <button
          className="fixed top-5 right-5 z-50 p-2 bg-gray-800/90 hover:bg-gray-700 rounded-full shadow-lg backdrop-blur-md transition-colors"
          onClick={() => setIsFullscreen(null)}
          title="Cerrar pantalla completa"
        >
          <Minimize2 size={24} />
        </button>
      )}

      {/* Botón de guardar */}
      {hasChanges && <SaveButton />}
    </div>
  );
};

export default ProjectCharter;
