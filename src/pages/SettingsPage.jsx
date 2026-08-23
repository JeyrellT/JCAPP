/**
 * SettingsPage.jsx
 * ---------------------------------------------------------------------------
 * Página de configuración. Reescrita por completo para el Ciclo 2:
 *
 * - Se retiran las pestañas "Perfil" y "Seguridad": no tenían backend ni
 *   persistencia real (nombre/correo fabricados, cambio de contraseña sin
 *   autenticación, "sesiones activas" inventadas). Ningún control debe
 *   simular algo que no ocurre.
 * - Se retira el selector de idioma/formato/densidad/tamaño de fuente y el
 *   botón global "Guardar cambios": ninguno tenía implementación.
 * - Quedan tres secciones reales: Apariencia (ThemeContext), Preferencias
 *   (persistidas con saveSettings/loadSettings) y Datos y respaldo (el
 *   corazón del carril: exportar, restaurar, generar paquete de proyecto y
 *   restablecer los datos de ejemplo).
 * ---------------------------------------------------------------------------
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

import { useTheme } from '../contexts/ThemeContext';
import { useLeanSixSigma } from '../contexts/LeanSixSigmaContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatNumber } from '../lib/format';
import { exportAllProjects, exportKpiComparison } from '../utils/export';
import storage, { saveSettings, loadSettings, removeData } from '../utils/storage';
import pkg from '../../package.json';

import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import GradientButton from '../components/common/GradientButton';
import Notification from '../components/common/Notification';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/ui/Modal';
import FileConnector from '../components/data/FileConnector';
import GitHubExporter from '../components/common/GitHubExporter';

const PREF_COPY = {
  autoSave: {
    label: 'Autoguardado',
    description: 'Tu preferencia se guarda en este navegador y se aplicará en los formularios que la usen.',
  },
  showHelp: {
    label: 'Mostrar ayuda en herramientas',
    description: 'Tu preferencia se guarda en este navegador y se aplicará en las herramientas que la usen.',
  },
};

/**
 * Interruptor accesible (role="switch") sobre tokens del sistema. Solo se
 * usa dentro de esta página.
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} [props.description]
 * @param {boolean} props.checked
 * @param {() => void} props.onChange
 */
