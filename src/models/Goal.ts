export type GoalPeriod = 'daily' | 'weekly';

export type GoalMetric = 'tasks' | 'focusSessions' | 'focusMinutes';

export type GoalTargets = {
  tasks: number;
  focusSessions: number;
  focusMinutes: number;
};

export type GoalProgress = {
  tasks: number;
  focusSessions: number;
  focusMinutes: number;
};

export type GoalCompletionStatus = 'In progress' | 'Complete';

export type GoalMetricProgress = {
  metric: GoalMetric;
  label: string;
  completed: number;
  target: number;
  remaining: number;
  percentage: number;
  formattedProgress: string;
  status: GoalCompletionStatus;
  isComplete: boolean;
};

export type GoalPeriodProgress = {
  period: GoalPeriod;
  title: string;
  targets: GoalTargets;
  progress: GoalProgress;
  metrics: GoalMetricProgress[];
  overallPercentage: number;
  formattedProgress: string;
  status: GoalCompletionStatus;
  isComplete: boolean;
  completionMessage: string | null;
};

export type GoalsProgress = {
  daily: GoalPeriodProgress;
  weekly: GoalPeriodProgress;
  summary: string;
};

export const DEFAULT_DAILY_GOAL_TARGETS: GoalTargets = {
  tasks: 5,
  focusSessions: 4,
  focusMinutes: 120,
};

export const DEFAULT_WEEKLY_GOAL_TARGETS: GoalTargets = {
  tasks: 30,
  focusSessions: 20,
  focusMinutes: 600,
};

export const EMPTY_GOAL_PROGRESS: GoalProgress = {
  tasks: 0,
  focusSessions: 0,
  focusMinutes: 0,
};
