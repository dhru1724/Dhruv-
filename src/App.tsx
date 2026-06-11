import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import HeaderCover from './components/HeaderCover';
import ConsolePanel from './components/ConsolePanel';
import ProjectTracker from './components/ProjectTracker';
import WeeklyPlanner from './components/WeeklyPlanner';
import AnalyticsPanel from './components/AnalyticsPanel';
import ThingsToDoTaskbar from './components/ThingsToDoTaskbar';
import MonthlyProgressCalendar from './components/MonthlyProgressCalendar';
import DashboardHome from './components/DashboardHome';
import HistoryAnalyticsCenter from './components/HistoryAnalyticsCenter';
import SettingsPanel from './components/SettingsPanel';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  getOrCreateSyncId,
  getLocalStreakCache,
  calculateStreak,
  saveStreakData,
  resetStreakSystem,
  getLocalDateString as firebaseGetLocalDateString,
  getDb,
  StreakData,
  OperationType,
  handleFirestoreError
} from './lib/firebaseStore';

// Import newly created modular dashboards
import NotebookPencilIcon from './components/NotebookPencilIcon';
import HabitDashboard from './components/HabitDashboard';
import KnowledgeDashboard from './components/KnowledgeDashboard';
import FinanceDashboard from './components/FinanceDashboard';
import HealthDashboard from './components/HealthDashboard';
import SilvaDashboard from './components/SilvaDashboard';
import GoalsDashboard from './components/GoalsDashboard';
import TravelDashboard from './components/TravelDashboard';
import RelationshipsDashboard from './components/RelationshipsDashboard';
import RoutineDashboard from './components/RoutineDashboard';
import { GlobalErrorBoundary, WidgetErrorBoundary } from './components/ErrorBoundary';
import { 
  Pillar, Project, Task, Habit, HabitLog, QuickNote 
} from './types';
import { 
  INITIAL_PILLARS, INITIAL_PROJECTS, INITIAL_TASKS, 
  INITIAL_HABITS, INITIAL_QUICK_NOTES, getInitialHabitLogs 
} from './dummyData';
import { 
  Folder, Kanban, Calendar, TrendingUp, Info, ListTodo, Star, Pin, PinOff, Search,
  Home, Compass, Brain, Briefcase, Activity, Landmark, History, Settings,
  Sparkles, Heart, Footprints, MessageSquare, ChevronLeft, ChevronRight, Menu, HelpCircle, Flame, Moon, Sun, User, X,
  Plus, BookOpen, Check, Trash2, UploadCloud,
  CheckSquare, Target, Wallet, HeartPulse, Sparkle, Pencil, PlusCircle, Clock, IndianRupee
} from 'lucide-react';

// Permanent visual asset lock system registry
export const FIXED_ASSET_REGISTRY: Record<string, string> = {
  'home-cover': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
  'tasks-cover': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
  'scratchpad-cover': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
  'calendar-cover': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80',
  'goals-cover': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
  'health-cover': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&auto=format&fit=crop&q=80',
  'finance-cover': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
  'secondbrain-cover': 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1600&auto=format&fit=crop&q=80',
  'routine-cover': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
  'settings-cover': 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=1600&auto=format&fit=crop&q=80',
  'workspace-admin-avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&auto=format&fit=crop'
};

const getLocalDateString = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const validateDateString = (dateStr: string): boolean => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  const d = new Date(year, month - 1, day);
  return !isNaN(d.getTime());
};

