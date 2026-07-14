import type {
  IDatabaseService,
  QueryParams,
  QueryResult,
} from '../services/DatabaseService';

type TaskRow = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  estimated_duration_minutes: string;
  labels: string;
  parent_task_id: string | null;
};

type DeletedRow = TaskRow & {deleted_at: string};

/**
 * Fake DatabaseService for Stage 10 repository tests.
 * Records SQL + params and stores task rows in memory.
 */
export class FakeDatabaseService implements IDatabaseService {
  readonly calls: Array<{sql: string; params: QueryParams}> = [];
  tasks = new Map<string, TaskRow>();
  deletedTasks = new Map<string, DeletedRow>();
  initialized = false;
  failNextExecute: Error | null = null;
  schemaStatements: string[] = [];

  getDatabasePath(): string {
    return './focusflow.db';
  }

  async initializeDatabase(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
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
  }

  async executeSql(
    sql: string,
    params: QueryParams = [],
  ): Promise<QueryResult> {
    if (!this.initialized && !/^\s*CREATE TABLE/i.test(sql)) {
      throw new Error('Database has not been initialized.');
    }

    this.calls.push({sql, params: [...params]});

    if (this.failNextExecute) {
      const error = this.failNextExecute;
      this.failNextExecute = null;
      throw new Error(`Database query failed: ${error.message}`);
    }

    const normalized = sql.replace(/\s+/g, ' ').trim();

    if (/^CREATE TABLE IF NOT EXISTS/i.test(normalized)) {
      this.schemaStatements.push(normalized);
      return {rows: [], rowsAffected: 0, insertId: 0};
    }

    if (/^BEGIN/i.test(normalized) || /^COMMIT/i.test(normalized) || /^ROLLBACK/i.test(normalized)) {
      return {rows: [], rowsAffected: 0, insertId: 0};
    }

    if (/^INSERT INTO tasks/i.test(normalized)) {
      const row: TaskRow = {
        id: String(params[0]),
        title: String(params[1]),
        description: String(params[2] ?? ''),
        priority: String(params[3]),
        status: String(params[4]),
        due_date: String(params[5] ?? ''),
        estimated_duration_minutes: String(params[6] ?? ''),
        labels: String(params[7] ?? ''),
        parent_task_id:
          params[8] === null || params[8] === undefined || params[8] === ''
            ? null
            : String(params[8]),
      };
      this.tasks.set(row.id, row);
      return {rows: [], rowsAffected: 1, insertId: 0};
    }

    if (/^INSERT(?: OR REPLACE)? INTO deleted_tasks/i.test(normalized)) {
      const row: DeletedRow = {
        id: String(params[0]),
        title: String(params[1]),
        description: String(params[2] ?? ''),
        priority: String(params[3]),
        status: String(params[4]),
        due_date: String(params[5] ?? ''),
        estimated_duration_minutes: String(params[6] ?? ''),
        labels: String(params[7] ?? ''),
        parent_task_id:
          params[8] === null || params[8] === undefined || params[8] === ''
            ? null
            : String(params[8]),
        deleted_at: String(params[9]),
      };
      this.deletedTasks.set(row.id, row);
      return {rows: [], rowsAffected: 1, insertId: 0};
    }

    if (/^INSERT(?: OR REPLACE)? INTO tasks/i.test(normalized)) {
      const row: TaskRow = {
        id: String(params[0]),
        title: String(params[1]),
        description: String(params[2] ?? ''),
        priority: String(params[3]),
        status: String(params[4]),
        due_date: String(params[5] ?? ''),
        estimated_duration_minutes: String(params[6] ?? ''),
        labels: String(params[7] ?? ''),
        parent_task_id:
          params[8] === null || params[8] === undefined || params[8] === ''
            ? null
            : String(params[8]),
      };
      this.tasks.set(row.id, row);
      return {rows: [], rowsAffected: 1, insertId: 0};
    }

    if (/^UPDATE tasks/i.test(normalized)) {
      const id = String(params[8]);
      const existing = this.tasks.get(id);
      if (!existing) {
        return {rows: [], rowsAffected: 0, insertId: 0};
      }
      this.tasks.set(id, {
        ...existing,
        title: String(params[0]),
        description: String(params[1] ?? ''),
        priority: String(params[2]),
        status: String(params[3]),
        due_date: String(params[4] ?? ''),
        estimated_duration_minutes: String(params[5] ?? ''),
        labels: String(params[6] ?? ''),
        parent_task_id:
          params[7] === null || params[7] === undefined || params[7] === ''
            ? null
            : String(params[7]),
      });
      return {rows: [], rowsAffected: 1, insertId: 0};
    }

    if (/^DELETE FROM tasks WHERE id = \?/i.test(normalized)) {
      const id = String(params[0]);
      const existed = this.tasks.delete(id);
      return {rows: [], rowsAffected: existed ? 1 : 0, insertId: 0};
    }

    if (/^DELETE FROM deleted_tasks WHERE id = \?/i.test(normalized)) {
      const id = String(params[0]);
      const existed = this.deletedTasks.delete(id);
      return {rows: [], rowsAffected: existed ? 1 : 0, insertId: 0};
    }

    if (/^DELETE FROM deleted_tasks WHERE deleted_at < \?/i.test(normalized)) {
      const cutoff = String(params[0]);
      let removed = 0;
      for (const [id, row] of [...this.deletedTasks.entries()]) {
        if (row.deleted_at < cutoff) {
          this.deletedTasks.delete(id);
          removed += 1;
        }
      }
      return {rows: [], rowsAffected: removed, insertId: 0};
    }

    if (/^SELECT COUNT\(\*\) AS task_count FROM tasks/i.test(normalized)) {
      return {
        rows: [{task_count: this.tasks.size}],
        rowsAffected: 0,
        insertId: 0,
      };
    }

    if (/FROM deleted_tasks/i.test(normalized) && /WHERE id = \?/i.test(normalized)) {
      const id = String(params[0]);
      const row = this.deletedTasks.get(id);
      return {
        rows: row ? [{...row}] : [],
        rowsAffected: 0,
        insertId: 0,
      };
    }

    if (/FROM tasks/i.test(normalized) && /WHERE id = \?/i.test(normalized)) {
      const id = String(params[0]);
      const row = this.tasks.get(id);
      return {
        rows: row ? [{...row}] : [],
        rowsAffected: 0,
        insertId: 0,
      };
    }

    if (/FROM deleted_tasks/i.test(normalized)) {
      const rows = [...this.deletedTasks.values()]
        .sort((a, b) => b.deleted_at.localeCompare(a.deleted_at))
        .map(row => ({...row}));
      return {rows, rowsAffected: 0, insertId: 0};
    }

    if (/FROM tasks/i.test(normalized)) {
      const rows = [...this.tasks.values()].reverse().map(row => ({...row}));
      return {rows, rowsAffected: 0, insertId: 0};
    }

    throw new Error(`Unsupported SQL in FakeDatabaseService: ${normalized}`);
  }

  async close(): Promise<void> {
    this.initialized = false;
  }
}
