import {
  DEFAULT_APP_SETTINGS,
  cloneSettings,
  validateSettings,
  type AppSettings,
  type SettingsFieldErrors,
} from '../models/AppSettings';
import {
  settingsRepository,
  type ISettingsRepository,
} from '../repositories/SettingsRepository';
import {goalManager, type GoalManager} from './GoalManager';
import {
  sessionManager,
  type SessionManager,
} from './SessionManager';

type Listener = (settings: AppSettings) => void;

export class SettingsValidationError extends Error {
  constructor(public readonly fieldErrors: SettingsFieldErrors) {
    super('Please correct the highlighted settings.');
  }
}

export class SettingsManager {
  private current = cloneSettings(DEFAULT_APP_SETTINGS);
  private listeners = new Set<Listener>();

  constructor(
    private readonly repository: ISettingsRepository = settingsRepository,
    private readonly sessions: SessionManager = sessionManager,
    private readonly goals: GoalManager = goalManager,
  ) {}

  getCurrent(): AppSettings {
    return cloneSettings(this.current);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async load(): Promise<AppSettings> {
    const loaded = await this.repository.load();
    const errors = validateSettings(loaded);
    if (Object.keys(errors).length > 0) {
      throw new SettingsValidationError(errors);
    }
    this.publish(loaded);
    return this.getCurrent();
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    const errors = validateSettings(settings);
    if (Object.keys(errors).length > 0) {
      throw new SettingsValidationError(errors);
    }
    const next = cloneSettings(settings);
    await this.repository.save(next);
    this.publish(next);
    return this.getCurrent();
  }

  async reset(): Promise<AppSettings> {
    await this.repository.reset();
    this.publish(DEFAULT_APP_SETTINGS);
    return this.getCurrent();
  }

  private publish(settings: AppSettings): void {
    this.current = cloneSettings(settings);
    this.sessions.configure(this.current.timer);
    this.goals.setTargets('daily', this.current.goals.daily);
    this.goals.setTargets('weekly', this.current.goals.weekly);
    const snapshot = this.getCurrent();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

export const settingsManager = new SettingsManager();
