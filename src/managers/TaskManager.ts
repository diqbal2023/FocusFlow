import type {DeletedTask, Task, TaskPriority, TaskStatus} from '../types/task';
import {
  validateTaskInput,
  type TaskValidationErrors,
  type TaskValidationInput,
} from '../utils/taskValidation';
import type {ITaskRepository} from '../repositories/ITaskRepository';
import {SqliteTaskRepository} from '../repositories/SqliteTaskRepository';

/**
 * Form-shaped task input used by the presentation layer.
 * Kept free of React types so TaskManager stays UI-agnostic.
 */
export type TaskFormData = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  estimatedDurationMinutes: string;
  labels: string;
  parentTaskId: string;
};

export type TaskMutationSuccess = {
  success: true;
  tasks: Task[];
  errors: TaskValidationErrors;
};

export type TaskMutationFailure = {
  success: false;
  tasks: Task[];
  errors: TaskValidationErrors;
};

export type TaskMutationResult = TaskMutationSuccess | TaskMutationFailure;

export type TrashMutationResult = {
  tasks: Task[];
  deletedTasks: DeletedTask[];
};

export type TaskWorkspace = {
  tasks: Task[];
  deletedTasks: DeletedTask[];
};

export type TaskCompletionEvent = {
  taskId: string;
  completedAt: string;
};

/** Soft-deleted tasks are kept this many days before permanent removal. */
export const DELETED_TASK_RETENTION_DAYS = 30;

const EMPTY_FORM: TaskFormData = {
  title: '',
  description: '',
  priority: 'Medium',
  dueDate: '',
  estimatedDurationMinutes: '',
  labels: '',
  parentTaskId: '',
};

