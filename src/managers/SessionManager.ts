import {TimerService, type TimerMode, type TimerRunState} from '../services/TimerService';

export const POMODORO_DURATIONS_MS = {
  work: 25 * 60 * 1000,
  shortBreak: 5 * 60 * 1000,
  longBreak: 15 * 60 * 1000,
} as const;

export const WORK_SESSIONS_BEFORE_LONG_BREAK = 4;

export type SessionConfiguration = {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartWorkSessions: boolean;
};

export const DEFAULT_SESSION_CONFIGURATION: SessionConfiguration = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: WORK_SESSIONS_BEFORE_LONG_BREAK,
  autoStartBreaks: false,
  autoStartWorkSessions: false,
};

export type SessionModeLabel = 'Work Session' | 'Short Break' | 'Long Break';

export type CompletedSessionEvent = {
  mode: TimerMode;
  completedAt: string;
  durationMs: number;
};

export type SessionSnapshot = {
  mode: TimerMode;
  modeLabel: SessionModeLabel;
  runState: TimerRunState;
  remainingMs: number;
  durationMs: number;
  progress: number;
  completedWorkSessions: number;
  completedBreaks: number;
  skippedSessions: number;
  interruptedSessions: number;
  workSessionsTowardLongBreak: number;
  selectedTaskId: string | null;
  selectedTaskTitle: string | null;
  canStart: boolean;
  canPause: boolean;
  canResume: boolean;
  canSkip: boolean;
  canReset: boolean;
};

function modeLabel(mode: TimerMode): SessionModeLabel {
  if (mode === 'work') {
    return 'Work Session';
  }
  if (mode === 'shortBreak') {
    return 'Short Break';
  }
  return 'Long Break';
}

/**
 * Pomodoro session orchestration on top of TimerService.
 * Does not persist sessions or write statistics.
 *
 * Counter rules:
 * - completedWorkSessions increments only when a work segment finishes normally
 *   (timer reaches zero while that work segment was started).
 * - Skipped work is NOT completed: it does not increment completedWorkSessions
 *   or workSessionsTowardLongBreak (skip advances mode only).
 * - Pause / reset never increment completion counters.
 * - completedBreaks increments once when a short or long break finishes normally.
 *
 * Cycle:
 * Work1 → ShortBreak → Work2 → ShortBreak → Work3 → ShortBreak → Work4 → LongBreak
 * → (on long break finish) Work of next cycle with workSessionsTowardLongBreak = 0.
 */
export class SessionManager {
  private readonly timer: TimerService;
  private completedWorkSessions = 0;
  private completedBreaks = 0;
  private skippedSessions = 0;
  private interruptedSessions = 0;
  private workSessionsTowardLongBreak = 0;
  private selectedTaskId: string | null = null;
  private selectedTaskTitle: string | null = null;
  private hadProgressInSegment = false;
  private completionHistory: CompletedSessionEvent[] = [];
  /** Prevents duplicate completion handling when multiple ticks land at zero. */
  private isCompletingSegment = false;
  private configuration: SessionConfiguration = {
    ...DEFAULT_SESSION_CONFIGURATION,
  };

  constructor(timer: TimerService = new TimerService()) {
    this.timer = timer;
    this.timer.configure('work', POMODORO_DURATIONS_MS.work);
  }

  getConfiguration(): SessionConfiguration {
    return {...this.configuration};
  }

  configure(configuration: SessionConfiguration, now: number = Date.now()): void {
    this.configuration = {...configuration};
    if (this.timer.getRunState() === 'idle') {
      this.timer.configure(
        this.timer.getCurrentMode(),
        this.durationFor(this.timer.getCurrentMode()),
        now,
      );
      this.hadProgressInSegment = false;
    }
  }

  selectTask(taskId: string | null, taskTitle: string | null = null): void {
    this.selectedTaskId = taskId;
    this.selectedTaskTitle = taskTitle;
  }

  start(now: number = Date.now()): void {
    if (this.timer.getRemainingTime(now) <= 0) {
      this.timer.configure(
        this.timer.getCurrentMode(),
        this.durationFor(this.timer.getCurrentMode()),
        now,
      );
    }
    this.timer.start(now);
    this.hadProgressInSegment = true;
  }

  pause(now: number = Date.now()): void {
    if (!this.timer.isRunning()) {
      return;
    }
    this.timer.pause(now);
  }

  resume(now: number = Date.now()): void {
    if (!this.timer.isPaused()) {
      return;
    }
    this.timer.resume(now);
  }

  reset(now: number = Date.now()): void {
    if (this.shouldCountInterrupt(now)) {
      this.interruptedSessions += 1;
    }
    this.timer.configure(
      this.timer.getCurrentMode(),
      this.durationFor(this.timer.getCurrentMode()),
      now,
    );
    this.hadProgressInSegment = false;
  }

  skip(now: number = Date.now()): void {
    if (this.shouldCountInterrupt(now)) {
      this.interruptedSessions += 1;
    }
    this.skippedSessions += 1;
    const skippedMode = this.timer.getCurrentMode();
    this.timer.skip(now);
    this.advanceModeAfterSkip(skippedMode);
    this.hadProgressInSegment = false;
  }

  /**
   * Advances the clock-derived timer. Auto-completes and transitions modes.
   */
  tick(now: number = Date.now()): SessionSnapshot {
    const wasRunning = this.timer.isRunning();
    this.timer.tick(now);
    if (
      wasRunning &&
      !this.isCompletingSegment &&
      this.hadProgressInSegment &&
      this.timer.getRemainingTime(now) === 0
    ) {
      this.completeCurrentSegment(now);
    }
    return this.getSnapshot(now);
  }

