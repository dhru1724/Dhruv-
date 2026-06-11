export interface Project {
  id: string;
  name: string;
  emoji: string;
  status: 'Planning' | 'In Progress' | 'Blocked' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  deadline: string;
  description: string;
}

export interface Task {
  id: string;
  projectId: string | null; // Can be a standalone task
  title: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  dayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'; // For weekly planner
  category?: string;
  notes?: string;
  emoji?: string;
  time?: string;
  streak?: number;
  isArchived?: boolean;
  completedDates?: Record<string, boolean>;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  streak: number;
  color?: string;
  category?: string;
  goal?: string;
  time?: string;
}

export interface HabitLog {
  [habitId: string]: {
    [dateStr: string]: boolean | 'partial' | string; // format: YYYY-MM-DD -> true / false or other states
  };
}

export interface Pillar {
  id: string;
  name: string;
  emoji: string;
  color: string;
  focusArea: string;
  progress: number;
  vision: string;
}

export interface QuickNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface UserStats {
  score: number;
  projectCompletion: number;
  habitCompletion: number;
  taskCompletion: number;
}
