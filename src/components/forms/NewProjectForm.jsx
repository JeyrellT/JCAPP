import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { PHASE_ORDER, formatPhase, normalizePhase, PROJECT_STATUS } from '../../lib/phases';
import GradientButton from '../common/GradientButton';
import Notification from '../common/Notification';

/**
 * Reglas de validación compartidas por NewProjectForm y EditProjectForm.
 * Exportadas para que EditProjectForm no las redeclare (mismo carril, sin
 * crear un archivo nuevo fuera del alcance de B3).
 */
// eslint-disable-next-line react-refresh/only-export-components -- constante compartida con EditProjectForm/TeamMemberForm, no un componente.
export const PROJECT_FORM_RULES = {
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  COMPANY_MAX_LENGTH: 100,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

/** Roles habituales para el <datalist> de rol de equipo, compartidos entre los tres formularios del carril. */
// eslint-disable-next-line react-refresh/only-export-components -- constante compartida, no un componente.
export const COMMON_TEAM_ROLES = [
  'Líder del Proyecto',
  'Patrocinador',
  'Black Belt',
  'Green Belt',
  'Analista de Datos',
  'Stakeholder',
  'Experto en Procesos',
  'Representante de Operaciones',
  'Ingeniero de Calidad',
];

const EMPTY_MEMBER = { name: '', role: '', position: '', email: '' };

const todayIso = () => new Date().toISOString().split('T')[0];

/**
 * Formulario de creación de proyecto. Al guardar, siembra el plan de
 * herramientas de la fase Define (derivado del catálogo real del contexto,
 * nunca de ids fijos) para que el proyecto nazca con un "Siguiente" real,
 * y navega al detalle del proyecto creado.
 *
 * Sin props: se monta directo en NewProjectPage.
 */
const NewProjectForm = () => {
  const navigate = useNavigate();
  const { addProject, tools } = useLeanSixSigma();
  const [submitError, setSubmitError] = useState('');
  const [notice, setNotice] = useState({ show: false, message: '' });
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      company: '',
      status: 'active',
      phase: 'Define',
      startDate: todayIso(),
      endDate: '',
      team: [EMPTY_MEMBER],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'team' });

  const startDate = watch('startDate');
  const descriptionValue = watch('description') || '';
  const errorList = Object.values(errors);

  const onSubmit = async (data) => {
    setSubmitError('');

    const seed = Object.fromEntries(
      tools
        .filter((t) => normalizePhase(t.phase) === 'Define')
        .map((t) => [t.id, { status: 'not_started', updatedAt: new Date().toISOString(), notes: '' }])
    );

    const payload = {
      name: data.name.trim(),
      description: data.description.trim(),
      status: data.status,
      phase: data.phase,
      startDate: data.startDate,
      endDate: data.endDate,
      company: data.company.trim(),
      team: data.team.map((member) => ({
        id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: member.name.trim(),
        role: member.role.trim(),
        position: member.position?.trim() || '',
        email: member.email?.trim() || '',
      })),
      kpis: [],
      // El avance nace en 0: el plan sembrado (fase Define) empieza entero en
      // 'not_started'. Nunca se pinta un progreso editado a mano (regla 0.2.1).
      progress: 0,
      tools: seed,
    };

    try {
      const created = addProject(payload);
      setNotice({ show: true, message: 'Proyecto creado. Primera parada: Definir.' });
      setRedirecting(true);
      window.setTimeout(() => navigate(`/projects/${created.id}`), 900);
    } catch (error) {
      console.error('[NewProjectForm] error al crear proyecto', error);
      setSubmitError('No se pudo crear el proyecto. Intenta de nuevo.');
    }
  };

  const busy = isSubmitting || redirecting;

  return (
    <div className="card p-6">
      <Notification
        message={notice.message}
        type="success"
        show={notice.show}
        onClose={() => setNotice({ show: false, message: '' })}
        duration={2000}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {isSubmitted && errorList.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-danger-on">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Revisa estos campos antes de continuar:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {errorList.map((err, i) => (
                  <li key={i}>{typeof err?.message === 'string' ? err.message : 'Hay un error en un miembro del equipo.'}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-6 rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm text-danger-on">
            {submitError}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-content">Información básica</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-content-secondary">
                  Nombre del proyecto <span className="text-danger">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="Nombre del proyecto"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  {...register('name', {
                    required: 'El proyecto necesita un nombre',
                    maxLength: {
                      value: PROJECT_FORM_RULES.NAME_MAX_LENGTH,
                      message: `El nombre no puede exceder ${PROJECT_FORM_RULES.NAME_MAX_LENGTH} caracteres`,
                    },
                  })}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-sm text-danger">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="company" className="mb-1 block text-sm font-medium text-content-secondary">
                  Empresa <span className="text-danger">*</span>
                </label>
                <input
                  id="company"
                  type="text"
                  className="input"
                  placeholder="Nombre de la empresa"
                  aria-invalid={errors.company ? 'true' : 'false'}
                  aria-describedby={errors.company ? 'company-error' : undefined}
                  {...register('company', {
                    required: 'Indica la empresa para poder agrupar tus proyectos',
                    maxLength: {
                      value: PROJECT_FORM_RULES.COMPANY_MAX_LENGTH,
                      message: `La empresa no puede exceder ${PROJECT_FORM_RULES.COMPANY_MAX_LENGTH} caracteres`,
                    },
                  })}
                />
                {errors.company && (
                  <p id="company-error" className="mt-1 text-sm text-danger">{errors.company.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="mb-1 flex items-baseline justify-between">
                  <label htmlFor="description" className="block text-sm font-medium text-content-secondary">
                    Descripción <span className="text-danger">*</span>
                  </label>
                  <span className="text-xs text-content-muted">
                    {descriptionValue.length}/{PROJECT_FORM_RULES.DESCRIPTION_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  id="description"
                  rows={4}
                  className="input"
                  placeholder="Describe el objetivo y alcance del proyecto..."
                  aria-invalid={errors.description ? 'true' : 'false'}
                  aria-describedby={errors.description ? 'description-error' : undefined}
                  {...register('description', {
                    required: 'Describe el objetivo del proyecto',
                    maxLength: {
                      value: PROJECT_FORM_RULES.DESCRIPTION_MAX_LENGTH,
                      message: `La descripción no puede exceder ${PROJECT_FORM_RULES.DESCRIPTION_MAX_LENGTH} caracteres`,
                    },
                  })}
                />
                {errors.description && (
                  <p id="description-error" className="mt-1 text-sm text-danger">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-content">Planificación</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="status" className="mb-1 block text-sm font-medium text-content-secondary">
                  Estado
                </label>
                <select id="status" className="input" {...register('status')}>
                  {Object.entries(PROJECT_STATUS).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="phase" className="mb-1 block text-sm font-medium text-content-secondary">
                  Fase DMAIC
                </label>
                <select id="phase" className="input" {...register('phase')}>
                  {PHASE_ORDER.map((phase) => (
                    <option key={phase} value={phase}>{formatPhase(phase)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-content-secondary">
                  Fecha de inicio <span className="text-danger">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="input"
                  aria-invalid={errors.startDate ? 'true' : 'false'}
                  aria-describedby={errors.startDate ? 'startDate-error' : undefined}
                  {...register('startDate', { required: 'La fecha de inicio es requerida' })}
                />
                {errors.startDate && (
                  <p id="startDate-error" className="mt-1 text-sm text-danger">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-content-secondary">
                  Fecha de fin <span className="text-danger">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  className="input"
                  aria-invalid={errors.endDate ? 'true' : 'false'}
                  aria-describedby={errors.endDate ? 'endDate-error' : undefined}
                  {...register('endDate', {
                    required: 'La fecha de fin es requerida',
                    validate: (value) =>
                      !startDate || !value || value >= startDate || 'La fecha de fin no puede ser anterior al inicio',
                  })}
                />
                {errors.endDate && (
                  <p id="endDate-error" className="mt-1 text-sm text-danger">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-content">Equipo del proyecto</h2>
              <GradientButton
                type="button"
                variant="outline"
                size="sm"
                leadingIcon={<Plus size={14} />}
                onClick={() => append(EMPTY_MEMBER)}
              >
                Añadir miembro
              </GradientButton>
            </div>

            <div className="mt-4 space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-line bg-surface-sunken/40 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label htmlFor={`team.${index}.name`} className="mb-1 block text-xs font-medium text-content-secondary">
                        Nombre <span className="text-danger">*</span>
                      </label>
                      <input
                        id={`team.${index}.name`}
                        type="text"
                        className="input"
                        placeholder="Nombre completo"
                        aria-invalid={errors.team?.[index]?.name ? 'true' : 'false'}
                        {...register(`team.${index}.name`, { required: 'Falta el nombre de este integrante' })}
                      />
                      {errors.team?.[index]?.name && (
                        <p className="mt-1 text-xs text-danger">{errors.team[index].name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`team.${index}.role`} className="mb-1 block text-xs font-medium text-content-secondary">
                        Rol <span className="text-danger">*</span>
                      </label>
                      <input
                        id={`team.${index}.role`}
                        type="text"
                        className="input"
                        placeholder="Rol en el proyecto"
                        list="new-project-common-roles"
                        aria-invalid={errors.team?.[index]?.role ? 'true' : 'false'}
                        {...register(`team.${index}.role`, { required: 'Falta el rol de este integrante' })}
                      />
                      {errors.team?.[index]?.role && (
                        <p className="mt-1 text-xs text-danger">{errors.team[index].role.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`team.${index}.position`} className="mb-1 block text-xs font-medium text-content-secondary">
                        Cargo
                      </label>
                      <input
                        id={`team.${index}.position`}
                        type="text"
                        className="input"
                        placeholder="Cargo (opcional)"
                        {...register(`team.${index}.position`)}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label htmlFor={`team.${index}.email`} className="mb-1 block text-xs font-medium text-content-secondary">
                          Correo
                        </label>
                        <input
                          id={`team.${index}.email`}
                          type="email"
                          className="input"
                          placeholder="correo@empresa.com"
                          aria-invalid={errors.team?.[index]?.email ? 'true' : 'false'}
                          {...register(`team.${index}.email`, {
                            pattern: { value: PROJECT_FORM_RULES.EMAIL_PATTERN, message: 'Ese correo no parece válido' },
                          })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                        aria-label="Quitar integrante"
                        className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-danger transition-colors duration-fast hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {errors.team?.[index]?.email && (
                      <p className="-mt-2 text-xs text-danger sm:col-span-2 lg:col-span-4">
                        {errors.team[index].email.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <datalist id="new-project-common-roles">
              {COMMON_TEAM_ROLES.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-line-subtle pt-6">
          <GradientButton type="button" variant="ghost" to="/projects">
            Cancelar
          </GradientButton>
          <GradientButton type="submit" variant="solid" loading={busy} disabled={busy}>
            {busy ? 'Creando proyecto…' : 'Crear proyecto'}
          </GradientButton>
        </div>
      </form>
    </div>
  );
};

export default NewProjectForm;
