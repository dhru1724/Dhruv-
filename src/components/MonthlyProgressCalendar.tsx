import React, { useState, useEffect } from 'react';
import NotebookPencilIcon from './NotebookPencilIcon';
import { Task, Project, Habit, HabitLog, QuickNote } from '../types';
import { 
  Calendar, ChevronLeft, ChevronRight, CheckSquare, Sparkles, 
  Activity, CheckCircle2, TrendingUp, Filter, Trash2, Plus, Minus,
  BookOpen, DollarSign, Target, Award, ListChecks, ArrowLeft, ArrowRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Help helper for local date
const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface MonthlyProgressCalendarProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  habits: Habit[];
  habitLogs: HabitLog;
  toggleHabitLog: (habitId: string, dateStr: string) => void;
  quickNotes: QuickNote[];
  setQuickNotes: React.Dispatch<React.SetStateAction<QuickNote[]>>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthlyProgressCalendar({
  tasks,
  setTasks,
  projects,
  habits,
  habitLogs,
  toggleHabitLog,
  quickNotes,
  setQuickNotes,
  selectedDate,
  setSelectedDate
}: MonthlyProgressCalendarProps) {
  // Parse initial state from custom date or current date
  const initialDateObj = new Date(selectedDate + 'T12:00:00');
  const [currentYear, setCurrentYear] = useState<number>(() => {
    return isNaN(initialDateObj.getTime()) ? new Date().getFullYear() : initialDateObj.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    return isNaN(initialDateObj.getTime()) ? new Date().getMonth() : initialDateObj.getMonth();
  });

  // Filter option: display all, only tasks done, or days with items
  const [cellFilter, setCellFilter] = useState<'all' | 'with-items' | 'completed-only'>('all');

  // Local storage lists for custom date components: Journal, Expenses, Goals
  const [journals, setJournals] = useState<{ [date: string]: string }>(() => {
    const saved = localStorage.getItem('lifeos_calendar_journals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse calendar journals", e);
      }
    }
    return {};
  });

  const [expenses, setExpenses] = useState<{ [date: string]: Array<{ id: string; description: string; amount: number }> }>(() => {
    const saved = localStorage.getItem('lifeos_calendar_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse calendar expenses", e);
      }
    }
    return {};
  });

  const [goals, setGoals] = useState<{ [date: string]: Array<{ id: string; name: string; completed: boolean }> }>(() => {
    const saved = localStorage.getItem('lifeos_calendar_goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse calendar goals", e);
      }
    }
    return {};
  });

  // Keep synced to localStorage
  useEffect(() => {
    localStorage.setItem('lifeos_calendar_journals', JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem('lifeos_calendar_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('lifeos_calendar_goals', JSON.stringify(goals));
  }, [goals]);

  // Input fields state for adding new items in daily panel
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newGoalName, setNewGoalName] = useState('');
  const [newJournalText, setNewJournalText] = useState('');

  // Loaded journal text when date changes
  useEffect(() => {
    setNewJournalText(journals[selectedDate] || '');
  }, [selectedDate, journals]);

  // Handle month shifts
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Jump back to Today
  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(getLocalDateString(today));
  };

  // Step Selected Date backwards/forwards in History Integration
  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() - 1);
    const newDateStr = getLocalDateString(current);
    setSelectedDate(newDateStr);

    // Auto update current visible month if stepped out of view
    const nextDateObj = new Date(newDateStr + 'T12:00:00');
    setCurrentYear(nextDateObj.getFullYear());
    setCurrentMonth(nextDateObj.getMonth());
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + 1);
    const newDateStr = getLocalDateString(current);
    setSelectedDate(newDateStr);

    // Auto update current visible month if stepped out of view
    const nextDateObj = new Date(newDateStr + 'T12:00:00');
    setCurrentYear(nextDateObj.getFullYear());
    setCurrentMonth(nextDateObj.getMonth());
  };

  // Days layout calculation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Shifts Mon index to 0, Sun to 6
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysArray.push(d);
  }

  // Date evaluations helper
  const getDayMetadata = (dateStr: string) => {
    // Tasks scheduled
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const totalT = dayTasks.length;
    const completedT = dayTasks.filter(t => t.status === 'Completed').length;

    // Habits checked
    const checkedHabits = habits.filter(h => habitLogs[h.id]?.[dateStr] === true);
    const totalH = checkedHabits.length;

    // Quick notes + journals count
    const notesCount = quickNotes.filter(n => n.createdAt.slice(0, 10) === dateStr).length;
    const journalExists = journals[dateStr] ? 1 : 0;
    const totalNotesAndJournals = notesCount + journalExists;

    // Custom Local Goals
    const dayGoals = goals[dateStr] || [];
    const totalG = dayGoals.length;
    const completedG = dayGoals.filter(g => g.completed).length;

    // Custom Local Expenses
    const dayExpenses = expenses[dateStr] || [];

    // Total counts
    const totalItems = totalT + habits.length + totalG;
    const completedItems = completedT + totalH + completedG;

    // Scoring
    const dailyScore = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Resolve Indicator: 🟢 Completed, 🟡 Partial Progress, 🔴 Missed, 🔵 Scheduled Activities
    let status: 'completed' | 'partial' | 'missed' | 'scheduled' | 'none' = 'none';
    
    if (totalT > 0 || totalH > 0 || totalG > 0) {
      if (completedItems === totalItems && totalItems > 0) {
        status = 'completed';
      } else if (completedItems > 0) {
        status = 'partial';
      } else {
        // Items are due but zero completed
        if (totalT > 0 || totalG > 0) {
          // If tasks are open/pending
          status = 'scheduled';
        } else {
          status = 'missed';
        }
      }
    }

    return {
      tasksCount: totalT,
      completedTasks: completedT,
      habitsCheckedCount: totalH,
      notesAndJournalsCount: totalNotesAndJournals,
      expensesCount: dayExpenses.length,
      goalsCount: totalG,
      completedGoals: completedG,
      dailyScore,
      status,
      hasElements: totalT > 0 || totalH > 0 || totalNotesAndJournals > 0 || dayExpenses.length > 0 || totalG > 0
    };
  };

  // Calculate Monthly Stats
  const getMonthlyStats = () => {
    let perfectDays = 0;
    let trackableDays = 0;
    let totalHabitsCheckedThisMonth = 0;
    let totalTasksCompletedThisMonth = 0;
    let totalScheduledTasksThisMonth = 0;

    for (let d = 1; d <= totalDays; d++) {
      const monthPadded = String(currentMonth + 1).padStart(2, '0');
      const dayPadded = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthPadded}-${dayPadded}`;
      const meta = getDayMetadata(dateStr);

      if (meta.hasElements) {
        trackableDays++;
        if (meta.status === 'completed') {
          perfectDays++;
        }
      }

      totalHabitsCheckedThisMonth += meta.habitsCheckedCount;
      totalTasksCompletedThisMonth += meta.completedTasks;
      totalScheduledTasksThisMonth += meta.tasksCount;
    }

    const taskPercentage = totalScheduledTasksThisMonth > 0 
      ? Math.round((totalTasksCompletedThisMonth / totalScheduledTasksThisMonth) * 100) 
      : 0;

    return {
      perfectDays,
      trackableDays,
      totalHabitsCheckedThisMonth,
      taskPercentage,
      totalTasksCompletedThisMonth,
      totalScheduledTasksThisMonth
    };
  };

  const monthlyStats = getMonthlyStats();
  const todayStr = getLocalDateString();

  // Selected Date Stats Definitions for rendering in Summary Panel
  const selectedMeta = getDayMetadata(selectedDate);
  const selectedTasks = tasks.filter(t => t.dueDate === selectedDate);
  const selectedGoals = goals[selectedDate] || [];
  const selectedExpenses = expenses[selectedDate] || [];
  const selectedNotes = quickNotes.filter(n => n.createdAt.slice(0, 10) === selectedDate);

  // Toggle tasks check
  const handleToggleTaskStatus = (task: Task) => {
    const updatedStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: updatedStatus } : t));
  };

  // Add custom elements of local selected date
  const handleSaveJournal = () => {
    if (newJournalText.trim()) {
      setJournals(prev => ({
        ...prev,
        [selectedDate]: newJournalText.trim()
      }));
    } else {
      const updated = { ...journals };
      delete updated[selectedDate];
      setJournals(updated);
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) return;
    const newGoal = {
      id: `goal-${Date.now()}`,
      name: newGoalName.trim(),
      completed: false
    };
    setGoals(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newGoal]
    }));
    setNewGoalName('');
  };

  const handleToggleGoal = (goalId: string) => {
    setGoals(prev => {
      const currentList = prev[selectedDate] || [];
      return {
        ...prev,
        [selectedDate]: currentList.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g)
      };
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => {
      const currentList = prev[selectedDate] || [];
      return {
        ...prev,
        [selectedDate]: currentList.filter(g => g.id !== goalId)
      };
    });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc.trim() || !newExpenseAmount.trim()) return;
    const val = parseFloat(newExpenseAmount);
    if (isNaN(val)) return;

    const newExp = {
      id: `exp-${Date.now()}`,
      description: newExpenseDesc.trim(),
      amount: val
    };

    setExpenses(prev => ({
      ...prev,
      [selectedDate]: [...(prev[selectedDate] || []), newExp]
    }));
    setNewExpenseDesc('');
    setNewExpenseAmount('');
  };

  const handleDeleteExpense = (expId: string) => {
    setExpenses(prev => {
      const currentList = prev[selectedDate] || [];
      return {
        ...prev,
        [selectedDate]: currentList.filter(e => e.id !== expId)
      };
    });
  };

  // Build calendar summary score: Average of Habits + Tasks + Goals for that specific date
  const dayCompletionScore = (() => {
    const totalT = selectedTasks.length;
    const doneT = selectedTasks.filter(t => t.status === 'Completed').length;
    
    // Checked habits count for this specific day
    const doneH = habits.filter(h => habitLogs[h.id]?.[selectedDate] === true).length;
    const totalH = habits.length;

    const doneG = selectedGoals.filter(g => g.completed).length;
    const totalG = selectedGoals.length;

    const grandTotal = totalT + totalH + totalG;
    const grandCompleted = doneT + doneH + doneG;

    return grandTotal > 0 ? Math.round((grandCompleted / grandTotal) * 100) : 0;
  })();

  return (
    <div className="space-y-6 text-[#E3E2E0] font-sans bg-black/40 min-h-screen p-1 sm:p-4 rounded-3xl">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-5 rounded-2xl glass bg-[#0a0b10]/80 border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Glow Element */}
        <div className="absolute top-[-50%] right-[-10%] w-[200px] h-[200px] rounded-full bg-blue-500/10 blur-[50px] pointer-events-none" />
        <div className="absolute bottom-[-50%] left-[-10%] w-[150px] h-[150px] rounded-full bg-purple-500/10 blur-[40px] pointer-events-none" />

        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shadow-md">
            <Calendar className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold font-display text-white tracking-tight flex items-center gap-1.5">
              Interactive LifeOS Calendar
            </h2>
            <p className="text-xs text-gray-400 font-mono tracking-wide mt-0.5">
              Sync habits, schedule milestones & review comprehensive day logs
            </p>
          </div>
        </div>

        {/* Calendar Switch/Nav Controls */}
        <div className="flex flex-wrap items-center gap-2 select-none self-center">
          {/* Today Button */}
          <button
            onClick={handleGoToToday}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#13141f] border border-white/10 text-blue-400 hover:text-blue-300 hover:border-blue-500/30 hover:bg-[#1a1b2d] active:scale-95 transition-all cursor-pointer shadow-sm"
            title="Navigate to today"
          >
            Today
          </button>

          <div className="flex items-center bg-[#13141f] border border-white/5 rounded-xl p-0.5">
            {/* Prev month */}
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Month/Year selector dropboxes */}
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              className="px-1.5 py-1 text-xs font-bold text-white bg-transparent border-none focus:ring-0 cursor-pointer focus:outline-none"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx} className="bg-[#13141c] text-white font-sans">{m}</option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="px-1.5 py-1 text-xs font-bold text-white bg-transparent border-none focus:ring-0 cursor-pointer focus:outline-none pr-3"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y} className="bg-[#13141c] text-white font-sans">{y}</option>
              ))}
            </select>

            {/* Next month */}
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Trigger button */}
          <div className="relative group/filter">
            <button className="p-1.5 rounded-xl bg-[#13141f] border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all cursor-pointer flex items-center justify-center">
              <Filter className="h-4 w-4" />
            </button>
            <div className="opacity-0 scale-95 pointer-events-none group-hover/filter:opacity-100 group-hover/filter:scale-100 group-hover/filter:pointer-events-auto absolute right-0 top-full mt-2 w-48 bg-[#161720] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 transition-all duration-150">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block px-2.5 py-1">Filter calendar cells</span>
              <button
                onClick={() => setCellFilter('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${cellFilter === 'all' ? 'bg-indigo-500/25 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>Show All Days</span>
                {cellFilter === 'all' && <Check className="h-3 w-3 text-indigo-400" />}
              </button>
              <button
                onClick={() => setCellFilter('with-items')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${cellFilter === 'with-items' ? 'bg-indigo-500/25 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>Tracked Days Only</span>
                {cellFilter === 'with-items' && <Check className="h-3 w-3 text-indigo-400" />}
              </button>
              <button
                onClick={() => setCellFilter('completed-only')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${cellFilter === 'completed-only' ? 'bg-indigo-500/25 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>Perfect Days Only</span>
                {cellFilter === 'completed-only' && <Check className="h-3 w-3 text-indigo-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month Completion Rate card */}
        <div className="p-4 rounded-2xl glass bg-[#0a0b10]/40 border border-white/5 hover:border-blue-500/35 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-display">Target Competency</span>
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-white font-mono">{monthlyStats.taskPercentage}%</span>
            <span className="text-[10px] text-gray-400 font-mono">({monthlyStats.totalTasksCompletedThisMonth}/{monthlyStats.totalScheduledTasksThisMonth} tasks)</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-2.5">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${monthlyStats.taskPercentage}%` }} />
          </div>
        </div>

        {/* Perfect Adherence Days Card */}
        <div className="p-4 rounded-2xl glass bg-[#0a0b10]/40 border border-white/5 hover:border-emerald-500/35 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-display">Perfect Target Days</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-emerald-400 font-mono">★ {monthlyStats.perfectDays}</span>
            <span className="text-[10px] text-gray-400 font-mono">out of {monthlyStats.trackableDays} tracked days</span>
          </div>
          <span className="text-[9.5px] text-gray-500 font-mono mt-2 block">100% completed stats for tasks/checklists</span>
        </div>

        {/* Habit Checks Tracker card */}
        <div className="p-4 rounded-2xl glass bg-[#0a0b10]/40 border border-white/5 hover:border-purple-500/35 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-display">Task Check-ins</span>
            <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-white font-mono">{monthlyStats.totalHabitsCheckedThisMonth}</span>
            <span className="text-[10px] text-gray-400 font-mono">checked logs in {MONTHS[currentMonth]}</span>
          </div>
          <span className="text-[9.5px] text-gray-500 font-mono mt-2 block">Tasks logged daily on past weeks</span>
        </div>

        {/* Legend status guide card */}
        <div className="p-4 rounded-2xl glass bg-[#0a0b10]/40 border border-white/5 hover:border-pink-500/35 transition-all duration-300 flex flex-col justify-between">
          <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider font-display mb-1.5 block">Day Status Indicators Guide</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9.5px] font-mono text-gray-300">
            <div className="flex items-center space-x-1">
              <span className="text-emerald-500">🟢</span>
              <span className="truncate">Completed (100%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-amber-500">🟡</span>
              <span className="truncate">Partial Progress</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-blue-500">🔵</span>
              <span className="truncate">Incomplete Scheduled</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-red-500">🔴</span>
              <span className="truncate">Missed Swipes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CALENDAR GRID PANEL CHASSIS */}
      <div className="p-6 rounded-2xl border border-white/5 glass bg-[#05060b]/90 shadow-2xl relative">
        {/* Absolute glow design accent */}
        <div className="absolute top-0 left-1/4 w-[120px] h-[100px] bg-indigo-500/5 blur-[45px] pointer-events-none" />

        {/* Calendar Title & Month Selector info tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mb-4 gap-2">
          <span className="text-base sm:text-lg font-bold font-display text-white tracking-widest uppercase">
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <span className="text-[10px] sm:text-xs text-gray-400 font-mono">
            ★ Pick any box to view daily summary notes, journal entries, goals and financials
          </span>
        </div>

        {/* Calendar Grid Header (DAYS OF THE WEEK LABEL) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center mb-2.5">
          {DAYS_OF_WEEK.map((day, dIdx) => {
            const isWeekend = day === 'Sat' || day === 'Sun';
            return (
              <span 
                key={day} 
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1 select-none ${
                  isWeekend ? 'text-purple-400 font-extrabold' : 'text-gray-400'
                }`}
              >
                {day}
              </span>
            );
          })}
        </div>

        {/* Calendar Cells Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-3.5">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return (
                <div 
                  key={`empty-${idx}`} 
                  className="aspect-square rounded-xl bg-white/[0.01] border border-transparent" 
                />
              );
            }

            const monthPadded = String(currentMonth + 1).padStart(2, '0');
            const dayPadded = String(day).padStart(2, '0');
            const dateStr = `${currentYear}-${monthPadded}-${dayPadded}`;

            // Resolve states
            const isToday = dateStr === todayStr;
            const isSelectedFocus = dateStr === selectedDate;
            const meta = getDayMetadata(dateStr);

            // Weekend checker
            const dateObj = new Date(currentYear, currentMonth, day);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            // Apply filter rules
            if (cellFilter === 'with-items' && !meta.hasElements) {
              return (
                <div 
                  key={`cell-filtered-${day}`}
                  onClick={() => setSelectedDate(dateStr)}
                  className="aspect-square rounded-xl border border-white/5 bg-white/[0.01] p-2 flex flex-col justify-start opacity-30 cursor-pointer select-none"
                >
                  <span className="text-xs font-semibold text-gray-500">{day}</span>
                </div>
              );
            }

            if (cellFilter === 'completed-only' && meta.status !== 'completed') {
              return (
                <div 
                  key={`cell-filtered-done-${day}`}
                  onClick={() => setSelectedDate(dateStr)}
                  className="aspect-square rounded-xl border border-white/5 bg-white/[0.01] p-2 flex flex-col justify-start opacity-30 cursor-pointer select-none"
                >
                  <span className="text-xs font-semibold text-gray-500">{day}</span>
                </div>
              );
            }

            // Cell background styling based on states
            let cellBgClass = 'bg-[#121319]/40 border-white/5 hover:border-white/25';
            
            if (isWeekend) {
              cellBgClass = 'bg-[#18121f]/35 border-purple-950/20 hover:border-purple-800/30';
            }
            if (isToday) {
              cellBgClass = 'bg-[#162130]/60 ring-2 ring-blue-500/40 border-blue-450/60 shadow-lg shadow-blue-500/10 text-white';
            }
            if (isSelectedFocus) {
              cellBgClass = 'bg-[#1a1c3d]/85 ring-2 ring-indigo-500 border-indigo-400 shadow-xl shadow-indigo-500/15 scale-102 z-20';
            }

            return (
              <div
                key={`day-${day}`}
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square rounded-xl border p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none relative group/cell ${cellBgClass}`}
              >
                {/* Cell Row 1: Day Number + Status Indicators */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] sm:text-sm font-black font-mono leading-none ${
                    isSelectedFocus
                      ? 'text-indigo-300 font-extrabold text-[13px] sm:text-base'
                      : isToday 
                        ? 'text-blue-300 font-black' 
                        : isWeekend
                          ? 'text-purple-300'
                          : 'text-gray-200'
                  }`}>
                    {day}
                  </span>

                  {/* Day Status dot indicator 🟢 🟡 🔴 🔵 */}
                  <div className="flex items-center">
                    {meta.status === 'completed' && <span className="text-[7.5px] sm:text-[9px] filter drop-shadow">🟢</span>}
                    {meta.status === 'partial' && <span className="text-[7.5px] sm:text-[9px] filter drop-shadow">🟡</span>}
                    {meta.status === 'scheduled' && <span className="text-[7.5px] sm:text-[9px] filter drop-shadow">🔵</span>}
                    {meta.status === 'missed' && <span className="text-[7.5px] sm:text-[9px] filter drop-shadow">🔴</span>}
                  </div>
                </div>

                {/* Cell Row 2: Micro count badges */}
                <div className="flex flex-col gap-0.5 mt-auto text-[8px] sm:text-[9.5px] font-mono leading-none font-bold">
                  {/* Habits check badge count */}
                  {meta.habitsCheckedCount > 0 && (
                    <span className="text-amber-400 flex items-center gap-0.5 overflow-hidden text-ellipsis whitespace-nowrap bg-amber-500/10 px-1 py-0.5 rounded">
                      ⚡{meta.habitsCheckedCount} <span className="hidden sm:inline text-[7px] text-amber-500 font-normal">Hb</span>
                    </span>
                  )}
                  {/* Tasks count badge */}
                  {meta.tasksCount > 0 && (
                    <span className="text-blue-400 flex items-center gap-0.5 overflow-hidden text-ellipsis whitespace-nowrap bg-blue-500/10 px-1 py-0.5 rounded">
                      🎯{meta.tasksCount} <span className="hidden sm:inline text-[7px] text-blue-500 font-normal">Tk</span>
                    </span>
                  )}
                  {/* Journal/Notes log count badge */}
                  {meta.notesAndJournalsCount > 0 && (
                    <span className="text-purple-400 flex items-center gap-0.5 overflow-hidden text-ellipsis whitespace-nowrap bg-purple-500/10 px-1 py-0.5 rounded">
                      📝{meta.notesAndJournalsCount} <span className="hidden sm:inline text-[7px] text-purple-500 font-normal">Nt</span>
                    </span>
                  )}
                </div>

                {/* Full visual hover tooltip */}
                <div className="absolute inset-x-0 bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-0 group-hover/cell:opacity-100 transition-opacity duration-150 bg-neutral-950/95 text-white text-[10px] p-2.5 rounded-xl border border-white/10 shadow-2xl w-48 space-y-1 select-none">
                  <div className="font-extrabold text-indigo-400 flex items-center justify-between pb-1 border-b border-white/5">
                    <span>{currentYear}-{monthPadded}-{dayPadded}</span>
                    <span className="text-[8px] tracking-widest text-neutral-400 uppercase">
                      {isToday ? 'Today' : isWeekend ? 'Weekend' : 'Weekday'}
                    </span>
                  </div>
                  
                  {meta.tasksCount > 0 ? (
                    <p className="font-mono text-blue-300">🎯 Tasks: {meta.completedTasks}/{meta.tasksCount} completed</p>
                  ) : (
                    <p className="text-gray-500 italic">No tasks scheduled</p>
                  )}

                  {meta.habitsCheckedCount > 0 ? (
                    <p className="font-mono text-amber-300">⚡ Tasks ticked: {meta.habitsCheckedCount} logged</p>
                  ) : (
                    <p className="text-gray-500 italic">No tasks logged</p>
                  )}

                  {meta.notesAndJournalsCount > 0 ? (
                    <p className="font-mono text-purple-300">📝 Scratchpad & Saved Ideas: {meta.notesAndJournalsCount} entries</p>
                  ) : null}

                  {meta.expensesCount > 0 ? (
                    <p className="font-mono text-emerald-300">💸 Expenses: {meta.expensesCount} logged</p>
                  ) : null}

                  {meta.hasElements && (
                    <div className="pt-1 mt-1 border-t border-white/5 flex justify-between items-center text-[9px] font-bold">
                      <span className="text-gray-400">Completion Score:</span>
                      <span className="text-emerald-400 font-mono">{meta.dailyScore}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CLINICAL DAILY SUMMARY & HISTORY INTEGRATION CARD */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="p-6 sm:p-8 rounded-3xl border border-white/5 glass bg-[#05060c]/90 shadow-2xl relative w-full overflow-hidden"
        >
          {/* Subtle colored mesh background indicators */}
          <div className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[180px] h-[180px] rounded-full bg-blue-500/5 blur-[50px] pointer-events-none" />

          {/* Header row with Previous/Next day navigations */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              <h3 className="text-base sm:text-lg font-bold font-display text-white italic">
                Daily Focus Snapshot
              </h3>
            </div>

            {/* Stepper Buttons for Calendar Days */}
            <div className="flex items-center justify-between sm:justify-start gap-3 select-none">
              <button
                onClick={handlePrevDay}
                className="flex items-center space-x-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 dark:text-neutral-100 hover:text-white transition-all text-xs font-semibold cursor-pointer border border-white/5"
                title="Go to previous calendar day"
              >
                <span>◀ Previous</span>
              </button>

              <span className="text-sm font-extrabold font-display bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent px-2">
                {(() => {
                  const [y, m, d] = selectedDate.split('-');
                  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                  return dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
                })()}
              </span>

              <button
                onClick={handleNextDay}
                className="flex items-center space-x-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 dark:text-neutral-100 hover:text-white transition-all text-xs font-semibold cursor-pointer border border-white/5"
                title="Go to next calendar day"
              >
                <span>Next ▶</span>
              </button>
            </div>
          </div>

          {/* Master layout panel grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
            
            {/* COLUMN 1 (4 Span out of 12): STATISTICS & DAILY CIRCLE SCORE */}
            <div className="lg:col-span-4 flex flex-col justify-start space-y-6">
              
              {/* Daily Completion Score Circle */}
              <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Day Completion Score</span>
                
                <div className="relative flex items-center justify-center">
                  {/* SVG circular trackbar representation */}
                  <svg className="w-28 h-28 transform -rotate-95">
                    <circle 
                      cx="56" cy="56" r="48" 
                      className="text-neutral-800" strokeWidth="6" stroke="currentColor" fill="transparent" 
                    />
                    <circle 
                      cx="56" cy="56" r="48" 
                      className="text-indigo-500 transition-all duration-700 ease-out" 
                      strokeWidth="8" 
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={(2 * Math.PI * 48) - (dayCompletionScore / 100) * (2 * Math.PI * 48)}
                      strokeLinecap="round"
                      stroke="currentColor" 
                      fill="transparent" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black font-mono text-white leading-none">{dayCompletionScore}%</span>
                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wide mt-1">Sprinted Adherence</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 w-full flex items-center justify-around text-xs font-mono text-gray-400">
                  <div>
                    <span className="block font-black text-white text-sm">{selectedTasks.filter(t => t.status === 'Completed').length} / {selectedTasks.length}</span>
                    <span>Tasks</span>
                  </div>
                  <div className="w-px h-6 bg-white/5" />
                  <div>
                    <span className="block font-black text-white text-sm">
                      {habits.filter(h => habitLogs[h.id]?.[selectedDate] === true).length} / {habits.length}
                    </span>
                    <span>Tasks Adherence</span>
                  </div>
                </div>
              </div>

              {/* Journal / Log memory box */}
              <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-3.5">
                <div className="flex items-center space-x-2 text-indigo-400">
                  <BookOpen className="h-4.5 w-4.5" />
                  <span className="text-xs font-bold font-display uppercase tracking-widest">Daily Memory/Journal Log</span>
                </div>
                
                <textarea
                  value={newJournalText}
                  onChange={(e) => setNewJournalText(e.target.value)}
                  onBlur={handleSaveJournal}
                  placeholder="Record your thoughts, mindfulness observations, or specific retrospectives for this date. Exits save immediately..."
                  className="w-full text-xs p-3 rounded-lg bg-black text-neutral-200 border border-white/10 focus:border-indigo-500 focus:outline-none min-h-24 leading-relaxed resize-none scrollbar-thin"
                />

                <div className="flex justify-between items-center select-none text-[9.5px]">
                  <span className="text-gray-500">Auto-saves on textarea focus shift</span>
                  <button
                    onClick={handleSaveJournal}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                  >
                    Force Save Log
                  </button>
                </div>
              </div>

            </div>

            {/* COLUMN 2 (8 Span out of 12): DETAILED HABITS, TASKS, NOTES, INVENTORIES */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Habits Daily Row Adherences */}
              <div className="p-5 rounded-2xl bg-[#090a10]/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                    <span className="text-xs font-bold font-display uppercase tracking-widest text-white">Daily Task Checks</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">Click to log completed routines for this date</span>
                </div>

                {habits.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No global tasks tracked in LifeOS currently. Add tasks on Dashboard UI.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {habits.map(h => {
                      const isChecked = habitLogs[h.id]?.[selectedDate] === true;
                      return (
                        <div
                          key={h.id}
                          onClick={() => toggleHabitLog(h.id, selectedDate)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none active:scale-[0.98] ${
                            isChecked 
                              ? 'bg-amber-500/10 border-amber-500/30 text-white' 
                              : 'bg-neutral-900/40 border-white/5 text-gray-400 hover:border-white/10 hover:bg-neutral-900/70'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="text-sm">{h.emoji}</span>
                            <span className={`text-xs font-bold truncate ${isChecked ? 'line-through text-neutral-350' : ''}`}>
                              {h.name}
                            </span>
                          </div>
                          
                          <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-amber-500 border-amber-400 text-black' : 'border-neutral-700'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tasks Due Section */}
              <div className="p-5 rounded-2xl bg-[#090a10]/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Target className="h-4.5 w-4.5" />
                    <span className="text-xs font-bold font-display uppercase tracking-widest text-white">Focus Targets Scheduled</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">Click checkboxes to status complete targets</span>
                </div>

                {selectedTasks.length === 0 ? (
                  <div className="p-3 bg-neutral-900/20 rounded-xl border border-dashed border-white/5 text-center text-xs text-gray-500 italic">
                    No active targets set for this scheduling date. Select another day on the calendar or add tasks inside LifeOS Todo dock.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {selectedTasks.map(t => {
                      const isCompleted = t.status === 'Completed';
                      return (
                        <div 
                          key={t.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/40 border border-white/5 hover:bg-neutral-900/70 hover:border-white/10 transition-all duration-150 gap-3"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            {/* Complete trigger checkbox */}
                            <button
                              onClick={() => handleToggleTaskStatus(t)}
                              className={`h-4 w-4 rounded border flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                isCompleted ? 'bg-blue-500 border-blue-400 text-black' : 'border-neutral-700 text-transparent'
                              }`}
                            >
                              <Check className="h-3 w-3 stroke-[3]" />
                            </button>
                            
                            <span className={`text-xs font-semibold truncate ${
                              isCompleted ? 'line-through text-gray-500' : 'text-neutral-200'
                            }`}>
                              {t.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className={`text-[8.5px] font-bold font-mono px-1.5 py-0.5 rounded uppercase leading-none ${
                              t.priority === 'High' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 
                              t.priority === 'Medium' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 
                              'bg-neutral-800 text-gray-400'
                            }`}>
                              {t.priority}
                            </span>

                            {/* Delete Button */}
                            <button
                              onClick={() => setTasks(prev => prev.filter(x => x.id !== t.id))}
                              className="p-1 rounded text-neutral-500 hover:text-red-500 transition-colors cursor-pointer hover:bg-red-500/10"
                              title="Delete Task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Extra Items Row: Custom goals accomplished and date expenses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Custom Goals Completed on that Date */}
                <div className="p-5 rounded-2xl bg-[#090a10]/50 border border-white/5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <div className="flex items-center space-x-2 text-indigo-400">
                        <Award className="h-4.5 w-4.5" />
                        <span className="text-xs font-bold font-display uppercase tracking-widest text-white">Micro Goals</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-500">{selectedGoals.length} log</span>
                    </div>

                    {selectedGoals.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic py-2 text-center">No specific micro goals logged yet</p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {selectedGoals.map(g => (
                          <div 
                            key={g.id} 
                            className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-neutral-900/30 border border-white/5"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <input 
                                type="checkbox"
                                checked={g.completed}
                                onChange={() => handleToggleGoal(g.id)}
                                className="rounded bg-neutral-950 border-white/10 text-indigo-500 h-3.5 w-3.5 cursor-pointer"
                              />
                              <span className={`truncate text-[11px] ${g.completed ? 'line-through text-gray-500' : 'text-neutral-200'}`}>
                                {g.name}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteGoal(g.id)}
                              className="text-gray-500 hover:text-red-400 p-0.5"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add action form */}
                  <form onSubmit={handleAddGoal} className="flex gap-1.5 border-t border-white/5 pt-3 mt-2">
                    <input 
                      type="text"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder="e.g. Run 10K test or code"
                      className="flex-1 bg-black text-neutral-200 text-[11px] p-2 rounded-lg border border-white/10 focus:border-indigo-500 focus:outline-none placeholder-gray-600"
                    />
                    <button 
                      type="submit" 
                      className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/25 transition-all text-xs font-bold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>

                {/* Expenses Logged on that Date */}
                <div className="p-5 rounded-2xl bg-[#090a10]/50 border border-white/5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <div className="flex items-center space-x-2 text-emerald-400">
                        <DollarSign className="h-4.5 w-4.5" />
                        <span className="text-xs font-bold font-display uppercase tracking-widest text-white">Day Expenses</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 rounded">
                        ${selectedExpenses.reduce((sum, item) => sum + item.amount, 0).toFixed(2)} total
                      </span>
                    </div>

                    {selectedExpenses.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic py-2 text-center">No expenses recorded for this date</p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {selectedExpenses.map(item => (
                          <div 
                            key={item.id} 
                            className="flex items-center justify-between text-xs p-1.5 bg-neutral-900/30 border border-white/5 rounded-lg"
                          >
                            <span className="truncate text-[11px] text-gray-300 font-medium">{item.description}</span>
                            <div className="flex items-center space-x-2 font-mono shrink-0">
                              <span className="text-emerald-400 font-bold">${item.amount.toFixed(2)}</span>
                              <button 
                                onClick={() => handleDeleteExpense(item.id)}
                                className="text-gray-500 hover:text-red-400 p-0.5"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add action form */}
                  <form onSubmit={handleAddExpense} className="flex gap-1 pt-3 mt-2 border-t border-white/5 select-none">
                    <input 
                      type="text"
                      value={newExpenseDesc}
                      onChange={(e) => setNewExpenseDesc(e.target.value)}
                      placeholder="Coffee"
                      className="flex-1 bg-black text-neutral-200 text-[11px] p-2 rounded-lg border border-white/10 focus:border-emerald-500 focus:outline-none placeholder-gray-600"
                    />
                    <input 
                      type="text"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(e.target.value)}
                      placeholder="12.50"
                      className="w-14 bg-black text-neutral-100 text-[11px] p-2 font-mono rounded-lg border border-white/10 focus:border-emerald-500 focus:outline-none placeholder-gray-600"
                    />
                    <button 
                      type="submit" 
                      className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/25 transition-all text-xs font-bold cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>

              </div>

              {/* Scratched Quick Notes Completed on that Date */}
              {selectedNotes.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#090a10]/50 border border-white/5 space-y-3.5">
                  <div className="flex items-center space-x-2 text-purple-400 pb-1 border-b border-white/5">
                    <NotebookPencilIcon className="h-4.5 w-4.5" />
                    <span className="text-xs font-bold font-display uppercase tracking-widest text-white">Scratchpad Logs Streamed</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {selectedNotes.map(note => (
                      <div key={note.id} className="p-3 bg-neutral-900/30 rounded-xl border border-white/5 relative">
                        <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">{note.content}</p>
                        <span className="text-[8px] font-mono text-gray-500 block mt-2">Opened {new Date(note.createdAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
            
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
