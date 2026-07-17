import {
  DEFAULT_DAILY_GOAL_TARGETS,
  DEFAULT_WEEKLY_GOAL_TARGETS,
  EMPTY_GOAL_PROGRESS,
  type GoalMetric,
  type GoalMetricProgress,
  type GoalPeriod,
  type GoalPeriodProgress,
  type GoalProgress,
  type GoalsProgress,
  type GoalTargets,
} from '../models/Goal';
import {sessionManager} from './SessionManager';
import {taskManager} from './TaskManager';

const METRICS: GoalMetric[] = ['tasks', 'focusSessions', 'focusMinutes'];

const METRIC_LABELS: Record<GoalMetric, string> = {
  tasks: 'Tasks completed',
  focusSessions: 'Focus sessions',
  focusMinutes: 'Focus minutes',
};

type GoalBaselines = Record<GoalPeriod, GoalProgress>;

function cloneProgress(progress: GoalProgress): GoalProgress {
  return {...progress};
}

function cloneTargets(targets: GoalTargets): GoalTargets {
  return {...targets};
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizeProgress(progress: GoalProgress): GoalProgress {
  return {
    tasks: normalizeCount(progress.tasks),
    focusSessions: normalizeCount(progress.focusSessions),
    focusMinutes: normalizeCount(progress.focusMinutes),
  };
}

function normalizeTarget(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Goal targets must be whole numbers zero or greater.');
  }
  return value;
}

function normalizeTargets(targets: GoalTargets): GoalTargets {
  return {
    tasks: normalizeTarget(targets.tasks),
    focusSessions: normalizeTarget(targets.focusSessions),
    focusMinutes: normalizeTarget(targets.focusMinutes),
  };
}

function subtractProgress(
  current: GoalProgress,
  baseline: GoalProgress,
): GoalProgress {
  return {
    tasks: Math.max(0, current.tasks - baseline.tasks),
    focusSessions: Math.max(
      0,
      current.focusSessions - baseline.focusSessions,
    ),
    focusMinutes: Math.max(0, current.focusMinutes - baseline.focusMinutes),
  };
}

function percentage(completed: number, target: number): number {
  if (target === 0) {
    return 100;
  }
  return Math.min(100, Math.round((completed / target) * 100));
}

function getDailyPeriodKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeeklyPeriodKey(date: Date): string {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = localDate.getDay() || 7;
  localDate.setDate(localDate.getDate() + 4 - day);
  const yearStart = new Date(localDate.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((localDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${localDate.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Calculates goal progress and owns configurable targets/reset baselines.
 *
 * The current repositories do not retain task completion timestamps or
 * session history. refreshFromManagers therefore uses the real data that is
 * available: stored tasks currently marked Completed and completed work
 * sessions in the current SessionManager runtime.
 */
export class GoalManager {
  private dailyTargets = cloneTargets(DEFAULT_DAILY_GOAL_TARGETS);
  private weeklyTargets = cloneTargets(DEFAULT_WEEKLY_GOAL_TARGETS);
  private activity = cloneProgress(EMPTY_GOAL_PROGRESS);
  private baselines: GoalBaselines = {
    daily: cloneProgress(EMPTY_GOAL_PROGRESS),
    weekly: cloneProgress(EMPTY_GOAL_PROGRESS),
  };
  private dailyPeriodKey: string;
  private weeklyPeriodKey: string;
  private referenceDate: Date;

  constructor(now: Date = new Date()) {
    this.referenceDate = new Date(now);
    this.dailyPeriodKey = getDailyPeriodKey(now);
    this.weeklyPeriodKey = getWeeklyPeriodKey(now);
  }

  getTargets(period: GoalPeriod): GoalTargets {
    return cloneTargets(
      period === 'daily' ? this.dailyTargets : this.weeklyTargets,
    );
  }

  setTargets(
    period: GoalPeriod,
    targets: GoalTargets,
    now?: Date,
  ): GoalsProgress {
    const normalized = normalizeTargets(targets);
    if (period === 'daily') {
      this.dailyTargets = normalized;
    } else {
      this.weeklyTargets = normalized;
    }
    // Target edits must not silently roll a deterministically constructed
    // manager to the machine's real date (D_STAGE16_01).
    return this.getProgress(now ?? this.referenceDate);
  }

  /**
   * Replaces source totals with actual manager values and recalculates goals.
   * Public for deterministic direct unit tests and future data adapters.
   */
  synchronizeProgress(
    progress: GoalProgress,
    now: Date = new Date(),
  ): GoalsProgress {
    const normalized = normalizeProgress(progress);
    this.rollPeriods(now, normalized);
    this.activity = normalized;
    return this.getProgress(now);
  }

  async refreshFromManagers(now: Date = new Date()): Promise<GoalsProgress> {
    const workspace = await taskManager.loadWorkspace();
    const completedTasks = workspace.tasks.filter(
      task => task.status === 'Completed',
    ).length;
    const focusSessions = sessionManager.getCompletedWorkSessions();
    const focusMinutes = Math.round(
      sessionManager
        .getCompletionHistory()
        .filter(event => event.mode === 'work')
        .reduce((total, event) => total + event.durationMs, 0) / 60_000,
    );

    return this.synchronizeProgress(
      {
        tasks: completedTasks,
        focusSessions,
        focusMinutes,
      },
      now,
    );
  }

  reset(period: GoalPeriod, now: Date = new Date()): GoalsProgress {
    this.rollPeriods(now, this.activity);
    this.baselines[period] = cloneProgress(this.activity);
    return this.getProgress(now);
  }

  resetAll(now: Date = new Date()): GoalsProgress {
    this.rollPeriods(now, this.activity);
    this.baselines = {
      daily: cloneProgress(this.activity),
      weekly: cloneProgress(this.activity),
    };
    return this.getProgress(now);
  }

  getProgress(now: Date = new Date()): GoalsProgress {
    this.rollPeriods(now, this.activity);
    const daily = this.buildPeriod(
      'daily',
      this.dailyTargets,
      subtractProgress(this.activity, this.baselines.daily),
    );
    const weekly = this.buildPeriod(
      'weekly',
      this.weeklyTargets,
      subtractProgress(this.activity, this.baselines.weekly),
    );

    return {
      daily,
      weekly,
      summary: this.buildSummary(daily, weekly),
    };
  }

  private rollPeriods(now: Date, current: GoalProgress): void {
    this.referenceDate = new Date(now);
    const dailyKey = getDailyPeriodKey(now);
    const weeklyKey = getWeeklyPeriodKey(now);

    if (dailyKey !== this.dailyPeriodKey) {
      this.dailyPeriodKey = dailyKey;
      this.baselines.daily = cloneProgress(current);
    }
    if (weeklyKey !== this.weeklyPeriodKey) {
      this.weeklyPeriodKey = weeklyKey;
      this.baselines.weekly = cloneProgress(current);
    }
  }

  private buildPeriod(
    period: GoalPeriod,
    targets: GoalTargets,
    progress: GoalProgress,
  ): GoalPeriodProgress {
    const metrics = METRICS.map(metric =>
      this.buildMetric(metric, progress[metric], targets[metric]),
    );
    const overallPercentage = Math.round(
      metrics.reduce((total, metric) => total + metric.percentage, 0) /
        metrics.length,
    );
    const isComplete = metrics.every(metric => metric.isComplete);
    const completedMetrics = metrics.filter(metric => metric.isComplete).length;

    return {
      period,
      title: period === 'daily' ? 'Daily Goals' : 'Weekly Goals',
      targets: cloneTargets(targets),
      progress: cloneProgress(progress),
      metrics,
      overallPercentage,
      formattedProgress: `${completedMetrics} of ${metrics.length} targets complete`,
      status: isComplete ? 'Complete' : 'In progress',
      isComplete,
      completionMessage: isComplete
        ? period === 'daily'
          ? 'Daily goals complete! Great work today.'
          : 'Weekly goals complete! Excellent work this week.'
        : null,
    };
  }

  private buildMetric(
    metric: GoalMetric,
    completed: number,
    target: number,
  ): GoalMetricProgress {
    const isComplete = completed >= target;
    return {
      metric,
      label: METRIC_LABELS[metric],
      completed,
      target,
      remaining: Math.max(0, target - completed),
      percentage: percentage(completed, target),
      formattedProgress: `${completed} / ${target}`,
      status: isComplete ? 'Complete' : 'In progress',
      isComplete,
    };
  }

  private buildSummary(
    daily: GoalPeriodProgress,
    weekly: GoalPeriodProgress,
  ): string {
    if (daily.isComplete && weekly.isComplete) {
      return 'Daily and weekly goals are complete.';
    }
    if (daily.isComplete) {
      return 'Daily goals complete. Keep building weekly progress.';
    }
    if (weekly.isComplete) {
      return 'Weekly goals complete. Keep today moving.';
    }
    return `Daily ${daily.overallPercentage}% · Weekly ${weekly.overallPercentage}%`;
  }
}

export const goalManager = new GoalManager();
