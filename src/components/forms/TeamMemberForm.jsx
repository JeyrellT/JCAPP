import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import GradientButton from '../common/GradientButton';
import Notification from '../common/Notification';
import EmptyState from '../common/EmptyState';
import { PROJECT_FORM_RULES, COMMON_TEAM_ROLES } from './NewProjectForm';

const EMPTY_NEW_MEMBER = { name: '', role: '', position: '', email: '' };

/**
 * Gestor del equipo de un proyecto. Vive dentro de un `<Modal>` montado por
 * ProjectDetailsPage: no lleva cabecera ni overlay propios (el Modal los pone).
 *
 * @param {Object} props
 * @param {string} props.projectId - ID del proyecto.
 * @param {Function} [props.onClose] - Se llama al cerrar sin persistir cambios adicionales.
 * @param {Function} [props.onSave] - Se llama tras guardar, con el equipo resultante.
 */
const TeamMemberForm = ({ projectId, onClose, onSave }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);

  const [teamMembers, setTeamMembers] = useState(() => project?.team || []);
  const [newMember, setNewMember] = useState(EMPTY_NEW_MEMBER);
  const [formError, setFormError] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState({ show: false, message: '' });

  const handleAddMember = () => {
    const name = newMember.name.trim();
    const role = newMember.role.trim();

    if (!name || !role) {
      setFormError('Nombre y rol son obligatorios para añadir un integrante.');
      return;
    }
    if (newMember.email && !PROJECT_FORM_RULES.EMAIL_PATTERN.test(newMember.email.trim())) {
      setFormError('Ese correo no parece válido.');
      return;
    }

    const member = {
      id: `team-${Date.now()}`,
      name,
      role,
      position: newMember.position.trim(),
      email: newMember.email.trim(),
    };

    setTeamMembers((prev) => [...prev, member]);
    setNewMember(EMPTY_NEW_MEMBER);
    setFormError('');
    setNotice({ show: true, message: `${name} se unió al equipo` });
  };

  const handleUpdateMember = (id, field, value) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleRemoveMember = (id) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
    setConfirmRemoveId(null);
  };

  const handleSave = () => {
    setIsSaving(true);
    updateProject(projectId, { team: teamMembers });
    onSave?.(teamMembers);
    onClose?.();
  };

  if (!project) {
    return <p className="text-sm text-content-secondary">No se encontró el proyecto.</p>;
  }

  return (
    <div>
      <Notification
        message={notice.message}
        type="success"
        show={notice.show}
        onClose={() => setNotice({ show: false, message: '' })}
        duration={2000}
      />

      <div className="rounded-lg border border-line bg-surface-sunken/40 p-4">
        <h3 className="mb-3 text-sm font-medium text-content-secondary">Añadir nuevo miembro</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="new-member-name" className="sr-only">Nombre</label>
            <input
              id="new-member-name"
              type="text"
              className="input"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Nombre"
            />
          </div>
          <div>
            <label htmlFor="new-member-role" className="sr-only">Rol</label>
            <input
              id="new-member-role"
              type="text"
              className="input"
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              placeholder="Rol en el proyecto"
              list="team-form-common-roles"
            />
          </div>
          <div>
            <label htmlFor="new-member-position" className="sr-only">Cargo</label>
            <input
              id="new-member-position"
              type="text"
              className="input"
              value={newMember.position}
              onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
              placeholder="Cargo (opcional)"
            />
          </div>
          <div>
            <label htmlFor="new-member-email" className="sr-only">Correo</label>
            <input
              id="new-member-email"
              type="email"
              className="input"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              placeholder="Correo (opcional)"
            />
          </div>
        </div>
        <datalist id="team-form-common-roles">
          {COMMON_TEAM_ROLES.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>

        {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}

        <GradientButton
          type="button"
          variant="solid"
          size="sm"
          fullWidth
          className="mt-3"
          leadingIcon={<UserPlus size={16} />}
          onClick={handleAddMember}
          disabled={!newMember.name.trim() || !newMember.role.trim()}
        >
          Añadir miembro
        </GradientButton>
      </div>

      <div className="mt-5">
        {teamMembers.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="min-w-full divide-y divide-line-subtle">
              <thead className="bg-surface-sunken">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Nombre</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Rol</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Cargo</th>
                  <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-content-muted">Correo</th>
                  <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-content-muted">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle bg-surface">
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-2.5">
                      <label htmlFor={`member-name-${member.id}`} className="sr-only">Nombre de {member.name}</label>
                      <input
                        id={`member-name-${member.id}`}
                        type="text"
                        value={member.name}
                        onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                        className="w-full rounded-sm border-none bg-transparent px-1 py-1 text-sm text-content focus-visible:bg-surface-sunken"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <label htmlFor={`member-role-${member.id}`} className="sr-only">Rol de {member.name}</label>
                      <input
                        id={`member-role-${member.id}`}
                        type="text"
                        value={member.role}
                        onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}
                        list="team-form-common-roles"
                        className="w-full rounded-sm border-none bg-transparent px-1 py-1 text-sm text-content focus-visible:bg-surface-sunken"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <label htmlFor={`member-position-${member.id}`} className="sr-only">Cargo de {member.name}</label>
                      <input
                        id={`member-position-${member.id}`}
                        type="text"
                        value={member.position || ''}
                        onChange={(e) => handleUpdateMember(member.id, 'position', e.target.value)}
                        placeholder="Sin cargo"
                        className="w-full rounded-sm border-none bg-transparent px-1 py-1 text-sm text-content placeholder:text-content-muted focus-visible:bg-surface-sunken"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <label htmlFor={`member-email-${member.id}`} className="sr-only">Correo de {member.name}</label>
                      <input
                        id={`member-email-${member.id}`}
                        type="email"
                        value={member.email || ''}
                        onChange={(e) => handleUpdateMember(member.id, 'email', e.target.value)}
                        placeholder="Sin correo"
                        className="w-full rounded-sm border-none bg-transparent px-1 py-1 text-sm text-content placeholder:text-content-muted focus-visible:bg-surface-sunken"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {confirmRemoveId === member.id ? (
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          <span className="text-xs text-content-secondary">¿Quitar a {member.name}?</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white transition-colors duration-fast hover:bg-danger/90"
                          >
                            Quitar del equipo
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(null)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-content-secondary transition-colors duration-fast hover:bg-surface-sunken"
                          >
                            Mantener
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(member.id)}
                          aria-label={`Quitar a ${member.name} del equipo`}
                          className="rounded-md p-1.5 text-danger transition-colors duration-fast hover:bg-danger-soft"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            size="sm"
            variant="sin-datos"
            title="Aún no hay integrantes"
            description="Añade el primer miembro con el formulario de arriba."
          />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line-subtle pt-4">
        <p className="text-sm text-content-secondary">
          {teamMembers.length} {teamMembers.length === 1 ? 'miembro' : 'miembros'} en el equipo
        </p>
        <div className="flex gap-3">
          <GradientButton type="button" variant="ghost" onClick={() => onClose?.()}>
            Cancelar
          </GradientButton>
          <GradientButton type="button" variant="solid" loading={isSaving} onClick={handleSave}>
            Guardar cambios
          </GradientButton>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberForm;
