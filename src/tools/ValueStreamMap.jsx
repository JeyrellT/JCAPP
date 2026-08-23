import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Save,
  Edit,
  Eye,
  Plus,
  Trash2,
  GitBranch,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowRight,
  RotateCcw,
  Download,
  Package,
  Truck,
  AlertTriangle,
  Clipboard,
  HelpCircle,
  Loader2,
  Check,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import useToolData from '../hooks/useToolData';
import EmptyState from '../components/common/EmptyState';
import GradientButton from '../components/common/GradientButton';
import Modal from '../components/ui/Modal';
import { formatNumber, formatPercent, formatRelative } from '../lib/format';
import { fadeInUp } from '../lib/motion';

/**
 * Componente Mapa de Flujo de Valor (Value Stream Mapping)
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} props.projectId - ID del proyecto
 */
const TOOL_ID = 'value-stream-map';

const DEFAULT_DATA = {
  processes: [],
  connections: [],
  customer: { name: 'Cliente', demands: '' },
  supplier: { name: 'Proveedor', supplies: '' },
  viewMode: 'current', // 'current' | 'future' — solo cambia el rótulo del diagrama
  currentState: { totalLeadTime: '', valueAddedTime: '', mainWastes: [] },
  futureState: { targetLeadTime: '', improvements: [] },
};

// Rescate de la clave legacy `project.valueStreamMap` (raíz del proyecto).
// El `currentState` viejo era un booleano (true = estado actual, false =
// estado futuro); el nuevo `currentState` es un objeto de resumen, así que se
// reconstruye a mano en vez de esparcir el objeto viejo tal cual.
const legacyRescue = (project) => {
  const old = project?.valueStreamMap;
  if (!old || typeof old !== 'object') return null;
  return {
    processes: Array.isArray(old.processes) ? old.processes : [],
    connections: Array.isArray(old.connections) ? old.connections : [],
    customer: old.customer && typeof old.customer === 'object' ? old.customer : DEFAULT_DATA.customer,
    supplier: old.supplier && typeof old.supplier === 'object' ? old.supplier : DEFAULT_DATA.supplier,
    viewMode: old.currentState === false ? 'future' : 'current',
    currentState: DEFAULT_DATA.currentState,
    futureState: DEFAULT_DATA.futureState,
  };
};

// --- Subcomponentes de presentación (sin estado de persistencia propio) ----

