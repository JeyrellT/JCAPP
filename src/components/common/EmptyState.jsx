import { Inbox, SearchX, AlertTriangle, Compass } from 'lucide-react';

// Copy y estilo por defecto de cada variante. Todo sobrescribible por props.
const VARIANTS = {
  'sin-datos': {
    Icon: Inbox,
    title: 'Aún no hay nada aquí',
    description: '',
    circle: 'bg-surface-sunken text-content-muted',
  },
  'sin-resultados': {
    Icon: SearchX,
    title: 'Ningún resultado coincide',
    description: 'Prueba con otros filtros o limpia la búsqueda.',
    circle: 'bg-surface-sunken text-content-muted',
  },
  error: {
    Icon: AlertTriangle,
    title: 'No se pudo cargar',
    description: 'Vuelve a intentarlo en un momento.',
    circle: 'bg-danger-soft text-danger-on',
  },
  'no-encontrado': {
    Icon: Compass,
    title: 'No encontrado',
    description: 'La ruta que buscas no existe o fue movida.',
    circle: 'bg-warning-soft text-warning-on',
  },
};

const SIZE_STYLES = {
  md: { padding: 'py-12 px-6', circle: 'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', icon: 20 },
  sm: { padding: 'py-8 px-4', circle: 'mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full', icon: 18 },
};

/**
 * Estado vacío reutilizable: sustituye listas en blanco por un mensaje claro
 * y una acción (cuando aplica). Presentacional puro: sin acceso a contexto,
 * sin router propio (el consumidor pasa `action`/`secondaryAction` ya armados,
 * normalmente un `GradientButton`).
 *
 * @param {Object} props
 * @param {'sin-datos'|'sin-resultados'|'error'|'no-encontrado'} [props.variant='sin-datos']
 * @param {string} [props.title] - Sobrescribe el título por defecto de la variante.
 * @param {React.ReactNode} [props.description] - Sobrescribe la descripción por defecto.
 * @param {React.ComponentType} [props.icon] - Componente de icono lucide-react;
 *   sobrescribe el icono por defecto de la variante.
 * @param {React.ReactNode} [props.action] - Nodo de acción primaria (ej. un GradientButton).
 * @param {React.ReactNode} [props.secondaryAction] - Nodo de acción secundaria.
 * @param {'sm'|'md'} [props.size='md']
 * @param {string} [props.className]
 */
export default function EmptyState({
  variant = 'sin-datos',
  title,
  description,
  icon,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}) {
  const v = VARIANTS[variant] || VARIANTS['sin-datos'];
  const Icon = icon || v.Icon;
  const s = SIZE_STYLES[size] || SIZE_STYLES.md;
  const resolvedDescription = description !== undefined ? description : v.description;

  return (
    <div className={`rounded-xl border border-line bg-surface text-center ${s.padding} ${className}`}>
      <div className={`${s.circle} ${v.circle}`}>
        <Icon size={s.icon} aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-content">{title || v.title}</h3>
      {resolvedDescription ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-content-secondary">{resolvedDescription}</p>
      ) : null}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
