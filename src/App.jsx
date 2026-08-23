import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import NewProjectPage from './pages/NewProjectPage';
import ToolPage from './pages/ToolPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ToolsCatalogPage from './pages/ToolsCatalogPage';
import MethodologyPage from './pages/MethodologyPage';
import NotFoundPage from './pages/NotFoundPage';

// Theme
import { useTheme } from './contexts/ThemeContext';

function App() {
  const { theme } = useTheme();

  // Effect to apply theme class to the document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/new" element={<NewProjectPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="projects/:projectId/tools/:toolId" element={<ToolPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="tools" element={<ToolsCatalogPage />} />
        <Route path="methodology" element={<MethodologyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
