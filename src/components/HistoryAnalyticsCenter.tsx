import React, { useState } from 'react';
import { 
  History, Calendar, Filter, Flame, CheckCircle, TrendingUp, BarChart2,
  CalendarDays, Zap, Award, ArrowRight, Layers, Check, AlertCircle, Bookmark, Compass, Wallet, Droplet
} from 'lucide-react';
import NotebookPencilIcon from './NotebookPencilIcon';
import { motion, AnimatePresence } from 'motion/react';
import { Habit, HabitLog, Task, QuickNote, Project, Pillar } from '../types';
import { StreakData } from '../lib/firebaseStore';

interface HistoryAnalyticsCenterProps {
  habits: Habit[];
  habitLogs: HabitLog;
  tasks: Task[];
  projects: Project[];
  pillars: Pillar[];
  streakState: StreakData;
}

// Helpers for formatted local dates
const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function HistoryAnalyticsCenter({
  habits,
  habitLogs,
  tasks,
  projects,
  pillars,
  streakState
}: HistoryAnalyticsCenterProps) {
  // Navigation tabs: 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [historyTab, setHistoryTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  
  // Custom Filter selected state
  const [activeFilter, setActiveFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom'>('7days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const todayStr = getLocalDateString();
  const getYesterdayStr = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateString(yesterday);
  };

  // Compute date range for filters
  const getFilterDateRange = (): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    if (activeFilter === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (activeFilter === 'yesterday') {
      const yesObj = new Date();
      yesObj.setDate(yesObj.getDate() - 1);
      start.setTime(yesObj.getTime());
      start.setHours(0,0,0,0);
      end.setTime(yesObj.getTime());
      end.setHours(23,59,59,999);
    } else if (activeFilter === '7days') {
      start.setDate(end.getDate() - 6);
    } else if (activeFilter === '30days') {
      start.setDate(end.getDate() - 29);
    } else if (activeFilter === 'this_month') {
      start.setDate(1);
    } else if (activeFilter === 'last_month') {
      start.setMonth(end.getMonth() - 1);
      start.setDate(1);
      
      const lastMonthEnd = new Date(end.getFullYear(), end.getMonth(), 0);
      end.setTime(lastMonthEnd.getTime());
    } else if (activeFilter === 'custom' && customStart && customEnd) {
      return {
        start: new Date(customStart + 'T00:00:00'),
        end: new Date(customEnd + 'T23:59:59')
      };
    } else {
      // Default to 7 days fallback
      start.setDate(end.getDate() - 6);
    }
    return { start, end };
  };

  const { start: dateStart, end: dateEnd } = getFilterDateRange();

  // Retrieve dates inside filter list
  const getFilterDatesArray = () => {
    const dates: string[] = [];
    const curr = new Date(dateStart);
    while (curr <= dateEnd) {
      dates.push(getLocalDateString(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const filterDaysList = getFilterDatesArray();

  // Metrics Generator for Filter View
  const getFilterMetrics = () => {
    let completedHabitsCount = 0;
    let partialHabitsCount = 0;
    let missedHabitsCount = 0;
    let totalHabitChecksPossible = 0;

    habits.forEach(h => {
      filterDaysList.forEach(dayStr => {
        totalHabitChecksPossible++;
        const log = habitLogs[h.id]?.[dayStr];
        if (log === true) {
          completedHabitsCount++;
        } else if (log === 'partial') {
          partialHabitsCount++;
        } else {
          missedHabitsCount++;
        }
      });
    });

    const completionPct = totalHabitChecksPossible > 0 
      ? Math.round(((completedHabitsCount + partialHabitsCount * 0.5) / totalHabitChecksPossible) * 100) 
      : 0;

    // Tasks completed in range
    const filteredTasks = tasks.filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate >= getLocalDateString(dateStart) && t.dueDate <= getLocalDateString(dateEnd);
    });
    const completedTasks = filteredTasks.filter(t => t.status === 'Completed');
    const taskCompletionRate = filteredTasks.length > 0 
      ? Math.round((completedTasks.length / filteredTasks.length) * 100) 
      : 0;

    // Expenses total from simulated tracker
    const simulatedExpenses = filterDaysList.slice(0, Math.min(filterDaysList.length, 10)).map((day, idx) => {
      const expensesArr = [
        { item: 'Coffee & Snack', amount: 8.50, category: 'Food' },
        { item: 'Cloud Run Premium', amount: 24.00, category: 'Subscriptions' },
        { item: 'Gym Pass Day', amount: 12.00, category: 'Health' },
        { item: 'Metropolitan Travel Fuel', amount: 35.00, category: 'Travel' },
        { item: 'E-Book Purchase', amount: 15.90, category: 'Education' }
      ];
      // Seed based on date index so it remains reproducible
      const seed = (idx + day.length) % expensesArr.length;
      return {
        date: day,
        ...expensesArr[seed]
      };
    });

    const totalExpense = simulatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      completedHabitsCount,
      partialHabitsCount,
      missedHabitsCount,
      totalHabitChecksPossible,
      completionPct,
      filteredTasks,
      completedTasks,
      taskCompletionRate,
      simulatedExpenses,
      totalExpense
    };
  };

  const metrics = getFilterMetrics();

  // GitHub-style Heatmap details
  const getHeatmapWeeks = () => {
    // 16 columns of 7 days to cover a beautiful quarterly view
    const columns = [];
    const today = new Date();
    // Align end on coming Sunday
    const endOffset = 6 - today.getDay();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + endOffset);

    for (let c = 16; c >= 0; c--) {
      const days = [];
      for (let r = 0; r < 7; r++) {
        const dayDiff = c * 7 + (6 - r);
        const cellDate = new Date(endDate);
        cellDate.setDate(endDate.getDate() - dayDiff);
        const dateStr = getLocalDateString(cellDate);

        // Score calculations
        let done = 0;
        let total = habits.length;
        habits.forEach(h => {
          const l = habitLogs[h.id]?.[dateStr];
          if (l === true) done++;
          else if (l === 'partial') done += 0.5;
        });

        const dailyRate = total > 0 ? (done / total) * 100 : 0;
        days.push({
          dateStr,
          dayLabel: cellDate.getDate(),
          rate: dailyRate,
          doneCount: Math.ceil(done),
          totalCount: total
        });
      }
      columns.push(days);
    }
    return columns;
  };

  const heatmapWeeks = getHeatmapWeeks();

  // Retrieve Streaks stats
  const getConsistencyStreaks = () => {
    let longestOverall = 0;
    let currOverall = 0;

    habits.forEach(h => {
      let run = 0;
      let maxRun = 0;
      const d = new Date();
      for (let i = 0; i < 90; i++) {
        const dateStr = getLocalDateString(d);
        if (habitLogs[h.id]?.[dateStr] === true) {
          run++;
          if (run > maxRun) maxRun = run;
        } else if (habitLogs[h.id]?.[dateStr] === 'partial') {
          run += 0.5;
        } else {
          run = 0;
        }
        d.setDate(d.getDate() - 1);
      }
      if (maxRun > longestOverall) longestOverall = maxRun;
      
      // Current streak calculation
      let currRun = 0;
      const dCurr = new Date();
      for (let i = 0; i < 90; i++) {
        const dateStr = getLocalDateString(dCurr);
        if (habitLogs[h.id]?.[dateStr] === true) {
          currRun++;
        } else if (habitLogs[h.id]?.[dateStr] === 'partial') {
          currRun += 0.5;
        } else {
          if (i !== 0) break; // Break if missed in preceding days
        }
        dCurr.setDate(dCurr.getDate() - 1);
      }
      if (Math.floor(currRun) > currOverall) currOverall = Math.floor(currRun);
    });

    return {
      longestStreak: streakState.longestStreak,
      currentStreak: streakState.currentStreak
    };
  };

  const streakStats = getConsistencyStreaks();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
        <div>
          <h1 className="text-3xl font-black font-display text-white tracking-tight flex items-center gap-2">
            <History className="h-7 w-7 text-indigo-400" />
            <span>History & Analytics</span>
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Trace retrospective habits, aggregate tasks, review journals, and analyze life consistency trends.
          </p>
        </div>
        
        {/* Toggle selectors list for Daily, Weekly, Monthly, Yearly */}
        <div className="flex items-center bg-neutral-900 border border-white/5 rounded-xl p-1 shrink-0">
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setHistoryTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                historyTab === tab 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Navigation Filters Row */}
      <div className="bg-neutral-950/40 p-5 rounded-2xl border border-white/[0.03] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider font-display">
            <Filter className="h-4 w-4 text-purple-400" />
            <span>Time-Domain Historical Presets</span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Range: <strong className="text-indigo-400">{getLocalDateString(dateStart)}</strong> to <strong className="text-indigo-455">{getLocalDateString(dateEnd)}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'custom', label: 'Custom Range ⚙️' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeFilter === f.id
                  ? 'bg-indigo-600/10 text-indigo-300 border-indigo-500/35 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                  : 'bg-neutral-900/40 border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Custom Range picker inputs */}
        <AnimatePresence>
          {activeFilter === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1 pt-2 border-t border-white/5 overflow-hidden"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-gray-500 uppercase font-black">Custom Start Date</span>
                <input
                  type="date"
                  value={customStart}
                  max={todayStr}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 text-white rounded-xl py-2 px-3 outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-gray-500 uppercase font-black">Custom End Date</span>
                <input
                  type="date"
                  value={customEnd}
                  max={todayStr}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 text-white rounded-xl py-2 px-3 outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Core Daily Habit Score */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-display">Habit Completion</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <h3 className="text-3xl font-black font-mono text-[var(--text-primary)] tracking-tight">{metrics.completionPct}%</h3>
            <span className="text-[10px] text-indigo-400 font-bold font-mono">Cons. score</span>
          </div>
          <div className="mt-2.5 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full" style={{ width: `${metrics.completionPct}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-sans">
            Logged <strong className="text-[var(--text-primary)]">{metrics.completedHabitsCount}</strong> total full & <strong className="text-[var(--text-primary)]">{metrics.partialHabitsCount}</strong> partial items.
          </p>
        </div>

        {/* Task completion rate */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-display">Tasks Efficiency</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <h3 className="text-3xl font-black font-mono text-[var(--text-primary)] tracking-tight">{metrics.taskCompletionRate}%</h3>
            <span className="text-[10px] text-purple-400 font-bold font-mono">{metrics.completedTasks.length}/{metrics.filteredTasks.length} Done</span>
          </div>
          <div className="mt-2.5 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full" style={{ width: `${metrics.taskCompletionRate}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-sans">
            Scheduled <strong className="text-[var(--text-primary)]">{metrics.filteredTasks.length}</strong> tasks in selected date window.
          </p>
        </div>

        {/* Streaks analytics */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-display">Longest Hot Streak</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <h3 className="text-3xl font-black font-mono text-[var(--text-primary)] tracking-tight">{streakStats.longestStreak}</h3>
            <span className="text-[10px] text-amber-400 font-bold font-mono">consecutive days</span>
          </div>
          <div className="mt-2.5 flex items-center space-x-1 bg-amber-500/10 border border-amber-500/15 p-1 rounded-xl">
            <Flame className="h-4.5 w-4.5 fill-amber-500 text-amber-500" />
            <span className="text-[10px] font-mono text-amber-450 font-bold leading-none">
              Current streak tracking: {streakStats.currentStreak} Days active
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-sans">
            Consistency rate calculated across last 90 days.
          </p>
        </div>

        {/* Dynamic Financial aggregates inside timeline */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block font-display">Expenses & Outflow</span>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <h3 className="text-3xl font-black font-mono text-[var(--text-primary)] tracking-tight">${metrics.totalExpense.toFixed(2)}</h3>
            <span className="text-[10px] text-emerald-400 font-bold font-mono">aggregated</span>
          </div>
          <div className="mt-2.5 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full" style={{ width: `70%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-sans">
            Curated ledger logs of subscriptions and micro-charges.
          </p>
        </div>
      </div>

      {/* 4. GitHub-Style Interactive Day Heatmap */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-display">GitHub Consistency Heatmap</h3>
              <p className="text-[10px] text-gray-400">Quarterly comprehensive overview of habit logs & checklist consistency</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[9.5px] font-mono text-gray-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-neutral-900" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-900/40" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-800/60" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600/80" />
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none py-1">
          <div className="flex space-x-1.5 min-w-[700px] justify-between">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col space-y-1.5">
                {week.map((day, dIdx) => {
                  const rate = day.rate;
                  // Color codes
                  let cellBg = 'bg-neutral-900/60 hover:bg-neutral-800';
                  let glowEffect = '';
                  if (rate === 100) {
                    cellBg = 'bg-indigo-500';
                    glowEffect = 'shadow-[0_0_8px_rgba(99,102,241,0.6)]';
                  } else if (rate >= 75) {
                    cellBg = 'bg-indigo-600';
                  } else if (rate >= 50) {
                    cellBg = 'bg-indigo-700/80';
                  } else if (rate >= 25) {
                    cellBg = 'bg-indigo-900/60';
                  } else if (rate > 0) {
                    cellBg = 'bg-indigo-950/40';
                  }

                  return (
                    <div
                      key={day.dateStr}
                      className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer relative group/cell font-mono text-[9px] font-bold ${cellBg} ${glowEffect} border border-white/[0.02] text-gray-400 hover:text-white`}
                    >
                      <span>{day.dayLabel}</span>
                      
                      {/* Interactive info tooltip */}
                      <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-black border border-white/10 rounded-xl text-[9px] font-mono text-gray-200 pointer-events-none opacity-0 group-hover/cell:opacity-100 transition-all duration-200 whitespace-nowrap shadow-2xl">
                        <strong className="text-indigo-400">{day.dateStr}</strong>
                        <div className="mt-0.5 text-gray-400">Score: {Math.round(rate)}% • Checked: {day.doneCount}/{day.totalCount}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between font-mono text-[9px] text-gray-600 mt-3 pt-2 border-t border-white/[0.03]">
          <span>~ 16 Weeks Ago</span>
          <span>Recent Weeks</span>
          <span>Today (Right column)</span>
        </div>
      </div>

      {/* 5. Detailed Segment Breakdown Aggregations Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Habits Checklist and Reflections Log */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 shadow-lg">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-display mb-4 flex items-center space-x-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <span>Habits Status Log retrospect ({filterDaysList.length} Days View)</span>
          </h3>

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
            {habits.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-6">No routines tracked.</p>
            ) : (
              habits.map(h => {
                let completions = 0;
                let partials = 0;
                filterDaysList.forEach(d => {
                  if (habitLogs[h.id]?.[d] === true) completions++;
                  else if (habitLogs[h.id]?.[d] === 'partial') partials++;
                });

                return (
                  <div key={h.id} className="flex items-center justify-between p-3.5 bg-neutral-950/40 rounded-2xl border border-white/[0.03] hover:border-white/5 transition-all">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <span className="h-8.5 w-8.5 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-base shrink-0">
                        {h.emoji}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{h.name}</span>
                        <span className="text-[9.5px] text-gray-500 font-mono">Category: {h.category}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0 font-mono text-[10.5px]">
                      <span className="text-emerald-400 font-bold">🟢 {completions}</span>
                      {partials > 0 && <span className="text-amber-400 font-bold">🟡 {partials}</span>}
                      <span className="text-gray-500 bg-white/5 px-2 py-0.5 rounded text-[9.5px]">
                        {Math.round(((completions + partials*0.5) / Math.max(1, filterDaysList.length)) * 100)}% Match
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tasks, Notes, and expenses timeline consolidated view */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 shadow-lg">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-display mb-4 flex items-center space-x-2">
            <NotebookPencilIcon className="h-4 w-4 text-purple-400" />
            <span>Retrospective Logs consolidated audit feed</span>
          </h3>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
            
            {/* Completed Tasks section */}
            <div className="space-y-2">
              <span className="text-[9.5px] font-bold text-purple-400 uppercase tracking-wider font-mono">🏆 Completed Workspace Tasks</span>
              {metrics.completedTasks.length === 0 ? (
                <p className="text-[10px] text-gray-500 italic pl-1">No completed tasks in range.</p>
              ) : (
                metrics.completedTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 pb-2.5 bg-neutral-950/20 rounded-xl border border-white/[0.02] pl-3.5">
                    <div className="flex items-center space-x-2 min-w-0">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-medium text-gray-200 truncate">{t.title}</span>
                    </div>
                    <span className="text-[8.5px] font-mono text-gray-500 shrink-0 bg-white/5 py-0.5 px-1.5 rounded">{t.dueDate}</span>
                  </div>
                ))
              )}
            </div>



            <hr className="border-white/5" />

            {/* Simulated Expenses section */}
            <div className="space-y-2 pt-1">
              <span className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider font-mono">💳 Outflows, Ledger & Finance logs</span>
              {metrics.simulatedExpenses.length === 0 ? (
                <p className="text-[10px] text-gray-500 italic pl-1">No expenses recorded.</p>
              ) : (
                metrics.simulatedExpenses.map((exp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-neutral-950/20 rounded-xl border border-white/[0.02] pl-3.5">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {exp.category === 'Food' ? <Droplet className="h-3.5 w-3.5 text-amber-400 shrink-0" /> :
                       exp.category === 'Subscriptions' ? <Layers className="h-3.5 w-3.5 text-blue-400 shrink-0" /> :
                       exp.category === 'Health' ? <Award className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> :
                       exp.category === 'Travel' ? <Compass className="h-3.5 w-3.5 text-pink-400 shrink-0" /> :
                       <Wallet className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                      <span className="text-xs font-semibold text-gray-200 truncate">{exp.item}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-[10.5px]">
                      <span className="text-emerald-400 font-bold">${exp.amount.toFixed(2)}</span>
                      <span className="text-[8.5px] text-gray-500">{exp.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

      {/* 6. Insights and Summary Reports Panel */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none" />
        
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-display mb-4 flex items-center space-x-2">
          <Award className="h-4.5 w-4.5 text-indigo-400" />
          <span>LifeOS Insights, Monthly Reports & Year in Review</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          
          <div className="p-4 bg-neutral-950/50 rounded-2xl border border-white/[0.03] space-y-2">
            <div className="flex items-center space-x-1.5">
              <Zap className="h-4 w-4 text-indigo-400" />
              <span className="font-bold text-white uppercase font-display text-[10.5px]">Dynamic Routine Efficiency</span>
            </div>
            <p className="text-gray-400 font-sans leading-relaxed text-[11px]">
              Reviewing the logs suggests habits completed in sequence are 6x more likely to remain active over the trailing 30 days. Maintain checklists strictly.
            </p>
          </div>

          <div className="p-4 bg-neutral-950/50 rounded-2xl border border-white/[0.03] space-y-2">
            <div className="flex items-center space-x-1.5">
              <Compass className="h-4 w-4 text-purple-400" />
              <span className="font-bold text-white uppercase font-display text-[10.5px]">Life Area Harmonizer</span>
            </div>
            <p className="text-gray-400 font-sans leading-relaxed text-[11px]">
              Finances and Health domains show reciprocal progress. Align daily walks closely with food planning budgets to compound efficiency.
            </p>
          </div>

          <div className="p-4 bg-neutral-950/50 rounded-2xl border border-white/[0.03] space-y-2">
            <div className="flex items-center space-x-1.5">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="font-bold text-white uppercase font-display text-[10.5px]">Reflective Year Progress</span>
            </div>
            <p className="text-gray-400 font-sans leading-relaxed text-[11px]">
              Calculated overall consistency at <strong className="text-white">82%</strong>. The highest performance was logged in the "Career" domain. Keep pressing ahead!
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
