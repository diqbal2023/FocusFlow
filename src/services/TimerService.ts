export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export type TimerRunState = 'idle' | 'running' | 'paused';

export type TimerSnapshot = {
  mode: TimerMode;
  runState: TimerRunState;
  /** Remaining milliseconds; never negative. */
  remainingMs: number;
  /** Configured duration for the current mode segment. */
  durationMs: number;
};

/**
 * Timestamp-based countdown. Remaining time is derived from wall clock
 * while running so small JS delays do not drift the clock.
 */
export class TimerService {
  private mode: TimerMode = 'work';
  private durationMs = 0;
  private remainingMs = 0;
  private endAtMs: number | null = null;
  private runState: TimerRunState = 'idle';

  configure(mode: TimerMode, durationMs: number, now: number = Date.now()): void {
    this.mode = mode;
    this.durationMs = Math.max(0, durationMs);
    this.remainingMs = this.durationMs;
    this.endAtMs = null;
    this.runState = 'idle';
    void now;
  }

  start(now: number = Date.now()): void {
    if (this.durationMs <= 0) {
      return;
    }
    if (this.runState === 'running') {
      return;
    }
    if (this.runState === 'idle') {
      this.remainingMs = this.durationMs;
    }
    this.endAtMs = now + this.remainingMs;
    this.runState = 'running';
  }

  pause(now: number = Date.now()): void {
    if (this.runState !== 'running' || this.endAtMs === null) {
      return;
    }
    this.remainingMs = Math.max(0, this.endAtMs - now);
    this.endAtMs = null;
    this.runState = 'paused';
  }

  resume(now: number = Date.now()): void {
    if (this.runState !== 'paused') {
      return;
    }
    this.endAtMs = now + this.remainingMs;
    this.runState = 'running';
  }

  reset(now: number = Date.now()): void {
    this.remainingMs = this.durationMs;
    this.endAtMs = null;
    this.runState = 'idle';
    void now;
  }

  /**
   * Stops the current segment without completing it.
   * Remaining time is cleared to 0 so callers can advance mode.
   */
  skip(now: number = Date.now()): void {
    this.remainingMs = 0;
    this.endAtMs = null;
    this.runState = 'idle';
    void now;
  }

  /**
   * Refresh remaining time from the clock. Returns remaining ms.
   */
  tick(now: number = Date.now()): number {
    if (this.runState === 'running' && this.endAtMs !== null) {
      this.remainingMs = Math.max(0, this.endAtMs - now);
      if (this.remainingMs === 0) {
        this.endAtMs = null;
        this.runState = 'idle';
      }
    }
    return this.remainingMs;
  }

  getRemainingTime(now: number = Date.now()): number {
    return this.tick(now);
  }

  isRunning(): boolean {
    return this.runState === 'running';
  }

  isPaused(): boolean {
    return this.runState === 'paused';
  }

  getCurrentMode(): TimerMode {
    return this.mode;
  }

  getRunState(): TimerRunState {
    return this.runState;
  }

  getDurationMs(): number {
    return this.durationMs;
  }

  isComplete(now: number = Date.now()): boolean {
    return this.getRemainingTime(now) === 0 && this.durationMs > 0;
  }

  getSnapshot(now: number = Date.now()): TimerSnapshot {
    const remainingMs = this.getRemainingTime(now);
    return {
      mode: this.mode,
      runState: this.runState,
      remainingMs,
      durationMs: this.durationMs,
    };
  }
}
