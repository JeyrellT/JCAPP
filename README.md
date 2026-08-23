# JCAPP — Lean Six Sigma App

Herramienta interna de JC Analytic para gestionar proyectos de mejora continua bajo la metodología Lean Six Sigma (DMAIC): crear proyectos, avanzar por las 5 fases y completar 14 herramientas estándar (SIPOC, Pareto, FMEA, Control Chart, etc.) con persistencia real de los datos capturados.

No tiene backend. Todos los datos viven en `localStorage` del navegador (ver `src/utils/storage.js`, clave principal `lean_six_sigma_projects`). No hay autenticación, ni sincronización entre dispositivos, ni copia en la nube: lo que no se exporta manualmente desde *Configuración*, vive únicamente en ese navegador y ese equipo.

## Stack

- **React 18** — con el JSX runtime automático (no hace falta `import React` salvo que se use como valor).
- **Vite 5** — dev server y build.
- **React Router 6** — enrutamiento (`base` es `/JCAPP/` en build para GitHub Pages, `/` en dev).
- **Tailwind CSS 3** — utilidades, con sistema de tokens propio (ver más abajo).
- **framer-motion** — animaciones y transiciones.
- **recharts** — gráficas (Pareto, control charts, reportes).
- **react-hook-form** — formularios.
- **date-fns** (locale `es-CR`) — fechas. **`dayjs` está prohibido en código nuevo**, ver `src/lib/format.js`.
- **gantt-task-react** — el Gantt de `ProjectTimeline`.
- **vitest** — tests.

## Requisitos y arranque

- Node ≥ 18.

```bash
npm install
npm run dev      # http://localhost:3000, abre el navegador automáticamente
```

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo de Vite en el puerto 3000. |
| `npm run build` | Genera el build de producción en `dist/` (con `base: /JCAPP/`). |
| `npm run preview` | Sirve el build de `dist/` localmente para verificarlo antes de desplegar. |
| `npm run lint` | ESLint sobre `.js`/`.jsx`. |
| `npm run lint:strict` | Igual que `lint`, pero falla si hay algún warning (`--max-warnings 0`); es la puerta de calidad de CI. |
| `npm test` | Corre la suite de Vitest. |

## Estructura de carpetas

```
src/
├─ components/   # UI reutilizable: ui/ (primitivos), layout/, forms/, common/, project/, data/, tools/, navigation/
├─ contexts/     # Estado global de React: proyectos (LeanSixSigmaContext) y tema (ThemeContext)
├─ data/         # Datos semilla y catálogo: proyectos de ejemplo, catálogo de herramientas, ejemplos por herramienta
├─ hooks/        # Hooks compartidos: useToolData (persistencia), useDocumentTitle
├─ lib/          # Funciones puras: format.js (fechas/números/moneda), phases.js (fases y estados), motion.js (variantes de animación)
├─ pages/        # Una página por ruta (Home, Projects, ProjectDetails, NewProject, Reports, Settings, Tools, Methodology, NotFound)
├─ tools/        # Las 14 herramientas Lean Six Sigma, una por archivo
└─ utils/        # storage.js (localStorage) y export.js (exportar/importar JSON)
```

## Las 14 herramientas

| Herramienta | Fase DMAIC |
|---|---|
| Project Charter | Define |
| SIPOC | Define |
| VOC (Voice of Customer) | Define |
| Análisis de Stakeholders | Define |
| Calculadora de ROI | Define |
| CTQ (Critical to Quality) | Measure |
| Value Stream Map | Analyze |
| Diagrama Causa-Efecto | Analyze |
| Diagrama de Pareto | Analyze |
| Matriz de Priorización | Improve |
| FMEA (Failure Mode and Effects Analysis) | Improve |
| 5S | Improve |
| Control Chart | Control |
| Timeline / Gantt | Control |

El catálogo completo (nombre, descripción, fase, componente y datos de ejemplo) vive en `src/data/toolsData.js`. Cada herramienta se renderiza en `src/pages/ToolPage.jsx` según el `component` declarado ahí.

## Sistema de diseño

Los colores y superficies no se escriben como valores fijos: se leen de **tokens CSS** definidos en `src/index.css` (`--jc-bg-app`, `--jc-surface`, `--jc-content`, `--jc-brand`, `--jc-phase-*`, etc., con variantes para modo oscuro) y expuestos como utilidades de Tailwind en `tailwind.config.js` (`bg-app`, `text-content`, `bg-surface-raised`, colores `primary/secondary/accent/neutral`, `phase.*`...). El tema claro/oscuro se resuelve cambiando esas variables, **no** con clases `dark:` — el proyecto no las usa. Tampoco se construyen clases de Tailwind dinámicamente (nada de `` `text-${variable}` ``, rompe el purge).

Los badges de fase DMAIC y de estado de herramienta/proyecto se resuelven **siempre** vía `src/lib/phases.js` (`getPhaseToken`, `getToolStatusToken`, etc.), nunca con lógica ad-hoc en cada página. Fechas, números y moneda se resuelven **siempre** vía `src/lib/format.js` (locale `es-CR`).

## Persistencia y el hook `useToolData`

Toda herramienta guarda sus datos en la misma ruta canónica: `project.tools[toolId].data`, dentro del proyecto en `localStorage`. Esto se centralizó en `src/hooks/useToolData.js` después de que varias herramientas escribieran a claves inventadas en la raíz del proyecto o, peor, no persistieran nada.

**Si agregas una herramienta nueva, usa este hook — no reinventes la persistencia:**

```js
const {
  data, patch, save, discard, isDirty, isSaving, lastSavedAt, status, markStatus,
  hasExamples, exampleTitles, loadExample, ready, error,
} = useToolData(projectId, 'mi-herramienta', defaultData);
```

El hook resuelve por ti: el merge anti-borrado de las otras 13 herramientas al guardar, la relectura del proyecto vivo (evita pisar cambios ajenos con datos obsoletos del closure), que la hidratación inicial no vuelva a pisar lo que el usuario ya está escribiendo, el ciclo de `isDirty`/`isSaving`/`lastSavedAt`, y la carga de ejemplos vía "Ver un ejemplo" sin tocar lo guardado en disco. El docblock al inicio del archivo documenta el contrato completo con más detalle.

Registra la herramienta nueva en `src/data/toolsData.js` (con su `component`, `phase` y, si aplica, `example`) y en `src/pages/ToolPage.jsx`.

## Despliegue

GitHub Pages, vía `deploy-to-gh-pages.ps1` (build + push a la rama `gh-pages` del repo `JeyrellT/JCAPP`). El `base` de Vite ya está configurado para esa ruta (`/JCAPP/`) al compilar.

## Tests

Hay tests de `src/utils/storage.js`, `src/lib/phases.js`, `src/lib/format.js` y `src/hooks/useToolData.js`. No hay tests de componentes ni end-to-end.
