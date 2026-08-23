import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Versión "motion" de Link: react-router-dom Link reenvía ref y esparce el
// resto de props (className, style, aria-*) al <a> subyacente, por lo que
// framer-motion puede animarlo directamente sin un wrapper adicional.
const MotionLink = motion(Link);

/**
 * Botón del sistema de diseño de JC Analytic.
 *
 * Se renderiza como <Link> (si recibe `to`), <a> (si recibe `href`) o
 * <button> (por defecto). API pública estable: variant, to, href, size,
 * fullWidth, className, onClick, children, más las adiciones de este ciclo
 * (loading, disabled, leadingIcon, trailingIcon).
 *
 * @param {Object} props
 * @param {'solid'|'soft'|'outline'|'ghost'|'danger'|'gradient'|'success'|'warning'|'info'|'primary'|'secondary'} [props.variant='solid']
 *   'primary' y 'secondary' son alias heredados de 'solid' y 'outline' respectivamente
 *   (compatibilidad con los usos existentes en el código).
 * @param {string} [props.to] - Ruta interna (react-router-dom Link)
 * @param {string} [props.href] - URL externa (<a>)
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false] - Ocupa todo el ancho disponible
 * @param {boolean} [props.loading=false] - Muestra un spinner y bloquea la interacción
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.leadingIcon] - Icono antes del contenido
 * @param {React.ReactNode} [props.trailingIcon] - Icono después del contenido
 * @param {string} [props.className] - Clases CSS adicionales
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {Function} [props.onClick]
 */

// Variantes de color sobre tokens del sistema (sección 2.10 del brief).
const VARIANT_STYLES = {
  solid: 'bg-brand text-brand-contrast shadow-xs hover:bg-brand-hover hover:shadow-sm active:bg-brand-hover',
  soft: 'bg-brand/10 text-brand hover:bg-brand/15 active:bg-brand/20',
  outline: 'border border-line bg-surface text-content hover:border-line-strong hover:bg-surface-sunken active:bg-surface-sunken',
  ghost: 'bg-transparent text-content hover:bg-surface-sunken active:bg-surface-sunken',
  danger: 'bg-danger text-white shadow-xs hover:bg-danger/90 hover:shadow-sm active:bg-danger/90',
  gradient: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-xs hover:from-primary-600 hover:to-secondary-600 hover:shadow-sm',
  success: 'bg-success-soft text-success-on hover:bg-success/15 active:bg-success/20',
  warning: 'bg-warning-soft text-warning-on hover:bg-warning/15 active:bg-warning/20',
  info: 'bg-info-soft text-info-on hover:bg-info/15 active:bg-info/20',
};

// Alias heredados: no rompen los usos existentes de variant="primary"/"secondary".
const VARIANT_ALIASES = { primary: 'solid', secondary: 'outline' };

const SIZE_STYLES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-4 text-sm',
};

const TAP_TRANSITION = { duration: 0.08, ease: [0.2, 0, 0, 1] };

const GradientButton = forwardRef(function GradientButton(
  {
    variant = 'solid',
    to,
    href,
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leadingIcon,
    trailingIcon,
    className = '',
    children,
    onClick,
    ...rest
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;
  const resolvedVariant = VARIANT_STYLES[VARIANT_ALIASES[variant] || variant] || VARIANT_STYLES.solid;

  const classes = [
    'relative inline-flex items-center justify-center',
    'font-semibold rounded-md whitespace-nowrap select-none',
    'transition-colors duration-base ease-standard',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'aria-disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:pointer-events-none',
    resolvedVariant,
    SIZE_STYLES[size] || SIZE_STYLES.md,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tapProps =
    shouldReduceMotion || isDisabled
      ? {}
      : { whileTap: { scale: 0.98 }, transition: TAP_TRANSITION };

  const content = (
    <>
      <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
        {leadingIcon}
        {children}
        {trailingIcon}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />
        </span>
      )}
    </>
  );

  // Enlace deshabilitado: no navega, se anuncia como tal, sin animación.
  if ((to || href) && isDisabled) {
    return (
      <span ref={ref} role="link" aria-disabled="true" className={classes}>
        {content}
      </span>
    );
  }

  if (to) {
    return (
      <MotionLink
        ref={ref}
        to={to}
        className={classes}
        onClick={onClick}
        aria-busy={loading || undefined}
        {...tapProps}
        {...rest}
      >
        {content}
      </MotionLink>
    );
  }

  if (href) {
    return (
      <motion.a
        ref={ref}
        href={href}
        className={classes}
        onClick={onClick}
        aria-busy={loading || undefined}
        {...tapProps}
        {...rest}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref}
      className={classes}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...tapProps}
      {...rest}
      type={rest.type || 'button'}
    >
      {content}
    </motion.button>
  );
});

export default GradientButton;
export { GradientButton as Button };
