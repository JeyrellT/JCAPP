import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { PHASE_ORDER, formatPhase, normalizePhase, PROJECT_STATUS } from '../../lib/phases';
import GradientButton from '../common/GradientButton';
import Notification from '../common/Notification';
import { SkeletonText } from '../common/Skeleton';
import { PROJECT_FORM_RULES, COMMON_TEAM_ROLES } from './NewProjectForm';

const EMPTY_MEMBER = { id: '', name: '', role: '', position: '', email: '' };

/**
 * Avance del proyecto derivado de su plan de herramientas (fórmula 0.4.1).
 * Nunca se expone como campo editable: se recalcula al guardar para que
 * `project.progress` (que HomePage lee directo) no quede desincronizado.
 */
function derivedProgress(project) {
  const planned = Object.keys(project?.tools || {});
  const done = planned.filter((id) => project.tools[id].status === 'completed').length;
  return planned.length ? Math.round((done / planned.length) * 100) : 0;
}

/**
 * Formulario de edición de proyecto. Vive dentro de un `<Modal size="lg">`
 * montado por ProjectDetailsPage: no controla su propia apertura/cierre, no
 * lleva cabecera ni ancho propios (los pone el Modal).
 *
 * @param {Object} props
 * @param {string} props.projectId - ID del proyecto a editar.
 * @param {Function} [props.onCancel] - Se llama al cancelar.
 * @param {Function} [props.onSave] - Se llama tras guardar con éxito.
 */
