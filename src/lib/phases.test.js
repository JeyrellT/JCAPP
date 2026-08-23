import { describe, it, expect } from 'vitest';
import {
  PHASE_ORDER,
  PHASE_META,
  normalizePhase,
  formatPhase,
  getPhaseToken,
  PROJECT_STATUS,
  getStatusToken,
  TOOL_STATUS,
  getToolStatusToken,
} from './phases.js';

describe('PHASE_ORDER', () => {
  it('contiene exactamente las 5 fases DMAIC en orden', () => {
    expect(PHASE_ORDER).toEqual(['Define', 'Measure', 'Analyze', 'Improve', 'Control']);
  });
});

describe('normalizePhase', () => {
  it('acepta minúsculas', () => {
    expect(normalizePhase('define')).toBe('Define');
  });

  it('acepta mayúsculas', () => {
    expect(normalizePhase('DEFINE')).toBe('Define');
  });

  it('hace trim de espacios', () => {
    expect(normalizePhase('  Define  ')).toBe('Define');
  });

  it('normaliza las 5 fases', () => {
    expect(normalizePhase('measure')).toBe('Measure');
    expect(normalizePhase('ANALYZE')).toBe('Analyze');
    expect(normalizePhase('improve')).toBe('Improve');
    expect(normalizePhase('control')).toBe('Control');
  });

  it('devuelve null para un valor desconocido', () => {
    expect(normalizePhase('foo')).toBeNull();
  });

  it('devuelve null para null', () => {
    expect(normalizePhase(null)).toBeNull();
  });

  it('devuelve null para undefined', () => {
    expect(normalizePhase(undefined)).toBeNull();
  });

  it("devuelve null para ''", () => {
    expect(normalizePhase('')).toBeNull();
  });
});

describe('formatPhase', () => {
  it('devuelve el nombre canónico si la fase existe', () => {
    expect(formatPhase('define')).toBe('Define');
    expect(formatPhase('  MEASURE  ')).toBe('Measure');
  });

  it('devuelve el string tal cual si no es una fase conocida', () => {
    expect(formatPhase('Foo')).toBe('Foo');
  });

  it("devuelve '' para null", () => {
    expect(formatPhase(null)).toBe('');
  });

  it("devuelve '' para undefined", () => {
    expect(formatPhase(undefined)).toBe('');
  });
});

describe('getPhaseToken', () => {
  it('devuelve el PHASE_META correcto para una fase válida', () => {
    expect(getPhaseToken('define')).toBe(PHASE_META.Define);
    expect(getPhaseToken('Control')).toBe(PHASE_META.Control);
  });

  it('devuelve el fallback con key "none" para un valor inválido', () => {
    const token = getPhaseToken('no-existe');
    expect(token.key).toBe('none');
  });

  it('devuelve el fallback con key "none" para null/undefined', () => {
    expect(getPhaseToken(null).key).toBe('none');
    expect(getPhaseToken(undefined).key).toBe('none');
  });
});

describe('getStatusToken', () => {
  it('devuelve el PROJECT_STATUS correcto', () => {
    expect(getStatusToken('active')).toBe(PROJECT_STATUS.active);
    expect(getStatusToken('completed')).toBe(PROJECT_STATUS.completed);
  });

  it('cae en el fallback "Sin estado" ante un valor desconocido', () => {
    const token = getStatusToken('no-existe');
    expect(token.label).toBe('Sin estado');
  });
});

describe('getToolStatusToken', () => {
  it('cae específicamente en TOOL_STATUS.not_started ante un valor inválido (no un fallback aparte)', () => {
    expect(getToolStatusToken('no-existe')).toBe(TOOL_STATUS.not_started);
    expect(getToolStatusToken(undefined)).toBe(TOOL_STATUS.not_started);
    expect(getToolStatusToken(null)).toBe(TOOL_STATUS.not_started);
  });

  it('devuelve el token correcto para cada estado válido', () => {
    expect(getToolStatusToken('in_progress')).toBe(TOOL_STATUS.in_progress);
    expect(getToolStatusToken('completed')).toBe(TOOL_STATUS.completed);
  });
});

describe('estructura de los diccionarios de léxico visual (caza fases/estados añadidos a medias)', () => {
  const REQUIRED_PHASE_KEYS = ['key', 'letter', 'label', 'desc', 'bg', 'text', 'dot', 'border', 'solid'];

  // Toda clase Tailwind debe ser un literal estático: sin `${` ni concatenación,
  // porque Tailwind no detecta clases construidas dinámicamente (regla transversal).
  const isStaticClassString = (value) =>
    typeof value === 'string' && !value.includes('${') && !value.includes('" +') && !value.includes("' +");

  it('cada entrada de PHASE_META trae el juego completo de llaves', () => {
    for (const [name, meta] of Object.entries(PHASE_META)) {
      for (const key of REQUIRED_PHASE_KEYS) {
        expect(meta, `PHASE_META.${name} debe tener "${key}"`).toHaveProperty(key);
      }
    }
  });

  it('todas las clases Tailwind de PHASE_META son literales estáticos', () => {
    const classKeys = ['bg', 'text', 'dot', 'border', 'solid'];
    for (const [name, meta] of Object.entries(PHASE_META)) {
      for (const key of classKeys) {
        expect(isStaticClassString(meta[key]), `PHASE_META.${name}.${key} no es un literal estático`).toBe(true);
      }
    }
  });

  it('todas las clases Tailwind de PROJECT_STATUS son literales estáticos', () => {
    const classKeys = ['bg', 'text', 'dot'];
    for (const [name, meta] of Object.entries(PROJECT_STATUS)) {
      for (const key of classKeys) {
        expect(isStaticClassString(meta[key]), `PROJECT_STATUS.${name}.${key} no es un literal estático`).toBe(true);
      }
    }
  });

  it('todas las clases Tailwind de TOOL_STATUS son literales estáticos', () => {
    const classKeys = ['bg', 'text', 'dot'];
    for (const [name, meta] of Object.entries(TOOL_STATUS)) {
      for (const key of classKeys) {
        expect(isStaticClassString(meta[key]), `TOOL_STATUS.${name}.${key} no es un literal estático`).toBe(true);
      }
    }
  });
});
