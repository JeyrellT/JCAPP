import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import { 
  Search, 
  Star, 
  Bell, 
  Volume2, 
  Eye, 
  FileText, 
  Download, 
  BarChart2, 
  PieChart as PieChartIcon, 
  Sun, 
  Moon, 
  ArrowUp, 
  ArrowDown, 
  XCircle, 
  Info, 
  Filter, 
  Grid,
  Users
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Contexto para el tema claro/oscuro
const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {}
});

// Datos de stakeholders extraídos del documento
const stakeholdersData = [
  {
    id: 1,
    name: "Gerente de Operaciones",
    role: "Patrocinador del proyecto, responsable de la eficiencia operativa general.",
    interest: "Reducción costos, mejora eficiencia, datos fiables, agilidad, mitigación riesgos.",
    interestLevel: "Alto",
    powerLevel: "Alto",
    impact: "+",
    strategy: "Gestionar de Cerca: Mantener informado constantemente, involucrar en decisiones clave.",
    quadrant: "Gestionar de Cerca",
    icon: "👑" // Icono para stakeholder clave
  },
  {
    id: 2,
    name: "Equipo Finanzas/Contabilidad",
    role: "Dueño de procesos clave (Aplicación pagos, CxC, Contabilidad, Viáticos, Facturación).",
    interest: "Reducción drástica trabajo manual/errores/conciliación, datos fiables en FinanzasPRO.",
    interestLevel: "Alto",
    powerLevel: "Alto",
    impact: "+",
    strategy: "Gestionar de Cerca: Socio clave, involucrar en diagnóstico y diseño de soluciones.",
    quadrant: "Gestionar de Cerca",
    icon: "📊"
  },
  {
    id: 3,
    name: "Personal Finanzas/Cobranza",
    role: "Ejecuta aplicación de pagos, conciliaciones, seguimiento CxC, gestión recibos.",
    interest: "Simplificación de tareas diarias, menos errores, herramientas más eficientes.",
    interestLevel: "Alto",
    powerLevel: "Medio",
    impact: "+",
    strategy: "Mantener Informado: Fuente clave de VOC, validar soluciones a nivel operativo.",
    quadrant: "Mantener Informados",
    icon: "💼"
  },
  {
    id: 4,
    name: "Persona Factura",
    role: "Responsable de generar/ingresar facturas.",
    interest: "Proceso de facturación más claro, eficiente y con menos errores.",
    interestLevel: "Medio",
    powerLevel: "Medio",
    impact: "+",
    strategy: "Mantener Informado: Entender sus desafíos específicos, validar mejoras en facturación.",
    quadrant: "Mantener Informados",
    icon: "📝"
  },
  {
    id: 5,
    name: "Agentes de Ventas",
    role: "Ejecutan alta cliente, cobran, liquidan, usan FACTUAPP.",
    interest: "Crédito rápido, info stock fiable, liquidación simple, menos problemas.",
    interestLevel: "Alto",
    powerLevel: "Medio",
    impact: "+/-",
    strategy: "Mantener Informado: Clave para VOC, validar soluciones en campo.",
    quadrant: "Mantener Informados",
    icon: "🛒"
  },
  {
    id: 6,
    name: "Analista / Equipo de TI",
    role: "Da soporte a sistemas actuales, conoce limitaciones técnicas.",
    interest: "Modernizar sistemas, reducir tickets soporte, proyecto técnicamente viable.",
    interestLevel: "Alto",
    powerLevel: "Alto",
    impact: "+/-",
    strategy: "Gestionar de Cerca: Socio técnico esencial, validar viabilidad técnica.",
    quadrant: "Gestionar de Cerca",
    icon: "💻"
  },
  {
    id: 7,
    name: "Cindy (Rol Aprobador)",
    role: "Gestiona casos especiales, punto de decisión manual fuera del flujo estándar.",
    interest: "Menos excepciones o claridad en nuevas políticas/procesos.",
    interestLevel: "Medio",
    powerLevel: "Medio-Alto",
    impact: "+/-",
    strategy: "Mantener Satisfecho: Entender su rol, asegurar que nuevo proceso maneje excepciones.",
    quadrant: "Mantener Satisfechos",
    icon: "✅"
  },
  {
    id: 8,
    name: "Contador",
    role: "Receptor final de info para contabilidad/auditoría.",
    interest: "Información estructurada, oportuna, fiable y fácil de auditar.",
    interestLevel: "Medio",
    powerLevel: "Medio",
    impact: "+",
    strategy: "Mantener Satisfecho: Asegurar que el proceso cumple necesidades contables.",
    quadrant: "Mantener Satisfechos",
    icon: "📈"
  },
  {
    id: 9,
    name: "Área Legal / Cumplimiento",
    role: "Responsable de asegurar cumplimiento normativo.",
    interest: "Formalización de procesos, reducción de riesgos legales.",
    interestLevel: "Alto",
    powerLevel: "Alto",
    impact: "+",
    strategy: "Gestionar de Cerca: Involucrar para validar requerimientos legales.",
    quadrant: "Gestionar de Cerca",
    icon: "⚖️"
  },
  {
    id: 10,
    name: "Bodega / Logística",
    role: "Afectados por información de Inventario.",
    interest: "Información de inventario más precisa, menos errores.",
    interestLevel: "Medio",
    powerLevel: "Medio",
    impact: "+/-",
    strategy: "Mantener Informado: Obtener perspectiva sobre problemas inventario.",
    quadrant: "Mantener Informados",
    icon: "📦"
  },
  {
    id: 11,
    name: "Clientes Externos",
    role: "Reciben facturas, estados de cuenta, solicitan crédito, realizan pagos.",
    interest: "Proceso más rápido, facturación precisa, comunicación clara.",
    interestLevel: "Alto",
    powerLevel: "Bajo",
    impact: "+",
    strategy: "Mantener Informado: Considerar su perspectiva en el diseño.",
    quadrant: "Mantener Informados",
    icon: "👥"
  },
  {
    id: 12,
    name: "Jeyrell Tardencilla",
    role: "Líder del Proyecto. Ejecuta diagnóstico, analiza, propone, documenta.",
    interest: "Completar proyecto exitosamente, cumplir objetivos académicos.",
    interestLevel: "Alto",
    powerLevel: "Alto",
    impact: "+",
    strategy: "Ejecutar y Comunicar: Responsable principal de la gestión del proyecto.",
    quadrant: "Gestionar de Cerca",
    icon: "🔍"
  },
  {
    id: 13,
    name: "Henry Lizano (Tutor)",
    role: "Guía metodológica, supervisión académica, evaluación.",
    interest: "Asegurar rigor LSS, calidad académica del proyecto.",
    interestLevel: "Alto",
    powerLevel: "Alto",
    impact: "+",
    strategy: "Consultar: Seguir guía metodológica, reportar avances.",
    quadrant: "Gestionar de Cerca",
    icon: "📚"
  },
  {
    id: 14,
    name: "Otros Departamentos",
    role: "Mínimamente afectados por el proyecto.",
    interest: "Conocer cambios que pudieran afectarles indirectamente.",
    interestLevel: "Bajo",
    powerLevel: "Bajo",
    impact: "Neutral",
    strategy: "Monitorear: Proveer información mínima cuando sea relevante.",
    quadrant: "Monitorear",
    icon: "👁️"
  }
];

