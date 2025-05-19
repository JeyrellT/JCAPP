import { ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Componente para mostrar una tarjeta de estadística
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la estadística
 * @param {string|number} props.value - Valor de la estadística
 * @param {React.ReactNode} props.icon - Icono para la estadística
 * @param {string} [props.color="teal"] - Color del icono (teal, blue, green, purple, red, orange)
 * @param {string} [props.description] - Descripción opcional
 * @param {number} [props.trend] - Tendencia del valor (positivo o negativo)
 */
const StatCard = ({ title, value, icon, color = "teal", description, trend }) => {
  // Mapeo de colores
  const colors = {
    teal: {
      bg: "bg-primary-100 dark:bg-primary-900/30",
      text: "text-primary-600 dark:text-primary-400",
      lighter: "text-primary-500",
      gradient: "from-primary-500 to-primary-700"
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      lighter: "text-blue-500",
      gradient: "from-blue-500 to-blue-700"
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
      lighter: "text-green-500",
      gradient: "from-green-500 to-green-700"
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      lighter: "text-purple-500",
      gradient: "from-purple-500 to-purple-700"
    },
    red: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
      lighter: "text-red-500",
      gradient: "from-red-500 to-red-700"
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-600 dark:text-orange-400",
      lighter: "text-orange-500",
      gradient: "from-orange-500 to-orange-700"
    }
  };

  // Obtener el conjunto de colores
  const colorSet = colors[color] || colors.teal;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
          
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
          
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`flex items-center text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {trend >= 0 ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${colorSet.bg} ${colorSet.text}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
