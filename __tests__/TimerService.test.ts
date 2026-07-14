import {TimerService} from '../src/services/TimerService';

describe('TimerService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('TC_TIMER_01 Timer starts correctly', () => {
    const timer = new TimerService();
    const t0 = Date.now();
    timer.configure('work', 25 * 60 * 1000, t0);

    timer.start(t0);

    expect(timer.isRunning()).toBe(true);
    expect(timer.getCurrentMode()).toBe('work');
    expect(timer.getRemainingTime(t0)).toBe(25 * 60 * 1000);
  });

  test('TC_TIMER_02 Pause freezes remaining time', () => {
    const timer = new TimerService();
    const t0 = Date.now();
    timer.configure('work', 10_000, t0);
    timer.start(t0);

    const t1 = t0 + 3000;
    timer.pause(t1);
    const pausedRemaining = timer.getRemainingTime(t1);

    expect(timer.isPaused()).toBe(true);
    expect(pausedRemaining).toBe(7000);

    const t2 = t1 + 5000;
    expect(timer.getRemainingTime(t2)).toBe(7000);
  });

  test('TC_TIMER_03 Resume continues countdown', () => {
    const timer = new TimerService();
    const t0 = Date.now();
    timer.configure('work', 10_000, t0);
    timer.start(t0);
    timer.pause(t0 + 2000);
    expect(timer.getRemainingTime(t0 + 2000)).toBe(8000);

    timer.resume(t0 + 5000);
    expect(timer.isRunning()).toBe(true);
    expect(timer.getRemainingTime(t0 + 5000)).toBe(8000);
    expect(timer.getRemainingTime(t0 + 8000)).toBe(5000);
  });

  test('TC_TIMER_04 Reset restores initial duration', () => {
    const timer = new TimerService();
    const t0 = Date.now();
    timer.configure('shortBreak', 5_000, t0);
    timer.start(t0);
    timer.tick(t0 + 2000);
    timer.reset(t0 + 2000);

    expect(timer.isRunning()).toBe(false);
    expect(timer.isPaused()).toBe(false);
    expect(timer.getRemainingTime(t0 + 2000)).toBe(5000);
    expect(timer.getDurationMs()).toBe(5000);
  });

  test('TC_TIMER_05 Skip advances by clearing the current segment', () => {
    const timer = new TimerService();
    const t0 = Date.now();
    timer.configure('work', 10_000, t0);
    timer.start(t0);
    timer.skip(t0 + 1000);

    expect(timer.isRunning()).toBe(false);
    expect(timer.getRemainingTime(t0 + 1000)).toBe(0);
  });

  test('TC_TIMER_08 Timer remains accurate using timestamps', () => {
    const timer = new TimerService();
    const t0 = Date.now();
    timer.configure('work', 60_000, t0);
    timer.start(t0);

    // Simulate a delayed tick (window freeze) of 7.5s instead of 1s ticks.
    const remaining = timer.tick(t0 + 7500);

    expect(remaining).toBe(52_500);
    expect(timer.getRemainingTime(t0 + 7500)).toBe(52_500);
  });
});
