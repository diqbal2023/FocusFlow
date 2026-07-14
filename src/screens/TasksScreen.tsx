import {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../components/AppButton';
import {AppCard} from '../components/AppCard';
import {AppInput} from '../components/AppInput';
import {PageHeader} from '../components/PageHeader';
import {PrioritySelect} from '../components/PrioritySelect';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';
import {
  DELETED_TASK_RETENTION_DAYS,
  taskManager,
  type TaskFormData,
} from '../managers/TaskManager';
import type {DeletedTask, Task, TaskPriority} from '../types/task';
import type {TaskValidationErrors} from '../utils/taskValidation';

function toUserError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [form, setForm] = useState<TaskFormData>(() =>
    taskManager.clearFormData(),
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isTrashVisible, setIsTrashVisible] = useState(false);
  const [errors, setErrors] = useState<TaskValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        await taskManager.initialize({seedIfEmpty: true});
        const workspace = await taskManager.loadWorkspace();
        if (cancelled || !mountedRef.current) {
          return;
        }
        setTasks(workspace.tasks);
        setDeletedTasks(workspace.deletedTasks);
        setLoadError(null);
      } catch (error) {
        if (cancelled || !mountedRef.current) {
          return;
        }
        console.error('Failed to load tasks from local database', error);
        setLoadError(
          toUserError(
            error,
            'Could not load tasks from the local database.',
          ),
        );
      } finally {
        if (!cancelled && mountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, []);

  const formTitle = useMemo(
    () => (editingTaskId ? 'Edit Task' : 'Add Task'),
    [editingTaskId],
  );

  const updateField = <K extends keyof TaskFormData>(
    key: K,
    value: TaskFormData[K],
  ) => {
    setForm(current => ({...current, [key]: value}));
    setActionError(null);

    setErrors(current => {
      const next = {...current};
      if (key === 'title') {
        delete next.title;
      }
      if (key === 'description') {
        delete next.description;
      }
      if (key === 'priority') {
        delete next.priority;
      }
      if (key === 'dueDate') {
        delete next.dueDate;
      }
      if (key === 'estimatedDurationMinutes') {
        delete next.estimatedDuration;
      }
      if (key === 'labels') {
        delete next.labels;
      }
      return next;
    });
  };

  const resetFormFields = () => {
    setForm(taskManager.clearFormData());
    setEditingTaskId(null);
    setErrors({});
  };

  const clearForm = () => {
    resetFormFields();
    setIsFormVisible(true);
  };

  const closeForm = () => {
    resetFormFields();
    setIsFormVisible(false);
  };

  const startAddTask = () => {
    resetFormFields();
    setActionError(null);
    setIsTrashVisible(false);
    setIsFormVisible(true);
  };

  const saveTask = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      const result = editingTaskId
        ? await taskManager.updateTask(editingTaskId, form)
        : await taskManager.createTask(form);

      if (!mountedRef.current) {
        return;
      }

      if (!result.success) {
        setErrors(result.errors);
        return;
      }

      setTasks(result.tasks);
      closeForm();
    } catch (error) {
      console.error('Failed to save task', error);
      if (mountedRef.current) {
        setActionError(
          toUserError(
            error,
            editingTaskId
              ? 'Could not update the task.'
              : 'Could not create the task.',
          ),
        );
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const editTask = (task: Task) => {
    setEditingTaskId(task.id);
    setIsTrashVisible(false);
    setIsFormVisible(true);
    setErrors({});
    setActionError(null);
    setForm(taskManager.prepareTaskForEditing(task));
  };

  const advanceStatus = async (taskId: string) => {
    setActionError(null);
    try {
      const next = await taskManager.advanceTaskStatus(taskId);
      if (mountedRef.current) {
        setTasks(next);
      }
    } catch (error) {
      console.error('Failed to update task status', error);
      if (mountedRef.current) {
        setActionError(toUserError(error, 'Could not update task status.'));
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    setActionError(null);
    try {
      const result = await taskManager.moveToTrash(taskId);
      if (!mountedRef.current) {
        return;
      }
      setTasks(result.tasks);
      setDeletedTasks(result.deletedTasks);
      if (editingTaskId === taskId) {
        closeForm();
      }
    } catch (error) {
      console.error('Failed to delete task', error);
      if (mountedRef.current) {
        setActionError(toUserError(error, 'Could not delete the task.'));
      }
    }
  };

  const openRecentlyDeleted = async () => {
    setActionError(null);
    try {
      const purged = await taskManager.purgeExpiredDeletedTasks();
      if (mountedRef.current) {
        setDeletedTasks(purged);
        setIsFormVisible(false);
        setIsTrashVisible(true);
      }
    } catch (error) {
      console.error('Failed to open Recently Deleted', error);
      if (mountedRef.current) {
        setActionError(
          toUserError(error, 'Could not open Recently Deleted.'),
        );
      }
    }
  };

  const closeRecentlyDeleted = () => {
    setIsTrashVisible(false);
  };

  const restoreDeletedTask = async (taskId: string) => {
    setActionError(null);
    try {
      const result = await taskManager.restoreTask(taskId);
      if (mountedRef.current) {
        setTasks(result.tasks);
        setDeletedTasks(result.deletedTasks);
      }
    } catch (error) {
      console.error('Failed to restore task', error);
      if (mountedRef.current) {
        setActionError(toUserError(error, 'Could not restore the task.'));
      }
    }
  };

  const permanentlyDeleteTask = async (taskId: string) => {
    setActionError(null);
    try {
      const next = await taskManager.permanentlyDeleteTask(taskId);
      if (mountedRef.current) {
        setDeletedTasks(next);
      }
    } catch (error) {
      console.error('Failed to permanently delete task', error);
      if (mountedRef.current) {
        setActionError(
          toUserError(error, 'Could not permanently delete the task.'),
        );
      }
    }
  };

  const statusActionTitle = (status: Task['status']): string | null => {
    if (status === 'Pending') {
      return 'Start';
    }
    if (status === 'In Progress') {
      return 'Complete';
    }
    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.centered} testID="tasks-loading">
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Loading tasks…</Text>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.centered} testID="tasks-load-error">
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      testID="tasks-screen">
      <View style={styles.topRow}>
        <View style={styles.headerWrap}>
          <PageHeader
            title="Tasks"
            subtitle="Organize and track your work."
          />
        </View>
        <View style={styles.topActions}>
          <AppButton
            title="Add Task"
            onPress={startAddTask}
            testID="add-task-button"
            style={styles.topActionButton}
          />
          <AppButton
            title="Recently Deleted"
            variant="secondary"
            onPress={openRecentlyDeleted}
            testID="recently-deleted-button"
            style={styles.topActionButton}
          />
        </View>
      </View>

      {actionError ? (
        <Text style={styles.errorText} testID="tasks-action-error">
          {actionError}
        </Text>
      ) : null}

      {isTrashVisible ? (
        <View style={styles.listSection} testID="recently-deleted-section">
          <View style={styles.trashHeader}>
            <Text style={styles.sectionTitle}>Recently Deleted</Text>
            <AppButton
              title="Back to Tasks"
              variant="secondary"
              onPress={closeRecentlyDeleted}
              testID="close-recently-deleted-button"
              style={styles.topActionButton}
            />
          </View>
          <Text style={styles.trashHint}>
            Restore within {DELETED_TASK_RETENTION_DAYS} days, or delete
            permanently now. After {DELETED_TASK_RETENTION_DAYS} days, tasks
            are removed automatically.
          </Text>
          {deletedTasks.length === 0 ? (
            <AppCard>
              <Text style={styles.emptyText}>No recently deleted tasks.</Text>
            </AppCard>
          ) : (
            deletedTasks.map(task => {
              const daysRemaining =
                taskManager.getDaysRemainingInTrash(task);

              return (
                <AppCard
                  key={task.id}
                  style={styles.taskCard}
                  testID={`deleted-task-card-${task.id}`}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.description ? (
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                  ) : null}
                  <Text style={styles.taskMeta}>
                    Priority: {task.priority}
                  </Text>
                  <Text style={styles.taskMeta}>Status: {task.status}</Text>
                  <Text
                    style={styles.taskMeta}
                    testID={`deleted-task-days-${task.id}`}>
                    {daysRemaining === 1
                      ? '1 day left to restore'
                      : `${daysRemaining} days left to restore`}
                  </Text>
                  <View style={styles.taskActions}>
                    <AppButton
                      title="Restore"
                      onPress={() => restoreDeletedTask(task.id)}
                      testID={`task-restore-${task.id}`}
                      style={styles.taskActionButton}
                    />
                    <AppButton
                      title="Delete Permanently"
                      variant="danger"
                      onPress={() => permanentlyDeleteTask(task.id)}
                      testID={`task-permanent-delete-${task.id}`}
                      style={styles.taskActionButton}
                    />
                  </View>
                </AppCard>
              );
            })
          )}
        </View>
      ) : (
        <>
          {isFormVisible ? (
            <AppCard style={styles.section} testID="task-form-card">
              <Text style={styles.sectionTitle}>{formTitle}</Text>
              <Text style={styles.requiredHint}>Title *</Text>

              <AppInput
                label="Title"
                value={form.title}
                onChangeText={text => updateField('title', text)}
                placeholder="Enter task title"
                error={errors.title}
                testID="task-title-input"
              />
              <AppInput
                label="Description"
                value={form.description}
                onChangeText={text => updateField('description', text)}
                placeholder="Enter task description"
                error={errors.description}
                testID="task-description-input"
              />
              <PrioritySelect
                value={form.priority}
                onChange={(priority: TaskPriority) =>
                  updateField('priority', priority)
                }
              />
              {errors.priority ? (
                <Text style={styles.inlineError} testID="task-priority-error">
                  {errors.priority}
                </Text>
              ) : null}
              <AppInput
                label="Due Date"
                value={form.dueDate}
                onChangeText={text => updateField('dueDate', text)}
                placeholder="MM-DD-YY"
                error={errors.dueDate}
                testID="task-due-date-input"
              />
              <AppInput
                label="Estimated Duration (minutes)"
                value={form.estimatedDurationMinutes}
                onChangeText={text =>
                  updateField('estimatedDurationMinutes', text)
                }
                placeholder="e.g. 30"
                error={errors.estimatedDuration}
                testID="task-duration-input"
              />
              <AppInput
                label="Labels"
                value={form.labels}
                onChangeText={text => updateField('labels', text)}
                placeholder="Comma-separated labels"
                error={errors.labels}
                testID="task-labels-input"
              />
              <AppInput
                label="Parent Task"
                value={form.parentTaskId}
                onChangeText={text => updateField('parentTaskId', text)}
                placeholder="Parent task selection coming later"
                testID="task-parent-input"
                accessibilityLabel="Parent Task placeholder"
              />

              <View style={styles.formActions}>
                <AppButton
                  title={isSaving ? 'Saving…' : 'Save Task'}
                  onPress={saveTask}
                  testID="save-task-button"
                  style={styles.formActionButton}
                />
                <AppButton
                  title="Clear Form"
                  variant="secondary"
                  onPress={clearForm}
                  testID="clear-task-form-button"
                  style={styles.formActionButton}
                />
              </View>
            </AppCard>
          ) : null}

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Task List</Text>
            {tasks.length === 0 ? (
              <AppCard>
                <Text style={styles.emptyText}>No tasks yet.</Text>
              </AppCard>
            ) : (
              tasks.map(task => {
                const nextStatusAction = statusActionTitle(task.status);

                return (
                  <AppCard
                    key={task.id}
                    style={styles.taskCard}
                    testID={`task-card-${task.id}`}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.description ? (
                      <Text style={styles.taskDescription}>
                        {task.description}
                      </Text>
                    ) : null}
                    <Text style={styles.taskMeta}>
                      Priority: {task.priority}
                    </Text>
                    <Text
                      style={styles.taskMeta}
                      testID={`task-status-${task.id}`}>
                      Status: {task.status}
                    </Text>
                    {task.dueDate ? (
                      <Text style={styles.taskMeta}>Due: {task.dueDate}</Text>
                    ) : null}
                    {task.labels ? (
                      <Text style={styles.taskMeta}>
                        Labels: {task.labels}
                      </Text>
                    ) : null}

                    <View style={styles.taskActions}>
                      <AppButton
                        title="Edit"
                        variant="secondary"
                        onPress={() => editTask(task)}
                        testID={`task-edit-${task.id}`}
                        style={styles.taskActionButton}
                      />
                      {nextStatusAction ? (
                        <AppButton
                          title={nextStatusAction}
                          onPress={() => advanceStatus(task.id)}
                          testID={`task-complete-${task.id}`}
                          style={styles.taskActionButton}
                        />
                      ) : null}
                      <AppButton
                        title="Delete"
                        variant="danger"
                        onPress={() => deleteTask(task.id)}
                        testID={`task-delete-${task.id}`}
                        style={styles.taskActionButton}
                      />
                    </View>
                  </AppCard>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    padding: spacing.xxl,
    gap: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
    backgroundColor: colors.surfaceMuted,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerWrap: {
    flex: 1,
  },
  topActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: 'flex-end',
  },
  topActionButton: {
    minWidth: 120,
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  trashHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  trashHint: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  requiredHint: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  inlineError: {
    ...typography.caption,
    color: colors.error,
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  formActionButton: {
    minWidth: 140,
  },
  listSection: {
    gap: spacing.md,
  },
  taskCard: {
    gap: spacing.sm,
  },
  taskTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  taskDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  taskMeta: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  taskActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  taskActionButton: {
    minWidth: 100,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
