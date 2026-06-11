import React, { useState, useEffect, useRef } from 'react';
import { Habit, HabitLog } from '../types';
import { 
  Plus, 
  X, 
  CalendarDays, 
  Sparkles, 
  Trash2, 
  MoreVertical, 
  Copy, 
  Clock, 
  Edit3,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Format date helper
const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface HabitDashboardProps {
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  habitLogs: HabitLog;
  toggleHabitLog: (habitId: string, dateStr: string) => void;
  selectedDate: string;
  setSelectedDate: (dateStr: string) => void;
  isDark?: boolean;
}

export default function HabitDashboard({
  habits,
  setHabits,
  habitLogs,
  toggleHabitLog,
  selectedDate,
  setSelectedDate,
  isDark = true,
}: HabitDashboardProps) {
  const todayDate = getLocalDateString(new Date());

  // State-based guards & visual transition trackers
  const [navDirection, setNavDirection] = useState<'forward' | 'backward' | 'today'>('forward');
  const [isNavigating, setIsNavigating] = useState(false);
  const calendarInputRef = useRef<HTMLInputElement>(null);

  // Validate date format strictly YYYY-MM-DD
  const isValidDateString = (dateStr: string): boolean => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    const d = new Date(year, month - 1, day);
    return !isNaN(d.getTime());
  };

  // Date manipulation helper to avoid timezone offset quirks & validate inputs
  const addDays = (dateStr: string, days: number): string => {
    const validStr = isValidDateString(dateStr) ? dateStr : todayDate;
    const parts = validStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return getLocalDateString(date);
  };

  // Master handler functions
  const goToPreviousDay = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setNavDirection('backward');
    const validPrev = isValidDateString(selectedDate) ? selectedDate : todayDate;
    setSelectedDate(addDays(validPrev, -1));
    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  const goToNextDay = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setNavDirection('forward');
    const validPrev = isValidDateString(selectedDate) ? selectedDate : todayDate;
    setSelectedDate(addDays(validPrev, 1));
    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  const goToToday = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    if (selectedDate !== todayDate) {
      setNavDirection('today');
    }
    setSelectedDate(todayDate);
    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  const openCalendar = () => {
    if (calendarInputRef.current) {
      try {
        if (typeof calendarInputRef.current.showPicker === 'function') {
          calendarInputRef.current.showPicker();
        } else {
          calendarInputRef.current.click();
        }
      } catch (err) {
        calendarInputRef.current.click();
      }
    }
  };

  // Mobile active action menu tracking
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);

  // Modal triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSetTimeModal, setShowSetTimeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetHabit, setTargetHabit] = useState<Habit | null>(null);

  // Form states
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('🧘');
  const [newHabitTime, setNewHabitTime] = useState('07:00 AM');
  const [newHabitGoal, setNewHabitGoal] = useState('Daily');
  const [newHabitCategory, setNewHabitCategory] = useState('Wellness');

  // Edit fields
  const [editHabitName, setEditHabitName] = useState('');
  const [editHabitEmoji, setEditHabitEmoji] = useState('🧘');
  const [editHabitGoal, setEditHabitGoal] = useState('Daily');
  const [editHabitCategory, setEditHabitCategory] = useState('Wellness');
  const [editHabitTime, setEditHabitTime] = useState('');

  // Swipe Gestures for Mobile Week Navigation
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextDay();
    } else if (isRightSwipe) {
      goToPreviousDay();
    }
  };

  // Generate 7 days starting from startStr (selectedDate)
  const getUpcomingDays = (startStr: string) => {
    const validStr = isValidDateString(startStr) ? startStr : todayDate;
    const parts = validStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const current = new Date(year, month - 1, day);
    const result = [];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      d.setDate(current.getDate() + i);
      const dStr = getLocalDateString(d);
      
      let dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(); // "MON", "TUE"...
      if (dStr === todayDate) {
        dayName = "TODAY";
      }
      
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Jun 4"
      
      result.push({
        dateStr: dStr,
        dayName,
        monthDay,
      });
    }
    return result;
  };

  const upcomingDays = getUpcomingDays(selectedDate);

  const handlePrevDays = () => {
    goToPreviousDay();
  };

  const handleNextDays = () => {
    goToNextDay();
  };

  const handleJumpToday = () => {
    goToToday();
  };

  // Streak calculator
  const getHabitCurrentStreak = (habitId: string) => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const dateStr = getLocalDateString(d);
      const isDone = habitLogs[habitId]?.[dateStr] === true;
      if (isDone) {
        streak++;
      } else {
        if (i === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (habitLogs[habitId]?.[getLocalDateString(yesterday)] === true) {
            continue;
          }
        }
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    
    const staticStreak = habits.find(h => h.id === habitId)?.streak || 0;
    return Math.max(streak, staticStreak);
  };

  const getWeeklyAnalytics = () => {
    let totalPossible = upcomingDays.length * habits.length;
    let totalCompleted = 0;
    
    upcomingDays.forEach(day => {
      habits.forEach(h => {
        if (habitLogs[h.id]?.[day.dateStr] === true) {
          totalCompleted++;
        }
      });
    });
    
    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    const maxCurrentStreak = habits.length > 0 ? Math.max(...habits.map(h => getHabitCurrentStreak(h.id))) : 0;
    const maxLongestStreak = habits.length > 0 
      ? Math.max(...habits.map(h => Math.max(getHabitCurrentStreak(h.id), h.streak || 0, 12))) 
      : 0;

    return {
      completionRate,
      maxCurrentStreak,
      maxLongestStreak,
    };
  };

  const analytics = getWeeklyAnalytics();

  // Tasks handlers
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    
    const newObj: Habit = {
      id: `task-${Date.now()}`,
      name: newHabitName.trim(),
      emoji: newHabitEmoji.trim() || '🧘',
      streak: 0,
      goal: newHabitGoal.trim() || 'Daily',
      category: newHabitCategory,
      time: newHabitTime.trim() || 'All Day'
    };
    
    setHabits([...habits, newObj]);
    setNewHabitName('');
    setNewHabitEmoji('🧘');
    setNewHabitTime('07:00 AM');
    setNewHabitGoal('Daily');
    setShowAddModal(false);
  };

  const openEditModal = (h: Habit) => {
    setTargetHabit(h);
    setEditHabitName(h.name);
    setEditHabitEmoji(h.emoji || '🧘');
    setEditHabitGoal(h.goal || 'Daily');
    setEditHabitCategory(h.category || 'Wellness');
    setEditHabitTime(h.time || 'All Day');
    setShowEditModal(true);
    setActiveMenuHabitId(null);
  };

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHabit || !editHabitName.trim()) return;

    setHabits(
      habits.map(h => h.id === targetHabit.id ? { 
        ...h, 
        name: editHabitName.trim(),
        emoji: editHabitEmoji.trim() || '🧘',
        goal: editHabitGoal.trim() || 'Daily',
        category: editHabitCategory,
        time: editHabitTime.trim() || 'All Day'
      } : h)
    );
    setShowEditModal(false);
    setTargetHabit(null);
  };

  const openSetTimeModal = (h: Habit) => {
    setTargetHabit(h);
    setEditHabitTime(h.time || 'All Day');
    setShowSetTimeModal(true);
    setActiveMenuHabitId(null);
  };

  const handleSetTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetHabit) return;

    setHabits(
      habits.map(h => h.id === targetHabit.id ? { ...h, time: editHabitTime.trim() || 'All Day' } : h)
    );
    setShowSetTimeModal(false);
    setTargetHabit(null);
  };

  const handleDuplicateTask = (h: Habit) => {
    const newId = `task-${Date.now()}`;
    const duplicated: Habit = {
      ...h,
      id: newId,
      name: `${h.name} (Copy)`,
      streak: 0,
    };
    setHabits([...habits, duplicated]);
    setActiveMenuHabitId(null);
  };

  const openDeleteModal = (h: Habit) => {
    setTargetHabit(h);
    setShowDeleteModal(true);
    setActiveMenuHabitId(null);
  };

  const handleDeleteTask = () => {
    if (!targetHabit) return;
    setHabits(habits.filter(h => h.id !== targetHabit.id));
    setShowDeleteModal(false);
    setTargetHabit(null);
  };

  return (
    <div className="font-sans space-y-6 text-[var(--text-primary)]">
      
      <div>
        <h2 className="font-sans font-bold text-2xl md:text-3xl text-[var(--text-primary)] tracking-tight">Today’s Schedule</h2>
      </div>

      {/* 1. Header & Navigation Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-start gap-4 border-b border-[var(--border-color)] pb-5">
        
        {/* Navigation Buttons: [ Previous ] [ Calendar ] [ Today ] [ Next ] */}
        <div className="flex items-center space-x-1 sm:space-x-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 rounded-xl select-none self-start md:self-auto shrink-0">
          <button 
            onClick={goToPreviousDay}
            disabled={isNavigating}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isNavigating 
                ? 'opacity-50 cursor-not-allowed text-[#4B4B52]' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            Previous
          </button>
          
          {/* Calendar trigger overlay */}
          <div className="relative">
            <button 
              onClick={openCalendar}
              disabled={isNavigating}
              className={`px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-primary)] flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isNavigating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[var(--card-hover)]'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-[#6D5FFC]" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <input 
              ref={calendarInputRef}
              type="date" 
              className="sr-only pointer-events-none"
              value={selectedDate}
              onChange={(e) => {
                if (isNavigating) return;
                const val = e.target.value;
                if (val && isValidDateString(val)) {
                  setIsNavigating(true);
                  if (val !== selectedDate) {
                    setNavDirection(val > selectedDate ? 'forward' : 'backward');
                  }
                  setSelectedDate(val);
                  setTimeout(() => {
                    setIsNavigating(false);
                  }, 300);
                }
              }}
            />
          </div>

          <button 
            onClick={goToToday}
            disabled={isNavigating}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isNavigating 
                ? 'opacity-50 cursor-not-allowed text-[#4B4B52]' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            Today
          </button>

          <button 
            onClick={goToNextDay}
            disabled={isNavigating}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isNavigating 
                ? 'opacity-50 cursor-not-allowed text-[#4B4B52]' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* 2. Weekly Navigation Strip starting with TODAY / Selected start */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase select-none">
          <span>Weekly Schedule Strip (Today & Upcoming)</span>
          <span className="hidden md:inline font-sans opacity-65 text-[10px]">Selected: {selectedDate}</span>
          <span className="md:hidden font-sans opacity-80 animate-pulse text-[10px]">← Swipe left/right for other dates →</span>
        </div>
        
        {/* Strip container with touch-friendly navigation & smooth slide/fade animation */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div 
              key={selectedDate}
              initial={
                navDirection === 'today'
                  ? { opacity: 0, scale: 0.95 }
                  : { opacity: 0, x: navDirection === 'forward' ? 50 : -50 }
              }
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={
                navDirection === 'today'
                  ? { opacity: 0, scale: 0.95 }
                  : { opacity: 0, x: navDirection === 'forward' ? -50 : 50 }
              }
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="grid grid-cols-7 gap-1.5 sm:gap-2.5 select-none"
            >
              {upcomingDays.map((day) => {
                const isSelected = day.dateStr === selectedDate;
                const isToday = day.dateStr === todayDate;
                
                return (
                  <button
                    key={day.dateStr}
                    disabled={isNavigating}
                    onClick={() => {
                      if (!isNavigating) {
                        setIsNavigating(true);
                        const previousSec = selectedDate;
                        if (previousSec !== day.dateStr && isValidDateString(day.dateStr)) {
                          setNavDirection(day.dateStr > previousSec ? 'forward' : 'backward');
                        }
                        setSelectedDate(day.dateStr);
                        setTimeout(() => {
                          setIsNavigating(false);
                        }, 300);
                      }
                    }}
                    className={`py-3 px-1 sm:p-4 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      isSelected 
                        ? 'border-[#6D5FFC] bg-[#6D5FFC]/10 text-white shadow-[0_0_15px_rgba(109,95,252,0.3)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-color)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider leading-none ${
                      isSelected ? 'text-[#6D5FFC]' : isToday ? 'text-[var(--text-primary)]' : ''
                    }`}>
                      {day.dayName}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold mt-1.5 leading-none">
                      {day.monthDay}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Task List Title & Add Button */}
      <div className="flex items-center justify-between pt-3">
        <h2 className="text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase font-sans">
          ROUTINES LIST
        </h2>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 bg-[#6D5FFC] hover:bg-[#6D5FFC]/95 text-white rounded-xl px-4 py-2 font-semibold text-xs transition-transform cursor-pointer shadow-[0_0_15px_rgba(109,95,252,0.2)] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* 4. Filtered list of task cards (No percentage/priority badges) */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-12 text-center text-[var(--text-secondary)] select-none">
            <Sparkles className="h-9 w-9 text-[#6D5FFC] mx-auto mb-3 opacity-40 animate-pulse" />
            <p className="text-xs font-bold">No tasks found inside your LifeOS routines.</p>
            <p className="text-[10px] text-gray-500 mt-1">Deploy tasks using the CTA button above.</p>
          </div>
        ) : (
          habits.map(habit => {
            const isCompleted = habitLogs[habit.id]?.[selectedDate] === true;
            
            return (
              <div 
                key={habit.id}
                className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl hover:border-[#6D5FFC]/30 transition-all flex items-center justify-between gap-3 relative group"
              >
                {/* Left: Icon and Details */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  {/* Beautiful customized square icon holder with Glow */}
                  <div className="w-11 h-11 shrink-0 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl flex items-center justify-center text-lg shadow-[0_0_10px_rgba(109,95,252,0.15)] select-none">
                    {habit.emoji || '📅'}
                  </div>
                  
                  {/* Content details */}
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide truncate">
                      {habit.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans truncate">
                      {habit.goal || 'Daily'} at {habit.time || 'All Day'}
                    </p>
                  </div>
                </div>

                {/* Right: Quick Tools, Active Menu dropdown, and Check Status toggle mark */}
                <div className="flex items-center space-x-2 shrink-0">
                  
                  {/* Three-Dot Action Dropdown Menu */}
                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenuHabitId(activeMenuHabitId === habit.id ? null : habit.id)} 
                      className="p-2 bg-[var(--bg-primary)] hover:bg-[var(--card-hover)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      title="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {activeMenuHabitId === habit.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenuHabitId(null)} />
                        <div className="absolute right-0 mt-1.5 w-40 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-1 shadow-2xl z-50">
                          <button 
                            onClick={() => openEditModal(habit)}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#6D5FFC]/10 rounded-lg transition-colors flex items-center space-x-1.5"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-[#6D5FFC]" />
                            <span>Edit Details</span>
                          </button>
                          
                          <button 
                            onClick={() => openSetTimeModal(habit)}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#6D5FFC]/10 rounded-lg transition-colors flex items-center space-x-1.5"
                          >
                            <Clock className="h-3.5 w-3.5 text-blue-400" />
                            <span>Set Time</span>
                          </button>

                          <button 
                            onClick={() => handleDuplicateTask(habit)}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#6D5FFC]/10 rounded-lg transition-colors flex items-center space-x-1.5"
                          >
                            <Copy className="h-3.5 w-3.5 text-amber-500" />
                            <span>Duplicate</span>
                          </button>

                          <button 
                            onClick={() => openDeleteModal(habit)}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center space-x-1.5 border-t border-[var(--border-color)] mt-1"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Completion state toggle: only 2 states. White / Green check inside circle */}
                  <button 
                    onClick={() => toggleHabitLog(habit.id, selectedDate)}
                    className="p-1 cursor-pointer transition-all active:scale-90"
                    title={isCompleted ? "Mark Not Completed" : "Mark Completed"}
                  >
                    {isCompleted ? (
                      <div className="h-7 w-7 rounded-full bg-[#22C55E]/15 border-2 border-[#22C55E] flex items-center justify-center text-[#22C55E] font-bold text-xs shadow-[0_0_12px_rgba(34,197,94,0.35)]">
                        ✓
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full border-2 border-[var(--border-color)] hover:border-[#6D5FFC] bg-transparent" />
                    )}
                  </button>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Weekly Task Analytics Section */}
      <div className="pt-6 border-t border-[var(--border-color)] space-y-4">
        <h3 className="text-xs font-black text-[var(--text-secondary)] tracking-widest uppercase font-sans">
          WEEKLY TASK ANALYTICS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex flex-col justify-between hover:border-[#6D5FFC]/25 transition-all">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-sans">Completion Rate</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-2xl font-bold text-[var(--text-primary)] font-sans">{analytics.completionRate}%</span>
              <span className="text-[10px] text-[#22C55E] font-semibold font-sans">This Week</span>
            </div>
          </div>
          
          <div className="p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex flex-col justify-between hover:border-[#6D5FFC]/25 transition-all">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-sans">Current Streak</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-2xl font-bold text-[var(--text-primary)] font-sans">{analytics.maxCurrentStreak} Days</span>
              <span className="text-[10px] text-[#6D5FFC] font-semibold font-sans">Active</span>
            </div>
          </div>
          
          <div className="p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex flex-col justify-between hover:border-[#6D5FFC]/25 transition-all">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-sans">Longest Streak</span>
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-2xl font-bold text-[var(--text-primary)] font-sans">{analytics.maxLongestStreak} Days</span>
              <span className="text-[10px] text-amber-500 font-semibold font-sans">🏆 record</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Modals (Dark Premium UI Style) */}
      <AnimatePresence>
        {/* Modal 1: Add New Routine Task */}
        {showAddModal && (
          <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050505] border border-[#28282F] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#28282F] pb-3 select-none">
                <h3 className="text-sm font-semibold tracking-wider text-white uppercase">➕ Add New Routine Task</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Task Description</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="E.g. Meditation (10m)"
                    className="w-full bg-[#111118] border border-[#28282F] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:border-[#6D5FFC] outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-1.5">Task Icon / Emoji</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={newHabitEmoji}
                      onChange={(e) => setNewHabitEmoji(e.target.value)}
                      placeholder="🧘"
                      className="w-full bg-[#111118] border border-[#28282F] rounded-xl px-3 py-2 text-center text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Task Time</label>
                    <input
                      type="text"
                      required
                      value={newHabitTime}
                      onChange={(e) => setNewHabitTime(e.target.value)}
                      placeholder="E.g. 07:00 AM or All Day"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] outline-none focus:border-[#6D5FFC] text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Goal Frequency</label>
                    <input
                      type="text"
                      required
                      value={newHabitGoal}
                      onChange={(e) => setNewHabitGoal(e.target.value)}
                      placeholder="E.g. Daily"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] outline-none focus:border-[#6D5FFC] text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Category</label>
                    <select
                      value={newHabitCategory}
                      onChange={(e) => setNewHabitCategory(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
                    >
                      <option value="Wellness">Wellness</option>
                      <option value="Mindset">Mindset</option>
                      <option value="Career">Career Development</option>
                      <option value="Relationships">Social Relations</option>
                      <option value="Leisure">Travel & Leisure</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-[var(--border-color)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#6D5FFC] hover:bg-[#6D5FFC]/90 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-[0_0_12px_rgba(109,95,252,0.2)]"
                  >
                    Deploy Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal 2: Edit Routine Details / Rename */}
        {showEditModal && targetHabit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-sm font-semibold tracking-wider text-[var(--text-primary)] uppercase">✏️ Edit Routine Details</h3>
                <button onClick={() => setShowEditModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditTask} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Task Name</label>
                  <input
                    type="text"
                    required
                    value={editHabitName}
                    onChange={(e) => setEditHabitName(e.target.value)}
                    placeholder="New Task Name"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-[var(--text-primary)] placeholder-gray-500 focus:border-[#6D5FFC] outline-none transition-all text-sm font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Task Icon / Emoji</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={editHabitEmoji}
                      onChange={(e) => setEditHabitEmoji(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-center text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Goal Frequency</label>
                    <input
                      type="text"
                      required
                      value={editHabitGoal}
                      onChange={(e) => setEditHabitGoal(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] outline-none focus:border-[#6D5FFC] text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Category</label>
                    <select
                      value={editHabitCategory}
                      onChange={(e) => setEditHabitCategory(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#6D5FFC]"
                    >
                      <option value="Wellness">Wellness</option>
                      <option value="Mindset">Mindset</option>
                      <option value="Career">Career Development</option>
                      <option value="Relationships">Social Relations</option>
                      <option value="Leisure">Travel & Leisure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Task Time</label>
                    <input
                      type="text"
                      required
                      value={editHabitTime}
                      onChange={(e) => setEditHabitTime(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-[var(--text-primary)] outline-none focus:border-[#6D5FFC] text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-[var(--border-color)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#6D5FFC] hover:bg-[#6D5FFC]/90 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-[0_0_12px_rgba(109,95,252,0.2)]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal 3: Set Time Specifically */}
        {showSetTimeModal && targetHabit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="text-sm font-semibold tracking-wider text-[var(--text-primary)]">⏰ Edit Delivery Time</h3>
                <button onClick={() => setShowSetTimeModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSetTime} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Scheduled Time</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editHabitTime}
                    onChange={(e) => setEditHabitTime(e.target.value)}
                    placeholder="E.g. 05:00 PM or All Day"
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-[var(--text-primary)] placeholder-gray-500 focus:border-[#6D5FFC] outline-none transition-all text-sm font-semibold"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Adjust how the scheduled target shows up on routines list.</p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setShowSetTimeModal(false)}
                    className="px-4 py-2 border border-[var(--border-color)] hover:bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#6D5FFC] hover:bg-[#6D5FFC]/90 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-[0_0_12px_rgba(109,95,252,0.2)]"
                  >
                    Save Time
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal 4: Delete Routine Confirmation */}
        {showDeleteModal && targetHabit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <div className="text-red-450 flex items-center space-x-2">
                <Trash2 className="h-5 w-5 shrink-0" />
                <h3 className="text-xs font-black tracking-widest uppercase">⚠️ Confirm Deletion</h3>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                Are you absolutely sure you want to delete <span className="font-bold text-[var(--text-primary)]">"{targetHabit.emoji} {targetHabit.name}"</span>?
                <span className="block font-bold text-red-400 mt-2">All recorded logs across selected calendar grids will be lost.</span>
              </p>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3.5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)] text-[var(--text-secondary)] text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  className="px-4 py-1.5 bg-red-650 hover:bg-red-600 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-[0_0_12px_rgba(220,38,38,0.25)]"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
