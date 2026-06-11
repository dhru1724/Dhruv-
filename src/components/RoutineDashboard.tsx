import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Droplet, 
  ChevronRight, 
  ChevronLeft,
  X, 
  Flame,
  Calendar,
  ClipboardList,
  ArrowUpRight
} from 'lucide-react';

// Interfaces for our state model
export interface RoutineTimelineEvent {
  id: string;
  title: string;
  timeSlot: string; // e.g. "05:00 AM" or "05:00–05:30 AM"
  completed: boolean;
}

export interface RoutineBoardTask {
  id: string;
  text: string;
  completed: boolean;
  section: 'goals' | 'must_do' | 'have_time' | 'tomorrow';
}

interface RoutineDashboardProps {
  timelineEvents?: RoutineTimelineEvent[];
  setTimelineEvents?: React.Dispatch<React.SetStateAction<RoutineTimelineEvent[]>> | ((events: RoutineTimelineEvent[]) => void);
  boardTasks?: RoutineBoardTask[];
  setBoardTasks?: React.Dispatch<React.SetStateAction<RoutineBoardTask[]>> | ((tasks: RoutineBoardTask[]) => void);
  waterCurrent?: number;
  setWaterCurrent?: (val: number | ((prev: number) => number)) => void;
  waterGoal?: number;
  setWaterGoal?: (val: number) => void;
  routineStreak?: number;
  isDark?: boolean;
  selectedDate?: string;
  setSelectedDate?: (date: string) => void;
}

