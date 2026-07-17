import {
  DEFAULT_DAILY_GOAL_TARGETS,
  DEFAULT_WEEKLY_GOAL_TARGETS,
  type GoalTargets,
} from './Goal';

export type ThemePreference = 'system' | 'light' | 'dark';

export type AppSettings = {
  timer: {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartWorkSessions: boolean;
  };
  goals: {
    daily: GoalTargets;
    weekly: GoalTargets;
  };
  appearance: {theme: ThemePreference};
  general: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    confirmBeforeDeletingTasks: boolean;
    showCompletedTasks: boolean;
  };
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  timer: {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWorkSessions: false,
  },
  goals: {
    daily: {...DEFAULT_DAILY_GOAL_TARGETS},
    weekly: {...DEFAULT_WEEKLY_GOAL_TARGETS},
  },
  appearance: {theme: 'system'},
  general: {
    notificationsEnabled: true,
    soundEnabled: true,
    confirmBeforeDeletingTasks: true,
    showCompletedTasks: true,
  },
};

export const GOAL_TARGET_LIMITS = {
  tasks: 10_000,
  focusSessions: 10_000,
  focusMinutes: 100_000,
} as const;

export type SettingsFieldErrors = Record<string, string>;

export function cloneSettings(settings: AppSettings): AppSettings {
  return {
    timer: {...settings.timer},
    goals: {
      daily: {...settings.goals.daily},
      weekly: {...settings.goals.weekly},
    },
    appearance: {...settings.appearance},
    general: {...settings.general},
  };
}

function mergeGoalTargets(
  stored: Partial<GoalTargets> | undefined,
  defaults: GoalTargets,
): GoalTargets {
  return {
    tasks: stored?.tasks ?? defaults.tasks,
    focusSessions: stored?.focusSessions ?? defaults.focusSessions,
    focusMinutes: stored?.focusMinutes ?? defaults.focusMinutes,
  };
}

/** Version-tolerant merge: unknown keys are ignored and missing keys default. */
export function mergeSettings(stored: unknown): AppSettings {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    throw new Error('Stored settings must be a JSON object.');
  }
  const value = stored as Partial<AppSettings>;
  return {
    timer: {
      workMinutes:
        value.timer?.workMinutes ?? DEFAULT_APP_SETTINGS.timer.workMinutes,
      shortBreakMinutes:
        value.timer?.shortBreakMinutes ??
        DEFAULT_APP_SETTINGS.timer.shortBreakMinutes,
      longBreakMinutes:
        value.timer?.longBreakMinutes ??
        DEFAULT_APP_SETTINGS.timer.longBreakMinutes,
      longBreakInterval:
        value.timer?.longBreakInterval ??
        DEFAULT_APP_SETTINGS.timer.longBreakInterval,
      autoStartBreaks:
        value.timer?.autoStartBreaks ??
        DEFAULT_APP_SETTINGS.timer.autoStartBreaks,
      autoStartWorkSessions:
        value.timer?.autoStartWorkSessions ??
        DEFAULT_APP_SETTINGS.timer.autoStartWorkSessions,
    },
    goals: {
      daily: mergeGoalTargets(
        value.goals?.daily,
        DEFAULT_APP_SETTINGS.goals.daily,
      ),
      weekly: mergeGoalTargets(
        value.goals?.weekly,
        DEFAULT_APP_SETTINGS.goals.weekly,
      ),
    },
    appearance: {
      theme: value.appearance?.theme ?? DEFAULT_APP_SETTINGS.appearance.theme,
    },
    general: {
      notificationsEnabled:
        value.general?.notificationsEnabled ??
        DEFAULT_APP_SETTINGS.general.notificationsEnabled,
      soundEnabled:
        value.general?.soundEnabled ??
        DEFAULT_APP_SETTINGS.general.soundEnabled,
      confirmBeforeDeletingTasks:
        value.general?.confirmBeforeDeletingTasks ??
        DEFAULT_APP_SETTINGS.general.confirmBeforeDeletingTasks,
      showCompletedTasks:
        value.general?.showCompletedTasks ??
        DEFAULT_APP_SETTINGS.general.showCompletedTasks,
    },
  };
}

export function validateSettings(settings: AppSettings): SettingsFieldErrors {
  const errors: SettingsFieldErrors = {};
  const integer = (
    path: string,
    label: string,
    value: number,
    min: number,
    max: number,
  ) => {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      errors[path] = `${label} must be a whole, finite number.`;
    } else if (value < min || value > max) {
      errors[path] = `${label} must be between ${min} and ${max}.`;
    }
  };

  integer('timer.workMinutes', 'Work minutes', settings.timer.workMinutes, 1, 180);
  integer(
    'timer.shortBreakMinutes',
    'Short break minutes',
    settings.timer.shortBreakMinutes,
    1,
    60,
  );
  integer(
    'timer.longBreakMinutes',
    'Long break minutes',
    settings.timer.longBreakMinutes,
    1,
    120,
  );
  integer(
    'timer.longBreakInterval',
    'Long break interval',
    settings.timer.longBreakInterval,
    1,
    10,
  );

  (['daily', 'weekly'] as const).forEach(period => {
    (['tasks', 'focusSessions', 'focusMinutes'] as const).forEach(metric => {
      integer(
        `goals.${period}.${metric}`,
        `${period === 'daily' ? 'Daily' : 'Weekly'} ${metric}`,
        settings.goals[period][metric],
        0,
        GOAL_TARGET_LIMITS[metric],
      );
    });
  });

  if (!['system', 'light', 'dark'].includes(settings.appearance.theme)) {
    errors['appearance.theme'] = 'Theme must be System, Light, or Dark.';
  }
  const boolean = (path: string, label: string, value: unknown) => {
    if (typeof value !== 'boolean') {
      errors[path] = `${label} must be enabled or disabled.`;
    }
  };
  boolean(
    'timer.autoStartBreaks',
    'Automatically start breaks',
    settings.timer.autoStartBreaks,
  );
  boolean(
    'timer.autoStartWorkSessions',
    'Automatically start work sessions',
    settings.timer.autoStartWorkSessions,
  );
  boolean(
    'general.notificationsEnabled',
    'Notifications',
    settings.general.notificationsEnabled,
  );
  boolean('general.soundEnabled', 'Sounds', settings.general.soundEnabled);
  boolean(
    'general.confirmBeforeDeletingTasks',
    'Delete confirmation',
    settings.general.confirmBeforeDeletingTasks,
  );
  boolean(
    'general.showCompletedTasks',
    'Show completed tasks',
    settings.general.showCompletedTasks,
  );
  return errors;
}
