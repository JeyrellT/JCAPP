import { useCallback, useId, useState } from 'react';
import { Upload, FileText, FileJson, AlertTriangle, Check, X } from 'lucide-react';
import GradientButton from '../common/GradientButton';
import { importFromJson } from '../../utils/export';

const EXT_LABEL = { csv: 'CSV (.csv)', json: 'JSON (.json)' };

/**
 * Lee un archivo CSV de texto en headers + filas.
 * Divide primero por salto de línea (no admite campos con saltos de línea
 * incrustados) y soporta comillas dobles y comas dentro de un campo.
 * @param {string} text
 * @returns {{ headers: string[], rows: Record<string, string>[] }}
 */
function parseCsvText(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    throw new Error('El archivo está vacío.');
  }

  const parseLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseLine(lines[0]).map((h) => h || '(sin nombre)');
  if (headers.length === 0 || headers.every((h) => !h)) {
    throw new Error('No se encontró una fila de encabezados.');
  }

  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });
    return row;
  });

  if (rows.length === 0) {
    throw new Error('El archivo tiene encabezados pero ninguna fila de datos.');
  }

  return { headers, rows };
}

/**
 * Resume un JSON importado para previsualización: si es un array, cuenta sus
 * elementos y detecta las claves del primero; si es un objeto, lista sus
 * claves de primer nivel y, cuando el valor es un array, su longitud.
 */
function summarizeJson(json) {
  if (Array.isArray(json)) {
    const sample = json.find((item) => item && typeof item === 'object');
    return { kind: 'array', length: json.length, keys: sample ? Object.keys(sample) : [] };
  }
  if (json && typeof json === 'object') {
    const entries = Object.keys(json).map((key) => ({
      key,
      count: Array.isArray(json[key]) ? json[key].length : undefined,
    }));
    return { kind: 'object', entries };
  }
  return { kind: 'other', entries: [] };
}

/**
 * Primitivo controlado para traer datos desde un archivo local (CSV o JSON).
 * No escribe en ningún contexto ni en el almacenamiento: parsea el archivo,
 * exige una confirmación explícita del usuario y entrega el resultado a
 * `onData`. El consumidor decide qué hacer con los datos (p. ej. restaurar
 * un respaldo en Configuración).
 *
 * @param {Object} props
 * @param {Array<'csv'|'json'>} [props.accept=['csv','json']] - Formatos permitidos.
 * @param {(result: { type: 'csv'|'json', fileName: string, headers?: string[], rows?: Record<string,string>[], json?: unknown }) => void} props.onData
 *   Se llama solo tras la confirmación explícita del usuario, con los datos ya parseados.
 * @param {() => void} [props.onCancel] - El usuario cierra el conector sin importar nada.
 * @param {number} [props.maxSizeMb=10] - Tamaño máximo de archivo aceptado.
 * @param {string} [props.title='Trae tus datos sin salir de tu navegador'] - Título visible.
 * @param {string} [props.description] - Texto de apoyo bajo el título.
 * @param {string} [props.className]
 */
