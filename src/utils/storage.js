/**
 * Utilidades para la persistencia de datos usando localStorage
 */

// Claves para localStorage
const STORAGE_KEYS = {
  PROJECTS: 'lean_six_sigma_projects',
  TOOLS: 'lean_six_sigma_tools',
  SETTINGS: 'lean_six_sigma_settings',
  THEME: 'lean_six_sigma_theme'
};

/**
 * Guarda datos en localStorage
 * @param {string} key - Clave para localStorage
 * @param {any} data - Datos a guardar
 */
export const saveData = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
    return false;
  }
};

/**
 * Recupera datos desde localStorage
 * @param {string} key - Clave para localStorage
 * @param {any} defaultValue - Valor por defecto si no hay datos
 * @returns {any} - Datos recuperados o valor por defecto
 */
export const loadData = (key, defaultValue = null) => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Error al cargar desde localStorage:', error);
    return defaultValue;
  }
};

/**
 * Elimina datos de localStorage
 * @param {string} key - Clave para localStorage
 */
export const removeData = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error al eliminar de localStorage:', error);
    return false;
  }
};

/**
 * Guarda proyectos en localStorage
 * @param {Array} projects - Array de proyectos
 */
export const saveProjects = (projects) => {
  return saveData(STORAGE_KEYS.PROJECTS, projects);
};

/**
 * Recupera proyectos desde localStorage
 * @returns {Array} - Array de proyectos o array vacío
 */
export const loadProjects = () => {
  return loadData(STORAGE_KEYS.PROJECTS, []);
};

/**
 * Guarda herramientas en localStorage
 * @param {Array} tools - Array de herramientas
 */
export const saveTools = (tools) => {
  return saveData(STORAGE_KEYS.TOOLS, tools);
};

/**
 * Recupera herramientas desde localStorage
 * @returns {Array} - Array de herramientas o array vacío
 */
export const loadTools = () => {
  return loadData(STORAGE_KEYS.TOOLS, []);
};

/**
 * Guarda configuración de la aplicación
 * @param {Object} settings - Configuración
 */
export const saveSettings = (settings) => {
  return saveData(STORAGE_KEYS.SETTINGS, settings);
};

/**
 * Recupera configuración de la aplicación
 * @returns {Object} - Configuración o objeto vacío
 */
export const loadSettings = () => {
  return loadData(STORAGE_KEYS.SETTINGS, {});
};

/**
 * Guarda el tema de la aplicación
 * @param {string} theme - Tema ('light' o 'dark')
 */
export const saveTheme = (theme) => {
  return saveData(STORAGE_KEYS.THEME, theme);
};

/**
 * Recupera el tema de la aplicación
 * @returns {string} - Tema ('light' o 'dark', por defecto 'light')
 */
export const loadTheme = () => {
  return loadData(STORAGE_KEYS.THEME, 'light');
};

export default {
  STORAGE_KEYS,
  saveData,
  loadData,
  removeData,
  saveProjects,
  loadProjects,
  saveTools,
  loadTools,
  saveSettings,
  loadSettings,
  saveTheme,
  loadTheme
};
