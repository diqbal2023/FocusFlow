export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  estimatedDurationMinutes: string;
  labels: string;
  parentTaskId: string | null;
};

/** Soft-deleted task kept for restore within the retention window. */
export type DeletedTask = Task & {
  /** ISO timestamp when the task was moved to Recently Deleted. */
  deletedAt: string;
};
