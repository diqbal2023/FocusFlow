import type {DeletedTask, Task, TaskPriority, TaskStatus} from '../types/task';
import {
  databaseService,
  type IDatabaseService,
} from '../services/DatabaseService';
import type {ITaskRepository} from './ITaskRepository';

type TaskRow = {
  id: unknown;
  title: unknown;
  description: unknown;
  priority: unknown;
  status: unknown;
  due_date: unknown;
  estimated_duration_minutes: unknown;
  labels: unknown;
  parent_task_id: unknown;
  deleted_at?: unknown;
};

function asString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

function mapTaskRow(row: TaskRow): Task {
  const parent = row.parent_task_id;
  return {
    id: asString(row.id),
    title: asString(row.title),
    description: asString(row.description),
    priority: asString(row.priority) as TaskPriority,
    status: asString(row.status) as TaskStatus,
    dueDate: asString(row.due_date),
    estimatedDurationMinutes: asString(row.estimated_duration_minutes),
    labels: asString(row.labels),
    parentTaskId:
      parent === null || parent === undefined || parent === ''
        ? null
        : asString(parent),
  };
}

function mapDeletedRow(row: TaskRow): DeletedTask {
  return {
    ...mapTaskRow(row),
    deletedAt: asString(row.deleted_at),
  };
}

/**
 * SQLite-backed task persistence. Uses parameterized SQL only.
 */
export class SqliteTaskRepository implements ITaskRepository {
  constructor(private readonly db: IDatabaseService = databaseService) {}

  async initialize(): Promise<void> {
    await this.db.initializeDatabase();
  }

  async getAllTasks(): Promise<Task[]> {
    const result = await this.db.executeSql(
      `SELECT id, title, description, priority, status, due_date,
              estimated_duration_minutes, labels, parent_task_id
       FROM tasks
       ORDER BY rowid DESC;`,
    );
    return result.rows.map(row => mapTaskRow(row as TaskRow));
  }

  async getDeletedTasks(): Promise<DeletedTask[]> {
    const result = await this.db.executeSql(
      `SELECT id, title, description, priority, status, due_date,
              estimated_duration_minutes, labels, parent_task_id, deleted_at
       FROM deleted_tasks
       ORDER BY deleted_at DESC;`,
    );
    return result.rows.map(row => mapDeletedRow(row as TaskRow));
  }

  async getTaskById(taskId: string): Promise<Task | undefined> {
    const result = await this.db.executeSql(
      `SELECT id, title, description, priority, status, due_date,
              estimated_duration_minutes, labels, parent_task_id
       FROM tasks
       WHERE id = ?
       LIMIT 1;`,
      [taskId],
    );
    if (result.rows.length === 0) {
      return undefined;
    }
    return mapTaskRow(result.rows[0] as TaskRow);
  }

  async createTask(task: Task): Promise<void> {
    await this.db.executeSql(
      `INSERT INTO tasks (
         id, title, description, priority, status, due_date,
         estimated_duration_minutes, labels, parent_task_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        task.id,
        task.title,
        task.description,
        task.priority,
        task.status,
        task.dueDate,
        task.estimatedDurationMinutes,
        task.labels,
        task.parentTaskId,
      ],
    );
  }

  async updateTask(task: Task): Promise<void> {
    const result = await this.db.executeSql(
      `UPDATE tasks
       SET title = ?,
           description = ?,
           priority = ?,
           status = ?,
           due_date = ?,
           estimated_duration_minutes = ?,
           labels = ?,
           parent_task_id = ?
       WHERE id = ?;`,
      [
        task.title,
        task.description,
        task.priority,
        task.status,
        task.dueDate,
        task.estimatedDurationMinutes,
        task.labels,
        task.parentTaskId,
        task.id,
      ],
    );
    if (result.rowsAffected === 0) {
      throw new Error(`Task not found: ${task.id}`);
    }
  }

  async moveTaskToTrash(task: Task, deletedAt: string): Promise<void> {
    await this.db.executeSql('BEGIN IMMEDIATE;');
    try {
      await this.db.executeSql(`DELETE FROM tasks WHERE id = ?;`, [task.id]);
      await this.db.executeSql(
        `INSERT OR REPLACE INTO deleted_tasks (
           id, title, description, priority, status, due_date,
           estimated_duration_minutes, labels, parent_task_id, deleted_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          task.id,
          task.title,
          task.description,
          task.priority,
          task.status,
          task.dueDate,
          task.estimatedDurationMinutes,
          task.labels,
          task.parentTaskId,
          deletedAt,
        ],
      );
      await this.db.executeSql('COMMIT;');
    } catch (error) {
      await this.db.executeSql('ROLLBACK;');
      throw error;
    }
  }

  async restoreTask(taskId: string): Promise<Task | undefined> {
    const result = await this.db.executeSql(
      `SELECT id, title, description, priority, status, due_date,
              estimated_duration_minutes, labels, parent_task_id, deleted_at
       FROM deleted_tasks
       WHERE id = ?
       LIMIT 1;`,
      [taskId],
    );
    if (result.rows.length === 0) {
      return undefined;
    }

    const deleted = mapDeletedRow(result.rows[0] as TaskRow);
    const {deletedAt: _deletedAt, ...restored} = deleted;

    await this.db.executeSql('BEGIN IMMEDIATE;');
    try {
      await this.db.executeSql(
        `INSERT OR REPLACE INTO tasks (
           id, title, description, priority, status, due_date,
           estimated_duration_minutes, labels, parent_task_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          restored.id,
          restored.title,
          restored.description,
          restored.priority,
          restored.status,
          restored.dueDate,
          restored.estimatedDurationMinutes,
          restored.labels,
          restored.parentTaskId,
        ],
      );
      await this.db.executeSql(`DELETE FROM deleted_tasks WHERE id = ?;`, [
        taskId,
      ]);
      await this.db.executeSql('COMMIT;');
    } catch (error) {
      await this.db.executeSql('ROLLBACK;');
      throw error;
    }

    return restored;
  }

  async permanentlyDeleteTask(taskId: string): Promise<void> {
    await this.db.executeSql(`DELETE FROM deleted_tasks WHERE id = ?;`, [
      taskId,
    ]);
  }

  async purgeDeletedBefore(cutoffIso: string): Promise<void> {
    await this.db.executeSql(
      `DELETE FROM deleted_tasks WHERE deleted_at < ?;`,
      [cutoffIso],
    );
  }

  async countTasks(): Promise<number> {
    const result = await this.db.executeSql(
      `SELECT COUNT(*) AS task_count FROM tasks;`,
    );
    const count = result.rows[0]?.task_count;
    return typeof count === 'number' ? count : Number(count ?? 0);
  }
}
