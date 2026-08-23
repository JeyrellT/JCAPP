/**
 * useToolData.test.js
 * ---------------------------------------------------------------------------
 * NOTA DE INFRAESTRUCTURA (leer antes de tocar este archivo):
 *
 * Ni `jsdom` ni `@testing-library/react` están instaladas en este proyecto en
 * el momento en que se escribió este archivo (verificado: `node_modules/`
 * carece de ambas). Está prohibido instalar dependencias nuevas sin
 * autorización, así que en vez de renderizar el hook con un renderer real de
 * React, este archivo implementa un ARNÉS MÍNIMO de hooks: una
 * reimplementación deliberadamente pequeña de `useState`/`useRef`/
 * `useEffect`/`useCallback`/`useMemo` que preserva estado entre "renders"
 * exactamente como lo hace React (mismo orden de slots, misma semántica de
 * dependencias, mismo orden de limpieza-antes-de-efecto), sin necesitar
 * `document`/`window` ni un reconciler.
 *
 * Import importante: el hook bajo prueba (`useToolData.js`) NO se reimplementa
 * ni se duplica su lógica en ningún punto de este archivo — se importa el
 * módulo real y se ejecuta tal cual. Lo único que se sustituye vía
 * `vi.mock('react', ...)` son los cinco hooks primitivos que usa, para poder
 * invocarlo repetidamente en Node sin un DOM. `LeanSixSigmaContext` y
 * `data/toolsData` se mockean por separado (están fuera del carril de este
 * archivo) para poder controlar sus valores de forma determinista.
 *
 * Si un ciclo futuro instala `jsdom` + `@testing-library/react`, este arnés
 * puede reemplazarse por `renderHook`/`act` de esa librería sin cambiar los
 * casos de prueba (T1-T14 más abajo), que documentan el contrato real del
 * hook y son la parte de valor de este archivo.
 * ---------------------------------------------------------------------------
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Arnés mínimo de hooks (sin React, sin jsdom). Una instancia = un componente
// montado: preserva slots de estado/efectos entre llamadas a `renderOnce`.
// ---------------------------------------------------------------------------
function createHost() {
  const slots = [];
  let cursor = 0;
  let pendingEffects = [];

  const sameDeps = (a, b) => {
    if (a === b) return true;
    if (!a || !b || a.length !== b.length) return false;
    return a.every((v, i) => Object.is(v, b[i]));
  };

  // NOTA: estas funciones internas NO se llaman "useX" a propósito (aunque
  // sustituyen a useState/useRef/useEffect/useCallback/useMemo de React):
  // eslint-plugin-react-hooks trata cualquier función cuyo nombre empieza
  // con "use" como un Hook y le exige las Reglas de los Hooks (deps
  // estáticas, etc.), lo cual dispara falsos positivos aquí porque esto es
  // un arnés de prueba, no un componente. Se exponen con los nombres
  // correctos (`useState`, ...) solo como propiedades del objeto devuelto.
  function stateSlot(initial) {
    const i = cursor++;
    if (!(i in slots)) {
      slots[i] = { value: typeof initial === 'function' ? initial() : initial };
    }
    const slot = slots[i];
    const setState = (updater) => {
      slot.value = typeof updater === 'function' ? updater(slot.value) : updater;
    };
    return [slot.value, setState];
  }

  function refSlot(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = { current: initial };
    return slots[i];
  }

  function memoSlot(factory, deps) {
    const i = cursor++;
    const prev = slots[i];
    const changed = !prev || deps === undefined || !sameDeps(prev.deps, deps);
    if (changed) {
      const value = factory();
      slots[i] = { deps, value };
      return value;
    }
    return prev.value;
  }

  function callbackSlot(fn, deps) {
    return memoSlot(() => fn, deps);
  }

  const effectFns = {};

  function effectSlot(fn, deps) {
    const i = cursor++;
    const prev = slots[i];
    // Sin array de deps -> corre en TODOS los renders, como en React real.
    const changed = !prev || deps === undefined || !sameDeps(prev.deps, deps);
    const cleanup = prev?.cleanup;
    slots[i] = { deps, cleanup };
    if (changed) pendingEffects.push(i);
    // guardamos la fn a ejecutar en un mapa aparte indexado por slot, ya que
    // el slot en sí solo lleva deps/cleanup.
    effectFns[i] = fn;
  }

  /** Simula un render + commit: corre `fn`, luego los efectos agendados. */
  function renderOnce(fn) {
    cursor = 0;
    pendingEffects = [];
    const result = fn();
    for (const i of pendingEffects) {
      const slot = slots[i];
      if (typeof slot.cleanup === 'function') slot.cleanup();
      const cleanup = effectFns[i]();
      slot.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
    }
    return result;
  }

  return {
    useState: stateSlot,
    useRef: refSlot,
    useMemo: memoSlot,
    useCallback: callbackSlot,
    useEffect: effectSlot,
    renderOnce,
  };
}

