// Mapa literal de radios: Tailwind no detecta clases construidas dinámicamente.
const ROUNDED = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

/**
 * Bloque de carga base. Presentacional puro, siempre `aria-hidden` (el
 * contenedor de carga de la página es quien lleva `role="status" aria-busy="true"`
 * y un `<span className="sr-only">`, no este bloque).
 *
 * @param {Object} props
 * @param {'sm'|'md'|'lg'|'xl'|'full'} [props.rounded='md']
 * @param {string} [props.className] - Controla ancho y alto (p. ej. "h-4 w-24").
 */
export default function Skeleton({ className = '', rounded = 'md' }) {
  return <div aria-hidden="true" className={`animate-pulse bg-surface-sunken ${ROUNDED[rounded] || ROUNDED.md} ${className}`} />;
}

/**
 * n líneas de texto en carga, la última al 60% de ancho.
 *
 * @param {Object} props
 * @param {number} [props.lines=3]
 * @param {string} [props.className]
 */
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  );
}

/**
 * Silueta de carga de `ProjectCard`: fila de badges, barra de título, dos
 * líneas de texto, barra de progreso y pie de tarjeta.
 *
 * @param {Object} props
 * @param {string} [props.className]
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div aria-hidden="true" className={`card overflow-hidden ${className}`}>
      <Skeleton rounded="sm" className="h-0.5 w-full" />
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Skeleton rounded="full" className="h-5 w-16" />
          <Skeleton rounded="full" className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-4/5" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <Skeleton className="h-1.5 w-full" rounded="full" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Silueta de carga de `StatCard`: título, valor grande, descripción e icono.
 *
 * @param {Object} props
 * @param {string} [props.className]
 */
export function SkeletonStat({ className = '' }) {
  return (
    <div aria-hidden="true" className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="w-2/3 space-y-2.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton rounded="full" className="h-11 w-11 shrink-0" />
      </div>
    </div>
  );
}

/**
 * Silueta de carga de tabla: cabecera + filas de celdas.
 *
 * @param {Object} props
 * @param {number} [props.rows=5]
 * @param {number} [props.cols=4]
 * @param {string} [props.className]
 */
export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div aria-hidden="true" className={`overflow-hidden rounded-xl border border-line ${className}`}>
      <div className="flex gap-4 border-b border-line bg-surface-sunken/60 px-4 py-3">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-3.5 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-line-subtle">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
