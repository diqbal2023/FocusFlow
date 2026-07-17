import type {GoalTargets} from '../models/Goal';
import type {
  DailyProductivity,
  ProductivityCategory,
  ProductivityResult,
  StatisticsDashboard,
  StatisticsInput,
  WeeklyProductivity,
} from '../models/DailyProductivity';
import {goalManager, type GoalManager} from './GoalManager';
import {sessionManager, type SessionManager} from './SessionManager';
import {taskManager, type TaskManager} from './TaskManager';

const DAY_COUNT_MAX = 90;

export const PRODUCTIVITY_MESSAGES: Record<ProductivityCategory, string> = {
  Excellent: 'Outstanding day! You were highly productive.',
  Good: 'Great effort! You had a productive day.',
  Fair: 'Not bad! A little more focus tomorrow can make a big difference.',
  'Needs Improvement': 'Today was tough — tomorrow is a fresh start!',
};

export type StatisticsEngineDependencies = {
  tasks: Pick<TaskManager, 'getCompletionHistory' | 'loadWorkspace'>;
  sessions: Pick<SessionManager, 'getCompletionHistory'>;
  goals: Pick<GoalManager, 'getTargets'>;
};

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function cloneDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function addDays(date: Date, amount: number): Date {
  const result = cloneDate(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function toCalendarDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function eventDateKey(isoDate: string): string | null {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? null : toCalendarDateKey(date);
}

function startOfMondayWeek(date: Date): Date {
  const result = cloneDate(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

function fulfillment(value: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) {
    return 0;
  }
  return Math.min(1, finiteNonNegative(value) / target);
}

/**
 * Pure statistics calculations plus a thin production refresh adapter.
 * Historical records include only completion events observed in this app run.
 */
export class StatisticsEngine {
  constructor(
    private readonly dependencies: StatisticsEngineDependencies = {
      tasks: taskManager,
      sessions: sessionManager,
      goals: goalManager,
    },
  ) {}

  getResult(scoreInput: number): ProductivityResult {
    const score = Math.min(100, Math.max(0, Math.round(
      Number.isFinite(scoreInput) ? scoreInput : 0,
    )));
    let category: ProductivityCategory = 'Needs Improvement';
    if (score >= 85) {
      category = 'Excellent';
    } else if (score >= 70) {
      category = 'Good';
    } else if (score >= 50) {
      category = 'Fair';
    }
    return {score, category, message: PRODUCTIVITY_MESSAGES[category]};
  }

  calculateScore(
    completedTasks: number,
    focusMinutes: number,
    completedFocusSessions: number,
    targets: GoalTargets,
  ): number {
    const weighted =
      fulfillment(completedTasks, targets.tasks) * 40 +
      fulfillment(focusMinutes, targets.focusMinutes) * 40 +
      fulfillment(completedFocusSessions, targets.focusSessions) * 20;
    return this.getResult(weighted).score;
  }

  summarizeDay(
    date: Date,
    input: StatisticsInput,
    targets: GoalTargets,
  ): DailyProductivity {
    const key = toCalendarDateKey(date);
    const completedTasks = input.taskCompletions.filter(
      event => eventDateKey(event.completedAt) === key,
    ).length;
    const sessions = input.sessionCompletions.filter(
      event => eventDateKey(event.completedAt) === key,
    );
    const completedFocusSessions = sessions.filter(
      event => event.mode === 'work',
    ).length;
    const focusMinutes = sessions
      .filter(event => event.mode === 'work')
      .reduce((total, event) => total + finiteNonNegative(event.durationMs), 0) /
      60_000;
    const breakMinutes = sessions
      .filter(event => event.mode !== 'work')
      .reduce((total, event) => total + finiteNonNegative(event.durationMs), 0) /
      60_000;
    const result = this.getResult(
      this.calculateScore(
        completedTasks,
        focusMinutes,
        completedFocusSessions,
        targets,
      ),
    );

    return {
      date: key,
      completedTasks,
      completedFocusSessions,
      focusMinutes,
      breakMinutes,
      hasActivity:
        completedTasks > 0 || completedFocusSessions > 0 || breakMinutes > 0,
      ...result,
    };
  }

  summarizeWeek(
    date: Date,
    input: StatisticsInput,
    targets: GoalTargets,
  ): WeeklyProductivity {
    const weekStartDate = startOfMondayWeek(date);
    const days = Array.from({length: 7}, (_, index) =>
      this.summarizeDay(addDays(weekStartDate, index), input, targets),
    );
    const total = (field: keyof Pick<
      DailyProductivity,
      'completedTasks' | 'completedFocusSessions' | 'focusMinutes' | 'breakMinutes'
    >) => days.reduce((sum, day) => sum + day[field], 0);
    const activeDays = days.filter(day => day.hasActivity);
    const bestDay =
      activeDays.length === 0
        ? null
        : activeDays.reduce((best, day) => day.score > best.score ? day : best);

    return {
      weekStart: toCalendarDateKey(weekStartDate),
      weekEnd: toCalendarDateKey(addDays(weekStartDate, 6)),
      days,
      completedTasks: total('completedTasks'),
      completedFocusSessions: total('completedFocusSessions'),
      focusMinutes: total('focusMinutes'),
      breakMinutes: total('breakMinutes'),
      averageScore: Math.round(
        days.reduce((sum, day) => sum + day.score, 0) / days.length,
      ),
      productiveDays: days.filter(day => day.score >= 50 && day.hasActivity).length,
      bestDay,
    };
  }

  buildHistory(
    endDate: Date,
    input: StatisticsInput,
    targets: GoalTargets,
    requestedDays: number = DAY_COUNT_MAX,
  ): DailyProductivity[] {
    const days = Math.min(
      DAY_COUNT_MAX,
      Math.max(1, Math.floor(Number.isFinite(requestedDays) ? requestedDays : 1)),
    );
    return Array.from({length: days}, (_, index) =>
      this.summarizeDay(addDays(endDate, index - days + 1), input, targets),
    );
  }

  calculateStreak(
    now: Date,
    input: StatisticsInput,
    targets: GoalTargets,
  ): number {
    const today = this.summarizeDay(now, input, targets);
    let cursor = today.hasActivity ? cloneDate(now) : addDays(now, -1);
    let streak = 0;

    for (let index = 0; index < DAY_COUNT_MAX; index += 1) {
      const day = this.summarizeDay(cursor, input, targets);
      if (!day.hasActivity || day.score < 50) {
        break;
      }
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  async refresh(
    selectedDate: Date = new Date(),
    now: Date = new Date(),
  ): Promise<StatisticsDashboard> {
    const [workspace] = await Promise.all([
      this.dependencies.tasks.loadWorkspace(),
    ]);
    const input: StatisticsInput = {
      taskCompletions: this.dependencies.tasks.getCompletionHistory(),
      sessionCompletions: this.dependencies.sessions.getCompletionHistory(),
    };
    const targets = this.dependencies.goals.getTargets('daily');

    return {
      selectedDate: toCalendarDateKey(selectedDate),
      daily: this.summarizeDay(selectedDate, input, targets),
      weekly: this.summarizeWeek(selectedDate, input, targets),
      history: this.buildHistory(now, input, targets),
      streak: this.calculateStreak(now, input, targets),
      existingCompletedTaskSnapshot: workspace.tasks.filter(
        task => task.status === 'Completed',
      ).length,
      targets: {...targets},
      generatedAt: now.toISOString(),
    };
  }
}

export const statisticsEngine = new StatisticsEngine();
