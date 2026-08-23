/**
 * PageHeader.jsx
 * ---------------------------------------------------------------------------
 * Cabecera de página consistente. Es la única fuente de la <h1> de cada
 * página — ningún otro componente debe declarar una <h1> propia.
 *
 * Renderiza `breadcrumbs` internamente a través de `<Breadcrumbs/>`: los
 * consumidores pasan el array, nunca montan `Breadcrumbs` por separado.
 * Usa `backTo` o `breadcrumbs`, nunca ambos a la vez.
 *
 * Puramente presentacional: sin acceso a contexto, sin lógica de datos,
 * sin animación propia (MainLayout ya anima la transición de página).
 * ---------------------------------------------------------------------------
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';

/**
 * @param {Object} props
 * @param {string} props.title - Título de la página. Obligatorio, se renderiza como <h1>.
 * @param {React.ReactNode} [props.description] - Texto o nodo bajo el título.
 * @param {string} [props.eyebrow] - Etiqueta corta encima del título (`.section-label`).
 * @param {React.ReactNode} [props.icon] - Icono a la izquierda del título.
 * @param {Array<{label: string, to?: string}>} [props.breadcrumbs] - Ruta de navegación,
 *   renderizada arriba del título vía <Breadcrumbs/>. No usar junto con `backTo`.
 * @param {React.ReactNode} [props.meta] - Fila de badges/metadatos bajo el título.
 * @param {React.ReactNode} [props.actions] - Acciones alineadas a la derecha (desktop).
 * @param {string} [props.backTo] - Ruta de retroceso. No usar junto con `breadcrumbs`.
 * @param {string} [props.backLabel='Volver']
 * @param {boolean} [props.divider=true] - Muestra el separador inferior.
 * @param {string} [props.className='']
 */
const PageHeader = ({
  title,
  description,
  eyebrow,
  icon,
  breadcrumbs,
  meta,
  actions,
  backTo,
  backLabel = 'Volver',
  divider = true,
  className = '',
}) => {
  return (
    <header className={className}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-3">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      )}

      {backTo && (
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1.5 rounded text-sm font-medium text-content-secondary transition-colors duration-fast hover:text-content"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="section-label mb-1">{eyebrow}</p>}

          <div className="flex items-start gap-3">
            {icon && (
              <span className="mt-0.5 shrink-0 rounded-lg bg-surface-sunken p-2 text-content-secondary">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">{title}</h1>
              {description && (
                <p className="mt-1 max-w-prose text-sm text-content-secondary">{description}</p>
              )}
            </div>
          </div>

          {meta && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-content-secondary">{meta}</div>
          )}
        </div>

        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
      </div>

      {divider && <div className="mt-6 border-b border-line-subtle" />}
    </header>
  );
};

export default PageHeader;
