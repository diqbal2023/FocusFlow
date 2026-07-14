import {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
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

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>(() => taskManager.getInitialTasks());
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [form, setForm] = useState<TaskFormData>(() =>
    taskManager.clearFormData(),
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isTrashVisible, setIsTrashVisible] = useState(false);
  const [errors, setErrors] = useState<TaskValidationErrors>({});

  const formTitle = useMemo(
    () => (editingTaskId ? 'Edit Task' : 'Add Task'),
    [editingTaskId],
  );

  const updateField = <K extends keyof TaskFormData>(
    key: K,
    value: TaskFormData[K],
  ) => {
    setForm(current => ({...current, [key]: value}));

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

  /** Clears fields but keeps the form open so the user can continue editing. */
  const clearForm = () => {
    resetFormFields();
    setIsFormVisible(true);
  };

  /** Clears fields and hides the form (used after a successful save). */
  const closeForm = () => {
    resetFormFields();
    setIsFormVisible(false);
  };

  const startAddTask = () => {
    resetFormFields();
    setIsTrashVisible(false);
    setIsFormVisible(true);
  };

  const saveTask = () => {
    const result = editingTaskId
      ? taskManager.updateTask(tasks, editingTaskId, form)
      : taskManager.createTask(tasks, form);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setTasks(result.tasks);
    closeForm();
  };

  const editTask = (task: Task) => {
    setEditingTaskId(task.id);
    setIsTrashVisible(false);
    setIsFormVisible(true);
    setErrors({});
    setForm(taskManager.prepareTaskForEditing(task));
  };

  const advanceStatus = (taskId: string) => {
    setTasks(current => taskManager.advanceTaskStatus(current, taskId));
  };

  const deleteTask = (taskId: string) => {
    const result = taskManager.moveToTrash(tasks, deletedTasks, taskId);
    setTasks(result.tasks);
    setDeletedTasks(result.deletedTasks);
    if (editingTaskId === taskId) {
      closeForm();
    }
  };

  const openRecentlyDeleted = () => {
    setDeletedTasks(current =>
      taskManager.purgeExpiredDeletedTasks(current),
    );
    setIsFormVisible(false);
    setIsTrashVisible(true);
  };

  const closeRecentlyDeleted = () => {
    setIsTrashVisible(false);
  };

  const restoreDeletedTask = (taskId: string) => {
    const result = taskManager.restoreTask(tasks, deletedTasks, taskId);
    setTasks(result.tasks);
    setDeletedTasks(result.deletedTasks);
  };

  const permanentlyDeleteTask = (taskId: string) => {
    setDeletedTasks(current =>
      taskManager.permanentlyDeleteTask(current, taskId),
    );
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
                  title="Save Task"
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
