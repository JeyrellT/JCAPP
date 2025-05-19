import { createContext, useContext, useEffect, useState } from 'react';

// Crear el contexto para el tema
const ThemeContext = createContext();

// Hook personalizado para usar el tema
export function useTheme() {
  return useContext(ThemeContext);
}

// Proveedor del tema
export function ThemeProvider({ children }) {
  // Inicializar el tema desde localStorage o usar el tema del sistema
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    
    // Usar el tema del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Guardar el tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Función para alternar el tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  // Valor del contexto
  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  // Renderizar el proveedor con el valor actual
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
