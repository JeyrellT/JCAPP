import useDocumentTitle from '../hooks/useDocumentTitle';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import NewProjectForm from '../components/forms/NewProjectForm';

/**
 * Página para crear un nuevo proyecto Lean Six Sigma.
 * Sin props: es una ruta de nivel raíz (/projects/new).
 */
const NewProjectPage = () => {
  useDocumentTitle('Nuevo proyecto');

  return (
    <PageContainer width="form" gap="lg">
      <PageHeader
        breadcrumbs={[{ label: 'Proyectos', to: '/projects' }, { label: 'Nuevo proyecto' }]}
        title="Nuevo proyecto"
        description="Define el alcance inicial. Podrás ajustar todo después."
      />
      <NewProjectForm />
    </PageContainer>
  );
};

export default NewProjectPage;