let currentHost = null;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (...args) => currentHost.useState(...args),
    useRef: (...args) => currentHost.useRef(...args),
    useEffect: (...args) => currentHost.useEffect(...args),
    useCallback: (...args) => currentHost.useCallback(...args),
    useMemo: (...args) => currentHost.useMemo(...args),
  };
});

// El contexto real (`LeanSixSigmaContext`) no exporta el objeto de contexto,
// solo el hook `useLeanSixSigma` y el Provider — así que la única vía de
// inyectar un valor controlado sin tocar ese archivo (fuera de carril) es
// mockear el módulo entero, como indica el brief F2.1.
let ctxValue = null;
vi.mock('../contexts/LeanSixSigmaContext', () => ({
  useLeanSixSigma: () => ctxValue,
}));

// Igual para el catálogo de ejemplos: se mutan los CONTENIDOS del array (no
// se reasigna la variable) porque el factory de vi.mock captura el valor de
// `catalogRef` una sola vez, en el momento en que el módulo se resuelve.
// `vi.hoisted` es necesario porque `vi.mock` se hoistea por encima de
// cualquier declaración de nivel superior: sin esto, `catalogRef` estaría en
// TDZ cuando el factory se evalúa.
const catalogRef = vi.hoisted(() => []);
function setCatalog(items) {
  catalogRef.length = 0;
  catalogRef.push(...items);
}
vi.mock('../data/toolsData', () => ({ default: catalogRef }));

// Import real del módulo bajo prueba — DESPUÉS de los vi.mock (da igual el
// orden textual: vitest los hoistea, pero se deja así por claridad).
import useToolData from './useToolData.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DEFAULT_DATA = Object.freeze({ title: '', categories: [], values: [] });

/** Proyecto con N herramientas en `tools`, cada una con datos distintos. */
function buildProjectWithTools(n = 14) {
  const tools = {};
  for (let i = 0; i < n; i++) {
    tools[`tool-${i}`] = {
      status: 'not_started',
      updatedAt: '2026-01-01T00:00:00.000Z',
      data: { seed: i, label: `seed-${i}` },
    };
  }
  return { id: 'p1', name: 'Proyecto de prueba', tools };
}

/** Construye un `ctxValue` (lo que devolvería useLeanSixSigma) sobre `projectsArr`. */
function makeCtx(projectsArr, overrides = {}) {
  return {
    projects: projectsArr,
    getProject: (id) => projectsArr.find((p) => p.id === id) || null,
    updateProject: vi.fn(),
    updateToolStatus: vi.fn(),
    loading: false,
    ...overrides,
  };
}

/** Monta el hook y lo asienta (2 renders: hidrata en el 1, se lee en el 2). */
function mount(pid, tid, defaultData = DEFAULT_DATA, options = { warnOnUnload: false }) {
  currentHost.renderOnce(() => useToolData(pid, tid, defaultData, options));
  return currentHost.renderOnce(() => useToolData(pid, tid, defaultData, options));
}

/** Vuelve a renderizar con el mismo host (misma "instancia montada"). */
function rerender(pid, tid, defaultData = DEFAULT_DATA, options = { warnOnUnload: false }) {
  return currentHost.renderOnce(() => useToolData(pid, tid, defaultData, options));
}

beforeEach(() => {
  currentHost = createHost();
  ctxValue = null;
  setCatalog([]);
});

