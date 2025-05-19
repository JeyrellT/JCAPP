import { Link } from 'react-router-dom';

/**
 * Componente para mostrar un botón con degradado
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} [props.variant="primary"] - Variante de color (primary, secondary, success, danger)
 * @param {string} [props.to] - Ruta para Link de react-router-dom (opcional)
 * @param {string} [props.href] - URL para enlace externo (opcional)
 * @param {string} [props.size="md"] - Tamaño del botón (sm, md, lg)
 * @param {boolean} [props.fullWidth=false] - Si el botón ocupa todo el ancho disponible
 * @param {string} [props.className] - Clases CSS adicionales
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {Function} [props.onClick] - Función a ejecutar al hacer clic
 */
const GradientButton = ({ 
  variant = "primary",
  to,
  href,
  size = "md",
  fullWidth = false,
  className = "",
  children,
  onClick,
  ...rest
}) => {
  // Variantes de color
  const variants = {
    primary: "from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white",
    secondary: "from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white",
    success: "from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white",
    danger: "from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white",
    warning: "from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white",
    info: "from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
  };
  
  // Tamaños
  const sizes = {
    sm: "text-xs py-1.5 px-3",
    md: "text-sm py-2 px-4",
    lg: "text-base py-2.5 px-5"
  };
  
  // Clases base
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-md shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    bg-gradient-to-r transition-all duration-200
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;
  
  // Renderizar componente según el tipo (Link, a, button)
  if (to) {
    return (
      <Link to={to} className={baseClasses} {...rest}>
        {children}
      </Link>
    );
  }
  
  if (href) {
    return (
      <a href={href} className={baseClasses} {...rest}>
        {children}
      </a>
    );
  }
  
  return (
    <button className={baseClasses} onClick={onClick} {...rest}>
      {children}
    </button>
  );
};

export default GradientButton;
