import {GoalManager} from '../src/managers/GoalManager';
import {
  DEFAULT_DAILY_GOAL_TARGETS,
  DEFAULT_WEEKLY_GOAL_TARGETS,
} from '../src/models/Goal';

describe('GoalManager', () => {
  const now = new Date('2026-07-16T10:00:00');

  test('TC_GOAL_01 creates the default daily targets', () => {
    const manager = new GoalManager(now);

    expect(manager.getTargets('daily')).toEqual(DEFAULT_DAILY_GOAL_TARGETS);
  });

  test('TC_GOAL_02 creates the default weekly targets', () => {
    const manager = new GoalManager(now);

    expect(manager.getTargets('weekly')).toEqual(DEFAULT_WEEKLY_GOAL_TARGETS);
  });

  test('TC_GOAL_03 calculates daily task progress and formatting', () => {
    const manager = new GoalManager(now);
    const goals = manager.synchronizeProgress(
      {tasks: 2, focusSessions: 0, focusMinutes: 0},
      now,
    );
    const tasks = goals.daily.metrics.find(metric => metric.metric === 'tasks');

    expect(tasks).toMatchObject({
      completed: 2,
      target: 5,
      remaining: 3,
      percentage: 40,
      formattedProgress: '2 / 5',
      status: 'In progress',
    });
  });

  test('TC_GOAL_04 calculates focus session and minute progress', () => {
    const manager = new GoalManager(now);
    const goals = manager.synchronizeProgress(
      {tasks: 0, focusSessions: 3, focusMinutes: 75},
      now,
    );

    expect(goals.daily.metrics[1]).toMatchObject({
      metric: 'focusSessions',
      completed: 3,
      remaining: 1,
      percentage: 75,
    });
    expect(goals.daily.metrics[2]).toMatchObject({
      metric: 'focusMinutes',
      completed: 75,
      remaining: 45,
      percentage: 63,
    });
  });

  test('TC_GOAL_05 calculates weekly progress against weekly targets', () => {
    const manager = new GoalManager(now);
    const goals = manager.synchronizeProgress(
      {tasks: 15, focusSessions: 10, focusMinutes: 300},
      now,
    );

    expect(goals.weekly.progress).toEqual({
      tasks: 15,
      focusSessions: 10,
      focusMinutes: 300,
    });
    expect(goals.weekly.metrics.map(metric => metric.percentage)).toEqual([
      50, 50, 50,
    ]);
    expect(goals.weekly.overallPercentage).toBe(50);
  });

  test('TC_GOAL_06 marks daily goals complete when every target is met', () => {
    const manager = new GoalManager(now);
    const goals = manager.synchronizeProgress(
      {tasks: 5, focusSessions: 4, focusMinutes: 120},
      now,
    );

    expect(goals.daily).toMatchObject({
      overallPercentage: 100,
      status: 'Complete',
      isComplete: true,
      formattedProgress: '3 of 3 targets complete',
      completionMessage: 'Daily goals complete! Great work today.',
    });
  });

  test('TC_GOAL_07 remains incomplete when one target is missing', () => {
    const manager = new GoalManager(now);
    const goals = manager.synchronizeProgress(
      {tasks: 5, focusSessions: 4, focusMinutes: 119},
      now,
    );

    expect(goals.daily.isComplete).toBe(false);
    expect(goals.daily.status).toBe('In progress');
    expect(goals.daily.completionMessage).toBeNull();
    expect(goals.daily.formattedProgress).toBe('2 of 3 targets complete');
  });

  test('TC_GOAL_08 marks configured weekly goals complete', () => {
    const manager = new GoalManager(now);
    manager.setTargets('weekly', {
      tasks: 2,
      focusSessions: 1,
      focusMinutes: 25,
    });
    const goals = manager.synchronizeProgress(
      {tasks: 2, focusSessions: 1, focusMinutes: 25},
      now,
    );

    expect(goals.weekly.isComplete).toBe(true);
    expect(goals.weekly.completionMessage).toBe(
      'Weekly goals complete! Excellent work this week.',
    );
  });

  test('TC_GOAL_09 resets daily and weekly progress while preserving targets', () => {
    const manager = new GoalManager(now);
    const dailyTargets = {tasks: 7, focusSessions: 3, focusMinutes: 90};
    const weeklyTargets = {tasks: 35, focusSessions: 22, focusMinutes: 650};
    manager.setTargets('daily', dailyTargets);
    manager.setTargets('weekly', weeklyTargets);
    manager.synchronizeProgress(
      {tasks: 4, focusSessions: 2, focusMinutes: 50},
      now,
    );

    const dailyReset = manager.reset('daily', now);
    expect(dailyReset.daily.progress).toEqual({
      tasks: 0,
      focusSessions: 0,
      focusMinutes: 0,
    });
    expect(dailyReset.daily.targets).toEqual(dailyTargets);
    expect(dailyReset.weekly.progress.tasks).toBe(4);

    const weeklyReset = manager.reset('weekly', now);
    expect(weeklyReset.weekly.progress).toEqual({
      tasks: 0,
      focusSessions: 0,
      focusMinutes: 0,
    });
    expect(weeklyReset.weekly.targets).toEqual(weeklyTargets);
  });

  test('TC_GOAL_10 calculates capped metric and overall percentages', () => {
    const manager = new GoalManager(now);
    manager.setTargets('daily', {
      tasks: 4,
      focusSessions: 4,
      focusMinutes: 100,
    });
    const goals = manager.synchronizeProgress(
      {tasks: 2, focusSessions: 2, focusMinutes: 150},
      now,
    );

    expect(goals.daily.metrics.map(metric => metric.percentage)).toEqual([
      50, 50, 100,
    ]);
    expect(goals.daily.overallPercentage).toBe(67);
  });
});
