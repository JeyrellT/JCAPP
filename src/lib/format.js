// Formato localizado es-CR. Prohibido usar dayjs en código nuevo.
import { format, formatDistanceToNowStrict, differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

const toDate = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : parseISO(String(value));
  return isValid(d) ? d : null;
};

export const formatNumber = (value, options = {}) =>
  new Intl.NumberFormat('es-CR', options).format(Number(value ?? 0));

export const formatPercent = (value, digits = 0) =>
  `${formatNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;

export const formatCurrency = (value, currency = 'CRC') =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value ?? 0));

export const formatDate = (value, pattern = 'd MMM yyyy') => {
  const d = toDate(value);
  return d ? format(d, pattern, { locale: es }) : '—';
};

// "hace 3 días" / "en 12 días"
export const formatRelative = (value) => {
  const d = toDate(value);
  return d ? formatDistanceToNowStrict(d, { locale: es, addSuffix: true }) : '—';
};

// Positivo = faltan N días; negativo = vencido hace N días; null = sin fecha.
export const daysUntil = (value) => {
  const d = toDate(value);
  return d ? differenceInCalendarDays(d, new Date()) : null;
};

export const isOverdue = (value) => {
  const n = daysUntil(value);
  return n !== null && n < 0;
};
