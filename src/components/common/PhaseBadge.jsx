import { getPhaseToken } from '../../lib/phases';

// Tamaños del badge: clases literales, nunca interpoladas.
const SIZE_STYLES = {
  xs: 'px-1.5 py-0.5 text-2xs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

// Solo el tamaño de texto, para el variant 'dot' (sin padding de badge).
const TEXT_SIZE_STYLES = {
  xs: 'text-2xs',
  sm: 'text-xs',
  md: 'text-sm',
};

// Tamaños del cuadro cuando showLabel=false (solo la letra D/M/A/I/C).
const LETTER_SIZE_STYLES = {
  xs: 'h-4 w-4 text-2xs',
  sm: 'h-5 w-5 text-xs',
  md: 'h-6 w-6 text-sm',
};

const DOT_SIZE = 'h-1.5 w-1.5 rounded-full';

/**
 * Badge de fase DMAIC. Consume exclusivamente los tokens de
 * `src/lib/phases.js` (`getPhaseToken`) — no declara ningún color propio.
 *
 * @param {Object} props
 * @param {string} [props.phase] - Valor crudo de fase ('Define', 'measure', etc.).
 *   Un valor nulo o desconocido cae al fallback de la lib ("Sin fase"); nunca revienta.
 * @param {'soft'|'solid'|'outline'|'dot'} [props.variant='soft']
 * @param {'xs'|'sm'|'md'} [props.size='sm']
 * @param {boolean} [props.showLabel=true] - Si es false, renderiza solo la letra
 *   de la fase (D/M/A/I/C) en un cuadro cuadrado, con `aria-label` accesible.
 * @param {string} [props.className]
 */
export default function PhaseBadge({ phase, variant = 'soft', size = 'sm', showLabel = true, className = '' }) {
  const t = getPhaseToken(phase);
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.sm;

  if (!showLabel) {
    const letterSize = LETTER_SIZE_STYLES[size] || LETTER_SIZE_STYLES.sm;
    let variantClass = `${t.bg} ${t.text}`;
    if (variant === 'solid') variantClass = `${t.solid} text-white`;
    else if (variant === 'outline') variantClass = `border ${t.border} text-content bg-transparent`;
    return (
      <span
        role="img"
        aria-label={t.label}
        title={t.desc}
        className={`inline-flex items-center justify-center rounded-md font-semibold ${letterSize} ${variantClass} ${className}`}
      >
        {t.letter}
      </span>
    );
  }

  if (variant === 'dot') {
    const textSize = TEXT_SIZE_STYLES[size] || TEXT_SIZE_STYLES.sm;
    return (
      <span title={t.desc} className={`inline-flex items-center gap-1.5 text-content ${textSize} ${className}`}>
        <span className={`${DOT_SIZE} ${t.dot}`} aria-hidden="true" />
        {t.label}
      </span>
    );
  }

  let variantClass = `${t.bg} ${t.text}`;
  if (variant === 'solid') variantClass = `${t.solid} text-white`;
  else if (variant === 'outline') variantClass = `border ${t.border} text-content bg-transparent`;

  return (
    <span title={t.desc} className={`badge ${sizeClass} ${variantClass} ${className}`}>
      {t.label}
    </span>
  );
}
