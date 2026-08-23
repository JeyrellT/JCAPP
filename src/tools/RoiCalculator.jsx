import { useEffect, useMemo, useRef, useState } from 'react';
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
  Check,
  Loader2,
  AlertTriangle,
  Eye,
  Undo2,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatNumber, formatPercent, formatCurrency, formatRelative } from '../lib/format';
import { transition } from '../lib/motion';

const TOOL_ID = 'roi-calculator';

// Forma completa del estado vacío, alineada a la semilla de src/data/projects.js
// (project.tools['roi-calculator'].data) y a lo que hoy vivía en la raíz del
// proyecto como `project.roiData` (rescatado vía `legacy`).
const DEFAULT_DATA = {
  fte: {
    costPerYear: 0,
    timeUnitType: 'monthly', // 'daily' | 'weekly' | 'monthly'
    timeUnitValue: 0,
  },
  implementationCost: 0,
  processBefore: {
    minutes: 0,
    frequencyType: 'monthly',
    frequencyValue: 0,
    peopleCount: 1,
  },
  processAfter: {
    minutes: 0,
    frequencyType: 'monthly',
    frequencyValue: 0,
    peopleCount: 1,
  },
  adoption: {
    curveType: 'linear', // 'linear' | 'exponential' | 'custom'
    inflectionPoint: 6,
  },
};

// El ejemplo de src/data/toolsData.js guarda sus campos en un solo nivel
// (costPerYear, minutesBefore, frequencyTypeBefore...) mientras el estado de
// esta herramienta es anidado (fte.costPerYear, processBefore.minutes...).
// Se traduce aquí en vez de deformar el estado local.
function adaptRoiExample(example, defaultData) {
  return {
    ...defaultData,
    fte: {
      costPerYear: example.costPerYear ?? defaultData.fte.costPerYear,
      timeUnitType: example.timeUnitType ?? defaultData.fte.timeUnitType,
      timeUnitValue: example.timeUnitValue ?? defaultData.fte.timeUnitValue,
    },
    implementationCost: example.implementationCost ?? defaultData.implementationCost,
    processBefore: {
      minutes: example.minutesBefore ?? defaultData.processBefore.minutes,
      frequencyType: example.frequencyTypeBefore ?? defaultData.processBefore.frequencyType,
      frequencyValue: example.frequencyValueBefore ?? defaultData.processBefore.frequencyValue,
      peopleCount: example.peopleCountBefore ?? defaultData.processBefore.peopleCount,
    },
    processAfter: {
      minutes: example.minutesAfter ?? defaultData.processAfter.minutes,
      frequencyType: example.frequencyTypeAfter ?? defaultData.processAfter.frequencyType,
      frequencyValue: example.frequencyValueAfter ?? defaultData.processAfter.frequencyValue,
      peopleCount: example.peopleCountAfter ?? defaultData.processAfter.peopleCount,
    },
    adoption: defaultData.adoption,
  };
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const TIME_UNIT_LABELS = { daily: 'Horas diarias', weekly: 'Horas semanales', monthly: 'Horas mensuales' };
const ANNUAL_WORK_HOURS_FACTOR = { daily: 260, weekly: 52, monthly: 12 };

const FREQUENCY_LABELS = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};
const FREQUENCY_SUFFIX = {
  daily: 'al día',
  weekly: 'a la semana',
  monthly: 'al mes',
  quarterly: 'al trimestre',
  semiannual: 'al semestre',
  annual: 'al año',
};
const ANNUAL_FREQUENCY_FACTOR = { daily: 365, weekly: 52, monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };

const ANIMATION_INTERVAL_MS = 2500;

function annualHoursFromFte(timeUnitType, timeUnitValue) {
  const factor = ANNUAL_WORK_HOURS_FACTOR[timeUnitType] ?? ANNUAL_WORK_HOURS_FACTOR.monthly;
  return (Number(timeUnitValue) || 0) * factor;
}

