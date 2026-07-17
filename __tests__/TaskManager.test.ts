/**
 * @format
 */

import {
  TaskManager,
  type TaskFormData,
} from '../src/managers/TaskManager';
import {InMemoryTaskRepository} from '../src/repositories/InMemoryTaskRepository';
import type {Task} from '../src/types/task';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'existing-1',
    title: 'Original Title',
    description: 'Original description',
    priority: 'High',
    status: 'In Progress',
    dueDate: '07-20-26',
    estimatedDurationMinutes: '45',
    labels: 'school, homework',
    parentTaskId: null,
    ...overrides,
  };
}

function validForm(overrides: Partial<TaskFormData> = {}): TaskFormData {
  return {
    title: 'Write Notes',
    description: 'Summarize Stage 8 coverage',
    priority: 'Medium',
    dueDate: '07-21-26',
    estimatedDurationMinutes: '30',
    labels: 'study, coding',
    parentTaskId: '',
    ...overrides,
  };
}

async function createManager(seedTasks: Task[] = []): Promise<TaskManager> {
  const repository = new InMemoryTaskRepository();
  const manager = new TaskManager(repository);
  await manager.initialize({seedIfEmpty: false});
  for (const task of seedTasks) {
    await repository.createTask(task);
  }
  return manager;
}

