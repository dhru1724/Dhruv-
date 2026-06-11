import { Project, Task, Habit, Pillar, QuickNote, HabitLog } from './types';

export const INITIAL_PILLARS: Pillar[] = [
  {
    id: 'pillar-1',
    name: 'Health & Vitality',
    emoji: '🌿',
    color: 'emerald',
    focusArea: 'Hydration, Gym & Sleep quality',
    progress: 75,
    vision: 'Cultivate high physical energy, focus limits and optimal restorative recovery.'
  },
  {
    id: 'pillar-2',
    name: 'Wealth & Career',
    emoji: '📈',
    color: 'blue',
    focusArea: 'Fullstack App Projects & Investments',
    progress: 60,
    vision: 'Build useful, interactive tools while securing financial independence.'
  },
  {
    id: 'pillar-3',
    name: 'Mind & Spirit',
    emoji: '📚',
    color: 'purple',
    focusArea: 'Books reading & Habitual mindfulness',
    progress: 40,
    vision: 'Stay calm, focused, and read 12 non-fiction books this year.'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Workspace Redesign',
    emoji: '🎨',
    status: 'In Progress',
    priority: 'High',
    category: 'Environment',
    deadline: '2026-06-15',
    description: 'Optimize the physical table, lighting, and ambient posture configuration for focused technical sprint sessions.'
  },
  {
    id: 'proj-2',
    name: 'Full-Stack Developer Brand',
    emoji: '💻',
    status: 'In Progress',
    priority: 'Medium',
    category: 'Career',
    deadline: '2026-07-20',
    description: 'Establish a pristine portfolio design showcasing premium React & TypeScript apps with custom user UI.'
  },
  {
    id: 'proj-3',
    name: 'Marathon Preparation',
    emoji: '🏃‍♂️',
    status: 'Planning',
    priority: 'Low',
    category: 'Fitness',
    deadline: '2026-10-10',
    description: 'Gradual mileage expansion from base run to 21K training over the next four months with clean nutrition.'
  }
];

// Dynamic Offset Date Generator to ensure the timeline matches today's date perfectly
const getOffsetDateStr = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const t0 = getOffsetDateStr(0);
const t1 = getOffsetDateStr(1);
const t2 = getOffsetDateStr(2);
const t3 = getOffsetDateStr(3);
const t4 = getOffsetDateStr(4);

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_HABITS: Habit[] = [
  { id: 'hab-1', name: 'Meditation (10m)', emoji: '🧘‍♀️', streak: 4, time: '07:00 AM' },
  { id: 'hab-2', name: 'Read 10 Pages', emoji: '📖', streak: 3, time: '09:00 AM' },
  { id: 'hab-3', name: 'Hit Gym or Run', emoji: '💪', streak: 1, time: '06:00 PM' },
  { id: 'hab-4', name: 'Drink 3L Water', emoji: '💧', streak: 12, time: 'All Day' },
  { id: 'hab-5', name: '8 Hours Sleep', emoji: '💤', streak: 5, time: '11:00 PM' }
];

export const INITIAL_QUICK_NOTES: QuickNote[] = [
  {
    id: 'note-1',
    content: 'Review the design rules: Keep margin headers clean. Avoid excess telemetry counters. Focus purely on high contrast visual beauty.',
    createdAt: '2026-06-02T04:20:00Z'
  },
  {
    id: 'note-2',
    content: 'Need to research Notion spacing: typically leaves a generous 10% whitespace on large viewports for focus.',
    createdAt: '2026-06-02T05:00:00Z'
  }
];

// Helper to generate initial logs (previous dates done)
export const getInitialHabitLogs = (habits: Habit[]): HabitLog => {
  const result: HabitLog = {};
  const today = new Date().toISOString().split('T')[0];
  
  // Custom past dates for visual richness
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  habits.forEach(h => {
    result[h.id] = {};
    const streakCount = h.id === 'hab-1' ? 4 : h.id === 'hab-2' ? 3 : h.id === 'hab-3' ? 1 : h.id === 'hab-4' ? 12 : h.id === 'hab-5' ? 5 : h.streak || 0;
    
    // We populate the past `streakCount` consecutive days as true (including today)
    for (let i = 0; i < streakCount; i++) {
      result[h.id][getPastDateStr(i)] = true;
    }
  });

  return result;
};

export const QUOTES = [
  { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Patience and persistence have a magical effect before which difficulties disappear.", author: "John Quincy Adams" }
];
