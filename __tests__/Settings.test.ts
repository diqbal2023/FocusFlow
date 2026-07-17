import {
  DEFAULT_APP_SETTINGS,
  cloneSettings,
  validateSettings,
} from '../src/models/AppSettings';
import {GoalManager} from '../src/managers/GoalManager';
import {
  SettingsManager,
  SettingsValidationError,
} from '../src/managers/SettingsManager';
import {SessionManager} from '../src/managers/SessionManager';
import {
  SettingsRepository,
  type ISettingsRepository,
} from '../src/repositories/SettingsRepository';
import {TimerService} from '../src/services/TimerService';
import {FakeDatabaseService} from '../src/testing/FakeDatabaseService';

class MemorySettingsRepository implements ISettingsRepository {
  value = cloneSettings(DEFAULT_APP_SETTINGS);
  saves = 0;
  resets = 0;
  failSave = false;

  async load() {
    return cloneSettings(this.value);
  }
  async save(settings: typeof DEFAULT_APP_SETTINGS) {
    if (this.failSave) {
      throw new Error('write failed');
    }
    this.saves += 1;
    this.value = cloneSettings(settings);
  }
  async reset() {
    this.resets += 1;
    this.value = cloneSettings(DEFAULT_APP_SETTINGS);
  }
}

function createManager(repository = new MemorySettingsRepository()) {
  const sessions = new SessionManager(new TimerService());
  const goals = new GoalManager(new Date('2026-07-17T12:00:00'));
  return {repository, sessions, goals, manager: new SettingsManager(repository, sessions, goals)};
}

