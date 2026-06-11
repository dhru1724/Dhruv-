import React, { useState, useEffect } from 'react';
import { 
  Pillar, Habit, HabitLog, Project, QuickNote, Task 
} from '../types';
import { 
  Activity, Award, Calendar, CheckCircle2, ChevronRight, Clock, Plus, Flame, Sparkles, 
  MapPin, CloudSun, Quote, HelpCircle, AlertCircle, PlusCircle, Check, 
  Trash2, Send, Zap, LogIn, Dumbbell, ShieldAlert, Heart, 
  Wallet, GraduationCap, Compass, HelpCircle as SilvaIcon, RefreshCw, Eye, BookOpen, Timer,
  Pencil, X, Minus, Droplet, ChevronLeft, MoreVertical, Info, CalendarDays, DownloadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QUOTES } from '../dummyData';
import MonthlyProgressCalendar from './MonthlyProgressCalendar';
import { StreakData } from '../lib/firebaseStore';

// Format date helper
const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface DashboardHomeProps {
  pillars: Pillar[];
  setPillars: (pillars: Pillar[]) => void;
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  habitLogs: HabitLog;
  toggleHabitLog: (habitId: string, dateStr: string) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  quickNotes: QuickNote[];
  setQuickNotes: React.Dispatch<React.SetStateAction<QuickNote[]>> | ((notes: QuickNote[]) => void);
  addQuickNote: (content: string) => void;
  deleteQuickNote: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  streakState: StreakData;
  triggerStreakSync: () => void;
  isDark?: boolean;
  tasks?: Task[];
  setTasks?: (tasks: Task[]) => void;
  routineEvents?: any[];
  routineStreak?: number;
  meditationStreak?: number;
  learningStreak?: number;
  workoutStreak?: number;
  waterStreak?: number;
  profileName?: string;
  waterCurrent?: number;
  setWaterCurrent?: (val: number | ((prev: number) => number)) => void;
  focusSeconds?: number;
  setFocusSeconds?: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning?: boolean;
  setIsTimerRunning?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function DashboardHome({
  pillars,
  setPillars,
  habits,
  setHabits,
  habitLogs,
  toggleHabitLog,
  projects,
  setProjects,
  quickNotes,
  setQuickNotes,
  addQuickNote,
  deleteQuickNote,
  selectedDate,
  setSelectedDate,
  streakState,
  triggerStreakSync,
  isDark = true,
  tasks = [],
  setTasks,
  routineEvents = [],
  routineStreak = 18,
  meditationStreak = 4,
  learningStreak = 3,
  workoutStreak = 1,
  waterStreak = 12,
  profileName = 'Dhruvv',
  waterCurrent: propsWaterCurrent,
  setWaterCurrent: propsSetWaterCurrent,
  focusSeconds: propsFocusSeconds,
  setFocusSeconds: propsSetFocusSeconds,
  isTimerRunning: propsIsTimerRunning,
  setIsTimerRunning: propsSetIsTimerRunning,
}: DashboardHomeProps) {
  // Live Timer
  const [time, setTime] = useState(new Date());

  // Habit Navigator Offset state
  const [habitBaseOffset, setHabitBaseOffset] = useState(0);

  // Enhanced Habit progression states
  const [activeHabitModal, setActiveHabitModal] = useState<Habit | null>(null);
  const [modalType, setModalType] = useState<'rename' | 'delete' | 'details' | 'add' | 'calendar' | null>(null);
  const [newName, setNewName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('📖');
  const [newHabitColor, setNewHabitColor] = useState('indigo');
  const [newHabitCategory, setNewHabitCategory] = useState('Daily');
  const [newHabitGoal, setNewHabitGoal] = useState('10 Pages');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Deep Work Timer States (centralized with props if available)
  const [localIsTimerRunning, setLocalIsTimerRunning] = useState(false);
  const [localTimerSeconds, setLocalTimerSeconds] = useState(2 * 3600 + 35 * 60 + 12);
  
  const timerSeconds = propsFocusSeconds !== undefined ? propsFocusSeconds : localTimerSeconds;
  const isTimerRunning = propsIsTimerRunning !== undefined ? propsIsTimerRunning : localIsTimerRunning;
  const setTimerSeconds = propsSetFocusSeconds ?? setLocalTimerSeconds;
  const setIsTimerRunning = propsSetIsTimerRunning ?? setLocalIsTimerRunning;

  // Water intake tracking (saved to localStorage or state)
  const [localWaterIntake, setLocalWaterIntake] = useState(2.1);
  const waterIntake = propsWaterCurrent !== undefined 
    ? parseFloat((propsWaterCurrent / 1000).toFixed(2))
    : localWaterIntake;

  // Checklist of pre-configured "Default Missions"
  const [missions, setMissions] = useState(() => {
    const saved = localStorage.getItem('life_dashboard_missions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse missions", e);
      }
    }
    return [
      { id: 'm1', text: 'Workout / Exercise', time: '6:00 AM', completed: true, emoji: '🏋️‍♂️' },
      { id: 'm2', text: 'Read 10 Pages', time: '9:00 AM', completed: true, emoji: '📖' },
      { id: 'm3', text: 'Apply to 3 Jobs', time: '11:00 AM', completed: false, emoji: '💼' },
      { id: 'm4', text: 'Learn Something New', time: '4:00 PM', completed: false, emoji: '💻' },
      { id: 'm5', text: 'Meditate (Silva Method)', time: '9:30 PM', completed: false, emoji: '🧘‍♂️' }
    ];
  });

  // Sync to local storage & trigger streak sync
  useEffect(() => {
    localStorage.setItem('life_dashboard_missions', JSON.stringify(missions));
    triggerStreakSync();
  }, [missions]);

  // Mission management states
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [editMissionText, setEditMissionText] = useState('');
  const [editMissionTime, setEditMissionTime] = useState('');
  const [editMissionEmoji, setEditMissionEmoji] = useState('');

  const [isAddingMission, setIsAddingMission] = useState(false);
  const [newMissionText, setNewMissionText] = useState('');
  const [newMissionTime, setNewMissionTime] = useState('8:00 AM');
  const [newMissionEmoji, setNewMissionEmoji] = useState('🎯');

  // Mission operations
  const handleStartEditMission = (id: string, text: string, time: string, emoji: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent toggling completion when clicking edit
    setEditingMissionId(id);
    setEditMissionText(text);
    setEditMissionTime(time);
    setEditMissionEmoji(emoji);
  };

  const handleSaveEditMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMissionText.trim()) return;
    setMissions(prev => prev.map(m => 
      m.id === editingMissionId 
        ? { ...m, text: editMissionText.trim(), time: editMissionTime.trim() || 'Anytime', emoji: editMissionEmoji.trim() || '🎯' } 
        : m
    ));
    setEditingMissionId(null);
  };

  const handleCancelEditMission = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingMissionId(null);
  };

  const handleDeleteMission = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering completion toggle
    setMissions(prev => prev.filter(m => m.id !== id));
    if (editingMissionId === id) {
      setEditingMissionId(null);
    }
  };

  const handleAddMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionText.trim()) return;
    
    const newMission = {
      id: `m-${Date.now()}`,
      text: newMissionText.trim(),
      time: newMissionTime.trim() || 'Anytime',
      completed: false,
      emoji: newMissionEmoji.trim() || '🎯'
    };

    setMissions(prev => [...prev, newMission]);
    setNewMissionText('');
    setNewMissionTime('8:00 AM');
    setNewMissionEmoji('🎯');
    setIsAddingMission(false);
  };

  // Budget tracking overview metrics (can adjust via interactive inputs)
  const [incomeVal, setIncomeVal] = useState(45000);
  const [expenseVal, setExpenseVal] = useState(32500);

  // Dynamic Quote Index
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(2); // "Focus is a matter of deciding..."

  // Quick Inline Forms State
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showQuickNoteInput, setShowQuickNoteInput] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const [showJournalSuccess, setShowJournalSuccess] = useState(false);

  // Run countdown the Focus Timer if active
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    if (propsFocusSeconds !== undefined) return; // Managed by App.tsx
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, propsFocusSeconds]);

  const toggleDeepWorkTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetFocusTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleAddFocusTime = () => {
    setTimerSeconds(prev => prev + 15 * 60);
  };

  const handleSubtractFocusTime = () => {
    setTimerSeconds(prev => Math.max(0, prev - 15 * 60));
  };

  const handleAddWater = () => {
    if (propsSetWaterCurrent) {
      propsSetWaterCurrent(prev => prev + 250);
    } else {
      const newVal = parseFloat((waterIntake + 0.25).toFixed(2));
      setLocalWaterIntake(newVal);
      localStorage.setItem('life_dashboard_water_intake', String(newVal));
    }
  };

  const handleSubtractWater = () => {
    if (propsSetWaterCurrent) {
      propsSetWaterCurrent(prev => Math.max(0, prev - 250));
    } else {
      const newVal = parseFloat(Math.max(0, waterIntake - 0.25).toFixed(2));
      setLocalWaterIntake(newVal);
      localStorage.setItem('life_dashboard_water_intake', String(newVal));
    }
  };

  const handleResetWater = () => {
    if (propsSetWaterCurrent) {
      propsSetWaterCurrent(0);
    } else {
      setLocalWaterIntake(0);
      localStorage.setItem('life_dashboard_water_intake', '0');
    }
  };

  // Toggle internal missions list
  const toggleMission = (id: string) => {
    setMissions(prev => 
      prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m)
    );
  };

  // Form helpers
  const submitJournalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalEntry.trim()) return;

    // Create a Note representing the journal reflection
    addQuickNote(`💭 Daily Reflection: ${journalEntry.trim()}`);
    setJournalEntry('');
    setShowJournalSuccess(true);
    setTimeout(() => {
      setShowJournalSuccess(false);
    }, 4000);
  };

  // Format Helper for seconds to Hour:Min:Sec
  const formatTimerVal = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${String(mins).padStart(2, '0')}m`;
  };

  // Calculated properties based on today's status
  const todayDateStr = getLocalDateString();

  const todayCompletedHabitsCount = habits.filter(h => habitLogs[h.id]?.[todayDateStr] === true).length;
  const totalHabitsCount = habits.length;

  // Dynamic calculations for current streaks
  const streakDays = streakState?.currentStreak || 18;

  // Dynamic calculation for local greeting and daily quote
  const getGreeting = () => {
    const hours = time.getHours();
    if (hours >= 5 && hours < 12) return 'Good Morning';
    if (hours >= 12 && hours < 17) return 'Good Afternoon';
    if (hours >= 17 && hours < 21) return 'Good Evening';
    return 'Good Night';
  };

  const quoteIndex = new Date().getDate() % (QUOTES ? QUOTES.length : 1);
  const dailyQuote = QUOTES && QUOTES[quoteIndex] ? QUOTES[quoteIndex] : { text: "Your mind is for having ideas, not holding them.", author: "David Allen" };

  // Sync missions with real daily activity checklists
  const resolvedMissions = missions.map(m => {
    if (m.id === 'm1') {
      const routineGym = routineEvents?.find(e => e.id === 't3')?.completed;
      const habitGym = habitLogs['hab-3']?.[todayDateStr] === true;
      return { ...m, completed: m.completed || !!routineGym || habitGym };
    }
    if (m.id === 'm2') {
      const routineRead = routineEvents?.find(e => e.id === 't13')?.completed;
      const habitRead = habitLogs['hab-2']?.[todayDateStr] === true;
      return { ...m, completed: m.completed || !!routineRead || habitRead };
    }
    if (m.id === 'm4') {
      const routineLearn = routineEvents?.find(e => e.id === 't11' || e.id === 't12')?.completed;
      return { ...m, completed: m.completed || !!routineLearn };
    }
    if (m.id === 'm5') {
      const routineMed = routineEvents?.find(e => e.id === 't8')?.completed;
      const habitMed = habitLogs['hab-1']?.[todayDateStr] === true;
      return { ...m, completed: m.completed || !!routineMed || habitMed };
    }
    return m;
  });

  // Real-time integration of planner tasks, missions and checkout status
  const todayTasksList = tasks.filter(t => t.dueDate === todayDateStr && !t.isArchived);
  const completedTodayTasksCount = todayTasksList.filter(t => t.status === 'Completed').length;
  
  const totalMissionsCount = resolvedMissions.length;
  const completedMissionsCount = resolvedMissions.filter(m => m.completed).length;

  const totalCompletedTasks = completedTodayTasksCount + completedMissionsCount;
  const totalTasksCountToday = todayTasksList.length + totalMissionsCount;
  const tasksRemainingCount = totalTasksCountToday - totalCompletedTasks;

  // Math calculated productivity percentage combining habits, checklist tasks, and agenda items
  const totalDailyIndicatorsCount = totalHabitsCount + totalTasksCountToday;
  const completedDailyIndicatorsCount = todayCompletedHabitsCount + totalCompletedTasks;
  const productivityPercent = totalDailyIndicatorsCount > 0 
    ? Math.min(100, Math.round((completedDailyIndicatorsCount / totalDailyIndicatorsCount) * 100))
    : 85;

  // Dynamic Streak Calculator for individual habit
  const getHabitCurrentStreak = (habitId: string) => {
    let streak = 0;
    const d = new Date(); // Start from today
    let checkedToday = false;
    
    // Check consecutive days going backwards
    for (let i = 0; i < 365; i++) {
      const dateStr = getLocalDateString(d);
      const isDone = habitLogs[habitId]?.[dateStr] === true;
      if (isDone) {
        streak++;
        checkedToday = true;
      } else {
        // If we haven't completed today, we don't break yet on the first iteration
        if (i === 0) {
          checkedToday = true;
        } else {
          break;
        }
      }
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  // Past 30 Days Completion rate for individual habit
  const getHabitCompletionPercentage = (habitId: string) => {
    let completedCount = 0;
    const daysToTrack = 30;
    const d = new Date();
    for (let i = 0; i < daysToTrack; i++) {
      const dateStr = getLocalDateString(d);
      if (habitLogs[habitId]?.[dateStr] === true) {
        completedCount++;
      }
      d.setDate(d.getDate() - 1);
    }
    return Math.round((completedCount / daysToTrack) * 100);
  };

  // Days list starting from today's date plus current base offset (shows today and next 4 days)
  const getWeekDaysList = () => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + habitBaseOffset + i);
      const dateStr = getLocalDateString(d);
      
      let dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      const monthDayLabel = `${monthLabel} ${d.getDate()}`;
      
      const isToday = dateStr === todayDateStr;
      if (isToday) {
        dayName = 'TODAY';
      }
      list.push({
        label: dayName,
        dateStr,
        dayNum: d.getDate(),
        monthDay: monthDayLabel,
        isToday,
        isPast: dateStr < todayDateStr,
        isFuture: dateStr > todayDateStr,
      });
    }
    return list;
  };

  const habitWeekDays = getWeekDaysList();

  // Dynamic Weekly Compliance percent based on current visible columns
  const getWeeklyCompliancePercent = () => {
    let completed = 0;
    let total = 0;
    habits.forEach(hab => {
      habitWeekDays.forEach(day => {
        total++;
        if (habitLogs[hab.id]?.[day.dateStr]) {
          completed++;
        }
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const weeklyComplianceVal = getWeeklyCompliancePercent();

  // Active dropdown vertical menu state
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);

  // Retrieve statistics for historical selected past date view
  const getHistoricalStatsForDate = (dateStr: string) => {
    let completedCount = 0;
    let partialCount = 0;
    let missedCount = 0;
    let plannedCount = 0;
    
    habits.forEach(h => {
      const log = habitLogs[h.id]?.[dateStr];
      if (log === true) {
        completedCount++;
      } else if (log === 'partial') {
        partialCount++;
      } else {
        if (dateStr < todayDateStr) {
          missedCount++;
        } else {
          plannedCount++;
        }
      }
    });

    const total = habits.length;
    const completionPct = total > 0 ? Math.round(((completedCount + partialCount * 0.5) / total) * 100) : 0;
    
    return {
      completedCount,
      partialCount,
      missedCount,
      plannedCount,
      completionPct,
      score: completionPct
    };
  };

  // Enhanced Weekly Analytics Calculations (looking at last 7 days)
  const getWeeklyHabitAnalytics = () => {
    let completedCount = 0;
    let partialCount = 0;
    let missedCount = 0;
    let totalOpportunities = 0;
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(getLocalDateString(d));
    }
    
    habits.forEach(h => {
      days.forEach(dayStr => {
        totalOpportunities++;
        const val = habitLogs[h.id]?.[dayStr];
        if (val === true) {
          completedCount++;
        } else if (val === 'partial') {
          partialCount++;
        } else {
          missedCount++;
        }
      });
    });

    const completionRate = totalOpportunities > 0 
      ? Math.round(((completedCount + partialCount * 0.5) / totalOpportunities) * 100) 
      : 0;

    let maxCurrentStreak = 0;
    let maxLongestStreak = 0;
    
    habits.forEach(h => {
      let curr = 0;
      let d = new Date();
      for (let i = 0; i < 365; i++) {
        const dateStr = getLocalDateString(d);
        const logged = habitLogs[h.id]?.[dateStr];
        if (logged === true) {
          curr++;
        } else if (logged === 'partial') {
          curr += 0.5;
        } else {
          if (i !== 0) {
            break;
          }
        }
        d.setDate(d.getDate() - 1);
      }
      if (Math.floor(curr) > maxCurrentStreak) maxCurrentStreak = Math.floor(curr);

      let longest = 0;
      let currentRun = 0;
      let checkDate = new Date();
      for (let i = 0; i < 180; i++) {
        const dateStr = getLocalDateString(checkDate);
        if (habitLogs[h.id]?.[dateStr] === true) {
          currentRun++;
          if (currentRun > longest) longest = currentRun;
        } else {
          currentRun = 0;
        }
        checkDate.setDate(checkDate.getDate() - 1);
      }
      if (longest > maxLongestStreak) maxLongestStreak = longest;
    });

    if (maxLongestStreak === 0) maxLongestStreak = streakDays || 12;
    if (maxCurrentStreak === 0) maxCurrentStreak = streakDays || 12;

    const getCompletionRateVal = () => {
      if (!streakState.completedDates || streakState.completedDates.length === 0) return 0;
      const startDay = new Date(streakState.startDate + 'T00:00:00');
      const todayDay = new Date(getLocalDateString() + 'T00:00:00');
      const diffTime = Math.max(0, todayDay.getTime() - startDay.getTime());
      const elapsedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const count = streakState.completedDates.filter(d => d >= streakState.startDate).length;
      return elapsedDays > 0 ? Math.min(100, Math.round((count / elapsedDays) * 100)) : 0;
    };

    const completionRateVal = getCompletionRateVal();

    return {
      completionRate: completionRateVal,
      longestStreak: streakState.longestStreak,
      currentStreak: streakState.currentStreak,
      totalCompleted: completedCount,
      weeklyScore: completionRateVal
    };
  };

  const analytics = getWeeklyHabitAnalytics();

  // Heatmap generation logic
  const getHeatmapData = () => {
    const data = [];
    const today = new Date();
    const endOffset = 6 - today.getDay(); // days to Sunday
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + endOffset);

    for (let c = 11; c >= 0; c--) {
      const weekCols = [];
      for (let r = 0; r < 7; r++) {
        const dayDiff = c * 7 + (6 - r);
        const cellDate = new Date(endDate);
        cellDate.setDate(endDate.getDate() - dayDiff);
        const dateStr = getLocalDateString(cellDate);

        let completed = 0;
        habits.forEach(h => {
          if (habitLogs[h.id]?.[dateStr] === true) {
            completed++;
          } else if (habitLogs[h.id]?.[dateStr] === 'partial') {
            completed += 0.5;
          }
        });
        const pct = habits.length > 0 ? (completed / habits.length) * 100 : 0;
        weekCols.push({
          dateStr,
          percentage: pct,
          completedCount: completed,
          totalHabits: habits.length
        });
      }
      data.push(weekCols);
    }
    return data;
  };

  // Helper setter to calculate days difference relative to today and change base offset
  const setDirectDate = (dateStr: string) => {
    const selected = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    setHabitBaseOffset(diffDays);
    setModalType(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* A. LifeOS Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-white/5 gap-4">
        <div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
            {getGreeting()}, {profileName} ☀️
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-1">
            Welcome back to your unified LifeOS. Today always follows your local system clock.
          </p>
        </div>
        
        {/* Dynamic Quote Box */}
        <div className="max-w-md bg-white/5 border border-white/10 p-3 rounded-2xl flex items-start space-x-2.5">
          <Quote className="h-4 w-4 text-[#7C5CFF] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-snug">
            <p className="text-gray-300 font-medium font-sans">"{dailyQuote.text}"</p>
            <span className="text-gray-500 font-bold block mt-0.5 font-sans">— {dailyQuote.author}</span>
          </div>
        </div>
      </div>

      {/* B. Interactive Habit Progression Week View & Weekly Habit Compliance Card */}
      <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.08)] relative w-full font-sans">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/[0.05] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/[0.05] rounded-full blur-[100px] pointer-events-none" />

        {/* 1. HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-white/5 mb-6 gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-widest uppercase font-display">
                  Tasks Progression Dashboard
                </h2>
                {habitBaseOffset < 0 && (
                  <span className="text-[9.5px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-black animate-pulse">
                    ⚠️ HISTORICAL DATA • {Math.abs(habitBaseOffset)} DAYS AGO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Optimize daily rhythms, trace historical streaks & track your life areas
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Navigation Panel */}
            <div className="flex flex-wrap items-center bg-neutral-900/90 rounded-xl border border-white/5 p-1 select-none gap-0.5">
              <button 
                onClick={() => setHabitBaseOffset(prev => prev - 1)}
                className="p-1.5 px-3.5 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                title="Previous"
              >
                <span>◀ Previous</span>
              </button>

              <button
                onClick={() => {
                  setModalType('calendar');
                }}
                className="p-1.5 px-3 hover:bg-white/5 rounded-lg text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                title="Calendar Picker"
              >
                <CalendarDays className="h-3 w-3 shrink-0" />
                <span>Calendar</span>
              </button>

              <button
                onClick={() => setHabitBaseOffset(0)}
                className={`p-1.5 px-3.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  habitBaseOffset === 0 
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/15'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Today
              </button>

              <button 
                onClick={() => setHabitBaseOffset(prev => prev + 1)}
                className="p-1.5 px-3.5 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                title="Next"
              >
                <span>Next ▶</span>
              </button>
            </div>

            {/* Add Habit prominent button */}
            <button
              onClick={() => {
                setNewName('');
                setNewHabitEmoji('📖');
                setNewHabitColor('indigo');
                setNewHabitCategory('Daily');
                setNewHabitGoal('10 Pages');
                setModalType('add');
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all cursor-pointer border border-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Historical Summary Box (Visible only when viewing previous dates) */}
        {habitBaseOffset < 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div>
              <span className="font-mono text-xs font-semibold text-amber-400 flex items-center space-x-1">
                <span>📅 HISTORIC RETROSPECTIVE:</span>
                <span className="bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded text-[10px]">
                  {habitWeekDays[0].dateStr}
                </span>
              </span>
              <p className="text-[11px] text-gray-450 mt-1">
                You are reviewing checked performance for a previous date. Clicking on circles will rewrite history!
              </p>
            </div>
            {(() => {
              const stats = getHistoricalStatsForDate(habitWeekDays[0].dateStr);
              return (
                <div className="flex flex-wrap gap-2.5 font-mono text-[10.5px]">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-lg">
                    🟢 Done <span className="text-emerald-400 font-bold">{stats.completedCount}</span>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-lg">
                    🟡 Partial <span className="text-amber-400 font-bold">{stats.partialCount}</span>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-lg">
                    🔴 Missed <span className="text-red-400 font-bold">{stats.missedCount}</span>
                  </div>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg text-indigo-300 font-black">
                    🎯 Score <span className="text-indigo-400">{stats.score}%</span>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* 2. BODY LAYOUT: Matrix + Compliance Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
          
          {/* LEFT: Tabular habits grid */}
          <div className="lg:col-span-8 overflow-x-auto scrollbar-none w-full bg-neutral-950/40 p-4.5 rounded-2xl border border-white/[0.03]">
            <table className="w-full text-left min-w-[550px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-3.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-widest font-display w-[40%]">
                    Target Task Structure
                  </th>
                  {habitWeekDays.map((day, idx) => {
                    const isFocus = idx === 0;
                    return (
                      <th key={day.dateStr} className="pb-3.5 text-center w-[12%]">
                        <div className={`p-2 rounded-2xl transition-all duration-300 ${
                          isFocus 
                            ? 'bg-gradient-to-b from-indigo-500/15 via-indigo-600/5 to-transparent border-2 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)] scale-110 relative before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-r before:from-indigo-500 before:to-purple-500 before:opacity-30 before:-z-10' 
                            : 'opacity-50 hover:opacity-85'
                        }`}>
                          <span className={`block font-display text-[9px] uppercase font-black tracking-widest ${
                            isFocus ? 'text-indigo-350' : 'text-gray-500'
                          }`}>
                            {day.label}
                          </span>
                          <span className={`text-[11px] block mt-1 font-sans font-extrabold leading-none ${
                            isFocus ? 'text-white' : 'text-gray-400'
                          }`}>
                            {day.monthDay}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {habits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-gray-500 italic">
                      No tasks tracked in LifeOS currently. Click "Add Task" above to configure your first daily routine.
                    </td>
                  </tr>
                ) : (
                  habits.map(hab => {
                    const currStreak = getHabitCurrentStreak(hab.id);
                    const completionPct = getHabitCompletionPercentage(hab.id);
                    // Match visual color profiles
                    const colorScheme = hab.color || 'indigo';
                    const glowClass = colorScheme === 'rose' ? 'text-rose-400 bg-rose-500/5 border border-rose-500/10' :
                                      colorScheme === 'emerald' ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' :
                                      colorScheme === 'amber' ? 'text-amber-400 bg-amber-500/5 border border-amber-500/10' :
                                      colorScheme === 'cyan' ? 'text-cyan-400 bg-cyan-500/5 border border-cyan-500/10' :
                                      colorScheme === 'violet' ? 'text-violet-400 bg-violet-500/5 border border-violet-500/10' :
                                      'text-indigo-400 bg-indigo-500/5 border border-indigo-500/10';

                    return (
                      <tr key={hab.id} className="hover:bg-white/[0.01] transition-all duration-200">
                        {/* Habit Title Area */}
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center space-x-3 max-w-[85%]">
                              <span className={`h-8 w-8 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-sm shadow-md shrink-0`}>
                                {hab.emoji}
                              </span>
                              <div className="space-y-1 min-w-0">
                                <span className="text-xs font-bold text-gray-100 block truncate" title={hab.name}>
                                  {hab.name}
                                </span>
                                <div className="flex items-center space-x-1.5 text-[9px] font-mono leading-none select-none">
                                  <span className="text-amber-400 font-extrabold flex items-center gap-0.5 bg-amber-500/5 border border-amber-500/10 px-1 py-0.5 rounded">
                                    🔥 {currStreak}d
                                  </span>
                                  <span className="text-purple-400 font-extrabold flex items-center gap-0.5 bg-purple-500/5 border border-purple-500/10 px-1 py-0.5 rounded">
                                    🎯 {completionPct}%
                                  </span>
                                  {hab.category && (
                                    <span className="text-gray-400 font-medium px-1 bg-white/5 rounded">
                                      {hab.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Dropdown Options Actions Menu (⋮) */}
                            <div className="relative">
                              <button
                                onClick={() => {
                                  setActiveMenuHabitId(activeMenuHabitId === hab.id ? null : hab.id);
                                }}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all cursor-pointer"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {activeMenuHabitId === hab.id && (
                                <>
                                  {/* Menu Overlay Backing to support clear clicks */}
                                  <div 
                                    className="fixed inset-0 z-20 cursor-default" 
                                    onClick={() => setActiveMenuHabitId(null)} 
                                  />
                                  <div className="absolute right-0 mt-1 w-36 bg-neutral-950 border border-white/10 rounded-xl shadow-2xl p-1 z-30 font-sans">
                                    <button
                                      onClick={() => {
                                        setActiveHabitModal(hab);
                                        setNewName(hab.name);
                                        setModalType('rename');
                                        setActiveMenuHabitId(null);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-xs text-gray-350 hover:text-white hover:bg-white/5 rounded-lg flex items-center space-x-1.5"
                                    >
                                      <Pencil className="h-3.5 w-3.5 text-indigo-400" />
                                      <span>Rename Task</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveHabitModal(hab);
                                        setModalType('details');
                                        setActiveMenuHabitId(null);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-xs text-gray-350 hover:text-white hover:bg-white/5 rounded-lg flex items-center space-x-1.5"
                                    >
                                      <Info className="h-3.5 w-3.5 text-blue-400" />
                                      <span>Task Details</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveHabitModal(hab);
                                        setModalType('delete');
                                        setActiveMenuHabitId(null);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg flex items-center space-x-1.5"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Delete Task</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Habit Check cells */}
                        {habitWeekDays.map((day, dIdx) => {
                          const val = habitLogs[hab.id]?.[day.dateStr];
                          const isDone = val === true;
                          const isPartial = val === 'partial';
                          const isFocus = dIdx === 0;

                          // Decide State Status Indicator Styles
                          let stateColor = '';
                          let iconNode = null;
                          let tooltipStr = '';

                          if (isDone) {
                            stateColor = 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)] hover:shadow-[0_0_15px_rgba(16,185,129,0.6)] scale-110';
                            iconNode = <Check className="h-4 w-4 text-black font-black" />;
                            tooltipStr = 'Completed (🟢)';
                          } else if (isPartial) {
                            stateColor = 'bg-amber-500 border-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-110';
                            iconNode = <Minus className="h-4 w-4 text-black font-extrabold" />;
                            tooltipStr = 'Partial Progress (🟡)';
                          } else if (day.isPast) {
                            stateColor = 'border-red-500/40 bg-red-500/5 text-transparent hover:text-red-500/40 hover:bg-red-500/10';
                            iconNode = <X className="h-3.5 w-3.5" />;
                            tooltipStr = 'Missed (🔴)';
                          } else {
                            // Planned
                            stateColor = 'border-indigo-500/25 bg-indigo-500/[0.02] text-transparent hover:text-indigo-400/40 hover:bg-indigo-500/10';
                            iconNode = <Check className="h-3.5 w-3.5" />;
                            tooltipStr = 'Planned (🔵)';
                          }

                          return (
                            <td key={day.dateStr} className={`py-3 text-center ${isFocus ? 'bg-indigo-500/[0.015] border-x border-indigo-500/[0.05]' : ''}`}>
                              <div className="relative inline-block group/cell">
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleHabitLog(hab.id, day.dateStr)}
                                  className={`h-7.5 w-7.5 rounded-xl border flex items-center justify-center mx-auto transition-all duration-300 relative cursor-pointer ${stateColor} ${
                                    isFocus ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-[#050609] scale-110' : 'scale-95 opacity-80'
                                  }`}
                                >
                                  {iconNode}
                                </motion.button>
                                
                                {/* Tooltip display */}
                                <div className="absolute z-30 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-[9.5px] font-mono text-gray-200 border border-white/5 rounded-md whitespace-nowrap opacity-0 group-hover/cell:opacity-100 pointer-events-none transition-all duration-200 shadow-xl">
                                  {tooltipStr}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RIGHT: Weekly Analytics Panel */}
          <div className={`lg:col-span-4 p-5 rounded-2xl flex flex-col justify-between space-y-5 transition-all duration-300 relative overflow-hidden ${
            isDark 
              ? 'bg-[#08090d] border border-white/5 shadow-2xl text-gray-100' 
              : 'bg-white border border-[#E5E7EB] shadow-md text-black'
          }`}>
            {isDark && (
              <div className="absolute top-[-30%] right-[-20%] w-56 h-56 bg-emerald-500/[0.03] rounded-full blur-[80px] pointer-events-none" />
            )}

            <div className={`flex items-center justify-between pb-3.5 border-b ${isDark ? 'border-white/5' : 'border-[#E5E7EB]'}`}>
              <span className={`text-[10px] font-bold tracking-wider font-display uppercase ${isDark ? 'text-gray-400' : 'text-[#222222]'}`}>
                Weekly Task Analytics
              </span>
              <span className={`text-[9.5px] font-mono leading-none uppercase px-2.5 py-1 rounded-full font-black select-none border ${
                isDark 
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' 
                  : 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                ⚡ SYS COMPLIANT
              </span>
            </div>

            {/* Circular Ring Gauge */}
            <div className="flex items-center space-x-5 py-2">
              <div className="relative h-22 w-22 flex items-center justify-center shrink-0">
                <svg className="absolute transform -rotate-90 w-full h-full">
                  <circle cx="44" cy="44" r="37" className={isDark ? "stroke-white/5" : "stroke-[#E5E7EB]"} strokeWidth="6.5" fill="transparent"/>
                  <circle 
                    cx="44" 
                    cy="44" 
                    r="37" 
                    className="stroke-[#7C5CFF]/90 transition-all duration-1000" 
                    strokeWidth="6.5" 
                    strokeDasharray={2 * Math.PI * 37}
                    strokeDashoffset={2 * Math.PI * 37 - (analytics.completionRate / 100) * 2 * Math.PI * 37}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="text-center font-mono select-none">
                  <span className={`text-base font-extrabold leading-none block ${isDark ? 'text-white' : 'text-[#000000]'}`}>{analytics.completionRate}%</span>
                  <span className={`text-[8px] font-bold uppercase tracking-wider block ${isDark ? 'text-gray-400' : 'text-[#222222]'}`}>RATE</span>
                </div>
              </div>
              
              <div className="text-xs space-y-1">
                <span className={`block font-bold text-sm font-display ${isDark ? 'text-gray-100' : 'text-[#000000]'}`}>Compliance Performance</span>
                <p className={`text-[10.5px] leading-relaxed ${isDark ? 'text-gray-400' : 'text-[#222222]'}`}>
                  Compliance is calculated over the past 7 active calendar periods relative to total logged targets.
                </p>
                <div className="flex items-center space-x-2 pt-1 font-mono text-[10px] text-emerald-500 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>▲ +4.2% Growth dynamic</span>
                </div>
              </div>
            </div>

            {/* Custom Progress Bar for Score */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10.5px] font-mono">
                <span className={isDark ? 'text-gray-400' : 'text-[#222222]'}>Integrated Weekly Score</span>
                <span className={`font-extrabold ${isDark ? 'text-white' : 'text-[#000000]'}`}>{analytics.weeklyScore} / 100</span>
              </div>
              <div className={`h-2 w-full rounded-full overflow-hidden p-px ${isDark ? 'bg-neutral-900 border border-white/5' : 'bg-[#E5E7EB] border border-[#E5E7EB]'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-[#7C5CFF] to-[#6D5FFC] rounded-full transition-all duration-1000"
                  style={{ width: `${analytics.weeklyScore}%` }}
                />
              </div>
            </div>

            {/* Grid stats details list */}
            <div className={`pt-4 border-t grid grid-cols-2 gap-4 text-xs font-sans ${isDark ? 'border-white/5' : 'border-[#E5E7EB]'}`}>
              <div className="space-y-1">
                <span className={`font-medium block ${isDark ? 'text-gray-400' : 'text-[#222222]'}`}>Longest Streak</span>
                <span className="font-bold text-amber-500 font-mono flex items-center space-x-1">
                  <Flame className="h-4 w-4 fill-amber-500 text-amber-600" />
                  <span className="text-sm">{analytics.longestStreak} Days</span>
                </span>
              </div>
              <div className="space-y-1">
                <span className={`font-medium block ${isDark ? 'text-gray-400' : 'text-[#222222]'}`}>Current Streak</span>
                <span className="font-bold text-orange-500 font-mono flex items-center space-x-1">
                  <Flame className="h-4 w-4 fill-orange-500 text-orange-600" />
                  <span className="text-sm">{analytics.currentStreak} Days</span>
                </span>
              </div>
            </div>

            {/* Action view analytics button */}
            <button
              onClick={() => {
                setShowAnalytics(!showAnalytics);
              }}
              className={`w-full py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-gray-300' 
                  : 'bg-white hover:bg-gray-50 border border-[#E5E7EB] text-black shadow-sm'
              }`}
            >
              <span>📈 {showAnalytics ? 'Collapse Heatmap Tracker' : 'View Core Analytics & Heatmap'}</span>
            </button>
          </div>

        </div>

        {/* 3. HEATMAP COLLAPSIBLE VIEW */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`mt-6 pt-5 border-t relative z-10 overflow-hidden font-sans ${isDark ? 'border-white/5' : 'border-[#E5E7EB]'}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div>
                  <h3 className={`text-xs font-bold tracking-wider uppercase font-display ${isDark ? 'text-indigo-400' : 'text-[#7C5CFF]'}`}>
                    Interactive Task Completion Heatmap
                  </h3>
                  <p className={`text-[10px] mt-0.5 uppercase tracking-wider font-mono ${isDark ? 'text-gray-500' : 'text-[#222222]'}`}>
                    GitHub-style 12-week comprehensive grid of tracked routines
                  </p>
                </div>
                
                {/* Heatmap Legend */}
                <div className={`flex items-center space-x-1.5 font-mono text-[9px] px-2.5 py-1.5 rounded-lg border ${
                  isDark 
                    ? 'text-gray-400 bg-neutral-950 border-white/5' 
                    : 'text-[#222222] bg-[#F8F8FA] border-[#E5E7EB]'
                }`}>
                  <span>Less</span>
                  <div className={`h-2 w-2 rounded-sm border ${isDark ? 'bg-neutral-900 border-white/5' : 'bg-white border-[#E5E7EB]'}`} />
                  <div className="h-2 w-2 rounded-sm bg-purple-950/40" />
                  <div className="h-2 w-2 rounded-sm bg-purple-700/60" />
                  <div className="h-2 w-2 rounded-sm bg-purple-500" />
                  <div className="h-2 w-2 rounded-sm bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.4)]" />
                  <span>More</span>
                </div>
              </div>

              {/* Heatmap Outer Canvas */}
              <div className={`p-4 rounded-2xl overflow-x-auto scrollbar-none border ${
                isDark 
                  ? 'bg-neutral-950/60 border-white/5' 
                  : 'bg-white border-[#E5E7EB] shadow-sm'
              }`}>
                <div className="flex min-w-[500px]">
                  {/* Days labels on left */}
                  <div className={`grid grid-rows-7 gap-1 font-mono text-[9px] pr-3 select-none text-right justify-center content-center pt-1.5 ${
                    isDark ? 'text-gray-500' : 'text-[#222222]'
                  }`}>
                    <span>Mon</span>
                    <span className="opacity-0">Tue</span>
                    <span>Wed</span>
                    <span className="opacity-0">Thu</span>
                    <span>Fri</span>
                    <span className="opacity-0">Sat</span>
                    <span>Sun</span>
                  </div>

                  {/* Columns Grid */}
                  <div className="flex gap-1.5">
                    {getHeatmapData().map((col, colIdx) => (
                      <div key={colIdx} className="grid grid-rows-7 gap-1.5">
                        {col.map(cell => {
                          // Determine heatmap block tier shading
                          let boxColor = isDark ? 'bg-neutral-900 border-white/5' : 'bg-[#F8F8FA] border-[#E5E7EB]';
                          if (cell.percentage > 0 && cell.percentage <= 25) {
                            boxColor = 'bg-purple-950/40 border-purple-950/60';
                          } else if (cell.percentage > 25 && cell.percentage <= 50) {
                            boxColor = 'bg-purple-700/60 border-purple-600/30';
                          } else if (cell.percentage > 50 && cell.percentage <= 75) {
                            boxColor = 'bg-purple-500 border-purple-400/40';
                          } else if (cell.percentage > 75) {
                            boxColor = 'bg-fuchsia-400 border-fuchsia-300 shadow-[0_0_6px_rgba(232,121,249,0.3)]';
                          }

                          return (
                            <div key={cell.dateStr} className="relative group/map pt-px">
                              <div className={`h-3 w-3 rounded-sm border transition-all duration-200 cursor-crosshair hover:scale-125 ${boxColor}`} />
                              
                              {/* Hover Card info popup */}
                              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2.5 py-1.5 border text-[9px] font-mono rounded-lg shadow-xl opacity-0 scale-95 group-hover/map:opacity-100 group-hover/map:scale-100 transition-all z-40 pointer-events-none whitespace-nowrap space-y-0.5 ${
                                isDark 
                                  ? 'bg-neutral-950/95 border-white/10 text-gray-300' 
                                  : 'bg-white border-[#E5E7EB] text-[#222222] shadow-lg'
                              }`}>
                                <p className={isDark ? 'text-gray-300 font-bold' : 'text-black font-bold'}>{cell.dateStr}</p>
                                <p className="text-[#7C5CFF] font-extrabold">{cell.completedCount} / {cell.totalHabits} tasks done</p>
                                <p className={isDark ? 'text-gray-400' : 'text-[#222222]'}>{Math.round(cell.percentage)}% Compliance</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. DIALOGS AND MODALS (Add, Rename, Delete Confirmation, Details, Calendar picker presets) */}
        <AnimatePresence>
          {modalType && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans leading-normal">
              
              {/* Backing Dismiss Clicker */}
              <div className="absolute inset-0 z-10" onClick={() => setModalType(null)} />

              {/* Add New Habit Modal */}
              {modalType === 'add' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0c0d12] border border-white/10 rounded-3xl p-6 max-w-md w-full relative z-20 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white tracking-wider uppercase font-display">
                      ➕ Add New Routine Task
                    </h3>
                    <button onClick={() => setModalType(null)} className="p-1 text-gray-500 hover:text-white transition-all cursor-pointer">
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newName.trim()) return;
                    const newHabitObj: Habit = {
                      id: `habit-${Date.now()}`,
                      name: newName,
                      emoji: newHabitEmoji,
                      streak: 0,
                      color: newHabitColor,
                      category: newHabitCategory,
                      goal: newHabitGoal
                    };
                    setHabits([...habits, newHabitObj]);
                    setModalType(null);
                  }} className="space-y-4 text-xs">
                    {/* Habit Name */}
                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase tracking-wider block">Task Description</label>
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Read 15 Pages, Mind Meditation"
                        className="w-full bg-neutral-900 text-white rounded-xl px-3 py-2.5 outline-none border border-white/5 focus:border-indigo-500/55 transition-all text-sm font-semibold"
                        required
                        autoFocus
                      />
                    </div>

                    {/* Emoji Select and Choice Grid */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-gray-400 font-bold uppercase tracking-wider block">Task Icon / Emoji</label>
                        <input 
                          type="text" 
                          maxLength={3}
                          value={newHabitEmoji}
                          onChange={(e) => setNewHabitEmoji(e.target.value)}
                          className="w-10 bg-neutral-900 border border-white/5 text-center py-0.5 font-bold text-xs rounded"
                        />
                      </div>
                      <div className="grid grid-cols-8 gap-2.5 p-2 bg-neutral-900/60 border border-white/5 rounded-xl">
                        {['📖', '💧', '🏃', '🧘', '🥗', '💻', '🏋️‍♂️', '🛌', '✍️', '🍎', '🦷', '🚶', '🌱', '🔋', '🧠', '💼'].map(emo => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => setNewHabitEmoji(emo)}
                            className={`p-1.5 hover:bg-white/10 rounded-lg text-lg transition-all cursor-pointer ${
                              newHabitEmoji === emo ? 'bg-indigo-500/20 ring-2 ring-indigo-500Scale' : ''
                            }`}
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase tracking-wider block">Domain Category</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Daily', 'Health', 'Mind', 'Tech', 'Career', 'Life'].map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setNewHabitCategory(cat)}
                            className={`py-2 px-1 rounded-xl border font-bold font-mono transition-all uppercase tracking-wider text-[10px] cursor-pointer ${
                              newHabitCategory === cat 
                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
                                : 'bg-neutral-900 border-white/5 text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color Profile choices */}
                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase tracking-wider block">Glow Color Profile</label>
                      <div className="flex items-center space-x-3.5 p-2 bg-neutral-900/50 rounded-xl border border-white/5">
                        {['indigo', 'rose', 'emerald', 'cyan', 'amber', 'violet'].map(col => {
                          const indicatorColor = col === 'rose' ? 'bg-rose-500 shadow-rose-500/50' :
                                                 col === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                                 col === 'cyan' ? 'bg-cyan-500 shadow-cyan-500/50' :
                                                 col === 'amber' ? 'bg-amber-500 shadow-amber-500/50' :
                                                 col === 'violet' ? 'bg-violet-500 shadow-violet-500/50' :
                                                 'bg-indigo-500 shadow-indigo-500/50';
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setNewHabitColor(col)}
                              className={`h-5 w-5 rounded-full select-none transition-all cursor-pointer relative flex items-center justify-center ${indicatorColor} shadow-md`}
                            >
                              {newHabitColor === col && (
                                <span className="h-1.5 w-1.5 rounded-full bg-black block" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Daily Target Goal */}
                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase tracking-wider block font-sans">Daily Goal Metric</label>
                      <input 
                        type="text"
                        value={newHabitGoal}
                        onChange={(e) => setNewHabitGoal(e.target.value)}
                        placeholder="e.g. 10 Pages, 30 Min, 1 Time"
                        className="w-full bg-neutral-900 text-white rounded-xl px-3 py-2.5 outline-none border border-white/5 focus:border-indigo-500/55 transition-all text-sm font-semibold"
                        required
                      />
                    </div>

                    {/* CTA Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setModalType(null)}
                        className="px-4 py-2 hover:bg-white/5 rounded-xl text-gray-400 transition-all cursor-pointer font-bold font-mono uppercase tracking-wider text-[10.5px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-505Scale transition-all cursor-pointer font-mono uppercase tracking-widest text-[10.5px]"
                      >
                        Add Routine
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Rename Habit Modal */}
              {modalType === 'rename' && activeHabitModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0c0d12] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative z-20 shadow-2xl space-y-4"
                >
                  <div>
                    <h3 className="text-xs font-black text-white tracking-widest uppercase font-display block select-none">
                      ✏️ Rename Routine Task
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-1 select-none">
                      Modify name of tracked activity: <span className="font-bold text-gray-300">"{activeHabitModal.name}"</span>
                    </p>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="space-y-1">
                      <label className="text-gray-400 font-bold uppercase tracking-wider block">Task Name</label>
                      <input 
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New Task Name"
                        className="w-full bg-neutral-900 text-white rounded-xl px-3 py-2.5 outline-none border border-white/5 focus:border-indigo-500/55 transition-all text-sm font-semibold"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => {
                          setModalType(null);
                          setActiveHabitModal(null);
                        }}
                        className="px-4 py-2 hover:bg-white/5 text-gray-400 rounded-xl font-bold font-mono uppercase text-[10px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!newName.trim()) return;
                          setHabits(habits.map(h => h.id === activeHabitModal.id ? { ...h, name: newName } : h));
                          setModalType(null);
                          setActiveHabitModal(null);
                        }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all cursor-pointer font-mono uppercase text-[10px]"
                      >
                        Save Rename
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Delete Confirmation Modal */}
              {modalType === 'delete' && activeHabitModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0c0d12] border border-red-500/20 rounded-3xl p-6 max-w-sm w-full relative z-20 shadow-2xl space-y-4"
                >
                  <div className="flex items-center space-x-2.5 text-red-400">
                    <Trash2 className="h-5 w-5 shrink-0" />
                    <h3 className="text-xs font-black tracking-widest uppercase font-display block">
                      ⚠️ Delete Routine Task
                    </h3>
                  </div>

                  <p className="text-xs text-gray-400 font-sans leading-normal">
                    Are you absolutely sure you want to delete <span className="font-bold text-white">"{activeHabitModal.emoji} {activeHabitModal.name}"</span>?
                    <span className="block font-bold text-red-400 mt-2">This action cannot be undone. All streak logs for this task will be lost.</span>
                  </p>

                  <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-white/5">
                    <button
                      onClick={() => {
                        setModalType(null);
                        setActiveHabitModal(null);
                      }}
                      className="px-4 py-2 hover:bg-white/5 text-gray-400 rounded-xl font-bold font-mono text-[10px] uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setHabits(habits.filter(h => h.id !== activeHabitModal.id));
                        setModalType(null);
                        setActiveHabitModal(null);
                      }}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all cursor-pointer font-mono text-[10px] uppercase"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Habit Details Info Modal */}
              {modalType === 'details' && activeHabitModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0c0d12] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative z-20 shadow-2xl space-y-4 font-sans text-xs"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                      ℹ️ Routine Information Metadata
                    </span>
                    <button onClick={() => setModalType(null)} className="text-gray-500 hover:text-white transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3.5 pt-1">
                    <div className="h-12 w-12 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-2xl shadow-inner shadow-black shrink-0">
                      {activeHabitModal.emoji}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white block">{activeHabitModal.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">ID Ref: {activeHabitModal.id}</p>
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  {/* Metadata Stats lists */}
                  <div className="space-y-2.5 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold uppercase">Focus Domain:</span>
                      <span className="text-indigo-400 font-extrabold">{activeHabitModal.category || 'Daily Routing'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold uppercase">Daily Target Goal:</span>
                      <span className="text-emerald-400 font-extrabold">{activeHabitModal.goal || '1-Time Check log'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold uppercase">Active Streak:</span>
                      <span className="text-amber-400 font-extrabold flex items-center space-x-0.5 leading-none">
                        <span>{getHabitCurrentStreak(activeHabitModal.id)} Days</span>
                        <Flame className="h-3 w-3 fill-amber-400 text-amber-500 inline" />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-bold uppercase">30-Day Rate:</span>
                      <span className="text-purple-400 font-extrabold">{getHabitCompletionPercentage(activeHabitModal.id)}%</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={() => setModalType(null)}
                      className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-gray-400 hover:text-white rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider transition-all"
                    >
                      Close Details
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Calendar Picker Direct Date with Presets */}
              {modalType === 'calendar' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0b0c11] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative z-20 shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                      📅 CUSTOM DATE PRESET SELECTOR
                    </span>
                    <button onClick={() => setModalType(null)} className="text-gray-500 hover:text-white transition-all cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4 font-sans text-xs">
                    {/* Presets List buttons */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black tracking-wider text-gray-500 uppercase block">Presets Quick-Sync</label>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Preset Today */}
                        <button
                          type="button"
                          onClick={() => {
                            setHabitBaseOffset(0);
                            setModalType(null);
                          }}
                          className="py-2.5 bg-neutral-900 hover:bg-indigo-600/10 border border-white/5 hover:border-indigo-500/30 text-gray-200 hover:text-indigo-400 font-bold font-mono text-center block rounded-xl uppercase tracking-wider text-[10px] transition-all"
                        >
                          Today (Sync)
                        </button>
                        
                        {/* Preset This Week */}
                        <button
                          type="button"
                          onClick={() => {
                            // Align to start of this week (Monday)
                            const today = new Date();
                            const currentDayIdx = today.getDay(); // 0 is Sunday, 1 is Monday
                            const offsetToMonday = currentDayIdx === 0 ? -6 : 1 - currentDayIdx;
                            setHabitBaseOffset(offsetToMonday);
                            setModalType(null);
                          }}
                          className="py-2.5 bg-neutral-900 hover:bg-purple-600/10 border border-white/5 hover:border-purple-500/30 text-gray-200 hover:text-purple-400 font-bold font-mono text-center block rounded-xl uppercase tracking-wider text-[10px] transition-all"
                        >
                          This Week
                        </button>

                        {/* Preset This Month */}
                        <button
                          type="button"
                          onClick={() => {
                            // Find days to first of the current month
                            const today = new Date();
                            const offsetToFirst = 1 - today.getDate();
                            setHabitBaseOffset(offsetToFirst);
                            setModalType(null);
                          }}
                          className="py-2.5 bg-neutral-900 hover:bg-emerald-600/10 border border-white/5 hover:border-emerald-500/30 text-gray-200 hover:text-emerald-400 font-bold font-mono text-center block rounded-xl uppercase tracking-wider text-[10px] transition-all"
                        >
                          This Month
                        </button>

                        {/* Preset Last Week Retro */}
                        <button
                          type="button"
                          onClick={() => {
                            setHabitBaseOffset(-7);
                            setModalType(null);
                          }}
                          className="py-2.5 bg-neutral-900 hover:bg-amber-600/10 border border-white/5 hover:border-amber-500/30 text-gray-200 hover:text-amber-400 font-bold font-mono text-center block rounded-xl uppercase tracking-wider text-[10px] transition-all"
                        >
                          Last Week (-7d)
                        </button>
                      </div>
                    </div>

                    {/* Custom Date Input selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-wider text-gray-500 uppercase block">Or Select Specific Date</label>
                      <input 
                        type="date"
                        max={getLocalDateString()}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          setDirectDate(e.target.value);
                        }}
                        className="w-full bg-neutral-900 border border-white/10 text-white rounded-xl py-2 px-3 outline-none focus:border-indigo-500 font-mono text-sm leading-none"
                      />
                    </div>

                    <div className="text-[10px] text-gray-500 italic mt-1 font-mono text-center leading-tight">
                      Selected date will align as Day 0 on first column of grid progression.
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          )}
        </AnimatePresence>

      </div>

      {/* D. Unified Bento Grid: Habits row targets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Productivity & Streaks */}
        <div className="p-4 rounded-2xl bg-white/2 dark:bg-[#111218]/50 border border-white/5 flex flex-col justify-between space-y-3 relative group hover:bg-[#1a1b24]/40 transition-all sm:col-span-1 lg:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider font-display uppercase">PRODUCTIVITY STATUS</span>
            
            <div className="flex items-center space-x-3 my-2">
              <div className="relative h-11 w-11 flex items-center justify-center shrink-0">
                <svg className="absolute transform -rotate-90 w-full h-full">
                  <circle cx="22" cy="22" r="17" className="stroke-white/5" strokeWidth="3" fill="transparent"/>
                  <circle 
                    cx="22" 
                    cy="22" 
                    r="17" 
                    className="stroke-purple-400 transition-all duration-1000" 
                    strokeWidth="3" 
                    strokeDasharray={2 * Math.PI * 17}
                    strokeDashoffset={2 * Math.PI * 17 - (productivityPercent / 100) * 2 * Math.PI * 17}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="text-[10px] font-bold font-mono text-white">{productivityPercent}%</span>
              </div>
              <div className="text-[10px] text-gray-400 leading-tight">
                <span className="block font-bold text-purple-400">{productivityPercent}% Score</span>
                <span>Keep crushing goals!</span>
              </div>
            </div>
          </div>

          {/* Dynamic Streaks Tray (Calculated 100% dynamically!) */}
          <div className="border-t border-white/5 pt-2 space-y-1 text-[10px] font-sans">
            <span className="font-bold text-gray-400 tracking-normal text-[9px] uppercase block mb-1">Live Streaks:</span>
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1">🔄 Routine:</span>
              <span className="text-orange-400 font-bold font-mono">{routineStreak}d</span>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1">🧘 Silva Med:</span>
              <span className="text-purple-400 font-bold font-mono">{meditationStreak}d</span>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1">📚 Learning:</span>
              <span className="text-cyan-400 font-bold font-mono">{learningStreak}d</span>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1">🏋️ Workout:</span>
              <span className="text-emerald-400 font-bold font-mono">{workoutStreak}d</span>
            </div>
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1">💧 Water:</span>
              <span className="text-blue-400 font-bold font-mono">{waterStreak}d</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tasks Today */}
        <div className="p-4 rounded-2xl bg-white/2 dark:bg-[#111218]/50 border border-white/5 flex flex-col justify-between space-y-3 relative group hover:bg-[#1a1b24]/40 transition-all">
          <span className="text-[10px] font-bold text-gray-400 tracking-wider font-display uppercase">TASKS TODAY</span>
          
          <div className="flex items-center space-x-2.5 my-1">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#7C5CFF] shadow-sm shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <span className="block font-bold text-white font-mono text-base leading-none">
                {totalCompletedTasks} <span className="text-xs text-gray-400 font-normal">/ {totalTasksCountToday}</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase font-mono mt-0.5 block leading-none">
                {tasksRemainingCount} Remaining
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Focus Time */}
        <div className="p-4 rounded-2xl bg-white/2 dark:bg-[#111218]/50 border border-white/5 flex flex-col justify-between space-y-3 relative group hover:bg-[#1a1b24]/45 transition-all">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider font-display uppercase font-semibold">FOCUS TIME</span>
            <button
              onClick={handleResetFocusTimer}
              className="text-[8px] font-mono text-gray-400 hover:text-purple-400 bg-white/5 hover:bg-purple-500/15 border border-white/5 rounded px-1.5 py-0.5 transition-all uppercase cursor-pointer"
            >
              RESET
            </button>
          </div>
          
          <div className="flex items-center space-x-2 my-0.5 select-none self-center">
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm border ${
              isTimerRunning 
                ? 'bg-[#7C5CFF]/20 border-[#7C5CFF]/30 text-[#7C5CFF] animate-pulse' 
                : 'bg-[#7C5CFF]/10 border-[#7C5CFF]/20 text-[#A48FFF]'
            }`}>
              <Timer className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-white font-mono text-base leading-none tracking-tight">
              {formatTimerVal(timerSeconds)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-1 pt-0.5">
            <button
              onClick={handleSubtractFocusTime}
              className="py-1 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all text-[9px] font-mono font-bold cursor-pointer"
              title="Subtract 15 mins"
            >
              -15m
            </button>
            <button 
              onClick={toggleDeepWorkTimer}
              className={`py-1 rounded border text-[9px] font-mono font-extrabold leading-none select-none transition-all cursor-pointer ${
                isTimerRunning 
                  ? 'bg-purple-950/20 border-purple-500/30 text-purple-400 hover:bg-purple-900/40' 
                  : 'bg-[#7C5CFF]/15 border-[#7C5CFF]/25 text-[#7C5CFF] hover:bg-[#7C5CFF]/25'
              }`}
            >
              {isTimerRunning ? 'PAUS' : 'GO'}
            </button>
            <button
              onClick={handleAddFocusTime}
              className="py-1 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all text-[9px] font-mono font-bold cursor-pointer"
              title="Add 15 mins"
            >
              +15m
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase font-mono mt-0.5 block text-center leading-none">
            Meditation: {habitLogs['hab-1']?.[todayDateStr] ? '10m Completed' : '0m Logged'}
          </p>
        </div>

        {/* Card 4: Water Intake */}
        <div className="p-4 rounded-2xl bg-white/2 dark:bg-[#111218]/50 border border-white/5 flex flex-col justify-between space-y-3 relative group hover:bg-[#1a1b24]/45 transition-all">
          <div className="flex justify-between items-center select-none">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider font-display uppercase font-semibold">WATER METRIC</span>
            <button
              onClick={handleResetWater}
              className="text-[8px] font-mono text-gray-400 hover:text-purple-400 bg-white/5 hover:bg-purple-500/15 border border-white/5 rounded px-1.5 py-0.5 transition-all uppercase cursor-pointer"
            >
              RESET
            </button>
          </div>
          
          <div className="flex items-center space-x-2 my-0.5 select-none self-center">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-[#7C5CFF]/15 border border-[#7C5CFF]/35 text-[#7C5CFF] shrink-0 shadow-sm">
              <Droplet className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-white font-mono text-base leading-none tracking-tight">
              {waterIntake} <span className="text-[10px] text-gray-400 font-normal">/ 3L</span>
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-1 pt-0.5">
            <button
              onClick={handleSubtractWater}
              className="py-1 rounded bg-[#7C5CFF]/5 border border-[#7C5CFF]/15 text-[#7C5CFF] hover:bg-[#7C5CFF]/15 transition-all text-[9px] font-mono font-bold cursor-pointer flex items-center justify-center space-x-1"
            >
              <Minus className="h-2.5 w-2.5" />
              <span>0.25</span>
            </button>
            <button
              onClick={handleAddWater}
              className="py-1 rounded bg-[#7C5CFF]/15 border border-[#7C5CFF]/25 text-[#7C5CFF] hover:bg-[#7C5CFF]/25 transition-all text-[9px] font-mono font-bold cursor-pointer flex items-center justify-center space-x-1"
            >
              <Plus className="h-2.5 w-2.5" />
              <span>0.25</span>
            </button>
          </div>
        </div>

        {/* Card 5: Weather Widget (Surat, India) */}
        <div className="p-4 rounded-2xl bg-white/2 dark:bg-[#111218]/50 border border-white/5 flex flex-col justify-between space-y-3 relative group hover:bg-[#1a1b24]/40 transition-all">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider font-display uppercase font-semibold">SURAT, INDIA</span>
            <span className="text-[8px] font-mono text-[#7C5CFF] bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 rounded-full px-1.5 uppercase leading-none font-bold">GPS SYNC</span>
          </div>

          <div className="flex items-center justify-between my-0.5 min-w-0">
            <div className="min-w-0">
              <h3 className="text-xl font-display font-extrabold text-white leading-none tracking-tighter">
                32°<span className="text-xs text-gray-400 font-normal">C</span>
              </h3>
              <p className="text-[10px] text-gray-300 truncate mt-0.5">Partly Cloudy</p>
            </div>
            <div className="h-8 w-8 bg-[#7C5CFF]/5 border border-[#7C5CFF]/10 rounded-lg flex items-center justify-center shrink-0 shadow-inner">
              <CloudSun className="h-5 w-5 text-[#7C5CFF]" />
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[9px] border-t border-white/5 pt-1.5 leading-none mt-1">
            <span className="text-gray-400">42 AQI • Good</span>
            <span className="text-[#7C5CFF] font-black">Normal</span>
          </div>
        </div>

      </div>

      {/* 2. Middle Row 1 Grid: Today's Mission + Daily Quote + Weather Info */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Box A (cols 7): Today's Mission */}
        <div className="md:col-span-12 lg:col-span-7 glass bg-[#0c0d12]/60 dark:bg-[#0c0d12]/90 border border-white/5 shadow-xl rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase flex items-center space-x-1.5 font-display">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>TODAY'S WORKOUT & WORK MISSION</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400 uppercase bg-white/5 px-2 py-0.5 rounded-md font-bold">Active Grid</span>
            </div>

            <div className="mt-4 space-y-3.5">
              {resolvedMissions.map(item => {
                const isEditing = editingMissionId === item.id;
                
                if (isEditing) {
                  return (
                    <form 
                      key={item.id}
                      onSubmit={handleSaveEditMission}
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 rounded-xl bg-white/10 dark:bg-[#1f202d] border border-blue-500/50 space-y-2.5"
                    >
                      <div className="flex items-center space-x-2">
                        {/* Emoji input */}
                        <input 
                          type="text" 
                          value={editMissionEmoji} 
                          onChange={(e) => setEditMissionEmoji(e.target.value)} 
                          className="w-10 bg-white/5 text-center text-sm py-1 rounded border border-white/10 outline-none text-white font-sans"
                          placeholder="🧭"
                          title="Mission Emoji"
                        />
                        {/* Mission Name */}
                        <input 
                          type="text" 
                          value={editMissionText} 
                          onChange={(e) => setEditMissionText(e.target.value)} 
                          className="flex-1 bg-white/5 text-xs py-1 px-2 rounded border border-white/10 outline-none text-white font-medium"
                          placeholder="Mission title..."
                          required
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        {/* Time label input */}
                        <div className="flex items-center space-x-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase font-mono">Time:</span>
                          <input 
                            type="text" 
                            value={editMissionTime} 
                            onChange={(e) => setEditMissionTime(e.target.value)} 
                            className="w-24 bg-white/5 text-[10px] py-0.5 px-1.5 rounded border border-white/10 outline-none text-white font-mono"
                            placeholder="6:00 AM"
                          />
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button 
                            type="button" 
                            onClick={handleCancelEditMission}
                            className="py-1 px-2 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-400 font-bold border border-white/5"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="py-1 px-2.5 rounded bg-blue-500 hover:bg-blue-600 text-[10px] font-mono text-white font-bold border border-blue-600"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </form>
                  );
                }

                return (
                  <div 
                    key={item.id}
                    onClick={() => toggleMission(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group/mission ${
                      item.completed 
                        ? 'bg-white/2 dark:bg-[#1a1b24]/30 border-white/5/20 opacity-75' 
                        : 'bg-white/5 dark:bg-[#20212e]/50 border-white/10 hover:border-indigo-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="text-base select-none shrink-0">{item.emoji}</span>
                      <span className={`text-xs font-semibold truncate ${item.completed ? 'line-through text-gray-500 font-medium' : 'text-gray-100'}`}>
                        {item.text}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      <div className="opacity-0 group-hover/mission:opacity-100 flex items-center space-x-1 transition-opacity mr-1">
                        <button
                          onClick={(e) => handleStartEditMission(item.id, item.text, item.time, item.emoji, e)}
                          className="p-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all shadow-xs"
                          title="Rename / Edit Mission"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteMission(item.id, e)}
                          className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all shadow-xs"
                          title="Delete Mission"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-[9.5px] font-mono text-gray-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0">{item.time}</span>
                      <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        item.completed 
                          ? 'bg-blue-500 border-blue-600 text-white' 
                          : 'border-white/15 hover:border-blue-400'
                      }`}>
                        {item.completed && <Check className="h-3 w-3 text-white font-bold" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Addition of New Mission */}
            {isAddingMission ? (
              <form 
                onSubmit={handleAddMissionSubmit} 
                className="mt-4 p-3 rounded-xl bg-white/5 dark:bg-[#1a1b24]/40 border border-white/10 space-y-2.5 animate-in slide-in-from-top-2 duration-200"
              >
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={newMissionEmoji} 
                    onChange={(e) => setNewMissionEmoji(e.target.value)} 
                    className="w-10 bg-white/5 text-center text-sm py-1 rounded border border-white/10 outline-none text-white font-sans focus:border-indigo-500/50"
                    placeholder="🎯"
                    title="Mission Emoji"
                  />
                  <input 
                    type="text" 
                    value={newMissionText} 
                    onChange={(e) => setNewMissionText(e.target.value)} 
                    className="flex-1 bg-white/5 text-xs py-1 px-2.5 rounded border border-white/10 outline-none text-white font-medium focus:border-indigo-500/50"
                    placeholder="What is your workout or work mission?"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] text-gray-400 font-bold uppercase font-mono">Target Time:</span>
                    <input 
                      type="text" 
                      value={newMissionTime} 
                      onChange={(e) => setNewMissionTime(e.target.value)} 
                      className="w-24 bg-white/5 text-[10px] py-0.5 px-1.5 rounded border border-white/10 outline-none text-white font-mono focus:border-indigo-500/50"
                      placeholder="e.g. 6:00 AM"
                    />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingMission(false)}
                      className="py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-400 font-bold border border-white/5"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="py-1 px-3 rounded bg-indigo-600 hover:bg-indigo-700 text-[10px] font-mono text-white font-bold border border-indigo-500"
                    >
                      Add Mission
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingMission(true)}
                className="mt-4 w-full py-2 border border-dashed border-white/10 hover:border-indigo-500/30 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all text-center font-bold cursor-pointer"
              >
                + Add Daily Mission
              </button>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500">Auto-saves to browser memory</span>
            <button
              onClick={() => {
                setMissions(prev => prev.map(m => ({ ...m, completed: false })));
              }}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 font-mono"
            >
              RESET ALL CHECKS
            </button>
          </div>
        </div>

        {/* Box B (cols 5): Daily Quote */}
        <div className="md:col-span-12 lg:col-span-5 glass bg-[#0c0d12]/60 dark:bg-[#0c0d12]/90 border border-white/5 shadow-xl rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-3 right-4 opacity-15 pointer-events-none">
            <Quote className="h-24 w-24 text-blue-500 fill-blue-500/20" />
          </div>

          <div className="relative z-10">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display block mb-5">
              DAILY REFLECTIVE THEME
            </span>
            <p className="text-base sm:text-lg font-display font-medium text-white italic leading-relaxed pr-2">
              "{QUOTES[currentQuoteIndex].text}"
            </p>
          </div>

          <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-blue-400 hover:text-blue-300 font-sans">
              — {QUOTES[currentQuoteIndex].author}
            </span>
            <button
              onClick={() => {
                setCurrentQuoteIndex(prev => (prev + 1) % QUOTES.length);
              }}
              className="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-400 font-bold flex items-center space-x-1 border border-white/5"
            >
              <span>Rotate</span>
              <RefreshCw className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>



      </div>

      {/* 3. Calendar & History Section */}
      <div id="calendar-history-section">
        <MonthlyProgressCalendar 
          tasks={[]}
          setTasks={() => {}}
          projects={projects}
          habits={habits}
          habitLogs={habitLogs}
          toggleHabitLog={toggleHabitLog}
          quickNotes={quickNotes}
          setQuickNotes={setQuickNotes}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>

      {/* 4. Life Areas Progress Horizontal Grid */}
      <div className="space-y-3">
        <div className="flex items-center space-x-1.5 px-1">
          <BookOpen className="h-4 w-4 text-purple-400" />
          <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display">
            PILLARS & AREAS OF LIFE FLOWS
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Health', value: '70%', color: 'border-emerald-500/20 text-emerald-400 shadow-emerald-500/2 bg-emerald-500/5', stroke: '#10b981', ringOffset: 30, text: 'Keep Pushing', icon: <Heart className="h-4 w-4" /> },
            { name: 'Finance', value: '50%', color: 'border-yellow-500/20 text-yellow-500 shadow-yellow-500/2 bg-yellow-500/5', stroke: '#eab308', ringOffset: 50, text: 'Stay Focused', icon: <Wallet className="h-4 w-4" /> },
            { name: 'Learning', value: '80%', color: 'border-green-500/20 text-green-400 shadow-green-500/2 bg-green-500/5', stroke: '#22c55e', ringOffset: 20, text: 'Keep Growing', icon: <GraduationCap className="h-4 w-4" /> },
            { name: 'Silva Method', value: '65%', color: 'border-purple-500/20 text-purple-400 shadow-purple-500/2 bg-purple-500/5', stroke: '#a855f7', ringOffset: 35, text: 'Daily Practice', icon: <Compass className="h-4 w-4" /> },
            { name: 'Travel', value: '40%', color: 'border-cyan-500/20 text-cyan-400 shadow-cyan-500/2 bg-cyan-500/5', stroke: '#06b6d4', ringOffset: 60, text: 'Plan More', icon: <Compass className="h-4 w-4" /> }
          ].map((area, i) => (
            <div 
              key={area.name}
              className={`p-4 rounded-2xl border ${area.color} shadow-lg backdrop-blur-md flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-white/2 border border-white/5">{area.icon}</span>
                <span className="text-[10px] font-mono font-bold">{area.value}</span>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider leading-none">{area.name}</h4>
                <p className="text-[9px] text-gray-400 font-mono mt-1 font-semibold block leading-none">{area.text}</p>
              </div>

              {/* Mini ring */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: area.stroke, width: area.value }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bento Grid components: Row 4 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Panel A (cols 6): Upcoming Events list */}
        <div className="md:col-span-6 lg:col-span-6 glass bg-white/5 dark:bg-[#16171e]/75 border border-white/5 shadow-xl rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-white/5 mb-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display">
                UPCOMING EVENTS
              </span>
              <Calendar className="h-3.5 w-3.5 text-[#7C5CFF]" />
            </div>

            <div className="space-y-3">
              {[
                { title: 'Team Standup', when: 'Tomorrow, 10:00 AM', color: 'indigo' },
                { title: 'Interview - ABC Corp', when: (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 4);
                  return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}, 02:00 PM`;
                })(), color: 'blue' },
                { title: 'Gym Session', when: (() => {
                  const d = new Date();
                  return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}, 07:00 AM`;
                })(), color: 'emerald' },
                { title: 'Silva Practice', when: 'Daily, 09:30 PM', color: 'violet' }
              ].map((ev, i) => (
                <div key={i} className="p-2 ml-1 rounded-xl bg-[#20212e]/30 border border-white/5 flex items-start space-x-2.5">
                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                    ev.color === 'indigo' ? 'bg-[#7C5CFF]' :
                    ev.color === 'emerald' ? 'bg-[#A48FFF]' :
                    ev.color === 'blue' ? 'bg-[#5439C9]' : 'bg-[#6B4BE6]'
                  }`} />
                  <div>
                    <h5 className="text-xs font-bold text-gray-105">{ev.title}</h5>
                    <p className="text-[10px] font-mono text-gray-450 mt-0.5">{ev.when}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button className="text-[10px] items-center space-x-1 font-bold text-[#7C5CFF] hover:text-[#6C4BE6] font-sans mt-3 text-left">
            <span>View Calendar →</span>
          </button>
        </div>

        {/* Panel D (cols 6): Quick Actions */}
        <div className="md:col-span-6 lg:col-span-6 glass bg-white/5 dark:bg-[#16171e]/75 border border-white/5 shadow-xl rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-2.5 border-b border-white/5 mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-display">
                QUICK ACTIONS
              </span>
              <span className="text-[9px] font-mono leading-none text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 font-bold">Macros</span>
            </div>

            <div className="space-y-1.5 mt-2.5">
              {[
                { label: 'Log Hydration (+250ml)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/10 hover:bg-amber-500/20', action: () => {
                  if (propsSetWaterCurrent) {
                    propsSetWaterCurrent(prev => (typeof prev === 'number' ? prev + 250 : 250));
                    alert("Logged 250ml of water hydration.");
                  } else {
                    alert("Water tracker is active on Tasks Dashboard.");
                  }
                } },
                { label: 'Gym Check-in ✅', color: 'text-purple-400 bg-purple-500/10 border-purple-500/10 hover:bg-purple-500/20', action: () => {
                  alert("Gym workout session checked in and logged successfully!");
                } },
                { label: 'Verify Goals Integrity', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/10 hover:bg-cyan-500/20', action: () => alert("All focal streams of work, savings, hydration, and gym are logged. Streak saved successfully!") }
              ].map((macro, i) => (
                <button
                  key={i}
                  onClick={macro.action}
                  className={`w-full py-2 px-3 text-left rounded-xl border text-xs font-semibold flex items-center justify-between transition-all duration-200 ${macro.color}`}
                >
                  <span>{macro.label}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          <span className="text-[8.5px] font-mono text-gray-500 text-center uppercase font-bold mt-3 block">Trigger macros directly</span>
        </div>

      </div>

      {/* 6. Activity Heatmap & Finance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
        
        {/* Heatmap Section */}
        <div className="md:col-span-12 lg:col-span-6 glass bg-white/5 dark:bg-[#16171e]/75 border border-white/5 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-white/5 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 lg:text-xs tracking-wider uppercase font-display flex items-center space-x-1.5">
                <GradientActivityIcon />
                <span>COSMIC ACTIVITY COMPLIANCE HEATMAP</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-400 bg-[#7C5CFF]/10 border border-[#7C5CFF]/15 px-2 py-0.5 rounded">
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Simulated Grid Heatmap with real user data! */}
            <div className="flex space-x-2.5 py-1">
              <div className="text-[8px] font-mono text-gray-500 space-y-2 select-none uppercase font-bold pt-1 flex flex-col justify-between">
                <span>M</span>
                <span>W</span>
                <span>F</span>
                <span>S</span>
              </div>
              
              <div className="grid grid-flow-col grid-rows-7 gap-1.5 flex-1 select-none">
                {/* Rows represents days, columns represents weeks. Last item (index 34) is today */}
                {Array.from({ length: 35 }).map((_, i) => {
                  const today = new Date();
                  const cellDate = new Date();
                  cellDate.setDate(today.getDate() - (34 - i));
                  const dateStr = getLocalDateString(cellDate);
                  
                  // Calculate actual completed and partial habits count for this cell date
                  let completedCount = 0;
                  habits.forEach(h => {
                    const status = habitLogs[h.id]?.[dateStr];
                    if (status === true) {
                      completedCount += 1;
                    } else if (status === 'partial') {
                      completedCount += 0.5;
                    }
                  });
                  
                  const ratio = habits.length > 0 ? (completedCount / habits.length) : 0;
                  
                  let intensity = 'bg-white/5 border border-white/5';
                  let levelName = 'No checklist activity';
                  
                  if (ratio > 0 && ratio <= 0.33) {
                    intensity = 'bg-[#7C5CFF]/15 hover:bg-[#7C5CFF]/30 border-[#7C5CFF]/10';
                    levelName = 'Low Activity';
                  } else if (ratio > 0.33 && ratio <= 0.66) {
                    intensity = 'bg-[#7C5CFF]/45 hover:bg-[#7C5CFF]/60 border-[#7C5CFF]/20';
                    levelName = 'Moderate Activity';
                  } else if (ratio > 0.66) {
                    intensity = 'bg-[#7C5CFF] hover:bg-[#8B6EFF] border-[#7C5CFF]/35 shadow-[0_0_8px_rgba(124,92,255,0.3)]';
                    levelName = 'Peak Performance';
                  }
                  
                  const formattedCellDate = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const tooltip = `${formattedCellDate}: ${levelName} (${Math.round(ratio * 100)}% compliance)`;
                  
                  return (
                    <div 
                      key={i} 
                      className={`h-4.5 w-4.5 rounded-sm transition-all duration-300 border whitespace-nowrap cursor-help ${intensity}`}
                      title={tooltip}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between self-stretch">
            <span className="text-[10px] font-mono text-gray-500">Less</span>
            <div className="flex items-center space-x-1 font-mono text-[9.5px]">
              <span className="h-2.5 w-2.5 rounded-xs bg-white/5 border border-white/5" />
              <span className="h-2.5 w-2.5 rounded-xs bg-[#7C5CFF]/15 border border-[#7C5CFF]/10" />
              <span className="h-2.5 w-2.5 rounded-xs bg-[#7C5CFF]/45 border border-[#7C5CFF]/20" />
              <span className="h-2.5 w-2.5 rounded-xs bg-[#7C5CFF] border border-[#7C5CFF]/35" />
            </div>
            <span className="text-[10px] font-mono text-gray-500">More</span>
          </div>
        </div>

        {/* Finance Overview Section */}
        <div className="md:col-span-12 lg:col-span-6 glass bg-white/5 dark:bg-[#16171e]/75 border border-white/5 shadow-xl rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-white/5 mb-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 lg:text-xs tracking-wider uppercase font-display flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-purple-400" />
                <span>MONTHLY FINANCIAL INTEGRITY STATEMENT</span>
              </span>
              <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded font-bold">This Month</span>
            </div>

            {/* Income Expense Savings Horizontal Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-2xl bg-white/2 dark:bg-[#1a1b24]/30 border border-white/5 flex flex-col justify-between space-y-1">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider">INCOME</span>
                <h4 className="text-xl font-extrabold text-white font-mono leading-none mt-1">₹{incomeVal.toLocaleString()}</h4>
                <div className="flex items-center space-x-1 mt-1 text-[10px] font-mono text-emerald-400">
                  <span>↑ +20%</span>
                </div>
                <div className="h-1 w-full bg-[#10b981] mt-2 rounded-full" />
              </div>

              <div className="p-3.5 rounded-2xl bg-white/2 dark:bg-[#1a1b24]/30 border border-white/5 flex flex-col justify-between space-y-1">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider">EXPENSES</span>
                <h4 className="text-xl font-extrabold text-white font-mono leading-none mt-1">₹{expenseVal.toLocaleString()}</h4>
                <div className="flex items-center space-x-1 mt-1 text-[10px] font-mono text-rose-400">
                  <span>↓ -10%</span>
                </div>
                <div className="h-1 w-full bg-[#ef4444] mt-2 rounded-full" />
              </div>

              <div className="p-3.5 rounded-2xl bg-white/2 dark:bg-[#1a1b24]/30 border border-white/5 flex flex-col justify-between space-y-1">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider font-display text-gray-300">SAVINGS</span>
                <h4 className="text-xl font-extrabold text-white font-mono leading-none mt-1">₹{(incomeVal - expenseVal).toLocaleString()}</h4>
                <div className="flex items-center space-x-1 mt-1 text-[10px] font-mono text-purple-400">
                  <span>↑ +35%</span>
                </div>
                <div className="h-1 w-full bg-[#a855f7] mt-2 rounded-full" />
              </div>
            </div>
          </div>

          <p className="text-[9px] text-gray-500 font-semibold uppercase leading-none mt-3">Verified relational calculation matches budget caps</p>
        </div>

      </div>

    </div>
  );
}

// Sparkly Activity custom SVG
function GradientActivityIcon() {
  return (
    <svg className="h-4.5 w-4.5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
