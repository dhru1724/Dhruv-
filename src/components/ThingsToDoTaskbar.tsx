import React, { useState, useEffect } from 'react';
import NotebookPencilIcon from './NotebookPencilIcon';
import { Task, Project } from '../types';
import { 
  CheckSquare, Plus, Check, Trash2, Calendar, ChevronLeft, ChevronRight, 
  Sparkles, Layers, Sliders, Minimize2, Maximize2, X, Pin 
} from 'lucide-react';

const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface ThingsToDoTaskbarProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  projects: Project[];
  isInline?: boolean;
  onDockToggle?: () => void;
}

export default function ThingsToDoTaskbar({
  tasks,
  setTasks,
  selectedDate,
  setSelectedDate,
  projects,
  isInline = false,
  onDockToggle
}: ThingsToDoTaskbarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'All'>('All');
  const [associatedProjectId, setAssociatedProjectId] = useState<string>('none');

  // Multi-day tracker: automatic update when a new day occurs
  useEffect(() => {
    const todayStr = getLocalDateString();
    // Optional utility: If app has been open overnight, nudge to update Focus Date to current day
    const interval = setInterval(() => {
      const currentToday = getLocalDateString();
      const lastKnownToday = localStorage.getItem('last_known_today_date');
      if (lastKnownToday && lastKnownToday !== currentToday) {
        // A new day has passed! Advise date adjustment or auto-roll forward
        localStorage.setItem('last_known_today_date', currentToday);
        setSelectedDate(currentToday);
      }
    }, 60000); // Check once per minute

    // Init storage of last known date
    localStorage.setItem('last_known_today_date', todayStr);
    return () => clearInterval(interval);
  }, [setSelectedDate]);

  // Core agenda filter parameters
  const currentDailyTasks = tasks.filter(t => t.dueDate === selectedDate)
    .filter(t => filterPriority === 'All' ? true : t.priority === filterPriority);

  const doneCount = currentDailyTasks.filter(t => t.status === 'Completed').length;
  const totalCount = currentDailyTasks.length;
  const percentComplete = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `taskbar-${Date.now()}`,
      projectId: associatedProjectId === 'none' ? null : associatedProjectId,
      title: newTaskTitle.trim(),
      status: 'To Do',
      priority: 'Medium',
      dueDate: selectedDate
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setAssociatedProjectId('none');
  };

  const handleToggleTask = (id: string, currentStatus: Task['status']) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: currentStatus === 'Completed' ? 'To Do' : 'Completed' } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setSelectedDate(getLocalDateString(d));
  };

  const getFriendlyDayName = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const todayStr = getLocalDateString();
    if (dateStr === todayStr) return `Today (✦)`;
    return `${dayName}, ${formatted}`;
  };

  return (
    <div 
      id={isInline ? "things-to-do-inline-section" : "things-to-do-sticky-taskbar"} 
      className={isInline 
        ? "w-full glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg rounded-2xl transition-all duration-300 backdrop-blur-xl"
        : "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl glass bg-white/80 dark:bg-neutral-905/80 backdrop-blur-xl border border-gray-150/80 dark:border-neutral-850/70 shadow-2xl rounded-2xl transition-all duration-300 transform"
      }
    >
      {/* Top micro bar details */}
      <div className="flex items-center justify-between p-3 border-b border-gray-150 dark:border-neutral-800/80">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <NotebookPencilIcon className="h-4 w-4" />
          </span>
          <div className="text-left">
            <h3 className="text-xs font-bold text-gray-800 dark:text-white leading-tight flex items-center space-x-1">
              <span>{isInline ? "Things To Do Section" : "Things To Do Taskbar"}</span>
              <span className="text-[9px] font-mono text-gray-400 font-normal">({doneCount}/{totalCount})</span>
            </h3>
            <p className="text-[9.5px] text-gray-400 dark:text-neutral-500 font-medium truncate">
              Dynamic Daily Focus • {getFriendlyDayName(selectedDate)}
            </p>
          </div>
        </div>

        {/* Date navigators and expander buttons */}
        <div className="flex items-center space-x-2">
          {/* Shift back */}
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors text-gray-550 dark:text-neutral-400"
            title="Yesterday"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Jump to Today option if focused elsewhere */}
          {selectedDate !== getLocalDateString() && (
            <button
              onClick={() => setSelectedDate(getLocalDateString())}
              className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-105"
            >
              Today
            </button>
          )}

          {/* Shift forward */}
          <button
            onClick={() => handleShiftDate(1)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors text-gray-550 dark:text-neutral-400"
            title="Tomorrow"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          <span className="h-4.5 w-px bg-gray-200 dark:bg-neutral-800" />

          {/* Minimize / Maximize Dock (only if floating) */}
          {!isInline ? (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300"
                title={isExpanded ? "Collapse Taskbar" : "Expand Taskbar"}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>

              {onDockToggle && (
                <>
                  <span className="h-4.5 w-px bg-gray-200 dark:bg-neutral-800" />
                  <button
                    onClick={onDockToggle}
                    className="p-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 rounded transition-colors text-gray-400"
                    title="Hide floating bar (Enable from 'Things To Do' tab section if needed)"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </>
          ) : (
            <span className="text-[9px] font-mono font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
              Pinned Inline
            </span>
          )}
        </div>
      </div>

      {/* Expanded view detail pane */}
      {(isExpanded || isInline) && (
        <div className="p-3.5 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Micro Progress bar indicating resolution completion percentage info */}
          {totalCount > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-gray-450 font-mono">
                <span>AGENDA COMPLETION RATE</span>
                <span>{percentComplete}%</span>
              </div>
              <div className="h-1 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>
          )}

          {/* List items scroll drawer */}
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-0.5">
            {currentDailyTasks.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-gray-400 dark:text-neutral-550 italic">
                No items on your taskbar checklist for this date.
              </div>
            ) : (
              currentDailyTasks.map(t => {
                const isDone = t.status === 'Completed';
                const taskProj = projects.find(p => p.id === t.projectId);

                return (
                  <div 
                    key={t.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left gap-2 group/taskbar-item transition-all ${
                      isDone 
                        ? 'bg-gray-50/50 dark:bg-neutral-850/20 border-gray-150/60 dark:border-neutral-800/50' 
                        : 'bg-white dark:bg-neutral-900 border-gray-150 dark:border-neutral-800 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      {/* Interactive toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleTask(t.id, t.status)}
                        className={`h-4.5 w-4.5 rounded flex items-center justify-center transition-all shrink-0 ${
                          isDone ? 'bg-emerald-500 text-white border-0' : 'border border-gray-300 dark:border-neutral-600'
                        }`}
                      >
                        {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                      </button>

                      {/* Title block */}
                      <div className="truncate text-left leading-tight">
                        <p className={`text-[11px] font-bold truncate ${isDone ? 'line-through text-gray-450 dark:text-neutral-550' : 'text-gray-800 dark:text-neutral-200'}`}>
                          {t.title}
                        </p>
                        {taskProj && (
                          <span className="text-[8.5px] font-bold text-blue-500 flex items-center gap-0.5 mt-0.5">
                            <Layers className="h-2 w-2" />
                            {taskProj.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick remove action button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1 rounded opacity-0 group-hover/taskbar-item:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-500 transition-all cursor-pointer"
                      title="Discard target"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick inline Task Adder slot */}
          <div className="flex flex-col gap-2 pt-2.5 border-t border-gray-100 dark:border-neutral-800/80">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTask();
                }}
                placeholder="Draft quick checklist item on Taskbar..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-gray-250 dark:border-neutral-750 bg-gray-50/70 dark:bg-neutral-850/40 outline-none text-[11px] focus:bg-white dark:focus:bg-neutral-900 focus:ring-1 focus:ring-blue-500 text-gray-800 dark:text-white transition-all placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleCreateTask}
                className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add To Taskbar</span>
              </button>
            </div>

            {/* Bottom mini configurations: Projects assignment */}
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Associate stream:</span>
                <select
                  value={associatedProjectId}
                  onChange={(e) => setAssociatedProjectId(e.target.value)}
                  className="bg-transparent border-0 outline-none hover:text-gray-700 dark:hover:text-white font-semibold cursor-pointer text-[10px] text-blue-500"
                >
                  <option value="none">Standalone Item</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>📂 {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority switcher for quick-tags */}
              <div className="flex space-x-1">
                {(['All', 'High', 'Medium', 'Low'] as const).map(prio => (
                  <button
                    key={prio}
                    onClick={() => setFilterPriority(prio)}
                    type="button"
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                      filterPriority === prio
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-gray-850 dark:text-white ring-1 ring-neutral-400/25'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300'
                    }`}
                  >
                    {prio}
                  </button>
                ))}
              </div>
            </div>

            {isInline && onDockToggle && (
              <div className="mt-2 pt-2.5 border-t border-gray-100 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10.5px] text-gray-400">
                <span>Configure view arrangement:</span>
                <button
                  type="button"
                  onClick={onDockToggle}
                  className="text-[9.5px] font-bold text-blue-500 hover:underline hover:text-blue-650 cursor-pointer bg-blue-50/40 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 px-2 py-0.5 rounded transition-all"
                >
                  ✦ Enable floating bar downwards too
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
