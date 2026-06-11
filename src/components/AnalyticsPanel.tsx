import { Project, Task, Habit, HabitLog, Pillar } from '../types';
import { 
  TrendingUp, CheckCircle, Flame, Target, Star, 
  HelpCircle, Sparkles, BookOpen, Heart, Activity 
} from 'lucide-react';

interface AnalyticsPanelProps {
  projects: Project[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog;
  pillars: Pillar[];
}

export default function AnalyticsPanel({
  projects,
  tasks,
  habits,
  habitLogs,
  pillars
}: AnalyticsPanelProps) {
  // Computation calculations
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const taskCompletionRate = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Calcul habit compliance % in past 5 days
  const getLast5DaysDates = () => {
    const dates = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  const past5Dates = getLast5DaysDates();
  
  let totalHabitOpportunities = habits.length * past5Dates.length;
  let completedHabitsCount = 0;

  habits.forEach(h => {
    const logs = habitLogs[h.id] || {};
    past5Dates.forEach(dateStr => {
      if (logs[dateStr]) {
        completedHabitsCount++;
      }
    });
  });

  const habitComplianceRate = totalHabitOpportunities > 0 
    ? Math.round((completedHabitsCount / totalHabitOpportunities) * 100) 
    : 0;

  // average pillars progress
  const avgPillarProgress = pillars.length > 0
    ? Math.round(pillars.reduce((acc, p) => acc + p.progress, 0) / pillars.length)
    : 0;

  // Calculate life general score!
  const generalSelfCareScore = Math.round(
    (taskCompletionRate * 0.4) + (habitComplianceRate * 0.4) + (avgPillarProgress * 0.2)
  );

  // Stats cards metadata
  const STATS_CARDS = [
    { name: 'Velocity Ratio', value: `${completedTasksCount}/${totalTasksCount}`, sub: `${taskCompletionRate}% task rate`, icon: <CheckCircle className="h-5 w-5 text-blue-500" /> },
    { name: 'Task Consistency', value: `${habitComplianceRate}%`, sub: `${completedHabitsCount} logs done`, icon: <Flame className="h-5 w-5 text-emerald-500 animate-pulse" /> },
    { name: 'Pillar Alignments', value: `${avgPillarProgress}%`, sub: 'Core energy index', icon: <Target className="h-5 w-5 text-purple-500" /> },
    { name: 'Overall Sprint Score', value: `${generalSelfCareScore}/100`, sub: 'Active productivity', icon: <Star className="h-5 w-5 text-amber-500" /> }
  ];

  // Projects Chart configuration (Completed vs To-Do inside each project)
  const chartData = projects.map(proj => {
    const pTasks = tasks.filter(t => t.projectId === proj.id);
    const completedVal = pTasks.filter(t => t.status === 'Completed').length;
    const pendingVal = pTasks.length - completedVal;
    return {
      name: proj.name,
      emoji: proj.emoji,
      completed: completedVal,
      pending: pendingVal,
      total: pTasks.length
    };
  });

  // Calculate maximum total value for graphing scales
  const maxTasksInProject = Math.max(...chartData.map(d => d.total), 3);

  return (
    <div className="space-y-6">
      {/* 1. Scorecards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_CARDS.map(card => (
          <div key={card.name} className="p-4 rounded-2xl glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg backdrop-blur-xl flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-widest font-display">{card.name}</p>
              <h3 className="text-xl font-bold font-mono text-gray-905 dark:text-white mt-1.5">{card.value}</h3>
              <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1 font-mono">{card.sub}</p>
            </div>
            <span className="p-2 rounded-xl bg-gray-50 dark:bg-neutral-850/80 border border-gray-150/50 dark:border-neutral-800">{card.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. Custom SVG Project Tasks bar chart */}
        <div className="lg:col-span-7 p-5 rounded-2xl glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-700 dark:text-neutral-350 tracking-wider font-display uppercase">PROJECT WORKLOAD DENSITY</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-sans">Quantity of completed vs. remaining tasks grouped across custom streams.</p>
          </div>

          <div className="mt-6 space-y-4">
            {chartData.map((data, idx) => {
              // percentages
              const completedPercent = data.total > 0 ? (data.completed / maxTasksInProject) * 100 : 0;
              const pendingPercent = data.total > 0 ? (data.pending / maxTasksInProject) * 100 : 0;
              const restPercent = 100 - completedPercent - pendingPercent;

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center space-x-1.5 font-semibold text-gray-750 dark:text-neutral-200 truncate max-w-[200px]">
                      <span>{data.emoji}</span>
                      <span className="truncate">{data.name}</span>
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      <span className="text-emerald-500 font-bold">{data.completed} Done</span>
                      <span className="mx-1">/</span>
                      <span className="text-blue-500 font-bold">{data.pending} To Do</span>
                    </span>
                  </div>

                  {/* Horizontal visual stacked bar */}
                  <div className="h-6 w-full bg-gray-100 dark:bg-neutral-800 rounded-lg overflow-hidden flex shadow-inner">
                    {data.total === 0 ? (
                      <div className="w-full flex items-center justify-center text-[10px] text-gray-400 italic">No tasks indexed</div>
                    ) : (
                      <>
                        <div 
                          className="h-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold font-mono transition-all duration-500" 
                          style={{ width: `${completedPercent}%` }}
                          title={`${data.completed} tasks completed`}
                        >
                          {data.completed > 0 && `${Math.round((data.completed/data.total)*100)}%`}
                        </div>
                        <div 
                          className="h-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold transition-all duration-500" 
                          style={{ width: `${pendingPercent}%` }}
                          title={`${data.pending} tasks pending`}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5.5 pt-3 border-t border-gray-50 dark:border-neutral-850 flex items-center justify-center space-x-5 text-[10px] font-mono text-gray-400">
            <span className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded bg-emerald-500 inline-block" />
              <span>Completed Tasks</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="h-2.5 w-2.5 rounded bg-blue-500 inline-block" />
              <span>Remaining Backlog</span>
            </span>
          </div>
        </div>

        {/* 3. Daily Habit Compliance Heatmap */}
        <div className="lg:col-span-5 p-5 rounded-2xl glass bg-white/70 dark:bg-neutral-900/60 border border-gray-150/80 dark:border-neutral-850/70 shadow-lg backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-700 dark:text-neutral-350 tracking-wider font-display uppercase font-extrabold">DAILY TASK EFFICIENCIES</h3>
            <p className="text-[11px] text-gray-500 mt-0.5 font-sans">Historical overview of task checkbox ratios completed over past 5 days.</p>
          </div>

          <div className="mt-4 space-y-4">
            {past5Dates.map((dateStr) => {
              // Calculate checked habits for this date
              let done = 0;
              habits.forEach(h => {
                if (habitLogs[h.id]?.[dateStr]) {
                  done++;
                }
              });

              const percentage = habits.length > 0 ? (done / habits.length) * 100 : 0;
              const dateObj = new Date(dateStr + 'T00:00:00');
              const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <div key={dateStr} className="flex items-center justify-between gap-4">
                  <div className="text-xs font-semibold text-gray-650 dark:text-neutral-350 min-w-[100px] font-mono">
                    {dateLabel}
                  </div>
                  
                  {/* Progress bar representer */}
                  <div className="flex-1 flex items-center space-x-2.5">
                    <div className="flex-1 h-3 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          percentage >= 80 ? 'bg-emerald-500' : percentage >= 40 ? 'bg-teal-500' : percentage > 0 ? 'bg-amber-400' : 'bg-gray-200'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-700 dark:text-neutral-350 min-w-[32px] text-right font-bold">
                      {done}/{habits.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3.5 border-t border-gray-50 dark:border-neutral-850/60 rounded-xl bg-gray-50/20 dark:bg-neutral-850/20 p-2.5 flex items-center gap-2 text-[10px] text-gray-500 dark:text-neutral-450 leading-relaxed">
            <Sparkles className="h-4 w-4 text-emerald-500 flex-shrink-0 animate-bounce" />
            <p>Consistency triggers compounds of performance. Achieving 80%+ compliance unlocks custom system stability.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
