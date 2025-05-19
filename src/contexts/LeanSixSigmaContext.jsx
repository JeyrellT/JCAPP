import { createContext, useContext, useState, useEffect } from 'react';
import projectsData from '../data/projects';
import toolsData from '../data/tools';
import { loadProjects, saveProjects, loadTools, saveTools } from '../utils/storage';

// Crear el contexto
const LeanSixSigmaContext = createContext();

// Hook personalizado para usar el contexto
export function useLeanSixSigma() {
  return useContext(LeanSixSigmaContext);
}

// Proveedor del contexto
export function LeanSixSigmaProvider({ children }) {
  // Estado para proyectos y herramientas
  const [projects, setProjects] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    // Intentar cargar desde localStorage primero
    const savedProjects = loadProjects();
    const savedTools = loadTools();
    
    if (savedProjects && savedProjects.length > 0) {
      setProjects(savedProjects);
    } else {
      // Si no hay datos guardados, usar los datos por defecto
      setProjects(projectsData);
    }
    
    if (savedTools && savedTools.length > 0) {
      setTools(savedTools);
    } else {
      // Si no hay datos guardados, usar los datos por defecto
      setTools(toolsData);
    }
    
    setLoading(false);
  }, []);

  // Guardar proyectos en localStorage cuando cambien
  useEffect(() => {
    if (!loading) {
      saveProjects(projects);
    }
  }, [projects, loading]);

  // Guardar herramientas en localStorage cuando cambien
  useEffect(() => {
    if (!loading) {
      saveTools(tools);
    }
  }, [tools, loading]);

  // Función para añadir un nuevo proyecto
  const addProject = (newProject) => {
    const projectWithId = {
      ...newProject,
      id: `project-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      status: newProject.status || 'active',
      category: newProject.category || 'Calidad',
      tags: newProject.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      configuration: {
        startDate: newProject.startDate || new Date().toISOString(),
        endDate: newProject.endDate || '',
        team: newProject.team || [],
        budget: newProject.budget || {
          planned: 0,
          actual: 0,
          currency: 'CRC'
        },
        customFields: newProject.customFields || {}
      },
      tools: newProject.tools || {}
    };

    setProjects(prevProjects => [...prevProjects, projectWithId]);
    return projectWithId;
  };

  // Función para actualizar un proyecto existente
  const updateProject = (id, updatedData) => {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id !== id) return project;
        
        // Merge configuration object if provided
        const configuration = updatedData.configuration
          ? {
              ...project.configuration,
              ...updatedData.configuration,
            }
          : project.configuration;
        
        // Merge or replace tags array if provided
        const tags = updatedData.tags || project.tags;
        
        // Ensure category is maintained or updated
        const category = updatedData.category || project.category;
        
        return {
          ...project,
          ...updatedData,
          configuration,
          category,
          tags,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  // Función para eliminar un proyecto
  const deleteProject = (id) => {
    setProjects(prevProjects => 
      prevProjects.filter(project => project.id !== id)
    );
  };

  // Función para marcar una herramienta como completada o pendiente en un proyecto
  const updateToolStatus = (projectId, toolId, status) => {
    setProjects(prevProjects => 
      prevProjects.map(project => {
        if (project.id !== projectId) return project;
        
        const updatedTools = { ...project.tools };
        updatedTools[toolId] = { 
          ...updatedTools[toolId],
          status,
          updatedAt: new Date().toISOString()
        };
        
        return {
          ...project,
          tools: updatedTools,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  // Obtener un proyecto por su ID
  const getProject = (id) => {
    return projects.find(project => project.id === id) || null;
  };

  // Obtener una herramienta por su ID
  const getTool = (id) => {
    return tools.find(tool => tool.id === id) || null;
  };

  // Obtener herramientas de un proyecto agrupadas por fase
  const getProjectToolsByPhase = (projectId) => {
    const project = getProject(projectId);
    if (!project) return {};
    
    // First collect all tools by phase
    const toolsByPhase = tools.reduce((acc, tool) => {
      // Normalize phase name to capitalize first letter (e.g., 'define' -> 'Define')
      const phase = tool.phase.charAt(0).toUpperCase() + tool.phase.slice(1).toLowerCase();
      if (!acc[phase]) {
        acc[phase] = [];
      }
      
      // Verificar si la herramienta está en el proyecto
      const toolStatus = project.tools[tool.id] || { status: 'not_started' };
      
      acc[phase].push({
        ...tool,
        status: toolStatus.status,
        updatedAt: toolStatus.updatedAt,
      });
      
      return acc;
    }, {});
    
    // Define the correct DMAIC order
    const phaseOrder = ['Define', 'Measure', 'Analyze', 'Improve', 'Control'];
    
    // Create a new object with phases in the correct order
    const orderedToolsByPhase = {};
    phaseOrder.forEach(phase => {
      if (toolsByPhase[phase]) {
        orderedToolsByPhase[phase] = toolsByPhase[phase];
      }
    });
    
    return orderedToolsByPhase;
  };
  
  // Calcular estadísticas generales
  const getStats = () => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    
    // Total de herramientas usadas en todos los proyectos
    let totalTools = 0;
    let completedTools = 0;
    
    projects.forEach(project => {
      const projectTools = Object.values(project.tools || {});
      totalTools += projectTools.length;
      completedTools += projectTools.filter(t => t.status === 'completed').length;
    });
    
    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTools,
      completedTools,
      completionRate: totalTools ? Math.round((completedTools / totalTools) * 100) : 0
    };
  };

  // Valor del contexto
  const value = {
    projects,
    tools,
    loading,
    addProject,
    updateProject,
    deleteProject,
    updateToolStatus,
    getProject,
    getTool,
    getProjectToolsByPhase,
    getStats
  };

  return (
    <LeanSixSigmaContext.Provider value={value}>
      {children}
    </LeanSixSigmaContext.Provider>
  );
}