// Colores por cuadrante
const quadrantColors = {
  "Gestionar de Cerca": {
    light: {
      bg: "bg-yellow-100",
      border: "border-yellow-500",
      hover: "hover:bg-yellow-200",
      card: "bg-yellow-50",
      text: "text-yellow-800"
    },
    dark: {
      bg: "bg-yellow-900",
      border: "border-yellow-600",
      hover: "hover:bg-yellow-800",
      card: "bg-yellow-950",
      text: "text-yellow-300"
    }
  },
  "Mantener Satisfechos": {
    light: {
      bg: "bg-blue-100",
      border: "border-blue-500",
      hover: "hover:bg-blue-200",
      card: "bg-blue-50",
      text: "text-blue-800"
    },
    dark: {
      bg: "bg-blue-900",
      border: "border-blue-600",
      hover: "hover:bg-blue-800",
      card: "bg-blue-950",
      text: "text-blue-300"
    }
  },
  "Mantener Informados": {
    light: {
      bg: "bg-green-100",
      border: "border-green-500",
      hover: "hover:bg-green-200",
      card: "bg-green-50",
      text: "text-green-800"
    },
    dark: {
      bg: "bg-green-900",
      border: "border-green-600",
      hover: "hover:bg-green-800",
      card: "bg-green-950",
      text: "text-green-300"
    }
  },
  "Monitorear": {
    light: {
      bg: "bg-gray-100",
      border: "border-gray-500",
      hover: "hover:bg-gray-200",
      card: "bg-gray-50",
      text: "text-gray-800"
    },
    dark: {
      bg: "bg-gray-800",
      border: "border-gray-600",
      hover: "hover:bg-gray-700",
      card: "bg-gray-900",
      text: "text-gray-300"
    }
  }
};