// ---------------------------------------------------------------------------
// Grupo anti-borrado — bloqueante del merge
// ---------------------------------------------------------------------------
describe('useToolData — grupo anti-borrado', () => {
  it('T1: guardar una herramienta no borra las otras 13 (payload trae las 14 claves)', () => {
    const project = buildProjectWithTools(14);
    const originalTools = JSON.parse(JSON.stringify(project.tools));
    ctxValue = makeCtx([project]);

    let t = mount('p1', 'tool-0');
    t.patch({ title: 'editado' });
    t = rerender('p1', 'tool-0');
    const ok = t.save();

    expect(ok).toBe(true);
    expect(ctxValue.updateProject).toHaveBeenCalledTimes(1);
    const [calledId, payload] = ctxValue.updateProject.mock.calls[0];
    expect(calledId).toBe('p1');
    expect(Object.keys(payload.tools)).toHaveLength(14);
    for (let i = 1; i < 14; i++) {
      expect(payload.tools[`tool-${i}`]).toEqual(originalTools[`tool-${i}`]);
    }
    // la editada sí cambió
    expect(payload.tools['tool-0'].data.title).toBe('editado');
  });

  it('T2: save() lee el proyecto VIVO, no el `project` capturado en el closure', () => {
    const p0 = buildProjectWithTools(14);
    ctxValue = makeCtx([p0]);

    mount('p1', 'tool-0');

    // "otro componente" escribe tool-5 y publica un array de proyectos NUEVO
    const p1 = {
      ...p0,
      tools: {
        ...p0.tools,
        'tool-5': { ...p0.tools['tool-5'], data: { ...p0.tools['tool-5'].data, extra: 'ajena' } },
      },
    };
    ctxValue.projects = [p1];
    const t = rerender('p1', 'tool-0');

    const ok = t.save();
    expect(ok).toBe(true);
    const [, payload] = ctxValue.updateProject.mock.calls[0];
    expect(payload.tools['tool-5'].data.extra).toBe('ajena');
  });

  it('T3: save({name:"x", tools:{}}) ignora la clave "tools" inyectada y conserva el mapa completo', () => {
    const project = buildProjectWithTools(14);
    ctxValue = makeCtx([project]);

    let t = mount('p1', 'tool-0');
    t.patch({ title: 'charter' });
    t = rerender('p1', 'tool-0');

    const ok = t.save({ name: 'x', tools: {} });
    expect(ok).toBe(true);
    const [, payload] = ctxValue.updateProject.mock.calls[0];
    expect(payload.name).toBe('x');
    expect(Object.keys(payload.tools)).toHaveLength(14);
    expect(payload.tools['tool-0'].data.title).toBe('charter');
  });
});

// ---------------------------------------------------------------------------
// Grupo hidratación-una-sola-vez
// ---------------------------------------------------------------------------
describe('useToolData — grupo hidratación-una-sola-vez', () => {
  it('T4: un `updateProject` ajeno no pisa lo que el usuario está escribiendo', () => {
    const p0 = buildProjectWithTools(14);
    ctxValue = makeCtx([p0]);

    let t = mount('p1', 'tool-0');
    t.patch({ title: 'lo que escribo' });
    t = rerender('p1', 'tool-0');
    expect(t.data.title).toBe('lo que escribo');

    // Cambio ajeno: nueva identidad de array/objeto proyecto, pero la
    // herramienta bajo edición (tool-0) no cambió en el "servidor".
    const p1 = { ...p0, updatedAt: '2026-02-01T00:00:00.000Z' };
    ctxValue.projects = [p1];
    t = rerender('p1', 'tool-0');

    expect(t.data.title).toBe('lo que escribo');
  });

  it('T5: cambiar toolId SÍ re-hidrata desde el dato de la nueva herramienta', () => {
    const project = buildProjectWithTools(14);
    ctxValue = makeCtx([project]);

    let t = mount('p1', 'tool-0');
    t.patch({ title: 'edito tool-0' });
    t = rerender('p1', 'tool-0');
    expect(t.data.title).toBe('edito tool-0');

    // Navega a otra herramienta con la MISMA instancia montada.
    t = mount('p1', 'tool-1');
    // tool-1 no tiene "title" en su data sembrada (solo seed/label): el merge
    // superficial sobre defaultData deja title en '' (el default), y trae
    // los campos propios de tool-1.
    expect(t.data.title).toBe('');
    expect(t.data.seed).toBe(1);
    expect(t.data.label).toBe('seed-1');
  });
});

