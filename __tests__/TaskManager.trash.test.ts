/**
 * @format
 */

import {
  DELETED_TASK_RETENTION_DAYS,
  TaskManager,
} from '../src/managers/TaskManager';
import type {DeletedTask, Task} from '../src/types/task';

const manager = new TaskManager();

const sampleTask: Task = {
  id: 'task-a',
  title: 'Trash Me',
  description: 'Soft delete candidate',
  priority: 'Medium',
  status: 'Pending',
  dueDate: '07-20-26',
  estimatedDurationMinutes: '15',
  labels: 'home',
  parentTaskId: null,
};

describe('TaskManager Recently Deleted', () => {
  it('TC_TASK_TRASH_01 moveToTrash removes the task from active list and stamps deletedAt', () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const result = manager.moveToTrash([sampleTask], [], sampleTask.id, now);

    expect(result.tasks).toHaveLength(0);
    expect(result.deletedTasks).toHaveLength(1);
    expect(result.deletedTasks[0].id).toBe('task-a');
    expect(result.deletedTasks[0].deletedAt).toBe(now.toISOString());
    expect(result.deletedTasks[0].title).toBe('Trash Me');
  });

  it('TC_TASK_TRASH_02 restoreTask returns a soft-deleted task to the active list', () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const trashed = manager.moveToTrash([sampleTask], [], sampleTask.id, now);
    const restored = manager.restoreTask(
      trashed.tasks,
      trashed.deletedTasks,
      sampleTask.id,
      now,
    );

    expect(restored.deletedTasks).toHaveLength(0);
    expect(restored.tasks).toHaveLength(1);
    expect(restored.tasks[0].id).toBe('task-a');
    expect(restored.tasks[0]).not.toHaveProperty('deletedAt');
  });

  it('TC_TASK_TRASH_03 purgeExpiredDeletedTasks permanently removes items older than retention', () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const fresh: DeletedTask = {
      ...sampleTask,
      id: 'fresh',
      deletedAt: '2026-07-01T12:00:00.000Z',
    };
    const expired: DeletedTask = {
      ...sampleTask,
      id: 'expired',
      deletedAt: '2026-06-01T12:00:00.000Z',
    };

    const kept = manager.purgeExpiredDeletedTasks(
      [fresh, expired],
      now,
      DELETED_TASK_RETENTION_DAYS,
    );

    expect(kept.map(task => task.id)).toEqual(['fresh']);
  });

  it('TC_TASK_TRASH_04 getDaysRemainingInTrash reports remaining whole days', () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const deleted: DeletedTask = {
      ...sampleTask,
      deletedAt: '2026-07-01T12:00:00.000Z',
    };

    expect(manager.getDaysRemainingInTrash(deleted, now)).toBe(17);
  });

  it('TC_TASK_TRASH_05 permanentlyDeleteTask removes a trash item before retention expires', () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const keep: DeletedTask = {
      ...sampleTask,
      id: 'keep',
      deletedAt: now.toISOString(),
    };
    const remove: DeletedTask = {
      ...sampleTask,
      id: 'remove',
      deletedAt: now.toISOString(),
    };

    const next = manager.permanentlyDeleteTask([keep, remove], 'remove', now);

    expect(next.map(task => task.id)).toEqual(['keep']);
  });
});
