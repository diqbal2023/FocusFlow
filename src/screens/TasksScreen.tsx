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
import type {Task, TaskPriority} from '../types/task';
import {
  validateTaskInput,
  type TaskValidationErrors,
} from '../utils/taskValidation';

type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  estimatedDurationMinutes: string;
  labels: string;
  parentTaskId: string;
};

const EMPTY_FORM: TaskFormState = {
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
    dueDate: '2026-07-20',
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
    dueDate: '2026-07-15',
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
    dueDate: '2026-07-12',
    estimatedDurationMinutes: '90',
    labels: 'learning, coding',
    parentTaskId: null,
  },
];

function createTaskId(): string {
  return `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function labelsToStorage(labels: string[]): string {
  return labels.join(', ');
}

export function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [errors, setErrors] = useState<TaskValidationErrors>({});

  const formTitle = useMemo(
    () => (editingTaskId ? 'Edit Task' : 'Add Task'),
    [editingTaskId],
  );

  const updateField = <K extends keyof TaskFormState>(
    key: K,
    value: TaskFormState[K],
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

  const clearForm = () => {
    setForm(EMPTY_FORM);
    setEditingTaskId(null);
    setErrors({});
  };

  const startAddTask = () => {
    clearForm();
    setIsFormVisible(true);
  };

  const saveTask = () => {
    const result = validateTaskInput({
      title: form.title,
      description: form.description,
      priority: form.priority,
      estimatedDuration: form.estimatedDurationMinutes,
      labels: form.labels,
      dueDate: form.dueDate,
    });

    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    const {
      title,
      description,
      priority,
      estimatedDuration,
      labels,
      dueDate,
    } = result.sanitizedData;

    const labelsStored = labelsToStorage(labels);

    if (editingTaskId) {
      setTasks(current =>
        current.map(task =>
          task.id === editingTaskId
            ? {
                ...task,
                title,
                description,
                priority,
                dueDate,
                estimatedDurationMinutes: estimatedDuration,
                labels: labelsStored,
                parentTaskId: form.parentTaskId.trim() || null,
              }
            : task,
        ),
      );
    } else {
      const newTask: Task = {
        id: createTaskId(),
        title,
        description,
        priority,
        status: 'Pending',
        dueDate,
        estimatedDurationMinutes: estimatedDuration,
        labels: labelsStored,
        parentTaskId: form.parentTaskId.trim() || null,
      };
      setTasks(current => [newTask, ...current]);
    }

    clearForm();
  };

  const editTask = (task: Task) => {
    setEditingTaskId(task.id);
    setIsFormVisible(true);
    setErrors({});
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      labels: task.labels,
      parentTaskId: task.parentTaskId ?? '',
    });
  };

  const completeTask = (taskId: string) => {
    setTasks(current =>
      current.map(task =>
        task.id === taskId ? {...task, status: 'Completed'} : task,
      ),
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(current => current.filter(task => task.id !== taskId));
    if (editingTaskId === taskId) {
      clearForm();
    }
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
        <AppButton
          title="Add Task"
          onPress={startAddTask}
          testID="add-task-button"
          style={styles.addButton}
        />
      </View>

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
            onChange={priority => updateField('priority', priority)}
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
            placeholder="YYYY-MM-DD"
            error={errors.dueDate}
            testID="task-due-date-input"
          />
          <AppInput
            label="Estimated Duration (minutes)"
            value={form.estimatedDurationMinutes}
            onChangeText={text => updateField('estimatedDurationMinutes', text)}
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
          tasks.map(task => (
            <AppCard
              key={task.id}
              style={styles.taskCard}
              testID={`task-card-${task.id}`}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {task.description ? (
                <Text style={styles.taskDescription}>{task.description}</Text>
              ) : null}
              <Text style={styles.taskMeta}>Priority: {task.priority}</Text>
              <Text
                style={styles.taskMeta}
                testID={`task-status-${task.id}`}>
                Status: {task.status}
              </Text>
              {task.dueDate ? (
                <Text style={styles.taskMeta}>Due: {task.dueDate}</Text>
              ) : null}
              {task.labels ? (
                <Text style={styles.taskMeta}>Labels: {task.labels}</Text>
              ) : null}

              <View style={styles.taskActions}>
                <AppButton
                  title="Edit"
                  variant="secondary"
                  onPress={() => editTask(task)}
                  testID={`task-edit-${task.id}`}
                  style={styles.taskActionButton}
                />
                <AppButton
                  title="Complete"
                  onPress={() => completeTask(task.id)}
                  testID={`task-complete-${task.id}`}
                  style={styles.taskActionButton}
                />
                <AppButton
                  title="Delete"
                  variant="danger"
                  onPress={() => deleteTask(task.id)}
                  testID={`task-delete-${task.id}`}
                  style={styles.taskActionButton}
                />
              </View>
            </AppCard>
          ))
        )}
      </View>
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
  addButton: {
    minWidth: 120,
    marginTop: spacing.sm,
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
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
