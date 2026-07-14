import type {DeletedTask, Task} from '../types/task';
import type {ITaskRepository} from './ITaskRepository';

/**
 * Jest / fallback repository that mirrors SQLite task persistence in memory.
 */
export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Task[] = [];
  private deletedTasks: DeletedTask[] = [];
  private ready = false;

  async initialize(): Promise<void> {
    this.ready = true;
  }

  private ensureReady(): void {
    if (!this.ready) {
      throw new Error('Task repository is not initialized.');
    }
  }

  async getAllTasks(): Promise<Task[]> {
    this.ensureReady();
    return this.tasks.map(task => ({...task}));
  }

  async getDeletedTasks(): Promise<DeletedTask[]> {
    this.ensureReady();
    return this.deletedTasks.map(task => ({...task}));
  }

  async getTaskById(taskId: string): Promise<Task | undefined> {
    this.ensureReady();
    const task = this.tasks.find(item => item.id === taskId);
    return task ? {...task} : undefined;
  }

  async createTask(task: Task): Promise<void> {
    this.ensureReady();
    if (this.tasks.some(item => item.id === task.id)) {
      throw new Error(`Task already exists: ${task.id}`);
    }
    this.tasks = [{...task}, ...this.tasks];
  }

  async updateTask(task: Task): Promise<void> {
    this.ensureReady();
    const index = this.tasks.findIndex(item => item.id === task.id);
    if (index < 0) {
      throw new Error(`Task not found: ${task.id}`);
    }
    const next = [...this.tasks];
    next[index] = {...task};
    this.tasks = next;
  }

  async moveTaskToTrash(task: Task, deletedAt: string): Promise<void> {
    this.ensureReady();
    this.tasks = this.tasks.filter(item => item.id !== task.id);
    this.deletedTasks = [
      {...task, deletedAt},
      ...this.deletedTasks.filter(item => item.id !== task.id),
    ];
  }

  async restoreTask(taskId: string): Promise<Task | undefined> {
    this.ensureReady();
    const deleted = this.deletedTasks.find(item => item.id === taskId);
    if (!deleted) {
      return undefined;
    }

    const {deletedAt: _deletedAt, ...restored} = deleted;
    this.deletedTasks = this.deletedTasks.filter(item => item.id !== taskId);
    this.tasks = [{...restored}, ...this.tasks.filter(item => item.id !== taskId)];
    return {...restored};
  }

  async permanentlyDeleteTask(taskId: string): Promise<void> {
    this.ensureReady();
    this.deletedTasks = this.deletedTasks.filter(item => item.id !== taskId);
  }

  async purgeDeletedBefore(cutoffIso: string): Promise<void> {
    this.ensureReady();
    const cutoffMs = Date.parse(cutoffIso);
    this.deletedTasks = this.deletedTasks.filter(task => {
      const deletedAtMs = Date.parse(task.deletedAt);
      if (Number.isNaN(deletedAtMs)) {
        return false;
      }
      return deletedAtMs >= cutoffMs;
    });
  }

  async countTasks(): Promise<number> {
    this.ensureReady();
    return this.tasks.length;
  }
}
