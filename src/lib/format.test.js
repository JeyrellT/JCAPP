import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatNumber,
  formatPercent,
  formatCurrency,
  formatDate,
  formatRelative,
  daysUntil,
  isOverdue,
} from './format.js';

// NOTA: estos tests dependen de que Node tenga ICU completo (aquí: correcto,
// verificado). En un build *small-icu* de Node las aserciones de es-CR
// (separadores, símbolo de colón, nombres de mes) fallarían con salidas
// distintas porque los datos de locale es-CR no estarían disponibles.

// El separador de miles de es-CR es U+00A0 (espacio duro), no un espacio
// normal ' ' (U+0020). Normalizamos antes de comparar para que las
// aserciones sean legibles en vez de comparar contra literales con caracteres
// invisibles. Se usa el escape \u00A0 (no el carácter literal) para que el
// propio archivo de test no lleve espacios irregulares en el código fuente.
const NBSP = '\u00A0';
const norm = (s) => s.split(NBSP).join(' ');

describe('formatNumber', () => {
  it('formatea un decimal con coma decimal y separador de miles', () => {
    expect(norm(formatNumber(1234.5))).toBe('1 234,5');
  });

  it('formatea un entero grande con separador de miles', () => {
    expect(norm(formatNumber(1234567))).toBe('1 234 567');
  });

  it("devuelve '0' para null", () => {
    expect(formatNumber(null)).toBe('0');
  });

  it("devuelve '0' para undefined", () => {
    expect(formatNumber(undefined)).toBe('0');
  });
});

describe('formatPercent', () => {
  it('sin decimales por defecto', () => {
    expect(formatPercent(85)).toBe('85%');
  });

  it('con coma decimal cuando se piden decimales', () => {
    expect(formatPercent(85.456, 1)).toBe('85,5%');
  });
});

describe('formatCurrency', () => {
  it('usa el símbolo de colón (U+20A1) por defecto (CRC)', () => {
    expect(norm(formatCurrency(1000))).toBe('₡1 000');
  });

  it('usa el código de moneda cuando se pasa otra divisa', () => {
    expect(norm(formatCurrency(1000, 'USD'))).toBe('USD 1 000');
  });
});

describe('formatDate', () => {
  it('formatea una fecha ISO válida con el patrón por defecto', () => {
    expect(formatDate('2026-03-15')).toBe('15 mar 2026');
  });

  it("devuelve '—' para null", () => {
    expect(formatDate(null)).toBe('—');
  });

  it("devuelve '—' para una fecha inválida (nunca 'Invalid Date')", () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it("devuelve '—' para undefined", () => {
    expect(formatDate(undefined)).toBe('—');
  });
});

describe('formatRelative', () => {
  it("devuelve '—' para null (nunca 'NaN')", () => {
    expect(formatRelative(null)).toBe('—');
  });

  it("devuelve '—' para una fecha inválida", () => {
    expect(formatRelative('not-a-date')).toBe('—');
  });
});

describe('daysUntil / isOverdue (reloj fijo)', () => {
  // Fijamos el reloj al mediodía local del 22 de agosto de 2026 para que las
  // comparaciones de "días de calendario" no dependan de la hora real ni de
  // la zona horaria del entorno que ejecuta el test.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 22, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve un número positivo para una fecha futura', () => {
    expect(daysUntil('2026-08-27')).toBe(5);
    expect(isOverdue('2026-08-27')).toBe(false);
  });

  it('devuelve un número negativo para una fecha pasada', () => {
    expect(daysUntil('2026-08-17')).toBe(-5);
    expect(isOverdue('2026-08-17')).toBe(true);
  });

  it('devuelve null para daysUntil(null) y false para isOverdue en ese caso (null !== true)', () => {
    expect(daysUntil(null)).toBeNull();
    expect(isOverdue(null)).toBe(false);
  });

  it('en el borde de hoy: daysUntil === 0 e isOverdue === false', () => {
    expect(daysUntil('2026-08-22')).toBe(0);
    expect(isOverdue('2026-08-22')).toBe(false);
  });
});
