/**
 * @format
 */

import {TaskManager, type TaskFormData} from '../src/managers/TaskManager';
import type {Task} from '../src/types/task';

const manager = new TaskManager();

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

describe('TaskManager unit tests', () => {
  it('TC_TASK_MGR_01 Creates a valid task and adds it to the collection', () => {
    const existing = [makeTask()];
    const result = manager.createTask(existing, validForm());

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].title).toBe('Write Notes');
    expect(result.tasks[0].status).toBe('Pending');
    expect(result.tasks[0].id).toBeTruthy();
    expect(result.tasks[1]).toEqual(existing[0]);
    expect(result.errors).toEqual({});
  });

  it('TC_TASK_MGR_02 Rejects invalid task input or returns the appropriate validation failure', () => {
    const existing = [makeTask()];
    const result = manager.createTask(
      existing,
      validForm({title: '   '}),
    );

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(result.tasks).toBe(existing);
    expect(result.errors.title).toBe('Title is required.');
  });

  it('TC_TASK_MGR_03 Updates an existing task while preserving its task ID', () => {
    const existing = [makeTask({id: 'keep-me'})];
    const result = manager.updateTask(
      existing,
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

  it('TC_TASK_MGR_04 Preserves task fields during editing, including status, priority, due date, estimated duration, description, and labels', () => {
    const existing = [
      makeTask({
        id: 'edit-1',
        status: 'In Progress',
        priority: 'Critical',
        dueDate: '08-01-26',
        estimatedDurationMinutes: '90',
        description: 'Keep me until form replaces me',
        labels: 'alpha, beta',
      }),
    ];

    const prepared = manager.prepareTaskForEditing(existing[0]);
    expect(prepared).toEqual({
      title: 'Original Title',
      description: 'Keep me until form replaces me',
      priority: 'Critical',
      dueDate: '08-01-26',
      estimatedDurationMinutes: '90',
      labels: 'alpha, beta',
      parentTaskId: '',
    });

    const result = manager.updateTask(
      existing,
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

  it('TC_TASK_MGR_05 Preserves up to 10 task labels during create and edit operations', () => {
    const tenLabels = Array.from({length: 10}, (_, index) => `label${index + 1}`);
    const labelsInput = tenLabels.join(', ');

    const created = manager.createTask(
      [],
      validForm({title: 'Labeled Create', labels: labelsInput}),
    );
    expect(created.success).toBe(true);
    if (!created.success) {
      return;
    }
    expect(created.tasks[0].labels).toBe(labelsInput);

    const seeded = [
      makeTask({
        id: 'labeled-edit',
        labels: 'old1, old2',
      }),
    ];
    const edited = manager.updateTask(
      seeded,
      'labeled-edit',
      validForm({title: 'Labeled Edit', labels: labelsInput}),
    );
    expect(edited.success).toBe(true);
    if (!edited.success) {
      return;
    }
    expect(edited.tasks[0].labels).toBe(labelsInput);
    expect(edited.tasks[0].labels.split(', ')).toHaveLength(10);
  });

  it('TC_TASK_MGR_06 Does not allow more than 10 labels after sanitization or validation', () => {
    const elevenLabels = Array.from(
      {length: 11},
      (_, index) => `tag${index + 1}`,
    ).join(', ');
    const existing = [makeTask()];

    const createResult = manager.createTask(
      existing,
      validForm({labels: elevenLabels}),
    );
    expect(createResult.success).toBe(false);
    if (createResult.success) {
      return;
    }
    expect(createResult.tasks).toBe(existing);
    expect(createResult.errors.labels).toBe(
      'A task can have at most 10 labels.',
    );

    const updateResult = manager.updateTask(
      existing,
      existing[0].id,
      validForm({labels: elevenLabels}),
    );
    expect(updateResult.success).toBe(false);
    if (updateResult.success) {
      return;
    }
    expect(updateResult.tasks).toBe(existing);
    expect(updateResult.errors.labels).toBe(
      'A task can have at most 10 labels.',
    );
  });

  it('TC_TASK_MGR_07 Marks a task as completed without modifying unrelated task fields', () => {
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
    const next = manager.completeTask([target, other], 'to-complete');

    expect(next[0]).toEqual({
      ...target,
      status: 'Completed',
    });
    expect(next[1]).toBe(other);
    expect(next[0].title).toBe('Finish Report');
    expect(next[0].labels).toBe('work, urgent');
    expect(next[0].parentTaskId).toBe('parent-9');
  });

  it('TC_TASK_MGR_08 Deletes the selected task without altering unrelated tasks (soft-delete via moveToTrash)', () => {
    const keep = makeTask({id: 'keep', title: 'Keep Me'});
    const remove = makeTask({id: 'remove', title: 'Remove Me'});
    const now = new Date('2026-07-14T15:00:00.000Z');

    const result = manager.moveToTrash([keep, remove], [], 'remove', now);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toBe(keep);
    expect(result.deletedTasks).toHaveLength(1);
    expect(result.deletedTasks[0].id).toBe('remove');
    expect(result.deletedTasks[0].title).toBe('Remove Me');
    expect(result.deletedTasks[0].deletedAt).toBe(now.toISOString());
  });

  it('TC_TASK_MGR_09 Returns or identifies the correct task by ID', () => {
    const tasks = [
      makeTask({id: 'a', title: 'Alpha'}),
      makeTask({id: 'b', title: 'Beta'}),
    ];

    expect(manager.getTaskById(tasks, 'b')?.title).toBe('Beta');
    expect(manager.getTaskById(tasks, 'missing')).toBeUndefined();
  });

  it('TC_TASK_MGR_10 Returns new arrays or objects instead of mutating the original task collection', () => {
    const original = [makeTask({id: 'immutable-1', status: 'Pending'})];
    const snapshot = original.map(task => ({...task}));

    const created = manager.createTask(original, validForm({title: 'New Task'}));
    expect(created.success).toBe(true);
    expect(original).toEqual(snapshot);
    expect(created.tasks).not.toBe(original);

    const updated = manager.updateTask(
      original,
      'immutable-1',
      validForm({title: 'Changed'}),
    );
    expect(updated.success).toBe(true);
    expect(original).toEqual(snapshot);
    expect(updated.tasks).not.toBe(original);

    const completed = manager.completeTask(original, 'immutable-1');
    expect(original).toEqual(snapshot);
    expect(completed).not.toBe(original);
    expect(completed[0]).not.toBe(original[0]);

    const trashed = manager.moveToTrash(original, [], 'immutable-1');
    expect(original).toEqual(snapshot);
    expect(trashed.tasks).not.toBe(original);
  });
});
