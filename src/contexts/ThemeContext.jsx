import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

// Crear el contexto para el tema
const ThemeContext = createContext();

const STORAGE_KEY = 'theme';
const VALID_THEMES = ['light', 'dark'];

// Lee el tema guardado en localStorage de forma segura (localStorage puede
// no estar disponible o lanzar en navegación privada / entornos sin DOM).
function getStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

// Preferencia del sistema operativo / navegador, con fallback seguro.
function getSystemTheme() {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // matchMedia no disponible: se ignora y se usa el valor por defecto.
  }
  return 'light';
}

// Hook personalizado para usar el tema
// eslint-disable-next-line react-refresh/only-export-components -- ~15 archivos ya importan useTheme desde aqui; separar el archivo no es practico en este ciclo.
export function useTheme() {
  return useContext(ThemeContext);
}

// Proveedor del tema
export function ThemeProvider({ children }) {
  // Inicializar el tema desde localStorage o, si no hay preferencia guardada,
  // usar la preferencia del sistema (prefers-color-scheme).
  const [theme, setThemeState] = useState(() => getStoredTheme() ?? getSystemTheme());

  // Recuerda si el usuario ya fijó una preferencia explícita (guardada en
  // localStorage al montar). Mientras no exista, la app sigue a la
  // preferencia del sistema en vivo si el usuario la cambia desde el SO.
  const hasExplicitPreference = useRef(getStoredTheme() !== null);

  // Guardar el tema en localStorage cuando cambie.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Almacenamiento no disponible (p. ej. navegación privada con cuota 0):
      // el tema sigue funcionando en memoria para la sesión actual.
    }
  }, [theme]);

  // Mientras el usuario no haya elegido un tema explícitamente, seguir los
  // cambios de preferencia del sistema en vivo (p. ej. el SO cambia a modo
  // oscuro al anochecer).
  useEffect(() => {
    if (hasExplicitPreference.current) return undefined;
    if (!window.matchMedia) return undefined;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      if (hasExplicitPreference.current) return;
      setThemeState(event.matches ? 'dark' : 'light');
    };

    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
    // Fallback para navegadores antiguos.
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  // Setter público: marca la preferencia como explícita para dejar de
  // seguir al sistema operativo.
  const setTheme = useCallback((value) => {
    hasExplicitPreference.current = true;
    setThemeState((prev) => (typeof value === 'function' ? value(prev) : value));
  }, []);

  // Función para alternar el tema.
  const toggleTheme = useCallback(() => {
    hasExplicitPreference.current = true;
    setThemeState((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  // Valor del contexto
  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };

  // Renderizar el proveedor con el valor actual
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
