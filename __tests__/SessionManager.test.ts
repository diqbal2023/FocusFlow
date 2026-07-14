import {
  POMODORO_DURATIONS_MS,
  SessionManager,
  WORK_SESSIONS_BEFORE_LONG_BREAK,
} from '../src/managers/SessionManager';
import {TimerService} from '../src/services/TimerService';

describe('SessionManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createManager(): SessionManager {
    return new SessionManager(new TimerService());
  }

  function completeCurrent(manager: SessionManager, now: number): number {
    const duration = manager.getSnapshot(now).durationMs;
    manager.start(now);
    const end = now + duration;
    manager.tick(end);
    return end;
  }

  function completeWorkSession(manager: SessionManager, now: number): number {
    expect(manager.getCurrentMode()).toBe('work');
    return completeCurrent(manager, now);
  }

  test('TC_TIMER_06 Work session transitions to short break', () => {
    const manager = createManager();
    const t0 = Date.now();

    expect(manager.getCurrentMode()).toBe('work');
    completeWorkSession(manager, t0);

    expect(manager.getCurrentMode()).toBe('shortBreak');
    expect(manager.getSnapshot().durationMs).toBe(POMODORO_DURATIONS_MS.shortBreak);
    expect(manager.getCompletedWorkSessions()).toBe(1);
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(1);
  });

  test('TC_TIMER_07 Fourth completed work session transitions to long break', () => {
    const manager = createManager();
    let now = Date.now();

    for (let i = 0; i < WORK_SESSIONS_BEFORE_LONG_BREAK; i += 1) {
      now = completeWorkSession(manager, now);
      if (i < WORK_SESSIONS_BEFORE_LONG_BREAK - 1) {
        expect(manager.getCurrentMode()).toBe('shortBreak');
        // Skip break so the next work session can start immediately.
        manager.skip(now);
        now += 1;
      }
    }

    expect(manager.getCompletedWorkSessions()).toBe(4);
    expect(manager.getCurrentMode()).toBe('longBreak');
    expect(manager.getSnapshot().modeLabel).toBe('Long Break');
    expect(manager.getSnapshot().durationMs).toBe(POMODORO_DURATIONS_MS.longBreak);
    // Cycle stays at 4 until the long break finishes.
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(4);
  });

  test('TC_SESSION_01 SessionManager tracks completed work sessions', () => {
    const manager = createManager();
    const t0 = Date.now();

    completeWorkSession(manager, t0);
    expect(manager.getCompletedWorkSessions()).toBe(1);

    manager.skip(t0 + POMODORO_DURATIONS_MS.work);
    completeWorkSession(manager, t0 + POMODORO_DURATIONS_MS.work + 1);

    expect(manager.getCompletedWorkSessions()).toBe(2);
  });

  test('TC_SESSION_02 Selected task remains associated with session', () => {
    const manager = createManager();
    manager.selectTask('task-1', 'Ship Focus Session');
    manager.start(Date.now());

    expect(manager.getSelectedTaskId()).toBe('task-1');
    expect(manager.getSelectedTaskTitle()).toBe('Ship Focus Session');
    expect(manager.getSnapshot().selectedTaskTitle).toBe('Ship Focus Session');

    manager.pause(Date.now() + 1000);
    manager.skip(Date.now() + 1000);

    expect(manager.getSelectedTaskId()).toBe('task-1');
    expect(manager.getSelectedTaskTitle()).toBe('Ship Focus Session');
  });

  test('TC_SESSION_03 Interrupted sessions are recorded correctly', () => {
    const manager = createManager();
    const t0 = Date.now();
    manager.start(t0);
    manager.tick(t0 + 60_000);
    manager.pause(t0 + 60_000);
    manager.reset(t0 + 60_000);

    expect(manager.getInterruptedSessions()).toBe(1);

    manager.start(t0 + 61_000);
    manager.tick(t0 + 120_000);
    manager.skip(t0 + 120_000);

    expect(manager.getInterruptedSessions()).toBe(2);
    expect(manager.getSkippedSessions()).toBe(1);
  });

  test('TC_SESSION_04 Default Pomodoro durations are loaded correctly', () => {
    const manager = createManager();
    const durations = manager.getDefaultDurationsMs();

    expect(durations.work).toBe(25 * 60 * 1000);
    expect(durations.shortBreak).toBe(5 * 60 * 1000);
    expect(durations.longBreak).toBe(15 * 60 * 1000);
    expect(manager.getSnapshot().durationMs).toBe(durations.work);
    expect(manager.getCurrentMode()).toBe('work');
  });

  test('TC_SESSION_05 Skipped work does not increment completed work count', () => {
    const manager = createManager();
    const t0 = Date.now();
    manager.start(t0);
    manager.tick(t0 + 30_000);
    manager.skip(t0 + 30_000);

    expect(manager.getCompletedWorkSessions()).toBe(0);
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(0);
    expect(manager.getSkippedSessions()).toBe(1);
    expect(manager.getCurrentMode()).toBe('shortBreak');
  });

  test('TC_SESSION_06 Pause and reset do not increment completed work count', () => {
    const manager = createManager();
    const t0 = Date.now();
    manager.start(t0);
    manager.tick(t0 + 45_000);
    manager.pause(t0 + 45_000);
    expect(manager.getCompletedWorkSessions()).toBe(0);

    manager.reset(t0 + 45_000);
    expect(manager.getCompletedWorkSessions()).toBe(0);
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(0);
    expect(manager.getCurrentMode()).toBe('work');
    expect(manager.getSnapshot().remainingMs).toBe(POMODORO_DURATIONS_MS.work);
  });

  test('TC_SESSION_07 Long break completion resets cycle and returns to work', () => {
    const manager = createManager();
    let now = Date.now();

    for (let i = 0; i < WORK_SESSIONS_BEFORE_LONG_BREAK; i += 1) {
      now = completeWorkSession(manager, now);
      if (i < WORK_SESSIONS_BEFORE_LONG_BREAK - 1) {
        manager.skip(now);
        now += 1;
      }
    }

    expect(manager.getCurrentMode()).toBe('longBreak');
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(4);
    const breaksBefore = manager.getCompletedBreaks();

    now = completeCurrent(manager, now);

    expect(manager.getCompletedBreaks()).toBe(breaksBefore + 1);
    expect(manager.getCurrentMode()).toBe('work');
    expect(manager.getSnapshot().durationMs).toBe(POMODORO_DURATIONS_MS.work);
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(0);
    // Lifetime completed work stays at 4; next work start is cycle work 1.
    expect(manager.getCompletedWorkSessions()).toBe(4);
  });

  test('TC_SESSION_08 Duplicate ticks at zero complete a segment only once', () => {
    const manager = createManager();
    const t0 = Date.now();
    manager.start(t0);
    const end = t0 + POMODORO_DURATIONS_MS.work;

    manager.tick(end);
    manager.tick(end);
    manager.tick(end + 50);

    expect(manager.getCompletedWorkSessions()).toBe(1);
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(1);
    expect(manager.getCurrentMode()).toBe('shortBreak');
  });

  test('TC_SESSION_09 Long break supports pause, resume, reset, and skip', () => {
    const manager = createManager();
    let now = Date.now();

    for (let i = 0; i < WORK_SESSIONS_BEFORE_LONG_BREAK; i += 1) {
      now = completeWorkSession(manager, now);
      if (i < WORK_SESSIONS_BEFORE_LONG_BREAK - 1) {
        manager.skip(now);
        now += 1;
      }
    }

    expect(manager.getCurrentMode()).toBe('longBreak');

    manager.start(now);
    now += 60_000;
    manager.tick(now);
    manager.pause(now);
    expect(manager.getSnapshot(now).canResume).toBe(true);
    expect(manager.getSnapshot(now).remainingMs).toBe(
      POMODORO_DURATIONS_MS.longBreak - 60_000,
    );

    manager.resume(now);
    expect(manager.getSnapshot(now).canPause).toBe(true);

    manager.reset(now);
    expect(manager.getCurrentMode()).toBe('longBreak');
    expect(manager.getSnapshot(now).remainingMs).toBe(
      POMODORO_DURATIONS_MS.longBreak,
    );
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(4);

    manager.start(now);
    now += 30_000;
    manager.tick(now);
    manager.skip(now);

    expect(manager.getCurrentMode()).toBe('work');
    expect(manager.getWorkSessionsTowardLongBreak()).toBe(0);
    expect(manager.getSnapshot(now).durationMs).toBe(POMODORO_DURATIONS_MS.work);
  });
});
