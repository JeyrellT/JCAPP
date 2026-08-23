/**
 * ErrorBoundary.jsx
 * ---------------------------------------------------------------------------
 * Límite de error de React. Debe ser un componente de clase: React 18 no
 * tiene equivalente en hooks para `getDerivedStateFromError`/`componentDidCatch`.
 *
 * El fallback por defecto es autocontenido a propósito (no importa
 * `EmptyState` ni nada de `src/components/common/status-atoms`, que corre en
 * un carril paralelo): así F1 no depende de F2 y este boundary puede montarse
 * de inmediato en `MainLayout`.
 *
 * `resetKeys` permite que el consumidor limpie el error automáticamente
 * cuando cambia de contexto (p. ej. `resetKeys={[toolId, projectId]}` en
 * ToolPage, para recuperarse al cambiar de herramienta).
 * ---------------------------------------------------------------------------
 */
import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import GradientButton from './GradientButton';

class ErrorBoundary extends Component {
  /**
   * @param {Object} props
   * @param {React.ReactNode} props.children
   * @param {React.ReactNode|((args: {error: Error, reset: Function}) => React.ReactNode)} [props.fallback]
   *   Nodo o función render para personalizar la UI de error. Si se omite, se usa el fallback por defecto.
   * @param {Array<*>} [props.resetKeys] - Si algún elemento cambia por identidad respecto al render
   *   anterior, el boundary limpia el error automáticamente y llama a `onReset`.
   * @param {Function} [props.onReset] - Se invoca cuando el boundary se limpia (manual o vía resetKeys).
   */
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  componentDidUpdate(prevProps) {
    const { resetKeys } = this.props;
    if (!this.state.error || !resetKeys) return;

    const prevKeys = prevProps.resetKeys || [];
    const changed =
      resetKeys.length !== prevKeys.length || resetKeys.some((key, i) => key !== prevKeys[i]);

    if (changed) {
      this.reset();
    }
  }

  reset() {
    this.setState({ error: null });
    this.props.onReset?.();
  }

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;

    if (typeof fallback === 'function') {
      return fallback({ error, reset: this.reset });
    }
    if (fallback) return fallback;

    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger-on">
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-content">Esto no estaba en el plan</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-content-secondary">
          Algo falló al mostrar esta sección. Tus datos siguen a salvo en este dispositivo.
        </p>
        {import.meta.env.DEV && (
          <code className="mx-auto mt-3 block max-w-full overflow-x-auto rounded-md bg-surface-sunken px-3 py-2 text-left text-xs text-content-secondary">
            {error.message}
          </code>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <GradientButton variant="solid" onClick={this.reset}>
            Reintentar
          </GradientButton>
          <GradientButton variant="outline" to="/">
            Volver al inicio
          </GradientButton>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
