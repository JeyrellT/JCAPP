import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Tarjeta de estadística (KPI) del sistema de diseño de JC Analytic.
 *
 * @param {Object} props
 * @param {string} props.title - Título de la estadística
 * @param {string|number} props.value - Valor de la estadística
 * @param {React.ReactNode} props.icon - Icono para la estadística
 * @param {string} [props.color="teal"] - Tono del icono. Acepta los tokens nuevos
 *   (brand, info, success, warning, danger, neutral) y los valores heredados
 *   (teal, blue, green, purple, red, orange), que se resuelven a los nuevos.
 * @param {string} [props.description] - Descripción opcional bajo el valor
 * @param {number} [props.trend] - Variación porcentual. Si es `undefined` no se
 *   renderiza ninguna fila comparativa (no se inventan tendencias sin datos).
 * @param {string} [props.trendLabel] - Etiqueta junto a la tendencia (p. ej.
 *   "vs. mes anterior"). Solo se muestra si se pasa explícitamente.
 * @param {string} [props.to] - Si se pasa, la tarjeta completa es un <Link> enfocable
 * @param {boolean} [props.loading=false] - Muestra un esqueleto de carga
 * @param {number[]} [props.sparkline] - Serie de valores para un mini gráfico de tendencia
 */

// Mapa estático de tonos sobre tokens (Tailwind no detecta clases dinámicas).
const COLOR_STYLES = {
  brand: { bg: 'bg-brand/10', text: 'text-brand' },
  info: { bg: 'bg-info-soft', text: 'text-info-on' },
  success: { bg: 'bg-success-soft', text: 'text-success-on' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning-on' },
  danger: { bg: 'bg-danger-soft', text: 'text-danger-on' },
  neutral: { bg: 'bg-surface-sunken', text: 'text-content-secondary' },
};

// Alias heredados: no rompen los usos existentes de color="blue"/"green"/etc.
const COLOR_ALIASES = {
  teal: 'brand',
  blue: 'info',
  green: 'success',
  purple: 'info',
  red: 'danger',
  orange: 'warning',
};

function Sparkline({ data }) {
  if (!Array.isArray(data) || data.length < 2) return null;

  const width = 100;
  const height = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <div className="mt-3 h-10 w-full" aria-hidden="true">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <polyline
          points={points}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-brand"
        />
      </svg>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div className="w-2/3 space-y-2.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-surface-sunken" />
          <div className="h-7 w-16 animate-pulse rounded bg-surface-sunken" />
          <div className="h-3 w-20 animate-pulse rounded bg-surface-sunken" />
        </div>
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
      </div>
    </div>
  );
}

const StatCard = ({
  title,
  value,
  icon,
  color = 'teal',
  description,
  trend,
  trendLabel,
  to,
  loading = false,
  sparkline,
}) => {
  if (loading) return <StatCardSkeleton />;

  const colorSet = COLOR_STYLES[COLOR_ALIASES[color] || color] || COLOR_STYLES.brand;
  const isNavigable = Boolean(to);
  const Wrapper = isNavigable ? Link : 'div';
  const wrapperProps = isNavigable ? { to } : {};

  const trendTone = trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-content-muted';
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return (
    <Wrapper
      {...wrapperProps}
      className={`group block rounded-xl border border-line bg-surface p-5 shadow-xs transition-all duration-base ease-standard ${
        isNavigable ? 'hover:-translate-y-px hover:shadow-md focus-visible:-translate-y-px focus-visible:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-content-muted">{title}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-content">{value}</p>

          {description && <p className="mt-1 text-xs text-content-muted">{description}</p>}

          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 text-xs font-medium tabular-nums ${trendTone}`}>
                <TrendIcon size={12} />
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && <span className="text-xs text-content-muted">{trendLabel}</span>}
            </div>
          )}
        </div>

        <div className={`shrink-0 rounded-full p-3 ${colorSet.bg} ${colorSet.text}`}>{icon}</div>
      </div>

      <Sparkline data={sparkline} />
    </Wrapper>
  );
};

export default StatCard;
