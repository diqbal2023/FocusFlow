/**
 * Stage 21 end-to-end manager workflow (no native UI).
 * Covers: settings/goals init → task CRUD/complete → focus start/pause/resume/reset/skip
 * → long-break cycle → goals/statistics reflection → settings change → persistence reload.
 * @format
 */

import {GoalManager} from '../src/managers/GoalManager';
import {SettingsManager} from '../src/managers/SettingsManager';
import {SessionManager} from '../src/managers/SessionManager';
import {StatisticsEngine} from '../src/managers/StatisticsEngine';
import {TaskManager} from '../src/managers/TaskManager';
import {
  DEFAULT_APP_SETTINGS,
  cloneSettings,
  type AppSettings,
} from '../src/models/AppSettings';
import {InMemoryTaskRepository} from '../src/repositories/InMemoryTaskRepository';
import type {ISettingsRepository} from '../src/repositories/SettingsRepository';
import {TimerService} from '../src/services/TimerService';

class MemorySettingsRepository implements ISettingsRepository {
  value: AppSettings;

  constructor(initial: AppSettings = cloneSettings(DEFAULT_APP_SETTINGS)) {
    this.value = cloneSettings(initial);
  }

  async load() {
    return cloneSettings(this.value);
  }

  async save(settings: AppSettings) {
    this.value = cloneSettings(settings);
  }

  async reset() {
    this.value = cloneSettings(DEFAULT_APP_SETTINGS);
  }
}