// ---------------------------------------------------------------------------
// Grupo estado y legacy
// ---------------------------------------------------------------------------
describe('useToolData — grupo estado y legacy', () => {
  it.each([
    ['not_started', 'in_progress'],
    ['in_progress', 'in_progress'],
    ['completed', 'completed'],
  ])('T6: save() con estado inicial %s termina en %s (nunca completa ni retrocede)', (initial, expected) => {
    const project = buildProjectWithTools(2);
    project.tools['tool-0'].status = initial;
    ctxValue = makeCtx([project]);

    let t = mount('p1', 'tool-0');
    t.patch({ title: 'x' });
    t = rerender('p1', 'tool-0');
    t.save();

    const [, payload] = ctxValue.updateProject.mock.calls[0];
    expect(payload.tools['tool-0'].status).toBe(expected);
  });

  it('T7: save() preserva campos desconocidos de la entrada (p. ej. notes)', () => {
    const project = buildProjectWithTools(1);
    project.tools['tool-0'].notes = 'algo';
    ctxValue = makeCtx([project]);

    let t = mount('p1', 'tool-0');
    t.patch({ title: 'x' });
    t = rerender('p1', 'tool-0');
    t.save();

    const [, payload] = ctxValue.updateProject.mock.calls[0];
    expect(payload.tools['tool-0'].notes).toBe('algo');
  });

  it('T8: la hidratación hace merge superficial de lo guardado SOBRE defaultData', () => {
    const project = buildProjectWithTools(1);
    // Dato viejo sin el campo `values` (imaginemos que se agregó después).
    project.tools['tool-0'].data = { title: 'viejo', categories: ['a'] };
    ctxValue = makeCtx([project]);

    const t = mount('p1', 'tool-0', { title: '', categories: [], values: [] });

    expect(t.data.title).toBe('viejo');
    expect(t.data.categories).toEqual(['a']);
    // Campo nuevo de defaultData no presente en el dato viejo: aparece con
    // su valor por defecto, sin migración.
    expect(t.data.values).toEqual([]);
  });

  it('T9a: el rescate legacy se aplica si la ruta canónica está vacía; nace sucio (isDirty=true, lastSavedAt=null)', () => {
    const project = buildProjectWithTools(1);
    project.tools['tool-0'].data = null; // ruta canónica vacía
    project.legacyField = { title: 'Legacy', categories: ['rescatado'] };
    ctxValue = makeCtx([project]);

    const t = mount('p1', 'tool-0', DEFAULT_DATA, {
      warnOnUnload: false,
      legacy: (p) => p.legacyField || null,
    });

    expect(t.data.title).toBe('Legacy');
    expect(t.isDirty).toBe(true);
    expect(t.lastSavedAt).toBeNull();
  });

  it('T9b: con dato canónico presente, el legacy se ignora e isDirty === false', () => {
    const project = buildProjectWithTools(1);
    project.tools['tool-0'].data = { title: 'Real', categories: ['9'] };
    project.tools['tool-0'].updatedAt = '2026-03-03T00:00:00.000Z';
    project.legacyField = { title: 'Legacy', categories: ['no-debe-usarse'] };
    ctxValue = makeCtx([project]);

    const t = mount('p1', 'tool-0', DEFAULT_DATA, {
      warnOnUnload: false,
      legacy: (p) => p.legacyField || null,
    });

    expect(t.data.title).toBe('Real');
    expect(t.isDirty).toBe(false);
    expect(t.lastSavedAt).toBe('2026-03-03T00:00:00.000Z');
  });

  it.each([
    ['null', null],
    ['undefined (clave ausente)', undefined],
    ['objeto vacío', {}],
    ['array vacío', []],
  ])('T10: %s cuenta como "sin dato" -> dispara el rescate legacy', (_label, storedValue) => {
    const project = buildProjectWithTools(1);
    if (storedValue === undefined) {
      delete project.tools['tool-0'].data;
    } else {
      project.tools['tool-0'].data = storedValue;
    }
    project.legacyField = { title: 'RESCATADO' };
    ctxValue = makeCtx([project]);

    const t = mount('p1', 'tool-0', DEFAULT_DATA, {
      warnOnUnload: false,
      legacy: (p) => p.legacyField || null,
    });

    expect(t.data.title).toBe('RESCATADO');
  });

  it('T10b: un dato NO vacío no dispara el rescate legacy aunque exista', () => {
    const project = buildProjectWithTools(1);
    project.tools['tool-0'].data = { title: 'ya tengo dato', categories: [] };
    project.legacyField = { title: 'NO-DEBE-APARECER' };
    ctxValue = makeCtx([project]);

    const t = mount('p1', 'tool-0', DEFAULT_DATA, {
      warnOnUnload: false,
      legacy: (p) => p.legacyField || null,
    });

    expect(t.data.title).toBe('ya tengo dato');
  });
});