export default function FileConnector({
  accept = ['csv', 'json'],
  onData,
  onCancel,
  maxSizeMb = 10,
  title = 'Trae tus datos sin salir de tu navegador',
  description,
  className = '',
}) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [reading, setReading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputId = useId();

  const acceptAttr = accept.map((a) => `.${a}`).join(',');
  const acceptLabel = accept.map((a) => EXT_LABEL[a] || a).join(' o ');

  const processFile = useCallback(
    async (file) => {
      setError(null);
      setPreview(null);

      if (!file) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !accept.includes(ext)) {
        setError(`Formato no permitido. Usa un archivo ${acceptLabel}.`);
        return;
      }

      if (file.size === 0) {
        setError('El archivo está vacío.');
        return;
      }

      const maxBytes = maxSizeMb * 1024 * 1024;
      if (file.size > maxBytes) {
        setError(`El archivo pesa más de ${maxSizeMb} MB. Usa uno más pequeño.`);
        return;
      }

      setReading(true);
      try {
        if (ext === 'csv') {
          const text = await file.text();
          const { headers, rows } = parseCsvText(text);
          setPreview({ type: 'csv', fileName: file.name, headers, rows });
        } else {
          const json = await importFromJson(file);
          setPreview({ type: 'json', fileName: file.name, json, summary: summarizeJson(json) });
        }
      } catch (err) {
        setError(err.message || 'No se pudo leer el archivo.');
      } finally {
        setReading(false);
      }
    },
    [accept, acceptLabel, maxSizeMb]
  );

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const reset = () => {
    setPreview(null);
    setError(null);
  };

  const confirmImport = () => {
    if (!preview) return;
    if (preview.type === 'csv') {
      onData?.({ type: 'csv', fileName: preview.fileName, headers: preview.headers, rows: preview.rows });
    } else {
      onData?.({ type: 'json', fileName: preview.fileName, json: preview.json });
    }
    setPreview(null);
  };

  return (
    <div className={className}>
      {title && <h3 className="text-base font-semibold text-content">{title}</h3>}
      {description && <p className="mt-1 text-sm text-content-secondary">{description}</p>}
      <p className="mt-2 text-xs text-content-muted">
        El archivo se lee en tu equipo y se guarda en el almacenamiento de este navegador. Nada se sube a ningún
        servidor.
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-danger-soft p-3 text-sm text-danger-on">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {!preview ? (
        <div className="mt-4">
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-fast ease-standard ${
              dragActive ? 'border-brand bg-brand/5' : 'border-line hover:border-line-strong'
            }`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken text-content-secondary">
              <Upload size={22} aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-content">Arrastra y suelta tu archivo aquí</p>
            <p className="mt-1 text-xs text-content-muted">o haz clic para buscarlo — {acceptLabel}, hasta {maxSizeMb} MB</p>
            <input
              id={inputId}
              type="file"
              className="sr-only"
              accept={acceptAttr}
              onChange={handleInputChange}
            />
          </label>
          {reading && (
            <p className="mt-3 flex items-center gap-2 text-sm text-content-secondary" role="status" aria-live="polite">
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-brand" aria-hidden="true" />
              Leyendo archivo…
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <Check size={16} aria-hidden="true" />
              {preview.type === 'csv'
                ? `Listo: ${preview.rows.length} filas leídas de ${preview.fileName}`
                : `Listo: contenido leído de ${preview.fileName}`}
            </p>
            <button
              type="button"
              onClick={reset}
              className="rounded p-1 text-content-muted transition-colors duration-fast hover:text-content"
              aria-label="Elegir otro archivo"
            >
              <X size={16} />
            </button>
          </div>

          {preview.type === 'csv' ? (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="bg-surface-sunken">
                  <tr>
                    {preview.headers.map((header) => (
                      <th
                        key={header}
                        className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-content-muted"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {preview.rows.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      {preview.headers.map((header) => (
                        <td key={header} className="whitespace-nowrap px-3 py-2 text-content-secondary">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-line bg-surface-sunken px-3 py-2 text-xs text-content-muted">
                {preview.headers.length} columnas · {preview.rows.length} filas en total
                {preview.rows.length > 10 ? ` (mostrando las primeras 10)` : ''}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-line p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-content">
                <FileJson size={16} className="text-content-secondary" aria-hidden="true" />
                {preview.summary.kind === 'array' ? 'Lista de elementos' : 'Objeto JSON'}
              </div>
              {preview.summary.kind === 'array' && (
                <p className="text-sm text-content-secondary">
                  {preview.summary.length} elementos
                  {preview.summary.keys.length > 0 && <> · claves: {preview.summary.keys.join(', ')}</>}
                </p>
              )}
              {preview.summary.kind === 'object' && (
                <ul className="space-y-1 text-sm text-content-secondary">
                  {preview.summary.entries.map(({ key, count }) => (
                    <li key={key}>
                      <span className="font-medium text-content">{key}</span>
                      {count !== undefined ? ` — ${count} elementos` : ''}
                    </li>
                  ))}
                </ul>
              )}
              {preview.summary.kind === 'other' && (
                <p className="text-sm text-content-secondary">El archivo no contiene un objeto ni una lista.</p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <GradientButton variant="solid" leadingIcon={<Check size={16} />} onClick={confirmImport}>
              Usar estos datos
            </GradientButton>
            <GradientButton variant="outline" leadingIcon={<FileText size={16} />} onClick={reset}>
              Elegir otro archivo
            </GradientButton>
          </div>
        </div>
      )}

      {onCancel && !preview && (
        <div className="mt-4">
          <GradientButton variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </GradientButton>
        </div>
      )}
    </div>
  );
}