export default function App() {
  // Navigation responsive states
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    return typeof window !== 'undefined' ? window.innerWidth : 1200;
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [tabletSidebarExpanded, setTabletSidebarExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Selected daily focus date
  const [selectedDateState, setSelectedDateState] = useState<string>(() => {
    return getLocalDateString();
  });

  const setSelectedDate = (newDateVal: string | ((prev: string) => string)) => {
    if (typeof newDateVal === 'function') {
      setSelectedDateState((prev) => {
        const nextDate = newDateVal(prev);
        if (validateDateString(nextDate)) {
          return nextDate;
        }
        return prev;
      });
    } else {
      if (validateDateString(newDateVal)) {
        setSelectedDateState(newDateVal);
      }
    }
  };

  const selectedDate = selectedDateState;

  // Sidebar dynamic focus category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('notion_life_theme');
    return saved ? saved === 'dark' : false; // transform to premium light mode by default!
  });

  // Core Databases states
  const [pillars, setPillars] = useState<Pillar[]>(() => {
    const saved = localStorage.getItem('notion_life_pillars');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse pillars", e);
      }
    }
    return INITIAL_PILLARS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('notion_life_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse projects", e);
      }
    }
    return INITIAL_PROJECTS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('notion_life_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse tasks", e);
      }
    }
    return INITIAL_TASKS;
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('notion_life_habits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse habits", e);
      }
    }
    return INITIAL_HABITS;
  });

  const [habitLogs, setHabitLogs] = useState<HabitLog>(() => {
    const saved = localStorage.getItem('notion_life_habit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse habit logs", e);
      }
    }
    return getInitialHabitLogs(INITIAL_HABITS);
  });

  const [quickNotes, setQuickNotes] = useState<QuickNote[]>(() => {
    const saved = localStorage.getItem('notion_life_quick_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse quick notes", e);
      }
    }
    return INITIAL_QUICK_NOTES;
  });

  // Browser-style Tabs State
  const [openTabs, setOpenTabs] = useState<{ id: string; label: string; emoji: string }[]>(() => {
    const saved = localStorage.getItem('lifeos_open_tabs_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse open tabs", e);
      }
    }
    return [
      { id: 'dashboard', label: 'Life Dashboard', emoji: '🪐' }
    ];
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('lifeos_active_tab_id_v2') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('lifeos_open_tabs_v2', JSON.stringify(openTabs));
    localStorage.setItem('lifeos_active_tab_id_v2', activeTab);
  }, [openTabs, activeTab]);

  // Streak tracking states
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 550);
    return () => clearTimeout(timer);
  }, []);

  const [syncId, setSyncIdState] = useState(() => getOrCreateSyncId());
  const [streakState, setStreakState] = useState<StreakData>(() => getLocalStreakCache());

  // Elevated states for Water, Habits, and Routine Dashboard Auto-Sync System
  const [waterCurrent, setWaterCurrentState] = useState<number>(() => {
    const todayStr = getLocalDateString();
    const dateSpecificKey = `lifeos_routine_water_v3_${todayStr}`;
    const savedDateSpecific = localStorage.getItem(dateSpecificKey);
    if (savedDateSpecific !== null) return parseInt(savedDateSpecific, 10);
    return 0;
  });

  const [waterGoal, setWaterGoal] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_routine_water_goal_v3');
    return saved ? parseInt(saved, 10) : 3000;
  });

  const setWaterCurrent = (val: number | ((prev: number) => number)) => {
    setWaterCurrentState(prev => {
      const resolved = typeof val === 'function' ? val(prev) : val;
      const rounded = Math.max(0, resolved);
      localStorage.setItem(`lifeos_routine_water_v3_${selectedDate}`, String(rounded));
      localStorage.setItem('life_dashboard_water_intake', String(parseFloat((rounded / 1000).toFixed(2))));
      localStorage.setItem('lifeos_health_water', String(parseFloat((rounded / 1000).toFixed(2))));
      return rounded;
    });
  };

  const [routineEvents, setRoutineEventsState] = useState<any[]>(() => {
    const todayStr = getLocalDateString();
    const dateSpecificKey = `lifeos_routine_timeline_v3_${todayStr}`;
    const savedDateSpecific = localStorage.getItem(dateSpecificKey);
    if (savedDateSpecific) {
      try { return JSON.parse(savedDateSpecific); } catch (e) { console.error(e); }
    }
    return [];
  });

  const setRoutineEvents = (val: any | ((prev: any[]) => any[])) => {
    setRoutineEventsState(prev => {
      const resolved = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem(`lifeos_routine_timeline_v3_${selectedDate}`, JSON.stringify(resolved));
      return resolved;
    });
  };

  const [routineBoardTasks, setRoutineBoardTasksState] = useState<any[]>(() => {
    const todayStr = getLocalDateString();
    const dateSpecificKey = `lifeos_routine_tasks_v3_${todayStr}`;
    const savedDateSpecific = localStorage.getItem(dateSpecificKey);
    if (savedDateSpecific) {
      try { return JSON.parse(savedDateSpecific); } catch (e) { console.error(e); }
    }
    return [];
  });

  const setRoutineBoardTasks = (val: any | ((prev: any[]) => any[])) => {
    setRoutineBoardTasksState(prev => {
      const resolved = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem(`lifeos_routine_tasks_v3_${selectedDate}`, JSON.stringify(resolved));
      return resolved;
    });
  };

  // Sync state with selectedDate on change
  useEffect(() => {
    const eventsKey = `lifeos_routine_timeline_v3_${selectedDate}`;
    let savedEvents = localStorage.getItem(eventsKey);
    if (savedEvents) {
      try {
        setRoutineEventsState(JSON.parse(savedEvents));
      } catch (e) {
        console.error(e);
      }
    } else {
      setRoutineEventsState([]);
    }

    const tasksKey = `lifeos_routine_tasks_v3_${selectedDate}`;
    let savedTasks = localStorage.getItem(tasksKey);
    if (savedTasks) {
      try {
        setRoutineBoardTasksState(JSON.parse(savedTasks));
      } catch (e) {
        console.error(e);
      }
    } else {
      setRoutineBoardTasksState([]);
    }

    const waterKey = `lifeos_routine_water_v3_${selectedDate}`;
    let savedWater = localStorage.getItem(waterKey);
    if (savedWater !== null) {
      setWaterCurrentState(parseInt(savedWater, 10));
    } else {
      setWaterCurrentState(0);
    }
  }, [selectedDate]);

  // Focus Timer States elevated for real-time tracking
  const [focusSeconds, setFocusSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('life_dashboard_focus_seconds');
    return saved ? parseInt(saved, 10) : 2 * 3600 + 35 * 60 + 12; // starts at 2h 35m 12s
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    localStorage.setItem('life_dashboard_focus_seconds', String(focusSeconds));
  }, [focusSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setFocusSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Routine Completion History for Auto Routine Streak Calculations
  const [routineCompletionHistory, setRoutineCompletionHistory] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('lifeos_routine_completion_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const history: Record<string, boolean> = {};
    const today = new Date();
    // Pre-populate 18-day history so streak starts at 18
    for (let i = 1; i <= 18; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      history[firebaseGetLocalDateString(pastDate)] = true;
    }
    return history;
  });

  useEffect(() => {
    const totalEvents = routineEvents.length;
    const completedEvents = routineEvents.filter(e => e.completed).length;
    const isCompletedSelected = totalEvents > 0 ? (completedEvents / totalEvents >= 0.5) : false;
    
    if (routineCompletionHistory[selectedDate] !== isCompletedSelected) {
      setRoutineCompletionHistory(prev => {
        const updated = { ...prev, [selectedDate]: isCompletedSelected };
        localStorage.setItem('lifeos_routine_completion_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [routineEvents, selectedDate]);
  
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    const saved = localStorage.getItem('lifeos_last_sync_time');
    if (saved) return saved;
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const triggerLiveSyncVisual = () => {
    setIsSyncing(true);
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(timeStr);
      localStorage.setItem('lifeos_last_sync_time', timeStr);
    }, 600);
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    triggerLiveSyncVisual();
  }, [tasks, habitLogs, streakState]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.startsWith('lifeos_') || e.key.startsWith('life_'))) {
        triggerLiveSyncVisual();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Automatic Daily Flow System (Midnight Reset)
  useEffect(() => {
    const checkDateChange = () => {
      const todayStr = firebaseGetLocalDateString(); // gets device YYYY-MM-DD
      const lastRecordedStr = localStorage.getItem('lifeos_last_known_today_date');
      
      if (lastRecordedStr && lastRecordedStr !== todayStr) {
        console.log("Midnight Reset Triggered! Advancing to ", todayStr);
        
        // 0. Perform rollover migration of "For Tomorrow" to "Today's Goals"
        const getDaysBetween = (startDateStr: string, endDateStr: string): string[] => {
          const dates: string[] = [];
          try {
            const start = new Date(startDateStr + 'T00:00:00');
            const end = new Date(endDateStr + 'T00:00:00');
            let current = new Date(start);
            while (current < end) {
              current.setDate(current.getDate() + 1);
              const year = current.getFullYear();
              const month = String(current.getMonth() + 1).padStart(2, '0');
              const day = String(current.getDate()).padStart(2, '0');
              dates.push(`${year}-${month}-${day}`);
            }
          } catch (e) {
            console.error(e);
          }
          return dates;
        };

        const intermediateDays = getDaysBetween(lastRecordedStr, todayStr);
        let currentPrevDay = lastRecordedStr;
        for (const nextDay of intermediateDays) {
          try {
            const prevTasksStr = localStorage.getItem(`lifeos_routine_tasks_v3_${currentPrevDay}`);
            if (prevTasksStr) {
              const prevTasks = JSON.parse(prevTasksStr);
              if (Array.isArray(prevTasks)) {
                const tomorrowTasks = prevTasks.filter((t: any) => t.section === 'tomorrow');
                if (tomorrowTasks.length > 0) {
                  const migrated = tomorrowTasks.map((t: any) => ({
                    ...t,
                    section: 'goals',
                    completed: false,
                  }));

                  const nextTasksStr = localStorage.getItem(`lifeos_routine_tasks_v3_${nextDay}`) || '[]';
                  let nextTasks = [];
                  try {
                    nextTasks = JSON.parse(nextTasksStr);
                    if (!Array.isArray(nextTasks)) nextTasks = [];
                  } catch (e) {}

                  const existingTexts = new Set(nextTasks.map((t: any) => t.text.toLowerCase().trim()));
                  const uniqueMigrated = migrated.filter((t: any) => !existingTexts.has(t.text.toLowerCase().trim()));

                  nextTasks = [...nextTasks, ...uniqueMigrated];
                  localStorage.setItem(`lifeos_routine_tasks_v3_${nextDay}`, JSON.stringify(nextTasks));

                  const clearedPrevTasks = prevTasks.filter((t: any) => t.section !== 'tomorrow');
                  localStorage.setItem(`lifeos_routine_tasks_v3_${currentPrevDay}`, JSON.stringify(clearedPrevTasks));
                }
              }
            }
          } catch (err) {
            console.error("Failed to migrate tasks for rollover:", err);
          }
          currentPrevDay = nextDay;
        }

        // 1. Save last day completion if needed, then uncheck all routine events for the new day
        setRoutineEventsState(prev => {
          const resetEvents = prev.map(ev => ({ ...ev, completed: false }));
          localStorage.setItem(`lifeos_routine_timeline_v3_${todayStr}`, JSON.stringify(resetEvents));
          return resetEvents;
        });
        
        // 2. Clear current water metrics back to 0 mL for the new day
        setWaterCurrentState(0);
        localStorage.setItem(`lifeos_routine_water_v3_${todayStr}`, '0');
        localStorage.setItem('life_dashboard_water_intake', '0');
        localStorage.setItem('lifeos_health_water', '0');
        
        // 3. Clear focus timer state today back to default / 0
        setFocusSeconds(0);
        localStorage.setItem('life_dashboard_focus_seconds', '0');

        // 4. Update the selectedDate so the dashboards move to Today immediately
        setSelectedDate(todayStr);
        
        // 5. Update last known date in storage to prevent duplicate runs
        localStorage.setItem('lifeos_last_known_today_date', todayStr);
        
        triggerLiveSyncVisual();
      } else if (!lastRecordedStr) {
        // First ever load: initialize key to todayStr
        localStorage.setItem('lifeos_last_known_today_date', todayStr);
      }
    };
    
    // Check immediately on mount
    checkDateChange();
    
    // Check every 10 seconds to catch midnight instantly
    const interval = setInterval(checkDateChange, 10000);
    return () => clearInterval(interval);
  }, []);

  const calculateStreakFromHistory = (history: Record<string, boolean>) => {
    let streak = 0;
    const d = new Date(); // Start checking from today backwards
    const todayStr = firebaseGetLocalDateString();
    
    for (let i = 0; i < 365; i++) {
      const dateStr = firebaseGetLocalDateString(d);
      const isDone = history[dateStr] === true;
      if (isDone) {
        streak++;
      } else {
        if (i === 0) {
          // If not completed today, keep checking yesterday!
        } else {
          break;
        }
      }
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const getMeditationStreak = () => {
    let streak = 0;
    const d = new Date();
    const todayStr = firebaseGetLocalDateString();
    
    for (let i = 0; i < 365; i++) {
       const dateStr = firebaseGetLocalDateString(d);
       const isDone = dateStr === todayStr
         ? (routineEvents.find(e => e.id === 't8')?.completed || habitLogs['hab-1']?.[dateStr] === true)
         : (habitLogs['hab-1']?.[dateStr] === true);
         
       if (isDone) {
         streak++;
       } else {
         if (i === 0) {
           // check yesterday
         } else {
           break;
         }
       }
       d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const getLearningStreak = () => {
    let streak = 0;
    const d = new Date();
    const todayStr = firebaseGetLocalDateString();
    
    for (let i = 0; i < 365; i++) {
       const dateStr = firebaseGetLocalDateString(d);
       const isDone = dateStr === todayStr
         ? (routineEvents.find(e => e.id === 't11' || e.id === 't12' || e.id === 't13')?.completed || habitLogs['hab-2']?.[dateStr] === true)
         : (habitLogs['hab-2']?.[dateStr] === true);
         
       if (isDone) {
         streak++;
       } else {
         if (i === 0) {
           // check yesterday
         } else {
           break;
         }
       }
       d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const getWorkoutStreak = () => {
    let streak = 0;
    const d = new Date();
    const todayStr = firebaseGetLocalDateString();
    
    for (let i = 0; i < 365; i++) {
       const dateStr = firebaseGetLocalDateString(d);
       const isDone = dateStr === todayStr
         ? (routineEvents.find(e => e.id === 't3')?.completed || habitLogs['hab-3']?.[dateStr] === true)
         : (habitLogs['hab-3']?.[dateStr] === true);
         
       if (isDone) {
         streak++;
       } else {
         if (i === 0) {
           // check yesterday
         } else {
           break;
         }
       }
       d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const getWaterStreak = () => {
    let streak = 0;
    const d = new Date();
    const todayStr = firebaseGetLocalDateString();
    
    for (let i = 0; i < 365; i++) {
       const dateStr = firebaseGetLocalDateString(d);
       const isDone = dateStr === todayStr
         ? (waterCurrent >= 3000 || habitLogs['hab-4']?.[dateStr] === true)
         : (habitLogs['hab-4']?.[dateStr] === true);
         
       if (isDone) {
         streak++;
       } else {
         if (i === 0) {
           // check yesterday
         } else {
           break;
         }
       }
       d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const handleUpdateSyncId = (newId: string) => {
    localStorage.setItem('lifeos_cloud_sync_id', newId);
    setSyncIdState(newId);
  };

  const handleResetStreak = async () => {
    const fresh = await resetStreakSystem();
    setStreakState(fresh);
  };

  // Real-time Firestore sync snapshot listener boundaries (syncs across devices)
  useEffect(() => {
    const dbInstance = getDb();
    if (!dbInstance) return;

    const pathStr = `streaks/${syncId}`;
    const docRef = doc(dbInstance, 'streaks', syncId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as StreakData;
        if (remoteData) {
          localStorage.setItem('lifeos_streak_cache_v5', JSON.stringify(remoteData));
          setStreakState(remoteData);
        }
      }
    }, (error) => {
      console.warn("Firestore listener deferred:", error);
      // Route snapshot subscription permissions/connection issues to standardized handler
      if (error && error.message && error.message.includes("permission")) {
        handleFirestoreError(error, OperationType.GET, pathStr);
      }
    });

    return () => unsubscribe();
  }, [syncId]);

  // Streak state calculation and synchronization trigger whenever tasks or habitLogs update
  const recomputeAndSyncStreak = (latestTasks: Task[], latestHabitLogs: HabitLog) => {
    const todayStr = firebaseGetLocalDateString();
    const completedDatesSet = new Set<string>();

    // 1. Get completed tasks >= startDate and <= today
    latestTasks.forEach(t => {
      if (t.status === 'Completed' && t.dueDate) {
        completedDatesSet.add(t.dueDate);
      }
    });

    // 2. Get completed habit logs >= startDate and <= today
    Object.keys(latestHabitLogs).forEach(habitId => {
      const logs = latestHabitLogs[habitId];
      if (logs) {
        Object.keys(logs).forEach(dateStr => {
          if (logs[dateStr] === true) {
            completedDatesSet.add(dateStr);
          }
        });
      }
    });

    // 3. Missions completed check
    try {
      const savedMissions = localStorage.getItem('life_dashboard_missions');
      if (savedMissions) {
        const parsedMissions = JSON.parse(savedMissions);
        if (Array.isArray(parsedMissions) && parsedMissions.some(m => m.completed)) {
          completedDatesSet.add(todayStr);
        }
      }
    } catch (e) {
      console.error("Missions sync check failed", e);
    }

    const filteredDates = Array.from(completedDatesSet)
      .filter(d => d >= streakState.startDate && d <= todayStr)
      .sort();

    const stats = calculateStreak(filteredDates, streakState.startDate);
    const newLongest = Math.max(streakState.longestStreak, stats.longestStreak);

    const updatedData: StreakData = {
      syncId,
      startDate: streakState.startDate,
      longestStreak: newLongest,
      currentStreak: stats.currentStreak,
      completedDates: filteredDates
    };

    const datesEqual = updatedData.completedDates.length === streakState.completedDates.length &&
      updatedData.completedDates.every((v, i) => v === streakState.completedDates[i]);

    if (
      updatedData.currentStreak !== streakState.currentStreak ||
      updatedData.longestStreak !== streakState.longestStreak ||
      updatedData.startDate !== streakState.startDate ||
      !datesEqual
    ) {
      setStreakState(updatedData);
      saveStreakData(updatedData);
    }
  };

  useEffect(() => {
    recomputeAndSyncStreak(tasks, habitLogs);
  }, [tasks, habitLogs, syncId]);

  const triggerStreakSync = () => {
    recomputeAndSyncStreak(tasks, habitLogs);
  };

  // Dynamic page metadata state
  const [pageMetaMap, setPageMetaMap] = useState<Record<string, { title: string; emoji: string; coverUrl: string; desc?: string }>>(() => {
    const saved = localStorage.getItem('lifeos_page_meta_map_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const getPageMeta = (tabId: string) => {
    const defaults: Record<string, { title: string; emoji: string; coverUrl: string; desc: string }> = {
      dashboard: { 
        title: 'Life Dashboard', 
        emoji: '🪐', 
        coverUrl: FIXED_ASSET_REGISTRY['home-cover'],
        desc: 'A customized multi-database system to organize and streamline core daily actions.' 
      },
      habits: { 
        title: 'Tasks Dashboard', 
        emoji: '📈', 
        coverUrl: FIXED_ASSET_REGISTRY['tasks-cover'],
        desc: 'Personal tasks automation matrix and metric tracking sheets.' 
      },
      routine: {
        title: 'Routine', 
        emoji: '🔄', 
        coverUrl: FIXED_ASSET_REGISTRY['routine-cover'],
        desc: 'Dedicated daily planning, habit scheduling, and routine timeline.' 
      },
      calendar: { 
        title: 'Calendar Dashboard', 
        emoji: '📅', 
        coverUrl: FIXED_ASSET_REGISTRY['calendar-cover'],
        desc: 'Integrated master timeline, events schedule, and milestone dates.' 
      },
      brain: { 
        title: 'Knowledge Dashboard', 
        emoji: '🧠', 
        coverUrl: FIXED_ASSET_REGISTRY['secondbrain-cover'],
        desc: 'Second brain wiki, project blueprints, and research repository.' 
      },
      finance: { 
        title: 'Finance Dashboard', 
        emoji: '💰', 
        coverUrl: FIXED_ASSET_REGISTRY['finance-cover'],
        desc: 'Dynamic personal ledger, budget sheets, and savings calculator.' 
      },
      health: { 
        title: 'Health Dashboard', 
        emoji: '❤️', 
        coverUrl: FIXED_ASSET_REGISTRY['health-cover'],
        desc: 'Nutritional analytics, workout planners, and wellness logs.' 
      },
      silva: { 
        title: 'Silva Dashboard', 
        emoji: '✨', 
        coverUrl: FIXED_ASSET_REGISTRY['secondbrain-cover'],
        desc: 'Alpha level meditations, mind control exercises, and psychic triggers.' 
      },
      goals: { 
        title: 'Goals Dashboard', 
        emoji: '🎯', 
        coverUrl: FIXED_ASSET_REGISTRY['goals-cover'],
        desc: 'Milestones tracking, objective-key-results (OKRs), and life target boards.' 
      },
      travel: { 
        title: 'Travel Dashboard', 
        emoji: '✈️', 
        coverUrl: FIXED_ASSET_REGISTRY['home-cover'],
        desc: 'Flight logs, itinerary planners, and adventure diaries.' 
      },
      relationships: { 
        title: 'Relationships Dashboard', 
        emoji: '💬', 
        coverUrl: FIXED_ASSET_REGISTRY['home-cover'],
        desc: 'Personal CRM, communication logs, and connection planners.' 
      },
      history: { 
        title: 'Analytics Dashboard', 
        emoji: '📊', 
        coverUrl: FIXED_ASSET_REGISTRY['health-cover'],
        desc: 'Historical trends, behavioral patterns, and metrics charts.' 
      },
      settings: { 
        title: 'Settings Dashboard', 
        emoji: '⚙️', 
        coverUrl: FIXED_ASSET_REGISTRY['settings-cover'],
        desc: 'Customize LifeOS styling preferences, font pairing adjustments, and local states.' 
      }
    };

    const customized = pageMetaMap[tabId] || {} as any;
    const base = defaults[tabId] || defaults.dashboard;
    return {
      title: customized.title || base.title,
      emoji: customized.emoji || base.emoji,
      coverUrl: customized.coverUrl || base.coverUrl,
      desc: customized.desc || base.desc
    };
  };

  const activeMeta = getPageMeta(activeTab);

  const handleUpdatePageMeta = (key: 'title' | 'emoji' | 'coverUrl' | 'desc', value: string) => {
    setPageMetaMap(prev => {
      const current = prev[activeTab] || {} as any;
      const updated = {
        ...prev,
        [activeTab]: {
          ...current,
          [key]: value
        }
      } as any;
      localStorage.setItem('lifeos_page_meta_map_v2', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync document title with active tab info automatically
  useEffect(() => {
    document.title = `${activeMeta.emoji} ${activeMeta.title} - LifeOS`;
  }, [activeTab, pageMetaMap]);

  const handleSelectTabId = (tabId: string, label?: string, emoji?: string) => {
    setActiveTab(tabId);
    const meta = getPageMeta(tabId);
    setOpenTabs(prev => {
      if (prev.some(t => t.id === tabId)) {
        return prev;
      }
      return [...prev, { id: tabId, label: label || meta.title, emoji: emoji || meta.emoji }];
    });
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openTabs.length <= 1) {
      return;
    }
    const idx = openTabs.findIndex(t => t.id === tabId);
    const newTabs = openTabs.filter(t => t.id !== tabId);
    setOpenTabs(newTabs);
    
    if (activeTab === tabId) {
      const nextActiveIdx = Math.max(0, idx - 1);
      setActiveTab(newTabs[nextActiveIdx]?.id || 'dashboard');
    }
  };

  const handleMoveTab = (idx: number, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = [...openTabs];
    if (direction === 'left' && idx > 0) {
      const temp = newTabs[idx];
      newTabs[idx] = newTabs[idx - 1];
      newTabs[idx - 1] = temp;
    } else if (direction === 'right' && idx < newTabs.length - 1) {
      const temp = newTabs[idx];
      newTabs[idx] = newTabs[idx + 1];
      newTabs[idx + 1] = temp;
    }
    setOpenTabs(newTabs);
  };

  const [showFloatingTaskbar, setShowFloatingTaskbar] = useState<boolean>(() => {
    const saved = localStorage.getItem('notion_life_show_floating_taskbar');
    return saved ? saved === 'true' : true;
  });

  // Unique ChatGPT/Arc-style sidebar states
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => {
    const saved = localStorage.getItem('notion_life_sidebar_pinned');
    return saved ? saved === 'true' : false; // default collapsed (icons only) as requested
  });

  const [sidebarHovered, setSidebarHovered] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customizable user profile states
  const [profileName, setProfileName] = useState<string>(() => {
    return localStorage.getItem('lifeos_profile_name') ?? 'Dhruvv';
  });
  const [profileImage, setProfileImage] = useState<string>(() => {
    return localStorage.getItem('lifeos_profile_image') ?? FIXED_ASSET_REGISTRY['workspace-admin-avatar'];
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [tempProfileName, setTempProfileName] = useState<string>('');
  const [tempProfileImage, setTempProfileImage] = useState<string>('');
  const [cropScale, setCropScale] = useState<number>(() => {
    const saved = localStorage.getItem('lifeos_profile_crop_scale');
    return saved ? parseFloat(saved) : 1;
  });

  // Customizable workspace lists
  const [workspaces, setWorkspaces] = useState<string[]>(() => {
    const saved = localStorage.getItem('lifeos_workspaces');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return ['Personal Workspace', "Dhruvv's Command Hub"];
  });
  const [activeWorkspace, setActiveWorkspace] = useState<string>(() => {
    return localStorage.getItem('lifeos_active_workspace') ?? 'Personal Workspace';
  });
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<boolean>(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('lifeos_workspaces', JSON.stringify(workspaces));
    localStorage.setItem('lifeos_active_workspace', activeWorkspace);
  }, [workspaces, activeWorkspace]);

  // Search & Quick Action Modal states
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchModalQuery, setSearchModalQuery] = useState<string>('');
  const [searchSelectedIndex, setSearchSelectedIndex] = useState<number>(0);
  const [quickActionType, setQuickActionType] = useState<'task' | 'habit' | 'note' | 'goal' | 'journal' | null>(null);

  // Floating Toast Notifications state & auto-dismiss effect handler
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Form field states for quick add widgets
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [taskProjectId, setTaskProjectId] = useState<string>('standalone');
  const [taskDueDate, setTaskDueDate] = useState(() => getLocalDateString());

  const [habitName, setHabitName] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('⚡');
  const [habitGoal, setHabitGoal] = useState('');
  const [habitCategory, setHabitCategory] = useState('Health');

  const [noteContent, setNoteContent] = useState('');

  const [goalName, setGoalName] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalPriority, setGoalPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [goalDeadline, setGoalDeadline] = useState(() => getLocalDateString());

  const [journalText, setJournalText] = useState('');

  // Search Results matcher logic
  const getSearchMatches = () => {
    if (!searchModalQuery.trim()) return [];
    const query = searchModalQuery.toLowerCase();
    const results: Array<{
      category: string;
      label: string;
      desc?: string;
      action: () => void;
      icon: string;
    }> = [];

    // Workspace main + secondary channels
    const channels = [
      { label: 'Home Dashboard', tab: 'dashboard', filter: 'All', icon: '🪐' },
      { label: 'Tasks Tracker', tab: 'habits', filter: 'All', icon: '📈' },
      { label: 'Routine Planner', tab: 'routine', filter: 'All', icon: '🔄' },
      { label: 'Calendar Planner', tab: 'calendar', filter: 'All', icon: '📅' },
      { label: 'Second Brain Projects', tab: 'brain', filter: 'All', icon: '🧠' },
      { label: 'Finance & Ledger Section', tab: 'finance', filter: 'All', icon: '💰' },
      { label: 'Health & Workout Center', tab: 'health', filter: 'Fitness', icon: '❤️' },
      { label: 'Silva Method Exercises', tab: 'silva', filter: 'All', icon: '✨' },
      { label: 'Goals Dashboard', tab: 'goals', filter: 'All', icon: '🎯' },
      { label: 'Travel Log Book', tab: 'travel', filter: 'Travel', icon: '✈️' },
      { label: 'Relationships Ledger', tab: 'relationships', filter: 'General', icon: '💬' },
      { label: 'History & Time Analytics', tab: 'history', filter: 'All', icon: '📊' },
      { label: 'Workspace Configuration & Settings', tab: 'settings', filter: 'All', icon: '⚙️' }
    ];

    channels.forEach(ch => {
      if (ch.label.toLowerCase().includes(query)) {
        results.push({
          category: 'Navigation Channels',
          label: ch.label,
          desc: `Jump to ${ch.label}`,
          action: () => {
            handleSelectTabId(ch.tab);
            setCategoryFilter(ch.filter);
            trackRecentPage(ch.tab);
            if (ch.tab === 'silva' || ch.tab === 'finance') {
              setTimeout(() => {
                const id = ch.tab === 'silva' ? 'silva-section' : 'finance-section';
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }
          },
          icon: ch.icon
        });
      }
    });

    habits.forEach(h => {
      if (h.name.toLowerCase().includes(query)) {
        results.push({
          category: 'Tasks Database',
          label: h.name,
          desc: `Streak: ${h.streak || 0} days • Target: ${h.goal || h.category || 'Daily Task'}`,
          action: () => {
            handleSelectTabId('habits');
            setCategoryFilter('All');
            trackRecentPage('habits');
          },
          icon: h.emoji || '⚡'
        });
      }
    });

    projects.forEach(p => {
      if (p.name.toLowerCase().includes(query)) {
        results.push({
          category: 'Pillar Goals & Projects',
          label: p.name,
          desc: `Status: ${p.status} • Category: ${p.category || 'General'}`,
          action: () => {
            handleSelectTabId('brain');
            setCategoryFilter('All');
            trackRecentPage('brain');
          },
          icon: p.emoji || '📂'
        });
      }
    });

    quickNotes.forEach(qn => {
      if (qn.content.toLowerCase().includes(query)) {
        results.push({
          category: 'Scratchpad Archive',
          label: qn.content.slice(0, 48) + (qn.content.length > 48 ? '...' : ''),
          desc: `Log Time: ${new Date(qn.createdAt).toLocaleDateString()}`,
          action: () => {
            handleSelectTabId('brain');
            setCategoryFilter('All');
            trackRecentPage('brain');
          },
          icon: '📝'
        });
      }
    });

    return results.slice(0, 7);
  };

  // Keyboard navigation controller for Spotlight Search matching index
  useEffect(() => {
    if (!showSearchModal) return;
    setSearchSelectedIndex(0);

    const handleSearchKeys = (e: KeyboardEvent) => {
      const matches = getSearchMatches();
      if (!matches.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSearchSelectedIndex(prev => (prev + 1) % matches.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSearchSelectedIndex(prev => (prev - 1 + matches.length) % matches.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = matches[searchSelectedIndex];
        if (activeItem) {
          activeItem.action();
          setShowSearchModal(false);
          setSearchModalQuery('');
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSearchModal(false);
        setSearchModalQuery('');
      }
    };

    window.addEventListener('keydown', handleSearchKeys);
    return () => window.removeEventListener('keydown', handleSearchKeys);
  }, [showSearchModal, searchModalQuery, searchSelectedIndex, tasks, habits, projects, quickNotes]);

  // Command-K keyboard shortcut triggers spotlight search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('notion_life_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
    return ['dashboard', 'planner', 'tasks'];
  });

  const [recentlyVisited, setRecentlyVisited] = useState<string[]>(() => {
    const saved = localStorage.getItem('notion_life_recently_visited');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse recently visited", e);
      }
    }
    return ['dashboard'];
  });

  // Track recently visited tabs
  const trackRecentPage = (tabName: string) => {
    setRecentlyVisited(prev => {
      const list = prev.filter(x => x !== tabName);
      list.unshift(tabName);
      return list.slice(0, 4); // limit to 4 recents max
    });
  };

  useEffect(() => {
    localStorage.setItem('notion_life_sidebar_pinned', String(sidebarPinned));
  }, [sidebarPinned]);

  useEffect(() => {
    localStorage.setItem('notion_life_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('notion_life_recently_visited', JSON.stringify(recentlyVisited));
  }, [recentlyVisited]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('notion_life_show_floating_taskbar', String(showFloatingTaskbar));
  }, [showFloatingTaskbar]);

  useEffect(() => {
    localStorage.setItem('notion_life_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDark]);



  useEffect(() => {
    localStorage.setItem('notion_life_pillars', JSON.stringify(pillars));
  }, [pillars]);

  useEffect(() => {
    localStorage.setItem('notion_life_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('notion_life_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('notion_life_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('notion_life_habit_logs', JSON.stringify(habitLogs));
  }, [habitLogs]);

  useEffect(() => {
    localStorage.setItem('notion_life_quick_notes', JSON.stringify(quickNotes));
  }, [quickNotes]);

  // General App Action Helpers
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleResetWorkspace = () => {
    localStorage.clear();
    setPageMetaMap({});
    setPillars(INITIAL_PILLARS);
    setProjects(INITIAL_PROJECTS);
    setTasks(INITIAL_TASKS);
    setHabits(INITIAL_HABITS);
    setHabitLogs(getInitialHabitLogs(INITIAL_HABITS));
    setQuickNotes(INITIAL_QUICK_NOTES);
    setIsDark(true);
    setActiveTab('dashboard');
    setCategoryFilter('All');
  };

  const handleAddGlobalTask = (
    titleText: string, 
    projId: string | null = null, 
    priorityVal: Task['priority'] = 'Medium', 
    dueDateStr: string = ''
  ) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: projId,
      title: titleText.trim(),
      status: 'To Do',
      priority: priorityVal,
      dueDate: dueDateStr || new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [...prev, newTask]);
  };

  // Toggle habit checkbox log
  const handleToggleHabitLog = (habitId: string, dateStr: string, forceState?: any) => {
    setHabitLogs(prevRegistry => {
      const entry = { ...(prevRegistry[habitId] || {}) };
      if (forceState !== undefined) {
        entry[dateStr] = forceState;
      } else {
        const current = entry[dateStr];
        if (current === true) {
          entry[dateStr] = 'partial';
        } else if (current === 'partial') {
          entry[dateStr] = false;
        } else {
          entry[dateStr] = true;
        }
      }
      return {
        ...prevRegistry,
        [habitId]: entry
      };
    });
  };

  // Notes scratchpad handling
  const handleAddQuickNote = (contentStr: string) => {
    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      content: contentStr,
      createdAt: new Date().toISOString()
    };
    setQuickNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteQuickNote = (noteId: string) => {
    setQuickNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Conversional Workflow: Promote scratched Note into official Workspace Task
  const handlePromoteNoteToTask = (note: QuickNote) => {
    handleAddGlobalTask(note.content, null, 'High', selectedDate);
    handleDeleteQuickNote(note.id);
  };

  // Unified responsive sidebar rendering
  const renderSidebarContent = (isSidebarCollapsed: boolean, isMobileView: boolean) => {
    const MAIN_NAV = [
      { label: 'Home', tab: 'dashboard', emoji: '🪐', icon: <Home strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0 border-0" /> },
      { label: 'Tasks', tab: 'habits', emoji: '📈', icon: <Target strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0 border-0" /> },
      { label: 'Routine', tab: 'routine', emoji: '🔄', icon: <Clock strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0" /> },
      { label: 'Calendar', tab: 'calendar', emoji: '📅', icon: <Calendar strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0" /> },
      { label: 'Second Brain', tab: 'brain', emoji: '🧠', icon: <Brain strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0" /> },
    ];

    const PRODUCTIVITY_NAV = [
      { label: 'Finance', tab: 'finance', emoji: '💰', icon: <Wallet strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0" /> },
      { label: 'Health', tab: 'health', emoji: '❤️', icon: <HeartPulse strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0" /> },
      { label: 'Silva Method', tab: 'silva', emoji: '✨', icon: <Sparkle strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0" /> },
      { label: 'Goals', tab: 'goals', emoji: '🎯', icon: <Target strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0" /> },
    ];

    const QUICK_ACTIONS = [
      { label: 'New Task', type: 'habit' as const, color: 'text-amber-400 hover:bg-amber-500/10 border border-zinc-800' },
      { label: 'New Goal', type: 'goal' as const, color: 'text-pink-400 hover:bg-pink-500/10 border border-zinc-800' },
    ];

    // Filter list items based on global sidebar search box input
    const filteredMain = MAIN_NAV.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredProductivity = PRODUCTIVITY_NAV.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

    const handleSelectTab = (item: { label: string; tab: string; emoji: string }) => {
      handleSelectTabId(item.tab, item.label, item.emoji);
      trackRecentPage(item.tab);
      if (isMobileView) {
        setMobileDrawerOpen(false);
      }
    };

    return (
      <div className="flex flex-col justify-between h-full select-none bg-[#050505] text-white font-sans border-r border-[#1A1A1A] transition-colors duration-300">
        
        {/* TOP BRANDING & LOGO SECTION */}
        <div className="flex flex-col shrink-0">
          <div className={`p-5 border-b border-[#1A1A1A] flex items-center justify-between ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            {isSidebarCollapsed ? (
              <span 
                className="text-2xl cursor-pointer hover:scale-110 active:scale-95 duration-200 transition-transform" 
                title="Expand Sidebar" 
                onClick={() => setSidebarPinned(true)}
              >
                🪐
              </span>
            ) : (
              <>
                <div 
                  className="flex items-center space-x-2.5 cursor-pointer group"
                  onClick={() => { setActiveTab('dashboard'); setCategoryFilter('All'); }}
                >
                  <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">🪐</span>
                  <div className="text-left leading-none">
                    <h1 className="text-md font-extrabold text-white tracking-wider font-sans select-none">
                      LifeOS
                    </h1>
                  </div>
                </div>

                {/* Collapse button */}
                {!isMobileView && (
                  <button
                    onClick={() => setSidebarPinned(false)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
                    title="Collapse Sidebar"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* USER PROFILE CARD */}
          {!isSidebarCollapsed ? (
            <div className="mx-3.5 mt-3.5 p-3 rounded-2xl bg-[#111111] border border-[#1A1A1A] flex items-center justify-between shadow-md relative group">
              <div className="flex items-center space-x-3 min-w-0">
                <div 
                  className="h-10 w-10 rounded-full overflow-hidden border border-[#1A1A1A] relative cursor-pointer hover:border-[#6D5FFC]/60 transition-colors shrink-0 flex items-center justify-center bg-zinc-950"
                  onClick={() => {
                    setTempProfileName(profileName);
                    setTempProfileImage(profileImage);
                    setShowProfileModal(true);
                  }}
                >
                  {profileImage ? (
                    <img 
                      src={profileImage}
                      referrerPolicy="no-referrer"
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white uppercase">{profileName.charAt(0)}</span>
                  )}
                </div>
                <div className="text-left leading-tight min-w-0">
                  <h5 className="text-[13px] font-bold text-white truncate font-sans">{profileName}</h5>
                  <span className="text-[10px] text-zinc-400 font-semibold tracking-wide uppercase font-sans">Workspace Admin</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setTempProfileName(profileName);
                  setTempProfileImage(profileImage);
                  setShowProfileModal(true);
                }}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Edit Profile"
              >
                <Pencil strokeWidth={2} className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center mt-3.5 shrink-0 relative group">
              <div 
                className="h-10 w-10 rounded-full overflow-hidden border border-[#1A1A1A] relative cursor-pointer hover:border-[#6D5FFC] hover:scale-105 transition-all shrink-0 flex items-center justify-center bg-zinc-950"
                title={`${profileName} (Click to edit)`}
                onClick={() => {
                  setTempProfileName(profileName);
                  setTempProfileImage(profileImage);
                  setShowProfileModal(true);
                }}
              >
                {profileImage ? (
                  <img 
                    src={profileImage}
                    referrerPolicy="no-referrer"
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-white uppercase">{profileName.charAt(0)}</span>
                )}
              </div>
            </div>
          )}

          {/* SEARCH BOX */}
          {!isSidebarCollapsed ? (
            <div className="px-3.5 pt-3.5">
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111] hover:bg-zinc-900 focus:bg-zinc-900 text-white placeholder-zinc-500 rounded-xl px-4 py-2.5 pl-10 pr-12 border border-[#1A1A1A] focus:border-[#6D5FFC] focus:ring-1 focus:ring-[#6D5FFC]/30 outline-none text-xs transition-all tracking-wide"
                />
                <Search strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none group-focus-within:text-[#6D5FFC] transition-colors" />
                <div role="button" onClick={() => setShowSearchModal(true)} className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1 cursor-pointer" title="Open Deep Search">
                  <kbd className="text-[9px] font-sans font-bold text-zinc-500 bg-zinc-950 border border-[#1A1A1A] px-1.5 py-0.5 rounded-md hover:text-white hover:border-[#6D5FFC]/30 transition-all leading-none select-none">⌘K</kbd>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center pt-3.5 shrink-0">
              <button 
                className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#111111] hover:bg-zinc-900 border border-[#1A1A1A] text-zinc-400 hover:text-[#6D5FFC] transition-all cursor-pointer shadow-sm active:scale-90"
                title="Spotlight Search (⌘K)"
                onClick={() => setShowSearchModal(true)}
              >
                <Search strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6" />
              </button>
            </div>
          )}
        </div>

        {/* MIDDLE SCROLLABLE SECTIONS: Navigation channels */}
        <div className="flex-1 overflow-y-auto py-4 px-3.5 space-y-6 scrollbar-none">
          
          {/* MAIN CHANNELS */}
          <div className="space-y-0.5">
            {!isSidebarCollapsed && (
              <h4 className="px-3 text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-1.5 select-none font-sans">
                Main Navigation
              </h4>
            )}
            {filteredMain.length > 0 && filteredMain.map((item, i) => {
              const isSelected = activeTab === item.tab;
              return (
                <button
                  key={`main-${i}`}
                  onClick={() => handleSelectTab(item)}
                  className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group font-sans ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'space-x-3 px-3.5 py-3'
                  } ${
                    isSelected
                      ? item.tab === 'notes'
                        ? 'bg-[#111111] text-white border border-[#1A1A1A] shadow-[0_0_16px_rgba(109,95,252,0.35)] ring-1 ring-[#6D5FFC]/40 text-white font-semibold'
                        : 'bg-[#111111] text-white border border-[#1A1A1A] shadow-[0_0_12px_rgba(109,95,252,0.12)] ring-1 ring-[#6D5FFC]/25 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-[#111111]/50'
                  }`}
                >
                  {/* Thin left accent line on active item */}
                  {isSelected && !isSidebarCollapsed && (
                    <span className="absolute left-0.5 top-2.5 bottom-2.5 w-[3px] bg-[#6D5FFC] rounded-full" />
                  )}
                  
                  <span className={`transition-all duration-200 ${
                    isSelected 
                      ? `text-[#6D5FFC] scale-105 ${item.tab === 'notes' ? 'drop-shadow-[0_0_8px_#6D5FFC]' : ''}` 
                      : 'text-[#FFFFFF] group-hover:text-[#E5E5E5] group-hover:scale-105'
                  }`}>
                    {item.icon}
                  </span>
                  
                  {!isSidebarCollapsed && (
                    <span className={`truncate ${isSelected && item.tab === 'notes' ? 'text-[#6D5FFC] drop-shadow-[0_0_4px_rgba(109,95,252,0.4)]' : ''}`}>
                      {item.label}
                    </span>
                  )}
                  
                  {isSidebarCollapsed && (
                    <span className="absolute left-16 hidden group-hover:block bg-[#111111] border border-[#1A1A1A] text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-50 animate-in fade-in-50 duration-150">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* PRODUCTIVITY SECTION */}
          <div className="space-y-0.5">
            {!isSidebarCollapsed && (
              <h4 className="px-3 text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-1.5 select-none font-sans">
                Productivity Section
              </h4>
            )}
            {filteredProductivity.length > 0 && filteredProductivity.map((item, i) => {
              const isSelected = activeTab === item.tab;
              return (
                <button
                  key={`productivity-${i}`}
                  onClick={() => handleSelectTab(item)}
                  className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group font-sans ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'space-x-3 px-3.5 py-3'
                  } ${
                    isSelected
                      ? 'bg-[#111111] text-white border border-[#1A1A1A] shadow-[0_0_12px_rgba(109,95,252,0.12)] ring-1 ring-[#6D5FFC]/25 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-[#111111]/50'
                  }`}
                >
                  {/* Thin left accent line on active item */}
                  {isSelected && !isSidebarCollapsed && (
                    <span className="absolute left-0.5 top-2.5 bottom-2.5 w-[3px] bg-[#6D5FFC] rounded-full" />
                  )}
                  
                  <span className={`transition-all duration-200 ${isSelected ? 'text-[#6D5FFC] scale-105' : 'text-[#FFFFFF] group-hover:text-[#E5E5E5] group-hover:scale-105'}`}>
                    {item.icon}
                  </span>
                  
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  
                  {isSidebarCollapsed && (
                    <span className="absolute left-16 hidden group-hover:block bg-[#111111] border border-[#1A1A1A] text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-50 animate-in fade-in-50 duration-150">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* SETTINGS SECTION */}
          <div className="space-y-0.5">
            {!isSidebarCollapsed && (
              <h4 className="px-3 text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-1.5 select-none font-sans">
                Settings Section
              </h4>
            )}
            <button
              onClick={() => {
                setActiveTab('settings');
                trackRecentPage('settings');
                if (isMobileView) {
                  setMobileDrawerOpen(false);
                }
              }}
              className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative group font-sans ${
                isSidebarCollapsed ? 'justify-center p-3' : 'space-x-3 px-3.5 py-3'
              } ${
                activeTab === 'settings'
                  ? 'bg-[#111111] text-white border border-[#1A1A1A] shadow-[0_0_12px_rgba(109,95,252,0.12)] ring-1 ring-[#6D5FFC]/25 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-[#111111]/50'
              }`}
            >
              {activeTab === 'settings' && !isSidebarCollapsed && (
                <span className="absolute left-0.5 top-2.5 bottom-2.5 w-[3px] bg-[#6D5FFC] rounded-full" />
              )}
              <span className={`transition-all duration-200 ${activeTab === 'settings' ? 'text-[#6D5FFC] scale-105' : 'text-[#FFFFFF] group-hover:text-[#E5E5E5] group-hover:scale-105'}`}>
                <Settings strokeWidth={2} className="h-[22px] w-[22px] md:h-6 md:w-6 shrink-0" />
              </span>
              {!isSidebarCollapsed && <span>Settings</span>}
              {isSidebarCollapsed && (
                <span className="absolute left-16 hidden group-hover:block bg-[#111111] border border-[#1A1A1A] text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-50">
                  Settings
                </span>
              )}
            </button>
          </div>

          {/* QUICK CHATGPT TASKBAR SHORTCUT */}
          {!isSidebarCollapsed && (
            <div className="pt-2 border-t border-zinc-900 space-y-2">
              <div className="grid grid-cols-1 gap-1.5">
                {QUICK_ACTIONS.slice(0, 3).map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuickActionType(act.type)}
                    className={`w-full text-left rounded-xl text-xs font-semibold py-2 px-3 flex items-center justify-between transition-all duration-150 cursor-pointer bg-zinc-950 hover:bg-[#111111] hover:translate-x-1 border border-[#1A1A1A] font-sans ${act.color}`}
                  >
                    <span>{act.label}</span>
                    <Plus className="h-3 w-3 shrink-0 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM SECTION: Add / Switch Workspace and Theme Switcher */}
        <div className="flex flex-col border-t border-[#1A1A1A] bg-[#050505] pt-3.5">
          
          {/* Switch / Add Workspace Button */}
          {!isSidebarCollapsed ? (
            <div className="px-3.5 pb-2.5">
              <div className="relative">
                <button 
                  onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                  className="w-full flex items-center justify-between bg-[#111111] hover:bg-zinc-900 border border-[#1A1A1A] hover:border-[#6D5FFC]/40 rounded-xl px-3 py-2.5 text-left text-xs transition-all cursor-pointer active:scale-[0.98] group"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div className="h-5 w-5 rounded-md bg-[#6D5FFC]/20 border border-[#6D5FFC]/35 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                      {activeWorkspace.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-white truncate max-w-[155px] font-sans">{activeWorkspace}</span>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 text-zinc-500 group-hover:text-zinc-350">
                    <span className="text-[10px] font-sans font-medium">⌥S</span>
                  </div>
                </button>

                {showWorkspaceMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#111111] border border-[#1A1A1A] rounded-xl shadow-xl z-50 overflow-hidden py-1.5 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="px-3 py-1 border-b border-[#1A1A1A] mb-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black font-sans">Switch Workspace</span>
                    </div>
                    {workspaces.map((ws) => (
                      <button
                        key={ws}
                        onClick={() => {
                          setActiveWorkspace(ws);
                          setShowWorkspaceMenu(false);
                          setToastMessage(`Switched to workspace: ${ws}`);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-900 transition-colors cursor-pointer ${
                          ws === activeWorkspace ? 'text-[#6D5FFC] font-semibold bg-[#6D5FFC]/5' : 'text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{ws}</span>
                        {ws === activeWorkspace && <Check className="h-3.5 w-3.5 text-[#6D5FFC]" />}
                      </button>
                    ))}
                    <div className="border-t border-[#1A1A1A] mt-1.5 pt-1.5">
                      <button
                        onClick={() => {
                          setShowWorkspaceMenu(false);
                          setShowNewWorkspaceModal(true);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors flex items-center space-x-1.5 font-sans cursor-pointer"
                      >
                        <PlusCircle strokeWidth={2} className="h-3.5 w-3.5" />
                        <span>Add / Switch Workspace</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center pb-2.5">
              <button 
                onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                className="h-10 w-10 flex items-center justify-center bg-[#111111] hover:bg-zinc-900 border border-[#1A1A1A] rounded-xl text-white transition-all cursor-pointer relative group hover:scale-105"
                title={`Active: ${activeWorkspace} (Change)`}
              >
                <div className="h-5 w-5 rounded bg-[#6D5FFC]/20 border border-[#6D5FFC]/35 flex items-center justify-center font-bold text-white text-[10px]">
                  {activeWorkspace.substring(0, 2).toUpperCase()}
                </div>
                
                {showWorkspaceMenu && (
                  <div className="absolute bottom-full left-14 mb-2 w-48 bg-[#111111] border border-[#1A1A1A] rounded-xl shadow-xl z-50 overflow-hidden py-1.5 leading-none">
                    {workspaces.map((ws) => (
                      <div
                        key={ws}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWorkspace(ws);
                          setShowWorkspaceMenu(false);
                          setToastMessage(`Switched to workspace: ${ws}`);
                        }}
                        className={`text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-900 cursor-pointer ${
                          ws === activeWorkspace ? 'text-[#6D5FFC] font-semibold' : 'text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{ws}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </div>
          )}

          <div className={`flex border-t border-[#1A1A1A] ${isSidebarCollapsed ? 'flex-col items-center py-4 space-y-3' : 'p-3.5 items-center justify-between bg-zinc-950/20'}`}>
            {isSidebarCollapsed ? (
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-[#111111] hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer border border-[#1A1A1A]"
                title="Toggle Mode"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-[#6D5FFC]" />}
              </button>
            ) : (
              <div className="w-full flex justify-between items-center bg-[#111111]/45 px-2 py-1.5 rounded-xl border border-[#1A1A1A]/80">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider pl-1.5 font-sans">Dark Mode</span>
                <button 
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-[#1A1A1A]"
                  title="Toggle Visual Mode"
                >
                  {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" /> : <Moon className="h-3.5 w-3.5 text-[#6D5FFC]" />}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  // Filtered lists shown if category focus is on
  const filteredProjects = projects.filter(p => {
    if (categoryFilter === 'All') return true;
    return p.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  // Calculate collapsed state of sidebar dynamically to optimize workspace dashboard width
  const isMobileView = windowWidth < 768;
  const isSidebarCollapsed = !isMobileView && !sidebarPinned;

  if (appLoading) {
    return (
      <div id="workspace-loading-fallback" className="min-h-screen bg-[#050505] text-[#E3E2E0] flex flex-col items-center justify-center p-6 font-sans select-none relative overflow-hidden">
        {/* Ambient background glow dots */}
        <div className="absolute top-[-10%] left-[-15%] w-[450px] h-[450px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col items-center space-y-6 relative z-10 max-w-sm text-center">
          <div className="relative flex items-center justify-center">
            {/* Spinning ring */}
            <div className="h-16 w-16 rounded-full border-2 border-zinc-900 border-t-2 border-t-indigo-500 animate-spin" />
            <span className="absolute text-xl" role="img" aria-label="emoji">🪐</span>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-white">Launching LifeOS Hub</h2>
            <p className="text-xs text-zinc-500 font-sans tracking-widest uppercase animate-pulse">Synchronizing workspace states...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GlobalErrorBoundary>
      <div className={`min-h-screen transition-all duration-300 flex text-[#E3E2E0] relative overflow-hidden ${isDark ? 'bg-[#000000] text-gray-100' : 'bg-[#f7f8fc] text-[#333333]'}`}>
      
      {/* Premium Cosmic Glow Ambient Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-blue-500/5 dark:bg-indigo-500/5 blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/5 dark:bg-fuchsia-500/4 blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[450px] h-[450px] rounded-full bg-emerald-500/5 dark:bg-emerald-600/3 blur-[110px]" />
      </div>

      {/* 1. MOBILE DRAWER (Slide-out drawer with overlay backdrop) */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-350 ${
        mobileDrawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}>
        {/* Backdrop overlay */}
        <div 
          onClick={() => setMobileDrawerOpen(false)}
          className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
        />
        {/* Drawer container body sliding in from left */}
        <div className={`absolute inset-y-0 left-0 w-[85vw] max-w-[340px] bg-[#050505] border-r border-[#1A1A1A] shadow-2xl flex flex-col justify-between transition-transform duration-350 h-full transform ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {renderSidebarContent(false, true)}
        </div>
      </div>

      {/* 2. TABLET OR DESKTOP CUSTOM COLLAPSIBLE INLINE SIDEBAR */}
      <div 
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`hidden md:flex flex-col justify-between shrink-0 z-30 transition-all duration-300 ease-in-out border-r border-[#1A1A1A] bg-[#050505] text-[#A1A1AA] select-none ${
          isSidebarCollapsed ? 'w-20' : 'w-[320px]'
        }`}
      >
        {renderSidebarContent(isSidebarCollapsed, false)}
      </div>

      {/* RIGHT VIEWPORT VIEW BLOCK: flex-1, scrollable, houses the selected panels */}
      <div className="flex-1 overflow-y-auto relative z-10 select-none pb-20">
        
        {/* Page Top Custom Cover banner + Title header */}
        {activeTab !== 'tasks' && (
          <HeaderCover
            coverUrl={activeMeta.coverUrl}
            setCoverUrl={(url) => handleUpdatePageMeta('coverUrl', url)}
            emoji={activeMeta.emoji}
            setEmoji={(emoji) => handleUpdatePageMeta('emoji', emoji)}
            title={activeMeta.title}
            setTitle={(title) => handleUpdatePageMeta('title', title)}
            desc={activeMeta.desc}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onReset={handleResetWorkspace}
            activeTab={activeTab}
            onMenuClick={() => {
              if (windowWidth < 768) {
                setMobileDrawerOpen(true);
              } else {
                setSidebarPinned(!sidebarPinned);
              }
            }}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
          />
        )}

        {/* Master Double-Column Bento Grid Container with Dynamic Width adjustments */}
        <div className={`mx-auto px-4 sm:px-10 pb-20 font-sans transition-all duration-300 ${
          activeTab === 'tasks' ? 'pt-6' : ''
        } ${
          isSidebarCollapsed ? 'max-w-[1550px] w-full' : 'max-w-7xl w-full'
        }`}>
          
          {/* Active Tab Router Switchbox */}
          <div className="pt-2 relative overflow-hidden w-full">
            <AnimatePresence initial={false} mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full"
              >

            {activeTab === 'dashboard' && (
              <WidgetErrorBoundary title="Life Dashboard">
                <DashboardHome
                  pillars={pillars}
                  setPillars={setPillars}
                  habits={habits}
                  setHabits={setHabits}
                  habitLogs={habitLogs}
                  toggleHabitLog={handleToggleHabitLog}
                  projects={filteredProjects}
                  setProjects={setProjects}
                  quickNotes={quickNotes}
                  setQuickNotes={setQuickNotes}
                  addQuickNote={handleAddQuickNote}
                  deleteQuickNote={handleDeleteQuickNote}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  streakState={streakState}
                  triggerStreakSync={triggerStreakSync}
                  isDark={isDark}
                  tasks={tasks}
                  setTasks={setTasks}
                  routineEvents={routineEvents}
                  routineStreak={calculateStreakFromHistory(routineCompletionHistory)}
                  meditationStreak={getMeditationStreak()}
                  learningStreak={getLearningStreak()}
                  workoutStreak={getWorkoutStreak()}
                  waterStreak={getWaterStreak()}
                  profileName="Dhruvv"
                  waterCurrent={waterCurrent}
                  setWaterCurrent={setWaterCurrent}
                  focusSeconds={focusSeconds}
                  setFocusSeconds={setFocusSeconds}
                  isTimerRunning={isTimerRunning}
                  setIsTimerRunning={setIsTimerRunning}
                />
              </WidgetErrorBoundary>
            )}

            {activeTab === 'projects' && (
              <WidgetErrorBoundary title="Projects Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  {categoryFilter !== 'All' && (
                    <div className="mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-indigo-400 font-sans">
                      <span className="font-bold flex items-center space-x-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span>Focused Workspace actively filtered to stream: <strong>{categoryFilter}</strong></span>
                      </span>
                      <button 
                        onClick={() => setCategoryFilter('All')} 
                        className="text-[9.5px] font-mono hover:underline font-extrabold uppercase leading-none"
                      >
                        Clear Stream Filter
                      </button>
                    </div>
                  )}
                  
                  <ProjectTracker
                    projects={filteredProjects}
                    setProjects={setProjects}
                    tasks={tasks}
                    setTasks={setTasks}
                    onAddTask={handleAddGlobalTask}
                  />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'planner' && (
              <WidgetErrorBoundary title="Tasks/Planner Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <WeeklyPlanner
                    tasks={tasks}
                    setTasks={setTasks}
                    projects={projects}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'analytics' && (
              <WidgetErrorBoundary title="Analytics Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <AnalyticsPanel
                    projects={projects}
                    tasks={tasks}
                    habits={habits}
                    habitLogs={habitLogs}
                    pillars={pillars}
                  />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'calendar' && (
              <WidgetErrorBoundary title="Calendar Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <MonthlyProgressCalendar
                    tasks={tasks}
                    setTasks={setTasks}
                    projects={projects}
                    habits={habits}
                    habitLogs={habitLogs}
                    toggleHabitLog={handleToggleHabitLog}
                    quickNotes={quickNotes}
                    setQuickNotes={setQuickNotes}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                </div>
              </WidgetErrorBoundary>
            )}

            {/* Premium Modular Dashboard Integrations */}
            {activeTab === 'routine' && (
              <WidgetErrorBoundary title="Routine Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <RoutineDashboard 
                    timelineEvents={routineEvents}
                    setTimelineEvents={setRoutineEvents}
                    boardTasks={routineBoardTasks}
                    setBoardTasks={setRoutineBoardTasks}
                    waterCurrent={waterCurrent}
                    setWaterCurrent={setWaterCurrent}
                    waterGoal={waterGoal}
                    setWaterGoal={setWaterGoal}
                    routineStreak={calculateStreakFromHistory(routineCompletionHistory)}
                    isDark={isDark}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'habits' && (
              <WidgetErrorBoundary title="Habits Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <HabitDashboard
                    habits={habits}
                    setHabits={setHabits}
                    habitLogs={habitLogs}
                    toggleHabitLog={handleToggleHabitLog}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    isDark={isDark}
                  />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'brain' && (
              <WidgetErrorBoundary title="Second Brain Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <KnowledgeDashboard
                    projects={projects}
                    setProjects={setProjects}
                    quickNotes={quickNotes}
                    setQuickNotes={setQuickNotes}
                    addQuickNote={handleAddQuickNote}
                    deleteQuickNote={handleDeleteQuickNote}
                    promoteNoteToTask={handlePromoteNoteToTask}
                  />
                </div>
              </WidgetErrorBoundary>
            )}



            {activeTab === 'finance' && (
              <WidgetErrorBoundary title="Finance Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <FinanceDashboard />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'health' && (
              <WidgetErrorBoundary title="Health Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <HealthDashboard projects={projects} />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'silva' && (
              <WidgetErrorBoundary title="Silva Mind Control Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <SilvaDashboard />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'goals' && (
              <WidgetErrorBoundary title="Goals & OKRs Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <GoalsDashboard />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'travel' && (
              <WidgetErrorBoundary title="Travel & Adventure Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <TravelDashboard />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'relationships' && (
              <WidgetErrorBoundary title="Relationships CRM Dashboard">
                <div className="glass bg-[var(--card-bg)] border border-[var(--border-color)] p-5 sm:p-7 rounded-3xl shadow-xl relative backdrop-blur-xl">
                  <RelationshipsDashboard />
                </div>
              </WidgetErrorBoundary>
            )}

            {activeTab === 'history' && (
              <WidgetErrorBoundary title="Historical Behavioral Trends Center">
                <HistoryAnalyticsCenter
                  habits={habits}
                  habitLogs={habitLogs}
                  tasks={tasks}
                  projects={projects}
                  pillars={pillars}
                  streakState={streakState}
                />
              </WidgetErrorBoundary>
            )}

            {activeTab === 'settings' && (
              <WidgetErrorBoundary title="Workspace Preferences Center">
                <SettingsPanel
                  isDark={isDark}
                  toggleTheme={toggleTheme}
                  showFloatingTaskbar={showFloatingTaskbar}
                  setShowFloatingTaskbar={setShowFloatingTaskbar}
                  onReset={handleResetWorkspace}
                  title={activeMeta.title}
                  setTitle={(newTitle) => handleUpdatePageMeta('title', newTitle)}
                  currentUser={profileName}
                  currentUserImage={profileImage}
                  syncId={syncId}
                  setSyncId={handleUpdateSyncId}
                  streakState={streakState}
                  onResetStreak={handleResetStreak}
                />
              </WidgetErrorBoundary>
            )}
              </motion.div>
            </AnimatePresence>

          </div>

        </div>

        {/* Dynamic bottom floating Things To Do Taskbar */}
        {showFloatingTaskbar && activeTab !== 'notes' && (
          <ThingsToDoTaskbar
            tasks={tasks}
            setTasks={setTasks}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            projects={projects}
            isInline={false}
            onDockToggle={() => setShowFloatingTaskbar(false)}
          />
        )}

      </div>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR */}
      {windowWidth < 768 && (
        <div className="fixed mobile-bottom-nav-bar px-4 py-1.5 flex items-center justify-around z-45 backdrop-blur-md">
          {[
            { label: 'Home', tab: 'dashboard', icon: <Home strokeWidth={2} className="h-[22px] w-[22px] shrink-0" /> },
            { label: 'Tasks', tab: 'habits', icon: <Target strokeWidth={2} className="h-[22px] w-[22px] shrink-0" /> },
            { label: 'Finance', tab: 'finance', icon: <IndianRupee strokeWidth={2} className="h-[22px] w-[22px] shrink-0" /> },
            { label: 'Routine', tab: 'routine', icon: <Clock strokeWidth={2} className="h-[22px] w-[22px] shrink-0" /> }
          ].map((item, idx) => {
            const isActive = !mobileDrawerOpen && activeTab === item.tab;
            return (
              <button
                key={idx}
                onClick={() => {
                  setMobileDrawerOpen(false);
                  handleSelectTabId(item.tab);
                  setCategoryFilter('All');
                  trackRecentPage(item.tab);
                }}
                className={`flex flex-col items-center justify-center space-y-1 cursor-pointer relative py-2.5 px-4 min-h-[44px] focus:outline-none transition-all duration-200 ${
                  isActive 
                    ? `font-extrabold` 
                    : 'hover:opacity-80'
                }`}
                style={{
                  color: isActive ? 'var(--bottom-nav-active)' : 'var(--bottom-nav-inactive)'
                }}
              >
                {item.icon}
                <span className="text-[9px] font-sans font-medium leading-none tracking-tight">{item.label}</span>
                {isActive && (
                  <motion.div layoutId="bottom-nav-indicator" className="absolute -bottom-0.5 h-0.5 w-4 bg-[var(--bottom-nav-active)] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      )}
      {/* 5. SPOTLIGHT SEARCH (⌨️ CMD/CTRL + K) GLASS-MODAL OVERLAY */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-start justify-center pt-[12vh] px-4 animate-in fade-in duration-200"
          onClick={() => { setShowSearchModal(false); setSearchModalQuery(''); }}
        >
          <div 
            className="bg-[#020203] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input field bar */}
            <div className="flex items-center space-x-3 px-4 py-3.5 border-b border-white/5 bg-white/[0.01]">
              <Search className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
              <input 
                type="text"
                autoFocus
                placeholder="Search tools, active tasks, habits, projects..."
                value={searchModalQuery}
                onChange={(e) => {
                  setSearchModalQuery(e.target.value);
                  setSearchSelectedIndex(0);
                }}
                className="w-full bg-transparent text-white placeholder-gray-500 font-sans text-sm outline-none border-none py-0.5 focus:ring-0"
              />
              <button 
                onClick={() => { setShowSearchModal(false); setSearchModalQuery(''); }}
                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                title="Close overlay"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Results output list */}
            <div className="max-h-[340px] overflow-y-auto p-2 space-y-1.5 scrollbar-none">
              {!searchModalQuery.trim() ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-gray-400 font-medium">Type a word to query database...</p>
                  <span className="text-[10px] text-gray-600 font-mono font-bold mt-1 block">
                    e.g., "tasks", "habits", "Silva Method", "careers"
                  </span>
                </div>
              ) : getSearchMatches().length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-purple-400 font-medium italic">No matches exist for "{searchModalQuery}"</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-2 pb-1 flex justify-between items-center text-[9px] font-black tracking-widest text-[#555] uppercase font-mono">
                    <span>Database Matches</span>
                    <span>Matched Items</span>
                  </div>
                  {getSearchMatches().map((item, index) => {
                    const isHovered = index === searchSelectedIndex;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          item.action();
                          setShowSearchModal(false);
                          setSearchModalQuery('');
                        }}
                        className={`w-full text-left rounded-xl p-2.5 transition-all flex items-start space-x-3 relative cursor-pointer ${
                          isHovered 
                            ? 'bg-indigo-600/15 ring-1 ring-indigo-500/30' 
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="text-md shrink-0 mt-0.5">{item.icon}</span>
                        <div className="flex-1 min-w-0 leading-tight">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold truncate ${isHovered ? 'text-white' : 'text-gray-200'}`}>
                              {item.label}
                            </span>
                            <span className="text-[9px] font-mono font-semibold text-gray-500 bg-white/[0.02] border border-white/5 px-2 py-0.25 rounded">
                              {item.category}
                            </span>
                          </div>
                          {item.desc && (
                            <p className="text-[10.5px] text-gray-450 mt-0.5 truncate font-sans">
                              {item.desc}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Instruction tooltip help bar */}
            <div className="px-4 py-2 bg-[#010102] border-t border-white/5 flex justify-between items-center text-[9.5px] font-semibold text-gray-650 font-mono">
              <div className="flex items-center space-x-2.5">
                <span>↑↓ to navigate</span>
                <span>•</span>
                <span>↵ to open</span>
              </div>
              <span>esc to close</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. QUICK ACTIONS GLASS-MODAL FORMS (Create-New Widgets) */}
      {quickActionType && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setQuickActionType(null)}
        >
          <div 
            className="bg-[#020203] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-6 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal branding Header */}
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {quickActionType === 'task' && '➕'}
                  {quickActionType === 'habit' && '🔥'}
                  {quickActionType === 'note' && '📝'}
                  {quickActionType === 'goal' && '🎯'}
                  {quickActionType === 'journal' && '📖'}
                </span>
                <h3 className="text-sm font-extrabold text-white tracking-wider font-display select-none">
                  {quickActionType === 'task' && 'CREATE TASK'}
                  {quickActionType === 'habit' && 'ESTABLISH WORK HABIT'}
                  {quickActionType === 'note' && 'CLIP BRAIN NOTE'}
                  {quickActionType === 'goal' && 'SET WORKSPACE GOAL'}
                  {quickActionType === 'journal' && 'DAILY REFLECTION JOURNAL'}
                </h3>
              </div>
              <button 
                onClick={() => setQuickActionType(null)}
                className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form body selection rendered dynamically */}
            <div className="p-5 font-sans">
              
              {/* A. Task Add Form */}
              {quickActionType === 'task' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!taskTitle.trim()) return;
                  const nt: Task = {
                    id: 'task_' + Date.now(),
                    title: taskTitle.trim(),
                    projectId: taskProjectId === 'standalone' ? null : taskProjectId,
                    priority: taskPriority,
                    status: 'To Do',
                    dueDate: taskDueDate
                  };
                  setTasks(prev => [...prev, nt]);
                  setTaskTitle('');
                  setTaskPriority('Medium');
                  setTaskProjectId('standalone');
                  setQuickActionType(null);
                  setToastMessage("Successfully created task: " + nt.title);
                }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Task Subject</label>
                    <input 
                      type="text"
                      autoFocus
                      required
                      placeholder="Type details of what to get done..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Priority Level</label>
                      <select
                        value={taskPriority}
                        onChange={(e: any) => setTaskPriority(e.target.value)}
                        className="w-full bg-[#020203] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                      >
                        <option value="High">🔴 High Priority</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🔵 Low Priority</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Due Date</label>
                      <input 
                        type="date"
                        required
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full bg-[#020203] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Associated Project</label>
                    <select
                      value={taskProjectId}
                      onChange={(e) => setTaskProjectId(e.target.value)}
                      className="w-full bg-[#020203] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                    >
                      <option value="standalone">⭐ None / Standalone Task</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.emoji || '📂'} {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end space-x-3 text-xs font-bold leading-none">
                    <button 
                      type="button" 
                      onClick={() => setQuickActionType(null)} 
                      className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white cursor-pointer flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Create Task</span>
                    </button>
                  </div>
                </form>
              )}

              {/* B. Task Add Form */}
              {quickActionType === 'habit' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!habitName.trim()) return;
                  const nh: Habit = {
                    id: 'habit_' + Date.now(),
                    name: habitName.trim(),
                    emoji: habitEmoji.trim() || '🔥',
                    streak: 0,
                    category: habitCategory,
                    goal: habitGoal.trim() || undefined
                  };
                  setHabits(prev => [...prev, nh]);
                  setHabitName('');
                  setHabitEmoji('⚡');
                  setHabitGoal('');
                  setQuickActionType(null);
                  setToastMessage("New task established: " + nh.name);
                }} className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block text-center">Emoji</label>
                      <input 
                        type="text"
                        maxLength={2}
                        placeholder="⚡"
                        value={habitEmoji}
                        onChange={(e) => setHabitEmoji(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-2 py-2 text-md text-white text-center outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div className="space-y-1 col-span-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Task Title</label>
                      <input 
                        type="text"
                        autoFocus
                        required
                        placeholder="e.g., Read books, Workout..."
                        value={habitName}
                        onChange={(e) => setHabitName(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Daily target / Goal string</label>
                    <input 
                      type="text"
                      placeholder="e.g., 30 mins deep reflection, drink 2L water..."
                      value={habitGoal}
                      onChange={(e) => setHabitGoal(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Focus category</label>
                    <select
                      value={habitCategory}
                      onChange={(e) => setHabitCategory(e.target.value)}
                      className="w-full bg-[#020203] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                    >
                      <option value="Health">🧘 Health & Recovery</option>
                      <option value="Mindset">💡 Mindset & Study</option>
                      <option value="Fitness">💪 Fitness & Workout</option>
                      <option value="Career">💼 Career & Business</option>
                      <option value="Relationships">💬 Relationships</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end space-x-3 text-xs font-bold leading-none">
                    <button 
                      type="button" 
                      onClick={() => setQuickActionType(null)} 
                      className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white cursor-pointer flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Establish</span>
                    </button>
                  </div>
                </form>
              )}

              {/* C. Quick Note Add Form */}
              {quickActionType === 'note' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteContent.trim()) return;
                  const qn: QuickNote = {
                    id: 'note_' + Date.now(),
                    content: noteContent.trim(),
                    createdAt: new Date().toISOString()
                  };
                  setQuickNotes(prev => [...prev, qn]);
                  setNoteContent('');
                  setQuickActionType(null);
                  setToastMessage("Note saved to Second brain!");
                }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Second Brain Text Note</label>
                    <textarea 
                      rows={4}
                      autoFocus
                      required
                      placeholder="Write your thought, web link, article reference, inspiration quote, or quick task checklists..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/50 resize-none font-sans"
                    />
                  </div>

                  <div className="pt-1 flex justify-end space-x-3 text-xs font-bold leading-none">
                    <button 
                      type="button" 
                      onClick={() => setQuickActionType(null)} 
                      className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white cursor-pointer flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Clip Note</span>
                    </button>
                  </div>
                </form>
              )}

              {/* D. Future Goal Add Form */}
              {quickActionType === 'goal' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!goalName.trim()) return;
                  const gp: Project = {
                    id: 'proj_' + Date.now(),
                    name: goalName.trim(),
                    emoji: '🎯',
                    status: 'Planning',
                    priority: goalPriority,
                    category: 'Goals',
                    deadline: goalDeadline,
                    description: goalDesc.trim() || 'Workspace future goal established.'
                  };
                  setProjects(prev => [...prev, gp]);
                  setGoalName('');
                  setGoalDesc('');
                  setGoalPriority('Medium');
                  setQuickActionType(null);
                  setToastMessage("Life Goal registered: " + gp.name);
                }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Goal Name</label>
                    <input 
                      type="text"
                      autoFocus
                      required
                      placeholder="e.g., Secure Cloud Native Certification, Complete MVP..."
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Description / Action Steps</label>
                    <textarea 
                      rows={2}
                      placeholder="Outline 2-3 target bullet points of execution..."
                      value={goalDesc}
                      onChange={(e) => setGoalDesc(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/50 resize-none font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Priority Tier</label>
                      <select
                        value={goalPriority}
                        onChange={(e: any) => setGoalPriority(e.target.value)}
                        className="w-full bg-[#020203] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                      >
                        <option value="High">🔴 High Priority</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🔵 Low Priority</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Target Deadline</label>
                      <input 
                        type="date"
                        required
                        value={goalDeadline}
                        onChange={(e) => setGoalDeadline(e.target.value)}
                        className="w-full bg-[#020203] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500/50 text-center cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end space-x-3 text-xs font-bold leading-none">
                    <button 
                      type="button" 
                      onClick={() => setQuickActionType(null)} 
                      className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white cursor-pointer flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Set Goal</span>
                    </button>
                  </div>
                </form>
              )}

              {/* E. Reflection Journal Add Form */}
              {quickActionType === 'journal' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!journalText.trim()) return;
                  const todayStr = getLocalDateString();
                  
                  const savedJournals = localStorage.getItem('lifeos_calendar_journals');
                  let dbs: Record<string, string> = {};
                  if (savedJournals) {
                    try {
                      dbs = JSON.parse(savedJournals);
                    } catch (e) {
                      console.error("Failed to parse calendar journals", e);
                    }
                  }
                  dbs[todayStr] = journalText.trim();
                  localStorage.setItem('lifeos_calendar_journals', JSON.stringify(dbs));
                  
                  // dispatch storage reload
                  window.dispatchEvent(new Event('storage'));

                  setJournalText('');
                  setQuickActionType(null);
                  setToastMessage("Daily reflection journal saved for today (" + todayStr + ")!");
                }} className="space-y-4">
                  <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 mb-1 leading-tight text-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block font-mono">Today's Date Stamp</span>
                    <span className="text-xs font-black text-white font-mono mt-0.5 block">{getLocalDateString()}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono block">Reflections, Learnings & Notes</label>
                    <textarea 
                      rows={5}
                      autoFocus
                      required
                      placeholder="Write how your day went, any mental blocks, proud wins, or general notes..."
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500/50 resize-none font-sans"
                    />
                  </div>

                  <div className="pt-1 flex justify-end space-x-3 text-xs font-bold leading-none">
                    <button 
                      type="button" 
                      onClick={() => setQuickActionType(null)} 
                      className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white cursor-pointer flex items-center space-x-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Log</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 7. PREMIUM ABSOLUTE FLOAT TOAST NOTIFICATIONS */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 sm:bottom-6 sm:right-6 bg-indigo-650/95 backdrop-blur-md border border-indigo-500/30 px-4 py-3 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center space-x-2.5 leading-none">
            <span className="text-sm">💬</span>
            <p className="text-xs font-bold text-white tracking-wide">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* 8. USER PROFILE CUSTOMIZATION MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setShowProfileModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
          />
          {/* Modal Container */}
          <div className="relative bg-[#111111] border border-[#1A1A1A] rounded-2xl w-full max-w-md p-6 overflow-hidden shadow-2xl z-20 animate-in zoom-in-95 duration-200 font-sans">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white rounded-lg p-1 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 font-sans">Workspace Profile Settings</h2>
            <p className="text-xs text-zinc-400 mb-6 font-sans">Upload a custom profile avatar, crop/scale it, choose gradient presets, or change your workspace administrator display name.</p>

            <div className="flex flex-col items-center space-y-5">
              {/* Profile custom preview circles */}
              <div className="relative flex flex-col items-center">
                <div className="h-28 w-28 rounded-full overflow-hidden bg-zinc-950 border-2 border-[#1A1A1A] shadow-inner flex items-center justify-center relative">
                  {tempProfileImage ? (
                    <img 
                      src={tempProfileImage}
                      alt="Avatar Preview"
                      style={{
                        transform: `scale(${cropScale})`,
                        transition: 'transform 0.15s ease-out'
                      }}
                      className="h-full w-full object-cover select-none pointer-events-none"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-[#6D5FFC]/10 flex items-center justify-center text-white font-extrabold text-3xl select-none font-sans">
                      {tempProfileName ? tempProfileName.charAt(0).toUpperCase() : 'D'}
                    </div>
                  )}
                </div>
                
                <input 
                  type="file" 
                  id="avatar-file-upload" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setTempProfileImage(reader.result as string);
                        setCropScale(1);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              {/* Sliders controls for position scale */}
              {tempProfileImage && (
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400 font-sans">
                    <span>Position Zoom / Crop Scale</span>
                    <span className="font-mono text-[10px] text-zinc-500">{Math.round(cropScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.05" 
                    value={cropScale}
                    onChange={(e) => setCropScale(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-[#6D5FFC]"
                  />
                </div>
              )}

              {/* Username Input */}
              <div className="w-full space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-sans">Display Name</label>
                <input 
                  type="text" 
                  value={tempProfileName}
                  onChange={(e) => setTempProfileName(e.target.value)}
                  placeholder="Dhruvv"
                  maxLength={16}
                  className="w-full bg-zinc-950 text-white border border-[#1A1A1A] focus:border-[#6D5FFC] rounded-xl px-4 py-2.5 text-xs outline-none transition-all font-sans"
                />
              </div>

              {/* Preset Gradients */}
              <div className="w-full space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block font-sans">Select Preset Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Sleek Obsidian', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80' },
                    { name: 'Aurora Sunset', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=128&auto=format&fit=crop&q=80' },
                    { name: 'Luminous Neon', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=128&auto=format&fit=crop&q=80' },
                    { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=128&auto=format&fit=crop&q=80' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTempProfileImage(preset.url);
                        setCropScale(1);
                      }}
                      className="relative h-11 rounded-lg overflow-hidden border border-[#1A1A1A] hover:border-[#6D5FFC]/60 text-left transition-all active:scale-95 cursor-pointer"
                      title={preset.name}
                    >
                      <img src={preset.url} className="h-full w-full object-cover" alt={preset.name} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Control buttons */}
              <div className="w-full flex justify-between pt-1">
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar-file-upload')?.click()}
                  className="text-xs text-zinc-300 hover:text-white font-semibold flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer font-sans"
                >
                  <UploadCloud className="h-4 w-4 text-[#6D5FFC]" />
                  <span>Upload Image</span>
                </button>

                {tempProfileImage && (
                  <button
                    type="button"
                    onClick={() => setTempProfileImage('')}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer font-sans"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Submit footer */}
              <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-[#1A1A1A] mt-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="w-full py-2.5 rounded-xl border border-[#1A1A1A] text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-semibold transition-all cursor-pointer text-center font-sans"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setProfileName(tempProfileName.trim() || 'Dhruvv');
                    setProfileImage(tempProfileImage);
                    localStorage.setItem('lifeos_profile_name', tempProfileName.trim() || 'Dhruvv');
                    localStorage.setItem('lifeos_profile_image', tempProfileImage);
                    localStorage.setItem('lifeos_profile_crop_scale', cropScale.toString());
                    setShowProfileModal(false);
                    setToastMessage('Profile settings saved successfully');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#6D5FFC] hover:bg-[#5C4FE3] text-white text-xs font-semibold shadow-lg shadow-[#6D5FFC]/20 transition-all cursor-pointer text-center font-sans"
                >
                  Save Profile
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 9. CREATE NEW WORKSPACE MODAL */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowNewWorkspaceModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 cursor-pointer"
          />
          <div className="relative bg-[#111111] border border-[#1A1A1A] rounded-2xl w-full max-w-sm p-5 shadow-2xl z-20 animate-in zoom-in-95 duration-200">
            <h3 className="text-md font-bold text-white mb-1.5 font-sans">Create New Workspace</h3>
            <p className="text-xs text-zinc-400 mb-4 text-left font-sans">Enter a bespoke name for your new high-performance productive workspace context.</p>
            <input 
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="E.g. Silva Mastermind"
              className="w-full bg-zinc-950 text-white border border-[#1A1A1A] focus:border-[#6D5FFC] rounded-xl px-3 py-2 text-xs outline-none transition-all mb-4 font-sans"
              maxLength={22}
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowNewWorkspaceModal(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (newWorkspaceName.trim()) {
                    const newName = newWorkspaceName.trim();
                    if (!workspaces.includes(newName)) {
                      setWorkspaces(prev => [...prev, newName]);
                    }
                    setActiveWorkspace(newName);
                    setNewWorkspaceName('');
                    setShowNewWorkspaceModal(false);
                    setToastMessage(`Switched to workspace: ${newName}`);
                  }
                }}
                className="px-4 py-1.5 text-xs bg-[#6D5FFC] hover:bg-[#5B4EE5] text-white rounded-xl shadow-md font-semibold transition-all cursor-pointer font-sans"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </GlobalErrorBoundary>
  );
}