describe('Settings stages 18–19', () => {
  test('TC_SETTINGS_01 exposes defaults matching existing behavior', () => {
    const {manager} = createManager();
    expect(manager.getCurrent()).toEqual(DEFAULT_APP_SETTINGS);
  });

  test('TC_SETTINGS_02 validates missing, decimal, negative, non-finite, and range values', () => {
    const invalid = cloneSettings(DEFAULT_APP_SETTINGS);
    invalid.timer.workMinutes = Number.NaN;
    invalid.timer.shortBreakMinutes = 1.5;
    invalid.timer.longBreakMinutes = -1;
    invalid.timer.longBreakInterval = 11;
    invalid.goals.daily.tasks = Number.POSITIVE_INFINITY;
    (
      invalid.general as unknown as Record<string, unknown>
    ).soundEnabled = 'yes';
    const errors = validateSettings(invalid);
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining([
        'timer.workMinutes',
        'timer.shortBreakMinutes',
        'timer.longBreakMinutes',
        'timer.longBreakInterval',
        'goals.daily.tasks',
        'general.soundEnabled',
      ]),
    );
  });

  test('TC_SETTINGS_03 valid save persists before applying and notifies', async () => {
    const {manager, repository, sessions, goals} = createManager();
    const listener = jest.fn();
    manager.subscribe(listener);
    const next = cloneSettings(DEFAULT_APP_SETTINGS);
    next.timer.workMinutes = 40;
    next.goals.daily.tasks = 0;
    next.appearance.theme = 'dark';
    await manager.save(next);
    expect(repository.saves).toBe(1);
    expect(sessions.getConfiguration().workMinutes).toBe(40);
    expect(goals.getTargets('daily').tasks).toBe(0);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({appearance: {theme: 'dark'}}));
  });

  test('TC_SETTINGS_04 failed persistence does not publish or apply', async () => {
    const setup = createManager();
    setup.repository.failSave = true;
    const next = cloneSettings(DEFAULT_APP_SETTINGS);
    next.timer.workMinutes = 50;
    await expect(setup.manager.save(next)).rejects.toThrow('write failed');
    expect(setup.sessions.getConfiguration().workMinutes).toBe(25);
    expect(setup.manager.getCurrent().timer.workMinutes).toBe(25);
  });

  test('TC_SETTINGS_05 rejects invalid saves with field errors', async () => {
    const {manager, repository} = createManager();
    const next = cloneSettings(DEFAULT_APP_SETTINGS);
    next.timer.workMinutes = 0;
    await expect(manager.save(next)).rejects.toBeInstanceOf(SettingsValidationError);
    expect(repository.saves).toBe(0);
  });

  test('TC_SETTINGS_06 reset restores preferences without touching manager progress', async () => {
    const {manager, goals, repository} = createManager();
    goals.synchronizeProgress(
      {tasks: 2, focusSessions: 1, focusMinutes: 25},
      new Date('2026-07-17T12:00:00'),
    );
    const before = goals.getProgress(new Date('2026-07-17T12:00:00')).daily.progress;
    await manager.reset();
    expect(repository.resets).toBe(1);
    expect(manager.getCurrent()).toEqual(DEFAULT_APP_SETTINGS);
    expect(goals.getProgress(new Date('2026-07-17T12:00:00')).daily.progress).toEqual(before);
  });

  test('TC_SETTINGS_07 running and paused segments retain duration; idle uses new duration', () => {
    const {sessions} = createManager();
    const now = Date.now();
    sessions.start(now);
    sessions.configure({...sessions.getConfiguration(), workMinutes: 40}, now + 1000);
    expect(sessions.getSnapshot(now + 1000).durationMs).toBe(25 * 60_000);
    sessions.pause(now + 1000);
    sessions.configure({...sessions.getConfiguration(), workMinutes: 45}, now + 2000);
    expect(sessions.getSnapshot(now + 2000).durationMs).toBe(25 * 60_000);
    sessions.reset(now + 2000);
    expect(sessions.getSnapshot(now + 2000).durationMs).toBe(45 * 60_000);
  });

  test('TC_SETTINGS_08 configured transition uses actual duration and auto-start', () => {
    const {sessions} = createManager();
    sessions.configure({
      workMinutes: 1,
      shortBreakMinutes: 2,
      longBreakMinutes: 3,
      longBreakInterval: 2,
      autoStartBreaks: true,
      autoStartWorkSessions: false,
    });
    const now = Date.now();
    sessions.start(now);
    sessions.tick(now + 60_000);
    expect(sessions.getCompletionHistory()[0].durationMs).toBe(60_000);
    expect(sessions.getSnapshot(now + 60_000)).toMatchObject({
      mode: 'shortBreak',
      durationMs: 120_000,
      runState: 'running',
    });
  });

  test('TC_SETTINGS_09 zero goals are immediately fulfilled and division-safe', () => {
    const {goals} = createManager();
    goals.setTargets('daily', {tasks: 0, focusSessions: 0, focusMinutes: 0});
    const daily = goals.synchronizeProgress(
      {tasks: 0, focusSessions: 0, focusMinutes: 0},
      new Date('2026-07-17T12:00:00'),
    ).daily;
    expect(daily.isComplete).toBe(true);
    expect(daily.metrics.every(metric => metric.percentage === 100)).toBe(true);
  });

  test('TC_SETTINGS_REPO_01 merges partial persisted JSON and upserts/reset singleton', async () => {
    const db = new FakeDatabaseService();
    const repository = new SettingsRepository(db);
    db.settingsPayload = JSON.stringify({
      timer: {workMinutes: 50, futureTimerOption: true},
      futureSection: {enabled: true},
    });
    const loaded = await repository.load();
    expect(loaded.timer).toEqual(
      expect.objectContaining({workMinutes: 50, shortBreakMinutes: 5}),
    );
    expect(loaded).not.toHaveProperty('futureSection');
    expect(loaded.timer).not.toHaveProperty('futureTimerOption');
    await repository.save({...DEFAULT_APP_SETTINGS, appearance: {theme: 'dark'}});
    expect(JSON.parse(db.settingsPayload ?? '{}').appearance.theme).toBe('dark');
    await repository.reset();
    expect(db.settingsPayload).toBeNull();
  });

  test('TC_SETTINGS_REPO_02 rejects corrupt JSON explicitly', async () => {
    const db = new FakeDatabaseService();
    db.settingsPayload = '{bad';
    await expect(new SettingsRepository(db).load()).rejects.toThrow(
      'Settings data is corrupt',
    );
  });
});