function processAnnualHours(minutes, frequencyType, frequencyValue, peopleCount) {
  const hoursPerExecution = (Number(minutes) || 0) / 60;
  const executionsPerYear = (Number(frequencyValue) || 0) * (ANNUAL_FREQUENCY_FACTOR[frequencyType] ?? ANNUAL_FREQUENCY_FACTOR.monthly);
  return hoursPerExecution * executionsPerYear * (Number(peopleCount) || 0);
}

function adoptionByMonth(curveType, inflectionPoint) {
  const percentages = [];
  for (let month = 1; month <= 12; month += 1) {
    let percentage;
    switch (curveType) {
      case 'exponential':
        percentage = 100 / (1 + Math.exp(-1 * (month - inflectionPoint)));
        break;
      case 'custom': {
        const skew = inflectionPoint / 6 || 1;
        percentage = 100 * Math.pow(month / 12, 1 / skew);
        break;
      }
      case 'linear':
      default:
        percentage = (month / 12) * 100;
    }
    percentages.push(Math.min(100, Math.max(0, percentage)));
  }
  return percentages;
}

/**
 * Toda la matemática del ROI en un único lugar, puro y derivado de `data`.
 * Antes vivía duplicada: una copia dentro de un useEffect que escribía a un
 * `useState` separado (y cuyas variables internas la JSX referenciaba sin
 * que existieran en su alcance — el componente literalmente no podía
 * renderizar), y otra copia casi idéntica fuera del efecto. Se unifica aquí.
 */
function calculateRoi(data) {
  const { fte, implementationCost, processBefore, processAfter, adoption } = data;

  const annualHours = annualHoursFromFte(fte.timeUnitType, fte.timeUnitValue);
  const costPerHour = annualHours > 0 ? fte.costPerYear / annualHours : 0;

  const hoursBefore = processAnnualHours(
    processBefore.minutes,
    processBefore.frequencyType,
    processBefore.frequencyValue,
    processBefore.peopleCount
  );
  const hoursAfter = processAnnualHours(
    processAfter.minutes,
    processAfter.frequencyType,
    processAfter.frequencyValue,
    processAfter.peopleCount
  );
  const hoursSaved = Math.max(0, hoursBefore - hoursAfter);
  const fteEquivalent = annualHours > 0 ? hoursSaved / annualHours : 0;
  const moneySaved = hoursSaved * costPerHour;
  const percentReduction = hoursBefore > 0 ? ((hoursBefore - hoursAfter) / hoursBefore) * 100 : 0;

  const roi = implementationCost > 0 ? ((moneySaved - implementationCost) / implementationCost) * 100 : 0;
  const paybackMonths = implementationCost > 0 && moneySaved > 0 ? implementationCost / (moneySaved / 12) : 0;

  const adoptionPercentages = adoptionByMonth(adoption.curveType, adoption.inflectionPoint);

  let cumulativeHours = 0;
  let cumulativeFte = 0;
  let cumulativeSaving = 0;
  let breakEvenMonthIndex = -1;

  const monthlySavings = MONTH_NAMES.map((month, index) => {
    const adoptionFactor = adoptionPercentages[index] / 100;
    const monthlyHours = (hoursSaved / 12) * adoptionFactor;
    const monthlyFte = (fteEquivalent / 12) * adoptionFactor;
    const monthlySaving = (moneySaved / 12) * adoptionFactor;

    cumulativeHours += monthlyHours;
    cumulativeFte += monthlyFte;
    cumulativeSaving += monthlySaving;

    if (breakEvenMonthIndex === -1 && implementationCost > 0 && cumulativeSaving >= implementationCost) {
      breakEvenMonthIndex = index;
    }

    return {
      month,
      monthIndex: index + 1,
      adoption: adoptionPercentages[index],
      hours: monthlyHours,
      fte: monthlyFte,
      saving: monthlySaving,
      cumulativeHours,
      cumulativeFte,
      cumulativeSaving,
    };
  });

  const breakEvenMonth = breakEvenMonthIndex !== -1 ? monthlySavings[breakEvenMonthIndex] : null;

  return {
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
    monthlySavings,
    breakEvenMonth,
    annualSavings: moneySaved * 0.35,
    annualRevenue: moneySaved * 0.65,
  };
}