function SaveStatus({ isDirty, isSaving, justSaved, lastSavedAt, error, onRetry }) {
  let icon = <span className="h-1.5 w-1.5 rounded-full bg-content-muted" aria-hidden="true" />;
  let text = 'Sin cambios';
  let tone = 'text-content-muted';

  if (error) {
    icon = <AlertTriangle size={14} aria-hidden="true" />;
    text = 'No se pudo guardar';
    tone = 'text-danger-on';
  } else if (isSaving) {
    icon = <Loader2 size={14} className="animate-spin" aria-hidden="true" />;
    text = 'Guardando cambios…';
    tone = 'text-content-secondary';
  } else if (justSaved) {
    icon = <Check size={14} aria-hidden="true" />;
    text = 'Guardado';
    tone = 'text-success-on';
  } else if (isDirty) {
    icon = <span className="h-1.5 w-1.5 rounded-full bg-warning-on" aria-hidden="true" />;
    text = 'Cambios sin guardar';
    tone = 'text-warning-on';
  } else if (lastSavedAt) {
    icon = <Check size={14} aria-hidden="true" />;
    text = `Guardado ${formatRelative(lastSavedAt)}`;
    tone = 'text-success-on';
  }

  return (
    <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm ${tone}`}>
      {icon}
      <span>{text}</span>
      {error && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-1 font-medium underline underline-offset-2 hover:text-content"
        >
          Reintentar
        </button>
      )}
    </p>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-content">{label}</span>
      <input
        type="text"
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function EditableList({ label, items, onChange, addLabel, placeholder }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-content">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...(items || []), ''])}
          aria-label={addLabel}
          className="rounded-md p-1 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
      <ul className="mt-2 space-y-2">
        {(items || []).map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <input
              type="text"
              className="input"
              value={item}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[idx] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              aria-label={`Eliminar elemento ${idx + 1}`}
              className="rounded-md p-1.5 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </li>
        ))}
        {(!items || items.length === 0) && (
          <li className="text-sm text-content-muted">Sin elementos todavía.</li>
        )}
      </ul>
    </div>
  );
}

const ValueStreamMap = ({ projectId }) => {
  const t = useToolData(projectId, TOOL_ID, DEFAULT_DATA, { legacy: legacyRescue });
  const shouldReduceMotion = useReducedMotion();
  const mapRef = useRef(null);

  // Estado puramente de interfaz (no se persiste): selección, modo edición,
  // formato de vista, panel de ayuda.
  const [editMode, setEditMode] = useState(false);
  const [displayFormat, setDisplayFormat] = useState('diagram'); // 'diagram' | 'table'
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [creatingConnection, setCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // Modo ejemplo (no gestionado por el hook: loadExample() nunca guarda).
  const [exampleMode, setExampleMode] = useState(false);
  const [confirmLoadExample, setConfirmLoadExample] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const preExampleSnapshotRef = useRef(null);

  const effectiveEditMode = exampleMode ? false : editMode;

  // Refresca el texto relativo de "Guardado hace…" sin depender de que otra
  // cosa vuelva a renderizar el componente.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const vsm = t.data;

  // Métricas derivadas del diagrama. Se calculan al vuelo: no se persisten
  // como campo aparte para no duplicar fuente de verdad con `processes`.
  const metrics = useMemo(() => {
    const processes = vsm.processes || [];
    const leadTime = processes.reduce(
      (sum, p) => sum + (parseFloat(p.cycleTime) || 0) + (parseFloat(p.waitTime) || 0),
      0
    );
    const processTime = processes.reduce((sum, p) => sum + (parseFloat(p.cycleTime) || 0), 0);
    const waitingTime = processes.reduce((sum, p) => sum + (parseFloat(p.waitTime) || 0), 0);
    const valueAddedRatio = leadTime > 0 ? (processTime / leadTime) * 100 : 0;
    return { leadTime, processTime, waitingTime, valueAddedRatio };
  }, [vsm.processes]);

  // --- Acciones sobre el diagrama ------------------------------------------

  const addProcess = () => {
    const newProcess = {
      id: `proc-${Date.now()}`,
      name: 'Nuevo Proceso',
      cycleTime: 0,
      waitTime: 0,
      operators: 1,
      uptime: 100,
      inventory: 0,
      defectRate: 0,
      x: (vsm.processes?.length || 0) * 180 + 200,
      y: 200,
    };

    t.setData((prev) => ({ ...prev, processes: [...prev.processes, newProcess] }));
    setEditMode(true);
    setSelectedProcess(newProcess);
  };

  const updateProcess = (id, data) => {
    t.setData((prev) => ({
      ...prev,
      processes: prev.processes.map((proc) => (proc.id === id ? { ...proc, ...data } : proc)),
    }));
    setSelectedProcess((prev) => (prev && prev !== 'supplier' && prev !== 'customer' && prev.id === id ? { ...prev, ...data } : prev));
  };

  const deleteProcess = (id) => {
    t.setData((prev) => ({
      ...prev,
      processes: prev.processes.filter((proc) => proc.id !== id),
      connections: prev.connections.filter((conn) => conn.source !== id && conn.target !== id),
    }));
    if (selectedProcess?.id === id) setSelectedProcess(null);
  };

  const startConnection = (processId) => {
    setCreatingConnection(true);
    setConnectionStart(processId);
  };

  const completeConnection = (targetId) => {
    if (connectionStart && connectionStart !== targetId) {
      const newConnection = {
        id: `conn-${Date.now()}`,
        source: connectionStart,
        target: targetId,
        type: 'material',
        pushPull: 'push',
        quantity: 0,
        frequency: 'diaria',
      };
      t.setData((prev) => ({ ...prev, connections: [...prev.connections, newConnection] }));
      setSelectedConnection(newConnection);
    }
    setCreatingConnection(false);
    setConnectionStart(null);
  };

  const updateConnection = (id, data) => {
    t.setData((prev) => ({
      ...prev,
      connections: prev.connections.map((conn) => (conn.id === id ? { ...conn, ...data } : conn)),
    }));
    setSelectedConnection((prev) => (prev && prev.id === id ? { ...prev, ...data } : prev));
  };

  const deleteConnection = (id) => {
    t.setData((prev) => ({ ...prev, connections: prev.connections.filter((conn) => conn.id !== id) }));
    if (selectedConnection?.id === id) setSelectedConnection(null);
  };

  const updateActor = (type, data) => {
    t.setData((prev) => ({ ...prev, [type]: { ...prev[type], ...data } }));
  };

  const toggleViewMode = () => {
    t.setData((prev) => ({ ...prev, viewMode: prev.viewMode === 'current' ? 'future' : 'current' }));
  };

  const exportAsImage = async () => {
    if (!mapRef.current) return;
    try {
      const canvas = await html2canvas(mapRef.current, { backgroundColor: null, scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      const projectName = (t.project?.name || 'proyecto').replace(/\s+/g, '_');
      link.download = `vsm_${projectName}_${new Date().toISOString().slice(0, 10)}.png`;
      link.click();
    } catch (err) {
      console.error('Error al exportar la imagen:', err);
    }
  };

  // --- Modo ejemplo ----------------------------------------------------------

  const activateExample = () => {
    preExampleSnapshotRef.current = t.data;
    t.loadExample(0);
    setExampleMode(true);
    setSelectedProcess(null);
    setSelectedConnection(null);
    setEditMode(false);
  };

  const handleViewExampleClick = () => {
    if (t.isDirty) {
      setConfirmLoadExample(true);
      return;
    }
    activateExample();
  };

  const handleAdoptExample = () => {
    t.save();
    setExampleMode(false);
  };

  const handleUndoExample = () => {
    if (preExampleSnapshotRef.current) t.setData(preExampleSnapshotRef.current);
    setExampleMode(false);
  };

  const handleCancelClick = () => setConfirmDiscard(true);

  // --- Renderizado -----------------------------------------------------------

  if (!t.ready) return null;

  const hasProcesses = (vsm.processes || []).length > 0;

  const renderProcessNode = (process) => {
    const isSelected = selectedProcess?.id === process.id;
    return (
      <motion.div
        key={process.id}
        className={`absolute w-40 rounded-md border-2 bg-surface px-3 py-2 shadow-md ${
          isSelected ? 'border-brand' : 'border-line-strong'
        }`}
        style={{ left: process.x, top: process.y, cursor: effectiveEditMode ? 'move' : 'pointer' }}
        whileHover={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)' }}
        onClick={() => setSelectedProcess(process)}
        drag={effectiveEditMode}
        dragMomentum={false}
        onDragEnd={(e, info) => {
          updateProcess(process.id, { x: process.x + info.offset.x, y: process.y + info.offset.y });
        }}
      >
        <div className="border-b border-line-subtle pb-1 text-center font-semibold text-content">{process.name}</div>
        <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-content-secondary">
          <div className="tabular-nums">CT: {formatNumber(process.cycleTime)} min</div>
          <div className="tabular-nums">WT: {formatNumber(process.waitTime)} min</div>
          <div className="tabular-nums">Op: {formatNumber(process.operators)}</div>
          <div className="tabular-nums">Up: {formatNumber(process.uptime)}%</div>
        </div>

        {effectiveEditMode && (
          <div className="absolute -right-2 -top-2 flex gap-1">
            {creatingConnection ? (
              <button
                type="button"
                className="rounded-full bg-success-soft p-1 text-success-on"
                aria-label={`Conectar a ${process.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  completeConnection(process.id);
                }}
              >
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full bg-brand p-1 text-brand-contrast"
                aria-label={`Iniciar conexión desde ${process.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  startConnection(process.id);
                }}
              >
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  const renderConnections = () =>
    (vsm.connections || []).map((conn) => {
      const source = vsm.processes.find((p) => p.id === conn.source);
      const target = vsm.processes.find((p) => p.id === conn.target);
      if (!source || !target) return null;

      const isSelected = selectedConnection?.id === conn.id;
      const startX = source.x + 70;
      const startY = source.y + 40;
      const endX = target.x;
      const endY = target.y + 40;
      const path = `M${startX},${startY} L${endX},${endY}`;
      const strokeColor = isSelected ? 'rgb(var(--jc-brand))' : conn.type === 'information' ? 'rgb(var(--jc-content-muted))' : 'rgb(var(--jc-content-secondary))';

      return (
        <g key={conn.id} onClick={() => setSelectedConnection(conn)} className="cursor-pointer">
          <path
            d={path}
            stroke={strokeColor}
            strokeWidth={isSelected ? 3 : 2}
            fill="none"
            strokeDasharray={conn.type === 'information' ? '5,5' : 'none'}
          />
          <polygon points={`${endX},${endY} ${endX - 10},${endY - 5} ${endX - 10},${endY + 5}`} fill={strokeColor} />
          <text x={(startX + endX) / 2} y={(startY + endY) / 2 - 10} fontSize="10" textAnchor="middle" fill={strokeColor}>
            {conn.quantity > 0 ? `${formatNumber(conn.quantity)} uds/${conn.frequency}` : ''}
          </text>
          {conn.pushPull === 'pull' && (
            <text x={(startX + endX) / 2} y={(startY + endY) / 2 + 15} fontSize="14" textAnchor="middle" fill="rgb(var(--jc-success))">
              ⟲
            </text>
          )}
        </g>
      );
    });

  const renderEndpoints = () => (
    <>
      <motion.div
        className="absolute w-40 rounded-md border-2 border-line-strong bg-warning-soft px-3 py-2 shadow-md"
        style={{ left: 50, top: 200 }}
        whileHover={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)' }}
        onClick={() => effectiveEditMode && setSelectedProcess('supplier')}
      >
        <div className="flex items-center justify-center border-b border-line-subtle pb-1 text-center font-semibold text-content">
          <Truck size={16} className="mr-1" aria-hidden="true" />
          {vsm.supplier.name}
        </div>
        <div className="mt-1 text-xs text-content-secondary">{vsm.supplier.supplies}</div>
      </motion.div>

      <motion.div
        className="absolute w-40 rounded-md border-2 border-line-strong bg-success-soft px-3 py-2 shadow-md"
        style={{ left: Math.max(...vsm.processes.map((p) => p.x), 200) + 200, top: 200 }}
        whileHover={{ boxShadow: '0 0 8px rgba(0, 0, 0, 0.2)' }}
        onClick={() => effectiveEditMode && setSelectedProcess('customer')}
      >
        <div className="flex items-center justify-center border-b border-line-subtle pb-1 text-center font-semibold text-content">
          <Package size={16} className="mr-1" aria-hidden="true" />
          {vsm.customer.name}
        </div>
        <div className="mt-1 text-xs text-content-secondary">{vsm.customer.demands}</div>
      </motion.div>
    </>
  );

  const renderPropertiesPanel = () => {
    if (!effectiveEditMode) return null;

    if (selectedProcess === 'supplier') {
      return (
        <div className="w-full max-w-xs rounded-lg border border-line bg-surface p-4 shadow-sm">
          <h3 className="mb-3 flex items-center text-lg font-bold text-content">
            <Truck size={18} className="mr-2" aria-hidden="true" />
            Proveedor
          </h3>
          <div className="space-y-3">
            <TextField label="Nombre" value={vsm.supplier.name} onChange={(v) => updateActor('supplier', { name: v })} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-content">Suministros</span>
              <textarea
                className="input"
                rows={3}
                value={vsm.supplier.supplies}
                onChange={(e) => updateActor('supplier', { supplies: e.target.value })}
              />
            </label>
          </div>
        </div>
      );
    }

    if (selectedProcess === 'customer') {
      return (
        <div className="w-full max-w-xs rounded-lg border border-line bg-surface p-4 shadow-sm">
          <h3 className="mb-3 flex items-center text-lg font-bold text-content">
            <Package size={18} className="mr-2" aria-hidden="true" />
            Cliente
          </h3>
          <div className="space-y-3">
            <TextField label="Nombre" value={vsm.customer.name} onChange={(v) => updateActor('customer', { name: v })} />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-content">Demanda</span>
              <textarea
                className="input"
                rows={3}
                value={vsm.customer.demands}
                onChange={(e) => updateActor('customer', { demands: e.target.value })}
              />
            </label>
          </div>
        </div>
      );
    }

    if (selectedProcess) {
      return (
        <div className="w-full max-w-xs rounded-lg border border-line bg-surface p-4 shadow-sm">
          <h3 className="mb-3 flex items-center text-lg font-bold text-content">
            <GitBranch size={18} className="mr-2" aria-hidden="true" />
            Propiedades del Proceso
          </h3>
          <div className="space-y-3">
            <TextField label="Nombre" value={selectedProcess.name} onChange={(v) => updateProcess(selectedProcess.id, { name: v })} />
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 flex items-center text-sm font-medium text-content">
                  <Clock size={14} className="mr-1" aria-hidden="true" />
                  Tiempo de Ciclo (min)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="input"
                  value={selectedProcess.cycleTime}
                  onChange={(e) => updateProcess(selectedProcess.id, { cycleTime: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 flex items-center text-sm font-medium text-content">
                  <Clock size={14} className="mr-1" aria-hidden="true" />
                  Tiempo de Espera (min)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="input"
                  value={selectedProcess.waitTime}
                  onChange={(e) => updateProcess(selectedProcess.id, { waitTime: e.target.value })}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-content">Operadores</span>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={selectedProcess.operators}
                  onChange={(e) => updateProcess(selectedProcess.id, { operators: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-content">Disponibilidad (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={selectedProcess.uptime}
                  onChange={(e) => updateProcess(selectedProcess.id, { uptime: e.target.value })}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-content">Inventario</span>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={selectedProcess.inventory}
                  onChange={(e) => updateProcess(selectedProcess.id, { inventory: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-content">% Defectos</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={selectedProcess.defectRate}
                  onChange={(e) => updateProcess(selectedProcess.id, { defectRate: e.target.value })}
                />
              </label>
            </div>
            <GradientButton variant="danger" size="sm" fullWidth leadingIcon={<Trash2 size={16} />} onClick={() => deleteProcess(selectedProcess.id)}>
              Eliminar Proceso
            </GradientButton>
          </div>
        </div>
      );
    }

    if (selectedConnection) {
      return (
        <div className="w-full max-w-xs rounded-lg border border-line bg-surface p-4 shadow-sm">
          <h3 className="mb-3 flex items-center text-lg font-bold text-content">
            <ArrowRight size={18} className="mr-2" aria-hidden="true" />
            Propiedades de la Conexión
          </h3>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-content">Tipo</span>
              <select
                className="input"
                value={selectedConnection.type}
                onChange={(e) => updateConnection(selectedConnection.id, { type: e.target.value })}
              >
                <option value="material">Material</option>
                <option value="information">Información</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-content">Método</span>
              <select
                className="input"
                value={selectedConnection.pushPull}
                onChange={(e) => updateConnection(selectedConnection.id, { pushPull: e.target.value })}
              >
                <option value="push">Push (Empujar)</option>
                <option value="pull">Pull (Jalar)</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-content">Cantidad</span>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={selectedConnection.quantity}
                  onChange={(e) => updateConnection(selectedConnection.id, { quantity: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-content">Frecuencia</span>
                <select
                  className="input"
                  value={selectedConnection.frequency}
                  onChange={(e) => updateConnection(selectedConnection.id, { frequency: e.target.value })}
                >
                  <option value="horaria">Horaria</option>
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </label>
            </div>
            <GradientButton variant="danger" size="sm" fullWidth leadingIcon={<Trash2 size={16} />} onClick={() => deleteConnection(selectedConnection.id)}>
              Eliminar Conexión
            </GradientButton>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-xs rounded-lg border border-line bg-surface p-4 shadow-sm">
        <p className="text-sm text-content-secondary">Selecciona un elemento para editar sus propiedades.</p>
        <GradientButton size="sm" fullWidth className="mt-3" leadingIcon={<Plus size={16} />} onClick={addProcess}>
          Añadir Proceso
        </GradientButton>
      </div>
    );
  };

  const renderTableView = () => (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-surface-sunken">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium text-content-secondary">Proceso</th>
            <th scope="col" className="px-3 py-2 text-right font-medium text-content-secondary">Tiempo de ciclo (min)</th>
            <th scope="col" className="px-3 py-2 text-right font-medium text-content-secondary">Tiempo de espera (min)</th>
            <th scope="col" className="px-3 py-2 text-right font-medium text-content-secondary">Operadores</th>
            <th scope="col" className="px-3 py-2 text-right font-medium text-content-secondary">Disponibilidad</th>
            <th scope="col" className="px-3 py-2 text-right font-medium text-content-secondary">Inventario</th>
            <th scope="col" className="px-3 py-2 text-right font-medium text-content-secondary">% Defectos</th>
            {effectiveEditMode && <th scope="col" className="px-3 py-2 text-right font-medium text-content-secondary">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-subtle bg-surface">
          {vsm.processes.map((process) => (
            <tr key={process.id}>
              <td className="px-3 py-2 text-content">
                {effectiveEditMode ? (
                  <input
                    type="text"
                    className="input"
                    value={process.name}
                    onChange={(e) => updateProcess(process.id, { name: e.target.value })}
                  />
                ) : (
                  process.name
                )}
              </td>
              {['cycleTime', 'waitTime', 'operators', 'uptime', 'inventory', 'defectRate'].map((field) => (
                <td key={field} className="px-3 py-2 text-right tabular-nums text-content">
                  {effectiveEditMode ? (
                    <input
                      type="number"
                      min="0"
                      className="input text-right"
                      value={process[field]}
                      onChange={(e) => updateProcess(process.id, { [field]: e.target.value })}
                    />
                  ) : (
                    formatNumber(process[field])
                  )}
                </td>
              ))}
              {effectiveEditMode && (
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    aria-label={`Eliminar ${process.name}`}
                    className="rounded-md p-1.5 text-content-muted transition-colors duration-fast hover:bg-danger-soft hover:text-danger-on"
                    onClick={() => deleteProcess(process.id)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDiagramView = () => (
    <div className="flex gap-4">
      <div className="relative flex-grow overflow-auto rounded-lg border border-line bg-surface-sunken" style={{ height: 520 }}>
        {creatingConnection && (
          <div className="absolute left-2 top-2 z-10 flex items-center rounded-full border border-warning/40 bg-warning-soft px-3 py-1 text-sm text-warning-on">
            <AlertTriangle size={14} className="mr-1" aria-hidden="true" />
            Selecciona un proceso destino para la conexión
          </div>
        )}

        <div
          className="relative h-full min-h-[500px] w-full"
          ref={mapRef}
          onClick={() => {
            if (creatingConnection) {
              setCreatingConnection(false);
              setConnectionStart(null);
            } else {
              setSelectedProcess(null);
              setSelectedConnection(null);
            }
          }}
        >
          <svg className="pointer-events-none absolute left-0 top-0 h-full w-full">{renderConnections()}</svg>
          {renderEndpoints()}
          {vsm.processes.map((process) => renderProcessNode(process))}
        </div>
      </div>

      {effectiveEditMode && <div className="w-64 shrink-0 overflow-y-auto">{renderPropertiesPanel()}</div>}
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Barra de guardado */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle bg-surface px-4 py-3 sm:-mx-6 sm:px-6">
        <SaveStatus
          isDirty={t.isDirty}
          isSaving={t.isSaving}
          justSaved={t.justSaved}
          lastSavedAt={t.lastSavedAt}
          error={t.error}
          onRetry={() => t.save()}
        />

        <div className="flex flex-wrap items-center gap-2">
          {t.hasExamples && !exampleMode && (
            <GradientButton variant="outline" size="sm" onClick={handleViewExampleClick}>
              Ver un ejemplo
            </GradientButton>
          )}

          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            aria-label="Ayuda del mapa de flujo de valor"
            className="rounded-lg border border-line bg-surface p-2 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken"
          >
            <HelpCircle size={16} aria-hidden="true" />
          </button>

          {hasProcesses && (
            <GradientButton variant="outline" size="sm" leadingIcon={<Download size={14} />} onClick={exportAsImage}>
              Exportar PNG
            </GradientButton>
          )}

          {!exampleMode && t.isDirty && (
            <GradientButton variant="ghost" size="sm" onClick={handleCancelClick}>
              Cancelar
            </GradientButton>
          )}

          {!exampleMode && (
            <GradientButton
              variant="success"
              size="sm"
              disabled={!t.isDirty || t.isSaving}
              loading={t.isSaving}
              leadingIcon={<Save size={14} />}
              onClick={() => t.save()}
            >
              Guardar
            </GradientButton>
          )}
        </div>
      </div>

      {/* Banner de modo ejemplo */}
      {exampleMode && (
        <motion.div
          initial={shouldReduceMotion ? false : fadeInUp.hidden}
          animate={fadeInUp.visible}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-info/40 bg-info-soft px-4 py-3 ring-1 ring-info/20"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-info text-white">Ejemplo</span>
            <span className="text-sm font-medium text-info-on">{t.exampleTitles[0]}</span>
          </div>
          <p className="text-sm text-info-on">Estás viendo un ejemplo. No se ha guardado nada en tu proyecto.</p>
          <div className="flex gap-2">
            <GradientButton size="sm" onClick={handleAdoptExample}>
              Usar como punto de partida
            </GradientButton>
            <GradientButton size="sm" variant="outline" onClick={handleUndoExample}>
              Deshacer
            </GradientButton>
          </div>
        </motion.div>
      )}

      {/* Panel de ayuda */}
      {showHelp && (
        <div className="mb-6 rounded-lg border border-line bg-surface p-4 shadow-sm">
          <h3 className="mb-2 flex items-center text-lg font-bold text-content">
            <HelpCircle size={18} className="mr-2" aria-hidden="true" />
            Ayuda del VSM
          </h3>
          <div className="space-y-2 text-sm text-content-secondary">
            <p><strong className="text-content">Editar diagrama:</strong> activa el modo edición con el botón correspondiente.</p>
            <p><strong className="text-content">Añadir Proceso:</strong> botón «+» en el panel de propiedades.</p>
            <p><strong className="text-content">Conectar Procesos:</strong> haz clic en el botón de flecha y luego en el proceso destino.</p>
            <p><strong className="text-content">Editar Elementos:</strong> haz clic en cualquier elemento para modificar sus propiedades.</p>
            <p><strong className="text-content">Mover Procesos:</strong> arrastra los procesos en modo edición.</p>
            <p><strong className="text-content">Guardar Cambios:</strong> usa el botón Guardar de la barra superior.</p>
          </div>
          <GradientButton variant="ghost" size="sm" className="mt-3" onClick={() => setShowHelp(false)}>
            Cerrar
          </GradientButton>
        </div>
      )}

      {/* Resumen ejecutivo: estado actual / estado futuro */}
      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="flex items-center text-sm font-semibold text-content">
            <Clipboard size={16} className="mr-2" aria-hidden="true" />
            Estado actual — resumen
          </h3>
          <div className="mt-3 space-y-3">
            <TextField
              label="Lead time total"
              placeholder="p. ej. 45 días"
              value={vsm.currentState.totalLeadTime}
              onChange={(v) => t.patch({ currentState: { ...vsm.currentState, totalLeadTime: v } })}
            />
            <TextField
              label="Tiempo de valor añadido"
              placeholder="p. ej. 12 horas"
              value={vsm.currentState.valueAddedTime}
              onChange={(v) => t.patch({ currentState: { ...vsm.currentState, valueAddedTime: v } })}
            />
            <EditableList
              label="Principales desperdicios"
              addLabel="Agregar desperdicio"
              placeholder="Describe el desperdicio identificado"
              items={vsm.currentState.mainWastes}
              onChange={(next) => t.patch({ currentState: { ...vsm.currentState, mainWastes: next } })}
            />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-4">
          <h3 className="flex items-center text-sm font-semibold text-content">
            <TrendingUp size={16} className="mr-2" aria-hidden="true" />
            Estado futuro — resumen
          </h3>
          <div className="mt-3 space-y-3">
            <TextField
              label="Lead time objetivo"
              placeholder="p. ej. 30 días"
              value={vsm.futureState.targetLeadTime}
              onChange={(v) => t.patch({ futureState: { ...vsm.futureState, targetLeadTime: v } })}
            />
            <EditableList
              label="Mejoras propuestas"
              addLabel="Agregar mejora"
              placeholder="Describe la mejora propuesta"
              items={vsm.futureState.improvements}
              onChange={(next) => t.patch({ futureState: { ...vsm.futureState, improvements: next } })}
            />
          </div>
        </div>
      </section>

      {/* Métricas calculadas del diagrama */}
      {hasProcesses && (
        <section className="mb-6 rounded-lg border border-line bg-surface-sunken p-3">
          <h3 className="mb-2 flex items-center text-sm font-semibold text-content">
            <Zap size={16} className="mr-2" aria-hidden="true" />
            Métricas calculadas del diagrama
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-md border border-line bg-surface p-2 shadow-xs">
              <div className="text-sm text-content-secondary">Lead Time Total</div>
              <div className="flex items-center text-lg font-bold tabular-nums text-content">
                <Clock size={16} className="mr-1 text-info-on" aria-hidden="true" />
                {formatNumber(metrics.leadTime, { maximumFractionDigits: 1 })} min
              </div>
            </div>
            <div className="rounded-md border border-line bg-surface p-2 shadow-xs">
              <div className="text-sm text-content-secondary">Tiempo de Proceso</div>
              <div className="flex items-center text-lg font-bold tabular-nums text-content">
                <Zap size={16} className="mr-1 text-success-on" aria-hidden="true" />
                {formatNumber(metrics.processTime, { maximumFractionDigits: 1 })} min
              </div>
            </div>
            <div className="rounded-md border border-line bg-surface p-2 shadow-xs">
              <div className="text-sm text-content-secondary">Tiempo de Espera</div>
              <div className="flex items-center text-lg font-bold tabular-nums text-content">
                <Clock size={16} className="mr-1 text-danger-on" aria-hidden="true" />
                {formatNumber(metrics.waitingTime, { maximumFractionDigits: 1 })} min
              </div>
            </div>
            <div className="rounded-md border border-line bg-surface p-2 shadow-xs">
              <div className="text-sm text-content-secondary">Ratio Valor Añadido</div>
              <div className="flex items-center text-lg font-bold tabular-nums text-content">
                {metrics.valueAddedRatio > 30 ? (
                  <TrendingUp size={16} className="mr-1 text-success-on" aria-hidden="true" />
                ) : (
                  <TrendingDown size={16} className="mr-1 text-danger-on" aria-hidden="true" />
                )}
                {formatPercent(metrics.valueAddedRatio, 1)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Diagrama interactivo */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-content-secondary">
          <GitBranch size={16} aria-hidden="true" />
          <span>Diagrama — estado {vsm.viewMode === 'current' ? 'actual' : 'futuro'}</span>
          <button
            type="button"
            onClick={toggleViewMode}
            aria-label="Cambiar entre estado actual y estado futuro"
            className="rounded-md p-1 text-content-secondary transition-colors duration-fast hover:bg-surface-sunken hover:text-content"
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasProcesses && (
            <div className="inline-flex rounded-md border border-line p-0.5">
              <button
                type="button"
                aria-pressed={displayFormat === 'diagram'}
                aria-label="Vista de diagrama"
                onClick={() => setDisplayFormat('diagram')}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors duration-fast ${
                  displayFormat === 'diagram' ? 'bg-brand text-brand-contrast' : 'text-content-secondary hover:bg-surface-sunken'
                }`}
              >
                <LayoutGrid size={14} className="inline" aria-hidden="true" /> Diagrama
              </button>
              <button
                type="button"
                aria-pressed={displayFormat === 'table'}
                aria-label="Vista de tabla"
                onClick={() => setDisplayFormat('table')}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors duration-fast ${
                  displayFormat === 'table' ? 'bg-brand text-brand-contrast' : 'text-content-secondary hover:bg-surface-sunken'
                }`}
              >
                <TableIcon size={14} className="inline" aria-hidden="true" /> Tabla
              </button>
            </div>
          )}

          {!exampleMode && (
            <GradientButton
              variant={editMode ? 'success' : 'outline'}
              size="sm"
              leadingIcon={editMode ? <Eye size={14} /> : <Edit size={14} />}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? 'Vista previa' : 'Editar diagrama'}
            </GradientButton>
          )}
        </div>
      </div>

      {!hasProcesses ? (
        <EmptyState
          title="Ver el flujo es ver el desperdicio"
          description="Dibuja las etapas del proceso con sus tiempos de ciclo y espera para conocer tu lead time real."
          action={!exampleMode ? <GradientButton onClick={addProcess}>Agregar primera etapa</GradientButton> : undefined}
          secondaryAction={
            !exampleMode && t.hasExamples ? (
              <GradientButton variant="outline" onClick={handleViewExampleClick}>
                Ver un ejemplo
              </GradientButton>
            ) : undefined
          }
        />
      ) : displayFormat === 'table' ? (
        renderTableView()
      ) : (
        renderDiagramView()
      )}

      {/* Confirmaciones */}
      <Modal
        open={confirmLoadExample}
        onClose={() => setConfirmLoadExample(false)}
        title="¿Cargar el ejemplo?"
        description="Cargar el ejemplo reemplazará lo que hay en pantalla. Tus datos guardados no se tocan hasta que pulses Guardar."
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmLoadExample(false)}>
              Cancelar
            </GradientButton>
            <GradientButton
              onClick={() => {
                setConfirmLoadExample(false);
                activateExample();
              }}
            >
              Ver el ejemplo
            </GradientButton>
          </>
        }
      />

      <Modal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="¿Descartar los cambios sin guardar?"
        footer={
          <>
            <GradientButton variant="outline" onClick={() => setConfirmDiscard(false)}>
              Seguir editando
            </GradientButton>
            <GradientButton
              variant="danger"
              onClick={() => {
                t.discard();
                setConfirmDiscard(false);
              }}
            >
              Descartar
            </GradientButton>
          </>
        }
      />
    </div>
  );
};

export default ValueStreamMap;
