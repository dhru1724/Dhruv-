import React, { useState, useEffect } from 'react';
import { 
  Pillar, Habit, HabitLog, QuickNote, Task, Project 
} from '../types';
import { 
  Clock, Quote, Plus, Delete, Trash2, CheckSquare, 
  Sparkles, Layers, ChevronRight, ChevronLeft, Calendar, Activity, Zap, Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QUOTES } from '../dummyData';

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface ConsolePanelProps {
  pillars: Pillar[];
  setPillars: (pillars: Pillar[]) => void;
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  habitLogs: HabitLog;
  toggleHabitLog: (habitId: string, dateStr: string) => void;
  userEmail: string;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  projects: Project[];
}

export default function ConsolePanel({
  pillars,
  setPillars,
  habits,
  setHabits,
  habitLogs,
  toggleHabitLog,
  userEmail,
  selectedDate,
  setSelectedDate,
  tasks,
  setTasks,
  projects
}: ConsolePanelProps) {
  // Extract clean username from user email
  const displayUsername = userEmail && userEmail.includes('@') 
    ? userEmail.split('@')[0].split('.')[0].replace(/^\w/, (c) => c.toUpperCase()) 
    : "Dhaval";

  const [time, setTime] = useState(new Date());
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [newNoteText, setNewNoteText] = useState('');
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('🌟');
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  // States for Habit Progression revamped Date display & Navigation
  const [habitAnchorOffset, setHabitAnchorOffset] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  const getHabitDatesList = (offset: number) => {
    const dates = [];
    const todayLocal = new Date();
    const todayStr = getLocalDateString(todayLocal);

    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setHours(12, 0, 0, 0); // safe hours
      d.setDate(d.getDate() + offset + i);
      const dateStr = getLocalDateString(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      dates.push({ dateStr, label: `${dayName} ${dayNum}`, isToday, isSelected });
    }
    return dates;
  };

  const handleHabitShift = (val: number) => {
    setSlideDirection(val);
    setHabitAnchorOffset(prev => prev + val);
  };

  // New States and Handlers for Daily Targets
  const [newDailyTaskTitle, setNewDailyTaskTitle] = useState('');

  const handleCreateDailyTask = () => {
    if (!newDailyTaskTitle.trim()) return;
    
    const dayName = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mappedDay = validDays.includes(dayName) ? (dayName as any) : undefined;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: null,
      title: newDailyTaskTitle.trim(),
      status: 'To Do',
      priority: 'Medium',
      dueDate: selectedDate,
      dayOfWeek: mappedDay
    };
    setTasks([...tasks, newTask]);
    setNewDailyTaskTitle('');
  };

  const handleToggleTaskStatus = (id: string, currentStatus: Task['status']) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: currentStatus === 'Completed' ? 'To Do' : 'Completed' } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleShiftDate = (daysCount: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + daysCount);
    setSelectedDate(getLocalDateString(current));
  };

  const getFriendlyDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const formatted = d.toLocaleDateString('en-US', options);
    
    const todayStr = getLocalDateString(new Date());
    
    const yestDate = new Date();
    yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = getLocalDateString(yestDate);
    
    const tomDate = new Date();
    tomDate.setDate(tomDate.getDate() + 1);
    const tomStr = getLocalDateString(tomDate);

    if (dateStr === todayStr) return `${formatted} (Today ✦)`;
    if (dateStr === yestStr) return `${formatted} (Yesterday ↩)`;
    if (dateStr === tomStr) return `${formatted} (Tomorrow 🔮)`;
    
    return formatted;
  };

  // Quote rotation & Live Clock
  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    // Dynamic quote calculation
    const quoteIndex = new Date().getDate() % QUOTES.length;
    setActiveQuoteIndex(quoteIndex);
    return () => clearInterval(clockTimer);
  }, []);

  const rotateQuote = () => {
    setActiveQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  };

  const datesList = getHabitDatesList(habitAnchorOffset);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const newId = `hab-${Date.now()}`;
    const newHabit: Habit = {
      id: newId,
      name: newHabitName.trim(),
      emoji: newHabitEmoji,
      streak: 0
    };
    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setShowAddHabit(false);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  // Set greeting string based on current hours
  const getGreeting = () => {
    const hours = time.getHours();
    if (hours < 12) return 'Good Morning ☀️';
    if (hours < 18) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  // Format digital clock
  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Dynamic Greeting Card */}
      <div className="p-5 rounded-2xl glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg relative overflow-hidden backdrop-blur-xl">
        {/* Neon decorative background light */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-2xl" />

        <div className="flex items-start justify-between relative z-10 gap-3">
          <div className="min-w-0">
            <h3 className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 font-mono uppercase">COSMIC LIFE OS CONTROL</h3>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 dark:text-white mt-1.5 leading-tight tracking-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-fuchsia-300 font-display font-extrabold">{displayUsername}</span>
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1 font-mono">{formattedDate}</p>
          </div>

          {/* Clock & Interactive Activity Progress Ring */}
          <div className="flex flex-col items-end space-y-2 shrink-0">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-neutral-850/80 border border-gray-150 dark:border-neutral-800/80 text-[10.5px] text-gray-700 dark:text-neutral-200 font-mono shadow-xs">
              <Clock className="h-3 w-3 text-blue-500 animate-pulse" />
              <span>{formattedTime}</span>
            </div>

            {/* Circular Progress Ring */}
            {(() => {
              const activeHabList = habits;
              const completedHabCount = activeHabList.filter(h => habitLogs[h.id]?.[selectedDate]).length;
              const subTasks = tasks.filter(t => t.dueDate === selectedDate);
              const completedTasksCount = subTasks.filter(t => t.status === 'Completed').length;
              
              const totalItems = activeHabList.length + subTasks.length;
              const completedItems = completedHabCount + completedTasksCount;
              const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
              
              const radius = 16;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (percent / 100) * circumference;

              return (
                <div className="flex items-center space-x-2 bg-gray-50/50 dark:bg-neutral-850/30 p-1.5 px-2 rounded-xl border border-gray-150/40 dark:border-neutral-800/40">
                  <div className="relative h-9 w-9 flex items-center justify-center">
                    <svg className="absolute transform -rotate-90 w-full h-full">
                      {/* Trailing circle */}
                      <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        className="stroke-gray-200 dark:stroke-neutral-800"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      {/* Colored active stroke */}
                      <circle
                        cx="18"
                        cy="18"
                        r={radius}
                        className="stroke-blue-500 dark:stroke-blue-400 transition-all duration-500"
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <span className="text-[9px] font-mono font-bold text-gray-800 dark:text-neutral-100 relative z-10">{percent}%</span>
                  </div>
                  <div className="text-[9px] text-gray-500 dark:text-neutral-400 font-sans leading-tight">
                    <span className="block font-bold text-blue-600 dark:text-blue-400">TODAY SCORE</span>
                    <span className="font-mono">{completedItems}/{totalItems} done</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Dynamic Interactive Quote */}
        <div className="mt-4 pt-3.5 border-t border-gray-150/80 dark:border-neutral-800/80 group/quote relative">
          <Quote className="h-3.5 w-3.5 text-gray-300 dark:text-neutral-700/80 absolute -top-1 -left-1" />
          <p className="text-xs italic text-gray-650 dark:text-neutral-350 pr-6 leading-relaxed font-sans">
            "{QUOTES[activeQuoteIndex].text}"
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-medium font-sans">— {QUOTES[activeQuoteIndex].author}</span>
            <button
              onClick={rotateQuote}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer dark:text-blue-400 flex items-center space-x-1"
            >
              <span>Next Core Concept</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 1.5 Process Radar & Daily Targets */}
      <div className="p-5 rounded-2xl glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg space-y-4 backdrop-blur-xl">
        {/* Card Header & Day Navigation */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider font-display">CHRONOS FOCUS RADAR</h3>
            </div>
            
            {/* Snap to Today pill indicator */}
            {selectedDate !== getLocalDateString() && (
              <button
                type="button"
                onClick={() => setSelectedDate(getLocalDateString())}
                className="px-2.5 py-1 rounded-full text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-mono font-bold hover:bg-indigo-150/30 transition-all cursor-pointer shadow-sm border border-indigo-200/20"
              >
                ✦ Snap Today
              </button>
            )}
          </div>

          {/* Date Selector Row */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-850 p-2 rounded-xl border border-gray-100 dark:border-neutral-800">
            {/* Shift backward */}
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-1 px-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-650 dark:text-neutral-300 rounded-lg transition-all cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Selected Date indicator */}
            <div className="flex items-center space-x-1.5 relative">
              <span className="text-xs font-bold text-gray-805 dark:text-neutral-100 font-sans">
                {getFriendlyDateLabel(selectedDate)}
              </span>
              
              {/* Invisible native Datepicker trigger wrapper */}
              <div className="relative flex items-center justify-center">
                <button 
                  type="button"
                  className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-md transition-all text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 cursor-pointer"
                  title="Pick a custom date"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </div>
            </div>

            {/* Shift forward */}
            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-1 px-1.5 hover:bg-gray-200 dark:hover:bg-neutral-800 text-gray-650 dark:text-neutral-300 rounded-lg transition-all cursor-pointer"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Selected Day Agenda Checklist */}
        <div className="space-y-3">
          {/* Targets calculations */}
          {(() => {
            const dailyTasks = tasks.filter(t => t.dueDate === selectedDate);
            const doneCount = dailyTasks.filter(t => t.status === 'Completed').length;
            const totalCount = dailyTasks.length;
            const completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            return (
              <>
                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-neutral-500 font-sans">
                  <span className="font-bold uppercase tracking-wider font-display text-gray-500 dark:text-neutral-400">Day's Agenda Checklist</span>
                  <span className="font-mono text-gray-700 dark:text-neutral-350 font-bold bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded text-[10px]">{doneCount}/{totalCount} Resolved ({completionPercent}%)</span>
                </div>

                {/* Micro Progress Bar */}
                {totalCount > 0 && (
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-neutral-800/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                )}

                {/* Confetti state notification */}
                {totalCount > 0 && doneCount === totalCount && (
                  <div className="p-2 py-2 text-center rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center justify-center space-x-1 animate-pulse">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500 animate-bounce flex-shrink-0" />
                    <span>Focus Targets Completed! Daily streak integrity verified.</span>
                  </div>
                )}

                {/* Daily checklist list */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5 pt-1">
                  {totalCount === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-gray-150 dark:border-neutral-800/80 text-center text-gray-400 dark:text-neutral-550 text-[11.5px] italic">
                      No agenda targets scheduled for this day. Add one below!
                    </div>
                  ) : (
                    dailyTasks.map((t) => {
                      const isCompleted = t.status === 'Completed';
                      return (
                        <div 
                          key={t.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 group/daytask transition-all ${
                            isCompleted 
                              ? 'bg-gray-50/55 dark:bg-neutral-850/20 border-gray-150 dark:border-neutral-850/60' 
                              : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            {/* Check clicker */}
                            <button
                              type="button"
                              onClick={() => handleToggleTaskStatus(t.id, t.status)}
                              className={`h-4.5 w-4.5 rounded-md flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                                isCompleted 
                                  ? 'bg-emerald-500 border-none text-white' 
                                  : 'border border-gray-355 dark:border-neutral-600 bg-white dark:bg-neutral-900'
                              }`}
                            >
                              {isCompleted && <Check className="h-3 w-3 text-white stroke-[3.5]" />}
                            </button>

                            <span className={`text-[11.5px] font-semibold leading-relaxed truncate ${
                              isCompleted 
                                ? 'line-through text-gray-400 dark:text-neutral-550' 
                                : 'text-gray-750 dark:text-neutral-255'
                            }`} title={t.title}>
                              {t.title}
                            </span>
                          </div>

                          {/* Info tags and actions */}
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <span className={`text-[8.5px] font-bold font-mono px-1 rounded border uppercase select-none ${
                              t.priority === 'High' ? 'text-red-500 bg-red-55/10 border-red-200/45' : t.priority === 'Medium' ? 'text-orange-500 bg-orange-55/10 border-orange-200/40' : 'text-gray-450 bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700'
                            }`}>
                              {t.priority}
                            </span>

                            {/* Discard target */}
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(t.id)}
                              className="p-1 rounded opacity-0 group-hover/daytask:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-500 transition-all cursor-pointer"
                              title="Discard daily item"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            );
          })()}

          {/* Quick Target Adder Slot */}
          <div className="flex gap-2 pt-1 border-t border-gray-50 dark:border-neutral-850">
            <input
              type="text"
              value={newDailyTaskTitle}
              onChange={(e) => setNewDailyTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateDailyTask();
                }
              }}
              placeholder="Add quick agenda target for this day..."
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-750 bg-gray-55/60 dark:bg-neutral-850/40 outline-none focus:bg-white dark:focus:bg-neutral-900 focus:ring-1 focus:ring-blue-500 text-[11px] dark:text-white transition-all placeholder:text-gray-405"
            />
            <button
              type="button"
              onClick={handleCreateDailyTask}
              className="p-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0 animate-in fade-in duration-200"
            >
              + Add Target
            </button>
          </div>
        </div>
      </div>

       {/* 2. Custom Habit Grid (Satisfaction Core) */}
      <div className="p-5 rounded-2xl glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg relative overflow-hidden backdrop-blur-xl">
        
        {/* Habit Header & Dynamic Actions */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider font-display">HABIT PROGRESSION</h3>
          </div>
          
          <div className="flex items-center space-x-2.5">
            {/* Return to Today button */}
            {habitAnchorOffset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setSlideDirection(habitAnchorOffset > 0 ? -1 : 1);
                  setHabitAnchorOffset(0);
                  setSelectedDate(getLocalDateString(new Date()));
                }}
                className="px-2.5 py-1 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all cursor-pointer shadow-sm border border-emerald-200/20"
              >
                ✦ Return to Today
              </button>
            )}

            {/* Custom Styled Calendar/Date Picker Button */}
            <div className="relative flex items-center justify-center">
              <button 
                type="button"
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-all cursor-pointer"
                title="Pick custom date"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    const pickedDate = e.target.value;
                    setSelectedDate(pickedDate);
                    
                    const today = new Date();
                    today.setHours(12, 0, 0, 0);
                    const picked = new Date(pickedDate + 'T12:00:00');
                    const diffTime = picked.getTime() - today.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    
                    setSlideDirection(diffDays >= habitAnchorOffset ? 1 : -1);
                    setHabitAnchorOffset(diffDays);
                  }
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </div>

            {/* Add Habit toggler */}
            <button
              onClick={() => setShowAddHabit(!showAddHabit)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-505 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-all cursor-pointer"
              title="Create custom habit"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Inline Create Habit form */}
        {showAddHabit && (
          <form onSubmit={handleCreateHabit} className="mb-4 p-3 rounded bg-gray-50 dark:bg-neutral-850 border border-gray-150 dark:border-neutral-800 text-xs space-y-3 font-sans">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Habit Name</label>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g. Code 1 Hour, Stretch Daily"
                className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                autoFocus
              />
            </div>
            <div className="flex justify-between items-center bg-transparent">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-gray-400">Emoji:</span>
                <select
                  value={newHabitEmoji}
                  onChange={(e) => setNewHabitEmoji(e.target.value)}
                  className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-1 rounded text-sm cursor-pointer"
                >
                  <option value="🧘‍♀️">🧘‍♀️</option>
                  <option value="📖">📖</option>
                  <option value="💪">💪</option>
                  <option value="💧">💧</option>
                  <option value="💤">💤</option>
                  <option value="💻">💻</option>
                  <option value="🍎">🍎</option>
                  <option value="🚶">🚶</option>
                  <option value="🧹">🧹</option>
                  <option value="🍵">🍵</option>
                </select>
              </div>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddHabit(false)}
                  className="px-2.5 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Date Row Navigation Slider (Today first, then 4 upcoming dates unless navigated) */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-850 p-2 rounded-xl border border-gray-100 dark:border-neutral-800 mb-4 font-sans">
          {/* Shift backward cursor */}
          <button
            type="button"
            onClick={() => handleHabitShift(-1)}
            className="p-1 hover:bg-gray-250 dark:hover:bg-neutral-800 text-gray-650 dark:text-neutral-300 rounded-lg transition-all cursor-pointer"
            title="Shift backward (past)"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Animating Dynamic Date Tiles */}
          <div className="flex-1 overflow-hidden mx-2">
            <motion.div
              key={habitAnchorOffset}
              initial={{ opacity: 0, x: slideDirection * 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="grid grid-cols-5 text-center items-center"
            >
              {datesList.map(date => {
                const isSelected = date.dateStr === selectedDate;
                const isRealToday = date.isToday; 

                return (
                  <button
                    key={date.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date.dateStr);
                    }}
                    className={`text-[9.5px] font-bold py-1 rounded-lg transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                      isSelected 
                        ? 'text-blue-600 dark:text-blue-400 font-extrabold ring-1 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 px-1' 
                        : isRealToday 
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)] px-1' 
                          : 'text-gray-400 dark:text-neutral-500 hover:bg-gray-200/50 dark:hover:bg-neutral-800'
                    }`}
                    title={isSelected ? `${date.dateStr} (Active Focus Date)` : date.dateStr}
                  >
                    <span>{date.label.split(' ')[0]}</span>
                    <span className="block text-[8px] font-normal leading-none mt-0.5">{date.label.split(' ')[1]}</span>
                    
                    {/* Primary pulse glow for real today */}
                    {isRealToday && (
                      <span className="absolute bottom-0.5 h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </div>

          {/* Shift forward cursor */}
          <button
            type="button"
            onClick={() => handleHabitShift(1)}
            className="p-1 hover:bg-gray-250 dark:hover:bg-neutral-800 text-gray-650 dark:text-neutral-300 rounded-lg transition-all cursor-pointer"
            title="Shift forward (future)"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Habits list showing sliding matching checkboxes */}
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-1 pb-1 border-b border-gray-50 dark:border-neutral-850">
            <span className="col-span-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Habit</span>
            <span className="col-span-7 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Status / Matrix View</span>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-neutral-850/40">
            {habits.map((hab) => {
              // Calculate real streak starting from selectedDate (for historical accuracy!)
              const logs = habitLogs[hab.id] || {};
              let currentStreak = 0;
              
              const d = new Date(selectedDate + 'T12:00:00');
              // Backtrack starting from the selected view date
              for (let i = 0; i < 30; i++) {
                const dateStr = getLocalDateString(d);
                if (logs[dateStr]) {
                  currentStreak++;
                } else {
                  // If we miss today (selectedDate), streak stays alive if yesterday was checked
                  if (i === 0) {
                    const yesterday = new Date(selectedDate + 'T12:00:00');
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yestStr = getLocalDateString(yesterday);
                    if (logs[yestStr]) {
                      d.setDate(d.getDate() - 1);
                      continue;
                    }
                  }
                  break; 
                }
                d.setDate(d.getDate() - 1);
              }

              return (
                <div key={hab.id} className="grid grid-cols-12 gap-1 items-center py-2 group/habrow relative">
                  {/* Habit Name Column */}
                  <div className="col-span-5 flex items-center pr-1 truncate relative">
                    <span className="text-sm mr-1.5 shrink-0">{hab.emoji}</span>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-700 dark:text-neutral-200 truncate" title={hab.name}>
                        {hab.name}
                      </p>
                      <span className="text-[9px] text-orange-500 font-bold font-mono">
                        🔥 {currentStreak}D STREAK
                      </span>
                    </div>
                  </div>

                  {/* 5-Day Matrix Checkbox Grid (Smooth Slider animation inline) */}
                  <div className="col-span-7 overflow-hidden">
                    <motion.div 
                      key={habitAnchorOffset}
                      initial={{ opacity: 0, x: slideDirection * 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="grid grid-cols-5 text-center items-center"
                    >
                      {datesList.map((dt) => {
                        const isChecked = logs[dt.dateStr] || false;
                        return (
                          <div key={dt.dateStr} className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => toggleHabitLog(hab.id, dt.dateStr)}
                              className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/10'
                                  : 'border border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-100 dark:border-neutral-700 dark:hover:border-neutral-600 dark:bg-neutral-850 dark:hover:bg-neutral-800'
                              }`}
                              title={`Toggle compliance for ${dt.dateStr}`}
                            >
                              {isChecked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                            </button>
                          </div>
                        );
                      })}
                    </motion.div>
                  </div>

                  {/* Absolute hover garbage bin to delete habit cleanly */}
                  <button
                    onClick={() => handleDeleteHabit(hab.id)}
                    className="absolute right-0 opacity-0 group-hover/habrow:opacity-100 transition-all p-1 text-red-400 hover:text-red-500 cursor-pointer bg-white dark:bg-neutral-900 rounded shadow-xs"
                    title="Remove habit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Aesthetic Life Pillars Widget */}
      <div className="p-5 rounded-2xl glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg backdrop-blur-xl">
        <div className="flex items-center space-x-2 mb-4">
          <Layers className="h-4 w-4 text-purple-500" />
          <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 tracking-wider font-display">PILLARS OF HEALTH & CORE</h3>
        </div>

        <div className="space-y-3.5">
          {pillars.map(pill => {
            const isExpanded = expandedPillar === pill.id;
            return (
              <div 
                key={pill.id} 
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isExpanded 
                    ? 'bg-neutral-50 dark:bg-neutral-850/80 border-blue-150 dark:border-neutral-700' 
                    : 'bg-white dark:bg-neutral-900 max-h-24 hover:bg-gray-50/70 dark:hover:bg-neutral-850/20 border-gray-100 dark:border-neutral-800'
                }`}
                onClick={() => setExpandedPillar(isExpanded ? null : pill.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-lg bg-gray-50 dark:bg-neutral-800 h-8 w-8 rounded-lg flex items-center justify-center border border-gray-100 dark:border-neutral-700">{pill.emoji}</span>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-white truncate">{pill.name}</h4>
                      <p className="text-[10px] text-gray-400 dark:text-neutral-500 truncate">{pill.focusArea}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-gray-455 transition-all ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} />
                </div>

                {/* Progress bar info */}
                <div className="mt-3">
                  <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 mb-1">
                    <span>Alignment Score</span>
                    <span className="font-bold text-gray-700 dark:text-neutral-300">{pill.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${pill.progress}%`,
                        backgroundColor: pill.color === 'emerald' ? '#10b981' : pill.color === 'blue' ? '#3b82f6' : '#a855f7'
                      }}
                    />
                  </div>
                </div>

                {/* Expanded Pillar Statement */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 text-[11px] leading-relaxed text-gray-600 dark:text-neutral-300 animate-in fade-in duration-200">
                    <p className="font-semibold text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Vision Statement</p>
                    <p className="font-serif italic">"{pill.vision}"</p>
                    
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-[9px] uppercase font-semibold text-gray-450">Tuning Slider:</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={pill.progress}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          const val = parseInt(e.target.value);
                          setPillars(pillars.map(p => p.id === pill.id ? { ...p, progress: val } : p));
                        }}
                        className="flex-1 h-1 bg-gray-205 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
