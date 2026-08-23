import { getStatusToken, getToolStatusToken } from '../../lib/phases';

// Tamaños del badge: clases literales, nunca interpoladas. Coincide con PhaseBadge.
const SIZE_STYLES = {
  xs: 'px-1.5 py-0.5 text-2xs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

const DOT_SIZE = 'h-1.5 w-1.5 rounded-full';

/**
 * Badge de estado (de proyecto o de herramienta). La etiqueta y los colores
 * salen siempre de `src/lib/phases.js` (`getStatusToken`/`getToolStatusToken`);
 * este componente nunca traduce ni redeclara estados por su cuenta.
 *
 * @param {Object} props
 * @param {string} [props.status] - Valor crudo de estado. Si no matchea ningún
 *   estado conocido, cae al fallback de la lib ("Sin estado"); nunca revienta.
 * @param {'project'|'tool'} [props.kind='project'] - Decide qué mapa de la lib usar:
 *   `getStatusToken` (PROJECT_STATUS) o `getToolStatusToken` (TOOL_STATUS).
 * @param {'xs'|'sm'|'md'} [props.size='sm']
 * @param {boolean} [props.withDot=true] - Muestra el punto de color antes del texto.
 * @param {string} [props.className]
 */
export default function StatusBadge({ status, kind = 'project', size = 'sm', withDot = true, className = '' }) {
  const t = kind === 'tool' ? getToolStatusToken(status) : getStatusToken(status);
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.sm;

  return (
    <span className={`badge ${sizeClass} ${t.bg} ${t.text} ${className}`}>
      {withDot && <span className={`${DOT_SIZE} ${t.dot}`} aria-hidden="true" />}
      {t.label}
    </span>
  );
}
