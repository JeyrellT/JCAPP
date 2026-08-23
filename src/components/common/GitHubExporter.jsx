import { useState } from 'react';
import { Github, Download, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { formatDate } from '../../lib/format';
import { formatPhase, getStatusToken, getToolStatusToken } from '../../lib/phases';
import { exportProject } from '../../utils/export';
import GradientButton from './GradientButton';
import EmptyState from './EmptyState';

const CICD_YAML = `# Flujo de trabajo de GitHub Actions
name: Lean Six Sigma CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm test

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
`;

/** Genera el slug de nombre de archivo a partir del nombre del proyecto. */
function slugify(name) {
  return (name || 'proyecto')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Construye el contenido en Markdown del README a partir de datos reales del proyecto. */
function buildReadme(project) {
  const lines = [`# ${project.name}`, ''];
  if (project.description) lines.push(project.description, '');

  lines.push('## Datos generales', '');
  lines.push(`- **Empresa:** ${project.company || '—'}`);
  lines.push(`- **Estado:** ${getStatusToken(project.status).label}`);
  lines.push(`- **Fase actual:** ${formatPhase(project.phase)}`);
  lines.push(`- **Inicio:** ${formatDate(project.startDate)}`);
  lines.push(`- **Fin:** ${formatDate(project.endDate)}`);
  lines.push('');

  if (project.team?.length) {
    lines.push('## Equipo', '');
    project.team.forEach((member) => {
      const position = member.position ? ` — ${member.position}` : '';
      lines.push(`- ${member.name} (${member.role})${position}`);
    });
    lines.push('');
  }

  if (project.kpis?.length) {
    lines.push('## KPIs', '');
    lines.push('| Indicador | Línea base | Actual | Meta |');
    lines.push('|---|---|---|---|');
    project.kpis.forEach((kpi) => {
      lines.push(`| ${kpi.name} | ${kpi.baseLine} | ${kpi.current} | ${kpi.target} |`);
    });
    lines.push('');
  }

  const toolEntries = Object.entries(project.tools || {});
  if (toolEntries.length) {
    lines.push('## Herramientas del plan', '');
    toolEntries.forEach(([toolId, entry]) => {
      const notes = entry.notes ? ` — ${entry.notes}` : '';
      lines.push(`- **${toolId}**: ${getToolStatusToken(entry.status).label}${notes}`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('_Generado desde JC Analytic. Todos los datos viven en el navegador; nada se sube a ningún servidor._');
  return lines.join('\n');
}

/** Descarga contenido de texto plano como archivo local, sin depender de utils/export.js (que solo cubre JSON/CSV). */
function downloadTextFile(content, filename, mime) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error al generar el archivo:', error);
    return false;
  }
}

/**
 * Genera y descarga localmente el paquete de archivos de un proyecto
 * (JSON, README y flujo de trabajo de GitHub Actions) para que el usuario
 * los suba él mismo a su propio repositorio. La aplicación NO se conecta a
 * GitHub: no hay token, no hay API, no hay repositorio creado en ningún sitio.
 *
 * @param {Object} props
 * @param {string} props.projectId
 * @param {string} [props.className]
 */
export default function GitHubExporter({ projectId, className = '' }) {
  const { getProject } = useLeanSixSigma();
  const project = getProject(projectId);

  const [showYaml, setShowYaml] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState(null);

  if (!project) {
    return (
      <EmptyState
        variant="no-encontrado"
        size="sm"
        title="Proyecto no encontrado"
        className={className}
      />
    );
  }

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(CICD_YAML);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('No se pudo copiar al portapapeles. Copia el texto manualmente.');
    }
  };

  const handleGenerate = () => {
    setError(null);
    setGenerated(false);
    const slug = slugify(project.name);

    const okProject = exportProject(project);
    const okReadme = downloadTextFile(buildReadme(project), `README_${slug}.md`, 'text/markdown;charset=utf-8;');
    const okYaml = downloadTextFile(CICD_YAML, 'lean-six-sigma-ci.yml', 'text/yaml;charset=utf-8;');

    if (okProject && okReadme && okYaml) {
      setGenerated(true);
    } else {
      setError('No se pudieron generar todos los archivos. Vuelve a intentarlo.');
    }
  };

  return (
    <div className={`card p-6 ${className}`}>
      <div className="mb-1 flex items-center gap-2">
        <Github size={20} className="text-content-secondary" aria-hidden="true" />
        <h3 className="text-base font-semibold text-content">Exportar paquete del proyecto</h3>
      </div>
      <p className="text-sm text-content-secondary">
        Genera los archivos de tu proyecto para que los subas tú a tu repositorio. La aplicación no se conecta a
        GitHub.
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-danger-soft p-3 text-sm text-danger-on">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {generated && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-success-soft p-3 text-sm text-success-on">
          <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Se generaron 3 archivos: el proyecto en JSON,{' '}
            <code className="font-mono text-xs">README_{slugify(project.name)}.md</code> y{' '}
            <code className="font-mono text-xs">lean-six-sigma-ci.yml</code>. Revisa las descargas de tu navegador.
          </span>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <GradientButton variant="solid" leadingIcon={<Download size={16} />} onClick={handleGenerate}>
          Generar archivos del proyecto
        </GradientButton>
        <GradientButton
          variant="outline"
          size="sm"
          trailingIcon={showYaml ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          onClick={() => setShowYaml((v) => !v)}
        >
          {showYaml ? 'Ocultar' : 'Ver'} flujo de trabajo (YAML)
        </GradientButton>
      </div>

      {showYaml && (
        <div className="mt-4">
          <div className="relative rounded-lg border border-line bg-surface-sunken p-4">
            <button
              type="button"
              onClick={handleCopyYaml}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs text-content-secondary shadow-xs transition-colors duration-fast hover:text-content"
              title="Copiar YAML"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-content-secondary">
              {CICD_YAML}
            </pre>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-content-muted">
        Todo lo que ves vive en este navegador. Los archivos se descargan a tu equipo; nada se sube a ningún
        servidor ni a ninguna cuenta de GitHub.
      </p>
    </div>
  );
}
