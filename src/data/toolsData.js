// Definición de herramientas Lean Six Sigma con datos detallados y ejemplos para la aplicación
const toolsData = [
  // FASE: DEFINE
  {
    id: 'project-charter',
    name: 'Project Charter',
    description: 'Documento formal que define el alcance, objetivos, y participantes en un proyecto.',
    phase: 'define',
    status: 'Disponible',
    component: 'ProjectCharter',
    examples: [
      {
        title: 'Project Charter - Manufactura',
        businessCase: 'La línea de producción principal opera con una eficiencia del 68% frente al estándar industrial del 85%. Los tiempos de preparación y la tasa de defectos generan costos adicionales estimados en ₡25 millones anuales.',
        problemStatement: 'La baja eficiencia y alta tasa de defectos impactan negativamente en los costos de producción y los tiempos de entrega, afectando la competitividad de la empresa en el mercado.',
        goals: 'Aumentar el OEE a 85%, reducir la tasa de defectos por debajo del 0.8% y reducir el tiempo de preparación a 15 minutos o menos.'
      },
      {
        title: 'Project Charter - Servicios Financieros',
        businessCase: 'El bajo índice de resolución en primera llamada (65%) y la alta tasa de errores en procesamiento (8.5%) están generando pérdida de clientes y sobrecostos operativos estimados en ₡18 millones anuales.',
        problemStatement: 'Los errores en el servicio al cliente generan reprocesos, insatisfacción y pérdida de clientes, afectando la rentabilidad y reputación de la empresa.',
        goals: 'Aumentar el First Call Resolution a 85%, reducir errores en procesamiento por debajo del 3% y elevar el NPS de 42 a 65 puntos.'
      }
    ],
    difficulty: 'Media',
    estimatedTime: '4-8 horas',
    prerequisites: []
  },
  {
    id: 'sipoc',
    name: 'SIPOC',
    description: 'Supplier-Input-Process-Output-Customer. Herramienta para visualizar procesos de alto nivel.',
    phase: 'define',
    status: 'Disponible',
    component: 'SipocViewer',
    examples: [
      {
        title: 'SIPOC - Proceso de Distribución',
        processName: 'Distribución de Mercancías',
        suppliers: ['Centro de Distribución', 'Departamento de Planificación', 'Proveedores de Transporte'],
        inputs: ['Pedidos confirmados', 'Mercancía empacada', 'Vehículos', 'Rutas planificadas'],
        process: ['Verificar pedidos', 'Cargar vehículos', 'Transportar mercancía', 'Entregar a cliente', 'Confirmar recepción'],
        outputs: ['Entregas completadas', 'Documentación firmada', 'Reportes de incidencias', 'Vehículos disponibles'],
        customers: ['Clientes Externos', 'Departamento de Facturación', 'Servicio al Cliente']
      }
    ],
    difficulty: 'Baja',
    estimatedTime: '2-4 horas',
    prerequisites: ['project-charter']
  },
  {
    id: 'voc',
    name: 'VOC (Voice of Customer)',
    description: 'Herramienta para capturar y analizar las necesidades y expectativas de los clientes.',
    phase: 'define',
    status: 'Disponible',
    component: 'VocVisualizer',
    examples: [
      {
        title: 'VOC - Centro de Atención al Cliente',
        customerSegments: ['Clientes Corporativos', 'Clientes Personales', 'Usuarios Internos'],
        dataCollectionMethods: ['Encuestas', 'Entrevistas', 'Análisis de Quejas'],
        keyInsights: [
          { type: 'Externo', comment: 'Me transfieren múltiples veces y tengo que repetir mi problema a diferentes personas', importance: 5 },
          { type: 'Externo', comment: 'Las soluciones prometidas no siempre se cumplen en los tiempos indicados', importance: 5 },
          { type: 'Interno', comment: 'No tenemos acceso rápido a toda la información necesaria para resolver casos en primera llamada', importance: 4 }
        ]
      }
    ],
    difficulty: 'Media',
    estimatedTime: '8-12 horas',
    prerequisites: ['project-charter']
  },
  {
    id: 'stakeholder-analysis',
    name: 'Análisis de Stakeholders',
    description: 'Identifica a las personas o grupos interesados en el proyecto y evalúa su influencia e interés.',
    phase: 'define',
    status: 'Disponible',
    component: 'StakeholderAnalysis',
    examples: [
      {
        title: 'Análisis de Stakeholders - Proyecto Logístico',
        stakeholderGroups: ['Dirección', 'Empleados', 'Clientes', 'Proveedores'],
        analysisMatrix: [
          { name: 'Gerencia General', interest: 'alto', influence: 'alto', concerns: 'ROI del proyecto, mejora en flujo de caja', strategy: 'Comunicar avances semanales, mostrar impacto financiero' },
          { name: 'Personal de Operaciones', interest: 'medio', influence: 'alto', concerns: 'Cambios en procesos diarios, posible aumento de carga laboral', strategy: 'Involucrar en diseño de soluciones, capacitación' },
          { name: 'Clientes Principales', interest: 'bajo', influence: 'alto', concerns: 'Cambios en procesos de facturación y cobro', strategy: 'Comunicar cambios con anticipación, destacar beneficios' }
        ]
      }
    ],
    difficulty: 'Media',
    estimatedTime: '4-6 horas',
    prerequisites: ['project-charter']
  },
  {
    id: 'roi-calculator',
    name: 'Calculadora de ROI',
    description: 'Herramienta para calcular el retorno de inversión del proyecto y analizar su viabilidad financiera.',
    phase: 'define',
    status: 'Disponible',
    component: 'RoiCalculator',
    examples: [
      {
        title: 'ROI - Optimización de Procesos',
        costPerYear: 12000000,
        timeUnitType: 'monthly',
        timeUnitValue: 160,
        implementationCost: 2120000,
        minutesBefore: 60,
        frequencyTypeBefore: 'monthly',
        frequencyValueBefore: 4,
        peopleCountBefore: 2,
        minutesAfter: 15,
        frequencyTypeAfter: 'monthly',
        frequencyValueAfter: 4,
        peopleCountAfter: 1,
        results: {
          hoursSaved: 138,
          fteEquivalent: 0.72,
          moneySaved: 8640000,
          roi: 307.55,
          paybackMonths: 3.9
        }
      }
    ],
    difficulty: 'Media',
    estimatedTime: '2-4 horas',
    prerequisites: ['project-charter']
  },
  
  // FASE: MEASURE
  {
    id: 'ctq',
    name: 'CTQ (Critical to Quality)',
    description: 'Identifica las características críticas para la calidad desde la perspectiva del cliente.',
    phase: 'measure',
    status: 'Disponible',
    component: 'CtqDashboard',
    examples: [
      {
        title: 'CTQ - Servicio al Cliente',
        requirements: [
          { need: 'Resolución en primera llamada', driver: 'Eficiencia', measure: 'Porcentaje de casos resueltos sin transferencias', target: '≥ 85%' },
          { need: 'Precisión en el procesamiento', driver: 'Calidad', measure: 'Porcentaje de solicitudes procesadas sin errores', target: '≥ 97%' },
          { need: 'Experiencia del cliente positiva', driver: 'Satisfacción', measure: 'Net Promoter Score (NPS)', target: '≥ 65' }
        ]
      }
    ],
    difficulty: 'Alta',
    estimatedTime: '6-10 horas',
    prerequisites: ['voc']
  },
  
  // FASE: ANALYZE
  {
    id: 'value-stream-map',
    name: 'Value Stream Map',
    description: 'Técnica para analizar el estado actual y diseñar un estado futuro para la serie de eventos que llevan un producto desde su inicio hasta el cliente.',
    phase: 'analyze',
    status: 'Disponible',
    component: 'ValueStreamMap',
    examples: [
      {
        title: 'VSM - Proceso de Cobranza',
        currentState: {
          totalLeadTime: '45 días',
          valueAddedTime: '12 horas',
          mainWastes: ['Esperas entre departamentos', 'Reprocesos por errores de facturación', 'Movimientos innecesarios de documentación']
        },
        futureState: {
          targetLeadTime: '30 días',
          improvements: ['Automatización de recordatorios', 'Procesamiento paralelo de documentación', 'Eliminación de aprobaciones redundantes']
        }
      }
    ],
    difficulty: 'Alta',
    estimatedTime: '8-16 horas',
    prerequisites: ['sipoc']
  },
  {
    id: 'cause-effect-diagram',
    name: 'Diagrama Causa-Efecto',
    description: 'También conocido como diagrama de Ishikawa o espina de pescado, identifica posibles causas de un problema.',
    phase: 'analyze',
    status: 'Disponible',
    component: 'CauseEffectDiagram',
    examples: [
      {
        title: 'Diagrama Causa-Efecto - Ciclo de Cobranza Extendido',
        problem: 'Ciclo de cobranza extendido',
        categories: [
          { name: 'Personal', causes: ['Falta de capacitación en seguimiento', 'Rotación alta en el departamento', 'No hay incentivos por cobros oportunos'] },
          { name: 'Métodos', causes: ['Proceso manual de seguimiento', 'Política de cobro poco clara', 'Falta de escalamiento para casos críticos'] },
          { name: 'Sistemas', causes: ['Software desactualizado', 'Falta de alertas automáticas', 'Reportes poco claros para seguimiento'] },
          { name: 'Entorno', causes: ['Cultura de pago tardío en el mercado', 'Problemas económicos de clientes', 'Competencia con términos más flexibles'] }
        ]
      }
    ],
    difficulty: 'Media',
    estimatedTime: '4-6 horas',
    prerequisites: []
  },
  {
    id: 'pareto-chart',
    name: 'Diagrama de Pareto',
    description: 'Gráfico que muestra la frecuencia de ocurrencia de diferentes causas de un problema.',
    phase: 'analyze',
    status: 'Disponible',
    component: 'ParetoChart',
    examples: [
      {
        title: 'Pareto - Causas de Retrasos en Entregas',
        categories: ['Rutas ineficientes', 'Demoras en carga', 'Tráfico imprevisto', 'Documentación incompleta', 'Dirección incorrecta', 'Otros'],
        values: [35, 25, 20, 10, 7, 3],
        cumulative: [35, 60, 80, 90, 97, 100]
      }
    ],
    difficulty: 'Media',
    estimatedTime: '2-4 horas',
    prerequisites: []
  },
  
  // FASE: IMPROVE
  {
    id: 'prioritization-matrix',
    name: 'Matriz de Priorización',
    description: 'Herramienta para evaluar y priorizar problemas o soluciones basado en criterios específicos.',
    phase: 'improve',
    status: 'Disponible',
    component: 'PriorizationMatrix',
    examples: [
      {
        title: 'Matriz de Priorización - Mejoras en Servicio al Cliente',
        criteria: ['Impacto en satisfacción', 'Facilidad de implementación', 'Costo', 'Tiempo de implementación'],
        initiatives: [
          { name: 'Dashboard unificado de información', scores: [5, 3, 2, 2], total: 12 },
          { name: 'Capacitación cruzada de personal', scores: [4, 4, 4, 3], total: 15 },
          { name: 'Rediseño de scripts de atención', scores: [5, 5, 5, 4], total: 19 }
        ]
      }
    ],
    difficulty: 'Media',
    estimatedTime: '4-6 horas',
    prerequisites: ['cause-effect-diagram']
  },
  {
    id: 'fmea',
    name: 'FMEA (Failure Mode and Effects Analysis)',
    description: 'Técnica para identificar posibles fallos en un producto o proceso.',
    phase: 'improve',
    status: 'Disponible',
    component: 'FmeaAnalysis',
    examples: [
      {
        title: 'FMEA - Proceso de Atención de Reclamaciones',
        process: 'Atención de Reclamaciones',
        failureModes: [
          { 
            mode: 'Registro incorrecto de información del cliente', 
            effect: 'Seguimiento inadecuado, cliente contactado múltiples veces', 
            causes: 'Formulario complejo, falta de validación, presión por tiempo', 
            severity: 8, 
            occurrence: 7, 
            detection: 5, 
            rpn: 280,
            actions: 'Simplificar formulario, agregar validaciones automáticas'
          },
          { 
            mode: 'Categorización errónea del caso', 
            effect: 'Enrutamiento incorrecto, resolución retrasada', 
            causes: 'Falta de criterios claros, formación insuficiente', 
            severity: 6, 
            occurrence: 6, 
            detection: 4, 
            rpn: 144,
            actions: 'Árbol de decisión automatizado, capacitación periódica'
          }
        ]
      }
    ],
    difficulty: 'Alta',
    estimatedTime: '6-10 horas',
    prerequisites: ['cause-effect-diagram']
  },
  {
    id: '5s',
    name: '5S',
    description: 'Metodología para organizar el lugar de trabajo: Seiri, Seiton, Seiso, Seiketsu y Shitsuke.',
    phase: 'improve',
    status: 'Disponible',
    component: 'FiveS',
    examples: [
      {
        title: '5S - Almacén de Producción',
        areas: ['Zona de Recepción', 'Zona de Almacenamiento', 'Zona de Despacho'],
        currentState: {
          sort: 2,
          setInOrder: 1,
          shine: 2,
          standardize: 1,
          sustain: 1
        },
        targetState: {
          sort: 5,
          setInOrder: 4,
          shine: 4,
          standardize: 4,
          sustain: 4
        },
        improvements: [
          'Implementar sistema de etiquetado por código de colores',
          'Definir áreas específicas para cada tipo de material',
          'Establecer programa de limpieza diario',
          'Crear ayudas visuales para mantenimiento de estándares'
        ]
      }
    ],
    difficulty: 'Baja',
    estimatedTime: '4-8 horas (por área)',
    prerequisites: []
  },
  
  // FASE: CONTROL
  {
    id: 'control-chart',
    name: 'Control Chart',
    description: 'Gráfico utilizado para monitorear la estabilidad de un proceso a lo largo del tiempo.',
    phase: 'control',
    status: 'Disponible',
    component: 'ControlChart',
    examples: [
      {
        title: 'Gráfico de Control - Errores en Procesamiento',
        metricName: 'Porcentaje de Errores en Procesamiento',
        centerLine: 2.8,
        upperControlLimit: 4.5,
        lowerControlLimit: 1.1,
        measurements: [2.9, 3.1, 2.6, 2.7, 3.0, 2.5, 2.8, 2.7, 2.6, 2.8, 2.9, 3.0],
        outOfControl: false
      }
    ],
    difficulty: 'Alta',
    estimatedTime: '4-8 horas',
    prerequisites: []
  },
  {
    id: 'project-timeline',
    name: 'Timeline / Gantt',
    description: 'Vista de línea de tiempo para planificar y monitorear tareas, dependencias y riesgos del proyecto.',
    phase: 'control',
    status: 'Disponible',
    component: 'ProjectTimeline',
    examples: [
      {
        title: 'Gantt - Proyecto de Mejora de Procesos',
        phases: [
          { name: 'Define', start: '2025-01-15', end: '2025-01-30', complete: 100 },
          { name: 'Measure', start: '2025-02-01', end: '2025-02-28', complete: 100 },
          { name: 'Analyze', start: '2025-03-01', end: '2025-03-15', complete: 90 },
          { name: 'Improve', start: '2025-03-16', end: '2025-04-05', complete: 20 },
          { name: 'Control', start: '2025-04-06', end: '2025-04-15', complete: 0 }
        ],
        tasks: [
          { id: 't1', name: 'Diseño de nuevo proceso', start: '2025-03-16', end: '2025-03-25', dependencies: [], complete: 40, resources: ['María Ramírez', 'Juan Pérez'] },
          { id: 't2', name: 'Implementación de sistema', start: '2025-03-20', end: '2025-04-05', dependencies: [], complete: 10, resources: ['Laura González'] }
        ]
      }
    ],
    difficulty: 'Media',
    estimatedTime: '4-8 horas',
    prerequisites: []
  }
];

export default toolsData;