describe('Stage 21 end-to-end manager integration', () => {
  test('TC_E2E_01 first-launch setup through persist/reload workflow', async () => {
    const settingsRepo = new MemorySettingsRepository({
      ...cloneSettings(DEFAULT_APP_SETTINGS),
      onboardingCompleted: false,
    });
    const sessions = new SessionManager(new TimerService());
    const goals = new GoalManager(new Date('2026-07-18T09:00:00'));
    const settings = new SettingsManager(settingsRepo, sessions, goals);
    const tasks = new TaskManager(new InMemoryTaskRepository());
    await tasks.initialize({seedIfEmpty: false});
    const day = new Date(2026, 6, 18, 12, 0, 0);

    // First-launch: save productivity setup + mark onboarding complete.
    const initial = cloneSettings(DEFAULT_APP_SETTINGS);
    initial.timer.workMinutes = 1;
    initial.timer.shortBreakMinutes = 1;
    initial.timer.longBreakMinutes = 1;
    initial.timer.longBreakInterval = 4;
    initial.goals.daily = {tasks: 2, focusSessions: 4, focusMinutes: 4};
    initial.appearance.theme = 'dark';
    initial.general.notificationsEnabled = false;
    initial.onboardingCompleted = true;
    await settings.save(initial);
    expect(settings.getCurrent().onboardingCompleted).toBe(true);
    expect(goals.getTargets('daily').tasks).toBe(2);
    expect(sessions.getConfiguration().workMinutes).toBe(1);

    // Create / edit / delete / complete tasks.
    const created = await tasks.createTask({
      title: 'Integration task',
      description: 'E2E',
      priority: 'High',
      dueDate: '',
      estimatedDurationMinutes: '30',
      labels: 'stage21',
      parentTaskId: '',
    });
    expect(created.success).toBe(true);
    if (!created.success) {
      return;
    }
    const taskId = created.tasks[0].id;

    const edited = await tasks.updateTask(taskId, {
      title: 'Integration task edited',
      description: 'E2E',
      priority: 'High',
      dueDate: '',
      estimatedDurationMinutes: '30',
      labels: 'stage21',
      parentTaskId: '',
    });
    expect(edited.success).toBe(true);

    const extra = await tasks.createTask({
      title: 'Disposable',
      description: '',
      priority: 'Low',
      dueDate: '',
      estimatedDurationMinutes: '',
      labels: '',
      parentTaskId: '',
    });
    expect(extra.success).toBe(true);
    if (extra.success) {
      const disposable = extra.tasks.find(t => t.title === 'Disposable');
      expect(disposable).toBeTruthy();
      await tasks.moveToTrash(disposable!.id);
    }

    await tasks.completeTask(taskId, day); // Pending → In Progress
    await tasks.completeTask(taskId, day); // In Progress → Completed
    const afterComplete = await tasks.loadWorkspace();
    expect(afterComplete.tasks.find(t => t.id === taskId)?.status).toBe(
      'Completed',
    );
    expect(tasks.getCompletionHistory()).toHaveLength(1);

    // Start / pause / resume / reset / skip focus session.
    let now = day.getTime();
    sessions.start(now);
    expect(sessions.getSnapshot(now).runState).toBe('running');
    now += 5_000;
    sessions.pause(now);
    expect(sessions.getSnapshot(now).runState).toBe('paused');
    now += 1_000;
    sessions.resume(now);
    expect(sessions.getSnapshot(now).runState).toBe('running');
    now += 1_000;
    sessions.reset(now);
    expect(sessions.getSnapshot(now).runState).toBe('idle');
    sessions.start(now);
    now += 10_000;
    sessions.skip(now);
    expect(sessions.getCompletedWorkSessions()).toBe(0);
    expect(sessions.getSnapshot(now).mode).toBe('shortBreak');

    // Fresh session manager for a clean long-break cycle (reset keeps mode).
    const longBreakSessions = new SessionManager(new TimerService());
    longBreakSessions.configure(sessions.getConfiguration(), now);
    for (let i = 0; i < 4; i += 1) {
      longBreakSessions.start(now);
      now += 60_000;
      longBreakSessions.tick(now);
      if (i < 3) {
        expect(longBreakSessions.getSnapshot(now).mode).toBe('shortBreak');
        longBreakSessions.skip(now);
        now += 1_000;
      }
    }
    expect(longBreakSessions.getSnapshot(now).mode).toBe('longBreak');
    expect(longBreakSessions.getCompletedWorkSessions()).toBe(4);

    // Goals update from completed task + completed work minutes.
    const focusMinutes = Math.round(
      longBreakSessions
        .getCompletionHistory()
        .filter(event => event.mode === 'work')
        .reduce((total, event) => total + event.durationMs, 0) / 60_000,
    );
    const goalProgress = goals.synchronizeProgress(
      {
        tasks: afterComplete.tasks.filter(t => t.status === 'Completed').length,
        focusSessions: longBreakSessions.getCompletedWorkSessions(),
        focusMinutes,
      },
      day,
    );
    expect(goalProgress.daily.progress.tasks).toBeGreaterThanOrEqual(1);
    expect(goalProgress.daily.progress.focusSessions).toBe(4);

    // Statistics update from runtime histories.
    const summary = new StatisticsEngine().summarizeDay(
      day,
      {
        taskCompletions: tasks.getCompletionHistory(),
        sessionCompletions: longBreakSessions.getCompletionHistory(),
      },
      goals.getTargets('daily'),
    );
    expect(summary.completedFocusSessions).toBe(4);
    expect(summary.completedTasks).toBe(1);
    expect(summary.hasActivity).toBe(true);

    // Change settings and verify persistence across reload.
    const next = settings.getCurrent();
    next.timer.workMinutes = 45;
    next.appearance.theme = 'light';
    await settings.save(next);
    const reloaded = new SettingsManager(
      settingsRepo,
      new SessionManager(new TimerService()),
      new GoalManager(new Date('2026-07-18T10:00:00')),
    );
    const afterRestart = await reloaded.load();
    expect(afterRestart.onboardingCompleted).toBe(true);
    expect(afterRestart.timer.workMinutes).toBe(45);
    expect(afterRestart.appearance.theme).toBe('light');
    expect(afterRestart.general.notificationsEnabled).toBe(false);
    expect(afterRestart.goals.daily.tasks).toBe(2);
  });
});
