/**
 * useToolData.js
 * ---------------------------------------------------------------------------
 * Contrato único de persistencia para las 14 herramientas de `src/tools/`.
 *
 * POR QUÉ EXISTE
 * Hoy cada herramienta inventó su propia lógica y casi todas lo hicieron mal:
 *   - ParetoChart, FiveS, FmeaAnalysis: `saveChanges()` solo hace `setTimeout`.
 *     Nunca persisten. StakeholderAnalysis ni siquiera destructura updateProject.
 *   - CtqDashboard, RoiCalculator, VocVisualizer, ValueStreamMap,
 *     PriorizationMatrix, CauseEffectDiagram, ControlChart, SipocViewer,
 *     ProjectTimeline: sí escriben, pero a claves inventadas en la RAÍZ del
 *     proyecto (`project.ctqData`, `project.roiData`, `project.voc`,
 *     `project.valueStreamMap`, `project.priorityMatrix`,
 *     `project.causeEffectDiagram`, `project.controlChart`, `project.sipocs`,
 *     `project.tasks`), no en la ruta canónica.
 *
 * La ruta canónica es `project.tools[toolId].data`. No es una preferencia:
 *   - `src/data/projects.js` siembra ahí los datos de ejemplo de cada proyecto.
 *   - `src/utils/export.js` → `exportProjectTool()` lee de ahí (el botón
 *     "Descargar JSON" de ToolPage exporta esa ruta y solo esa).
 *   - `src/components/project/EnhancedTimeline.jsx` y
 *     `src/components/common/TimelineSummary.jsx` LEEN de ahí
 *     (`entry?.data?.tasks`) mientras `src/tools/ProjectTimeline.jsx` ESCRIBE
 *     en `project.tasks`: hoy son dos mundos que no se ven entre sí.
 * Este hook generaliza exactamente el patrón `persistTasks` que ya usa
 * EnhancedTimeline. No inventa convención nueva: unifica la que ya existe.
 *
 * LAS DOS TRAMPAS QUE ESTE HOOK NEUTRALIZA
 *
 * 1) Borrado accidental de las otras 13 herramientas.
 *    `updateProject(id, partial)` hace `{...project, ...partial}`. Si pasas
 *    `{ tools: { [toolId]: ... } }` REEMPLAZAS el objeto `tools` entero y las
 *    otras 13 herramientas del proyecto desaparecen. Hay que esparcir
 *    `...project.tools` siempre. Peor aún: esparcir el `project` capturado en
 *    el closure del render puede estar obsoleto. Por eso `save()` re-lee el
 *    proyecto vivo desde `projectsRef.current` en el momento del guardado, no
 *    de la variable `project` del render.
 *
 * 2) Pisar lo que el usuario está escribiendo.
 *    `getProject` es `useCallback([projects])`: cada `updateProject` /
 *    `updateToolStatus` de CUALQUIER parte de la app produce un objeto
 *    `project` nuevo. Las herramientas que hacen
 *    `useEffect(() => setLocal(project.X), [project])` (CauseEffectDiagram,
 *    ControlChart, ProjectTimeline, SipocViewer) se auto-resetean: basta que
 *    el usuario toque el selector de estado de ToolPage mientras edita para
 *    perder lo escrito. Aquí la hidratación ocurre UNA vez por
 *    `(projectId, toolId)` y nunca vuelve a pisar el estado local.
 *
 * QUÉ NO HACE (a propósito)
 *   - No marca `completed`. El estado de la herramienta lo maneja el usuario
 *     desde ToolPage (`updateToolStatus`). Guardar un borrador solo sube
 *     `not_started` → `in_progress`. SipocViewer y ProjectCharter hoy fuerzan
 *     `completed` en cada guardado; eso es incorrecto y desaparece al adoptar
 *     este hook.
 *   - `loadExample()` NO guarda. Solo rellena el estado local y lo deja sucio,
 *     para que cargar un ejemplo jamás pise en disco el trabajo real de nadie.
 *   - No hace autoguardado. Un guardado es siempre un acto explícito.
 *   - No borra las claves legacy de la raíz del proyecto. Solo deja de leerlas
 *     cuando ya hay dato canónico.
 *
 * USO MÍNIMO
 *
 *   const { data, patch, save, isDirty, isSaving, justSaved,
 *           examples, loadExample } = useToolData(projectId, 'pareto-chart', {
 *     title: '',
 *     categories: [],
 *     values: [],
 *   });
 *
 *   <input value={data.title} onChange={(e) => patch({ title: e.target.value })} />
 *   <Button onClick={() => save()} disabled={!isDirty || isSaving}>Guardar</Button>
 *   {justSaved && <span>Guardado</span>}
 *   {examples.length > 0 && (
 *     <Button onClick={() => loadExample(0)}>Cargar ejemplo</Button>
 *   )}
 * ---------------------------------------------------------------------------
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import isEqual from 'lodash/isEqual';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import toolsCatalog from '../data/toolsData';

/** Milisegundos que `justSaved` permanece en true tras un guardado exitoso. */
const JUST_SAVED_MS = 2200;

