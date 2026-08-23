/**
 * PageContainer.jsx
 * ---------------------------------------------------------------------------
 * Contenedor de contenido de página. NO controla el ancho ni el padding
 * horizontal del shell (eso ya lo hace `MainLayout`, ver
 * `mx-auto w-full max-w-page px-4 py-8 sm:px-6 lg:px-8` en su <main>), y NO
 * anima nada (MainLayout ya envuelve <Outlet/> en un motion.div con
 * `pageTransition`). Su única responsabilidad es dar un ancho local opcional
 * (formularios, páginas angostas) y un espaciado vertical consistente entre
 * las secciones de una página.
 * ---------------------------------------------------------------------------
 */

const WIDTH = {
  page: '',
  form: 'mx-auto w-full max-w-form',
  narrow: 'mx-auto w-full max-w-[720px]',
  full: 'w-full',
};

const GAP = {
  none: '',
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
};

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'page'|'form'|'narrow'|'full'} [props.width='page'] - Ancho local del
 *   contenido. 'page' hereda el ancho que ya aplica MainLayout (caso por defecto).
 * @param {'none'|'sm'|'md'|'lg'} [props.gap='md'] - Espaciado vertical entre secciones hijas.
 * @param {React.ElementType} [props.as='div'] - Elemento raíz a renderizar.
 * @param {string} [props.className='']
 */
const PageContainer = ({ children, width = 'page', gap = 'md', as: Tag = 'div', className = '' }) => {
  const widthClass = WIDTH[width] ?? WIDTH.page;
  const gapClass = GAP[gap] ?? GAP.md;
  const classes = [widthClass, gapClass, className].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
};

export default PageContainer;