  getSnapshot(now: number = Date.now()): SessionSnapshot {
    const snap = this.timer.getSnapshot(now);
    const progress =
      snap.durationMs <= 0
        ? 0
        : Math.min(1, Math.max(0, 1 - snap.remainingMs / snap.durationMs));

    const runState = snap.runState;
    return {
      mode: snap.mode,
      modeLabel: modeLabel(snap.mode),
      runState,
      remainingMs: snap.remainingMs,
      durationMs: snap.durationMs,
      progress,
      completedWorkSessions: this.completedWorkSessions,
      completedBreaks: this.completedBreaks,
      skippedSessions: this.skippedSessions,
      interruptedSessions: this.interruptedSessions,
      workSessionsTowardLongBreak: this.workSessionsTowardLongBreak,
      selectedTaskId: this.selectedTaskId,
      selectedTaskTitle: this.selectedTaskTitle,
      canStart: runState === 'idle' && snap.remainingMs > 0,
      canPause: runState === 'running',
      canResume: runState === 'paused',
      canSkip: true,
      canReset: runState !== 'idle' || snap.remainingMs < snap.durationMs,
    };
  }

  getCompletedWorkSessions(): number {
    return this.completedWorkSessions;
  }

  getCompletedBreaks(): number {
    return this.completedBreaks;
  }

  getCompletionHistory(): CompletedSessionEvent[] {
    return this.completionHistory.map(event => ({...event}));
  }

  resetCompletionHistoryForTests(): void {
    this.completionHistory = [];
  }

  getSkippedSessions(): number {
    return this.skippedSessions;
  }

  getInterruptedSessions(): number {
    return this.interruptedSessions;
  }

  getWorkSessionsTowardLongBreak(): number {
    return this.workSessionsTowardLongBreak;
  }

  getSelectedTaskId(): string | null {
    return this.selectedTaskId;
  }

  getSelectedTaskTitle(): string | null {
    return this.selectedTaskTitle;
  }

  getCurrentMode(): TimerMode {
    return this.timer.getCurrentMode();
  }

  getDefaultDurationsMs(): typeof POMODORO_DURATIONS_MS {
    return {...POMODORO_DURATIONS_MS};
  }

  private durationFor(mode: TimerMode): number {
    const minutes =
      mode === 'work'
        ? this.configuration.workMinutes
        : mode === 'shortBreak'
          ? this.configuration.shortBreakMinutes
          : this.configuration.longBreakMinutes;
    return minutes * 60_000;
  }

  private shouldCountInterrupt(now: number): boolean {
    const remaining = this.timer.getRemainingTime(now);
    const duration = this.timer.getDurationMs();
    return (
      this.hadProgressInSegment &&
      remaining > 0 &&
      remaining < duration &&
      (this.timer.isRunning() || this.timer.isPaused())
    );
  }

  private completeCurrentSegment(completedAtMs: number): void {
    if (this.isCompletingSegment || !this.hadProgressInSegment) {
      return;
    }
    this.isCompletingSegment = true;
    this.hadProgressInSegment = false;

    try {
      const mode = this.timer.getCurrentMode();
      const durationMs = this.timer.getDurationMs();
      if (mode === 'work') {
        this.completedWorkSessions += 1;
        this.workSessionsTowardLongBreak += 1;
      } else {
        // Short or long break — each natural finish counts once.
        this.completedBreaks += 1;
      }
      this.completionHistory.push({
        mode,
        completedAt: new Date(completedAtMs).toISOString(),
        durationMs,
      });
      this.advanceModeAfterCompletion(mode, completedAtMs);
    } finally {
      this.isCompletingSegment = false;
    }
  }

  private advanceModeAfterCompletion(
    completedMode: TimerMode,
    now: number,
  ): void {
    let next: TimerMode = 'work';

    if (completedMode === 'work') {
      if (
        this.workSessionsTowardLongBreak >=
        this.configuration.longBreakInterval
      ) {
        next = 'longBreak';
        // Keep workSessionsTowardLongBreak at 4 until the long break ends
        // so the UI can show 4/4 during the long break.
      } else {
        next = 'shortBreak';
      }
    } else if (completedMode === 'longBreak') {
      next = 'work';
      this.workSessionsTowardLongBreak = 0;
    } else {
      // shortBreak → next work session in the same cycle
      next = 'work';
    }

    this.timer.configure(next, this.durationFor(next), now);
    const shouldAutoStart =
      (next === 'work' && this.configuration.autoStartWorkSessions) ||
      (next !== 'work' && this.configuration.autoStartBreaks);
    if (shouldAutoStart) {
      this.timer.start(now);
      this.hadProgressInSegment = true;
    }
  }

  private advanceModeAfterSkip(skippedMode: TimerMode): void {
    let next: TimerMode = 'work';

    if (skippedMode === 'work') {
      // Skipped work is not completed — always take a short break next.
      // Does not increment completions or the long-break cycle counters.
      next = 'shortBreak';
    } else if (skippedMode === 'longBreak') {
      // Leaving a long break (even via skip) starts a new work cycle.
      next = 'work';
      this.workSessionsTowardLongBreak = 0;
    } else {
      next = 'work';
    }

    this.timer.configure(next, this.durationFor(next));
  }
}

/** Shared Focus Session manager for the presentation layer. */
export const sessionManager = new SessionManager();