export default function RoiCalculator({ projectId }) {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, {
    adaptExample: adaptRoiExample,
    legacy: (p) => p.roiData || null,
  });
  const shouldReduceMotion = useReducedMotion();

  const [exampleMode, setExampleMode] = useState(false);
  const [confirmKind, setConfirmKind] = useState(null); // 'example' | 'discard' | null
  const exampleSnapshotRef = useRef(null);

  const [formStarted, setFormStarted] = useState(false);
  const [tooltip, setTooltip] = useState(null); // 'fte' | 'roi' | 'hourCost' | null
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    if (!isAutoPlaying) return undefined;
    const id = setInterval(() => {
      setSelectedMonth((prev) => (prev >= 12 ? 1 : prev + 1));
    }, ANIMATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAutoPlaying]);

  const calc = useMemo(() => calculateRoi(t.data), [t.data]);

  if (!t.ready) return null;

  const { fte, implementationCost, processBefore, processAfter } = t.data;
  const hasMeaningfulData =
    fte.costPerYear > 0 || implementationCost > 0 || processBefore.minutes > 0 || processAfter.minutes > 0;
  const isEmpty = !hasMeaningfulData && !formStarted;
  const currentMonthData = calc.monthlySavings[selectedMonth - 1];

  // --- Edición de campos ---------------------------------------------------
  const patchFte = (partial) => t.setData((prev) => ({ ...prev, fte: { ...prev.fte, ...partial } }));
  const patchProcessBefore = (partial) =>
    t.setData((prev) => ({ ...prev, processBefore: { ...prev.processBefore, ...partial } }));
  const patchProcessAfter = (partial) =>
    t.setData((prev) => ({ ...prev, processAfter: { ...prev.processAfter, ...partial } }));

  // --- Modo ejemplo --------------------------------------------------------
  const openExample = () => {
    if (t.isDirty) {
      setConfirmKind('example');
      return;
    }
    applyExample();
  };

  const applyExample = () => {
    exampleSnapshotRef.current = t.data;
    const applied = t.loadExample(0);
    if (applied) {
      setExampleMode(true);
      setFormStarted(true);
    }
    setConfirmKind(null);
  };

  const adoptExample = () => {
    t.save();
    setExampleMode(false);
    exampleSnapshotRef.current = null;
  };

  const discardExample = () => {
    if (exampleSnapshotRef.current) t.setData(exampleSnapshotRef.current);
    setExampleMode(false);
    exampleSnapshotRef.current = null;
  };

  // --- Cancelar / descartar cambios ----------------------------------------
  const requestDiscard = () => {
    if (!t.isDirty) return;
    setConfirmKind('discard');
  };

  const confirmDiscard = () => {
    t.discard();
    setConfirmKind(null);
  };

  const exampleTitle = t.exampleTitles?.[0] || 'Ejemplo';

  return (
    <div className="p-4 sm:p-6">
      {/* Barra de estado + acciones */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <SaveStatus tool={t} />

        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && (
            <GradientButton
              variant="outline"
              size="sm"
              onClick={openExample}
              leadingIcon={<Eye size={14} aria-hidden="true" />}
            >
              Ver un ejemplo
            </GradientButton>
          )}
          {t.isDirty && (
            <GradientButton variant="ghost" size="sm" onClick={requestDiscard}>
              Cancelar
            </GradientButton>
          )}
          <GradientButton
            variant="success"
            size="sm"
            disabled={!t.isDirty || t.isSaving}
            onClick={() => t.save()}
            leadingIcon={t.isSaving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
          >
            Guardar
          </GradientButton>
        </div>
      </div>

      {/* Banner de modo ejemplo */}
      <AnimatePresence>
        {exampleMode && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transition.base}
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info/30 bg-info-soft px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-info px-2 py-0.5 text-xs font-medium text-white">Ejemplo</span>
              <span className="font-medium text-content">{exampleTitle}</span>
              <span className="text-content-secondary">
                Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GradientButton variant="outline" size="sm" onClick={discardExample} leadingIcon={<Undo2 size={14} aria-hidden="true" />}>
                Deshacer
              </GradientButton>
              <GradientButton variant="solid" size="sm" onClick={adoptExample}>
                Usar como punto de partida
              </GradientButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={exampleMode ? 'space-y-6 rounded-xl ring-1 ring-info/30 p-1' : 'space-y-6'}>
        {isEmpty ? (
          <EmptyState
            title="Traduce la mejora a colones"
            description="Ingresa costos y beneficios para calcular retorno y periodo de recuperación."
            action={
              <GradientButton onClick={() => setFormStarted(true)} leadingIcon={<Plus size={16} aria-hidden="true" />}>
                Ingresar costos
              </GradientButton>
            }
            secondaryAction={
              t.hasExamples && (
                <GradientButton variant="outline" onClick={openExample}>
                  Ver un ejemplo
                </GradientButton>
              )
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Panel de Configuración FTE */}
              <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
                <h4 className="mb-4 flex items-center border-b border-line-subtle pb-2 text-lg font-semibold text-content">
                  <div className="mr-3 rounded-full bg-info-soft p-2">
                    <User className="text-info-on" size={18} aria-hidden="true" />
                  </div>
                  Configuración FTE
                </h4>

                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-content-secondary" htmlFor="roi-cost-per-year">
                    Costo anual de un FTE (₡)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">₡</span>
                    <input
                      id="roi-cost-per-year"
                      type="number"
                      min="0"
                      className="input pl-8 tabular-nums"
                      value={fte.costPerYear}
                      onChange={(e) => patchFte({ costPerYear: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </div>
                  <div className="mt-1 text-xs text-content-muted">Incluya salario bruto y cargas sociales</div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <label className="mb-1 block text-sm font-medium text-content-secondary">Jornada laboral</label>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setTooltip((v) => (v === 'fte' ? null : 'fte'))}
                        className="text-content-muted hover:text-content-secondary"
                        aria-label="Qué es un FTE"
                      >
                        <HelpCircle size={16} aria-hidden="true" />
                      </button>
                      {tooltip === 'fte' && (
                        <div className="absolute right-0 bottom-full z-10 mb-2 w-64 rounded-lg border border-line bg-surface-raised p-3 text-xs text-content-secondary shadow-lg">
                          <p>Un FTE (Full-Time Equivalent) equivale a un empleado trabajando a tiempo completo durante un año.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      className="input appearance-none"
                      value={fte.timeUnitType}
                      onChange={(e) => patchFte({ timeUnitType: e.target.value })}
                      aria-label="Unidad de la jornada laboral"
                    >
                      {Object.entries(TIME_UNIT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="input tabular-nums"
                      value={fte.timeUnitValue}
                      onChange={(e) => patchFte({ timeUnitValue: Math.max(0, Number(e.target.value) || 0) })}
                      aria-label="Valor de la jornada laboral"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <label className="mb-1 block text-sm font-medium text-content-secondary" htmlFor="roi-implementation-cost">
                      Costo de implementación (₡)
                    </label>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setTooltip((v) => (v === 'roi' ? null : 'roi'))}
                        className="text-content-muted hover:text-content-secondary"
                        aria-label="Qué es el costo de implementación"
                      >
                        <HelpCircle size={16} aria-hidden="true" />
                      </button>
                      {tooltip === 'roi' && (
                        <div className="absolute right-0 bottom-full z-10 mb-2 w-64 rounded-lg border border-line bg-surface-raised p-3 text-xs text-content-secondary shadow-lg">
                          <p>El costo estimado de implementar la mejora. Se usa para calcular el ROI y tiempo de recuperación.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">₡</span>
                    <input
                      id="roi-implementation-cost"
                      type="number"
                      min="0"
                      className="input pl-8 tabular-nums"
                      value={implementationCost}
                      onChange={(e) => t.patch({ implementationCost: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </div>
                </div>

                <div className="mt-5 border-t border-line-subtle pt-4">
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-content-secondary">Horas anuales:</span>
                    <span className="font-semibold tabular-nums text-info-on">{formatNumber(calc.annualHours)} horas</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-content-secondary">Costo por hora:</span>
                      <div className="relative ml-1 inline-block">
                        <button
                          type="button"
                          onClick={() => setTooltip((v) => (v === 'hourCost' ? null : 'hourCost'))}
                          className="text-content-muted hover:text-content-secondary"
                          aria-label="Cómo se calcula el costo por hora"
                        >
                          <HelpCircle size={14} aria-hidden="true" />
                        </button>
                        {tooltip === 'hourCost' && (
                          <div className="absolute left-0 bottom-full z-10 mb-2 w-64 rounded-lg border border-line bg-surface-raised p-3 text-xs text-content-secondary shadow-lg">
                            <p>Costo anual total dividido entre las horas laborables al año.</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold tabular-nums text-info-on">{formatCurrency(calc.costPerHour, 'CRC')}</span>
                  </div>
                </div>
              </div>

              {/* Panel de Proceso Antes */}
              <ProcessPanel
                tone="danger"
                title="Antes de mejorar"
                icon={<Clock className="text-danger-on" size={18} aria-hidden="true" />}
                process={processBefore}
                onChange={patchProcessBefore}
                annualHours={calc.hoursBefore}
              />

              {/* Panel de Proceso Después */}
              <ProcessPanel
                tone="success"
                title="Después de mejorar"
                icon={<TrendingUp className="text-success-on" size={18} aria-hidden="true" />}
                process={processAfter}
                onChange={patchProcessAfter}
                annualHours={calc.hoursAfter}
              />
            </div>

            {/* Sección de Resultados */}
            <div className="rounded-xl border border-line bg-surface-sunken p-6">
              <h4 className="mb-6 flex items-center text-xl font-semibold text-content">
                <BarChart2 className="mr-2" aria-hidden="true" />
                Resultados del proyecto
              </h4>

              <div className="mb-8">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-content-secondary">Reducción de tiempo</span>
                  <span className="text-2xl font-bold tabular-nums text-brand">{formatPercent(calc.percentReduction, 0)}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-danger-soft">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, calc.percentReduction))}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs tabular-nums text-content-muted">
                  <span>Proceso original: {formatNumber(calc.hoursBefore)} horas/año</span>
                  <span>Proceso optimizado: {formatNumber(calc.hoursAfter)} horas/año</span>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <ResultCard label="Horas ahorradas" value={formatNumber(calc.hoursSaved)} sub="horas/año" />
                <ResultCard label="FTE equivalentes" value={formatNumber(calc.fteEquivalent, { maximumFractionDigits: 2 })} sub="personal tiempo completo" />
                <ResultCard label="ROI primer año" value={formatPercent(Math.max(0, calc.roi), 1)} sub="retorno de inversión" />
                <ResultCard
                  label="Tiempo de recuperación"
                  value={
                    <>
                      {formatNumber(calc.paybackMonths, { maximumFractionDigits: 1 })} <span className="text-sm font-normal">meses</span>
                    </>
                  }
                  sub={
                    calc.paybackMonths > 0 && calc.paybackMonths <= 8 ? (
                      <span className="text-success-on">Inferior a 8 meses</span>
                    ) : (
                      <span className="text-warning-on">Superior a 8 meses</span>
                    )
                  }
                />
              </div>

              {/* Distribución del Beneficio */}
              <div className="mb-6 rounded-xl border border-line bg-surface p-4 shadow-xs">
                <h5 className="mb-4 text-lg font-semibold text-content">
                  Distribución del beneficio total: {formatCurrency(calc.moneySaved, 'CRC')}
                </h5>

                <div className="flex flex-col items-center justify-between md:flex-row">
                  <div className="mb-6 md:mb-0 md:w-1/3">
                    <div className="relative mx-auto h-32 w-32">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background:
                            'conic-gradient(rgb(var(--jc-info)) 0% 35%, rgb(var(--jc-brand)) 35% 100%)',
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
                          <DollarSign className="text-brand" size={20} aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-4 text-center">
                      <span className="flex items-center gap-1 text-xs text-content-secondary">
                        <span className="inline-block h-3 w-3 rounded-full bg-info" aria-hidden="true" /> Ahorro (35%)
                      </span>
                      <span className="flex items-center gap-1 text-xs text-content-secondary">
                        <span className="inline-block h-3 w-3 rounded-full bg-brand" aria-hidden="true" /> Ingresos (65%)
                      </span>
                    </div>
                  </div>

                  <div className="md:w-2/3">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-surface-sunken p-3">
                        <div className="flex items-center">
                          <div className="mr-3 rounded-full bg-info-soft p-2">
                            <Clock className="text-info-on" size={16} aria-hidden="true" />
                          </div>
                          <div>
                            <h5 className="font-medium text-content">Ahorro por automatización</h5>
                            <p className="mt-1 text-lg font-bold tabular-nums text-info-on">
                              {formatCurrency(calc.annualSavings, 'CRC')} <span className="text-sm font-normal">/año</span>
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-content-muted">
                          Equivale a {formatNumber(calc.fteEquivalent, { maximumFractionDigits: 2 })} FTE liberados para tareas de mayor valor
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-sunken p-3">
                        <div className="flex items-center">
                          <div className="mr-3 rounded-full bg-brand/10 p-2">
                            <TrendingUp className="text-brand" size={16} aria-hidden="true" />
                          </div>
                          <div>
                            <h5 className="font-medium text-content">Incremento de ingresos</h5>
                            <p className="mt-1 text-lg font-bold tabular-nums text-brand">
                              {formatCurrency(calc.annualRevenue, 'CRC')} <span className="text-sm font-normal">/año</span>
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-content-muted">Mediante optimización de procesos y mejor tasa de servicio</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Línea temporal de recuperación */}
              <div className="rounded-xl border border-line bg-surface p-4 shadow-xs">
                <div className="mb-4 flex flex-col items-start justify-between md:flex-row md:items-center">
                  <h5 className="mb-3 flex items-center text-lg font-semibold text-content md:mb-0">
                    <Calendar className="mr-2" size={18} aria-hidden="true" />
                    Línea temporal de recuperación
                  </h5>
                  <GradientButton
                    variant={isAutoPlaying ? 'soft' : 'outline'}
                    size="sm"
                    onClick={() => setIsAutoPlaying((v) => !v)}
                    leadingIcon={
                      isAutoPlaying ? <PauseCircle size={16} aria-hidden="true" /> : <PlayCircle size={16} aria-hidden="true" />
                    }
                  >
                    {isAutoPlaying ? 'Pausar' : 'Animar'}
                  </GradientButton>
                </div>

                <div className="relative my-8 overflow-x-auto">
                  <div className="relative min-w-[560px]">
                    <div className="absolute top-4 left-0 h-0.5 w-full bg-line" />
                    <div
                      className="absolute top-4 left-0 h-0.5 rounded bg-brand transition-all"
                      style={{ width: `${(selectedMonth / 12) * 100}%` }}
                    />

                    <div className="relative flex justify-between">
                      {MONTH_NAMES.map((month, i) => {
                        const isSelected = selectedMonth === i + 1;
                        const isPassed = selectedMonth > i + 1;
                        const isBreakEven = calc.monthlySavings[i].monthIndex === calc.breakEvenMonth?.monthIndex;

                        return (
                          <button
                            type="button"
                            key={month}
                            className="flex flex-col items-center"
                            onClick={() => setSelectedMonth(i + 1)}
                            aria-label={`Ver mes ${month}`}
                            aria-pressed={isSelected}
                          >
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all duration-base ${
                                isSelected
                                  ? 'scale-125 bg-brand text-brand-contrast shadow-md'
                                  : isPassed
                                    ? 'bg-brand/50 text-brand-contrast'
                                    : 'bg-surface-sunken text-content-muted'
                              } ${isBreakEven ? 'ring-2 ring-success ring-offset-2 ring-offset-surface' : ''}`}
                            >
                              {i + 1}
                            </div>
                            <span className={`mt-2 text-xs ${isSelected ? 'font-medium text-content' : 'text-content-muted'}`}>
                              {month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mb-4 rounded-lg bg-surface-sunken p-3 text-sm text-content-secondary">
                  <TimelineMessage selectedMonth={selectedMonth} currentMonthData={currentMonthData} breakEvenMonth={calc.breakEvenMonth} implementationCost={implementationCost} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-surface-sunken p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-content-secondary">
                        <Clock className="h-4 w-4" aria-hidden="true" /> Mes {selectedMonth}
                      </span>
                      <span className="text-md font-medium tabular-nums text-brand">{formatCurrency(currentMonthData.saving, 'CRC')}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface-sunken p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-content-secondary">
                        <TrendingUp className="h-4 w-4" aria-hidden="true" /> Acumulado
                      </span>
                      <span className="text-md font-medium tabular-nums text-brand">
                        {formatCurrency(currentMonthData.cumulativeSaving, 'CRC')}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface-sunken p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm text-content-secondary">
                        <Sliders className="h-4 w-4" aria-hidden="true" /> Adopción
                      </span>
                      <span className="text-md font-medium tabular-nums text-brand">{formatPercent(currentMonthData.adoption, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmación: cargar ejemplo con borrador sucio */}
      <Modal
        open={confirmKind === 'example'}
        onClose={() => setConfirmKind(null)}
        title="¿Cargar el ejemplo?"
        description="Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar."
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmKind(null)}>
              Cancelar
            </GradientButton>
            <GradientButton variant="solid" onClick={applyExample}>
              Ver el ejemplo
            </GradientButton>
          </>
        }
      />

      {/* Confirmación: descartar cambios sin guardar */}
      <Modal
        open={confirmKind === 'discard'}
        onClose={() => setConfirmKind(null)}
        title="¿Descartar los cambios sin guardar?"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmKind(null)}>
              Seguir editando
            </GradientButton>
            <GradientButton variant="danger" onClick={confirmDiscard}>
              Descartar
            </GradientButton>
          </>
        }
      />
    </div>
  );
}

/** Máquina de estados de guardado (idéntica a la definida para las 14 herramientas). */
function SaveStatus({ tool }) {
  let icon = <span className="h-2 w-2 rounded-full bg-content-muted" aria-hidden="true" />;
  let text = 'Sin cambios';
  let tone = 'text-content-muted';

  if (tool.error) {
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = 'No se pudo guardar';
    tone = 'text-danger-on';
  } else if (tool.isSaving) {
    icon = <Loader2 size={14} className="animate-spin" aria-hidden="true" />;
    text = 'Guardando cambios…';
    tone = 'text-content-secondary';
  } else if (tool.justSaved) {
    icon = <Check size={14} aria-hidden="true" />;
    text = 'Guardado';
    tone = 'text-success-on';
  } else if (tool.isDirty) {
    icon = <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />;
    text = 'Cambios sin guardar';
    tone = 'text-warning-on';
  } else if (tool.lastSavedAt) {
    icon = <Check size={14} aria-hidden="true" />;
    text = `Guardado ${formatRelative(tool.lastSavedAt)}`;
    tone = 'text-success-on';
  }

  return (
    <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm font-medium ${tone}`}>
      {icon}
      <span className="tabular-nums">{text}</span>
      {tool.error && (
        <button type="button" onClick={() => tool.save()} className="ml-1 underline underline-offset-2 hover:no-underline">
          Reintentar
        </button>
      )}
    </p>
  );
}

/** Tarjeta de resultado dentro de la grilla de KPIs. */
function ResultCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-xs">
      <div className="text-center">
        <div className="mb-1 text-sm text-content-secondary">{label}</div>
        <div className="text-xl font-bold tabular-nums text-brand">{value}</div>
        {sub && <div className="mt-1 text-xs text-content-muted">{sub}</div>}
      </div>
    </div>
  );
}

/** Panel "Antes de mejorar" / "Después de mejorar": mismos campos, distinto tono semántico. */
function ProcessPanel({ tone, title, icon, process, onChange, annualHours }) {
  const toneClasses = {
    danger: { border: 'border-danger/30', iconBg: 'bg-danger-soft', headerBorder: 'border-danger/20', valueColor: 'text-danger-on' },
    success: { border: 'border-success/30', iconBg: 'bg-success-soft', headerBorder: 'border-success/20', valueColor: 'text-success-on' },
  }[tone];

  return (
    <div className={`rounded-xl border ${toneClasses.border} bg-surface p-4 shadow-xs`}>
      <h4 className={`mb-4 flex items-center border-b ${toneClasses.headerBorder} pb-2 text-lg font-semibold text-content`}>
        <div className={`mr-3 rounded-full ${toneClasses.iconBg} p-2`}>{icon}</div>
        {title}
      </h4>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-content-secondary">Minutos por ejecución</label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.5"
            className="input pl-10 tabular-nums"
            value={process.minutes}
            onChange={(e) => onChange({ minutes: Math.max(0, Number(e.target.value) || 0) })}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">min</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-content-secondary">Frecuencia de ejecución</label>
        <div className="grid grid-cols-2 gap-3">
          <select
            className="input appearance-none"
            value={process.frequencyType}
            onChange={(e) => onChange({ frequencyType: e.target.value })}
            aria-label="Tipo de frecuencia"
          >
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              type="number"
              min="0"
              className="input pr-14 tabular-nums"
              value={process.frequencyValue}
              onChange={(e) => onChange({ frequencyValue: Math.max(0, Number(e.target.value) || 0) })}
              aria-label="Cantidad de veces"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">veces</span>
          </div>
        </div>
        <div className="mt-1 text-xs text-content-muted">
          {process.frequencyValue} {process.frequencyValue === 1 ? 'vez' : 'veces'} {FREQUENCY_SUFFIX[process.frequencyType]}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-content-secondary">Número de personas</label>
        <input
          type="number"
          min="1"
          className="input tabular-nums"
          value={process.peopleCount}
          onChange={(e) => onChange({ peopleCount: Math.max(0, Number(e.target.value) || 0) })}
        />
      </div>

      <div className="mt-5 border-t border-line-subtle pt-4">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-content-secondary">Horas anuales:</span>
          <span className={`font-bold tabular-nums ${toneClasses.valueColor}`}>{formatNumber(annualHours)} horas</span>
        </div>
      </div>
    </div>
  );
}

/** Mensaje contextual bajo la línea temporal, según el mes seleccionado. */
function TimelineMessage({ selectedMonth, currentMonthData, breakEvenMonth, implementationCost }) {
  if (selectedMonth === 12) {
    return (
      <p>
        Completaste un año de implementación, con un ahorro acumulado de {formatCurrency(currentMonthData.cumulativeSaving, 'CRC')}.
        {breakEvenMonth && ` Alcanzaste el punto de equilibrio en el mes ${breakEvenMonth.monthIndex}.`}
      </p>
    );
  }
  if (breakEvenMonth && selectedMonth === breakEvenMonth.monthIndex) {
    return (
      <p>
        <strong>Punto de equilibrio alcanzado.</strong> En el mes {selectedMonth} recuperas tu inversión inicial de{' '}
        {formatCurrency(implementationCost, 'CRC')}. Todo ahorro a partir de ahora es beneficio neto.
      </p>
    );
  }
  if (breakEvenMonth && selectedMonth > breakEvenMonth.monthIndex) {
    return (
      <p>
        Con un {formatPercent(currentMonthData.adoption, 0)} de adopción, este mes generas {formatCurrency(currentMonthData.saving, 'CRC')} de
        ahorro. Ya superaste el punto de equilibrio (mes {breakEvenMonth.monthIndex}).
      </p>
    );
  }
  return (
    <p>
      En el mes {selectedMonth}, con un {formatPercent(currentMonthData.adoption, 0)} de adopción, estás ahorrando{' '}
      {formatCurrency(currentMonthData.saving, 'CRC')}. Has acumulado {formatCurrency(currentMonthData.cumulativeSaving, 'CRC')}.
    </p>
  );
}
