// Datos iniciales de proyectos Lean Six Sigma
const projects = [
  {
    id: 'project-1',
    name: 'Diagnóstico de Cobranza e Inventario FGV S.A.',
    description: 'Aplicación de Lean Six Sigma para diagnóstico de procesos de cobranza e inventario con énfasis en reducción de tiempos de ciclo y aumento de la eficiencia operativa.',
    status: 'active',
    progress: 75,
    startDate: '2025-01-15',
    endDate: '2025-04-15',
    company: 'Ferreteros Globales Versátiles S.A.',
    phase: 'Improve',
    team: [
      { id: 'team-1', name: 'Carlos Montero', role: 'Patrocinador', position: 'Gerente de Operaciones', email: 'cmontero@fgv.com' },
      { id: 'team-2', name: 'María Ramírez', role: 'Líder del Proyecto', position: 'Especialista Lean Six Sigma', email: 'mramirez@fgv.com' },
      { id: 'team-3', name: 'Juan Pérez', role: 'Miembro', position: 'Analista de Procesos', email: 'jperez@fgv.com' },
      { id: 'team-4', name: 'Laura González', role: 'Miembro', position: 'Supervisora de Almacén', email: 'lgonzalez@fgv.com' }
    ],
    kpis: [
      { id: 'kpi-1', name: 'Tiempo de Ciclo de Cobranza', baseLine: '45 días', target: '30 días', current: '32 días' },
      { id: 'kpi-2', name: 'Exactitud de Inventario', baseLine: '87%', target: '98%', current: '95%' },
      { id: 'kpi-3', name: 'Cuentas por Cobrar Vencidas', baseLine: '23%', target: '10%', current: '14%' }
    ],
    tools: {
      'project-charter': { 
        status: 'completed', 
        updatedAt: '2025-01-20T10:30:00Z',
        notes: 'Proyecto charter finalizado y aprobado por el patrocinador',
        data: {
          businessCase: 'La empresa enfrenta problemas recurrentes en la gestión de cobranza e inventarios que afectan el flujo de caja y la satisfacción del cliente. Se estima que las ineficiencias actuales generan costos adicionales de aproximadamente ₡12.5 millones al año.',
          problemStatement: 'Actualmente el ciclo de cobranza toma 45 días en promedio y la exactitud del inventario es del 87%, lo que genera problemas de flujo de caja y servicio al cliente.',
          scope: 'Incluye los procesos de cobranza desde facturación hasta recepción del pago y los procesos de gestión de inventario en el almacén principal. No incluye logística externa ni procesos de compras internacionales.',
          goals: 'Reducir el tiempo de ciclo de cobranza a 30 días o menos y aumentar la exactitud del inventario a un mínimo de 98%.'
        }
      },
      'sipoc': { 
        status: 'completed', 
        updatedAt: '2025-01-25T14:45:00Z',
        notes: 'SIPOCs completados para todos los procesos críticos',
        data: {
          processName: 'Gestión de Cobranza',
          suppliers: ['Departamento de Ventas', 'Departamento Contable', 'Clientes'],
          inputs: ['Facturas', 'Políticas de crédito', 'Información de clientes'],
          process: ['Emitir factura', 'Registrar en sistema', 'Enviar recordatorios', 'Recibir pagos', 'Actualizar cuentas'],
          outputs: ['Cobros realizados', 'Reportes de morosidad', 'Flujo de caja actualizado'],
          customers: ['Departamento Financiero', 'Gerencia General', 'Departamento de Ventas']
        }
      },
      'voc': { 
        status: 'completed', 
        updatedAt: '2025-02-10T09:15:00Z',
        notes: 'Análisis VOC completado con todos los grupos de stakeholders',
        data: {
          customers: [
            { type: 'Interno', comment: 'Necesitamos información precisa sobre el inventario disponible para prometer fechas de entrega realistas a los clientes', importance: 5 },
            { type: 'Externo', comment: 'Las inconsistencias entre lo facturado y lo entregado generan problemas en nuestra contabilidad', importance: 4 },
            { type: 'Interno', comment: 'Los retrasos en cobranza afectan nuestro flujo de caja y capacidad de inversión', importance: 5 }
          ]
        }
      },
      'ctq': { 
        status: 'completed', 
        updatedAt: '2025-02-28T16:20:00Z',
        notes: 'Indicadores CTQ definidos y validados con stakeholders',
        data: {
          requirements: [
            { need: 'Información de inventario precisa', driver: 'Exactitud', measure: 'Porcentaje de coincidencia entre sistema y conteo físico', target: '≥ 98%' },
            { need: 'Cobros oportunos', driver: 'Tiempo', measure: 'Días promedio de ciclo de cobranza', target: '≤ 30 días' },
            { need: 'Reducción de cuentas vencidas', driver: 'Porcentaje', measure: 'Porcentaje de cuentas por cobrar con más de 30 días', target: '≤ 10%' }
          ]
        }
      },
      'value-stream-map': { 
        status: 'in_progress', 
        updatedAt: '2025-03-05T11:00:00Z',
        notes: 'VSM en proceso de validación final',
        data: {
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
      },
      'stakeholder-analysis': { 
        status: 'completed', 
        updatedAt: '2025-02-05T15:30:00Z',
        notes: 'Análisis de stakeholders finalizado',
        data: {
          stakeholders: [
            { name: 'Gerencia General', interest: 'alto', influence: 'alto', concerns: 'ROI del proyecto, mejora en flujo de caja', strategy: 'Comunicar avances semanales, mostrar impacto financiero' },
            { name: 'Personal de Almacén', interest: 'medio', influence: 'alto', concerns: 'Cambios en procesos diarios, posible aumento de carga laboral', strategy: 'Involucrar en diseño de soluciones, capacitación' },
            { name: 'Clientes Principales', interest: 'bajo', influence: 'alto', concerns: 'Cambios en procesos de facturación y cobro', strategy: 'Comunicar cambios con anticipación, destacar beneficios' }
          ]
        }
      },
      'cause-effect-diagram': {
        status: 'completed',
        updatedAt: '2025-02-15T13:25:00Z',
        notes: 'Diagrama de Ishikawa completado para problemas de cobranza e inventario',
        data: {
          problem: 'Ciclo de cobranza extendido',
          categories: [
            { name: 'Personal', causes: ['Falta de capacitación en seguimiento', 'Rotación alta en el departamento', 'No hay incentivos por cobros oportunos'] },
            { name: 'Métodos', causes: ['Proceso manual de seguimiento', 'Política de cobro poco clara', 'Falta de escalamiento para casos críticos'] },
            { name: 'Sistemas', causes: ['Software desactualizado', 'Falta de alertas automáticas', 'Reportes poco claros para seguimiento'] },
            { name: 'Entorno', causes: ['Cultura de pago tardío en el mercado', 'Problemas económicos de clientes', 'Competencia con términos más flexibles'] }
          ]
        }
      },
      'prioritization-matrix': { 
        status: 'in_progress', 
        updatedAt: '2025-03-10T13:45:00Z',
        notes: 'Matriz de priorización en desarrollo',
        data: {
          criteria: ['Impacto en flujo de caja', 'Facilidad de implementación', 'Costo', 'Tiempo requerido'],
          initiatives: [
            { name: 'Automatización de recordatorios de pago', scores: [5, 4, 3, 4], total: 16 },
            { name: 'Rediseño de políticas de crédito', scores: [5, 2, 5, 2], total: 14 },
            { name: 'Implementación de sistema de códigos de barras en inventario', scores: [3, 3, 2, 3], total: 11 }
          ]
        }
      },
      'roi-calculator': { 
        status: 'in_progress', 
        updatedAt: '2025-03-12T09:30:00Z',
        notes: 'Análisis de ROI preliminar completado, pendiente validación final',
        data: {
          fte: {
            costPerYear: 12000000,
            timeUnitType: 'monthly',
            timeUnitValue: 160
          },
          implementationCost: 2120000,
          processBefore: {
            minutes: 60,
            frequencyType: 'monthly',
            frequencyValue: 4,
            peopleCount: 2
          },
          processAfter: {
            minutes: 15,
            frequencyType: 'monthly',
            frequencyValue: 4,
            peopleCount: 1
          },
          adoption: {
            curveType: 'exponential',
            inflectionPoint: 6
          },
          results: {
            hoursSaved: 138,
            fteEquivalent: 0.72,
            moneySaved: 8640000,
            roi: 307.55,
            paybackMonths: 3.9,
            lastUpdated: '2025-03-12T09:30:00Z'
          }
        }
      },
      'project-timeline': { 
        status: 'in_progress', 
        updatedAt: '2025-03-14T15:45:00Z',
        notes: 'Línea de tiempo inicial creada, falta agregar detalles de implementación',
        data: {
          phases: [
            { name: 'Define', start: '2025-01-15', end: '2025-01-30', complete: 100 },
            { name: 'Measure', start: '2025-02-01', end: '2025-02-28', complete: 100 },
            { name: 'Analyze', start: '2025-03-01', end: '2025-03-15', complete: 90 },
            { name: 'Improve', start: '2025-03-16', end: '2025-04-05', complete: 20 },
            { name: 'Control', start: '2025-04-06', end: '2025-04-15', complete: 0 }
          ],
          tasks: [
            { id: 't1', name: 'Diseño de nuevo proceso de cobranza', start: '2025-03-16', end: '2025-03-25', dependencies: [], complete: 40, resources: ['María Ramírez', 'Juan Pérez'] },
            { id: 't2', name: 'Implementación de sistema de códigos de barras', start: '2025-03-20', end: '2025-04-05', dependencies: [], complete: 10, resources: ['Laura González'] }
          ]
        }
      },
      'pareto-chart': {
        status: 'completed',
        updatedAt: '2025-02-20T10:15:00Z',
        notes: 'Análisis de Pareto finalizado para causas de retrasos en cobranza',
        data: {
          categories: ['Facturas con errores', 'Retrasos en aprobaciones', 'Información de cliente incorrecta', 'Problemas de comunicación interna', 'Problemas sistema informático', 'Otros'],
          values: [42, 27, 18, 8, 4, 1],
          cumulative: [42, 69, 87, 95, 99, 100]
        }
      },
      'control-chart': {
        status: 'not_started',
        updatedAt: null,
        notes: ''
      },
      'fmea': {
        status: 'not_started',
        updatedAt: null,
        notes: ''
      }
    },
    risks: [
      { id: 'risk-1', description: 'Resistencia al cambio por parte del personal', probability: 'alta', impact: 'media', mitigation: 'Programa de gestión del cambio y comunicación constante' },
      { id: 'risk-2', description: 'Problemas técnicos en implementación de sistema de códigos de barras', probability: 'media', impact: 'alta', mitigation: 'Pruebas piloto y soporte técnico dedicado durante implementación' }
    ],
    issues: [
      { id: 'issue-1', description: 'Dificultad para coordinar reuniones con todos los stakeholders', status: 'resolved', resolution: 'Implementación de reuniones virtuales y grabación para asistencia asíncrona' },
      { id: 'issue-2', description: 'Datos históricos incompletos para análisis de tendencias', status: 'open', resolution: '' }
    ],
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-03-15T10:30:00Z',
    roiData: {
      fte: {
        costPerYear: 12000000,
        timeUnitType: 'monthly',
        timeUnitValue: 160
      },
      implementationCost: 2120000,
      processBefore: {
        minutes: 60,
        frequencyType: 'monthly',
        frequencyValue: 4,
        peopleCount: 2
      },
      processAfter: {
        minutes: 15,
        frequencyType: 'monthly',
        frequencyValue: 4,
        peopleCount: 1
      },
      adoption: {
        curveType: 'exponential',
        inflectionPoint: 6
      },
      results: {
        hoursSaved: 138,
        fteEquivalent: 0.72,
        moneySaved: 8640000,
        roi: 307.55,
        paybackMonths: 3.9,
        lastUpdated: '2025-03-12T09:30:00Z'
      }
    }
  },
  {
    id: 'project-2',
    name: 'Optimización de Línea de Producción',
    description: 'Mejora de eficiencia en la línea de producción principal utilizando metodología Lean Six Sigma y reducción de defectos en proceso de ensamblaje',
    status: 'planning',
    progress: 25,
    startDate: '2025-03-01',
    endDate: '2025-07-30',
    company: 'Manufacturas Industriales S.A.',
    phase: 'Define',
    team: [
      { id: 'team-3', name: 'Roberto Jiménez', role: 'Patrocinador', position: 'Director de Operaciones', email: 'rjimenez@misa.com' },
      { id: 'team-4', name: 'Ana Castro', role: 'Líder del Proyecto', position: 'Black Belt en Six Sigma', email: 'acastro@misa.com' },
      { id: 'team-5', name: 'Fernando Méndez', role: 'Miembro', position: 'Ingeniero de Procesos', email: 'fmendez@misa.com' },
      { id: 'team-6', name: 'Patricia Solís', role: 'Miembro', position: 'Supervisora de Calidad', email: 'psolis@misa.com' }
    ],
    kpis: [
      { id: 'kpi-4', name: 'OEE (Eficiencia General de Equipos)', baseLine: '68%', target: '85%', current: '72%' },
      { id: 'kpi-5', name: 'Tasa de Defectos', baseLine: '3.2%', target: '0.8%', current: '2.9%' },
      { id: 'kpi-6', name: 'Tiempo de Preparación (Setup)', baseLine: '45 minutos', target: '15 minutos', current: '40 minutos' }
    ],
    tools: {
      'project-charter': { 
        status: 'completed', 
        updatedAt: '2025-03-15T09:15:00Z',
        notes: 'Project Charter aprobado por Dirección de Operaciones y Gerencia General',
        data: {
          businessCase: 'La línea de producción principal opera con una eficiencia del 68% frente al estándar industrial del 85%. Los tiempos de preparación y la tasa de defectos generan costos adicionales estimados en ₡25 millones anuales.',
          problemStatement: 'La baja eficiencia y alta tasa de defectos impactan negativamente en los costos de producción y los tiempos de entrega, afectando la competitividad de la empresa en el mercado.',
          scope: 'Incluye línea de producción principal, procesos de ensamblaje, y sistemas de control de calidad. No incluye procesos logísticos ni de aprovisionamiento de materia prima.',
          goals: 'Aumentar el OEE a 85%, reducir la tasa de defectos por debajo del 0.8% y reducir el tiempo de preparación a 15 minutos o menos.'
        }
      },
      'sipoc': { 
        status: 'in_progress', 
        updatedAt: '2025-03-20T14:30:00Z',
        notes: 'SIPOC de proceso de ensamblaje completado, pendiente revisión' ,
        data: {
          processName: 'Ensamblaje de Componentes',
          suppliers: ['Almacén de Materiales', 'Área de Mecanizado', 'Proveedores Externos'],
          inputs: ['Componentes electrónicos', 'Estructuras metálicas', 'Instrucciones de ensamblaje', 'Herramientas'],
          process: ['Preparar estación', 'Verificar componentes', 'Ensamblar subconjuntos', 'Integrar sistema', 'Verificar funcionamiento'],
          outputs: ['Producto ensamblado', 'Reportes de calidad', 'Productos defectuosos'],
          customers: ['Departamento de Control de Calidad', 'Área de Empaque', 'Servicio al Cliente']
        }
      },
      'voc': { 
        status: 'in_progress', 
        updatedAt: '2025-03-18T11:00:00Z',
        notes: 'Entrevistas iniciales con clientes internos completadas',
        data: {
          customers: [
            { type: 'Interno', comment: 'Los productos defectuosos nos obligan a reprocesar y generan retrasos en las entregas', importance: 5 },
            { type: 'Externo', comment: 'Los tiempos de entrega son más largos que la competencia y nos generan problemas de planificación', importance: 4 },
            { type: 'Interno', comment: 'El tiempo de preparación entre lotes es excesivo y reduce nuestra capacidad de producción', importance: 4 }
          ]
        }
      },
      '5s': {
        status: 'not_started',
        updatedAt: null,
        notes: 'Programado para iniciar en fase de Mejora',
        data: null
      },
      'stakeholder-analysis': {
        status: 'completed',
        updatedAt: '2025-03-12T16:45:00Z',
        notes: 'Análisis de stakeholders completado',
        data: {
          stakeholders: [
            { name: 'Gerencia General', interest: 'alto', influence: 'alto', concerns: 'Costo de implementación, ROI del proyecto', strategy: 'Presentaciones mensuales de avance con énfasis en impacto financiero' },
            { name: 'Operarios de Línea', interest: 'alto', influence: 'medio', concerns: 'Cambios en procedimientos, potencial reducción de personal', strategy: 'Comunicación clara sobre beneficios, involucramiento en diseño de soluciones' },
            { name: 'Clientes Clave', interest: 'medio', influence: 'alto', concerns: 'Mejoras en calidad y tiempos de entrega', strategy: 'Comunicación de mejoras esperadas, solicitar retroalimentación' }
          ]
        }
      },
      'roi-calculator': { 
        status: 'in_progress', 
        updatedAt: '2025-03-16T10:30:00Z',
        notes: 'Estimaciones preliminares realizadas, pendiente validación de datos',
        data: {
          fte: {
            costPerYear: 14500000,
            timeUnitType: 'monthly',
            timeUnitValue: 160
          },
          implementationCost: 8500000,
          processBefore: {
            minutes: 45,
            frequencyType: 'daily',
            frequencyValue: 8,
            peopleCount: 3
          },
          processAfter: {
            minutes: 15,
            frequencyType: 'daily',
            frequencyValue: 8,
            peopleCount: 2
          },
          adoption: {
            curveType: 'linear',
            inflectionPoint: 6
          },
          results: {
            hoursSaved: 1560,
            fteEquivalent: 0.81,
            moneySaved: 11745000,
            roi: 38.18,
            paybackMonths: 8.7,
            lastUpdated: '2025-03-16T10:30:00Z'
          }
        }
      }
    },
    risks: [
      { id: 'risk-3', description: 'Interrupciones en producción durante implementación de mejoras', probability: 'alta', impact: 'alta', mitigation: 'Programar cambios durante períodos de mantenimiento programado y fines de semana' },
      { id: 'risk-4', description: 'Falta de experiencia del equipo en técnicas avanzadas de six sigma', probability: 'media', impact: 'alta', mitigation: 'Capacitación previa y contratación de consultor especializado para acompañamiento' }
    ],
    issues: [],
    createdAt: '2025-02-20T14:30:00Z',
    updatedAt: '2025-03-20T14:30:00Z',
    roiData: {
      fte: {
        costPerYear: 14500000,
        timeUnitType: 'monthly',
        timeUnitValue: 160
      },
      implementationCost: 8500000,
      processBefore: {
        minutes: 45,
        frequencyType: 'daily',
        frequencyValue: 8,
        peopleCount: 3
      },
      processAfter: {
        minutes: 15,
        frequencyType: 'daily',
        frequencyValue: 8,
        peopleCount: 2
      },
      adoption: {
        curveType: 'linear',
        inflectionPoint: 6
      },
      results: {
        hoursSaved: 1560,
        fteEquivalent: 0.81,
        moneySaved: 11745000,
        roi: 38.18,
        paybackMonths: 8.7,
        lastUpdated: '2025-03-16T10:30:00Z'
      }
    }
  },
  {
    id: 'project-3',
    name: 'Reducción de Errores en Servicio al Cliente',
    description: 'Aplicación de Six Sigma para reducir errores y mejorar satisfacción del cliente en el centro de atención telefónica y gestión de casos',
    status: 'completed',
    progress: 100,
    startDate: '2024-09-01',
    endDate: '2025-01-30',
    company: 'Soluciones Financieras S.A.',
    phase: 'Control',
    team: [
      { id: 'team-7', name: 'Diana Vargas', role: 'Patrocinador', position: 'Gerente de Servicio al Cliente', email: 'dvargas@sofi.com' },
      { id: 'team-8', name: 'Javier Rojas', role: 'Líder del Proyecto', position: 'Green Belt en Six Sigma', email: 'jrojas@sofi.com' },
      { id: 'team-9', name: 'Karla Monge', role: 'Miembro', position: 'Supervisora de Call Center', email: 'kmonge@sofi.com' },
      { id: 'team-10', name: 'Rodrigo Arias', role: 'Miembro', position: 'Analista de Calidad', email: 'rarias@sofi.com' }
    ],
    kpis: [
      { id: 'kpi-7', name: 'First Call Resolution', baseLine: '65%', target: '85%', current: '88%' },
      { id: 'kpi-8', name: 'Errores en Procesamiento de Solicitudes', baseLine: '8.5%', target: '3%', current: '2.8%' },
      { id: 'kpi-9', name: 'Satisfacción del Cliente (NPS)', baseLine: '42', target: '65', current: '68' }
    ],
    tools: {
      'project-charter': { 
        status: 'completed', 
        updatedAt: '2024-09-10T11:30:00Z',
        notes: 'Project Charter aprobado', 
        data: {
          businessCase: 'El bajo índice de resolución en primera llamada (65%) y la alta tasa de errores en procesamiento (8.5%) están generando pérdida de clientes y sobrecostos operativos estimados en ₡18 millones anuales.',
          problemStatement: 'Los errores en el servicio al cliente generan reprocesos, insatisfacción y pérdida de clientes, afectando la rentabilidad y reputación de la empresa.',
          scope: 'Centro de atención telefónica, procesos de gestión de casos y sistema CRM. No incluye productos financieros ni políticas comerciales.',
          goals: 'Aumentar el First Call Resolution a 85%, reducir errores en procesamiento por debajo del 3% y elevar el NPS de 42 a 65 puntos.'
        }
      },
      'sipoc': { 
        status: 'completed', 
        updatedAt: '2024-09-20T15:45:00Z',
        notes: 'SIPOCs desarrollados para todos los procesos críticos',
        data: {
          processName: 'Atención de Consultas y Reclamos',
          suppliers: ['Clientes', 'Departamento de Productos', 'Sistemas IT'],
          inputs: ['Consultas/reclamos de clientes', 'Información de productos', 'Historial del cliente', 'Políticas de servicio'],
          process: ['Recibir consulta/reclamo', 'Identificar tipo de caso', 'Consultar información relevante', 'Proporcionar solución', 'Registrar caso'],
          outputs: ['Caso resuelto', 'Caso escalado', 'Información de retroalimentación', 'Registros de interacción'],
          customers: ['Clientes Externos', 'Departamento de Mejora Continua', 'Gerencia de Servicio']
        }
      },
      'voc': { 
        status: 'completed', 
        updatedAt: '2024-10-05T14:20:00Z',
        notes: 'VOC completado con clientes y empleados',
        data: {
          customers: [
            { type: 'Externo', comment: 'Me transfieren múltiples veces y tengo que repetir mi problema a diferentes personas', importance: 5 },
            { type: 'Externo', comment: 'Las soluciones prometidas no siempre se cumplen en los tiempos indicados', importance: 5 },
            { type: 'Interno', comment: 'No tenemos acceso rápido a toda la información necesaria para resolver casos en primera llamada', importance: 4 }
          ]
        }
      },
      'ctq': { 
        status: 'completed', 
        updatedAt: '2024-10-25T09:15:00Z',
        notes: 'CTQs definidos y validados',
        data: {
          requirements: [
            { need: 'Resolución en primera llamada', driver: 'Eficiencia', measure: 'Porcentaje de casos resueltos sin transferencias', target: '≥ 85%' },
            { need: 'Precisión en el procesamiento', driver: 'Calidad', measure: 'Porcentaje de solicitudes procesadas sin errores', target: '≥ 97%' },
            { need: 'Experiencia del cliente positiva', driver: 'Satisfacción', measure: 'Net Promoter Score (NPS)', target: '≥ 65' }
          ]
        }
      },
      'value-stream-map': { 
        status: 'completed', 
        updatedAt: '2024-11-15T16:30:00Z',
        notes: 'VSM completado y validado',
        data: {
          currentState: {
            totalLeadTime: '3.5 días',
            valueAddedTime: '32 minutos',
            mainWastes: ['Transferencias múltiples', 'Tiempo de espera por información', 'Reprocesos por información incompleta']
          },
          futureState: {
            targetLeadTime: '1 día',
            improvements: ['Dashboard unificado de información', 'Scripts mejorados para diagnóstico inicial', 'Capacitación cruzada para reducir transferencias']
          }
        }
      },
      'stakeholder-analysis': { 
        status: 'completed', 
        updatedAt: '2024-09-15T10:20:00Z',
        notes: 'Análisis stakeholders finalizado',
        data: {
          stakeholders: [
            { name: 'Equipo de Atención al Cliente', interest: 'alto', influence: 'alto', concerns: 'Cambios en procedimientos, medición de desempeño', strategy: 'Co-creación de soluciones, comunicación constante de beneficios' },
            { name: 'Departamento IT', interest: 'medio', influence: 'alto', concerns: 'Cambios en sistemas, recursos necesarios', strategy: 'Involucrar desde fase temprana, priorizar requerimientos' },
            { name: 'Clientes', interest: 'bajo', influence: 'alto', concerns: 'Mejora en servicio, mínima interrupción', strategy: 'Comunicar mejoras, implementar cambios transparentes' }
          ]
        }
      },
      'prioritization-matrix': { 
        status: 'completed', 
        updatedAt: '2024-11-10T13:40:00Z',
        notes: 'Matriz priorización completada',
        data: {
          criteria: ['Impacto en satisfacción', 'Facilidad de implementación', 'Costo', 'Tiempo de implementación'],
          initiatives: [
            { name: 'Dashboard unificado de información', scores: [5, 3, 2, 2], total: 12 },
            { name: 'Capacitación cruzada de personal', scores: [4, 4, 4, 3], total: 15 },
            { name: 'Rediseño de scripts de atención', scores: [5, 5, 5, 4], total: 19 }
          ]
        }
      },
      'control-chart': {
        status: 'completed',
        updatedAt: '2025-01-15T14:30:00Z',
        notes: 'Gráficos de control implementados para monitoreo continuo',
        data: {
          metricName: 'Porcentaje de Errores en Procesamiento',
          centerLine: 2.8,
          upperControlLimit: 4.5,
          lowerControlLimit: 1.1,
          measurements: [2.9, 3.1, 2.6, 2.7, 3.0, 2.5, 2.8, 2.7, 2.6, 2.8, 2.9, 3.0],
          outOfControl: false
        }
      },
      'fmea': {
        status: 'completed',
        updatedAt: '2024-12-05T11:20:00Z',
        notes: 'FMEA completo para procesos críticos',
        data: {
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
      },
      'pareto-chart': {
        status: 'completed',
        updatedAt: '2024-10-30T15:15:00Z',
        notes: 'Análisis de Pareto de causas de insatisfacción completado',
        data: {
          categories: ['Múltiples transferencias', 'Tiempo de espera', 'Información inconsistente', 'Promesas incumplidas', 'Trato inadecuado', 'Otros'],
          values: [38, 29, 15, 10, 5, 3],
          cumulative: [38, 67, 82, 92, 97, 100]
        }
      },
      'roi-calculator': {
        status: 'completed',
        updatedAt: '2024-12-15T10:45:00Z',
        notes: 'Análisis de ROI validado con Finanzas',
        data: {
          fte: {
            costPerYear: 9500000,
            timeUnitType: 'monthly',
            timeUnitValue: 160
          },
          implementationCost: 3750000,
          processBefore: {
            minutes: 18,
            frequencyType: 'daily',
            frequencyValue: 120,
            peopleCount: 1
          },
          processAfter: {
            minutes: 10,
            frequencyType: 'daily',
            frequencyValue: 120,
            peopleCount: 1
          },
          adoption: {
            curveType: 'exponential',
            inflectionPoint: 4
          },
          results: {
            hoursSaved: 3650,
            fteEquivalent: 1.9,
            moneySaved: 18050000,
            roi: 381.33,
            paybackMonths: 2.5,
            lastUpdated: '2024-12-15T10:45:00Z'
          }
        }
      }
    },
    lessons: [
      { id: 'lesson-1', category: 'Positivo', description: 'La participación temprana de los agentes de primera línea fue clave para identificar problemas reales y desarrollar soluciones prácticas' },
      { id: 'lesson-2', category: 'Desafío', description: 'Las actualizaciones del sistema CRM tomaron más tiempo del previsto, lo que retrasó algunas implementaciones' },
      { id: 'lesson-3', category: 'Mejora', description: 'Para futuros proyectos, involucrar al departamento IT desde la fase de planificación para evitar cuellos de botella' }
    ],
    createdAt: '2024-08-15T09:00:00Z',
    updatedAt: '2025-01-30T16:30:00Z',
    roiData: {
      fte: {
        costPerYear: 9500000,
        timeUnitType: 'monthly',
        timeUnitValue: 160
      },
      implementationCost: 3750000,
      processBefore: {
        minutes: 18,
        frequencyType: 'daily',
        frequencyValue: 120,
        peopleCount: 1
      },
      processAfter: {
        minutes: 10,
        frequencyType: 'daily',
        frequencyValue: 120,
        peopleCount: 1
      },
      adoption: {
        curveType: 'exponential',
        inflectionPoint: 4
      },
      results: {
        hoursSaved: 3650,
        fteEquivalent: 1.9,
        moneySaved: 18050000,
        roi: 381.33,
        paybackMonths: 2.5,
        lastUpdated: '2024-12-15T10:45:00Z'
      }
    }
  },
  {
    id: 'project-4',
    name: 'Mejora de Procesos Logísticos',
    description: 'Proyecto Lean Six Sigma para reducir tiempos de entrega y optimizar rutas de distribución utilizando análisis de datos',
    status: 'active',
    progress: 50,
    startDate: '2025-02-01',
    endDate: '2025-06-30',
    company: 'Distribuidora Nacional S.A.',
    phase: 'Analyze',
    team: [
      { id: 'team-11', name: 'Ricardo Mora', role: 'Patrocinador', position: 'Director de Logística', email: 'rmora@dinasa.com' },
      { id: 'team-12', name: 'Silvia Campos', role: 'Líder del Proyecto', position: 'Black Belt en Six Sigma', email: 'scampos@dinasa.com' },
      { id: 'team-13', name: 'José Hernández', role: 'Miembro', position: 'Jefe de Transportes', email: 'jhernandez@dinasa.com' }
    ],
    kpis: [
      { id: 'kpi-10', name: 'Tiempo Promedio de Entrega', baseLine: '48 horas', target: '24 horas', current: '36 horas' },
      { id: 'kpi-11', name: 'Costo por Kilómetro', baseLine: '₡420', target: '₡350', current: '₡385' },
      { id: 'kpi-12', name: 'Tasa de Entregas Perfectas', baseLine: '82%', target: '95%', current: '88%' }
    ],
    tools: {
      'project-charter': { 
        status: 'completed', 
        updatedAt: '2025-02-10T14:30:00Z',
        notes: 'Project Charter aprobado por dirección',
        data: {
          businessCase: 'Los tiempos de entrega actuales y la ineficiencia en rutas generan un sobrecosto anual de ₡32 millones y afectan la satisfacción de los clientes, poniendo en riesgo contratos por ₡150 millones.',
          problemStatement: 'Los tiempos de entrega promedio de 48 horas y la tasa de entregas perfectas del 82% están muy por debajo de los estándares del mercado y generan insatisfacción en los clientes.',
          scope: 'Incluye procesos de planificación de rutas, despacho, transporte y entrega. No incluye procesos de almacenamiento ni aprovisionamiento.',
          goals: 'Reducir el tiempo promedio de entrega a 24 horas, disminuir el costo por kilómetro a ₡350 y aumentar la tasa de entregas perfectas al 95%.'
        }
      },
      'sipoc': { 
        status: 'completed', 
        updatedAt: '2025-02-20T11:15:00Z',
        notes: 'SIPOCs completados para procesos de distribución',
        data: {
          processName: 'Distribución de Mercancías',
          suppliers: ['Centro de Distribución', 'Departamento de Planificación', 'Proveedores de Transporte'],
          inputs: ['Pedidos confirmados', 'Mercancía empacada', 'Vehículos', 'Rutas planificadas'],
          process: ['Verificar pedidos', 'Cargar vehículos', 'Transportar mercancía', 'Entregar a cliente', 'Confirmar recepción'],
          outputs: ['Entregas completadas', 'Documentación firmada', 'Reportes de incidencias', 'Vehículos disponibles'],
          customers: ['Clientes Externos', 'Departamento de Facturación', 'Servicio al Cliente']
        }
      },
      'value-stream-map': { 
        status: 'completed', 
        updatedAt: '2025-03-15T16:45:00Z',
        notes: 'Value Stream Map completado para flujo logístico',
        data: {
          currentState: {
            totalLeadTime: '48 horas',
            valueAddedTime: '12 horas',
            mainWastes: ['Esperas en carga y descarga', 'Movimientos innecesarios', 'Rutas ineficientes', 'Procesamiento excesivo de documentación']
          },
          futureState: {
            targetLeadTime: '24 horas',
            improvements: ['Optimización de rutas con software especializado', 'Estandarización de procesos de carga/descarga', 'Digitalización de documentación']
          }
        }
      },
      'pareto-chart': {
        status: 'completed',
        updatedAt: '2025-03-20T13:30:00Z',
        notes: 'Análisis de Pareto de causas de retrasos en entregas',
        data: {
          categories: ['Rutas ineficientes', 'Demoras en carga', 'Tráfico imprevisto', 'Documentación incompleta', 'Dirección incorrecta', 'Otros'],
          values: [35, 25, 20, 10, 7, 3],
          cumulative: [35, 60, 80, 90, 97, 100]
        }
      },
      'cause-effect-diagram': {
        status: 'in_progress',
        updatedAt: '2025-03-25T10:20:00Z',
        notes: 'Diagrama de Ishikawa en desarrollo para ineficiencias en rutas',
        data: {
          problem: 'Rutas de distribución ineficientes',
          categories: [
            { name: 'Personal', causes: ['Falta de capacitación en planificación', 'Resistencia a nuevas tecnologías', 'Alta rotación de conductores'] },
            { name: 'Métodos', causes: ['Planificación manual de rutas', 'Ausencia de criterios estándar', 'Falta de análisis de datos históricos'] },
            { name: 'Máquinas', causes: ['Software desactualizado', 'Vehículos con diferentes capacidades', 'Sistemas GPS deficientes'] },
            { name: 'Entorno', causes: ['Tráfico variable', 'Condiciones climáticas', 'Restricciones zonales de circulación'] }
          ]
        }
      },
      'roi-calculator': {
        status: 'in_progress',
        updatedAt: '2025-03-22T14:15:00Z',
        notes: 'Análisis preliminar de ROI en desarrollo',
        data: {
          fte: {
            costPerYear: 11800000,
            timeUnitType: 'monthly',
            timeUnitValue: 160
          },
          implementationCost: 14500000,
          processBefore: {
            minutes: 35,
            frequencyType: 'daily',
            frequencyValue: 45,
            peopleCount: 2
          },
          processAfter: {
            minutes: 20,
            frequencyType: 'daily',
            frequencyValue: 45,
            peopleCount: 1
          },
          adoption: {
            curveType: 'linear',
            inflectionPoint: 6
          },
          results: {
            hoursSaved: 4100,
            fteEquivalent: 2.1,
            moneySaved: 24780000,
            roi: 70.9,
            paybackMonths: 7.0,
            lastUpdated: '2025-03-22T14:15:00Z'
          }
        }
      }
    },
    risks: [
      { id: 'risk-5', description: 'Resistencia de conductores a nuevos sistemas de monitoreo y optimización', probability: 'alta', impact: 'media', mitigation: 'Programa de gestión del cambio y sesiones de explicación de beneficios' },
      { id: 'risk-6', description: 'Incompatibilidad de nuevo software con sistemas legados', probability: 'media', impact: 'alta', mitigation: 'Pruebas de integración extensivas y plan de contingencia' }
    ],
    issues: [
      { id: 'issue-3', description: 'Retrasos en implementación de software de optimización', status: 'open', resolution: '' }
    ],
    createdAt: '2025-01-20T11:30:00Z',
    updatedAt: '2025-03-25T10:20:00Z',
    roiData: {
      fte: {
        costPerYear: 11800000,
        timeUnitType: 'monthly',
        timeUnitValue: 160
      },
      implementationCost: 14500000,
      processBefore: {
        minutes: 35,
        frequencyType: 'daily',
        frequencyValue: 45,
        peopleCount: 2
      },
      processAfter: {
        minutes: 20,
        frequencyType: 'daily',
        frequencyValue: 45,
        peopleCount: 1
      },
      adoption: {
        curveType: 'linear',
        inflectionPoint: 6
      },
      results: {
        hoursSaved: 4100,
        fteEquivalent: 2.1,
        moneySaved: 24780000,
        roi: 70.9,
        paybackMonths: 7.0,
        lastUpdated: '2025-03-22T14:15:00Z'
      }
    }
  }
];

export default projects;
