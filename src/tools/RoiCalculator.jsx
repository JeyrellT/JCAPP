import React, { useState, useEffect, useCallback } from 'react';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import debounce from 'lodash/debounce';
import { 
  DollarSign, 
  Clock, 
  User, 
  TrendingUp, 
  Calendar, 
  Sliders, 
  HelpCircle, 
  PlayCircle, 
  PauseCircle,
  BarChart2,
  Save
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Componente para la calculadora de ROI (Return on Investment)
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const RoiCalculator = ({ projectId }) => {
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // Estados para la configuración FTE
  const [costPerYear, setCostPerYear] = useState(12000000);
  const [timeUnitType, setTimeUnitType] = useState('monthly');
  const [timeUnitValue, setTimeUnitValue] = useState(160);
  
  // Estados para costos de implementación
  const [implementationCost, setImplementationCost] = useState(2120000);
  
  // Estados para el proceso antes de la mejora
  const [minutesBefore, setMinutesBefore] = useState(60);
  const [frequencyTypeBefore, setFrequencyTypeBefore] = useState('monthly');
  const [frequencyValueBefore, setFrequencyValueBefore] = useState(4);
  const [peopleCountBefore, setPeopleCountBefore] = useState(2);
  
  // Estados para el proceso después de la mejora
  const [minutesAfter, setMinutesAfter] = useState(15);
  const [frequencyTypeAfter, setFrequencyTypeAfter] = useState('monthly');
  const [frequencyValueAfter, setFrequencyValueAfter] = useState(4);
  const [peopleCountAfter, setPeopleCountAfter] = useState(1);
  
  // Estados para configuración de adopción
  const [adoptionCurveType, setAdoptionCurveType] = useState('linear');
  const [inflectionPoint, setInflectionPoint] = useState(6);
  
  // Estados para visualización y animación
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [viewAccumulated, setViewAccumulated] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(3000);
  const [showSpeedSettings, setShowSpeedSettings] = useState(false);
    // Estado para resultados calculados
  const [results, setResults] = useState({
    hoursSaved: 0,
    fteEquivalent: 0,
    moneySaved: 0,
    roi: 0,
    paybackMonths: 0,
    hoursBefore: 0,
    hoursAfter: 0,
    percentReduction: 0,
    annualHours: 0,
    costPerHour: 0,
    monthlySavings: [],
    breakEvenMonth: null,
    adoptionPercentages: [],
    annualSavings: 0,
    annualRevenue: 0
  });

  // Estado para mensaje de guardado exitoso
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Estados para tooltips
  const [tooltips, setTooltips] = useState({
    fte: false,
    hourCost: false,
    roi: false,
    payback: false
  });
  
  // Tasa de cambio aproximada (colones por dólar)
  const [exchangeRate] = useState(535);
  
  // Cargar datos de ROI si existen en el proyecto
  useEffect(() => {
    if (project && project.roiData) {
      // Cargar datos de FTE
      if (project.roiData.fte) {
        setCostPerYear(project.roiData.fte.costPerYear || costPerYear);
        setTimeUnitType(project.roiData.fte.timeUnitType || timeUnitType);
        setTimeUnitValue(project.roiData.fte.timeUnitValue || timeUnitValue);
      }
      
      // Cargar datos de implementación
      setImplementationCost(project.roiData.implementationCost || implementationCost);
      
      // Cargar datos de proceso antes
      if (project.roiData.processBefore) {
        setMinutesBefore(project.roiData.processBefore.minutes || minutesBefore);
        setFrequencyTypeBefore(project.roiData.processBefore.frequencyType || frequencyTypeBefore);
        setFrequencyValueBefore(project.roiData.processBefore.frequencyValue || frequencyValueBefore);
        setPeopleCountBefore(project.roiData.processBefore.peopleCount || peopleCountBefore);
      }
      
      // Cargar datos de proceso después
      if (project.roiData.processAfter) {
        setMinutesAfter(project.roiData.processAfter.minutes || minutesAfter);
        setFrequencyTypeAfter(project.roiData.processAfter.frequencyType || frequencyTypeAfter);
        setFrequencyValueAfter(project.roiData.processAfter.frequencyValue || frequencyValueAfter);
        setPeopleCountAfter(project.roiData.processAfter.peopleCount || peopleCountAfter);
      }
      
      // Cargar configuración de adopción
      if (project.roiData.adoption) {
        setAdoptionCurveType(project.roiData.adoption.curveType || adoptionCurveType);
        setInflectionPoint(project.roiData.adoption.inflectionPoint || inflectionPoint);
      }
    }
  }, [project]);
  
  // Función debounced para actualizar el proyecto
  const debouncedUpdateProject = useCallback(
    debounce((projectId, roiData) => {
      updateProject(projectId, { roiData });
    }, 1000),
    []
  );
  // Guardar datos en el proyecto cuando cambian los valores principales
  useEffect(() => {
    if (project && !isAutoPlaying && results.hoursSaved !== undefined) {
      const roiData = {
        fte: {
          costPerYear: parseFloat(costPerYear),
          timeUnitType,
          timeUnitValue: parseFloat(timeUnitValue)
        },
        implementationCost: parseFloat(implementationCost),
        processBefore: {
          minutes: parseFloat(minutesBefore),
          frequencyType: frequencyTypeBefore,
          frequencyValue: parseInt(frequencyValueBefore),
          peopleCount: parseInt(peopleCountBefore)
        },
        processAfter: {
          minutes: parseFloat(minutesAfter),
          frequencyType: frequencyTypeAfter,
          frequencyValue: parseInt(frequencyValueAfter),
          peopleCount: parseInt(peopleCountAfter)
        },
        adoption: {
          curveType: adoptionCurveType,
          inflectionPoint: parseInt(inflectionPoint)
        },
        results: {
          hoursSaved: parseFloat(results.hoursSaved.toFixed(2)),
          fteEquivalent: parseFloat(results.fteEquivalent.toFixed(3)),
          moneySaved: parseFloat(results.moneySaved.toFixed(2)),
          roi: parseFloat(results.roi.toFixed(2)),
          paybackMonths: parseFloat(results.paybackMonths.toFixed(2)),
          lastUpdated: new Date().toISOString()
        }
      };
      
      debouncedUpdateProject(projectId, roiData);
    }
  }, [
    costPerYear, timeUnitType, timeUnitValue, 
    implementationCost, 
    minutesBefore, frequencyTypeBefore, frequencyValueBefore, peopleCountBefore,
    minutesAfter, frequencyTypeAfter, frequencyValueAfter, peopleCountAfter,
    adoptionCurveType, inflectionPoint,
    results
  ]);
  
  // Iniciar/detener la reproducción automática
  useEffect(() => {
    let intervalId;
    
    if (isAutoPlaying) {
      intervalId = setInterval(() => {
        setSelectedMonth(prev => {
          const next = prev >= 12 ? 1 : prev + 1;
          return next;
        });
      }, animationSpeed);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoPlaying, animationSpeed]);
  
  // Alternar visibilidad de tooltips
  const toggleTooltip = (tooltip) => {
    setTooltips(prev => ({
      ...prev,
      [tooltip]: !prev[tooltip]
    }));
  };
  
  // Íconos para tipos de frecuencia
  const frequencyIcons = {
    'daily': '📅',
    'weekly': '📆',
    'monthly': '🗓️',
    'quarterly': '⏳',
    'semiannual': '⏲️',
    'annual': '🎯'
  };
  
  // Opciones para velocidad de reproducción
  const speedOptions = [
    { label: "Lento", value: 5000, description: "5 segundos por mes" },
    { label: "Medio", value: 3000, description: "3 segundos por mes" },
    { label: "Rápido", value: 1500, description: "1.5 segundos por mes" }
  ];
    // Calcular porcentaje de adopción por mes según curva
  const getAdoptionByMonth = () => {
    // Calcular porcentaje de adopción por mes según curva
    const result = [];
    for (let i = 1; i <= 12; i++) {
      let percentage;
      switch (adoptionCurveType) {
        case 'linear': percentage = (i / 12) * 100; break;
        case 'exponential': {
          const midpoint = inflectionPoint;
          const steepness = 1.0;
          percentage = 100 / (1 + Math.exp(-steepness * (i - midpoint)));
          break;
        }
        case 'custom': {
          const skew = inflectionPoint / 6;
          percentage = 100 * Math.pow(i / 12, 1/skew);
          break;
        }
        default: percentage = (i / 12) * 100;
      }
      result.push(Math.min(100, Math.max(0, percentage)));
    }
    return result;
  };
  
  // Actualizar cálculos cuando cambian los valores de entrada
  useEffect(() => {
    // Calcular horas anuales basadas en unidad de tiempo
    const annualHours = (() => {
      switch (timeUnitType) {
        case 'daily':
          return timeUnitValue * 260; // 260 días laborables al año
        case 'weekly':
          return timeUnitValue * 52; // 52 semanas al año
        case 'monthly':
          return timeUnitValue * 12; // 12 meses al año
        default:
          return timeUnitValue * 12;
      }
    })();
    
    const costPerHour = costPerYear / annualHours;
    
    // Calcular frecuencia anual
    const getAnnualFrequency = (type, value) => {
      const factors = {
        'daily': 365,
        'weekly': 52,
        'monthly': 12,
        'quarterly': 4,
        'semiannual': 2,
        'annual': 1
      };
      return value * factors[type];
    };
    
    // Calcular horas anuales para escenarios antes y después
    const getProcessAnnualHours = (minutes, freqType, freqValue, people) => {
      const hoursPerExecution = minutes / 60;
      const executionsPerYear = getAnnualFrequency(freqType, freqValue);
      return hoursPerExecution * executionsPerYear * people;
    };
    
    const hoursBefore = getProcessAnnualHours(
      minutesBefore, frequencyTypeBefore, frequencyValueBefore, peopleCountBefore
    );
    
    const hoursAfter = getProcessAnnualHours(
      minutesAfter, frequencyTypeAfter, frequencyValueAfter, peopleCountAfter
    );
    
    const hoursSaved = hoursBefore - hoursAfter > 0 ? hoursBefore - hoursAfter : 0;
    const fteEquivalent = hoursSaved / annualHours;
    const moneySaved = hoursSaved * costPerHour;
    const percentReduction = hoursBefore > 0 ? ((hoursBefore - hoursAfter) / hoursBefore * 100) : 0;
    
    // Cálculos de ROI y período de recuperación
    const roi = implementationCost > 0 ? ((moneySaved - implementationCost) / implementationCost * 100) : 0;
    const paybackMonths = implementationCost > 0 ? (implementationCost / (moneySaved / 12)) : 0;
    
    // Calcular porcentaje de adopción por mes según curva
    const adoptionPercentages = (() => {
      const result = [];
      
      for (let i = 1; i <= 12; i++) {
        let percentage;
        
        switch (adoptionCurveType) {
          case 'linear':
            percentage = (i / 12) * 100;
            break;
          case 'exponential':
            // Curva S basada en punto de inflexión
            const midpoint = inflectionPoint;
            const steepness = 1.0;
            percentage = 100 / (1 + Math.exp(-steepness * (i - midpoint)));
            break;
          case 'custom':
            // Curva personalizada basada en punto de inflexión
            const skew = inflectionPoint / 6;
            percentage = 100 * Math.pow(i / 12, 1/skew);
            break;
          default:
            percentage = (i / 12) * 100;
        }
        
        result.push(Math.min(100, Math.max(0, percentage))); // Asegurar entre 0-100%
      }
      
      return result;
    })();
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Paso 1: Crear datos de ahorro mensual básicos sin información de punto de equilibrio
    const monthlySavingsBase = monthNames.map((month, i) => {
      const monthIndex = i;
      const adoptionPercentage = adoptionPercentages[monthIndex];
      const adoptionFactor = adoptionPercentage / 100;
      
      // Calcular valores mensuales basados en adopción
      const monthlyHours = (hoursSaved / 12) * adoptionFactor;
      const monthlyFte = (fteEquivalent / 12) * adoptionFactor;
      const monthlySaving = (moneySaved / 12) * adoptionFactor;
      
      // Calcular valores acumulados
      let cumulativeHours = 0;
      let cumulativeFte = 0;
      let cumulativeSaving = 0;
      
      for (let j = 0; j <= monthIndex; j++) {
        const prevAdoptionFactor = adoptionPercentages[j] / 100;
        cumulativeHours += (hoursSaved / 12) * prevAdoptionFactor;
        cumulativeFte += (fteEquivalent / 12) * prevAdoptionFactor;
        cumulativeSaving += (moneySaved / 12) * prevAdoptionFactor;
      }
      
      return {
        month,
        monthIndex: monthIndex + 1,
        adoption: adoptionPercentage,
        hours: monthlyHours,
        fte: monthlyFte,
        saving: monthlySaving,
        cumulativeHours,
        cumulativeFte,
        cumulativeSaving,
        isBreakEven: false // Valor predeterminado, se actualizará en el paso 2
      };
    });
    
    // Paso 2: Encontrar el punto de equilibrio y crear el array final
    let breakEvenMonthIndex = -1;
    
    for (let i = 0; i < monthlySavingsBase.length; i++) {
      if (monthlySavingsBase[i].cumulativeSaving >= implementationCost) {
        breakEvenMonthIndex = i;
        break;
      }
    }
    
    // Crear el array final de ahorros mensuales con información de punto de equilibrio
    const monthlySavings = monthlySavingsBase.map((data, i) => {
      return {
        ...data,
        isBreakEven: i === breakEvenMonthIndex
      };
    });
    
    // El mes de equilibrio (si existe)
    const breakEvenMonth = breakEvenMonthIndex !== -1 ? monthlySavings[breakEvenMonthIndex] : null;
    
    // Repartir el beneficio en ahorro (35%) e ingreso (65%)
    const annualSavings = moneySaved * 0.35;
    const annualRevenue = moneySaved * 0.65;
    
    // Actualizar el estado de resultados
    setResults({
      annualHours,
      costPerHour,
      hoursBefore,
      hoursAfter,
      hoursSaved,
      fteEquivalent,
      moneySaved,
      percentReduction,
      roi,
      paybackMonths,
      adoptionPercentages,
      monthlySavings,
      breakEvenMonth,
      annualSavings,
      annualRevenue
    });
    
  }, [
    timeUnitType, 
    timeUnitValue, 
    costPerYear,
    minutesBefore, 
    frequencyTypeBefore, 
    frequencyValueBefore, 
    peopleCountBefore,
    minutesAfter, 
    frequencyTypeAfter, 
    frequencyValueAfter, 
    peopleCountAfter,
    implementationCost,
    adoptionCurveType,
    inflectionPoint
  ]);
  
  // Cálculos de ROI y período de recuperación
  const roi = implementationCost > 0 ? ((results.moneySaved - implementationCost) / implementationCost * 100) : 0;
  const paybackMonths = implementationCost > 0 ? (implementationCost / (results.moneySaved / 12)) : 0;
  
  // Calcular datos de ahorro mensual con curva de adopción
  const adoptionPercentages = getAdoptionByMonth();
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  // Paso 1: Crear datos de ahorro mensual básicos sin información de punto de equilibrio
  const monthlySavingsBase = monthNames.map((month, i) => {
    const monthIndex = i;
    const adoptionPercentage = adoptionPercentages[monthIndex];
    const adoptionFactor = adoptionPercentage / 100;
    
    // Calcular valores mensuales basados en adopción
    const monthlyHours = (hoursSaved / 12) * adoptionFactor;
    const monthlyFte = (fteEquivalent / 12) * adoptionFactor;
    const monthlySaving = (moneySaved / 12) * adoptionFactor;
    
    // Calcular valores acumulados
    let cumulativeHours = 0;
    let cumulativeFte = 0;
    let cumulativeSaving = 0;
    
    for (let j = 0; j <= monthIndex; j++) {
      const prevAdoptionFactor = adoptionPercentages[j] / 100;
      cumulativeHours += (hoursSaved / 12) * prevAdoptionFactor;
      cumulativeFte += (fteEquivalent / 12) * prevAdoptionFactor;
      cumulativeSaving += (moneySaved / 12) * prevAdoptionFactor;
    }
    
    return {
      month,
      monthIndex: monthIndex + 1,
      adoption: adoptionPercentage,
      hours: monthlyHours,
      fte: monthlyFte,
      saving: monthlySaving,
      cumulativeHours,
      cumulativeFte,
      cumulativeSaving,
      isBreakEven: false // Valor predeterminado, se actualizará en el paso 2
    };
  });
  
  // Paso 2: Encontrar el punto de equilibrio y crear el array final
  let breakEvenMonthIndex = -1;
  
  for (let i = 0; i < monthlySavingsBase.length; i++) {
    if (monthlySavingsBase[i].cumulativeSaving >= implementationCost) {
      breakEvenMonthIndex = i;
      break;
    }
  }
  
  // Crear el array final de ahorros mensuales con información de punto de equilibrio
  const monthlySavings = monthlySavingsBase.map((data, i) => {
    return {
      ...data,
      isBreakEven: i === breakEvenMonthIndex
    };
  });
  
  // Obtener datos del mes seleccionado actualmente
  const currentMonthData = monthlySavings[selectedMonth - 1];
  
  // El mes de equilibrio (si existe)
  const breakEvenMonth = breakEvenMonthIndex !== -1 ? monthlySavings[breakEvenMonthIndex] : null;
  
  // Formatear número con comas
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };
  
  // Formatear número con decimales
  const formatDecimal = (num, decimals = 1) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };
  
  // Convertir colones a dólares
  const colToDollars = (colones) => {
    return colones / exchangeRate;
  };
  
  // Repartir el beneficio en ahorro (35%) e ingreso (65%)
  const calculateSavingsAndRevenue = (totalBenefit) => {
    const savings = totalBenefit * 0.35;
    const revenue = totalBenefit * 0.65;
    return { savings, revenue };
  };
  
  // Si no hay proyecto, no mostrar nada
  if (!project) {
    return <div className="p-6 text-center">Cargando datos del proyecto...</div>;
  }
  
  // Función para guardar manualmente
  const handleSaveData = () => {
    if (project) {
      const roiData = {
        fte: {
          costPerYear: parseFloat(costPerYear),
          timeUnitType,
          timeUnitValue: parseFloat(timeUnitValue)
        },
        implementationCost: parseFloat(implementationCost),
        processBefore: {
          minutes: parseFloat(minutesBefore),
          frequencyType: frequencyTypeBefore,
          frequencyValue: parseInt(frequencyValueBefore),
          peopleCount: parseInt(peopleCountBefore)
        },
        processAfter: {
          minutes: parseFloat(minutesAfter),
          frequencyType: frequencyTypeAfter,
          frequencyValue: parseInt(frequencyValueAfter),
          peopleCount: parseInt(peopleCountAfter)
        },
        adoption: {
          curveType: adoptionCurveType,
          inflectionPoint: parseInt(inflectionPoint)
        },
        results: {
          hoursSaved: parseFloat(results.hoursSaved.toFixed(2)),
          fteEquivalent: parseFloat(results.fteEquivalent.toFixed(3)),
          moneySaved: parseFloat(results.moneySaved.toFixed(2)),
          roi: parseFloat(results.roi.toFixed(2)),
          paybackMonths: parseFloat(results.paybackMonths.toFixed(2)),
          lastUpdated: new Date().toISOString()
        }
      };
      
      updateProject(projectId, { roiData });
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="roi-calculator bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-blue-600 dark:bg-blue-800 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <DollarSign className="mr-2" />
            Calculadora de ROI
          </h2>
          <p className="text-sm opacity-80">
            Calcula el retorno de inversión y tiempo de recuperación para este proyecto
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {showSaveSuccess && (
            <span className="text-sm bg-green-500 text-white px-3 py-1 rounded-md animate-fade-in-out">
              ¡Guardado con éxito!
            </span>
          )}
          <button
            onClick={handleSaveData}
            className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
          >
            <Save size={16} className="mr-2" />
            Guardar
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel de Configuración FTE */}
          <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
            <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200 flex items-center pb-2 border-b border-gray-100 dark:border-gray-600">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full mr-3">
                <User className="text-blue-600 dark:text-blue-300" size={18} />
              </div>
              Configuración FTE
            </h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Costo anual de un FTE ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input 
                  type="number" 
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white dark:bg-gray-800 dark:text-gray-200" 
                  value={Math.round(colToDollars(costPerYear))}
                  onChange={(e) => setCostPerYear(e.target.value * exchangeRate)}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Incluya salario bruto y cargas sociales
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Jornada laboral
                </label>
                <div className="relative inline-block">
                  <button 
                    onClick={() => toggleTooltip('fte')}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <HelpCircle size={16} />
                  </button>
                  {tooltips.fte && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg text-xs text-gray-600 dark:text-gray-300 z-10">
                      <p>Un FTE (Full-Time Equivalent) equivale a un empleado trabajando a tiempo completo durante un año.</p>
                      <div className="absolute bottom-0 right-3 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-700 border-r border-b border-gray-200 dark:border-gray-600"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white dark:bg-gray-800 dark:text-gray-200"
                  value={timeUnitType}
                  onChange={(e) => setTimeUnitType(e.target.value)}
                >
                  <option value="daily">Horas diarias</option>
                  <option value="weekly">Horas semanales</option>
                  <option value="monthly">Horas mensuales</option>
                </select>
                <input 
                  type="number" 
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white dark:bg-gray-800 dark:text-gray-200" 
                  value={timeUnitValue}
                  step="0.5" 
                  min="0"
                  onChange={(e) => setTimeUnitValue(Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Costo de implementación ($)
                </label>
                <div className="relative inline-block">
                  <button 
                    onClick={() => toggleTooltip('roi')}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <HelpCircle size={16} />
                  </button>
                  {tooltips.roi && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg text-xs text-gray-600 dark:text-gray-300 z-10">
                      <p>El costo estimado de implementar la mejora. Se usa para calcular el ROI y tiempo de recuperación.</p>
                      <div className="absolute bottom-0 right-3 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-700 border-r border-b border-gray-200 dark:border-gray-600"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input 
                  type="number" 
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 bg-white dark:bg-gray-800 dark:text-gray-200" 
                  value={Math.round(colToDollars(implementationCost))}
                  onChange={(e) => setImplementationCost(e.target.value * exchangeRate)}
                />
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Horas anuales:
                </label>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatNumber(annualHours)} horas
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Costo por hora:
                  </label>
                  <div className="relative inline-block ml-1">
                    <button 
                      onClick={() => toggleTooltip('hourCost')}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    >
                      <HelpCircle size={14} />
                    </button>
                    {tooltips.hourCost && (
                      <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg text-xs text-gray-600 dark:text-gray-300 z-10">
                        <p>Costo anual total dividido entre las horas laborables al año.</p>
                        <div className="absolute bottom-0 left-3 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-700 border-r border-b border-gray-200 dark:border-gray-600"></div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  ${formatDecimal(colToDollars(costPerHour), 2)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Panel de Proceso Antes */}
          <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-red-200 dark:border-red-900/30 shadow-sm">
            <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200 flex items-center pb-2 border-b border-red-100 dark:border-red-900/20">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full mr-3">
                <Clock className="text-red-600 dark:text-red-400" size={18} />
              </div>
              Antes de mejorar
            </h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Minutos por ejecución
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  className="w-full pl-10 pr-3 py-2 border border-red-200 dark:border-red-900/30 rounded-lg focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 bg-white dark:bg-gray-800 dark:text-gray-200" 
                  value={minutesBefore}
                  step="0.5"
                  min="0"
                  onChange={(e) => setMinutesBefore(Number(e.target.value))}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 dark:text-red-300 text-sm">min</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Frecuencia de ejecución
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className="pl-9 pr-3 py-2 border border-red-200 dark:border-red-900/30 rounded-lg focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 bg-white dark:bg-gray-800 dark:text-gray-200 appearance-none"
                  value={frequencyTypeBefore}
                  onChange={(e) => setFrequencyTypeBefore(e.target.value)}
                >
                  {Object.entries({
                    'daily': 'Diario',
                    'weekly': 'Semanal',
                    'monthly': 'Mensual',
                    'quarterly': 'Trimestral',
                    'semiannual': 'Semestral',
                    'annual': 'Anual'
                  }).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-red-200 dark:border-red-900/30 rounded-lg focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 bg-white dark:bg-gray-800 dark:text-gray-200" 
                    value={frequencyValueBefore}
                    min="1"
                    onChange={(e) => setFrequencyValueBefore(Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-400 dark:text-red-300 text-sm">veces</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {frequencyValueBefore} {frequencyValueBefore === 1 ? 'vez' : 'veces'} {
                  frequencyTypeBefore === 'daily' ? 'al día' :
                  frequencyTypeBefore === 'weekly' ? 'a la semana' :
                  frequencyTypeBefore === 'monthly' ? 'al mes' :
                  frequencyTypeBefore === 'quarterly' ? 'al trimestre' :
                  frequencyTypeBefore === 'semiannual' ? 'al semestre' : 'al año'
                }
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Número de personas
              </label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-red-200 dark:border-red-900/30 rounded-lg focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 bg-white dark:bg-gray-800 dark:text-gray-200" 
                value={peopleCountBefore}
                min="1"
                onChange={(e) => setPeopleCountBefore(Number(e.target.value))}
              />
            </div>
            
            <div className="mt-5 pt-4 border-t border-red-100 dark:border-red-900/20">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Horas anuales:
                </label>
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatNumber(hoursBefore)} horas
                </span>
              </div>
            </div>
          </div>
          
          {/* Panel de Proceso Después */}
          <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-green-200 dark:border-green-900/30 shadow-sm">
            <h4 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200 flex items-center pb-2 border-b border-green-100 dark:border-green-900/20">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                <TrendingUp className="text-green-600 dark:text-green-400" size={18} />
              </div>
              Después de mejorar
            </h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Minutos por ejecución
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  className="w-full pl-10 pr-3 py-2 border border-green-200 dark:border-green-900/30 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 bg-white dark:bg-gray-800 dark:text-gray-200" 
                  value={minutesAfter}
                  step="0.5"
                  min="0"
                  onChange={(e) => setMinutesAfter(Number(e.target.value))}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 dark:text-green-300 text-sm">min</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Frecuencia de ejecución
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className="pl-9 pr-3 py-2 border border-green-200 dark:border-green-900/30 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 bg-white dark:bg-gray-800 dark:text-gray-200 appearance-none"
                  value={frequencyTypeAfter}
                  onChange={(e) => setFrequencyTypeAfter(e.target.value)}
                >
                  {Object.entries({
                    'daily': 'Diario',
                    'weekly': 'Semanal',
                    'monthly': 'Mensual',
                    'quarterly': 'Trimestral',
                    'semiannual': 'Semestral',
                    'annual': 'Anual'
                  }).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-green-200 dark:border-green-900/30 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 bg-white dark:bg-gray-800 dark:text-gray-200" 
                    value={frequencyValueAfter}
                    min="1"
                    onChange={(e) => setFrequencyValueAfter(Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-400 dark:text-green-300 text-sm">veces</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {frequencyValueAfter} {frequencyValueAfter === 1 ? 'vez' : 'veces'} {
                  frequencyTypeAfter === 'daily' ? 'al día' :
                  frequencyTypeAfter === 'weekly' ? 'a la semana' :
                  frequencyTypeAfter === 'monthly' ? 'al mes' :
                  frequencyTypeAfter === 'quarterly' ? 'al trimestre' :
                  frequencyTypeAfter === 'semiannual' ? 'al semestre' : 'al año'
                }
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Número de personas
              </label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-green-200 dark:border-green-900/30 rounded-lg focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 bg-white dark:bg-gray-800 dark:text-gray-200" 
                value={peopleCountAfter}
                min="1"
                onChange={(e) => setPeopleCountAfter(Number(e.target.value))}
              />
            </div>
            
            <div className="mt-5 pt-4 border-t border-green-100 dark:border-green-900/20">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Horas anuales:
                </label>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formatNumber(hoursAfter)} horas
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sección de Resultados */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800/30 shadow-sm">
          <h4 className="font-semibold text-xl mb-6 text-gray-800 dark:text-gray-200 flex items-center">
            <BarChart2 className="mr-2" />
            Resultados del Proyecto
          </h4>
          
          {/* Barra de progreso mostrando la reducción */}
          <div className="mb-8">
            <div className="flex justify-between mb-2 items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">Reducción de tiempo</span>
              <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{percentReduction.toFixed(0)}%</span>
            </div>
            <div className="h-4 bg-red-100 dark:bg-red-900/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-400 dark:to-blue-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentReduction > 100 ? 100 : percentReduction}%` }}
              >
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Proceso original: {formatNumber(hoursBefore)} horas/año</span>
              <span>Proceso optimizado: {formatNumber(hoursAfter)} horas/año</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Horas ahorradas</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(hoursSaved)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  horas/año
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">FTE equivalentes</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatDecimal(fteEquivalent)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  personal tiempo completo
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">ROI primer año</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatDecimal(roi > 0 ? roi : 0)}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  retorno de inversión
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tiempo de recuperación</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatDecimal(paybackMonths)} <span className="text-sm font-normal">meses</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {paybackMonths <= 8 ? 
                    <span className="text-green-500 dark:text-green-400">✓ Inferior a 8 meses</span> : 
                    <span className="text-yellow-500 dark:text-yellow-400">! Superior a 8 meses</span>
                  }
                </div>
              </div>
            </div>
          </div>
          
          {/* Distribución del Beneficio */}
          <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 mb-6">
            <h5 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">
              Distribución del Beneficio Total: ${formatNumber(colToDollars(moneySaved))}
            </h5>
            
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/3 mb-6 md:mb-0">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 rounded-full overflow-hidden" 
                    style={{background: 'conic-gradient(#4c1d95 0% 35%, #2563eb 35% 100%)'}}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-full w-20 h-20 flex items-center justify-center">
                      <DollarSign className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <div className="flex justify-center space-x-4">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-purple-800 dark:bg-purple-700 inline-block mr-1"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Ahorro (35%)</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500 inline-block mr-1"></span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Ingresos (65%)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full mr-3">
                        <Clock className="text-purple-800 dark:text-purple-400" size={16} />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 dark:text-gray-200">Ahorro por Automatización</h5>
                        <p className="text-lg font-bold mt-1 text-purple-800 dark:text-purple-400">
                          ${formatNumber(colToDollars(annualSavings))} <span className="text-sm font-normal">/año</span>
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Equivale a {formatDecimal(fteEquivalent)} FTE liberados para tareas de mayor valor
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                        <TrendingUp className="text-blue-600 dark:text-blue-400" size={16} />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 dark:text-gray-200">Incremento de Ingresos</h5>
                        <p className="text-lg font-bold mt-1 text-blue-600 dark:text-blue-400">
                          ${formatNumber(colToDollars(annualRevenue))} <span className="text-sm font-normal">/año</span>
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Mediante optimización de procesos y mejor tasa de servicio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sección Timeline - Opcional, puede ocultarse/mostrarse */}
          <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h5 className="font-semibold text-lg mb-3 md:mb-0 text-gray-800 dark:text-gray-200 flex items-center">
                <Calendar className="mr-2" size={18} />
                Línea Temporal de Recuperación
              </h5>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`px-3 py-1 rounded-md text-sm flex items-center ${
                    isAutoPlaying 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {isAutoPlaying ? (
                    <>
                      <PauseCircle className="mr-1" size={16} />
                      Pausar
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-1" size={16} />
                      Animar
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="relative my-8">
              {/* Timeline line */}
              <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-600"></div>
              
              {/* Journey path */}
              <div 
                className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 dark:from-green-400 dark:to-blue-400 rounded transition-all"
                style={{ width: `${(selectedMonth / 12) * 100}%` }}
              ></div>
              
              {/* Month markers */}
              <div className="flex justify-between relative">
                {monthNames.map((month, i) => {
                  const isSelected = selectedMonth === i + 1;
                  const isPassed = selectedMonth > i + 1;
                  const isBreakEven = monthlySavings[i].isBreakEven;
                  
                  return (
                    <div 
                      key={i}
                      className="flex flex-col items-center cursor-pointer"
                      onClick={() => setSelectedMonth(i + 1)}
                    >
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center
                        ${isSelected ? 'bg-blue-500 dark:bg-blue-400 text-white transform scale-125 shadow-lg' : 
                          isPassed ? 'bg-blue-400/60 dark:bg-blue-500/60 text-white' : 
                          'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                        ${isBreakEven ? 'ring-2 ring-green-500 dark:ring-green-400 ring-offset-2 dark:ring-offset-gray-800' : ''}
                        transition-all duration-300 text-xs font-medium
                      `}>
                        {i + 1}
                      </div>
                      
                      <span className={`text-xs mt-2 ${isSelected ? 'font-medium' : ''} ${isSelected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Context message */}
            <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              {selectedMonth === 12 ? (
                <p>
                  ¡Enhorabuena! Has completado un año de implementación, logrando un ahorro total de ${formatNumber(colToDollars(currentMonthData.cumulativeSaving))}.
                  {breakEvenMonth && ` Alcanzaste el punto de equilibrio en el mes ${breakEvenMonth.monthIndex}.`}
                </p>
              ) : currentMonthData.isBreakEven ? (
                <p>
                  <strong>¡Punto de equilibrio alcanzado!</strong> En el mes {selectedMonth} recuperas tu inversión inicial de ${formatNumber(colToDollars(implementationCost))}.
                  Todo ahorro a partir de ahora es beneficio neto.
                </p>
              ) : breakEvenMonth && selectedMonth > breakEvenMonth.monthIndex ? (
                <p>
                  Con un {currentMonthData.adoption.toFixed(0)}% de adopción, este mes generas ${formatNumber(colToDollars(currentMonthData.saving))} de ahorro.
                  Ya has superado el punto de equilibrio (mes {breakEvenMonth.monthIndex}).
                </p>
              ) : (
                <p>
                  En el mes {selectedMonth}, con un {currentMonthData.adoption.toFixed(0)}% de adopción, estás ahorrando ${formatNumber(colToDollars(currentMonthData.saving))}.
                  Has acumulado un ahorro de ${formatNumber(colToDollars(currentMonthData.cumulativeSaving))}.
                </p>
              )}
            </div>
            
            {/* Month details */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Mes {selectedMonth}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-md font-medium text-blue-600 dark:text-blue-400">
                      ${formatNumber(colToDollars(currentMonthData.saving))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Acumulado</span>
                  </div>
                  <div className="text-right">
                    <div className="text-md font-medium text-blue-600 dark:text-blue-400">
                      ${formatNumber(colToDollars(currentMonthData.cumulativeSaving))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sliders className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Adopción</span>
                  </div>
                  <div className="text-right">
                    <div className="text-md font-medium text-blue-600 dark:text-blue-400">
                      {currentMonthData.adoption.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoiCalculator;
