import { useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  AlertTriangle,
  Target,
  ClipboardList,
  Users,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  Undo2,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import useToolData from '../hooks/useToolData';
import GradientButton from '../components/common/GradientButton';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/ui/Modal';
import { SkeletonText } from '../components/common/Skeleton';
import { formatRelative } from '../lib/format';
import { transition, fadeInUp } from '../lib/motion';

const TOOL_ID = 'project-charter';

// Forma canónica: la que siembra src/data/projects.js y la que lee
// src/utils/export.js. El estado local se alinea a ella, no al revés.
const DEFAULT_DATA = {
  businessCase: '',
  problemStatement: '',
  scope: '',
  goals: '',
};

const FIELDS = [
  {
    key: 'businessCase',
    label: 'Caso de negocio',
    icon: Briefcase,
    placeholder: 'Describe el contexto empresarial y por qué este proyecto importa: costos, riesgos, oportunidad perdida…',
    helper: 'Contexto y magnitud del problema en términos de negocio.',
  },
  {
    key: 'problemStatement',
    label: 'Declaración del problema',
    icon: AlertTriangle,
    placeholder: 'Qué está pasando, desde cuándo, qué tan grande es la brecha frente al estándar esperado…',
    helper: 'Un enunciado específico, medible y sin culpar a nadie.',
  },
  {
    key: 'scope',
    label: 'Alcance',
    icon: ClipboardList,
    placeholder: 'Qué procesos, áreas o etapas incluye el proyecto, y qué queda explícitamente fuera…',
    helper: 'Delimita dónde empieza y dónde termina el esfuerzo.',
  },
  {
    key: 'goals',
    label: 'Metas',
    icon: Target,
    placeholder: 'Objetivos medibles con línea base y meta: reducir X de A a B, aumentar Y a Z%…',
    helper: 'Metas cuantificables que autorizan y cierran el proyecto.',
  },
];

/** Máquina de estados de guardado — textos e iconos estándar del ciclo. */
function SaveStatus({ tool }) {
  const { isDirty, isSaving, justSaved, lastSavedAt, error } = tool;

  let icon = <span className="h-2 w-2 rounded-full bg-content-muted" aria-hidden="true" />;
  let text = 'Sin cambios';
  let tone = 'text-content-muted';

  if (error) {
    icon = <AlertCircle size={14} aria-hidden="true" />;
    text = 'No se pudo guardar';
    tone = 'text-danger-on';
  } else if (isSaving) {
    icon = <Loader2 size={14} className="animate-spin" aria-hidden="true" />;
    text = 'Guardando cambios…';
    tone = 'text-content-secondary';
  } else if (justSaved) {
    icon = <Check size={14} aria-hidden="true" />;
    text = 'Guardado';
    tone = 'text-success-on';
  } else if (isDirty) {
    icon = <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />;
    text = 'Cambios sin guardar';
    tone = 'text-warning-on';
  } else if (lastSavedAt) {
    icon = <Check size={14} aria-hidden="true" />;
    text = `Guardado ${formatRelative(lastSavedAt)}`;
    tone = 'text-success-on';
  }

  return (
    <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm tabular-nums ${tone}`}>
      {icon}
      <span>{text}</span>
      {error && (
        <button type="button" onClick={() => tool.save()} className="ml-1 font-semibold underline underline-offset-2">
          Reintentar
        </button>
      )}
    </p>
  );
}

const ProjectCharter = ({ projectId }) => {
  const shouldReduceMotion = useReducedMotion();
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA);

  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmExample, setConfirmExample] = useState(false);
  const [exampleModalOpen, setExampleModalOpen] = useState(false);
  const [exampleMode, setExampleMode] = useState(false);
  const snapshotRef = useRef(null);

  const activeExample = useMemo(
    () => (exampleMode ? t.exampleTitles[snapshotRef.current?.index ?? 0] : null),
    [exampleMode, t.exampleTitles]
  );

  if (!t.ready) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <SkeletonText lines={4} />
      </div>
    );
  }

  const project = t.project;

  const openExamplePicker = () => {
    if (t.isDirty) {
      setConfirmExample(true);
      return;
    }
    if (t.hasExamples && t.examples.length > 1) {
      setExampleModalOpen(true);
    } else {
      applyExample(0);
    }
  };

  const applyExample = (index) => {
    snapshotRef.current = { data: t.data, index };
    t.loadExample(index);
    setExampleMode(true);
    setExampleModalOpen(false);
    setConfirmExample(false);
  };

  const adoptExample = () => {
    t.save();
    setExampleMode(false);
    snapshotRef.current = null;
  };

  const undoExample = () => {
    if (snapshotRef.current) {
      t.setData(snapshotRef.current.data);
    }
    setExampleMode(false);
    snapshotRef.current = null;
  };

  const requestCancel = () => setConfirmDiscard(true);
  const confirmCancel = () => {
    t.discard();
    setConfirmDiscard(false);
  };

  const isEmpty = !t.data.businessCase && !t.data.problemStatement && !t.data.scope && !t.data.goals;

  return (
    <div className="p-4 sm:p-6">
      {/* Barra de estado y acciones */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <SaveStatus tool={t} />
        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && !exampleMode && (
            <GradientButton variant="outline" size="sm" leadingIcon={<Eye size={14} />} onClick={openExamplePicker}>
              Ver un ejemplo
            </GradientButton>
          )}
          {t.isDirty && (
            <GradientButton variant="ghost" size="sm" onClick={requestCancel}>
              Cancelar
            </GradientButton>
          )}
          <GradientButton
            variant="success"
            size="sm"
            disabled={!t.isDirty || t.isSaving}
            loading={t.isSaving}
            onClick={() => t.save()}
          >
            Guardar
          </GradientButton>
        </div>
      </div>

      {/* Banner de modo ejemplo */}
      {exampleMode && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.enter}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-info/20 px-2 py-0.5 text-xs font-semibold text-info-on">
              Ejemplo
            </span>
            <span className="font-medium text-content">{activeExample}</span>
            <span className="text-content-secondary">
              — Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GradientButton variant="outline" size="sm" leadingIcon={<Undo2 size={14} />} onClick={undoExample}>
              Deshacer
            </GradientButton>
            <GradientButton variant="solid" size="sm" onClick={adoptExample}>
              Usar como punto de partida
            </GradientButton>
          </div>
        </motion.div>
      )}

      {isEmpty && !exampleMode ? (
        <EmptyState
          title="Todo proyecto empieza con un charter"
          description="Define el caso de negocio, el problema y las metas que autorizan este esfuerzo."
          action={
            <GradientButton onClick={() => document.getElementById('businessCase')?.focus()}>
              Redactar caso de negocio
            </GradientButton>
          }
          secondaryAction={
            t.hasExamples && (
              <GradientButton variant="outline" onClick={openExamplePicker}>
                Ver un ejemplo
              </GradientButton>
            )
          }
        />
      ) : (
        <motion.div
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="visible"
          variants={fadeInUp}
          className="space-y-6"
        >
          {project?.team?.length > 0 && (
            <div className="rounded-lg border border-line bg-surface-sunken p-4">
              <div className="mb-2 flex items-center gap-2">
                <Users size={16} className="text-content-muted" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-content">Equipo del proyecto</h3>
              </div>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-content-secondary sm:grid-cols-2">
                {project.team.map((member) => (
                  <li key={member.id || member.name}>
                    <span className="font-medium text-content">{member.role}:</span> {member.name}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-content-muted">
                El equipo se administra desde la ficha del proyecto, no desde este charter.
              </p>
            </div>
          )}

          {FIELDS.map(({ key, label, icon: Icon, placeholder, helper }) => (
            <div key={key} className="rounded-lg border border-line bg-surface p-4 sm:p-5">
              <label htmlFor={key} className="mb-1 flex items-center gap-2 text-sm font-semibold text-content">
                <Icon size={16} className="text-content-muted" aria-hidden="true" />
                {label}
              </label>
              <p className="mb-2 text-xs text-content-muted">{helper}</p>
              <textarea
                id={key}
                value={t.data[key] ?? ''}
                onChange={(e) => t.patch({ [key]: e.target.value })}
                placeholder={placeholder}
                rows={4}
                className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          ))}
        </motion.div>
      )}

      {/* Selector de ejemplo (2 casos de negocio distintos) */}
      <Modal
        open={exampleModalOpen}
        onClose={() => setExampleModalOpen(false)}
        title="Elige un ejemplo"
        size="md"
      >
        <div className="space-y-2">
          {t.examples.map((example, index) => (
            <button
              key={example.title || index}
              type="button"
              onClick={() => applyExample(index)}
              className="w-full rounded-lg border border-line bg-surface p-3 text-left transition-colors duration-fast hover:border-line-strong hover:bg-surface-sunken"
            >
              <p className="text-sm font-semibold text-content">{example.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-content-secondary">{example.businessCase}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Confirmar carga de ejemplo con borrador sucio */}
      <Modal
        open={confirmExample}
        onClose={() => setConfirmExample(false)}
        title="¿Cargar el ejemplo?"
        description="Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar."
        size="sm"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmExample(false)}>
              Cancelar
            </GradientButton>
            <GradientButton
              variant="solid"
              onClick={() => {
                if (t.hasExamples && t.examples.length > 1) {
                  setConfirmExample(false);
                  setExampleModalOpen(true);
                } else {
                  applyExample(0);
                }
              }}
            >
              Ver el ejemplo
            </GradientButton>
          </>
        }
      />

      {/* Confirmar descarte de cambios sin guardar */}
      <Modal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="¿Descartar los cambios sin guardar?"
        size="sm"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmDiscard(false)}>
              Seguir editando
            </GradientButton>
            <GradientButton variant="danger" onClick={confirmCancel}>
              Descartar
            </GradientButton>
          </>
        }
      />
    </div>
  );
};

export default ProjectCharter;