const PreferenceToggle = ({ id, label, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-3">
    <div className="min-w-0 pr-4">
      <label htmlFor={id} className="block text-sm font-medium text-content">
        {label}
      </label>
      {description && <p className="mt-0.5 text-sm text-content-secondary">{description}</p>}
    </div>
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-fast ${
        checked ? 'bg-brand' : 'border border-line bg-surface-sunken'
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 transform rounded-full bg-surface shadow-xs transition-transform duration-fast ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SettingsPage = () => {
  useDocumentTitle('Configuración');

  const { theme, setTheme } = useTheme();
  const { projects, tools, getProject, addProject, updateProject } = useLeanSixSigma();

  const [prefs, setPrefs] = useState(() => ({ autoSave: true, showHelp: true, ...loadSettings() }));
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');

  const notify = (message, type = 'success') => setNotification({ show: true, message, type });

  // --- Apariencia --------------------------------------------------------
  const handleSelectSystem = () => {
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false;
    setTheme(prefersDark ? 'dark' : 'light');
    notify('Tema sincronizado con la preferencia de tu sistema.');
  };

  // --- Preferencias --------------------------------------------------------
  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    saveSettings(next);
    notify(`${PREF_COPY[key].label}: ${next[key] ? 'activado' : 'desactivado'}.`);
  };

  // --- Exportación ---------------------------------------------------------
  const handleExportAll = () => {
    const ok = exportAllProjects(projects);
    notify(ok ? 'Cartera exportada como JSON.' : 'No se pudo exportar la cartera.', ok ? 'success' : 'error');
  };

  const handleExportKpi = () => {
    const ok = exportKpiComparison(projects);
    notify(
      ok ? 'Comparativo de KPIs exportado como JSON.' : 'No se pudo exportar el comparativo de KPIs.',
      ok ? 'success' : 'error'
    );
  };

  // --- Restauración ---------------------------------------------------------
  const handleRestoreData = async ({ json, fileName }) => {
    const list = Array.isArray(json) ? json : json?.projects ?? (json?.id ? [json] : []);

    if (!list.length) {
      notify('El archivo no contiene proyectos reconocibles.', 'error');
      return;
    }

    let imported = 0;
    const rejected = [];

    for (const item of list) {
      if (!item || !item.id || !item.name) {
        rejected.push(`${item?.name || item?.id || 'proyecto sin nombre'}: faltan campos obligatorios (id o nombre)`);
        continue;
      }
      try {
        if (getProject(item.id)) {
          updateProject(item.id, item);
        } else {
          // addProject genera el id como `project-${Date.now()}` y no
          // conserva el id original del respaldo: un proyecto nuevo entra
          // con un id distinto al que traía el archivo. Es una limitación
          // conocida del contexto (fuera de este carril), no un bug de esta
          // página.
          addProject(item);
        }
        imported += 1;
      } catch (error) {
        rejected.push(`${item.name || item.id}: ${error.message}`);
      }
      // Se espacian las altas para que dos `Date.now()` seguidos no colisionen.
      await new Promise((resolve) => setTimeout(resolve, 3));
    }

    setRestoreOpen(false);
    setRestoreResult({ imported, total: list.length, rejected, fileName });
    notify(
      rejected.length
        ? `Se importaron ${imported} de ${list.length} proyectos. ${rejected.length} rechazado(s).`
        : `Se importaron ${imported} proyecto${imported === 1 ? '' : 's'} de ${fileName}.`,
      rejected.length ? 'warning' : 'success'
    );
  };

  // --- Restablecer datos de ejemplo -----------------------------------------
  const handleConfirmReset = () => {
    removeData(storage.STORAGE_KEYS.PROJECTS);
    removeData(storage.STORAGE_KEYS.TOOLS);
    window.location.reload();
  };

  return (
    <PageContainer width="narrow" gap="lg">
      <PageHeader
        title="Configuración"
        description="Personaliza la aplicación y gestiona los datos guardados en este navegador."
      />

      {/* Apariencia */}
      <section className="card p-6">
        <p className="section-label mb-1">Apariencia</p>
        <h2 className="text-lg font-semibold text-content">Tema</h2>
        <p className="mt-1 text-sm text-content-secondary">
          El tema se guarda en este navegador y se aplica al instante.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            aria-pressed={theme === 'light'}
            className={`relative flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors duration-fast ${
              theme === 'light' ? 'border-brand bg-brand/5' : 'border-line hover:bg-surface-sunken'
            }`}
          >
            {theme === 'light' && <Check size={16} className="absolute right-2 top-2 text-brand" aria-hidden="true" />}
            <Sun size={20} className="text-content-secondary" aria-hidden="true" />
            <span className="text-sm font-medium text-content">Claro</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            aria-pressed={theme === 'dark'}
            className={`relative flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors duration-fast ${
              theme === 'dark' ? 'border-brand bg-brand/5' : 'border-line hover:bg-surface-sunken'
            }`}
          >
            {theme === 'dark' && <Check size={16} className="absolute right-2 top-2 text-brand" aria-hidden="true" />}
            <Moon size={20} className="text-content-secondary" aria-hidden="true" />
            <span className="text-sm font-medium text-content">Oscuro</span>
          </button>

          <button
            type="button"
            onClick={handleSelectSystem}
            className="flex flex-col items-center gap-2 rounded-lg border border-line p-4 transition-colors duration-fast hover:bg-surface-sunken"
          >
            <Monitor size={20} className="text-content-secondary" aria-hidden="true" />
            <span className="text-sm font-medium text-content">Sistema</span>
          </button>
        </div>
        <p className="mt-3 text-xs text-content-muted">
          &quot;Sistema&quot; aplica ahora mismo la preferencia de tu sistema operativo. No queda sincronizado en
          adelante: si tu sistema cambia de tema más tarde, vuelve a pulsarlo.
        </p>
      </section>

      {/* Preferencias */}
      <section className="card p-6">
        <p className="section-label mb-1">Preferencias</p>
        <h2 className="text-lg font-semibold text-content">Comportamiento</h2>

        <div className="mt-2 divide-y divide-line-subtle">
          <PreferenceToggle
            id="pref-autosave"
            label={PREF_COPY.autoSave.label}
            description={PREF_COPY.autoSave.description}
            checked={prefs.autoSave}
            onChange={() => togglePref('autoSave')}
          />
          <PreferenceToggle
            id="pref-showhelp"
            label={PREF_COPY.showHelp.label}
            description={PREF_COPY.showHelp.description}
            checked={prefs.showHelp}
            onChange={() => togglePref('showHelp')}
          />
        </div>
      </section>

      {/* Datos y respaldo */}
      <section className="card border-line p-6">
        <p className="section-label mb-1">Datos y respaldo</p>
        <h2 className="text-lg font-semibold text-content">Tus datos</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Todo lo que ves vive en este navegador. Si limpias el historial o cambias de equipo, se pierde — exporta
          un respaldo de vez en cuando.
        </p>
        <p className="mt-2 text-sm text-content-secondary">
          {formatNumber(projects.length)} proyecto{projects.length === 1 ? '' : 's'} y {formatNumber(tools.length)}{' '}
          herramienta{tools.length === 1 ? '' : 's'} almacenados en este navegador.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <GradientButton variant="outline" size="sm" leadingIcon={<Download size={16} />} onClick={handleExportAll}>
            Exportar cartera completa (JSON)
          </GradientButton>
          <GradientButton variant="outline" size="sm" leadingIcon={<Download size={16} />} onClick={handleExportKpi}>
            Exportar comparativo de KPIs (JSON)
          </GradientButton>
          <GradientButton variant="outline" size="sm" leadingIcon={<Upload size={16} />} onClick={() => setRestoreOpen(true)}>
            Restaurar desde archivo
          </GradientButton>
        </div>

        {restoreResult && (
          <div className="mt-4 rounded-lg border border-line bg-surface-sunken p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-content">
                Se importaron <strong>{restoreResult.imported}</strong> de {restoreResult.total} proyectos de{' '}
                <span className="text-content-secondary">{restoreResult.fileName}</span>.
              </p>
              <button
                type="button"
                onClick={() => setRestoreResult(null)}
                aria-label="Cerrar resumen de restauración"
                className="shrink-0 rounded p-0.5 text-content-muted hover:text-content"
              >
                <X size={16} />
              </button>
            </div>
            {restoreResult.rejected.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-danger-on">
                {restoreResult.rejected.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-line-subtle pt-6">
          <h3 className="text-sm font-semibold text-content">Exportar paquete de proyecto</h3>
          <p className="mt-1 text-sm text-content-secondary">
            Genera los archivos de un proyecto (JSON, README y flujo de CI/CD) para que los subas tú a tu propio
            repositorio.
          </p>

          {projects.length === 0 ? (
            <EmptyState
              className="mt-4"
              size="sm"
              variant="sin-datos"
              title="No hay proyectos que exportar"
              description="Crea un proyecto primero para poder generar su paquete."
            />
          ) : (
            <>
              <div className="mt-4 max-w-xs">
                <label htmlFor="package-project" className="mb-1 block text-sm font-medium text-content">
                  Proyecto
                </label>
                <select
                  id="package-project"
                  className="input"
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProjectId && <GitHubExporter projectId={selectedProjectId} className="mt-4" />}
            </>
          )}
        </div>
      </section>

      {/* Zona de riesgo */}
      <section className="card border-danger/40 p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-danger-soft p-2 text-danger-on">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-content">Restablecer datos de ejemplo</h2>
            <p className="mt-1 text-sm text-content-secondary">
              Borra los proyectos y herramientas guardados en este navegador y los reemplaza por los datos de
              ejemplo originales. Si quieres conservar tus proyectos actuales, expórtalos primero.
            </p>
            <GradientButton
              className="mt-4"
              variant="danger"
              size="sm"
              leadingIcon={<RotateCcw size={16} />}
              onClick={() => setResetOpen(true)}
            >
              Restablecer datos de ejemplo
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Acerca de */}
      <section className="card p-6">
        <p className="section-label mb-1">Acerca de</p>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full bg-surface-sunken p-2 text-content-secondary">
            <Info size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-content">JC Analytic</h2>
            <p className="mt-1 text-sm text-content-secondary">
              Versión {pkg.version} · {formatNumber(tools.length)} herramientas disponibles
            </p>
            <Link
              to="/methodology"
              className="mt-2 inline-flex items-center gap-1 rounded text-sm font-medium text-brand transition-colors duration-fast hover:text-brand-hover"
            >
              Ver la metodología DMAIC
            </Link>
          </div>
        </div>
      </section>

      {/* Modal: restaurar desde archivo */}
      <Modal open={restoreOpen} onClose={() => setRestoreOpen(false)} size="lg">
        <FileConnector
          accept={['json']}
          maxSizeMb={10}
          title="Restaurar respaldo"
          description="El archivo se lee en tu equipo. Nada se sube a ningún servidor."
          onData={handleRestoreData}
          onCancel={() => setRestoreOpen(false)}
        />
      </Modal>

      {/* Modal: confirmar restablecimiento */}
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Restablecer los datos de ejemplo"
        description="Esta acción reemplaza lo que hay guardado en este navegador."
        footer={
          <>
            <GradientButton variant="ghost" onClick={() => setResetOpen(false)}>
              Conservar mis datos
            </GradientButton>
            <GradientButton variant="danger" onClick={handleConfirmReset}>
              Restablecer datos de ejemplo
            </GradientButton>
          </>
        }
      >
        <p className="text-sm text-content-secondary">
          Se borrarán los {formatNumber(projects.length)} proyectos guardados en este navegador y se reemplazarán
          por los datos de ejemplo originales. Esta acción no se puede deshacer. Si quieres conservar tus proyectos
          actuales, cierra esta ventana y usa &quot;Exportar cartera completa&quot; primero.
        </p>
      </Modal>

      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        duration={4000}
      />
    </PageContainer>
  );
};

export default SettingsPage;
