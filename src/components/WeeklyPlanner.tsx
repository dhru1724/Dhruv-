import React, { useState } from 'react';
import { Task, Project } from '../types';
import { Plus, CheckSquare, Trash2, CalendarRange, RotateCw, Sparkles, MoveRight, HelpCircle } from 'lucide-react';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface WeeklyPlannerProps {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  projects: Project[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const DAYS_OF_WEEK: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function WeeklyPlanner({
  tasks,
  setTasks,
  projects,
  selectedDate,
  setSelectedDate
}: WeeklyPlannerProps) {
  const [activeDayInput, setActiveDayInput] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Relocator popup state
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  // Drag and Drop State
  const [draggedWeeklyTaskId, setDraggedWeeklyTaskId] = useState<string | null>(null);
  const [activeDropDay, setActiveDropDay] = useState<string | null>(null);

  const handleCreateTaskForDay = (day: typeof DAYS_OF_WEEK[number]) => {
    if (!newTitle.trim()) return;

    // Calculate the absolute date string for this weekday within the same week as selectedDate
    const anchorDate = new Date(selectedDate + 'T12:00:00');
    const targetDayIndex = DAYS_OF_WEEK.indexOf(day);
    let currentDayIndex = anchorDate.getDay(); 
    if (currentDayIndex === 0) currentDayIndex = 7;
    const dayDiff = (targetDayIndex + 1) - currentDayIndex;
    anchorDate.setDate(anchorDate.getDate() + dayDiff);
    const resolvedDueDate = getLocalDateString(anchorDate);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: newProject || null,
      title: newTitle.trim(),
      status: 'To Do',
      priority: newPriority,
      dueDate: resolvedDueDate,
      dayOfWeek: day
    };

    setTasks([...tasks, newTask]);
    setNewTitle('');
    setNewProject('');
    setNewPriority('Medium');
    setActiveDayInput(null);
  };

  const handleToggleTaskStatus = (id: string, currentStatus: Task['status']) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: currentStatus === 'Completed' ? 'To Do' : 'Completed' } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleMoveTaskDay = (taskId: string, targetDay: typeof DAYS_OF_WEEK[number]) => {
    const anchorDate = new Date(selectedDate + 'T12:00:00');
    const targetDayIndex = DAYS_OF_WEEK.indexOf(targetDay);
    let currentDayIndex = anchorDate.getDay(); 
    if (currentDayIndex === 0) currentDayIndex = 7;
    const dayDiff = (targetDayIndex + 1) - currentDayIndex;
    anchorDate.setDate(anchorDate.getDate() + dayDiff);
    const resolvedDueDate = getLocalDateString(anchorDate);

    setTasks(tasks.map(t => t.id === taskId ? { ...t, dayOfWeek: targetDay, dueDate: resolvedDueDate } : t));
    setMovingTaskId(null);
  };

  const handleWeeklyTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedWeeklyTaskId(taskId);
  };

  const handleWeeklyTaskDragEnd = () => {
    setDraggedWeeklyTaskId(null);
    setActiveDropDay(null);
  };

  const handleWeeklyTaskDrop = (targetDay: typeof DAYS_OF_WEEK[number]) => {
    if (!draggedWeeklyTaskId) return;
    handleMoveTaskDay(draggedWeeklyTaskId, targetDay);
    setDraggedWeeklyTaskId(null);
    setActiveDropDay(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center space-x-1.5 font-display tracking-tight uppercase">
            <CalendarRange className="h-4 w-4 text-indigo-500" />
            <span>WEEKLY PLANNERS GRID</span>
          </h3>
          <p className="text-xs text-gray-550 dark:text-neutral-400 mt-0.5">Map standalone execution targets into daily chunks across the week.</p>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400">
          <span>Complete items with satisfying check toggles or drag to reschedule days</span>
        </div>
      </div>

      {/* Dynamic Date Association Legend */}
      <div className="p-3 bg-blue-50/20 dark:bg-neutral-850/30 rounded-xl border border-blue-105/50 dark:border-neutral-800 text-[11px] text-blue-600 dark:text-blue-400 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 font-medium">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-500" />
          <span>Interactive Week View is linked to <strong className="font-bold underline font-mono text-indigo-600 dark:text-indigo-400">{selectedDate}</strong>. Drag-and-drop tasks directly to reschedule!</span>
        </div>
        <span className="text-[10px] font-mono select-none px-1.5 py-0.5 rounded bg-blue-100/10 font-bold">Synchronized</span>
      </div>

      {/* Week Lanes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 select-none">
        {DAYS_OF_WEEK.map((day) => {
          const dayTasks = tasks.filter(t => t.dayOfWeek === day);
          const isInputActive = activeDayInput === day;
          const completedCount = dayTasks.filter(t => t.status === 'Completed').length;

          // Day color accent card
          const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;
          
          // Calculate if this weekday card matches the active selectedDate Day of Week
          const anchorDateStr = selectedDate;
          const anchorDate = new Date(anchorDateStr + 'T12:00:00');
          const selectedDayName = anchorDate.toLocaleDateString('en-US', { weekday: 'long' });
          const isSelectedFocusDay = selectedDayName === day;

          // Resolve absolute date label of this weekday
          const laneDate = new Date(anchorDateStr + 'T12:00:00');
          const targetDayIdx = DAYS_OF_WEEK.indexOf(day);
          let currentDayIdx = anchorDate.getDay();
          if (currentDayIdx === 0) currentDayIdx = 7;
          const diff = (targetDayIdx + 1) - currentDayIdx;
          laneDate.setDate(laneDate.getDate() + diff);
          const laneDateStr = getLocalDateString(laneDate);
          const formattedLaneDate = laneDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          const handleFocusDayIndexString = () => {
             setSelectedDate(laneDateStr);
          };

          const isOverThisDay = activeDropDay === day;

          return (
            <div 
              key={day} 
              onClick={handleFocusDayIndexString}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedWeeklyTaskId) {
                  setActiveDropDay(day);
                }
              }}
              onDragLeave={() => setActiveDropDay(null)}
              onDrop={() => handleWeeklyTaskDrop(day)}
              className={`flex flex-col rounded-2xl border p-3.5 transition-all h-full min-h-[340px] cursor-pointer ${
                isOverThisDay
                  ? 'bg-indigo-50/15 border-indigo-400 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20 scale-[1.01] shadow-lg'
                  : isSelectedFocusDay
                    ? 'bg-blue-50/10 dark:bg-blue-950/5 border-blue-500 dark:border-blue-450 ring-2 ring-blue-500/20 shadow-md'
                    : isToday 
                      ? 'bg-emerald-50/5 dark:bg-emerald-950/5 border-emerald-300 dark:border-emerald-800' 
                      : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-850 hover:border-gray-200 dark:hover:border-neutral-800 hover:shadow-xs'
              }`}
            >
              {/* Day title info */}
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-55 dark:border-neutral-850 mb-3 select-none">
                <span className={`text-[11px] font-bold ${isSelectedFocusDay ? 'text-blue-600 dark:text-blue-400 font-extrabold' : isToday ? 'text-emerald-650 dark:text-emerald-400 font-bold' : 'text-gray-800 dark:text-neutral-300'}`}>
                  {day}
                  <span className="block text-[9px] font-normal text-gray-400 dark:text-neutral-500 leading-none mt-0.5">{formattedLaneDate}</span>
                </span>

                <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 dark:bg-neutral-850 px-1 rounded">
                  {completedCount}/{dayTasks.length}
                </span>
              </div>

              {/* Day Tasks Stack */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-64 pr-0.5">
                {dayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-100 dark:border-neutral-850 rounded-xl px-1">
                    <p className="text-[9px] text-gray-400/80 dark:text-neutral-550 italic leading-none">
                      Rest day.
                    </p>
                    <p className="text-[8px] text-gray-400/50 mt-1 leading-none">Drag items here</p>
                  </div>
                ) : (
                  dayTasks.map((t) => {
                    const lProj = projects.find(p => p.id === t.projectId);
                    const isCompleted = t.status === 'Completed';

                    return (
                      <div 
                        key={t.id}
                        draggable="true"
                        onDragStart={(e) => handleWeeklyTaskDragStart(e, t.id)}
                        onDragEnd={handleWeeklyTaskDragEnd}
                        className={`p-2.5 rounded-xl border relative group/wtask flex flex-col justify-between transition-all cursor-grab active:cursor-grabbing ${
                          isCompleted 
                            ? 'bg-gray-50/60 dark:bg-neutral-850/40 border-gray-150 dark:border-neutral-850 opacity-80' 
                            : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-gray-250 dark:hover:border-neutral-700 shadow-3xs'
                        } ${draggedWeeklyTaskId === t.id ? 'opacity-30 border-dashed border-gray-400 scale-95 shadow-none' : ''}`}
                      >
                        <div className="flex items-center space-x-2 pb-1 pr-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTaskStatus(t.id, t.status);
                            }}
                            className={`h-4 w-4 rounded flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                              isCompleted 
                                ? 'bg-emerald-500 border-none text-white' 
                                : 'border border-gray-300 dark:border-neutral-600'
                            }`}
                          >
                            {isCompleted && (
                              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          
                          <span className={`text-[11px] leading-snug break-words ${
                            isCompleted ? 'line-through text-gray-400 dark:text-neutral-550' : 'text-gray-750 dark:text-neutral-200 font-semibold'
                          }`}>
                            {t.title}
                          </span>
                        </div>

                        {/* project icon and date details footer */}
                        {lProj && (
                          <div className="text-[8px] font-medium text-gray-400 dark:text-neutral-500 mt-1 pl-6 flex items-center space-x-1 select-none">
                            <span>{lProj.emoji}</span>
                            <span className="truncate max-w-[80px]">{lProj.name}</span>
                          </div>
                        )}

                        {/* Hover task actions */}
                        <div className="absolute top-1.5 right-1 opacity-0 group-hover/wtask:opacity-100 transition-all flex items-center space-x-1">
                          {/* Move Day Trigger */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMovingTaskId(movingTaskId === t.id ? null : t.id);
                            }}
                            className="p-0.5 rounded text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
                            title="Reschedule day"
                          >
                            <MoveRight className="h-2.5 w-2.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(t.id);
                            }}
                            className="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>

                        {/* Relocator Day drop down selection */}
                        {movingTaskId === t.id && (
                          <div 
                            className="absolute z-30 bottom-8 right-0 bg-white dark:bg-neutral-850 p-1.5 rounded-lg border border-gray-150 dark:border-neutral-800 shadow-xl w-32 flex flex-col space-y-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[8px] text-gray-400 uppercase font-mono pl-1 pb-1">Move day:</p>
                            {DAYS_OF_WEEK.filter(dy => dy !== day).map(dy => (
                              <button
                                key={dy}
                                onClick={() => handleMoveTaskDay(t.id, dy)}
                                className="px-2 py-1 text-[9px] hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-left dark:text-neutral-300 font-semibold cursor-pointer"
                              >
                                {dy}
                              </button>
                            ))}
                            <button
                              onClick={() => setMovingTaskId(null)}
                              className="text-[8px] text-center text-red-550 border-t border-gray-105 mt-1 pt-1 font-semibold hover:bg-red-100/20"
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inline task creator form inside specific Day card */}
              {isInputActive ? (
                <div 
                  className="mt-3 bg-gray-50 dark:bg-neutral-850 p-2.5 rounded-xl border border-gray-150 dark:border-neutral-800 space-y-2 animate-in fade-in duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title..."
                    className="w-full px-2 py-1 text-[10px] rounded border border-gray-205 dark:border-neutral-750 bg-white dark:bg-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      className="w-full px-1 py-0.5 text-[9px] rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 dark:text-white cursor-pointer"
                    >
                      <option value="">📁 Standalone</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.emoji} {p.name.substring(0, 10)}..</option>
                      ))}
                    </select>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                      className="w-full px-1 py-0.5 text-[9px] rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 dark:text-white cursor-pointer"
                    >
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">⚪ Low</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-1 pt-1.5 border-t border-gray-100/30 bg-transparent">
                    <button
                      type="button"
                      onClick={() => setActiveDayInput(null)}
                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-neutral-800 text-[9px] text-gray-550 dark:text-neutral-300 rounded font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreateTaskForDay(day)}
                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-750 text-white rounded text-[9px] font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDayInput(day);
                    setNewTitle('');
                  }}
                  className="mt-3.5 py-1.5 w-full text-center rounded-lg bg-gray-50/30 text-gray-450 hover:text-gray-700 dark:text-neutral-500 dark:hover:text-neutral-350 hover:bg-gray-100 dark:hover:bg-neutral-850/40 text-[10px] font-bold transition-all border border-dashed border-gray-150 dark:border-neutral-800/80 cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Schedule item</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
