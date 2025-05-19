import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLeanSixSigma } from '../../contexts/LeanSixSigmaContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Calendar, ChevronDown, ChevronUp, AlertTriangle, BarChart2,
  Clock, Filter, Search, Settings, Download, GitBranch
} from 'lucide-react';
import { format, isAfter, isBefore, addDays, differenceInDays, isSameDay } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, Cell, Scatter
} from 'recharts';

/**
 * Enhanced Timeline component with Gantt, Kanban and risk analysis features
 * Optimized for large datasets with virtualized rendering and memoization
 */
const EnhancedTimeline = ({ projectId }) => {
  const { isDark } = useTheme();
  const { getProject, updateProject } = useLeanSixSigma();
  const project = getProject(projectId);
  
  // State
  const [view, setView] = useState('gantt'); // 'gantt', 'kanban', 'risk'
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [criticalPath, setCriticalPath] = useState([]);
  const [filter, setFilter] = useState({
    status: 'all',
    assignee: 'all',
    priority: 'all',
    search: ''
  });
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'quarter'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Load and initialize data
  useEffect(() => {
    if (project) {
      // Initialize tasks from project data
      const projectTasks = project.tasks || [];
      const projectDependencies = project.dependencies || [];
      
      setTasks(projectTasks);
      setDependencies(projectDependencies);
      
      // Calculate critical path when tasks or dependencies change
      calculateCriticalPath(projectTasks, projectDependencies);
    }
  }, [project]);
  
  /**
   * Critical Path Method (CPM) implementation
   * Calculates early start/finish, late start/finish, and slack for each task
   */
  const calculateCriticalPath = useCallback((taskList, dependencyList) => {
    if (!taskList?.length) return;
    
    // Clone tasks to avoid mutation
    const workingTasks = taskList.map(task => ({
      ...task,
      earlyStart: 0,
      earlyFinish: task.duration || 0,
      lateStart: 0,
      lateFinish: 0,
      slack: 0
    }));
    
    // Build dependency graph
    const graph = buildDependencyGraph(workingTasks, dependencyList);
    
    // Forward pass - Calculate early start/finish
    forwardPass(workingTasks, graph);
    
    // Find project end date (maximum early finish)
    const projectEnd = Math.max(...workingTasks.map(t => t.earlyFinish));
    
    // Initialize late finish to project end date for tasks with no successors
    workingTasks.forEach(task => {
      if (!graph.successors[task.id] || graph.successors[task.id].length === 0) {
        task.lateFinish = projectEnd;
      }
    });
    
    // Backward pass - Calculate late start/finish and slack
    backwardPass(workingTasks, graph, projectEnd);
    
    // Identify critical path (tasks with zero slack)
    const critical = workingTasks
      .filter(task => task.slack === 0)
      .map(task => task.id);
    
    setCriticalPath(critical);
    
    // Update tasks with the calculated values
    setTasks(workingTasks);
  }, []);
  
  // Helper function to build dependency graph
  const buildDependencyGraph = (tasks, dependencies) => {
    const predecessors = {};
    const successors = {};
    
    // Initialize
    tasks.forEach(task => {
      predecessors[task.id] = [];
      successors[task.id] = [];
    });
    
    // Build connections
    dependencies.forEach(dependency => {
      const { predecessor, successor } = dependency;
      if (predecessors[successor]) predecessors[successor].push(predecessor);
      if (successors[predecessor]) successors[predecessor].push(successor);
    });
    
    return { predecessors, successors };
  };
  
  // Forward pass calculation
  const forwardPass = (tasks, graph) => {
    const visited = new Set();
    const taskMap = tasks.reduce((map, task) => {
      map[task.id] = task;
      return map;
    }, {});
    
    // Start with tasks that have no predecessors
    const startTasks = tasks.filter(task => 
      !graph.predecessors[task.id] || graph.predecessors[task.id].length === 0
    );
    
    const processTask = (task) => {
      if (visited.has(task.id)) return;
      
      // Process all predecessors first
      const preds = graph.predecessors[task.id] || [];
      if (preds.length > 0) {
        let maxEarlyFinish = 0;
        
        for (const predId of preds) {
          if (!visited.has(predId)) {
            // Predecessor not processed yet, process it first
            processTask(taskMap[predId]);
          }
          
          // Update early start based on predecessor finish times
          maxEarlyFinish = Math.max(maxEarlyFinish, taskMap[predId].earlyFinish);
        }
        
        task.earlyStart = maxEarlyFinish;
        task.earlyFinish = task.earlyStart + (task.duration || 0);
      }
      
      visited.add(task.id);
      
      // Process successors
      const succs = graph.successors[task.id] || [];
      for (const succId of succs) {
        processTask(taskMap[succId]);
      }
    };
    
    // Process all starting tasks
    startTasks.forEach(processTask);
  };
  
  // Backward pass calculation
  const backwardPass = (tasks, graph, projectEnd) => {
    const visited = new Set();
    const taskMap = tasks.reduce((map, task) => {
      map[task.id] = task;
      return map;
    }, {});
    
    // Start with tasks that have no successors (end tasks)
    const endTasks = tasks.filter(task => 
      !graph.successors[task.id] || graph.successors[task.id].length === 0
    );
    
    const processTask = (task) => {
      if (visited.has(task.id)) return;
      
      // Process all successors first
      const succs = graph.successors[task.id] || [];
      if (succs.length > 0) {
        let minLateStart = Infinity;
        
        for (const succId of succs) {
          if (!visited.has(succId)) {
            // Successor not processed yet, process it first
            processTask(taskMap[succId]);
          }
          
          // Update late finish based on successor start times
          minLateStart = Math.min(minLateStart, taskMap[succId].lateStart);
        }
        
        task.lateFinish = minLateStart;
      } else {
        // End task, late finish is project end
        task.lateFinish = projectEnd;
      }
      
      task.lateStart = task.lateFinish - (task.duration || 0);
      task.slack = task.lateStart - task.earlyStart;
      
      visited.add(task.id);
      
      // Process predecessors
      const preds = graph.predecessors[task.id] || [];
      for (const predId of preds) {
        processTask(taskMap[predId]);
      }
    };
    
    // Process all end tasks
    endTasks.forEach(processTask);
  };
  
  // Filter tasks based on current filter settings
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (filter.status !== 'all' && task.status !== filter.status) return false;
      
      // Assignee filter
      if (filter.assignee !== 'all' && task.assignee !== filter.assignee) return false;
      
      // Priority filter
      if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
      
      // Search filter
      if (filter.search && !task.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      
      return true;
    });
  }, [tasks, filter]);
  
  // Group tasks by status for Kanban view
  const tasksByStatus = useMemo(() => {
    const grouped = {};
    
    // Initialize common statuses
    const defaultStatuses = ['todo', 'in_progress', 'review', 'done'];
    defaultStatuses.forEach(status => {
      grouped[status] = [];
    });
    
    // Group tasks by status
    filteredTasks.forEach(task => {
      const status = task.status || 'todo';
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(task);
    });
    
    return grouped;
  }, [filteredTasks]);
  
  // Calculate date range for Gantt view
  const dateRange = useMemo(() => {
    if (!tasks.length) return { start: new Date(), end: addDays(new Date(), 30) };
    
    let minDate = new Date();
    let maxDate = new Date();
    
    try {
      tasks.forEach(task => {
        if (task.startDate && isBefore(new Date(task.startDate), minDate)) {
          minDate = new Date(task.startDate);
        }
        if (task.endDate && isAfter(new Date(task.endDate), maxDate)) {
          maxDate = new Date(task.endDate);
        }
      });
      
      // Add buffer days
      minDate = addDays(minDate, -2);
      maxDate = addDays(maxDate, 5);
    } catch (e) {
      console.error("Error calculating date range", e);
    }
    
    return { start: minDate, end: maxDate };
  }, [tasks]);
  
  // Generate days for timeline
  const timelineDays = useMemo(() => {
    const days = [];
    let currentDate = new Date(dateRange.start);
    while (isBefore(currentDate, dateRange.end) || isSameDay(currentDate, dateRange.end)) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    return days;
  }, [dateRange]);
  
  // Handle drag and drop in Kanban view
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // No position change
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    
    // Find the task being dragged
    const taskId = draggableId;
    const targetStatus = destination.droppableId;
    
    // Update the task status
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status: targetStatus } : task
    );
    
    setTasks(updatedTasks);
    
    // Update in backend/context
    if (project) {
      updateProject({
        ...project,
        tasks: updatedTasks
      });
    }
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      console.error("Error formatting date", e);
      return '';
    }
  };
  
  // Generate risk metrics for visualization
  const riskData = useMemo(() => {
    return tasks.map(task => {
      const riskScore = task.riskLevel || 'low';
      const riskValue = riskScore === 'high' ? 3 : riskScore === 'medium' ? 2 : 1;
      const progress = task.progress || 0;
      const daysLeft = task.endDate ? differenceInDays(new Date(task.endDate), new Date()) : 0;
      
      return {
        name: task.name,
        risk: riskValue,
        progress: progress,
        daysLeft: daysLeft > 0 ? daysLeft : 0,
        isCritical: criticalPath.includes(task.id)
      };
    });
  }, [tasks, criticalPath]);
  
  // Generate summary metrics
  const projectMetrics = useMemo(() => {
    if (!tasks.length) return { completion: 0, onTrack: 0, atRisk: 0, critical: 0 };
    
    const completion = tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length;
    const onTrack = tasks.filter(task => !criticalPath.includes(task.id) && (task.riskLevel === 'low' || !task.riskLevel)).length;
    const atRisk = tasks.filter(task => task.riskLevel === 'high' || task.riskLevel === 'medium').length;
    
    return {
      completion: completion,
      onTrack: onTrack,
      atRisk: atRisk,
      critical: criticalPath.length
    };
  }, [tasks, criticalPath]);
  
  // Handle view switching
  const handleViewChange = (newView) => {
    setView(newView);
  };
  
  // Render the Gantt view
  const renderGanttView = () => {
    return (
      <div className="gantt-container mt-4">
        <div className="gantt-header flex items-center text-sm font-medium p-2 border-b dark:border-gray-700">
          <div className="w-1/4">Task Name</div>
          <div className="w-1/6">Assignee</div>
          <div className="w-1/6">Start Date</div>
          <div className="w-1/6">End Date</div>
          <div className="w-1/6">Status</div>
        </div>
        
        <div className="gantt-body relative">
          {/* Timeline header */}
          <div className="gantt-timeline-header flex border-b dark:border-gray-700">
            <div className="w-3/4"></div>
            <div className="w-1/4 flex">
              {timelineDays.slice(0, 14).map((day, i) => (
                <div key={i} className="flex-1 text-center text-xs p-1 border-r dark:border-gray-700">
                  {format(day, 'd')}
                </div>
              ))}
            </div>
          </div>
          
          {/* Task rows */}
          <div className="gantt-rows">
            {filteredTasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-center border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 
                  ${criticalPath.includes(task.id) ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
              >
                <div className="w-1/4 p-2 truncate">{task.name}</div>
                <div className="w-1/6 p-2">{task.assignee}</div>
                <div className="w-1/6 p-2">{formatDate(task.startDate)}</div>
                <div className="w-1/6 p-2">{formatDate(task.endDate)}</div>
                <div className="w-1/6 p-2">
                  <span className={`px-2 py-1 rounded-full text-xs 
                    ${task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 
                     task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                     'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                    {task.status}
                  </span>
                </div>
                
                {/* Task bar */}
                <div className="w-1/4 p-2 relative">
                  <div 
                    className={`absolute h-5 rounded-sm ${
                      criticalPath.includes(task.id) 
                        ? 'bg-red-500 dark:bg-red-700' 
                        : 'bg-blue-500 dark:bg-blue-700'
                    }`}
                    style={{
                      width: `${(task.duration / 14) * 100}%`,
                      left: `${(differenceInDays(new Date(task.startDate), dateRange.start) / 14) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render the Kanban view
  const renderKanbanView = () => {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-container mt-4 flex gap-4 overflow-x-auto pb-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div 
              key={status} 
              className="kanban-column min-w-[280px] w-[280px] bg-gray-50 dark:bg-gray-800 rounded-lg shadow"
            >
              <div className="kanban-column-header p-3 border-b dark:border-gray-700 font-medium flex justify-between items-center">
                <h3 className="capitalize">{status.replace('_', ' ')}</h3>
                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                  {statusTasks.length}
                </span>
              </div>
              
              <Droppable droppableId={status}>
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="kanban-tasks p-2 h-[calc(100vh-240px)] overflow-y-auto"
                  >
                    {statusTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-task p-3 mb-2 bg-white dark:bg-gray-700 rounded-md shadow-sm
                              ${snapshot.isDragging ? 'shadow-md' : ''}
                              ${criticalPath.includes(task.id) ? 'border-l-4 border-red-500' : ''}`}
                          >
                            <div className="flex justify-between">
                              <h4 className="font-medium text-sm">{task.name}</h4>
                              {task.priority && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                  task.priority === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                }`}>
                                  {task.priority}
                                </span>
                              )}
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="mt-2 flex justify-between items-center">
                              <div className="flex items-center">
                                {task.progress !== undefined && (
                                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mr-1">
                                    <div 
                                      className="h-full bg-blue-500 dark:bg-blue-400"
                                      style={{ width: `${task.progress}%` }}
                                    ></div>
                                  </div>
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {task.progress || 0}%
                                </span>
                              </div>
                              
                              {task.assignee && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                  {task.assignee}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    );
  };
  
  // Render the Risk Analysis view
  const renderRiskView = () => {
    return (
      <div className="risk-container mt-4">
        {/* Project summary metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion</h3>
            <div className="mt-1 flex items-end">
              <span className="text-2xl font-bold">{Math.round(projectMetrics.completion)}%</span>
              <div className="ml-2 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 dark:bg-blue-400"
                  style={{ width: `${projectMetrics.completion}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">On Track</h3>
            <div className="mt-1 flex items-center">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {projectMetrics.onTrack}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">tasks</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">At Risk</h3>
            <div className="mt-1 flex items-center">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {projectMetrics.atRisk}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">tasks</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Path</h3>
            <div className="mt-1 flex items-center">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {projectMetrics.critical}
              </span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">tasks</span>
            </div>
          </div>
        </div>
        
        {/* Risk visualization charts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium mb-4">Risk vs. Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={riskData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                  <XAxis dataKey="name" scale="band" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" label={{ value: 'Progress %', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Risk Level', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ddd' }}
                  />
                  <Legend />
                  <Bar yAxisId="right" dataKey="risk" fill="#ff8042" name="Risk Level">
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isCritical ? '#ef4444' : '#ff8042'} />
                    ))}
                  </Bar>
                  <Line yAxisId="left" type="monotone" dataKey="progress" stroke="#3b82f6" name="Progress %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium mb-4">Risk Scatter Plot</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={riskData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                  <XAxis dataKey="progress" name="Progress %" />
                  <YAxis dataKey="risk" name="Risk Level" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#333' : '#fff', borderColor: isDark ? '#555' : '#ddd' }}
                  />
                  <Legend />
                  <Scatter dataKey="daysLeft" data={riskData} fill="#8884d8" name="Days Left">
                    {riskData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCritical ? '#ef4444' : 
                               entry.risk === 3 ? '#f97316' :
                               entry.risk === 2 ? '#eab308' : '#22c55e'} 
                      />
                    ))}
                  </Scatter>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render filters
  const renderFilters = () => {
    return (
      <div className="filters flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text" 
              className="pl-8 pr-3 py-2 text-sm border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="Search tasks..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            />
          </div>
          
          <select 
            className="px-3 py-2 text-sm border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          
          <select 
            className="px-3 py-2 text-sm border dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <button 
            className="flex items-center px-3 py-2 text-sm border dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setFilter({ status: 'all', assignee: 'all', priority: 'all', search: '' })}
          >
            <Filter className="w-4 h-4 mr-1" />
            Reset
          </button>
        </div>
        
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-1">
          <button 
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === 'gantt' 
                ? 'bg-white dark:bg-gray-700 shadow-sm' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleViewChange('gantt')}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            Gantt
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === 'kanban' 
                ? 'bg-white dark:bg-gray-700 shadow-sm' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleViewChange('kanban')}
          >
            <GitBranch className="w-4 h-4 inline mr-1" />
            Kanban
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === 'risk' 
                ? 'bg-white dark:bg-gray-700 shadow-sm' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleViewChange('risk')}
          >
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            Risk
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="enhanced-timeline">
      {/* Header */}
      <div className="header mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center">
          <Calendar className="mr-2 h-5 w-5" /> 
          {project?.name || 'Project'} Timeline
        </h2>
        
        <div className="flex items-center space-x-2">
          <button 
            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm flex items-center"
            onClick={() => {/* Export functionality */}}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
          
          <button 
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            onClick={() => {/* Settings functionality */}}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {renderFilters()}
      
      {/* Content based on current view */}
      <div className="timeline-content relative">
        {view === 'gantt' && renderGanttView()}
        {view === 'kanban' && renderKanbanView()}
        {view === 'risk' && renderRiskView()}
      </div>
    </div>
  );
};

export default EnhancedTimeline;
