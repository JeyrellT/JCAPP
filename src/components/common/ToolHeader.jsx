import { useState } from 'react';
import { Save, X, Maximize2, Minimize2, Info, HelpCircle, Download, Edit } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import GradientButton from './GradientButton';
import PhaseBadge from './PhaseBadge';
import { transition } from '../../lib/motion';

// Ayuda por defecto, solo para las herramientas que aún no pasan `helpItems`
// explícito (cubre 4 de 14 — el resto simplemente no muestra botón de ayuda).
const FALLBACK_HELP = {
  'Diagrama Causa-Efecto': [
    'También conocido como diagrama de Ishikawa o espina de pescado.',
    'Ayuda a identificar posibles causas de un problema organizadas por categorías.',
    'Utiliza el modo de edición para añadir o modificar el problema central, categorías y causas.',
    'Puedes personalizar las "6M" (Método, Mano de obra, etc.) según tus necesidades.',
  ],
  'Gráfico de Control': [
    'Monitorea la estabilidad de un proceso a lo largo del tiempo.',
    'Detecta variaciones anómalas fuera de los límites de control.',
    'Utiliza la pestaña de datos para añadir o modificar puntos de medición.',
    'Configura los límites de control y el objetivo en la pestaña de configuración.',
    'Exporta los datos en formato CSV para análisis adicional.',
  ],
  'Diagrama de Pareto': [
    'Visualiza causas de problemas ordenadas por frecuencia o impacto.',
    'Sigue el principio 80/20 (el 80% de los efectos proviene del 20% de las causas).',
    'Identifica las causas más significativas para priorizar acciones.',
    'Añade o modifica causas y sus valores en el modo de edición.',
    'Los resultados se ordenan automáticamente de mayor a menor impacto.',
  ],
  'Metodología 5S': [
    'Organiza el lugar de trabajo mediante 5 principios japoneses.',
    'Seiri (Clasificar): elimina lo innecesario.',
    'Seiton (Ordenar): un lugar para cada cosa y cada cosa en su lugar.',
    'Seiso (Limpiar): mantén limpio el espacio de trabajo.',
    'Seiketsu (Estandarizar): crea normas para mantener el orden.',
    'Shitsuke (Mantener): crea hábitos basados en las 4S anteriores.',
  ],
};

/**
 * Encabezado INTERNO de una herramienta Lean Six Sigma: lo renderiza cada
 * componente de `src/tools/` dentro de su propio cuerpo. El encabezado de la
 * PÁGINA (breadcrumbs, `<h1>` real de la ruta) lo pone `ToolPage` con
 * `PageHeader` — este componente no debe duplicar ese título a nivel de
 * página, es la cabecera embebida de la herramienta.
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono de la herramienta.
 * @param {string} props.title - Título de la herramienta.
 * @param {string} props.description - Descripción corta.
 * @param {boolean} props.isEditing - Estado de edición.
 * @param {Function} props.setIsEditing - Cambia el estado de edición.
 * @param {boolean} props.isFullscreen - Estado de pantalla completa.
 * @param {Function} props.toggleFullscreen - Alterna pantalla completa.
 * @param {Function} props.saveChanges - Guarda los cambios.
 * @param {boolean} props.isSaving - Guardado en progreso.
 * @param {Function} [props.exportData] - Si se provee, muestra el botón "Exportar".
 * @param {string[]} [props.helpItems] - Puntos de ayuda de esta herramienta. Si se
 *   omite, se usa un mapa de respaldo por título (cubre solo 4 de 14 herramientas);
 *   si tampoco hay respaldo, no se muestra el botón de ayuda.
 * @param {string} [props.phase] - Fase DMAIC de la herramienta; si se provee, se
 *   muestra como `PhaseBadge` junto al título.
 * @param {string} [props.className]
 */
const ToolHeader = ({
  icon: Icon,
  title,
  description,
  isEditing,
  setIsEditing,
  isFullscreen,
  toggleFullscreen,
  saveChanges,
  isSaving,
  exportData,
  helpItems,
  phase,
  className = '',
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const resolvedHelpItems = helpItems || FALLBACK_HELP[title] || null;

  return (
    <div className={`relative overflow-hidden rounded-lg bg-surface p-6 shadow-md ${className}`}>
      <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-bl-full bg-surface-sunken" aria-hidden="true" />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <motion.h1
          initial={shouldReduceMotion ? false : { x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={transition.enter}
          className="flex items-center text-2xl font-bold text-content sm:text-3xl"
        >
          {Icon && <Icon className="mr-3 shrink-0" size={32} aria-hidden="true" />}
          {title}
          {phase && <PhaseBadge phase={phase} className="ml-3" />}
        </motion.h1>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!isEditing ? (
            <>
              {exportData && (
                <GradientButton
                  variant="outline"
                  size="sm"
                  onClick={exportData}
                  leadingIcon={<Download size={16} aria-hidden="true" />}
                >
                  Exportar
                </GradientButton>
              )}
              <GradientButton
                variant="solid"
                size="sm"
                onClick={() => setIsEditing(true)}
                leadingIcon={<Edit size={16} aria-hidden="true" />}
              >
                Editar
              </GradientButton>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-lg bg-surface-sunken p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-raised"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              {resolvedHelpItems && (
                <button
                  type="button"
                  onClick={() => setShowHelp((v) => !v)}
                  className="rounded-lg bg-surface-sunken p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-raised"
                  title="Ayuda"
                  aria-expanded={showHelp}
                >
                  <HelpCircle size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              <GradientButton
                variant="success"
                size="sm"
                onClick={saveChanges}
                loading={isSaving}
                leadingIcon={!isSaving ? <Save size={16} aria-hidden="true" /> : undefined}
              >
                Guardar
              </GradientButton>
              <GradientButton
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                leadingIcon={<X size={16} aria-hidden="true" />}
              >
                Cancelar
              </GradientButton>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-lg bg-surface-sunken p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-raised"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="flex items-center text-sm text-content-secondary">
        <Info size={14} className="mr-1 shrink-0" aria-hidden="true" />
        {description}
      </p>

      {showHelp && resolvedHelpItems && (
        <motion.div
          initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={transition.base}
          className="mt-4 overflow-hidden rounded-lg border border-line bg-surface-sunken p-4"
        >
          <h3 className="mb-2 flex items-center font-medium text-content">
            <HelpCircle size={16} className="mr-2" aria-hidden="true" />
            Ayuda rápida: {title}
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-content-secondary">
            {resolvedHelpItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ToolHeader;