describe('TaskManager unit tests', () => {
  it('TC_TASK_MGR_01 Creates a valid task and adds it to the collection', async () => {
    const manager = await createManager([makeTask()]);
    const result = await manager.createTask(validForm());

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].title).toBe('Write Notes');
    expect(result.tasks[0].status).toBe('Pending');
    expect(result.tasks[0].id).toBeTruthy();
    expect(result.tasks.some(task => task.id === 'existing-1')).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('TC_TASK_MGR_02 Rejects invalid task input or returns the appropriate validation failure', async () => {
    const manager = await createManager([makeTask()]);
    const before = (await manager.loadWorkspace()).tasks;
    const result = await manager.createTask(validForm({title: '   '}));

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.tasks).toHaveLength(before.length);
    expect(result.tasks.map(task => task.id)).toEqual(
      before.map(task => task.id),
    );
    expect(result.errors.title).toBe('Title is required.');
  });

  it('TC_TASK_MGR_03 Updates an existing task while preserving its task ID', async () => {
    const manager = await createManager([makeTask({id: 'keep-me'})]);
    const result = await manager.updateTask(
      'keep-me',
      validForm({title: 'Updated Title'}),
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toBe('keep-me');
    expect(result.tasks[0].title).toBe('Updated Title');
  });

  it('TC_TASK_MGR_04 Preserves task fields during editing, including status, priority, due date, estimated duration, description, and labels', async () => {
    const existing = makeTask({
      id: 'edit-1',
      status: 'In Progress',
      priority: 'Critical',
      dueDate: '08-01-26',
      estimatedDurationMinutes: '90',
      description: 'Keep me until form replaces me',
      labels: 'alpha, beta',
    });
    const manager = await createManager([existing]);

    const prepared = manager.prepareTaskForEditing(existing);
    expect(prepared).toEqual({
      title: 'Original Title',
      description: 'Keep me until form replaces me',
      priority: 'Critical',
      dueDate: '08-01-26',
      estimatedDurationMinutes: '90',
      labels: 'alpha, beta',
      parentTaskId: '',
    });

    const result = await manager.updateTask(
      'edit-1',
      validForm({
        title: 'Edited Title',
        description: 'New description',
        priority: 'Low',
        dueDate: '08-15-26',
        estimatedDurationMinutes: '20',
        labels: 'gamma, delta',
      }),
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const updated = result.tasks[0];
    expect(updated.id).toBe('edit-1');
    expect(updated.status).toBe('In Progress');
    expect(updated.priority).toBe('Low');
    expect(updated.dueDate).toBe('08-15-26');
    expect(updated.estimatedDurationMinutes).toBe('20');
    expect(updated.description).toBe('New description');
    expect(updated.labels).toBe('gamma, delta');
  });

  it('TC_TASK_MGR_05 Preserves up to 10 task labels during create and edit operations', async () => {
    const tenLabels = Array.from(
      {length: 10},
      (_, index) => `label${index + 1}`,
    );
    const labelsInput = tenLabels.join(', ');
    const manager = await createManager();

    const created = await manager.createTask(
      validForm({title: 'Labeled Create', labels: labelsInput}),
    );
    expect(created.success).toBe(true);
    if (!created.success) {
      return;
    }
    expect(created.tasks[0].labels).toBe(labelsInput);

    const seededId = 'labeled-edit';
    const withOld = await createManager([
      makeTask({id: seededId, labels: 'old1, old2'}),
    ]);
    const edited = await withOld.updateTask(
      seededId,
      validForm({title: 'Labeled Edit', labels: labelsInput}),
    );
    expect(edited.success).toBe(true);
    if (!edited.success) {
      return;
    }
    expect(edited.tasks[0].labels).toBe(labelsInput);
    expect(edited.tasks[0].labels.split(', ')).toHaveLength(10);
  });

  it('TC_TASK_MGR_06 Does not allow more than 10 labels after sanitization or validation', async () => {
    const elevenLabels = Array.from(
      {length: 11},
      (_, index) => `tag${index + 1}`,
    ).join(', ');
    const manager = await createManager([makeTask()]);

    const createResult = await manager.createTask(
      validForm({labels: elevenLabels}),
    );
    expect(createResult.success).toBe(false);
    if (createResult.success) {
      return;
    }
    expect(createResult.tasks).toHaveLength(1);
    expect(createResult.errors.labels).toBe(
      'A task can have at most 10 labels.',
    );

    const updateResult = await manager.updateTask(
      'existing-1',
      validForm({labels: elevenLabels}),
    );
    expect(updateResult.success).toBe(false);
    if (updateResult.success) {
      return;
    }
    expect(updateResult.tasks).toHaveLength(1);
    expect(updateResult.errors.labels).toBe(
      'A task can have at most 10 labels.',
    );
  });

  it('TC_TASK_MGR_07 Marks a task as completed without modifying unrelated task fields', async () => {
    const target = makeTask({
      id: 'to-complete',
      status: 'In Progress',
      title: 'Finish Report',
      description: 'Stay intact',
      priority: 'High',
      dueDate: '07-22-26',
      estimatedDurationMinutes: '60',
      labels: 'work, urgent',
      parentTaskId: 'parent-9',
    });
    const other = makeTask({id: 'other-1', title: 'Leave Alone'});
    const manager = await createManager([target, other]);
    const next = await manager.completeTask('to-complete');

    const completed = next.find(task => task.id === 'to-complete');
    const untouched = next.find(task => task.id === 'other-1');

    expect(completed).toEqual({
      ...target,
      status: 'Completed',
    });
    expect(untouched).toEqual(other);
    expect(completed?.title).toBe('Finish Report');
    expect(completed?.labels).toBe('work, urgent');
    expect(completed?.parentTaskId).toBe('parent-9');
  });

  it('TC_TASK_MGR_08 Deletes the selected task without altering unrelated tasks (soft-delete via moveToTrash)', async () => {
    const keep = makeTask({id: 'keep', title: 'Keep Me'});
    const remove = makeTask({id: 'remove', title: 'Remove Me'});
    const manager = await createManager([keep, remove]);
    const now = new Date('2026-07-14T15:00:00.000Z');

    const result = await manager.moveToTrash('remove', now);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].id).toBe('keep');
    expect(result.deletedTasks).toHaveLength(1);
    expect(result.deletedTasks[0].id).toBe('remove');
    expect(result.deletedTasks[0].title).toBe('Remove Me');
    expect(result.deletedTasks[0].deletedAt).toBe(now.toISOString());
  });

  it('TC_TASK_MGR_09 Returns or identifies the correct task by ID', async () => {
    const tasks = [
      makeTask({id: 'a', title: 'Alpha'}),
      makeTask({id: 'b', title: 'Beta'}),
    ];
    const manager = await createManager(tasks);

    expect(manager.getTaskById(tasks, 'b')?.title).toBe('Beta');
    expect(manager.getTaskById(tasks, 'missing')).toBeUndefined();

    const workspace = await manager.loadWorkspace();
    expect(workspace.tasks.find(task => task.id === 'b')?.title).toBe('Beta');
  });

  it('TC_TASK_MGR_10 Returns new arrays or objects instead of mutating the original task collection', async () => {
    const original = [makeTask({id: 'immutable-1', status: 'Pending'})];
    const snapshot = original.map(task => ({...task}));
    const manager = await createManager(original);

    const created = await manager.createTask(validForm({title: 'New Task'}));
    expect(created.success).toBe(true);
    expect(original).toEqual(snapshot);

    const updated = await manager.updateTask(
      'immutable-1',
      validForm({title: 'Changed'}),
    );
    expect(updated.success).toBe(true);
    expect(original).toEqual(snapshot);

    const completed = await manager.completeTask('immutable-1');
    expect(original).toEqual(snapshot);
    expect(completed.find(task => task.id === 'immutable-1')?.status).toBe(
      'In Progress',
    );

    const trashed = await manager.moveToTrash('immutable-1');
    expect(original).toEqual(snapshot);
    expect(trashed.tasks.some(task => task.id === 'immutable-1')).toBe(false);
    expect(trashed.deletedTasks.some(task => task.id === 'immutable-1')).toBe(
      true,
    );
  });

  it('TC_TASK_MGR_11 records an In Progress completion once with its real date', async () => {
    const manager = await createManager([
      makeTask({id: 'history-1', status: 'In Progress'}),
    ]);
    const completedAt = new Date('2026-07-16T14:30:00.000Z');

    await manager.completeTask('history-1', completedAt);
    await manager.completeTask('history-1', new Date('2026-07-17T14:30:00.000Z'));

    const history = manager.getCompletionHistory();
    expect(history).toEqual([
      {taskId: 'history-1', completedAt: completedAt.toISOString()},
    ]);

    history[0].taskId = 'changed-copy';
    expect(manager.getCompletionHistory()[0].taskId).toBe('history-1');
  });
});
