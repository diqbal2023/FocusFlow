import type {DeletedTask, Task, TaskPriority, TaskStatus} from '../types/task';
import {
  validateTaskInput,
  type TaskValidationErrors,
  type TaskValidationInput,
} from '../utils/taskValidation';

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

/**
 * Application-layer task business logic.
 * Operates on Task objects/arrays; does not touch React state or SQLite.
 */
export class TaskManager {
  /**
   * Returns the starter in-memory task list used before persistence exists.
   */
  getInitialTasks(): Task[] {
    return SAMPLE_TASKS.map(task => ({...task}));
  }

  /**
   * Returns a blank form payload for create mode.
   */
  clearFormData(): TaskFormData {
    return {...EMPTY_FORM};
  }

  /**
   * Maps an existing task into form fields for editing.
   */
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

  /**
   * Finds a task by id without mutating the collection.
   */
  getTaskById(tasks: Task[], taskId: string): Task | undefined {
    return tasks.find(task => task.id === taskId);
  }

  /**
   * Sorts a copy of tasks by priority (Critical → Low), then title.
   */
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

  /**
   * Filters a copy of tasks by optional status and/or case-insensitive title text.
   */
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

  /**
   * Validates input and prepends a new Pending task when valid.
   * Returns the previous collection unchanged when validation fails.
   */
  createTask(tasks: Task[], form: TaskFormData): TaskMutationResult {
    const validation = validateTaskInput(toValidationInput(form));
    if (!validation.isValid) {
      return {
        success: false,
        tasks,
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

    return {
      success: true,
      tasks: [newTask, ...tasks],
      errors: {},
    };
  }

  /**
   * Validates input and updates a task by id while preserving id and status.
   */
  updateTask(
    tasks: Task[],
    taskId: string,
    form: TaskFormData,
  ): TaskMutationResult {
    const existing = this.getTaskById(tasks, taskId);
    if (!existing) {
      return {
        success: false,
        tasks,
        errors: {title: 'Task could not be found.'},
      };
    }

    const validation = validateTaskInput(toValidationInput(form));
    if (!validation.isValid) {
      return {
        success: false,
        tasks,
        errors: validation.errors,
      };
    }

    const {title, description, priority, estimatedDuration, labels, dueDate} =
      validation.sanitizedData;

    const nextTasks = tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            title,
            description,
            priority,
            dueDate,
            estimatedDurationMinutes: estimatedDuration,
            labels: labelsToStorage(labels),
            parentTaskId: form.parentTaskId.trim() || null,
          }
        : task,
    );

    return {
      success: true,
      tasks: nextTasks,
      errors: {},
    };
  }

  /**
   * Moves a task into Recently Deleted with a deletion timestamp.
   * Expired trash items are purged at the same time.
   */
  moveToTrash(
    tasks: Task[],
    deletedTasks: DeletedTask[],
    taskId: string,
    now: Date = new Date(),
  ): TrashMutationResult {
    const task = this.getTaskById(tasks, taskId);
    const purgedTrash = this.purgeExpiredDeletedTasks(deletedTasks, now);

    if (!task) {
      return {tasks, deletedTasks: purgedTrash};
    }

    const trashed: DeletedTask = {
      ...task,
      deletedAt: now.toISOString(),
    };

    return {
      tasks: tasks.filter(item => item.id !== taskId),
      deletedTasks: [trashed, ...purgedTrash.filter(item => item.id !== taskId)],
    };
  }

  /**
   * Restores a soft-deleted task back to the active list.
   */
  restoreTask(
    tasks: Task[],
    deletedTasks: DeletedTask[],
    taskId: string,
    now: Date = new Date(),
  ): TrashMutationResult {
    const purgedTrash = this.purgeExpiredDeletedTasks(deletedTasks, now);
    const deleted = purgedTrash.find(task => task.id === taskId);

    if (!deleted) {
      return {tasks, deletedTasks: purgedTrash};
    }

    const {deletedAt: _deletedAt, ...restored} = deleted;

    return {
      tasks: [restored, ...tasks.filter(task => task.id !== taskId)],
      deletedTasks: purgedTrash.filter(task => task.id !== taskId),
    };
  }

  /**
   * Permanently removes a task from Recently Deleted before auto-expiry.
   */
  permanentlyDeleteTask(
    deletedTasks: DeletedTask[],
    taskId: string,
    now: Date = new Date(),
  ): DeletedTask[] {
    return this.purgeExpiredDeletedTasks(deletedTasks, now).filter(
      task => task.id !== taskId,
    );
  }

  /**
   * Permanently removes Recently Deleted items older than retention days.
   */
  purgeExpiredDeletedTasks(
    deletedTasks: DeletedTask[],
    now: Date = new Date(),
    retentionDays: number = DELETED_TASK_RETENTION_DAYS,
  ): DeletedTask[] {
    const cutoff = now.getTime() - msInDays(retentionDays);

    return deletedTasks.filter(task => {
      const deletedAtMs = Date.parse(task.deletedAt);
      if (Number.isNaN(deletedAtMs)) {
        return false;
      }
      return deletedAtMs >= cutoff;
    });
  }

  /**
   * Remaining whole days before permanent deletion (0 if expired).
   */
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

  /**
   * Advances task status one step:
   * Pending → In Progress → Completed.
   * Completed tasks are left unchanged.
   */
  advanceTaskStatus(tasks: Task[], taskId: string): Task[] {
    return tasks.map(task => {
      if (task.id !== taskId) {
        return task;
      }

      if (task.status === 'Pending') {
        return {...task, status: 'In Progress'};
      }

      if (task.status === 'In Progress') {
        return {...task, status: 'Completed'};
      }

      return task;
    });
  }

  /**
   * Alias for advanceTaskStatus (Pending → In Progress → Completed).
   */
  completeTask(tasks: Task[], taskId: string): Task[] {
    return this.advanceTaskStatus(tasks, taskId);
  }
}

/** Shared TaskManager instance for the presentation layer. */
export const taskManager = new TaskManager();
