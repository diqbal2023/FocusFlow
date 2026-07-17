import type {GoalTargets} from './Goal';

export type ProductivityCategory =
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Needs Improvement';

export type ProductivityResult = {
  score: number;
  category: ProductivityCategory;
  message: string;
};

export type DailyProductivity = ProductivityResult & {
  date: string;
  completedTasks: number;
  completedFocusSessions: number;
  focusMinutes: number;
  breakMinutes: number;
  hasActivity: boolean;
};

export type WeeklyProductivity = {
  weekStart: string;
  weekEnd: string;
  days: DailyProductivity[];
  completedTasks: number;
  completedFocusSessions: number;
  focusMinutes: number;
  breakMinutes: number;
  averageScore: number;
  productiveDays: number;
  bestDay: DailyProductivity | null;
};

export type StatisticsInput = {
  taskCompletions: Array<{taskId: string; completedAt: string}>;
  sessionCompletions: Array<{
    mode: 'work' | 'shortBreak' | 'longBreak';
    completedAt: string;
    durationMs: number;
  }>;
};

export type StatisticsDashboard = {
  selectedDate: string;
  daily: DailyProductivity;
  weekly: WeeklyProductivity;
  history: DailyProductivity[];
  streak: number;
  existingCompletedTaskSnapshot: number;
  targets: GoalTargets;
  generatedAt: string;
};