/** Referencia estable: evita crear un array nuevo por render cuando no hay ejemplos. */
const NO_EXAMPLES = Object.freeze([]);

/** Copia profunda de datos JSON planos (que es todo lo que va a localStorage). */
const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

/** `null`, `undefined`, `{}` y `[]` cuentan como "no hay dato guardado". */
const isEmptyData = (value) => {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Adaptador por defecto de un ejemplo de `toolsData.js` al `data` de la
 * herramienta. Los ejemplos guardan sus campos al mismo nivel que `title`, y
 * `title` es la etiqueta del ejemplo (p. ej. "Pareto - Causas de Retrasos"),
 * NO un campo de la herramienta: por eso se descarta.
 * Si las llaves del ejemplo no coinciden con tu estado, pasa tu propio
 * `adaptExample` en las opciones en vez de deformar el estado.
 */
const defaultAdaptExample = (example, defaultData) => {
  if (!example || typeof example !== 'object') return null;
  const { title, ...rest } = example; // eslint-disable-line no-unused-vars
  return { ...defaultData, ...rest };
};

/**
 * @param {string} projectId - ID del proyecto (viene por props desde ToolPage).
 * @param {string} toolId - ID de catálogo de la herramienta ('pareto-chart',
 *   '5s', 'ctq', ...). Debe ser el mismo id que usan `src/data/tools.js` y
 *   `src/data/toolsData.js` (verificado: los 14 ids coinciden en ambos).
 * @param {Object} defaultData - Forma completa del estado vacío. Se usa como
 *   base del merge al hidratar, así que agregar un campo nuevo aquí lo
 *   retro-rellena en proyectos ya guardados sin migración.
 * @param {Object} [options]
 * @param {(example: Object, defaultData: Object) => Object} [options.adaptExample]
 *   Mapea un ejemplo del catálogo al `data` de la herramienta.
 * @param {(project: Object) => Object|null} [options.legacy]
 *   Rescate de datos viejos. Se llama SOLO si `tools[toolId].data` está vacío.
 *   Devuelve el `data` reconstruido desde las claves antiguas de la raíz del
 *   proyecto, o `null` si no hay nada que rescatar. Sin esto, quien ya tenía
 *   trabajo guardado en localStorage lo ve desaparecer al desplegar el cambio.
 *   Ej. para CtqDashboard: `legacy: (p) => p.ctqData || null`.
 * @param {boolean} [options.warnOnUnload=true]
 *   Avisa al cerrar/recargar la pestaña si hay cambios sin guardar.
 */
export default function useToolData(projectId, toolId, defaultData, options = {}) {
  const { adaptExample = defaultAdaptExample, legacy = null, warnOnUnload = true } = options;

  const { projects, getProject, updateProject, updateToolStatus, loading } = useLeanSixSigma();

  // Espejo del array vivo de proyectos. `save()` lee de aquí y NUNCA de la
  // variable `project` del closure: esa puede tener varios commits de atraso y
  // esparcirla revertiría cambios ajenos.
  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Las opciones y `defaultData` suelen ser literales recreados en cada render.
  // Se leen por ref para que no invaliden callbacks ni disparen efectos.
  const optionsRef = useRef({ adaptExample, legacy, defaultData });
  useEffect(() => {
    optionsRef.current = { adaptExample, legacy, defaultData };
  });

  const project = getProject(projectId);
  const entry = project?.tools?.[toolId];

  const [data, setDataState] = useState(() => clone(defaultData));
  const [baseline, setBaseline] = useState(() => clone(defaultData));
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [error, setError] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Clave de hidratación. Mientras no cambie, jamás re-sincronizamos desde el
  // contexto: es lo que impide que un `updateProject` ajeno pise lo tecleado.
  const hydratedKeyRef = useRef(null);

  // Aviso de desarrollo: un toolId mal escrito no rompe nada, solo deja la
  // herramienta sin ejemplos en silencio. Mejor gritarlo en consola.
  const toolInfo = useMemo(() => toolsCatalog.find((t) => t.id === toolId) || null, [toolId]);
  useEffect(() => {
    if (import.meta.env?.DEV && toolId && !toolInfo) {
      console.warn(
        `[useToolData] "${toolId}" no existe en src/data/toolsData.js. ` +
          'No habrá ejemplos disponibles. Revisa el id de catálogo.'
      );
    }
  }, [toolId, toolInfo]);

  // --- Hidratación: una sola vez por (projectId, toolId) -------------------
  useEffect(() => {
    const key = `${projectId}::${toolId}`;
    if (hydratedKeyRef.current === key) return;

    const live = projectsRef.current.find((p) => p.id === projectId) || null;
    if (!live) return; // el contexto todavía no cargó; reintenta al llegar `project`

    const liveEntry = live.tools?.[toolId];
    const { defaultData: fallback, legacy: rescue } = optionsRef.current;

    let stored = liveEntry?.data;
    let migrated = false;
    if (isEmptyData(stored) && typeof rescue === 'function') {
      const rescued = rescue(live);
      if (!isEmptyData(rescued)) {
        stored = rescued;
        migrated = true;
      }
    }

    // Merge superficial sobre `defaultData`: los campos que la herramienta
    // agregue en el futuro aparecen con su valor por defecto en datos viejos.
    const next = isEmptyData(stored)
      ? clone(fallback)
      : { ...clone(fallback), ...clone(stored) };

    hydratedKeyRef.current = key;
    setDataState(next);
    // Un dato rescatado de legacy nace "sucio" a propósito: todavía no está en
    // la ruta canónica, así que el botón Guardar debe quedar habilitado.
    setBaseline(migrated ? clone(fallback) : clone(next));
    setLastSavedAt(migrated ? null : liveEntry?.updatedAt || null);
    setError(null);
    setHydrated(true);
  }, [projectId, toolId, project]);

  // --- Escritura del estado local -----------------------------------------

  /** Acepta valor o updater, igual que `setState`. */
  const setData = useCallback((updater) => {
    setError(null);
    setDataState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  /** Merge superficial sobre el nivel raíz de `data`. El 90% de los casos. */
  const patch = useCallback(
    (partial) => {
      setData((prev) => ({ ...prev, ...(typeof partial === 'function' ? partial(prev) : partial) }));
    },
    [setData]
  );

  const isDirty = useMemo(() => !isEqual(data, baseline), [data, baseline]);

  // --- Guardado ------------------------------------------------------------

  /**
   * Persiste `data` en `project.tools[toolId].data`.
   *
   * @param {Object|null} [extraProjectFields] - Campos que van a la RAÍZ del
   *   proyecto en el mismo commit. Solo para datos que de verdad son del
   *   proyecto y otras pantallas leen (ProjectCharter: `name`, `description`,
   *   `team`...). No metas aquí el estado de la herramienta. La clave `tools`
   *   se ignora: es la que rompe todo.
   * @returns {boolean} true si se escribió.
   */
  const save = useCallback(
    (extraProjectFields = null) => {
      const live = projectsRef.current.find((p) => p.id === projectId) || null;
      if (!live) {
        setError('El proyecto ya no está disponible. No se guardó nada.');
        return false;
      }

      let extra = extraProjectFields;
      if (extra && Object.prototype.hasOwnProperty.call(extra, 'tools')) {
        if (import.meta.env?.DEV) {
          console.warn(
            '[useToolData] save() ignoró la clave "tools" de extraProjectFields. ' +
              'Pasarla borraría las otras herramientas del proyecto.'
          );
        }
        const { tools, ...safe } = extra; // eslint-disable-line no-unused-vars
        extra = safe;
      }

      setIsSaving(true);
      setError(null);

      const now = new Date().toISOString();
      const liveEntry = live.tools?.[toolId] || {};
      // Guardar nunca completa una herramienta ni la retrocede: solo la arranca.
      const nextStatus = liveEntry.status === 'completed' || liveEntry.status === 'in_progress'
        ? liveEntry.status
        : 'in_progress';
      const payload = clone(data);

      try {
        updateProject(projectId, {
          ...(extra || {}),
          tools: {
            ...live.tools, // las otras 13 herramientas, leídas EN VIVO
            [toolId]: {
              ...liveEntry, // conserva `notes` y cualquier campo futuro
              status: nextStatus,
              updatedAt: now,
              data: payload,
            },
          },
        });
        setBaseline(payload);
        setLastSavedAt(now);
        setJustSaved(true);
        return true;
      } catch (err) {
        console.error('[useToolData] falló el guardado', err);
        setError('No se pudo guardar. Revisa la consola.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, toolId, data, updateProject]
  );

  useEffect(() => {
    if (!justSaved) return undefined;
    const timer = setTimeout(() => setJustSaved(false), JUST_SAVED_MS);
    return () => clearTimeout(timer);
  }, [justSaved]);

  /** Descarta los cambios locales y vuelve a lo último persistido. */
  const discard = useCallback(() => {
    setDataState(clone(baseline));
    setError(null);
  }, [baseline]);

  /** Vacía el formulario a `defaultData`. Queda sucio: hay que guardar. */
  const reset = useCallback(() => {
    setDataState(clone(optionsRef.current.defaultData));
    setError(null);
  }, []);

  /**
   * Cambia el estado de la herramienta por la vía oficial del contexto
   * (`updateToolStatus`, que usa la forma updater y por eso es atómica).
   * @param {'not_started'|'in_progress'|'completed'} nextStatus
   */
  const markStatus = useCallback(
    (nextStatus) => {
      if (!projectId || !toolId) return;
      updateToolStatus(projectId, toolId, nextStatus);
    },
    [projectId, toolId, updateToolStatus]
  );

  // --- Ejemplos del catálogo ----------------------------------------------

  const examples = toolInfo?.examples?.length ? toolInfo.examples : NO_EXAMPLES;

  const exampleTitles = useMemo(
    () => examples.map((ex, i) => ex?.title || `Ejemplo ${i + 1}`),
    [examples]
  );

  /**
   * Rellena el estado local con un ejemplo del catálogo. NO guarda: el usuario
   * revisa y decide. Así "Cargar ejemplo" nunca destruye trabajo persistido.
   * @param {number} [index=0]
   * @returns {boolean} true si el ejemplo existía y se aplicó.
   */
  const loadExample = useCallback(
    (index = 0) => {
      const example = examples[index];
      if (!example) return false;
      const { adaptExample: adapt, defaultData: fallback } = optionsRef.current;
      const adapted = adapt(clone(example), clone(fallback));
      if (isEmptyData(adapted)) return false;
      setDataState(adapted);
      setError(null);
      return true;
    },
    [examples]
  );

  // --- Aviso de cambios sin guardar ---------------------------------------
  useEffect(() => {
    if (!warnOnUnload || !isDirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [warnOnUnload, isDirty]);

  return {
    // datos
    data,
    setData,
    patch,
    // persistencia
    save,
    discard,
    reset,
    isDirty,
    isSaving,
    justSaved,
    lastSavedAt, // ISO string → pásalo por formatRelative() de src/lib/format.js
    error,
    // ciclo de vida
    ready: hydrated && !loading,
    project,
    // estado de la herramienta
    status: entry?.status || 'not_started',
    notes: entry?.notes || '',
    markStatus,
    // ejemplos
    examples,
    exampleTitles,
    hasExamples: examples.length > 0,
    loadExample,
    toolInfo,
  };
}

/**
 * ---------------------------------------------------------------------------
 * EJEMPLO DE USO COMPLETO (referencia rápida para las 14 herramientas)
 * ---------------------------------------------------------------------------
 *
 * import useToolData from '../hooks/useToolData';
 * import ToolToolbar from '../components/tools/ToolToolbar';
 * import EmptyState from '../components/common/EmptyState';
 * import GradientButton from '../components/common/GradientButton';
 * import { formatPercent } from '../lib/format';
 *
 * const TOOL_ID = 'pareto-chart'; // debe existir en src/data/tools.js y toolsData.js
 *
 * // Forma COMPLETA del estado vacío, alineada a la semilla de projects.js.
 * const DEFAULT_DATA = {
 *   title: '',
 *   categories: [],
 *   values: [],
 *   cumulative: [],
 * };
 *
 * export default function ParetoChart({ projectId }) {
 *   const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, {
 *     // Solo si las llaves del ejemplo de toolsData.js no coinciden con tu
 *     // estado local (11 de 14 herramientas NO necesitan esto):
 *     // adaptExample: (ex, def) => ({ ...def, categories: ex.customerSegments ?? [] }),
 *     //
 *     // OBLIGATORIO en las 9 herramientas que hoy escriben a una clave legacy
 *     // en la raíz del proyecto (ver tabla del brief, sección 7). Ejemplo
 *     // para CtqDashboard, que hoy escribe `project.ctqData`:
 *     // legacy: (p) => p.ctqData || null,
 *   });
 *
 *   // ToolPage ya muestra un Skeleton mientras el contexto carga; no
 *   // renderices el formulario en blanco antes de tiempo.
 *   if (!t.ready) return null;
 *
 *   const vacio = t.data.categories.length === 0;
 *
 *   return (
 *     <div className="p-4 sm:p-6">
 *       {// Barra compartida: SaveStatus + Ver un ejemplo + Cancelar/Guardar. }
 *       <ToolToolbar tool={t} />
 *
 *       {vacio ? (
 *         <EmptyState
 *           title="Pocas causas, casi todo el problema"
 *           description="Registra tus categorías de defectos y sus frecuencias para separar las pocas vitales de las muchas triviales."
 *           action={<GradientButton onClick={agregarCategoria}>Agregar primera categoría</GradientButton>}
 *           secondaryAction={t.hasExamples && (
 *             <GradientButton variant="outline" onClick={() => t.loadExample(0)}>
 *               Ver un ejemplo
 *             </GradientButton>
 *           )}
 *         />
 *       ) : (
 *         <div className="space-y-6">
 *           {// Cambios simples de un campo de la raíz de `data`: }
 *           <input
 *             value={t.data.title ?? ''}
 *             onChange={(e) => t.patch({ title: e.target.value })}
 *             className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-content"
 *           />
 *
 *           {// Colecciones anidadas: usar el updater de setData, nunca mutar. }
 *           <button
 *             type="button"
 *             onClick={() =>
 *               t.setData((prev) => ({
 *                 ...prev,
 *                 categories: [...prev.categories, { id: crypto.randomUUID(), name: '', count: 0 }],
 *               }))
 *             }
 *           >
 *             Agregar categoría
 *           </button>
 *
 *           <span className="tabular-nums">{formatPercent(0.8, 1)}</span>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 *
 * // ProjectCharter (único caso) escribe además campos de la raíz del
 * // proyecto en el MISMO commit que el guardado de su `data`, usando el
 * // segundo parámetro de `save()`. La clave `tools` dentro de ese objeto se
 * // ignora (con warning en DEV) precisamente para que nadie borre las otras
 * // 13 herramientas por accidente:
 * //
 * //   t.save({ name: t.data.name, description: t.data.description, team: t.data.team });
 * //
 * // Ninguna otra herramienta debería necesitar extraProjectFields. Si crees
 * // que la tuya sí, repórtalo en vez de improvisar una escritura a la raíz.
 * ---------------------------------------------------------------------------
 */