export default function RoutineDashboard({
  timelineEvents: propsTimelineEvents,
  setTimelineEvents: propsSetTimelineEvents,
  boardTasks: propsBoardTasks,
  setBoardTasks: propsSetBoardTasks,
  waterCurrent: propsWaterCurrent,
  setWaterCurrent: propsSetWaterCurrent,
  waterGoal: propsWaterGoal,
  setWaterGoal: propsSetWaterGoal,
  routineStreak = 18,
  isDark = true,
  selectedDate,
  setSelectedDate,
}: RoutineDashboardProps = {}) {
  // --- Standard Local Storage Persistence ---

  const getLocalDateString = (dateObj: Date = new Date()) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [localSelectedDate, setLocalSelectedDate] = useState(() => getLocalDateString());
  const activeSelectedDate = selectedDate ?? localSelectedDate;
  const activeSetSelectedDate = setSelectedDate ?? setLocalSelectedDate;

  // Derive dayOffset dynamically from activeSelectedDate
  const getDayOffset = () => {
    try {
      const today = new Date(getLocalDateString() + 'T00:00:00');
      const selected = new Date(activeSelectedDate + 'T00:00:00');
      const diffTime = selected.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) ? 0 : diffDays;
    } catch (e) {
      return 0;
    }
  };
  const dayOffset = getDayOffset();

  // 14 Precise mandatory timeline items requested in the redesign prompt
  const [localTimelineEvents, setLocalTimelineEvents] = useState<RoutineTimelineEvent[]>(() => {
    const saved = localStorage.getItem(`lifeos_routine_timeline_v3_${activeSelectedDate}`) || localStorage.getItem('lifeos_routine_timeline_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const timelineEvents = propsTimelineEvents ?? localTimelineEvents;
  const setTimelineEvents = propsSetTimelineEvents ?? setLocalTimelineEvents;

  // Task Quadrants
  const [localBoardTasks, setLocalBoardTasks] = useState<RoutineBoardTask[]>(() => {
    const saved = localStorage.getItem(`lifeos_routine_tasks_v3_${activeSelectedDate}`) || localStorage.getItem('lifeos_routine_tasks_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const boardTasks = propsBoardTasks ?? localBoardTasks;
  const setBoardTasks = propsSetBoardTasks ?? setLocalBoardTasks;

  const getYesterdayDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  const yesterdayStr = getYesterdayDateString(activeSelectedDate);
  const yesterdayTasksStr = localStorage.getItem(`lifeos_routine_tasks_v3_${yesterdayStr}`);
  let unfinishedYesterdayTasks: RoutineBoardTask[] = [];
  if (yesterdayTasksStr) {
    try {
      const parsed = JSON.parse(yesterdayTasksStr);
      if (Array.isArray(parsed)) {
        unfinishedYesterdayTasks = parsed.filter((t: any) => t.section === 'must_do' && !t.completed);
      }
    } catch (e) {}
  }

  // Water logs
  const [localWaterCurrent, setLocalWaterCurrent] = useState<number>(() => {
    const saved = localStorage.getItem(`lifeos_routine_water_v3_${activeSelectedDate}`) || localStorage.getItem('lifeos_routine_water_v3');
    return saved ? parseInt(saved, 10) : 0;
  });
  const waterCurrent = propsWaterCurrent ?? localWaterCurrent;
  const setWaterCurrent = propsSetWaterCurrent ?? setLocalWaterCurrent;

  const [localWaterGoal, setLocalWaterGoal] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_routine_water_goal_v3');
    return saved ? parseInt(saved, 10) : 3000;
  });
  const waterGoal = propsWaterGoal ?? localWaterGoal;
  const setWaterGoal = propsSetWaterGoal ?? setLocalWaterGoal;

  // Routine Continuous Streak
  const streak = routineStreak;

  // Quick modals forms state
  const [showAddInModal, setShowAddInModal] = useState(false);
  const [addItemType, setAddItemType] = useState<'timeline' | 'task'>('timeline');
  const [selectedSection, setSelectedSection] = useState<'goals' | 'must_do' | 'have_time' | 'tomorrow'>('goals');

  // New Event Form
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('08:00–08:30 AM');

  // New Task Form
  const [newTaskText, setNewTaskText] = useState('');

  // Synchronizers
  useEffect(() => {
    if (!propsTimelineEvents) {
      localStorage.setItem(`lifeos_routine_timeline_v3_${activeSelectedDate}`, JSON.stringify(timelineEvents));
    }
  }, [timelineEvents, activeSelectedDate, propsTimelineEvents]);

  useEffect(() => {
    if (!propsSetBoardTasks) {
      localStorage.setItem(`lifeos_routine_tasks_v3_${activeSelectedDate}`, JSON.stringify(boardTasks));
    }
  }, [boardTasks, activeSelectedDate, propsSetBoardTasks]);

  useEffect(() => {
    if (!propsSetWaterCurrent) {
      localStorage.setItem(`lifeos_routine_water_v3_${activeSelectedDate}`, waterCurrent.toString());
    }
  }, [waterCurrent, activeSelectedDate, propsSetWaterCurrent]);

  useEffect(() => {
    localStorage.setItem('lifeos_routine_water_goal_v3', waterGoal.toString());
  }, [waterGoal]);

  useEffect(() => {
    localStorage.setItem('lifeos_routine_streak_v3', streak.toString());
  }, [streak]);

  // Actions handler
  const handleToggleEvent = (id: string) => {
    setTimelineEvents(prev => prev.map(ev => ev.id === id ? { ...ev, completed: !ev.completed } : ev));
  };

  const handleToggleTask = (id: string) => {
    setBoardTasks(prev => prev.map(tk => tk.id === id ? { ...tk, completed: !tk.completed } : tk));
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBoardTasks(prev => prev.filter(tk => tk.id !== id));
  };



  const handleAddWater = (val: number) => {
    setWaterCurrent(prev => Math.max(0, Math.min(6000, prev + val)));
  };

  const handleAddNewTimeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const item: RoutineTimelineEvent = {
      id: `timeline-${Date.now()}`,
      title: newEventTitle,
      timeSlot: newEventTime,
      completed: false
    };
    setTimelineEvents(prev => [...prev, item]);
    setNewEventTitle('');
    setShowAddInModal(false);
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const task: RoutineBoardTask = {
      id: `task-${Date.now()}`,
      text: newTaskText,
      completed: false,
      section: selectedSection
    };
    setBoardTasks(prev => [...prev, task]);
    setNewTaskText('');
    setShowAddInModal(false);
  };

  const handleResetToPredefined = () => {
    if (window.confirm('Reset schedule to the 14 standard steps?')) {
      const standard = [
        { id: 't1', timeSlot: '05:00 AM', title: 'Wake Up', completed: false },
        { id: 't2', timeSlot: '05:00–05:30 AM', title: 'Fresh Up', completed: false },
        { id: 't3', timeSlot: '05:30–07:00 AM', title: 'Gym', completed: false },
        { id: 't4', timeSlot: '07:00–08:00 AM', title: 'Bath & Breakfast', completed: false },
        { id: 't5', timeSlot: '08:00–09:00 AM', title: 'Prayer & Travel', completed: false },
        { id: 't6', timeSlot: '09:00 AM–05:30 PM', title: 'Job', completed: false },
        { id: 't7', timeSlot: '05:40–06:15 PM', title: 'Travel Home', completed: false },
        { id: 't8', timeSlot: '06:30–07:00 PM', title: 'Meditation', completed: false },
        { id: 't9', timeSlot: '07:00–07:15 PM', title: 'Prayer', completed: false },
        { id: 't10', timeSlot: '07:15–08:00 PM', title: 'Dinner', completed: false },
        { id: 't11', timeSlot: '08:00–09:00 PM', title: 'Walk or Learning', completed: false },
        { id: 't12', timeSlot: '09:00–10:00 PM', title: 'Walk or Learning', completed: false },
        { id: 't13', timeSlot: '10:00–10:30 PM', title: 'Book Reading', completed: false },
        { id: 't14', timeSlot: '10:30–10:45 PM', title: 'Sleep', completed: false },
      ];
      setTimelineEvents(standard);
    }
  };

  // Helper date formatter: "Monday, Jun 8, 2026"
  const formattedDateString = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  };

  // Calculation Metrics
  const completedEvents = timelineEvents.filter(e => e.completed).length;
  const totalEventsCount = timelineEvents.length;
  const eventsPercentage = totalEventsCount > 0 ? Math.round((completedEvents / totalEventsCount) * 100) : 0;

  const completedTasks = boardTasks.filter(t => t.completed).length;
  const totalTasksCount = boardTasks.length;
  const tasksPercentage = totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0;

  // Weighted total routine completion metric
  const absoluteOverallPercentage = Math.round((eventsPercentage * 0.5) + (tasksPercentage * 0.3) + (Math.min(100, Math.round((waterCurrent / waterGoal) * 100)) * 0.2));

  const waterPercentage = Math.min(100, Math.round((waterCurrent / waterGoal) * 100));

  return (
    <div className={`font-sans select-none space-y-4 ${isDark ? 'text-[#E2E2E9]' : 'text-[#222222]'}`}>
      
      {/* CORE BRAND MAIN TITLE */}
      <div id="routine_main_title_section" className={`py-2 px-1 border-b pb-4 ${isDark ? 'border-[#7C5CFF]/10' : 'border-[#E5E7EB]'}`}>
        <div>
          <h1 id="routine_title" className={`font-sans font-bold text-3xl tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
            ROUTINE
          </h1>
          <p className={`font-sans font-normal text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-[#222222]'}`}>
            Plan your day. Build your best self.
          </p>
        </div>
      </div>

      {/* COMPACT MINIMAL DATE SECTION */}
      <div id="routine_date_frame" className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
        isDark 
          ? 'bg-card-bg border border-border-color shadow-[0_0_12px_rgba(124,92,255,0.03)]' 
          : 'bg-white border border-[#E5E7EB] shadow-sm'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#7C5CFF]/10 rounded-lg text-[#7C5CFF]">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <span className={`text-xs font-semibold tracking-wide ${isDark ? 'text-white' : 'text-black'}`}>
            {formattedDateString(dayOffset)}
          </span>
          {dayOffset !== 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isDark ? 'bg-[#7C5CFF]/20 text-white' : 'bg-[#7C5CFF]/15 text-[#7C5CFF]'}`}>
              {dayOffset > 0 ? `+${dayOffset}d` : `${dayOffset}d`}
            </span>
          )}
        </div>

        {/* Accent Swiper */}
        <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${isDark ? 'bg-bg-secondary border-border-color' : 'bg-[#F8F8FA] border-[#E5E7EB]'}`}>
          <button 
            onClick={() => {
              const d = new Date(activeSelectedDate + 'T00:00:00');
              d.setDate(d.getDate() - 1);
              activeSetSelectedDate(getLocalDateString(d));
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${isDark ? 'text-[#7C5CFF] hover:text-white hover:bg-[#7C5CFF]/10' : 'text-[#7C5CFF] hover:bg-[#7C5CFF]/15'}`}
            title="Previous Day"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => {
              activeSetSelectedDate(getLocalDateString(new Date()));
            }}
            className="px-2.5 py-1 text-[10px] font-bold uppercase text-white bg-[#7C5CFF] hover:bg-[#6C4BE6] rounded transition-all cursor-pointer shadow-[0_0_8px_rgba(124,92,255,0.2)]"
          >
            Today
          </button>
          <button 
            onClick={() => {
              const d = new Date(activeSelectedDate + 'T00:00:00');
              d.setDate(d.getDate() + 1);
              activeSetSelectedDate(getLocalDateString(d));
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${isDark ? 'text-[#7C5CFF] hover:text-white hover:bg-[#7C5CFF]/10' : 'text-[#7C5CFF] hover:bg-[#7C5CFF]/15'}`}
            title="Next Day"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* TWO-COLUMN PLANNED GRID */}
      <div id="routine_main_layout" className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
        
        {/* LEFT COLUMN: TODAY'S SCHEDULE (Timeline Rows) */}
        <div id="routine_left_timeline" className={`lg:col-span-12 xl:col-span-7 rounded-2xl p-4.5 space-y-4 transition-all duration-300 ${
          isDark 
            ? 'bg-card-bg border border-border-color shadow-[0_0_15px_rgba(124,92,255,0.03)]' 
            : 'bg-white border border-[#E5E7EB] shadow-sm'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-[#7C5CFF]/10' : 'border-[#E5E7EB]'}`}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#7C5CFF]" />
              <h2 className={`font-sans font-semibold text-xs tracking-wider uppercase ${isDark ? 'text-white' : 'text-black'}`}>
                TODAY'S SCHEDULE
              </h2>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
              isDark ? 'bg-[#7C5CFF]/15 text-[#7C5CFF]' : 'bg-[#7C5CFF]/10 text-[#7C5CFF]'
            }`}>
              {completedEvents}/{totalEventsCount} Completed
            </span>
          </div>

          {/* Linear compact list */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1 select-none scrollbar-none">
            {timelineEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => handleToggleEvent(ev.id)}
                className={`group flex items-center justify-between px-3 py-2 border rounded-xl transition-all duration-150 cursor-pointer ${
                  ev.completed 
                    ? isDark
                      ? 'border-[#7C5CFF]/10 opacity-45 bg-[#111111]/10'
                      : 'border-[#E5E7EB] bg-[#F8F8FA]/80 opacity-60'
                    : isDark 
                      ? 'border-[#7C5CFF]/15 hover:border-[#7C5CFF]/45 hover:bg-[#7C5CFF]/5 bg-black/45' 
                      : 'border-[#E5E7EB] hover:border-[#7C5CFF]/30 hover:bg-[#7C5CFF]/5 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Timestamp component */}
                  <span className="font-sans text-[11px] font-semibold text-[#7C5CFF] shrink-0">
                    {ev.timeSlot}
                  </span>
                  
                  {/* Visual Divider block */}
                  <span className={`text-[11.5px] font-sans shrink-0 ${isDark ? 'text-[#7C5CFF]/40' : 'text-gray-400'}`}>—</span>
                  
                  {/* Event Title */}
                  <span className={`font-sans text-xs font-semibold truncate transition-colors ${
                    ev.completed 
                      ? 'line-through text-zinc-500' 
                      : isDark ? 'text-white' : 'text-black'
                  }`}>
                    {ev.title}
                  </span>
                </div>

                {/* Status check container */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                    ev.completed 
                      ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white'
                      : isDark
                        ? 'border-[#7C5CFF]/35 group-hover:border-[#7C5CFF]'
                        : 'border-[#E5E7EB] group-hover:border-[#7C5CFF] bg-white'
                  }`}>
                    {ev.completed && <Check className="h-2.5 w-2.5 stroke-[3.5px]" />}
                  </div>
                </div>
              </div>
            ))}

            {timelineEvents.length === 0 && (
              <div className={`p-8 text-center text-xs font-sans ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                No routine events scheduled for this date.
              </div>
            )}
          </div>

          {/* Quick add custom activity */}
          <div className={`pt-2 border-t ${isDark ? 'border-[#7C5CFF]/10' : 'border-[#E5E7EB]'}`}>
            <button
              onClick={() => {
                setAddItemType('timeline');
                setShowAddInModal(true);
              }}
              className={`w-full py-1.5 border border-dashed rounded-xl text-xs font-semibold hover:bg-[#7C5CFF]/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans ${
                isDark 
                  ? 'border-[#7C5CFF]/25 hover:border-[#7C5CFF] text-[#7C5CFF]' 
                  : 'border-[#6D5FFC]/40 hover:border-[#6D5FFC] text-[#6D5FFC] bg-white shadow-sm'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Clock Item</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Supporting Dashboard Bento Blocks (Goals, Streak, Water) */}
        <div id="routine_right_bento" className="lg:col-span-12 xl:col-span-5 space-y-4">
          
          {/* STATS DECK GRID */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* ROUTINE STREAK */}
            <div id="dashboard_streak_card" className={`rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-card-bg border border-border-color shadow-[0_0_15px_rgba(124,92,255,0.02)]' 
                : 'bg-white border border-[#E5E7EB] shadow-sm'
            }`}>
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#7C5CFF]/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-[#7C5CFF]" />
                <span className={`text-[10px] font-semibold uppercase tracking-widest font-sans ${isDark ? 'text-zinc-400' : 'text-[#222222]'}`}>Streak</span>
              </div>

              <div className="my-2 select-none">
                <span className={`text-2xl font-bold font-sans tracking-tight block ${isDark ? 'text-white' : 'text-black'}`}>
                  {streak} Days
                </span>
                <span className={`text-[9px] font-sans block mt-0.5 ${isDark ? 'text-[#7C5CFF]/75' : 'text-[#6D5FFC]/85'}`}>Continuous consistency</span>
              </div>

              <div className={`text-[10px] font-sans mt-2 text-center self-stretch py-1.5 rounded-lg border leading-none ${
                isDark 
                  ? 'text-gray-500 bg-white/5 border-white/5' 
                  : 'text-[#222222] bg-[#F8F8FA] border-[#E5E7EB]'
              }`}>
                🌱 Calculated Live
              </div>
            </div>

            {/* WATER INTAKE TRACKER */}
            <div id="dashboard_water_card" className={`rounded-2xl p-4 flex flex-col justify-between relative transition-all duration-300 ${
              isDark 
                ? 'bg-card-bg border border-border-color shadow-[0_0_15px_rgba(124,92,255,0.02)]' 
                : 'bg-white border border-[#E5E7EB] shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Droplet className="h-4 w-4 text-[#7C5CFF]" />
                  <span className={`text-[10px] font-semibold uppercase tracking-widest font-sans ${isDark ? 'text-zinc-400' : 'text-[#222222]'}`}>Water</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isDark ? 'text-white/90 bg-[#7C5CFF]/15' : 'text-[#7C5CFF] bg-[#6D5FFC]/10'
                }`}>{waterPercentage}%</span>
              </div>

              {/* Horizontal liquid deck bar */}
              <div className="my-2">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className={isDark ? 'text-white' : 'text-black'}>{waterCurrent} ml</span>
                  <span className={isDark ? 'text-zinc-500 font-normal' : 'text-gray-400 font-normal'}>/ {waterGoal}ml</span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden mt-1 select-none border ${
                  isDark ? 'bg-[#7C5CFF]/5 border-[#7C5CFF]/15' : 'bg-[#E5E7EB] border-[#E5E7EB]'
                }`}>
                  <div 
                    className="bg-[#7C5CFF] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(124,92,255,0.4)]"
                    style={{ width: `${waterPercentage}%` }}
                  />
                </div>
              </div>

              {/* Water triggers */}
              <div className={`grid grid-cols-2 gap-1 p-0.5 rounded-lg border text-[10px] ${
                isDark ? 'bg-black border-[#7C5CFF]/15' : 'bg-[#F8F8FA] border-[#E5E7EB]'
              }`}>
                <button
                  onClick={() => handleAddWater(250)}
                  className="py-1 text-center font-bold text-[#7C5CFF] hover:bg-[#7C5CFF]/10 rounded transition-all cursor-pointer"
                >
                  +250ml
                </button>
                <button 
                  onClick={() => handleAddWater(500)}
                  className="py-1 text-center font-bold text-[#7C5CFF] hover:bg-[#7C5CFF]/10 rounded transition-all cursor-pointer"
                >
                  +500ml
                </button>
              </div>
            </div>

          </div>

          {/* DENSITY BOARD QUADRANTS: Notion + Linear Accent Style */}
          <div id="dashboard_quadrants" className="space-y-3">
            
            {/* QUADRANT: TODAY'S GOALS */}
            <div className={`p-3.5 rounded-xl space-y-2.5 transition-all duration-300 ${
              isDark 
                ? 'bg-card-bg border border-border-color shadow-[0_0_15px_rgba(124,92,255,0.015)]' 
                : 'bg-white border border-[#E5E7EB] shadow-sm'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isDark ? 'border-[#7C5CFF]/10' : 'border-[#E5E7EB]'}`}>
                <span className={`font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFF] shadow-[0_0_6px_#7C5CFF]" />
                  Today's Goals
                </span>
                <button
                  onClick={() => {
                    setSelectedSection('goals');
                    setAddItemType('task');
                    setShowAddInModal(true);
                  }}
                  className={`p-1 text-[#7C5CFF] hover:text-white rounded hover:bg-[#7C5CFF]/10 transition-colors cursor-pointer text-xs`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1 scrollbar-none">
                {boardTasks.filter(t => t.section === 'goals').map(task => (
                  <div key={task.id} onClick={() => handleToggleTask(task.id)} className={`group flex items-center justify-between p-1.5 border rounded-lg text-xs cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-black/30 border-[#7C5CFF]/10 hover:border-[#7C5CFF]/30' 
                      : 'bg-[#F8F8FA] border-[#E5E7EB] hover:border-[#7C5CFF]/30 text-black'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                        task.completed 
                          ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white' 
                          : isDark 
                            ? 'border-[#7C5CFF]/25 bg-black/40' 
                            : 'border-[#E5E7EB] bg-white'
                      }`}>
                        {task.completed && <Check className="h-2.5 w-2.5 stroke-[3.5px]" />}
                      </div>
                      <span className={`font-sans truncate font-medium ${
                        task.completed 
                          ? 'line-through text-zinc-500' 
                          : isDark ? 'text-white' : 'text-black'
                      }`}>
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-0.5 rounded cursor-pointer transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {boardTasks.filter(t => t.section === 'goals').length === 0 && (
                  <div className={`text-[10px] py-2 text-center font-sans tracking-wide ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                    No goals created for this date.
                  </div>
                )}
              </div>
            </div>

            {/* QUADRANT: MUST GET DONE TODAY */}
            <div className={`p-3.5 rounded-xl space-y-2.5 transition-all duration-300 ${
              isDark 
                ? 'bg-card-bg border border-border-color shadow-[0_0_15px_rgba(124,92,255,0.015)]' 
                : 'bg-white border border-[#E5E7EB] shadow-sm'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isDark ? 'border-[#7C5CFF]/10' : 'border-[#E5E7EB]'}`}>
                <span className={`font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFF] shadow-[0_0_6px_#7C5CFF]" />
                  Must Get Done Today
                </span>
                <button
                  onClick={() => {
                    setSelectedSection('must_do');
                    setAddItemType('task');
                    setShowAddInModal(true);
                  }}
                  className={`p-1 text-[#7C5CFF] hover:text-white rounded hover:bg-[#7C5CFF]/10 transition-colors cursor-pointer text-xs`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {unfinishedYesterdayTasks.length > 0 && (
                <div className="pb-1 transition-all">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const todayTexts = new Set(
                        boardTasks
                          .filter(t => t.section === 'must_do')
                          .map(t => t.text.toLowerCase().trim())
                      );
                      const toCarry = unfinishedYesterdayTasks.filter(
                        t => !todayTexts.has(t.text.toLowerCase().trim())
                      );
                      
                      if (toCarry.length > 0) {
                        const carried = toCarry.map(t => ({
                          ...t,
                          id: `carried-${Date.now()}-${Math.random()}`,
                          completed: false,
                        }));
                        const updated = [...boardTasks, ...carried];
                        setBoardTasks(updated);

                        // Save updated state immediately to activeSelectedDate localstorage
                        localStorage.setItem(
                          `lifeos_routine_tasks_v3_${activeSelectedDate}`,
                          JSON.stringify(updated)
                        );

                        // Update yesterday's storage to mark them carriedForward
                        try {
                          const yesterTasks = JSON.parse(yesterdayTasksStr || '[]');
                          const cleanedYester = yesterTasks.map((t: any) => {
                            if (t.section === 'must_do' && !t.completed) {
                              return { ...t, completed: true, carriedForward: true };
                            }
                            return t;
                          });
                          localStorage.setItem(
                            `lifeos_routine_tasks_v3_${yesterdayStr}`,
                            JSON.stringify(cleanedYester)
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-lg border text-[10px] font-sans font-semibold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                      isDark
                        ? 'bg-[#7C5CFF]/10 border-[#7C5CFF]/30 text-[#7C5CFF] hover:bg-[#7C5CFF]/20 hover:border-[#7C5CFF]/50'
                        : 'bg-[#7C5CFF]/5 border-[#7C5CFF]/25 text-[#7C5CFF] hover:bg-[#7C5CFF]/15 hover:border-[#7C5CFF]/45'
                    }`}
                  >
                    <ArrowUpRight className="h-3 w-3" />
                    Carry Forward Unfinished ({unfinishedYesterdayTasks.length})
                  </button>
                </div>
              )}

              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1 scrollbar-none">
                {boardTasks.filter(t => t.section === 'must_do').map(task => (
                  <div key={task.id} onClick={() => handleToggleTask(task.id)} className={`group flex items-center justify-between p-1.5 border rounded-lg text-xs cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-black/30 border-[#7C5CFF]/10 hover:border-[#7C5CFF]/30' 
                      : 'bg-[#F8F8FA] border-[#E5E7EB] hover:border-[#7C5CFF]/30 text-black'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                        task.completed 
                          ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white' 
                          : isDark 
                            ? 'border-[#7C5CFF]/25 bg-black/40' 
                            : 'border-[#E5E7EB] bg-white'
                      }`}>
                        {task.completed && <Check className="h-2.5 w-2.5 stroke-[3.5px]" />}
                      </div>
                      <span className={`font-sans truncate font-medium ${
                        task.completed 
                          ? 'line-through text-zinc-500' 
                          : isDark ? 'text-white' : 'text-black'
                      }`}>
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-0.5 rounded cursor-pointer transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {boardTasks.filter(t => t.section === 'must_do').length === 0 && (
                  <div className={`text-[10px] py-2 text-center font-sans tracking-wide ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                    Nothing planned for this date.
                  </div>
                )}
              </div>
            </div>

            {/* QUADRANT: IF I HAVE TIME */}
            <div className={`p-3.5 rounded-xl space-y-2.5 transition-all duration-300 ${
              isDark 
                ? 'bg-card-bg border border-border-color shadow-[0_0_15px_rgba(124,92,255,0.015)]' 
                : 'bg-white border border-[#E5E7EB] shadow-sm'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isDark ? 'border-[#7C5CFF]/10' : 'border-[#E5E7EB]'}`}>
                <span className={`font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFF] shadow-[0_0_6px_#7C5CFF]" />
                  If I Have Time
                </span>
                <button
                  onClick={() => {
                    setSelectedSection('have_time');
                    setAddItemType('task');
                    setShowAddInModal(true);
                  }}
                  className="p-1 text-[#7C5CFF] hover:text-white rounded hover:bg-[#7C5CFF]/10 transition-colors cursor-pointer text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1 scrollbar-none">
                {boardTasks.filter(t => t.section === 'have_time').map(task => (
                  <div key={task.id} onClick={() => handleToggleTask(task.id)} className={`group flex items-center justify-between p-1.5 border rounded-lg text-xs cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-black/30 border-[#7C5CFF]/10 hover:border-[#7C5CFF]/30' 
                      : 'bg-[#F8F8FA] border-[#E5E7EB] hover:border-[#7C5CFF]/30 text-black'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                        task.completed 
                          ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white' 
                          : isDark 
                            ? 'border-[#7C5CFF]/25 bg-black/40' 
                            : 'border-[#E5E7EB] bg-white'
                      }`}>
                        {task.completed && <Check className="h-2.5 w-2.5 stroke-[3.5px]" />}
                      </div>
                      <span className={`font-sans truncate font-medium ${
                        task.completed 
                          ? 'line-through text-zinc-500' 
                          : isDark ? 'text-white' : 'text-black'
                      }`}>
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-0.5 rounded cursor-pointer transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {boardTasks.filter(t => t.section === 'have_time').length === 0 && (
                  <div className={`text-[10px] py-2 text-center font-sans tracking-wide ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                    Nothing planned for this date.
                  </div>
                )}
              </div>
            </div>

            {/* QUADRANT: FOR TOMORROW */}
            <div className={`p-3.5 rounded-xl space-y-2.5 transition-all duration-300 ${
              isDark 
                ? 'bg-card-bg border border-border-color shadow-[0_0_15px_rgba(124,92,255,0.015)]' 
                : 'bg-white border border-[#E5E7EB] shadow-sm'
            }`}>
              <div className={`flex items-center justify-between border-b pb-1.5 ${isDark ? 'border-[#7C5CFF]/10' : 'border-[#E5E7EB]'}`}>
                <span className={`font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-black'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFF] shadow-[0_0_6px_#7C5CFF]" />
                  For Tomorrow
                </span>
                <button
                  onClick={() => {
                    setSelectedSection('tomorrow');
                    setAddItemType('task');
                    setShowAddInModal(true);
                  }}
                  className="p-1 text-[#7C5CFF] hover:text-white rounded hover:bg-[#7C5CFF]/10 transition-colors cursor-pointer text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1 scrollbar-none">
                {boardTasks.filter(t => t.section === 'tomorrow').map(task => (
                  <div key={task.id} onClick={() => handleToggleTask(task.id)} className={`group flex items-center justify-between p-1.5 border rounded-lg text-xs cursor-pointer transition-all ${
                    isDark 
                      ? 'bg-black/30 border-[#7C5CFF]/10 hover:border-[#7C5CFF]/30' 
                      : 'bg-[#F8F8FA] border-[#E5E7EB] hover:border-[#7C5CFF]/30 text-black'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                        task.completed 
                          ? 'bg-[#7C5CFF] border-[#7C5CFF] text-white' 
                          : isDark 
                            ? 'border-[#7C5CFF]/25 bg-black/40' 
                            : 'border-[#E5E7EB] bg-white'
                      }`}>
                        {task.completed && <Check className="h-2.5 w-2.5 stroke-[3.5px]" />}
                      </div>
                      <span className={`font-sans truncate font-medium ${
                        task.completed 
                          ? 'line-through text-zinc-500' 
                          : isDark ? 'text-white' : 'text-black'
                      }`}>
                        {task.text}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 p-0.5 rounded cursor-pointer transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {boardTasks.filter(t => t.section === 'tomorrow').length === 0 && (
                  <div className={`text-[10px] py-2 text-center font-sans tracking-wide ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                    Nothing planned for this date.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* BOTTOM METRIC PROGRESS CARD (Daily Summary & Add Active Routine Trigger Button) */}
      <div id="routine_footer_progress" className={`rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ${
        isDark 
          ? 'bg-card-bg border border-border-color shadow-[0_0_15px_rgba(124,92,255,0.03)]' 
          : 'bg-white border border-[#E5E7EB] shadow-sm'
      }`}>
        
        {/* Dynamic Summary Progress */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 rounded-xl shrink-0 flex items-center justify-center text-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.1)]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
                Daily Progress
              </span>
              <span className="text-base font-bold font-mono text-[#7C5CFF]">
                {absoluteOverallPercentage}%
              </span>
            </div>
            
            {/* Horizontal timeline bar */}
            <div className={`w-full sm:w-60 h-1.5 rounded-full overflow-hidden border ${isDark ? 'bg-[#7C5CFF]/5 border-[#7C5CFF]/10' : 'bg-[#E5E7EB] border-[#E5E7EB]'}`}>
              <div 
                className="bg-[#7C5CFF] h-full rounded-full transition-all duration-300 shadow-[0_0_6px_#7C5CFF]"
                style={{ width: `${absoluteOverallPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            setAddItemType('timeline');
            setShowAddInModal(true);
          }}
          className="w-full md:w-auto px-5 py-2.5 bg-[#7C5CFF] hover:bg-[#6C4BE6] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(124,92,255,0.2)] hover:shadow-[0_0_20px_rgba(124,92,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="font-sans">Add Activity</span>
        </button>
      </div>

      {/* DETACHED POPUP MODAL */}
      <AnimatePresence>
        {showAddInModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className={`p-5 rounded-2xl w-full max-w-sm space-y-4 border ${
                isDark 
                  ? 'bg-card-bg border-border-color shadow-[0_0_40px_rgba(124,92,255,0.15)]' 
                  : 'bg-white border-[#E5E7EB] shadow-2xl text-black'
              }`}
            >
              <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-[#7C5CFF]/15' : 'border-[#E5E7EB]'}`}>
                <h3 className={`font-sans font-bold text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
                  {addItemType === 'timeline' ? 'Add Timeline Event' : 'Add Board Item'}
                </h3>
                <button 
                  onClick={() => setShowAddInModal(false)}
                  className={`p-1 rounded transition-colors focus:outline-none ${
                    isDark ? 'hover:bg-[#7C5CFF]/10 text-zinc-500 hover:text-white' : 'hover:bg-gray-100 text-[#222222] hover:text-black'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Selector Tabs if adding board tasks */}
              {addItemType === 'task' && (
                <div className={`grid grid-cols-4 gap-1 p-0.5 rounded-lg border text-[10px] font-semibold ${
                  isDark ? 'bg-black border-[#7C5CFF]/15' : 'bg-[#F8F8FA] border-[#E5E7EB]'
                }`}>
                  {[
                    { key: 'goals', label: 'Goals' },
                    { key: 'must_do', label: 'Must Do' },
                    { key: 'have_time', label: 'If Time' },
                    { key: 'tomorrow', label: 'Tomorrow' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSelectedSection(tab.key as any)}
                      className={`py-1 text-center rounded transition-all cursor-pointer ${
                        selectedSection === tab.key 
                          ? 'bg-[#7C5CFF] text-white shadow-[0_0_8px_rgba(124,92,255,0.25)]' 
                          : isDark 
                            ? 'text-zinc-400 hover:text-white' 
                            : 'text-[#222222] hover:text-black'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {addItemType === 'timeline' ? (
                <form onSubmit={handleAddNewTimeline} className="space-y-3.5">
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-zinc-400' : 'text-[#222222]'}`}>
                      Event Activity Name
                    </label>
                    <input
                      required
                      type="text"
                      className={`w-full px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none transition-colors border ${
                        isDark 
                          ? 'bg-[#0A0A0A] border-[#7C5CFF]/20 focus:border-[#7C5CFF] text-white placeholder-zinc-700' 
                          : 'bg-[#F8F8FA] border-[#E5E7EB] focus:border-[#7C5CFF] text-black placeholder-gray-400'
                      }`}
                      placeholder="e.g. Morning Stretch Workout"
                      value={newEventTitle}
                      onChange={e => setNewEventTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-zinc-400' : 'text-[#222222]'}`}>
                      Time Frame Span
                    </label>
                    <input
                      required
                      type="text"
                      className={`w-full px-3 py-2 rounded-lg text-xs font-mono focus:outline-none transition-colors border ${
                        isDark 
                          ? 'bg-[#0A0A0A] border-[#7C5CFF]/20 focus:border-[#7C5CFF] text-white placeholder-zinc-700' 
                          : 'bg-[#F8F8FA] border-[#E5E7EB] focus:border-[#7C5CFF] text-black placeholder-gray-400'
                      }`}
                      placeholder="e.g. 05:40–06:15 PM"
                      value={newEventTime}
                      onChange={e => setNewEventTime(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#7C5CFF] hover:bg-[#6C4BE6] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(124,92,255,0.2)] cursor-pointer"
                  >
                    Add to Schedule
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddNewTask} className="space-y-3.5">
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isDark ? 'text-zinc-400' : 'text-[#222222]'}`}>
                      Task Content
                    </label>
                    <input
                      required
                      type="text"
                      className={`w-full px-3 py-2 rounded-lg text-xs font-semibold focus:outline-none transition-colors border ${
                        isDark 
                          ? 'bg-[#0A0A0A] border-[#7C5CFF]/20 focus:border-[#7C5CFF] text-white placeholder-zinc-700' 
                          : 'bg-[#F8F8FA] border-[#E5E7EB] focus:border-[#7C5CFF] text-black placeholder-gray-400'
                      }`}
                      placeholder="e.g. Read 15 pages book"
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#7C5CFF] hover:bg-[#6C4BE6] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(124,92,255,0.2)] cursor-pointer"
                  >
                    Add Board Item
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
