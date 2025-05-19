// Definición de herramientas Lean Six Sigma disponibles en la aplicación
const tools = [
  {
    id: 'project-timeline',
    name: 'Timeline / Gantt',
    description: 'Vista de línea de tiempo para planificar y monitorear tareas, dependencias y riesgos del proyecto.',
    icon: 'Calendar',
    phase: 'Control',
    category: 'PMO',
    difficulty: 'Media',
    component: 'ProjectTimeline',
    popularity: 5,
    usedInPhases: ['Define', 'Control'],
    bestPractices: [
      'Definir hitos claros y medibles para cada fase del proyecto',
      'Establecer dependencias realistas entre tareas',
      'Actualizar periódicamente el progreso real vs. planeado'
    ],
    videoTutorial: 'https://example.com/tutorials/gantt-chart'
  },
  {
    id: 'project-charter',
    name: 'Project Charter',
    description: 'Documento formal que define el alcance, objetivos, y participantes en un proyecto.',
    icon: 'Clipboard',
    phase: 'Define',
    category: 'Básica',
    difficulty: 'Media',
    component: 'ProjectCharter',
    popularity: 5,
    usedInPhases: ['Define'],
    bestPractices: [
      'Involucrar a todos los stakeholders clave en su desarrollo',
      'Definir claramente el problema, alcance y beneficios esperados',
      'Obtener la firma formal del patrocinador'
    ],
    videoTutorial: 'https://example.com/tutorials/project-charter'
  },
  {
    id: 'sipoc',
    name: 'SIPOC',
    description: 'Supplier-Input-Process-Output-Customer. Herramienta para visualizar procesos de alto nivel.',
    icon: 'GitMerge',
    phase: 'Define',
    category: 'Básica',
    difficulty: 'Baja',
    component: 'SipocViewer',
    popularity: 4,
    usedInPhases: ['Define', 'Measure'],
    bestPractices: [
      'Mantener un nivel alto de abstracción sin entrar en detalles',
      'Incluir sólo los pasos principales del proceso',
      'Identificar claramente quiénes son los clientes finales'
    ],
    videoTutorial: 'https://example.com/tutorials/sipoc'
  },
  {
    id: 'voc',
    name: 'VOC (Voice of Customer)',
    description: 'Herramienta para capturar y analizar las necesidades y expectativas de los clientes.',
    icon: 'MessageSquare',
    phase: 'Define',
    category: 'Básica',
    difficulty: 'Media',
    component: 'VocVisualizer',
    popularity: 4,
    usedInPhases: ['Define', 'Measure'],
    bestPractices: [
      'Usar múltiples métodos de recolección de datos (encuestas, entrevistas, observación)',
      'Segmentar clientes para análisis más precisos',
      'Traducir necesidades en requisitos medibles'
    ],
    videoTutorial: 'https://example.com/tutorials/voc-analysis'
  },
  {
    id: 'ctq',
    name: 'CTQ (Critical to Quality)',
    description: 'Identifica las características críticas para la calidad desde la perspectiva del cliente.',
    icon: 'BarChart2',
    phase: 'Measure',
    category: 'Avanzada',
    difficulty: 'Alta',
    component: 'CtqDashboard',
    popularity: 4,
    usedInPhases: ['Measure'],
    bestPractices: [
      'Derivar CTQs directamente de la VOC',
      'Establecer métricas específicas y medibles para cada CTQ',
      'Priorizar CTQs según su impacto en la satisfacción del cliente'
    ],
    videoTutorial: 'https://example.com/tutorials/ctq-analysis'
  },
  {
    id: 'value-stream-map',
    name: 'Value Stream Map',
    description: 'Técnica para analizar el estado actual y diseñar un estado futuro para la serie de eventos que llevan un producto desde su inicio hasta el cliente.',
    icon: 'GitBranch',
    phase: 'Analyze',
    category: 'Avanzada',
    difficulty: 'Alta',
    component: 'ValueStreamMap',
    popularity: 5,
    usedInPhases: ['Analyze', 'Improve'],
    bestPractices: [
      'Mapear el estado actual con datos reales, no percepciones',
      'Identificar claramente actividades de valor agregado vs. no valor agregado',
      'Diseñar el estado futuro basado en la eliminación de desperdicios'
    ],
    videoTutorial: 'https://example.com/tutorials/vsm'
  },
  {
    id: 'stakeholder-analysis',
    name: 'Análisis de Stakeholders',
    description: 'Identifica a las personas o grupos interesados en el proyecto y evalúa su influencia e interés.',
    icon: 'Users',
    phase: 'Define',
    category: 'Básica',
    difficulty: 'Media',
    component: 'StakeholderAnalysis',
    popularity: 4,
    usedInPhases: ['Define', 'Control'],
    bestPractices: [
      'Actualizar periódicamente el análisis a lo largo del proyecto',
      'Desarrollar estrategias específicas para cada grupo de stakeholders',
      'Identificar tanto stakeholders obvios como no obvios'
    ],
    videoTutorial: 'https://example.com/tutorials/stakeholder'
  },
  {
    id: 'prioritization-matrix',
    name: 'Matriz de Priorización',
    description: 'Herramienta para evaluar y priorizar problemas o soluciones basado en criterios específicos.',
    icon: 'Grid',
    phase: 'Improve',
    category: 'Avanzada',
    difficulty: 'Media',
    component: 'PriorizationMatrix',
    popularity: 4,
    usedInPhases: ['Analyze', 'Improve'],
    bestPractices: [
      'Establecer criterios claros de evaluación antes de iniciar',
      'Incluir tanto criterios cuantitativos como cualitativos',
      'Involucrar a todo el equipo en el proceso de evaluación'
    ],
    videoTutorial: 'https://example.com/tutorials/prioritization'
  },
  {
    id: 'cause-effect-diagram',
    name: 'Diagrama Causa-Efecto',
    description: 'También conocido como diagrama de Ishikawa o espina de pescado, identifica posibles causas de un problema.',
    icon: 'GitBranch',
    phase: 'Analyze',
    category: 'Básica',
    difficulty: 'Media',
    component: 'CauseEffectDiagram',
    popularity: 5,
    usedInPhases: ['Analyze'],
    bestPractices: [
      'Definir claramente el problema antes de identificar causas',
      'Considerar las 6M: Mano de obra, Máquinas, Materiales, Métodos, Medición, Medio Ambiente',
      'Verificar causas con datos cuando sea posible'
    ],
    videoTutorial: 'https://example.com/tutorials/fishbone'
  },
  {
    id: 'pareto-chart',
    name: 'Diagrama de Pareto',
    description: 'Gráfico que muestra la frecuencia de ocurrencia de diferentes causas de un problema.',
    icon: 'BarChart',
    phase: 'Analyze',
    category: 'Básica',
    difficulty: 'Media',
    component: 'ParetoChart',
    popularity: 5,
    usedInPhases: ['Analyze', 'Improve'],
    bestPractices: [
      'Recolectar datos suficientes para tener una muestra representativa',
      'Enfocar esfuerzos en el 20% de causas que generan el 80% del problema',
      'Presentar tanto frecuencias absolutas como porcentajes acumulados'
    ],
    videoTutorial: 'https://example.com/tutorials/pareto'
  },
  {
    id: 'fmea',
    name: 'FMEA (Failure Mode and Effects Analysis)',
    description: 'Técnica para identificar posibles fallos en un producto o proceso.',
    icon: 'AlertTriangle',
    phase: 'Improve',
    category: 'Avanzada',
    difficulty: 'Alta',
    component: 'FmeaAnalysis',
    popularity: 3,
    usedInPhases: ['Improve', 'Control'],
    bestPractices: [
      'Realizar un FMEA con un equipo multidisciplinario',
      'Priorizar modos de fallo según RPN (Risk Priority Number)',
      'Establecer acciones concretas de mitigación para cada riesgo identificado'
    ],
    videoTutorial: 'https://example.com/tutorials/fmea'
  },
  {
    id: 'control-chart',
    name: 'Control Chart',
    description: 'Gráfico utilizado para monitorear la estabilidad de un proceso a lo largo del tiempo.',
    icon: 'LineChart',
    phase: 'Control',
    category: 'Avanzada',
    difficulty: 'Alta',
    component: 'ControlChart',
    popularity: 4,
    usedInPhases: ['Measure', 'Control'],
    bestPractices: [
      'Seleccionar el tipo apropiado de gráfico según el tipo de datos',
      'Establecer reglas claras para identificar señales de proceso fuera de control',
      'Tomar acción inmediata cuando se detecten patrones no aleatorios'
    ],
    videoTutorial: 'https://example.com/tutorials/control-chart'
  },
  {
    id: '5s',
    name: '5S',
    description: 'Metodología para organizar el lugar de trabajo: Seiri, Seiton, Seiso, Seiketsu y Shitsuke.',
    icon: 'Layers',
    phase: 'Improve',
    category: 'Básica',
    difficulty: 'Baja',
    component: 'FiveS',
    popularity: 4,
    usedInPhases: ['Improve'],
    bestPractices: [
      'Implementar las 5S en orden secuencial',
      'Establecer auditorías regulares para mantener el estándar',
      'Involucrar a todos los empleados del área en la implementación'
    ],
    videoTutorial: 'https://example.com/tutorials/5s'
  },
  {
    id: 'roi-calculator',
    name: 'Calculadora de ROI',
    description: 'Herramienta para calcular el retorno de inversión y tiempo de recuperación del proyecto.',
    icon: 'DollarSign',
    phase: 'Define',
    category: 'Financiera',
    difficulty: 'Media',
    component: 'RoiCalculator',
    popularity: 5,
    usedInPhases: ['Define', 'Control'],
    bestPractices: [
      'Identificar todos los costos, incluyendo los menos obvios',
      'Ser conservador en las estimaciones de beneficios',
      'Actualizar el análisis con datos reales conforme avanza el proyecto'
    ],
    videoTutorial: 'https://example.com/tutorials/roi'
  }
];

export default tools;
