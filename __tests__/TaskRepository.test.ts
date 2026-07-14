/**
 * @format
 */

import {SqliteTaskRepository} from '../src/repositories/SqliteTaskRepository';
import {DatabaseService} from '../src/services/DatabaseService';
import type {Task} from '../src/types/task';
import {FakeDatabaseService} from '../src/testing/FakeDatabaseService';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Repository Write',
    description: 'Persist me',
    priority: 'High',
    status: 'Pending',
    dueDate: '07-21-26',
    estimatedDurationMinutes: '30',
    labels: 'school, homework',
    parentTaskId: null,
    ...overrides,
  };
}

describe('SqliteTaskRepository', () => {
  let db: FakeDatabaseService;
  let repository: SqliteTaskRepository;

  beforeEach(async () => {
    db = new FakeDatabaseService();
    repository = new SqliteTaskRepository(db);
    await repository.initialize();
  });

  it('TC_TASK_REPO_01 Initializes the database and creates the task table safely', async () => {
    expect(db.initialized).toBe(true);
    expect(
      db.schemaStatements.some(sql =>
        sql.includes('CREATE TABLE IF NOT EXISTS tasks'),
      ),
    ).toBe(true);
    expect(
      db.schemaStatements.some(sql =>
        sql.includes('CREATE TABLE IF NOT EXISTS deleted_tasks'),
      ),
    ).toBe(true);

    await repository.createTask(makeTask({id: 'keep-1', title: 'Keep Me'}));
    await repository.initialize();
    await repository.initialize();

    const tasks = await repository.getAllTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('keep-1');
  });

  it('TC_TASK_REPO_02 Creates a task using parameterized values', async () => {
    const task = makeTask({
      id: 'create-1',
      title: "Complete SQL review: ' OR 1=1 --",
      description: 'Use placeholders only',
      labels: 'sql, review',
      parentTaskId: 'parent-9',
    });

    await repository.createTask(task);

    const insert = db.calls.find(call =>
      call.sql.includes('INSERT INTO tasks'),
    );
    expect(insert).toBeTruthy();
    expect(insert?.sql).not.toContain(task.title);
    expect(insert?.sql).not.toContain(task.description);
    expect(insert?.sql).toContain('?');
    expect(insert?.params).toEqual([
      'create-1',
      "Complete SQL review: ' OR 1=1 --",
      'Use placeholders only',
      'High',
      'Pending',
      '07-21-26',
      '30',
      'sql, review',
      'parent-9',
    ]);

    const loaded = await repository.getTaskById('create-1');
    expect(loaded?.title).toBe("Complete SQL review: ' OR 1=1 --");
  });

  it('TC_TASK_REPO_03 Retrieves all tasks and maps database rows into typed Task objects', async () => {
    await repository.createTask(
      makeTask({id: 'a', title: 'Alpha', labels: 'one, two'}),
    );
    await repository.createTask(
      makeTask({id: 'b', title: 'Beta', status: 'Completed'}),
    );

    const tasks = await repository.getAllTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      priority: expect.any(String),
      status: expect.any(String),
      dueDate: expect.any(String),
      estimatedDurationMinutes: expect.any(String),
      labels: expect.any(String),
    });
    expect(typeof tasks[0].labels).toBe('string');
    expect(tasks.some(task => task.id === 'a')).toBe(true);
    expect(tasks.some(task => task.id === 'b')).toBe(true);
  });

  it('TC_TASK_REPO_04 Retrieves the correct task by task ID', async () => {
    await repository.createTask(makeTask({id: 'find-me', title: 'Target'}));
    await repository.createTask(makeTask({id: 'other', title: 'Distraction'}));

    const found = await repository.getTaskById('find-me');
    expect(found?.title).toBe('Target');
    expect(await repository.getTaskById('missing')).toBeUndefined();
  });

  it('TC_TASK_REPO_05 Updates an existing task while preserving its task ID', async () => {
    await repository.createTask(
      makeTask({
        id: 'stable-id',
        title: 'Before',
        status: 'In Progress',
        labels: 'keep, these',
      }),
    );

    await repository.updateTask(
      makeTask({
        id: 'stable-id',
        title: 'After',
        description: 'Updated body',
        priority: 'Critical',
        status: 'In Progress',
        dueDate: '08-01-26',
        estimatedDurationMinutes: '45',
        labels: 'keep, these, more',
        parentTaskId: 'parent-1',
      }),
    );

    const updated = await repository.getTaskById('stable-id');
    expect(updated?.id).toBe('stable-id');
    expect(updated?.title).toBe('After');
    expect(updated?.labels).toBe('keep, these, more');
    expect(updated?.parentTaskId).toBe('parent-1');
    expect(updated?.status).toBe('In Progress');
  });

  it('TC_TASK_REPO_06 Persists task labels correctly, including up to 10 labels', async () => {
    const tenLabels = Array.from(
      {length: 10},
      (_, index) => `label${index + 1}`,
    ).join(', ');

    await repository.createTask(
      makeTask({id: 'labeled', title: 'Labeled Task', labels: tenLabels}),
    );

    const created = await repository.getTaskById('labeled');
    expect(created?.labels).toBe(tenLabels);
    expect(created?.labels.split(', ')).toHaveLength(10);
    expect(typeof created?.labels).toBe('string');

    await repository.updateTask(
      makeTask({
        id: 'labeled',
        title: 'Labeled Task',
        labels: tenLabels,
      }),
    );

    const updated = await repository.getTaskById('labeled');
    expect(updated?.labels).toBe(tenLabels);
    expect(updated?.labels.split(', ')[0]).toBe('label1');
    expect(updated?.labels.split(', ')[9]).toBe('label10');
  });

  it('TC_TASK_REPO_07 Deletes the selected task without deleting unrelated tasks (soft-delete via moveTaskToTrash)', async () => {
    await repository.createTask(makeTask({id: 'keep', title: 'Keep Me'}));
    await repository.createTask(makeTask({id: 'remove', title: 'Remove Me'}));

    await repository.moveTaskToTrash(
      makeTask({id: 'remove', title: 'Remove Me'}),
      '2026-07-14T16:00:00.000Z',
    );

    const active = await repository.getAllTasks();
    const deleted = await repository.getDeletedTasks();

    expect(active.map(task => task.id)).toEqual(['keep']);
    expect(deleted).toHaveLength(1);
    expect(deleted[0].id).toBe('remove');
    expect(deleted[0].deletedAt).toBe('2026-07-14T16:00:00.000Z');
    expect(deleted[0].title).toBe('Remove Me');
  });

  it('TC_TASK_REPO_08 Returns an empty collection when no task rows exist', async () => {
    const tasks = await repository.getAllTasks();
    expect(tasks).toEqual([]);
    expect(await repository.countTasks()).toBe(0);
  });

  it('TC_TASK_REPO_09 Propagates or wraps a database error in a useful way', async () => {
    db.failNextExecute = new Error('disk I/O failure');

    await expect(
      repository.createTask(makeTask({id: 'boom'})),
    ).rejects.toThrow(/Database query failed|disk I\/O failure/);
  });

  it('TC_TASK_REPO_10 Does not concatenate user input directly into SQL and passes values separately as parameters', async () => {
    const hostile = makeTask({
      id: 'sql-safe',
      title: "Complete SQL review: ' OR 1=1 --",
      description: '"); DROP TABLE tasks; --',
      dueDate: '07-22-26',
      labels: 'quotes, injection',
    });

    await repository.createTask(hostile);
    await repository.updateTask({
      ...hostile,
      title: "Still parameterized: ' OR '1'='1",
    });

    const mutatingCalls = db.calls.filter(
      call =>
        /INSERT INTO tasks/i.test(call.sql) || /UPDATE tasks/i.test(call.sql),
    );

    expect(mutatingCalls.length).toBeGreaterThanOrEqual(2);
    for (const call of mutatingCalls) {
      expect(call.sql).toMatch(/\?/);
      expect(call.sql).not.toContain(hostile.title);
      expect(call.sql).not.toContain(hostile.description);
      expect(call.sql).not.toContain("Still parameterized: ' OR '1'='1");
      expect(call.params.length).toBeGreaterThan(0);
    }

    const loaded = await repository.getTaskById('sql-safe');
    expect(loaded?.title).toBe("Still parameterized: ' OR '1'='1");
  });

  it('TC_TASK_REPO_REG_01 Database path resolves without LocalAppPaths native module (DEF-005 fallback)', () => {
    const service = new DatabaseService();
    expect(service.getDatabasePath()).toBe('./focusflow.db');
  });

  it('TC_TASK_REPO_REG_02 Re-initialization does not wipe existing rows / reseed at repository layer (DEF-stage9 empty-seed isolation)', async () => {
    await repository.createTask(makeTask({id: 'persist', title: 'Stay'}));
    expect(await repository.countTasks()).toBe(1);

    await repository.initialize();
    await repository.initialize();

    expect(await repository.countTasks()).toBe(1);
    expect((await repository.getTaskById('persist'))?.title).toBe('Stay');
  });

  it('TC_TASK_REPO_REG_03 Update of a missing task fails without altering other rows', async () => {
    await repository.createTask(makeTask({id: 'only', title: 'Alone'}));

    await expect(
      repository.updateTask(makeTask({id: 'missing', title: 'Nope'})),
    ).rejects.toThrow('Task not found: missing');

    expect(await repository.countTasks()).toBe(1);
    expect((await repository.getTaskById('only'))?.title).toBe('Alone');
  });
});