// ---------------------------------------------------------------------------
// Grupo ejemplos y ciclo de vida
// ---------------------------------------------------------------------------
describe('useToolData — grupo ejemplos y ciclo de vida', () => {
  it('T11: loadExample() rellena el estado local, deja isDirty=true y NUNCA llama a updateProject', () => {
    const project = buildProjectWithTools(1);
    ctxValue = makeCtx([project]);
    setCatalog([
      {
        id: 'tool-0',
        examples: [{ title: 'Ejemplo Pareto', categories: ['a', 'b'], values: [1, 2] }],
      },
    ]);

    let t = mount('p1', 'tool-0');
    const applied = t.loadExample(0);
    expect(applied).toBe(true);
    t = rerender('p1', 'tool-0');

    expect(t.data.categories).toEqual(['a', 'b']);
    expect(t.isDirty).toBe(true);
    expect(ctxValue.updateProject).not.toHaveBeenCalled();
  });

  it('T12: defaultAdaptExample descarta la clave "title" del ejemplo (es la etiqueta del catálogo)', () => {
    const project = buildProjectWithTools(1);
    ctxValue = makeCtx([project]);
    setCatalog([
      {
        id: 'tool-0',
        examples: [{ title: 'Pareto - Causas de Retrasos', categories: ['x'], values: [9] }],
      },
    ]);

    let t = mount('p1', 'tool-0', { title: 'default-title', categories: [], values: [] });
    t.loadExample(0);
    t = rerender('p1', 'tool-0', { title: 'default-title', categories: [], values: [] });

    // El título del ejemplo (etiqueta del catálogo) NO debe pisar `data.title`.
    expect(t.data.title).toBe('default-title');
    expect(t.data.categories).toEqual(['x']);
  });

  it('T13: ciclo de isDirty: false tras hidratar -> true tras patch -> false tras save -> discard restaura el baseline', () => {
    const project = buildProjectWithTools(1);
    ctxValue = makeCtx([project]);

    let t = mount('p1', 'tool-0');
    expect(t.isDirty).toBe(false);

    t.patch({ title: 'cambio' });
    t = rerender('p1', 'tool-0');
    expect(t.isDirty).toBe(true);

    t.save();
    t = rerender('p1', 'tool-0');
    expect(t.isDirty).toBe(false);
    expect(t.data.title).toBe('cambio');

    t.patch({ title: 'otro cambio sin guardar' });
    t = rerender('p1', 'tool-0');
    expect(t.isDirty).toBe(true);

    t.discard();
    t = rerender('p1', 'tool-0');
    expect(t.isDirty).toBe(false);
    expect(t.data.title).toBe('cambio'); // vuelve al último baseline (el guardado), no al original
  });

  it('T14: save() sobre un projectId inexistente devuelve false, deja error poblado y NO llama a updateProject', () => {
    ctxValue = makeCtx([]); // ningún proyecto

    let t = mount('proyecto-fantasma', 'tool-0');
    const ok = t.save();
    expect(ok).toBe(false);
    t = rerender('proyecto-fantasma', 'tool-0');
    expect(t.error).toBeTruthy();
    expect(ctxValue.updateProject).not.toHaveBeenCalled();
  });
});
