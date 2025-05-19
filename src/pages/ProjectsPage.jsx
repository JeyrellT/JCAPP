import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  SlidersHorizontal, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Filter, 
  SortAsc, 
  SortDesc,
  Tag,
  Folder
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import Select from 'react-select';

// Componentes
import ProjectCard from '../components/common/ProjectCard';
import GradientButton from '../components/common/GradientButton';

const PROJECT_CATEGORIES = [
  'Calidad',
  'Logística',
  'Producción',
  'Servicio al Cliente',
  'Finanzas',
  'Procesos',
  'TI/Sistemas',
  'Recursos Humanos',
  'Otros'
];

const ProjectsPage = () => {
  const { projects } = useLeanSixSigma();
  
  // Estados para filtrado y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [tagsFilter, setTagsFilter] = useState([]);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Obtener tags únicos de todos los proyectos
  const uniqueTags = [...new Set(projects.flatMap(project => project.tags || []))];
  const tagOptions = uniqueTags.map(tag => ({ value: tag, label: tag }));
  
  // Filtrar y ordenar proyectos
  const filteredProjects = projects
    .filter(project => {
      // Filtro por búsqueda (nombre y descripción)
      const matchesSearch = searchTerm === '' || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro por estado
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      
      // Filtro por fase
      const matchesPhase = phaseFilter === 'all' || project.phase === phaseFilter;
      
      // Filtro por categoría
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
      
      // Filtro por tags
      const matchesTags = tagsFilter.length === 0 || 
        (project.tags && tagsFilter.every(tag => project.tags.includes(tag)));
      
      return matchesSearch && matchesStatus && matchesPhase && matchesCategory && matchesTags;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'progress') {
        return sortOrder === 'asc' 
          ? a.progress - b.progress 
          : b.progress - a.progress;
      } else if (sortBy === 'updatedAt') {
        const dateA = new Date(a.updatedAt || 0);
        const dateB = new Date(b.updatedAt || 0);
        return sortOrder === 'asc' 
          ? dateA - dateB 
          : dateB - dateA;
      } else if (sortBy === 'startDate') {
        const dateA = new Date(a.startDate || 0);
        const dateB = new Date(b.startDate || 0);
        return sortOrder === 'asc' 
          ? dateA - dateB 
          : dateB - dateA;
      }
      return 0;
    });
  
  // Función para alternar orden
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Obtener fases únicas para filtrado
  const uniquePhases = [...new Set(projects.map(project => project.phase))];
  
  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // Contar filtros activos
  const activeFiltersCount = [
    statusFilter !== 'all',
    phaseFilter !== 'all',
    categoryFilter !== 'all',
    tagsFilter.length > 0
  ].filter(Boolean).length;
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto p-4 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Proyectos
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Gestiona y visualiza todos tus proyectos Lean Six Sigma
            </p>
          </div>
          
          <GradientButton to="/new-project" className="flex items-center">
            <PlusCircle size={16} className="mr-2" /> Nuevo Proyecto
          </GradientButton>
        </div>
      </motion.div>
      
      {/* Búsqueda y Filtros */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-grow">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar proyectos..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <SlidersHorizontal size={16} className="mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleSort('updatedAt')}
              className={`p-2 rounded-lg border ${
                sortBy === 'updatedAt' 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              title="Ordenar por fecha de actualización"
            >
              {sortBy === 'updatedAt' && sortOrder === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />}
            </button>
            
            <button
              onClick={() => toggleSort('name')}
              className={`p-2 rounded-lg border ${
                sortBy === 'name' 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              title="Ordenar por nombre"
            >
              A-Z
            </button>
            
            <button
              onClick={() => toggleSort('progress')}
              className={`p-2 rounded-lg border ${
                sortBy === 'progress' 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
              title="Ordenar por progreso"
            >
              %
            </button>
          </div>
        </div>
        
        {/* Filtros expandibles */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusFilter === 'all'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <Filter size={12} className="inline mr-1" />
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusFilter === 'active'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <Clock size={12} className="inline mr-1" />
                  Activos
                </button>
                <button
                  onClick={() => setStatusFilter('planning')}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusFilter === 'planning'
                      ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <Clock size={12} className="inline mr-1" />
                  Planificación
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusFilter === 'completed'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <CheckCircle size={12} className="inline mr-1" />
                  Completados
                </button>
              </div>
            </div>

            {/* Filtro por Fase DMAIC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fase DMAIC
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPhaseFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    phaseFilter === 'all'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <Filter size={12} className="inline mr-1" />
                  Todas
                </button>
                {uniquePhases.map(phase => (
                  <button
                    key={phase}
                    onClick={() => setPhaseFilter(phase)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      phaseFilter === phase
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    categoryFilter === 'all'
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <Folder size={12} className="inline mr-1" />
                  Todas
                </button>
                {PROJECT_CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      categoryFilter === category
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Etiquetas
              </label>
              <Select
                isMulti
                name="tags"
                options={tagOptions}
                value={tagsFilter.map(tag => ({ value: tag, label: tag }))}
                onChange={(selectedOptions) => {
                  const selectedTags = selectedOptions ? selectedOptions.map(option => option.value) : [];
                  setTagsFilter(selectedTags);
                }}
                placeholder="Seleccionar etiquetas..."
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: 'var(--bg-input, white)',
                    borderColor: state.isFocused ? 'var(--border-focus, #3B82F6)' : 'var(--border-input, #D1D5DB)',
                    boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
                    ':hover': {
                      borderColor: 'var(--border-focus, #3B82F6)'
                    }
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? 'var(--bg-selected, #3B82F6)'
                      : state.isFocused
                      ? 'var(--bg-hover, #EFF6FF)'
                      : 'transparent',
                    color: state.isSelected ? 'white' : 'var(--text-primary, #1F2937)'
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: 'var(--bg-tag, #E5E7EB)'
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: 'var(--text-tag, #374151)'
                  })
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Lista de proyectos */}
      {filteredProjects.length > 0 ? (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProjects.map(project => (
            <motion.div key={project.id} variants={itemVariants}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center"
        >
          <XCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            No se encontraron proyectos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No hay proyectos que coincidan con los criterios de búsqueda.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPhaseFilter('all');
              setCategoryFilter('all');
              setTagsFilter([]);
            }}
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
          >
            <Filter size={16} className="mr-1" />
            Limpiar filtros
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProjectsPage;