const EditProjectForm = ({ projectId, onCancel, onSave }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const [submitError, setSubmitError] = useState('');
  const [notice, setNotice] = useState({ show: false, message: '' });
  const [closing, setClosing] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      description: '',
      company: '',
      status: 'active',
      phase: 'Define',
      startDate: '',
      endDate: '',
      team: [EMPTY_MEMBER],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'team' });

  // Precarga el formulario en cuanto el proyecto resuelve del contexto.
  useEffect(() => {
    if (!project) return;
    reset({
      name: project.name || '',
      description: project.description || '',
      company: project.company || '',
      status: project.status || 'active',
      phase: normalizePhase(project.phase) || 'Define',
      startDate: project.startDate ? String(project.startDate).split('T')[0] : '',
      endDate: project.endDate ? String(project.endDate).split('T')[0] : '',
      team:
        project.team && project.team.length > 0
          ? project.team.map((m) => ({
              id: m.id || '',
              name: m.name || '',
              role: m.role || '',
              position: m.position || '',
              email: m.email || '',
            }))
          : [EMPTY_MEMBER],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const startDate = watch('startDate');
  const descriptionValue = watch('description') || '';
  const errorList = Object.values(errors);

  const onSubmit = async (data) => {
    setSubmitError('');

    const team = data.team.map((member, i) => ({
      id: member.id || `team-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name: member.name.trim(),
      role: member.role.trim(),
      position: member.position?.trim() || '',
      email: member.email?.trim() || '',
    }));

    try {
      updateProject(projectId, {
        name: data.name.trim(),
        description: data.description.trim(),
        status: data.status,
        phase: data.phase,
        startDate: data.startDate,
        endDate: data.endDate,
        company: data.company.trim(),
        team,
        progress: derivedProgress(project),
      });
      setNotice({ show: true, message: 'Cambios guardados' });
      setClosing(true);
      window.setTimeout(() => onSave?.(), 700);
    } catch (error) {
      console.error('[EditProjectForm] error al actualizar proyecto', error);
      setSubmitError('No se pudieron guardar los cambios. Intenta de nuevo.');
    }
  };

  if (!project) {
    return (
      <div role="status" aria-busy="true" className="p-2">
        <span className="sr-only">Cargando…</span>
        <SkeletonText lines={4} />
      </div>
    );
  }

  const busy = isSubmitting || closing;

  return (
    <div>
      <Notification
        message={notice.message}
        type="success"
        show={notice.show}
        onClose={() => setNotice({ show: false, message: '' })}
        duration={1500}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="edit-name" className="mb-1 block text-sm font-medium text-content-secondary">
                Nombre del proyecto <span className="text-danger">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                className="input"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'edit-name-error' : undefined}
                {...register('name', {
                  required: 'El proyecto necesita un nombre',
                  maxLength: {
                    value: PROJECT_FORM_RULES.NAME_MAX_LENGTH,
                    message: `El nombre no puede exceder ${PROJECT_FORM_RULES.NAME_MAX_LENGTH} caracteres`,
                  },
                })}
              />
              {errors.name && <p id="edit-name-error" className="mt-1 text-sm text-danger">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="edit-company" className="mb-1 block text-sm font-medium text-content-secondary">
                Empresa <span className="text-danger">*</span>
              </label>
              <input
                id="edit-company"
                type="text"
                className="input"
                aria-invalid={errors.company ? 'true' : 'false'}
                aria-describedby={errors.company ? 'edit-company-error' : undefined}
                {...register('company', {
                  required: 'Indica la empresa para poder agrupar tus proyectos',
                  maxLength: {
                    value: PROJECT_FORM_RULES.COMPANY_MAX_LENGTH,
                    message: `La empresa no puede exceder ${PROJECT_FORM_RULES.COMPANY_MAX_LENGTH} caracteres`,
                  },
                })}
              />
              {errors.company && (
                <p id="edit-company-error" className="mt-1 text-sm text-danger">{errors.company.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 flex items-baseline justify-between">
                <label htmlFor="edit-description" className="block text-sm font-medium text-content-secondary">
                  Descripción <span className="text-danger">*</span>
                </label>
                <span className="text-xs text-content-muted">
                  {descriptionValue.length}/{PROJECT_FORM_RULES.DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id="edit-description"
                rows={4}
                className="input"
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'edit-description-error' : undefined}
                {...register('description', {
                  required: 'Describe el objetivo del proyecto',
                  maxLength: {
                    value: PROJECT_FORM_RULES.DESCRIPTION_MAX_LENGTH,
                    message: `La descripción no puede exceder ${PROJECT_FORM_RULES.DESCRIPTION_MAX_LENGTH} caracteres`,
                  },
                })}
              />
              {errors.description && (
                <p id="edit-description-error" className="mt-1 text-sm text-danger">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-status" className="mb-1 block text-sm font-medium text-content-secondary">
                Estado
              </label>
              <select id="edit-status" className="input" {...register('status')}>
                {Object.entries(PROJECT_STATUS).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-phase" className="mb-1 block text-sm font-medium text-content-secondary">
                Fase DMAIC
              </label>
              <select id="edit-phase" className="input" {...register('phase')}>
                {PHASE_ORDER.map((phase) => (
                  <option key={phase} value={phase}>{formatPhase(phase)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-startDate" className="mb-1 block text-sm font-medium text-content-secondary">
                Fecha de inicio <span className="text-danger">*</span>
              </label>
              <input
                id="edit-startDate"
                type="date"
                className="input"
                aria-invalid={errors.startDate ? 'true' : 'false'}
                aria-describedby={errors.startDate ? 'edit-startDate-error' : undefined}
                {...register('startDate', { required: 'La fecha de inicio es requerida' })}
              />
              {errors.startDate && (
                <p id="edit-startDate-error" className="mt-1 text-sm text-danger">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="edit-endDate" className="mb-1 block text-sm font-medium text-content-secondary">
                Fecha de fin <span className="text-danger">*</span>
              </label>
              <input
                id="edit-endDate"
                type="date"
                className="input"
                aria-invalid={errors.endDate ? 'true' : 'false'}
                aria-describedby={errors.endDate ? 'edit-endDate-error' : undefined}
                {...register('endDate', {
                  required: 'La fecha de fin es requerida',
                  validate: (value) =>
                    !startDate || !value || value >= startDate || 'La fecha de fin no puede ser anterior al inicio',
                })}
              />
              {errors.endDate && (
                <p id="edit-endDate-error" className="mt-1 text-sm text-danger">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-content">Equipo del proyecto</h3>
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

            <div className="mt-3 space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-line bg-surface-sunken/40 p-4">
                  <input type="hidden" {...register(`team.${index}.id`)} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label htmlFor={`edit-team.${index}.name`} className="mb-1 block text-xs font-medium text-content-secondary">
                        Nombre <span className="text-danger">*</span>
                      </label>
                      <input
                        id={`edit-team.${index}.name`}
                        type="text"
                        className="input"
                        aria-invalid={errors.team?.[index]?.name ? 'true' : 'false'}
                        {...register(`team.${index}.name`, { required: 'Falta el nombre de este integrante' })}
                      />
                      {errors.team?.[index]?.name && (
                        <p className="mt-1 text-xs text-danger">{errors.team[index].name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`edit-team.${index}.role`} className="mb-1 block text-xs font-medium text-content-secondary">
                        Rol <span className="text-danger">*</span>
                      </label>
                      <input
                        id={`edit-team.${index}.role`}
                        type="text"
                        className="input"
                        list="edit-project-common-roles"
                        aria-invalid={errors.team?.[index]?.role ? 'true' : 'false'}
                        {...register(`team.${index}.role`, { required: 'Falta el rol de este integrante' })}
                      />
                      {errors.team?.[index]?.role && (
                        <p className="mt-1 text-xs text-danger">{errors.team[index].role.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`edit-team.${index}.position`} className="mb-1 block text-xs font-medium text-content-secondary">
                        Cargo
                      </label>
                      <input
                        id={`edit-team.${index}.position`}
                        type="text"
                        className="input"
                        {...register(`team.${index}.position`)}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label htmlFor={`edit-team.${index}.email`} className="mb-1 block text-xs font-medium text-content-secondary">
                          Correo
                        </label>
                        <input
                          id={`edit-team.${index}.email`}
                          type="email"
                          className="input"
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
            <datalist id="edit-project-common-roles">
              {COMMON_TEAM_ROLES.map((role) => (
                <option key={role} value={role} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-line-subtle pt-6">
          <GradientButton type="button" variant="ghost" onClick={() => onCancel?.()} disabled={busy}>
            Cancelar
          </GradientButton>
          <GradientButton type="submit" variant="solid" loading={busy} disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </GradientButton>
        </div>
      </form>
    </div>
  );
};

export default EditProjectForm;
