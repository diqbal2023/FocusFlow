import {
  DEFAULT_APP_SETTINGS,
  cloneSettings,
  mergeSettings,
  type AppSettings,
} from '../models/AppSettings';
import {
  databaseService,
  type IDatabaseService,
} from '../services/DatabaseService';

export interface ISettingsRepository {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
  reset(): Promise<void>;
}

const SETTINGS_KEY = 'app';

export class SettingsRepository implements ISettingsRepository {
  constructor(private readonly db: IDatabaseService = databaseService) {}

  async load(): Promise<AppSettings> {
    try {
      await this.db.initializeDatabase();
      const result = await this.db.executeSql(
        'SELECT payload FROM settings WHERE settings_key = ? LIMIT 1;',
        [SETTINGS_KEY],
      );
      if (result.rows.length === 0) {
        return cloneSettings(DEFAULT_APP_SETTINGS);
      }
      const payload = result.rows[0].payload;
      if (typeof payload !== 'string') {
        throw new Error('stored payload is not text');
      }
      try {
        return mergeSettings(JSON.parse(payload));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'invalid JSON';
        throw new Error(`Settings data is corrupt: ${message}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Settings data is corrupt:')) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`Could not load settings: ${message}`);
    }
  }

  async save(settings: AppSettings): Promise<void> {
    try {
      await this.db.initializeDatabase();
      await this.db.executeSql(
        `INSERT OR REPLACE INTO settings (settings_key, payload, updated_at)
         VALUES (?, ?, ?);`,
        [SETTINGS_KEY, JSON.stringify(settings), new Date().toISOString()],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`Could not save settings: ${message}`);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.db.initializeDatabase();
      await this.db.executeSql(
        'DELETE FROM settings WHERE settings_key = ?;',
        [SETTINGS_KEY],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(`Could not reset settings: ${message}`);
    }
  }
}

export const settingsRepository = new SettingsRepository();
