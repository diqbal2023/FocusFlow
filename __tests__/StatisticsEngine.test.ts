import {StatisticsEngine, toCalendarDateKey} from '../src/managers/StatisticsEngine';
import type {StatisticsInput} from '../src/models/DailyProductivity';
import type {GoalTargets} from '../src/models/Goal';
import type {Task} from '../src/types/task';

const targets: GoalTargets = {tasks: 2, focusSessions: 2, focusMinutes: 50};

function at(day: number, hour = 12): Date {
  return new Date(2026, 6, day, hour);
}

function input(
  taskDays: number[] = [],
  sessions: Array<{day: number; mode: 'work' | 'shortBreak' | 'longBreak'; minutes: number}> = [],
): StatisticsInput {
  return {
    taskCompletions: taskDays.map((day, index) => ({
      taskId: `task-${index}`,
      completedAt: at(day).toISOString(),
    })),
    sessionCompletions: sessions.map((session, index) => ({
      mode: session.mode,
      completedAt: at(session.day, 13 + index).toISOString(),
      durationMs: session.minutes * 60_000,
    })),
  };
}

describe('StatisticsEngine', () => {
  const engine = new StatisticsEngine();

  test('TC_STATS_01 summarizes selected-date task, focus, and break totals', () => {
    const summary = engine.summarizeDay(
      at(16),
      input(
        [15, 16],
        [
          {day: 16, mode: 'work', minutes: 25},
          {day: 16, mode: 'shortBreak', minutes: 5},
          {day: 15, mode: 'longBreak', minutes: 15},
        ],
      ),
      targets,
    );

    expect(summary).toMatchObject({
      date: '2026-07-16',
      completedTasks: 1,
      completedFocusSessions: 1,
      focusMinutes: 25,
      breakMinutes: 5,
      hasActivity: true,
    });
  });

  test('TC_STATS_02 applies the 40/40/20 productivity formula', () => {
    expect(engine.calculateScore(1, 25, 1, targets)).toBe(50);
    expect(engine.calculateScore(2, 50, 2, targets)).toBe(100);
  });

  test('TC_STATS_03 caps fulfillment and clamps the score to 0–100', () => {
    expect(engine.calculateScore(20, 500, 20, targets)).toBe(100);
    expect(engine.calculateScore(-3, -25, -1, targets)).toBe(0);
    expect(engine.getResult(150).score).toBe(100);
    expect(engine.getResult(-20).score).toBe(0);
  });

  test('TC_STATS_04 maps exact category boundaries and centralized messages', () => {
    expect(engine.getResult(85)).toEqual({
      score: 85,
      category: 'Excellent',
      message: 'Outstanding day! You were highly productive.',
    });
    expect(engine.getResult(84).category).toBe('Good');
    expect(engine.getResult(84).message).toBe(
      'Great effort! You had a productive day.',
    );
    expect(engine.getResult(70).category).toBe('Good');
    expect(engine.getResult(69).category).toBe('Fair');
    expect(engine.getResult(69).message).toBe(
      'Not bad! A little more focus tomorrow can make a big difference.',
    );
    expect(engine.getResult(50).category).toBe('Fair');
    expect(engine.getResult(49).category).toBe('Needs Improvement');
    expect(engine.getResult(49).message).toBe(
      'Today was tough — tomorrow is a fresh start!',
    );
  });

  test('TC_STATS_05 handles no data and zero targets without division errors', () => {
    const summary = engine.summarizeDay(
      at(16),
      input(),
      {tasks: 0, focusSessions: 0, focusMinutes: 0},
    );
    expect(summary.score).toBe(0);
    expect(summary.category).toBe('Needs Improvement');
    expect(summary.hasActivity).toBe(false);
  });

  test('TC_STATS_06 creates a Monday–Sunday weekly summary', () => {
    const data = input(
      [13, 14, 14],
      [
        {day: 13, mode: 'work', minutes: 25},
        {day: 14, mode: 'work', minutes: 50},
        {day: 14, mode: 'work', minutes: 25},
      ],
    );
    const week = engine.summarizeWeek(at(16), data, targets);

    expect(week.weekStart).toBe('2026-07-13');
    expect(week.weekEnd).toBe('2026-07-19');
    expect(week.days).toHaveLength(7);
    expect(week.completedTasks).toBe(3);
    expect(week.completedFocusSessions).toBe(3);
    expect(week.focusMinutes).toBe(100);
    expect(week.averageScore).toBe(21);
    expect(week.productiveDays).toBe(2);
    expect(week.bestDay?.date).toBe('2026-07-14');
  });

  test('TC_STATS_07 generates ordered zero-filled history capped at 90 days', () => {
    const history = engine.buildHistory(at(16), input([16]), targets, 120);

    expect(history).toHaveLength(90);
    expect(history.at(-1)?.date).toBe('2026-07-16');
    expect(history.at(-1)?.completedTasks).toBe(1);
    expect(history[0].date < history[89].date).toBe(true);
    expect(history.filter(day => !day.hasActivity)).toHaveLength(89);
  });

  test('TC_STATS_08 counts consecutive Fair-or-better active days', () => {
    const data = input(
      [14, 15, 16],
      [14, 15, 16].map(day => ({day, mode: 'work' as const, minutes: 25})),
    );
    expect(engine.calculateStreak(at(16), data, targets)).toBe(3);
  });

  test('TC_STATS_09 looks back from yesterday when today has no activity', () => {
    const data = input(
      [14, 15],
      [14, 15].map(day => ({day, mode: 'work' as const, minutes: 25})),
    );
    expect(engine.calculateStreak(at(16), data, targets)).toBe(2);
  });

  test('TC_STATS_10 does not count future, no-data, or below-Fair days', () => {
    const future = input(
      [16, 17],
      [{day: 17, mode: 'work', minutes: 25}],
    );
    expect(engine.calculateStreak(at(16), future, targets)).toBe(0);
  });

  test('TC_STATS_11 counts only work sessions as focus while retaining break time', () => {
    const summary = engine.summarizeDay(
      at(16),
      input([], [
        {day: 16, mode: 'shortBreak', minutes: 5},
        {day: 16, mode: 'longBreak', minutes: 15},
      ]),
      targets,
    );
    expect(summary.completedFocusSessions).toBe(0);
    expect(summary.focusMinutes).toBe(0);
    expect(summary.breakMinutes).toBe(20);
    expect(summary.score).toBe(0);
  });

  test('TC_STATS_12 refreshes from injected managers without dating snapshots', async () => {
    const completed: Task = {
      id: 'persisted-complete',
      title: 'Undated snapshot',
      description: '',
      priority: 'Medium',
      status: 'Completed',
      dueDate: '',
      estimatedDurationMinutes: '25',
      labels: '',
      parentTaskId: null,
    };
    const runtimeInput = input(
      [16],
      [{day: 16, mode: 'work', minutes: 25}],
    );
    const injected = new StatisticsEngine({
      tasks: {
        getCompletionHistory: () => runtimeInput.taskCompletions,
        loadWorkspace: async () => ({tasks: [completed], deletedTasks: []}),
      },
      sessions: {
        getCompletionHistory: () => runtimeInput.sessionCompletions,
      },
      goals: {
        getTargets: () => ({...targets}),
      },
    });

    const dashboard = await injected.refresh(at(16), at(16));
    expect(dashboard.daily.completedTasks).toBe(1);
    expect(dashboard.existingCompletedTaskSnapshot).toBe(1);
    expect(dashboard.history.at(-1)?.date).toBe(toCalendarDateKey(at(16)));
  });
});
