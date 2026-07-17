import {NativeModules} from 'react-native';
import TurboSqlite, {type Database} from 'react-native-turbo-sqlite';

const DATABASE_FILE_NAME = 'focusflow.db';

export type QueryParams = Array<string | number | null>;

export type QueryResult = {
  rows: Array<Record<string, unknown>>;
  rowsAffected: number;
  insertId: number;
};

/**
 * Narrow database contract used by repositories.
 * Enables Stage 10 tests to inject a fake without native SQLite.
 */
export type IDatabaseService = {
  initializeDatabase(): Promise<void>;
  executeSql(sql: string, params?: QueryParams): Promise<QueryResult>;
  getDatabasePath?: () => string;
  close?: () => Promise<void>;
};

type LocalAppPathsModule = {
  getLocalDatabaseDirectory?: () => string;
};

function resolveDatabaseDirectory(): string {
  const native = NativeModules.LocalAppPaths as LocalAppPathsModule | undefined;
  const directory = native?.getLocalDatabaseDirectory?.();
  if (directory && directory.trim()) {
    return directory.replace(/[/\\]+$/, '');
  }
  // Jest / environments without the native helper.
  return '.';
}

/**
 * Low-level SQLite access. No task business rules.
 */
export class DatabaseService implements IDatabaseService {
  private database: Database | null = null;
  private initializing: Promise<void> | null = null;

  getDatabasePath(): string {
    return `${resolveDatabaseDirectory()}/${DATABASE_FILE_NAME}`;
  }

  async initializeDatabase(): Promise<void> {
    if (this.database) {
      return;
    }
    if (this.initializing) {
      await this.initializing;
      return;
    }

    this.initializing = this.openAndMigrate();
    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  private async openAndMigrate(): Promise<void> {
    const path = this.getDatabasePath();
    this.database = await TurboSqlite.openDatabaseAsync(path);
    await this.executeSql(
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        due_date TEXT NOT NULL DEFAULT '',
        estimated_duration_minutes TEXT NOT NULL DEFAULT '',
        labels TEXT NOT NULL DEFAULT '',
        parent_task_id TEXT
      );`,
    );
    await this.executeSql(
      `CREATE TABLE IF NOT EXISTS deleted_tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        due_date TEXT NOT NULL DEFAULT '',
        estimated_duration_minutes TEXT NOT NULL DEFAULT '',
        labels TEXT NOT NULL DEFAULT '',
        parent_task_id TEXT,
        deleted_at TEXT NOT NULL
      );`,
    );
    await this.executeSql(
      `CREATE TABLE IF NOT EXISTS settings (
        settings_key TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
    );
  }

  async executeSql(
    sql: string,
    params: QueryParams = [],
  ): Promise<QueryResult> {
    if (!this.database) {
      throw new Error('Database has not been initialized.');
    }

    try {
      const result = await this.database.executeSqlAsync(sql, params);
      return {
        rows: result.rows as Array<Record<string, unknown>>,
        rowsAffected: result.rowsAffected,
        insertId: result.insertId,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown database error';
      throw new Error(`Database query failed: ${message}`);
    }
  }

  async close(): Promise<void> {
    if (!this.database) {
      return;
    }
    await this.database.closeAsync();
    this.database = null;
  }
}

/** Shared DatabaseService for the production SQLite repository. */
export const databaseService = new DatabaseService();
