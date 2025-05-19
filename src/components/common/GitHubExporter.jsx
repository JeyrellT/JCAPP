import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { 
  Github, 
  Code, 
  ExternalLink, 
  Check, 
  GitBranch, 
  GitCommit,
  FileDown,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente para exportar proyectos Lean Six Sigma a GitHub
 * Permite crear repositorios de plantilla basados en el proyecto actual
 * Incluye generación de archivos CI/CD
 */
const GitHubExporter = ({ projectId }) => {
  const { isDark } = useTheme();
  const { getProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // Estados
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [repoInfo, setRepoInfo] = useState({
    name: project ? `${project.name.toLowerCase().replace(/\s+/g, '-')}` : '',
    description: project ? `${project.description || 'Proyecto Lean Six Sigma'}` : '',
    isPrivate: true,
    includeTemplate: true,
    includeCICD: true,
    includeTools: true,
    branch: 'main'
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCICD, setShowCICD] = useState(false);
  
  // YAML de ejemplo para CI/CD
  const cicdYaml = `# GitHub Actions workflow para CI/CD
name: Lean Six Sigma CI/CD

on:
  push:
    branches: [ ${repoInfo.branch} ]
  pull_request:
    branches: [ ${repoInfo.branch} ]

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
    if: github.ref == 'refs/heads/${repoInfo.branch}' && github.event_name == 'push'
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

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRepoInfo({
      ...repoInfo,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Validar el formulario
  const validateForm = () => {
    if (!repoInfo.name) {
      setError('El nombre del repositorio es obligatorio');
      return false;
    }
    
    if (!/^[a-z0-9-_]+$/i.test(repoInfo.name)) {
      setError('El nombre del repositorio solo puede contener letras, números, guiones y guiones bajos');
      return false;
    }
    
    return true;
  };
  
  // Simular exportación a GitHub
  const handleExport = (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    setIsExporting(true);
    
    // Simulamos una conexión a la API de GitHub
    setTimeout(() => {
      setIsExporting(false);
      setSuccess({
        repoUrl: `https://github.com/username/${repoInfo.name}`,
        message: 'Repositorio creado correctamente'
      });
    }, 2000);
  };
  
  // Copiar YAML al portapapeles
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  
  // Renderizado del componente
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <Github className="w-6 h-6 mr-2" />
        <h2 className="text-xl font-bold">Exportar a GitHub</h2>
      </div>
      
      {success ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <Check className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="font-medium">¡Exportación completada!</h3>
          </div>
          <p className="mb-2">Tu proyecto ha sido exportado correctamente a GitHub.</p>
          <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded border dark:border-gray-600 mb-2">
            <span className="text-sm truncate">{success.repoUrl}</span>
            <div className="flex space-x-2">
              <button
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                onClick={() => copyToClipboard(success.repoUrl)}
                title="Copiar URL"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={success.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                title="Abrir repositorio"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          {repoInfo.includeCICD && (
            <div className="mt-4">
              <button
                className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2"
                onClick={() => setShowCICD(!showCICD)}
              >
                {showCICD ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {showCICD ? 'Ocultar' : 'Mostrar'} configuración CI/CD generada
              </button>
              
              <AnimatePresence>
                {showCICD && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="relative bg-gray-100 dark:bg-gray-700 rounded-md p-4 overflow-auto text-sm font-mono">
                      <button
                        className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        onClick={() => copyToClipboard(cicdYaml)}
                        title="Copiar YAML"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <pre className="whitespace-pre-wrap text-xs">{cicdYaml}</pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <div className="mt-4">
            <button
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center"
              onClick={() => setSuccess(null)}
            >
              <Code className="w-4 h-4 mr-2" />
              Configurar nuevo repositorio
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleExport}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800 dark:text-red-400">Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button 
                type="button"
                className="text-red-500 hover:text-red-700" 
                onClick={() => setError(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="repo-name">
              Nombre del Repositorio
            </label>
            <input
              type="text"
              id="repo-name"
              name="name"
              value={repoInfo.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="mi-proyecto-lean-six-sigma"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="repo-description">
              Descripción
            </label>
            <textarea
              id="repo-description"
              name="description"
              value={repoInfo.description}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="Descripción del repositorio"
            ></textarea>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="repo-private"
                name="isPrivate"
                checked={repoInfo.isPrivate}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm" htmlFor="repo-private">
                Repositorio privado
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <button
              type="button"
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
              Opciones avanzadas
            </button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include-template"
                        name="includeTemplate"
                        checked={repoInfo.includeTemplate}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm" htmlFor="include-template">
                        Configurar como repositorio de plantilla
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include-cicd"
                        name="includeCICD"
                        checked={repoInfo.includeCICD}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm" htmlFor="include-cicd">
                        Incluir configuración CI/CD (GitHub Actions)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include-tools"
                        name="includeTools"
                        checked={repoInfo.includeTools}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm" htmlFor="include-tools">
                        Incluir herramientas utilizadas
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="repo-branch">
                        Rama principal
                      </label>
                      <input
                        type="text"
                        id="repo-branch"
                        name="branch"
                        value={repoInfo.branch}
                        onChange={handleChange}
                        className="w-full px-3 py-1 border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Settings className="w-4 h-4 mr-1" />
              Requiere token de GitHub
            </div>
            
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center ${
                isExporting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exportando...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  Exportar a GitHub
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default GitHubExporter;
