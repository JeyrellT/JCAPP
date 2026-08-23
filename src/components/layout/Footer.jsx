import { Link } from 'react-router-dom';

/**
 * Pie de página reducido a una sola línea de servicio: sin redes sociales
 * genéricas ni enlaces sin destino real. El dato de almacenamiento local no es
 * adorno: informa al usuario que sus datos viven solo en este navegador.
 */
const Footer = () => {
  return (
    <footer className="border-t border-line-subtle bg-app">
      <div className="mx-auto flex w-full max-w-page flex-col items-center gap-1.5 px-4 py-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8">
        <p className="text-xs text-content-muted">
          JC Analytic · Lean Six Sigma · v0.1.0 · Los datos se guardan localmente en este navegador
        </p>
        <Link
          to="/methodology"
          className="text-xs font-medium text-content-muted transition-colors duration-fast hover:text-brand"
        >
          Metodología
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
