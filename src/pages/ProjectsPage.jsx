import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import GradientButton from '../components/common/GradientButton';
import EmptyState from '../components/common/EmptyState';
import { SkeletonCard } from '../components/common/Skeleton';
import ProjectCard from '../components/common/ProjectCard';
import { PHASE_ORDER, PROJECT_STATUS, formatPhase } from '../lib/phases';
import { isOverdue } from '../lib/format';
import { staggerContainer, fadeInUp } from '../lib/motion';

const SORT_OPTIONS = [
  { value: 'urgency', label: 'Urgencia' },
  { value: 'updated', label: 'Última actualización' },
  { value: 'progress', label: 'Avance' },
  { value: 'name', label: 'Nombre (A–Z)' },
];

/** Avance derivado (fórmula 0.4.1 del brief): nunca `project.progress` crudo. */
function getProgress(project) {
  const planIds = Object.keys(project.tools || {});
  if (planIds.length === 0) return 0;
  const done = planIds.filter((id) => project.tools[id].status === 'completed').length;
  return Math.round((done / planIds.length) * 100);
}

/**
 * Rango de urgencia por proyecto para el orden "Urgencia" (0.4.4 del brief):
 * vencidos primero (más vencido arriba), luego por vencer/futuros ascendente
 * por `endDate`, luego sin fecha, y los completados siempre al final.
 */
function urgencyRank(project) {
  if (project.status === 'completed') return 3;
  if (!project.endDate) return 2;
  return isOverdue(project.endDate) ? 0 : 1;
}

function compareByUrgency(a, b) {
  const ra = urgencyRank(a);
  const rb = urgencyRank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 3) return new Date(b.endDate || 0) - new Date(a.endDate || 0);
  if (ra === 2) return a.name.localeCompare(b.name);
  return new Date(a.endDate) - new Date(b.endDate);
}

const EMPTY_FILTERS = { statusFilter: 'all', phaseFilter: 'all', companyFilter: 'all' };

/**
 * ProjectsPage — listado de proyectos con búsqueda, filtros y orden.
 * Ninguna prop: página de ruta.
 */
const ProjectsPage = () => {
  useDocumentTitle('Proyectos');
  const { projects, loading } = useLeanSixSigma();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(EMPTY_FILTERS.statusFilter);
  const [phaseFilter, setPhaseFilter] = useState(EMPTY_FILTERS.phaseFilter);
  const [companyFilter, setCompanyFilter] = useState(EMPTY_FILTERS.companyFilter);
  const [sortBy, setSortBy] = useState('urgency');

  const companies = useMemo(
    () => [...new Set(projects.map((p) => p.company).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      const matchesSearch =
        term === '' ||
        project.name.toLowerCase().includes(term) ||
        (project.description && project.description.toLowerCase().includes(term)) ||
        (project.company && project.company.toLowerCase().includes(term));

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesPhase = phaseFilter === 'all' || project.phase === phaseFilter;
      const matchesCompany = companyFilter === 'all' || project.company === companyFilter;

      return matchesSearch && matchesStatus && matchesPhase && matchesCompany;
    });

    const sorted = [...filtered];
    if (sortBy === 'urgency') {
      sorted.sort(compareByUrgency);
    } else if (sortBy === 'updated') {
      sorted.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    } else if (sortBy === 'progress') {
      sorted.sort((a, b) => getProgress(b) - getProgress(a));
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [projects, searchTerm, statusFilter, phaseFilter, companyFilter, sortBy]);

  const activeFilters = [
    statusFilter !== 'all' && {
      key: 'status',
      label: PROJECT_STATUS[statusFilter]?.label || statusFilter,
      onClear: () => setStatusFilter('all'),
    },
    phaseFilter !== 'all' && {
      key: 'phase',
      label: formatPhase(phaseFilter),
      onClear: () => setPhaseFilter('all'),
    },
    companyFilter !== 'all' && {
      key: 'company',
      label: companyFilter,
      onClear: () => setCompanyFilter('all'),
    },
  ].filter(Boolean);

  const hasActiveFilters = activeFilters.length > 0 || searchTerm.trim() !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPhaseFilter('all');
    setCompanyFilter('all');
  };

  return (
    <PageContainer gap="lg">
      <PageHeader
        title="Proyectos"
        description="Gestiona y visualiza tus proyectos Lean Six Sigma"
        actions={
          <GradientButton to="/projects/new" leadingIcon={<Plus size={16} />}>
            Nuevo proyecto
          </GradientButton>
        }
      />

      {/* Búsqueda y filtros */}
      <div className="card space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <label htmlFor="projects-search" className="sr-only">
              Buscar proyectos
            </label>
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
            />
            <input
              id="projects-search"
              type="text"
              placeholder="Buscar por nombre, descripción o empresa…"
              className="input pl-9 pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded text-content-muted transition-colors duration-fast hover:text-content"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div>
            <label htmlFor="projects-status" className="sr-only">
              Estado
            </label>
            <select
              id="projects-status"
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              {Object.entries(PROJECT_STATUS).map(([key, token]) => (
                <option key={key} value={key}>
                  {token.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="projects-phase" className="sr-only">
              Fase DMAIC
            </label>
            <select
              id="projects-phase"
              className="input"
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
            >
              <option value="all">Todas las fases</option>
              {PHASE_ORDER.map((phase) => (
                <option key={phase} value={phase}>
                  {formatPhase(phase)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="projects-company" className="sr-only">
              Empresa
            </label>
            <select
              id="projects-company"
              className="input"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="all">Todas las empresas</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-3">
          <label className="flex items-center gap-2 text-sm text-content-secondary">
            Ordenar por
            <select
              className="input h-9 w-auto py-1"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Contador y chips de filtros activos */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-content-secondary">
        <span>
          Mostrando {filteredProjects.length} de {projects.length} proyecto{projects.length === 1 ? '' : 's'}
        </span>
        {activeFilters.map((filter) => (
          <span key={filter.key} className="badge bg-surface-sunken text-content-secondary">
            {filter.label}
            <button
              type="button"
              onClick={filter.onClear}
              aria-label={`Quitar filtro ${filter.label}`}
              className="rounded text-content-muted transition-colors duration-fast hover:text-content"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="rounded text-sm font-medium text-brand transition-colors duration-fast hover:text-brand-hover"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Estados y listado */}
      {loading ? (
        <div role="status" aria-busy="true" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Cargando…</span>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          variant="sin-datos"
          title="Aún no hay proyectos"
          description="Crea tu primer proyecto Lean Six Sigma para empezar a medir."
          action={
            <GradientButton to="/projects/new" leadingIcon={<Plus size={16} />}>
              Nuevo proyecto
            </GradientButton>
          }
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          variant="sin-resultados"
          title="Ningún proyecto coincide"
          description="Ajusta la búsqueda o limpia los filtros para volver a ver tus proyectos."
          action={
            <GradientButton variant="outline" onClick={clearAllFilters}>
              Limpiar filtros
            </GradientButton>
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={fadeInUp}>
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageContainer>
  );
};

export default ProjectsPage;
