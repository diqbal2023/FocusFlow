import type {DeletedTask, Task} from '../types/task';

/**
 * Persistence boundary for tasks. No UI, no business validation.
 */
export interface ITaskRepository {
  initialize(): Promise<void>;
  getAllTasks(): Promise<Task[]>;
  getDeletedTasks(): Promise<DeletedTask[]>;
  getTaskById(taskId: string): Promise<Task | undefined>;
  createTask(task: Task): Promise<void>;
  updateTask(task: Task): Promise<void>;
  /** Soft-delete: remove from active table and insert into deleted table. */
  moveTaskToTrash(task: Task, deletedAt: string): Promise<void>;
  restoreTask(taskId: string): Promise<Task | undefined>;
  permanentlyDeleteTask(taskId: string): Promise<void>;
  /** Permanently remove trash rows with deletedAt strictly before cutoffIso. */
  purgeDeletedBefore(cutoffIso: string): Promise<void>;
  countTasks(): Promise<number>;
}
