/**
 * Utilidades para exportación e importación de datos
 */

/**
 * Convierte un objeto en un archivo JSON y lo descarga
 * @param {Object} data - Los datos a exportar
 * @param {string} filename - Nombre del archivo
 */
export const exportToJson = (data, filename = 'export.json') => {
  try {
    // Crear un Blob con los datos
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    // Crear una URL para el Blob
    const url = URL.createObjectURL(blob);
    
    // Crear un elemento de enlace para la descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Añadir al DOM y simular clic
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error al exportar a JSON:', error);
    return false;
  }
};

/**
 * Exporta datos a CSV
 * @param {Array} data - Array de objetos
 * @param {string} filename - Nombre del archivo
 */
export const exportToCsv = (data, filename = 'export.csv') => {
  try {
    if (!data || !data.length) {
      return false;
    }
    
    // Obtener encabezados
    const headers = Object.keys(data[0]);
    
    // Crear filas
    const csvRows = [
      headers.join(','),
      ...data.map(row => {
        return headers.map(fieldName => {
          // Manejar valores que contienen comas o comillas
          let fieldValue = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
          if (typeof fieldValue === 'string') {
            fieldValue = fieldValue.replace(/"/g, '""');
            if (fieldValue.includes(',') || fieldValue.includes('"') || fieldValue.includes('\n')) {
              fieldValue = `"${fieldValue}"`;
            }
          }
          return fieldValue;
        }).join(',');
      })
    ];
    
    // Crear el contenido CSV
    const csvString = csvRows.join('\n');
    
    // Crear un Blob y descargarlo
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
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
    console.error('Error al exportar a CSV:', error);
    return false;
  }
};

/**
 * Lee un archivo JSON y devuelve su contenido
 * @param {File} file - Archivo a leer
 * @returns {Promise<Object>} Promesa que resuelve al objeto importado
 */
export const importFromJson = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('El archivo no es un JSON válido'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Valida si los datos importados tienen la estructura correcta
 * @param {Object} data - Datos importados
 * @param {Object} validationSchema - Esquema de validación 
 * @returns {boolean} - True si los datos son válidos
 */
export const validateImportedData = (data, validationSchema) => {
  try {
    // Implementación básica, podría mejorarse con una biblioteca de validación
    for (const key in validationSchema) {
      if (validationSchema.hasOwnProperty(key)) {
        const requiredType = validationSchema[key];
        
        // Verificar si la propiedad existe
        if (!data.hasOwnProperty(key)) {
          console.error(`Propiedad requerida '${key}' no encontrada`);
          return false;
        }
        
        // Verificar el tipo
        const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
        if (actualType !== requiredType) {
          console.error(`La propiedad '${key}' debe ser de tipo '${requiredType}', pero es '${actualType}'`);
          return false;
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error al validar datos importados:', error);
    return false;
  }
};

/**
 * Exporta un proyecto completo con todas sus herramientas
 * @param {Object} project - Proyecto a exportar
 */
export const exportProject = (project) => {
  if (!project || !project.id) {
    return false;
  }
  
  const filename = `proyecto_${project.name.replace(/\s+/g, '_').toLowerCase()}_${project.id}.json`;
  return exportToJson(project, filename);
};

/**
 * Exporta todos los proyectos
 * @param {Array} projects - Array de proyectos
 */
export const exportAllProjects = (projects) => {
  if (!projects || !projects.length) {
    return false;
  }
  
  const filename = `todos_los_proyectos_${new Date().toISOString().slice(0, 10)}.json`;
  return exportToJson({ projects }, filename);
};

/**
 * Exporta un reporte específico de un proyecto
 * @param {Object} project - Proyecto a exportar
 * @param {string} toolId - ID de la herramienta a exportar
 */
export const exportProjectTool = (project, toolId) => {
  if (!project || !project.id || !toolId || !project.tools || !project.tools[toolId]) {
    return false;
  }
  
  const toolData = project.tools[toolId];
  const toolName = toolId.replace(/-/g, '_');
  
  const exportData = {
    projectId: project.id,
    projectName: project.name,
    toolId,
    toolData,
    exportDate: new Date().toISOString()
  };
  
  const filename = `${project.id}_${toolName}_${new Date().toISOString().slice(0, 10)}.json`;
  return exportToJson(exportData, filename);
};

/**
 * Exporta un reporte comparativo de KPIs entre proyectos
 * @param {Array} projects - Array de proyectos
 */
export const exportKpiComparison = (projects) => {
  if (!projects || !projects.length) {
    return false;
  }
  
  const kpiData = projects.map(project => {
    // Extraer solo la información relevante de KPIs
    return {
      projectId: project.id,
      projectName: project.name,
      company: project.company,
      status: project.status,
      progress: project.progress,
      kpis: project.kpis || [],
      phase: project.phase
    };
  });
  
  const filename = `comparativa_kpis_${new Date().toISOString().slice(0, 10)}.json`;
  return exportToJson({ kpiData }, filename);
};

/**
 * Exporta datos a Excel (simulado con CSV)
 * @param {Array} data - Array de objetos
 * @param {string} filename - Nombre del archivo
 */
export const exportToExcel = (data, filename = 'export.csv') => {
  // Esta función utiliza CSV como formato para Excel
  // En una implementación real, podrías usar una biblioteca como xlsx o exceljs
  return exportToCsv(data, filename);
};

export default {
  exportToJson,
  exportToCsv,
  importFromJson,
  validateImportedData,
  exportProject,
  exportAllProjects,
  exportProjectTool,
  exportKpiComparison,
  exportToExcel
};
