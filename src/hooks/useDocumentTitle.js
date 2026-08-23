/**
 * useDocumentTitle.js
 * ---------------------------------------------------------------------------
 * Escribe `document.title` con un sufijo consistente en toda la app y lo
 * restaura al desmontar. Tolera `title` undefined (p. ej. mientras un
 * proyecto todavía no cargó del contexto): en ese caso solo se usa el sufijo.
 * ---------------------------------------------------------------------------
 */
import { useEffect } from 'react';

/**
 * @param {string|undefined} title - Título específico de la página. Opcional.
 * @param {Object} [options]
 * @param {string} [options.suffix='JC Analytic'] - Marca que se añade siempre.
 */
export default function useDocumentTitle(title, { suffix = 'JC Analytic' } = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${suffix}` : suffix;

    return () => {
      document.title = previousTitle;
    };
  }, [title, suffix]);
}
