/**
 * @format
 */

import {
  DELETED_TASK_RETENTION_DAYS,
  TaskManager,
} from '../src/managers/TaskManager';
import {InMemoryTaskRepository} from '../src/repositories/InMemoryTaskRepository';
import type {DeletedTask, Task} from '../src/types/task';

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

async function createManager(seedTasks: Task[] = []): Promise<{
  manager: TaskManager;
  repository: InMemoryTaskRepository;
}> {
  const repository = new InMemoryTaskRepository();
  const manager = new TaskManager(repository);
  await manager.initialize({seedIfEmpty: false});
  for (const task of seedTasks) {
    await repository.createTask(task);
  }
  return {manager, repository};
}

describe('TaskManager Recently Deleted', () => {
  it('TC_TASK_TRASH_01 moveToTrash removes the task from active list and stamps deletedAt', async () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const {manager} = await createManager([sampleTask]);
    const result = await manager.moveToTrash(sampleTask.id, now);

    expect(result.tasks).toHaveLength(0);
    expect(result.deletedTasks).toHaveLength(1);
    expect(result.deletedTasks[0].id).toBe('task-a');
    expect(result.deletedTasks[0].deletedAt).toBe(now.toISOString());
    expect(result.deletedTasks[0].title).toBe('Trash Me');
  });

  it('TC_TASK_TRASH_02 restoreTask returns a soft-deleted task to the active list', async () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const {manager} = await createManager([sampleTask]);
    await manager.moveToTrash(sampleTask.id, now);
    const restored = await manager.restoreTask(sampleTask.id, now);

    expect(restored.deletedTasks).toHaveLength(0);
    expect(restored.tasks).toHaveLength(1);
    expect(restored.tasks[0].id).toBe('task-a');
    expect(restored.tasks[0]).not.toHaveProperty('deletedAt');
  });

  it('TC_TASK_TRASH_03 purgeExpiredDeletedTasks permanently removes items older than retention', async () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const {manager, repository} = await createManager();

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

    await repository.moveTaskToTrash(fresh, fresh.deletedAt);
    await repository.moveTaskToTrash(expired, expired.deletedAt);

    const kept = await manager.purgeExpiredDeletedTasks(
      now,
      DELETED_TASK_RETENTION_DAYS,
    );

    expect(kept.map(task => task.id)).toEqual(['fresh']);
  });

  it('TC_TASK_TRASH_04 getDaysRemainingInTrash reports remaining whole days', async () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const {manager} = await createManager();
    const deleted: DeletedTask = {
      ...sampleTask,
      deletedAt: '2026-07-01T12:00:00.000Z',
    };

    expect(manager.getDaysRemainingInTrash(deleted, now)).toBe(17);
  });

  it('TC_TASK_TRASH_05 permanentlyDeleteTask removes a trash item before retention expires', async () => {
    const now = new Date('2026-07-14T12:00:00.000Z');
    const {manager, repository} = await createManager();
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

    await repository.moveTaskToTrash(keep, keep.deletedAt);
    await repository.moveTaskToTrash(remove, remove.deletedAt);

    const next = await manager.permanentlyDeleteTask('remove', now);

    expect(next.map(task => task.id)).toEqual(['keep']);
  });
});