const SAMPLE_TASKS: Task[] = [
  {
    id: 'sample-1',
    title: 'Math Homework',
    description: 'Finish algebra worksheet problems 1 through 20.',
    priority: 'High',
    status: 'Pending',
    dueDate: '07-20-26',
    estimatedDurationMinutes: '45',
    labels: 'school, homework',
    parentTaskId: null,
  },
  {
    id: 'sample-2',
    title: 'Clean Room',
    description: 'Organize desk and put laundry away.',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '07-15-26',
    estimatedDurationMinutes: '30',
    labels: 'home',
    parentTaskId: null,
  },
  {
    id: 'sample-3',
    title: 'Study React Native',
    description: 'Review navigation and component patterns.',
    priority: 'Critical',
    status: 'Completed',
    dueDate: '07-12-26',
    estimatedDurationMinutes: '90',
    labels: 'learning, coding',
    parentTaskId: null,
  },
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function createTaskId(): string {
  return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function labelsToStorage(labels: string[]): string {
  return labels.join(', ');
}

function toValidationInput(form: TaskFormData): TaskValidationInput {
  return {
    title: form.title,
    description: form.description,
    priority: form.priority,
    estimatedDuration: form.estimatedDurationMinutes,
    labels: form.labels,
    dueDate: form.dueDate,
  };
}

function msInDays(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

function createDefaultRepository(): ITaskRepository {
  // Production default. Jest UI tests replace this via replaceRepositoryForTests.
  return new SqliteTaskRepository();
}

/**
 * Application-layer task business logic.
 * Persists through ITaskRepository; does not execute SQL.
 */
export class TaskManager {
  private initialized = false;
  private completionHistory: TaskCompletionEvent[] = [];

  constructor(private repository: ITaskRepository = createDefaultRepository()) {}

  /**
   * Test-only helper so UI suites do not share leftover in-memory data.
   */
  replaceRepositoryForTests(repository: ITaskRepository): void {
    this.repository = repository;
    this.initialized = false;
    this.resetCompletionHistoryForTests();
  }

  /**
   * Opens the repository and optionally seeds sample tasks on first launch.
   */
  async initialize(options?: {seedIfEmpty?: boolean}): Promise<void> {
    const seedIfEmpty = options?.seedIfEmpty ?? true;
    await this.repository.initialize();

    if (seedIfEmpty) {
      const count = await this.repository.countTasks();
      if (count === 0) {
        for (const sample of SAMPLE_TASKS) {
          await this.repository.createTask({...sample});
        }
      }
    }

    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize({seedIfEmpty: false});
    }
  }

  private async readWorkspace(): Promise<TaskWorkspace> {
    const [tasks, deletedTasks] = await Promise.all([
      this.repository.getAllTasks(),
      this.repository.getDeletedTasks(),
    ]);
    return {tasks, deletedTasks};
  }

  /**
   * Loads active and recently deleted tasks after initialization.
   */
  async loadWorkspace(): Promise<TaskWorkspace> {
    await this.ensureInitialized();
    await this.purgeExpiredDeletedTasks();
    return this.readWorkspace();
  }

  /**
   * Returns starter samples used only for empty-database seeding.
   */
  getInitialTasks(): Task[] {
    return SAMPLE_TASKS.map(task => ({...task}));
  }

  clearFormData(): TaskFormData {
    return {...EMPTY_FORM};
  }

  prepareTaskForEditing(task: Task): TaskFormData {
    return {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      labels: task.labels,
      parentTaskId: task.parentTaskId ?? '',
    };
  }

  getTaskById(tasks: Task[], taskId: string): Task | undefined {
    return tasks.find(task => task.id === taskId);
  }

  sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((left, right) => {
      const priorityDiff =
        PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return left.title.localeCompare(right.title);
    });
  }

  filterTasks(
    tasks: Task[],
    options?: {status?: TaskStatus; titleQuery?: string},
  ): Task[] {
    const status = options?.status;
    const titleQuery = options?.titleQuery?.trim().toLowerCase() ?? '';

    return tasks.filter(task => {
      if (status && task.status !== status) {
        return false;
      }
      if (titleQuery && !task.title.toLowerCase().includes(titleQuery)) {
        return false;
      }
      return true;
    });
  }

  async createTask(form: TaskFormData): Promise<TaskMutationResult> {
    await this.ensureInitialized();
    const current = await this.repository.getAllTasks();
    const validation = validateTaskInput(toValidationInput(form));
    if (!validation.isValid) {
      return {
        success: false,
        tasks: current,
        errors: validation.errors,
      };
    }

    const {title, description, priority, estimatedDuration, labels, dueDate} =
      validation.sanitizedData;

    const newTask: Task = {
      id: createTaskId(),
      title,
      description,
      priority,
      status: 'Pending',
      dueDate,
      estimatedDurationMinutes: estimatedDuration,
      labels: labelsToStorage(labels),
      parentTaskId: form.parentTaskId.trim() || null,
    };

    await this.repository.createTask(newTask);
    return {
      success: true,
      tasks: await this.repository.getAllTasks(),
      errors: {},
    };
  }

  async updateTask(
    taskId: string,
    form: TaskFormData,
  ): Promise<TaskMutationResult> {
    await this.ensureInitialized();
    const existing = await this.repository.getTaskById(taskId);
    const current = await this.repository.getAllTasks();

    if (!existing) {
      return {
        success: false,
        tasks: current,
        errors: {title: 'Task could not be found.'},
      };
    }

    const validation = validateTaskInput(toValidationInput(form));
    if (!validation.isValid) {
      return {
        success: false,
        tasks: current,
        errors: validation.errors,
      };
    }

    const {title, description, priority, estimatedDuration, labels, dueDate} =
      validation.sanitizedData;

    const updated: Task = {
      ...existing,
      title,
      description,
      priority,
      dueDate,
      estimatedDurationMinutes: estimatedDuration,
      labels: labelsToStorage(labels),
      parentTaskId: form.parentTaskId.trim() || null,
    };

    await this.repository.updateTask(updated);
    return {
      success: true,
      tasks: await this.repository.getAllTasks(),
      errors: {},
    };
  }

  async moveToTrash(
    taskId: string,
    now: Date = new Date(),
  ): Promise<TrashMutationResult> {
    await this.ensureInitialized();
    await this.purgeExpiredDeletedTasks(now);

    const task = await this.repository.getTaskById(taskId);
    if (task) {
      await this.repository.moveTaskToTrash(task, now.toISOString());
    }

    return this.readWorkspace();
  }

  async restoreTask(
    taskId: string,
    now: Date = new Date(),
  ): Promise<TrashMutationResult> {
    await this.ensureInitialized();
    await this.purgeExpiredDeletedTasks(now);
    await this.repository.restoreTask(taskId);
    return this.readWorkspace();
  }

  async permanentlyDeleteTask(
    taskId: string,
    now: Date = new Date(),
  ): Promise<DeletedTask[]> {
    await this.ensureInitialized();
    await this.purgeExpiredDeletedTasks(now);
    await this.repository.permanentlyDeleteTask(taskId);
    return this.repository.getDeletedTasks();
  }

  async purgeExpiredDeletedTasks(
    now: Date = new Date(),
    retentionDays: number = DELETED_TASK_RETENTION_DAYS,
  ): Promise<DeletedTask[]> {
    await this.ensureInitialized();
    const cutoffIso = new Date(
      now.getTime() - msInDays(retentionDays),
    ).toISOString();
    await this.repository.purgeDeletedBefore(cutoffIso);
    return this.repository.getDeletedTasks();
  }

  getDaysRemainingInTrash(
    deletedTask: DeletedTask,
    now: Date = new Date(),
    retentionDays: number = DELETED_TASK_RETENTION_DAYS,
  ): number {
    const deletedAtMs = Date.parse(deletedTask.deletedAt);
    if (Number.isNaN(deletedAtMs)) {
      return 0;
    }

    const expiresAt = deletedAtMs + msInDays(retentionDays);
    const remainingMs = expiresAt - now.getTime();
    if (remainingMs <= 0) {
      return 0;
    }

    return Math.ceil(remainingMs / msInDays(1));
  }

  getCompletionHistory(): TaskCompletionEvent[] {
    return this.completionHistory.map(event => ({...event}));
  }

  resetCompletionHistoryForTests(): void {
    this.completionHistory = [];
  }

  async advanceTaskStatus(
    taskId: string,
    now: Date = new Date(),
  ): Promise<Task[]> {
    await this.ensureInitialized();
    const task = await this.repository.getTaskById(taskId);
    if (!task) {
      return this.repository.getAllTasks();
    }

    let nextStatus: TaskStatus = task.status;
    if (task.status === 'Pending') {
      nextStatus = 'In Progress';
    } else if (task.status === 'In Progress') {
      nextStatus = 'Completed';
    }

    if (nextStatus !== task.status) {
      await this.repository.updateTask({...task, status: nextStatus});
      if (task.status === 'In Progress' && nextStatus === 'Completed') {
        this.completionHistory.push({
          taskId: task.id,
          completedAt: now.toISOString(),
        });
      }
    }

    return this.repository.getAllTasks();
  }

  async completeTask(
    taskId: string,
    now: Date = new Date(),
  ): Promise<Task[]> {
    return this.advanceTaskStatus(taskId, now);
  }
}

/** Shared TaskManager instance for the presentation layer. */
export const taskManager = new TaskManager();