// Componente InfoTooltip
const InfoTooltip = ({ children, text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center"
      >
        {children}
        <span className="ml-1 cursor-help text-sm">ℹ️</span>
      </div>
      
      {isVisible && (
        <div className={`absolute z-10 w-64 p-2 -mt-1 text-sm rounded-lg shadow-lg transform transition-all duration-200 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} border`}
             style={{ left: '100%', marginLeft: '8px' }}>
          {text}
          <div className={`absolute w-2 h-2 transform rotate-45 -left-1 top-2 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}></div>
        </div>
      )}
    </div>
  );
};

// Componente para la matriz de Poder/Interés
const StakeholderMatrix = ({ stakeholders, selectStakeholder }) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`border rounded-lg p-4 shadow-lg transition-all duration-300 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">📊</span> Matriz de Poder / Interés
      </h2>
      <div className="grid grid-cols-2 gap-4 h-96">
        {/* Cuadrante Superior Derecho: Alto Poder, Alto Interés */}
        <div className={`border-2 ${darkMode ? quadrantColors["Gestionar de Cerca"].dark.border : quadrantColors["Gestionar de Cerca"].light.border} rounded-lg p-3 ${darkMode ? quadrantColors["Gestionar de Cerca"].dark.card : quadrantColors["Gestionar de Cerca"].light.card} overflow-y-auto shadow-md transition-all duration-300 custom-scrollbar`}>
          <h3 className="font-bold mb-2 flex items-center">
            <span className="mr-2">⭐</span> Gestionar de Cerca
          </h3>
          <p className={`text-xs mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Alto Poder, Alto Interés</p>
          <div className="space-y-2">
            {stakeholders
              .filter(s => s.quadrant === "Gestionar de Cerca")
              .map(stakeholder => (
                <div 
                  key={stakeholder.id}
                  className={`p-3 rounded-lg cursor-pointer shadow-md ${darkMode ? quadrantColors["Gestionar de Cerca"].dark.bg : quadrantColors["Gestionar de Cerca"].light.bg} ${darkMode ? quadrantColors["Gestionar de Cerca"].dark.hover : quadrantColors["Gestionar de Cerca"].light.hover} transform transition-all duration-200 hover:scale-102 hover:shadow-lg`}
                  onClick={() => selectStakeholder(stakeholder)}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{stakeholder.icon}</span>
                    <span className="font-medium">{stakeholder.name}</span>
                  </div>
                  <div className={`mt-1 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300`}>
                    <p>Interés: {stakeholder.interestLevel}</p>
                    <p>Poder: {stakeholder.powerLevel}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Cuadrante Superior Izquierdo: Alto Poder, Bajo Interés */}
        <div className={`border-2 ${darkMode ? quadrantColors["Mantener Satisfechos"].dark.border : quadrantColors["Mantener Satisfechos"].light.border} rounded-lg p-3 ${darkMode ? quadrantColors["Mantener Satisfechos"].dark.card : quadrantColors["Mantener Satisfechos"].light.card} overflow-y-auto shadow-md transition-all duration-300 custom-scrollbar`}>
          <h3 className="font-bold mb-2 flex items-center">
            <span className="mr-2">🔔</span> Mantener Satisfechos
          </h3>
          <p className={`text-xs mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Alto Poder, Bajo Interés</p>
          <div className="space-y-2">
            {stakeholders
              .filter(s => s.quadrant === "Mantener Satisfechos")
              .map(stakeholder => (
                <div 
                  key={stakeholder.id}
                  className={`p-3 rounded-lg cursor-pointer shadow-md ${darkMode ? quadrantColors["Mantener Satisfechos"].dark.bg : quadrantColors["Mantener Satisfechos"].light.bg} ${darkMode ? quadrantColors["Mantener Satisfechos"].dark.hover : quadrantColors["Mantener Satisfechos"].light.hover} transform transition-all duration-200 hover:scale-102 hover:shadow-lg`}
                  onClick={() => selectStakeholder(stakeholder)}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{stakeholder.icon}</span>
                    <span className="font-medium">{stakeholder.name}</span>
                  </div>
                  <div className={`mt-1 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300`}>
                    <p>Interés: {stakeholder.interestLevel}</p>
                    <p>Poder: {stakeholder.powerLevel}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Cuadrante Inferior Derecho: Bajo Poder, Alto Interés */}
        <div className={`border-2 ${darkMode ? quadrantColors["Mantener Informados"].dark.border : quadrantColors["Mantener Informados"].light.border} rounded-lg p-3 ${darkMode ? quadrantColors["Mantener Informados"].dark.card : quadrantColors["Mantener Informados"].light.card} overflow-y-auto shadow-md transition-all duration-300 custom-scrollbar`}>
          <h3 className="font-bold mb-2 flex items-center">
            <span className="mr-2">📣</span> Mantener Informados
          </h3>
          <p className={`text-xs mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Bajo Poder, Alto Interés</p>
          <div className="space-y-2">
            {stakeholders
              .filter(s => s.quadrant === "Mantener Informados")
              .map(stakeholder => (
                <div 
                  key={stakeholder.id}
                  className={`p-3 rounded-lg cursor-pointer shadow-md ${darkMode ? quadrantColors["Mantener Informados"].dark.bg : quadrantColors["Mantener Informados"].light.bg} ${darkMode ? quadrantColors["Mantener Informados"].dark.hover : quadrantColors["Mantener Informados"].light.hover} transform transition-all duration-200 hover:scale-102 hover:shadow-lg`}
                  onClick={() => selectStakeholder(stakeholder)}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{stakeholder.icon}</span>
                    <span className="font-medium">{stakeholder.name}</span>
                  </div>
                  <div className={`mt-1 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300`}>
                    <p>Interés: {stakeholder.interestLevel}</p>
                    <p>Poder: {stakeholder.powerLevel}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Cuadrante Inferior Izquierdo: Bajo Poder, Bajo Interés */}
        <div className={`border-2 ${darkMode ? quadrantColors["Monitorear"].dark.border : quadrantColors["Monitorear"].light.border} rounded-lg p-3 ${darkMode ? quadrantColors["Monitorear"].dark.card : quadrantColors["Monitorear"].light.card} overflow-y-auto shadow-md transition-all duration-300 custom-scrollbar`}>
          <h3 className="font-bold mb-2 flex items-center">
            <span className="mr-2">👁️</span> Monitorear
          </h3>
          <p className={`text-xs mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Bajo Poder, Bajo Interés</p>
          <div className="space-y-2">
            {stakeholders
              .filter(s => s.quadrant === "Monitorear")
              .map(stakeholder => (
                <div 
                  key={stakeholder.id}
                  className={`p-3 rounded-lg cursor-pointer shadow-md ${darkMode ? quadrantColors["Monitorear"].dark.bg : quadrantColors["Monitorear"].light.bg} ${darkMode ? quadrantColors["Monitorear"].dark.hover : quadrantColors["Monitorear"].light.hover} transform transition-all duration-200 hover:scale-102 hover:shadow-lg`}
                  onClick={() => selectStakeholder(stakeholder)}
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{stakeholder.icon}</span>
                    <span className="font-medium">{stakeholder.name}</span>
                  </div>
                  <div className={`mt-1 text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300`}>
                    <p>Interés: {stakeholder.interestLevel}</p>
                    <p>Poder: {stakeholder.powerLevel}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para mostrar detalles del stakeholder
const StakeholderDetail = ({ stakeholder, onClose }) => {
  const { darkMode } = useContext(ThemeContext);
  
  if (!stakeholder) return null;

  const colors = darkMode 
    ? quadrantColors[stakeholder.quadrant].dark 
    : quadrantColors[stakeholder.quadrant].light;
  
  const cardClass = `border-l-4 ${colors.border} p-4 rounded-lg shadow-lg transition-all duration-300 transform animate-fadeIn ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`;

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-bold flex items-center">
          <span className="mr-2 text-2xl">{stakeholder.icon}</span>
          {stakeholder.name}
        </h2>
        <button 
          onClick={onClose} 
          className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-700'} p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-300 transition-colors duration-200`}
        >
          ✕
        </button>
      </div>
      
      <div className="mt-4 space-y-3">
        <div>
          <p className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Rol:</p>
          <p>{stakeholder.role}</p>
        </div>
        
        <div>
          <p className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Interés Principal:</p>
          <p>{stakeholder.interest}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-opacity-10 p-2 rounded-lg bg-blue-500">
            <p className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nivel de Interés:</p>
            <p>{stakeholder.interestLevel}</p>
          </div>
          
          <div className="bg-opacity-10 p-2 rounded-lg bg-purple-500">
            <p className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Nivel de Poder:</p>
            <p>{stakeholder.powerLevel}</p>
          </div>
          
          <div className="bg-opacity-10 p-2 rounded-lg bg-orange-500">
            <p className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Impacto Potencial:</p>
            <p>{stakeholder.impact}</p>
          </div>
        </div>
        
        <div>
          <p className={`font-semibold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Estrategia de Gestión:</p>
          <p>{stakeholder.strategy}</p>
        </div>
        
        <div className={`inline-block px-3 py-1 rounded-full text-sm ${colors.bg} ${colors.text}`}>
          {stakeholder.quadrant}
        </div>
      </div>
    </div>
  );
};

// Componente para filtros y buscador
const StakeholderFilters = ({ onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState("");
  const { darkMode } = useContext(ThemeContext);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange({ searchTerm: value, quadrant: selectedQuadrant });
  };

  const handleQuadrantChange = (e) => {
    const value = e.target.value;
    setSelectedQuadrant(value);
    onFilterChange({ searchTerm, quadrant: value });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar stakeholder..."
          className={`w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
          }`}
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <div>
        <select 
          className={`w-full p-2 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-400'
          }`}
          value={selectedQuadrant}
          onChange={handleQuadrantChange}
        >
          <option value="">Todos los cuadrantes</option>
          <option value="Gestionar de Cerca">Gestionar de Cerca</option>
          <option value="Mantener Satisfechos">Mantener Satisfechos</option>
          <option value="Mantener Informados">Mantener Informados</option>
          <option value="Monitorear">Monitorear</option>
        </select>
      </div>
    </div>
  );
};

// Componente para tabla de stakeholders con ordenamiento
const StakeholderTable = ({ stakeholders, selectStakeholder }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const { darkMode } = useContext(ThemeContext);
  
  // Función para ordenar la tabla
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Aplicar el ordenamiento
  const sortedStakeholders = React.useMemo(() => {
    let sortableItems = [...stakeholders];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [stakeholders, sortConfig]);
  
  // Componente para encabezado de columna ordenable
  const SortableHeader = ({ label, sortKey, tooltip }) => (
    <th
      className={`p-3 text-left border transition-colors duration-200 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      onClick={() => requestSort(sortKey)}
      style={{ cursor: 'pointer' }}
    >
      <span className="flex items-center">
        {label}
        {tooltip ? (
          <InfoTooltip text={tooltip}>
            <svg className="ml-1 w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
            </svg>
          </InfoTooltip>
        ) : null}
      </span>
    </th>
  );

  return (
    <div className={`rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
              <th className={`p-3 text-left border transition-colors duration-200 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <span className="font-semibold">Stakeholder</span>
              </th>
              <SortableHeader 
                label="Interés" 
                sortKey="interestLevel" 
                tooltip="El nivel de interés indica cuánto le importa o afecta el proyecto al stakeholder."
              />
              <SortableHeader 
                label="Poder" 
                sortKey="powerLevel" 
                tooltip="El nivel de poder indica la capacidad del stakeholder para influir en el proyecto."
              />
              <SortableHeader 
                label="Impacto" 
                sortKey="impact" 
                tooltip="El impacto potencial que el proyecto tendrá sobre el stakeholder o viceversa."
              />
              <SortableHeader 
                label="Cuadrante" 
                sortKey="quadrant" 
                tooltip="La clasificación del stakeholder según la matriz de Poder/Interés."
              />
              <th className={`p-3 text-center border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <span className="font-semibold">Acción</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStakeholders.map(stakeholder => {
              const colors = darkMode 
                ? quadrantColors[stakeholder.quadrant].dark 
                : quadrantColors[stakeholder.quadrant].light;
              
              return (
                <tr 
                  key={stakeholder.id} 
                  className={`transition-colors duration-200 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                >
                  <td className={`p-3 border ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <span className="mr-2 text-lg">{stakeholder.icon}</span>
                      {stakeholder.name}
                    </div>
                  </td>
                  <td className={`p-3 border ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200'}`}>
                    {stakeholder.interestLevel}
                  </td>
                  <td className={`p-3 border text-center ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200'}`}>
                    {stakeholder.powerLevel}
                  </td>
                  <td className={`p-3 border text-center ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200'}`}>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      stakeholder.impact === '+' ? 'bg-green-100 text-green-800' : 
                      stakeholder.impact === '-' ? 'bg-red-100 text-red-800' :
                      stakeholder.impact === '+/-' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stakeholder.impact}
                    </span>
                  </td>
                  <td className={`p-3 border ${darkMode ? 'border-gray-700 text-white' : 'border-gray-200'}`}>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${colors.bg} ${colors.text}`}>
                      {stakeholder.quadrant}
                    </span>
                  </td>
                  <td className={`p-3 border text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button 
                      className={`px-3 py-1 rounded text-sm transform transition-all duration-200 hover:scale-105 focus:outline-none ${
                        darkMode 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                      onClick={() => selectStakeholder(stakeholder)}
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para el resumen de stakeholders por cuadrante
const StakeholderSummary = ({ stakeholders }) => {
  const { darkMode } = useContext(ThemeContext);
  
  // Contar stakeholders por cuadrante
  const countByQuadrant = stakeholders.reduce((acc, stakeholder) => {
    acc[stakeholder.quadrant] = (acc[stakeholder.quadrant] || 0) + 1;
    return acc;
  }, {});
  
  // Datos para mostrar en los cards
  const quadrantData = [
    { 
      name: "Gestionar de Cerca", 
      count: countByQuadrant["Gestionar de Cerca"] || 0,
      icon: "⭐",
      stakeholders: stakeholders.filter(s => s.quadrant === "Gestionar de Cerca").map(s => s.name)
    },
    { 
      name: "Mantener Satisfechos", 
      count: countByQuadrant["Mantener Satisfechos"] || 0,
      icon: "🔔",
      stakeholders: stakeholders.filter(s => s.quadrant === "Mantener Satisfechos").map(s => s.name)
    },
    { 
      name: "Mantener Informados", 
      count: countByQuadrant["Mantener Informados"] || 0,
      icon: "📣",
      stakeholders: stakeholders.filter(s => s.quadrant === "Mantener Informados").map(s => s.name)
    },
    { 
      name: "Monitorear", 
      count: countByQuadrant["Monitorear"] || 0,
      icon: "👁️",
      stakeholders: stakeholders.filter(s => s.quadrant === "Monitorear").map(s => s.name)
    }
  ];

  // Componente para cada card
  const QuadrantCard = ({ data }) => {
    const [showStakeholders, setShowStakeholders] = useState(false);
    const colors = darkMode 
      ? quadrantColors[data.name].dark 
      : quadrantColors[data.name].light;
    
    return (
      <div 
        className={`border-l-4 ${colors.border} p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} relative group`}
        onMouseEnter={() => setShowStakeholders(true)}
        onMouseLeave={() => setShowStakeholders(false)}
      >
        <div className="flex items-center">
          <span className="text-2xl mr-2">{data.icon}</span>
          <div>
            <p className={`text-2xl font-bold ${colors.text}`}>{data.count}</p>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.name}</p>
          </div>
        </div>
        
        {showStakeholders && data.stakeholders.length > 0 && (
          <div className={`absolute z-10 left-0 top-full mt-2 p-3 rounded-lg shadow-lg w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} border animate-fadeIn`}>
            <p className="font-semibold mb-2">Stakeholders:</p>
            <ul className="space-y-1 text-sm">
              {data.stakeholders.map((name, index) => (
                <li key={index} className="flex items-center">
                  <span className="mr-1">•</span> {name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {quadrantData.map((data, index) => (
        <QuadrantCard key={index} data={data} />
      ))}
    </div>
  );
};

// Componente para visualizar la influencia entre stakeholders
const StakeholderInfluence = ({ stakeholders }) => {
  const { darkMode } = useContext(ThemeContext);
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  
  // Datos para el diagrama de relaciones
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  const prepareChartData = () => {
    return stakeholders.map((stakeholder, index) => ({
      name: stakeholder.name,
      value: stakeholder.quadrant === "Gestionar de Cerca" ? 25 :
             stakeholder.quadrant === "Mantener Satisfechos" ? 20 :
             stakeholder.quadrant === "Mantener Informados" ? 15 : 10,
      icon: stakeholder.icon,
      id: stakeholder.id,
      fullData: stakeholder
    }));
  };
  
  const handlePieClick = (data, index) => {
    setSelectedStakeholder(data.fullData);
  };
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, payload }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={darkMode ? "white" : "black"} 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
        className="select-none"
      >
        {payload.icon} {payload.name.split(' ')[0]}
      </text>
    );
  };
  
  return (
    <div className={`p-4 rounded-lg shadow-lg transition-all duration-300 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">🔄</span> Mapa de Influencia
      </h2>
      
      <div className="flex flex-col md:flex-row">
        <div className="flex-1 h-80 mb-4 md:mb-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={prepareChartData()}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={handlePieClick}
              >
                {prepareChartData().map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    opacity={selectedStakeholder && selectedStakeholder.id === entry.id ? 1 : 0.7}
                    stroke={selectedStakeholder && selectedStakeholder.id === entry.id ? "#fff" : "none"}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [props.payload.name, '']}
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  borderColor: darkMode ? '#374151' : '#e2e8f0',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  color: darkMode ? '#f9fafb' : '#111827'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="md:w-1/3 md:ml-4">
          {selectedStakeholder ? (
            <div className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${
              darkMode 
                ? 'bg-gray-700 border-blue-500 text-white' 
                : 'bg-gray-100 border-blue-500'
            }`}>
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <span className="mr-2 text-xl">{selectedStakeholder.icon}</span>
                {selectedStakeholder.name}
              </h3>
              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-medium">Rol:</span> {selectedStakeholder.role}
              </p>
              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-medium">Interés:</span> {selectedStakeholder.interestLevel}
              </p>
              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-medium">Poder:</span> {selectedStakeholder.powerLevel}
              </p>
              <div className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-2 ${
                darkMode 
                  ? 'bg-blue-900 text-blue-200' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {selectedStakeholder.quadrant}
              </div>
            </div>
          ) : (
            <div className={`p-4 rounded-lg border transition-all duration-300 flex items-center justify-center h-full ${
              darkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'
            }`}>
              <p className="text-center text-sm">
                Haga clic en un stakeholder para ver su información
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Theme Switcher Component
const ThemeSwitcher = ({ darkMode, toggleDarkMode }) => {
  return (
    <button 
      onClick={toggleDarkMode}
      className={`flex items-center justify-center p-2 rounded-full transition-all duration-300 ${
        darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-blue-100 text-gray-800'
      }`}
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
};

// CSS Global para animaciones y scrollbar personalizado
const GlobalStyles = () => {
  return (
    <style jsx global>{`
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(-10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }
      
      .hover\\:scale-102:hover {
        transform: scale(1.02);
      }
      
      /* Custom scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    `}</style>
  );
};

// Componente principal que integra todo
const StakeholderAnalysis = ({ projectId }) => {
  const [stakeholders] = useState(stakeholdersData);
  const [filteredStakeholders, setFilteredStakeholders] = useState(stakeholdersData);
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'matrix'
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Función para aplicar filtros
  const applyFilters = ({ searchTerm, quadrant }) => {
    let filtered = stakeholdersData;
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (quadrant) {
      filtered = filtered.filter(s => s.quadrant === quadrant);
    }
    
    setFilteredStakeholders(filtered);
  };
  
  // Función para cambiar tema
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Función para animar el cambio de vista
  const changeViewMode = (mode) => {
    if (mode === viewMode) return;
    
    // Aplicar animación de salida
    document.getElementById('content-container').classList.add('opacity-0');
    
    // Cambiar la vista después de completar la animación
    setTimeout(() => {
      setViewMode(mode);
      // Aplicar animación de entrada
      setTimeout(() => {
        document.getElementById('content-container').classList.remove('opacity-0');
      }, 50);
    }, 300);
  };

  // Skeleton loader para estados de carga
  const SkeletonLoader = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-300 rounded mb-4"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-300 rounded"></div>
        ))}
      </div>
      <div className="h-10 bg-gray-300 rounded mb-4"></div>
      <div className="h-10 bg-gray-300 rounded mb-4"></div>
      <div className="h-64 bg-gray-300 rounded"></div>
    </div>
  );

  // Si no hay proyecto, no mostrar nada
  if (!project) {
    return <div className="text-center py-8">Proyecto no encontrado</div>;
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <GlobalStyles />
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
        <div className="container mx-auto p-4">
          <div className={`rounded-lg shadow-lg mb-6 transition-all duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold flex items-center">
                    <span className="mr-2">📋</span> Análisis de Stakeholders - Proyecto F.G.V. S.A.
                  </h1>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    Herramienta para visualizar y gestionar la información de stakeholders del proyecto.
                  </p>
                </div>
                <ThemeSwitcher darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              </div>
              
              {isLoading ? (
                <SkeletonLoader />
              ) : (
                <>
                  <StakeholderSummary stakeholders={stakeholders} />
                  
                  <div className="flex mb-4">
                    <button 
                      className={`mr-2 px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
                        viewMode === 'table' 
                          ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'
                      }`}
                      onClick={() => changeViewMode('table')}
                    >
                      <span className="mr-2">📋</span> Tabla
                    </button>
                    <button 
                      className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
                        viewMode === 'matrix' 
                          ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white' 
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'
                      }`}
                      onClick={() => changeViewMode('matrix')}
                    >
                      <span className="mr-2">📊</span> Matriz
                    </button>
                  </div>
                  
                  <StakeholderFilters onFilterChange={applyFilters} />
                  
                  <div 
                    id="content-container" 
                    className="transition-opacity duration-300"
                  >
                    {viewMode === 'table' ? (
                      <StakeholderTable 
                        stakeholders={filteredStakeholders}
                        selectStakeholder={setSelectedStakeholder}
                      />
                    ) : (
                      <StakeholderMatrix 
                        stakeholders={filteredStakeholders}
                        selectStakeholder={setSelectedStakeholder}
                      />
                    )}
                  </div>
                  
                  {selectedStakeholder && (
                    <div className="mt-6">
                      <StakeholderDetail 
                        stakeholder={selectedStakeholder}
                        onClose={() => setSelectedStakeholder(null)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export default StakeholderAnalysis;
