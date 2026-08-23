/**
 * Breadcrumbs.jsx
 * ---------------------------------------------------------------------------
 * Ruta de navegación jerárquica. Renderizada normalmente por `PageHeader`
 * (a través de su prop `breadcrumbs`) — no se monta por separado en las
 * páginas que ya usan PageHeader.
 *
 * El truncado en pantallas angostas es puro CSS (`hidden sm:flex` en los
 * elementos intermedios cuando hay más de 3): no hay lógica de resize ni
 * medición en JS.
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array<{label: string, to?: string}>} props.items - Ruta, de raíz a hoja.
 *   El último elemento siempre se renderiza como texto (aunque traiga `to`).
 * @param {string} [props.className='']
 */
const Breadcrumbs = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  const lastIndex = items.length - 1;
  const hasOverflow = items.length > 3;
  // Elementos intermedios (ni primero ni último) que se ocultan en <sm cuando hay overflow.
  const hiddenLabels = hasOverflow ? items.slice(1, lastIndex).map((i) => i.label) : [];

  return (
    <nav aria-label="Ruta de navegación" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-content-muted">
        {items.map((item, index) => {
          const isLast = index === lastIndex;
          // Solo se ocultan en <sm los elementos intermedios cuando hay overflow.
          const isCollapsible = hasOverflow && index > 0 && index < lastIndex;

          return (
            <li
              key={`${item.label}-${index}`}
              className={`flex items-center gap-1.5 ${isCollapsible ? 'hidden sm:flex' : 'flex'}`}
            >
              {index > 0 && <ChevronRight size={14} aria-hidden="true" className="shrink-0 text-content-muted/70" />}
              {isLast ? (
                <span aria-current="page" className="max-w-[22ch] truncate font-medium text-content">
                  {item.label}
                </span>
              ) : item.to ? (
                <Link
                  to={item.to}
                  className="max-w-[22ch] truncate rounded py-1 -my-1 transition-colors duration-fast hover:text-content"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="max-w-[22ch] truncate">{item.label}</span>
              )}
            </li>
          );
        })}
        {hasOverflow && (
          <li className="flex items-center gap-1.5 sm:hidden" aria-hidden="true">
            <ChevronRight size={14} className="shrink-0 text-content-muted/70" />
            <span title={hiddenLabels.join(' / ')} className="text-content-muted">
              …
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
