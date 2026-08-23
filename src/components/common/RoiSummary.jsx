import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { formatCurrency, formatNumber, formatPercent, formatRelative } from '../../lib/format';
import { fadeInUp, staggerContainer } from '../../lib/motion';
import GradientButton from './GradientButton';
import EmptyState from './EmptyState';

const COUNT_UP_MS = 600;

/**
 * Monto en colones que hace un count-up de ~600ms la primera vez que entra en
 * el viewport. Bajo `prefers-reduced-motion` pinta el valor final directamente.
 *
 * @param {Object} props
 * @param {number} props.value - Monto en CRC a animar.
 * @param {string} [props.className]
 */
function CurrencyCountUp({ value, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (shouldReduceMotion) {
      setDisplay(value);
      return;
    }
    let frameId;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / COUNT_UP_MS, 1);
      setDisplay(Math.round(value * progress));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [inView, shouldReduceMotion, value]);

  return (
    <span ref={ref} className={className}>
      {formatCurrency(display)}
    </span>
  );
}

/**
 * Resumen del ROI de un proyecto: ROI, payback, ahorro estimado, horas
 * ahorradas, equivalente FTE y costo de implementación, todos leídos de
 * `project.roiData.results` (sin desgloses ni cifras inventadas).
 *
 * @param {Object} props
 * @param {string} props.projectId
 * @param {string} [props.className]
 */
const RoiSummary = ({ projectId, className = '' }) => {
  const { getProject } = useLeanSixSigma();
  const project = getProject(projectId);
  const results = project?.roiData?.results;

  if (!project || !results) {
    return (
      <EmptyState
        variant="sin-datos"
        size="sm"
        title="Análisis financiero pendiente"
        description="Utiliza la calculadora de ROI para evaluar el impacto financiero de este proyecto."
        action={
          <GradientButton size="sm" to={`/projects/${projectId}/tools/roi-calculator`}>
            Calcular ROI
          </GradientButton>
        }
        className={className}
      />
    );
  }

  const { hoursSaved, fteEquivalent, moneySaved, roi, paybackMonths, lastUpdated } = results;
  const isGoodRoi = paybackMonths <= 8;

  return (
    <motion.div
      className={`card overflow-hidden ${className}`}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line-subtle px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
          <DollarSign size={16} className="text-content-secondary" aria-hidden="true" />
          Análisis financiero
        </h3>
        {lastUpdated && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-content-muted">
            <Clock size={12} aria-hidden="true" />
            Actualizado {formatRelative(lastUpdated)}
          </span>
        )}
      </div>

      <div className="space-y-4 p-5">
        <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isGoodRoi ? 'bg-success-soft text-success-on' : 'bg-warning-soft text-warning-on'
              }`}
            >
              {isGoodRoi ? (
                <TrendingUp size={18} aria-hidden="true" />
              ) : (
                <AlertCircle size={18} aria-hidden="true" />
              )}
            </span>
            <div>
              <div className="text-xs text-content-muted">ROI del proyecto</div>
              <div className="text-xl font-bold tabular-nums text-content">{formatPercent(roi, 1)}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-content-muted">Payback</div>
            <div className="text-xl font-bold tabular-nums text-content">
              {formatNumber(paybackMonths, { maximumFractionDigits: 1 })}{' '}
              <span className="text-sm font-normal text-content-secondary">meses</span>
            </div>
            <div className="text-2xs text-content-muted">Payback objetivo: 8 meses</div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-surface-sunken p-3">
            <div className="text-xs text-content-muted">Ahorro estimado</div>
            <CurrencyCountUp value={moneySaved} className="text-lg font-bold tabular-nums text-content" />
          </div>
          <div className="rounded-lg bg-surface-sunken p-3">
            <div className="text-xs text-content-muted">Horas ahorradas</div>
            <div className="text-lg font-bold tabular-nums text-content">{formatNumber(hoursSaved)}</div>
          </div>
          <div className="rounded-lg bg-surface-sunken p-3">
            <div className="text-xs text-content-muted">Equivalente FTE</div>
            <div className="text-lg font-bold tabular-nums text-content">
              {formatNumber(fteEquivalent, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="rounded-lg bg-surface-sunken p-3">
            <div className="text-xs text-content-muted">Costo de implementación</div>
            <div className="text-lg font-bold tabular-nums text-content">
              {formatCurrency(project.roiData.implementationCost)}
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="flex items-center justify-end border-t border-line-subtle pt-3">
          <Link
            to={`/projects/${projectId}/tools/roi-calculator`}
            className="rounded text-xs font-medium text-brand transition-colors duration-fast hover:text-brand-hover"
          >
            Ver detalles
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default RoiSummary;
