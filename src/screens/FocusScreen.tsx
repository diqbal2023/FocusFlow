import {useEffect, useRef, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AppButton} from '../components/AppButton';
import {AppCard} from '../components/AppCard';
import {PageHeader} from '../components/PageHeader';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';
import {
  sessionManager,
  type SessionSnapshot,
} from '../managers/SessionManager';
import {taskManager} from '../managers/TaskManager';
import type {Task} from '../types/task';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function FocusScreen() {
  const managerRef = useRef(sessionManager);
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(() =>
    managerRef.current.getSnapshot(),
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await taskManager.initialize({seedIfEmpty: true});
        const workspace = await taskManager.loadWorkspace();
        if (!cancelled) {
          setTasks(workspace.tasks);
          setTasksError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setTasksError(
            error instanceof Error
              ? error.message
              : 'Could not load tasks for Focus Session.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setSnapshot(managerRef.current.tick());
    }, 200);
    return () => clearInterval(id);
  }, []);

  const refresh = () => setSnapshot(managerRef.current.getSnapshot());

  const onStart = () => {
    managerRef.current.start();
    refresh();
  };
  const onPause = () => {
    managerRef.current.pause();
    refresh();
  };
  const onResume = () => {
    managerRef.current.resume();
    refresh();
  };
  const onSkip = () => {
    managerRef.current.skip();
    refresh();
  };
  const onReset = () => {
    managerRef.current.reset();
    refresh();
  };

  const onSelectTask = (task: Task | null) => {
    if (task) {
      managerRef.current.selectTask(task.id, task.title);
    } else {
      managerRef.current.selectTask(null, null);
    }
    setIsTaskPickerOpen(false);
    refresh();
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      testID="focus-screen">
      <PageHeader
        title="Focus Session"
        subtitle="Stay focused with timed work sessions."
      />

      <View style={styles.layout}>
        <AppCard style={styles.timerCard} testID="focus-timer-card">
          <Text style={styles.modeLabel} testID="focus-mode-label">
            {snapshot.modeLabel}
          </Text>
          <Text style={styles.countdown} testID="focus-countdown">
            {formatRemaining(snapshot.remainingMs)}
          </Text>

          <View style={styles.progressTrack} testID="focus-progress-track">
            <View
              style={[
                styles.progressFill,
                {width: `${Math.round(snapshot.progress * 100)}%`},
              ]}
              testID="focus-progress-fill"
            />
          </View>

          <Text style={styles.meta} testID="focus-session-counter">
            Completed work sessions: {snapshot.completedWorkSessions}
          </Text>
          <Text style={styles.meta} testID="focus-break-counter">
            Completed breaks: {snapshot.completedBreaks}
          </Text>
          <Text style={styles.meta} testID="focus-cycle-counter">
            Work sessions this cycle: {snapshot.workSessionsTowardLongBreak}/4
          </Text>
          <Text style={styles.hint}>
            Counters update when a session reaches zero. Skip does not count as
            completed work.
          </Text>

          <View style={styles.controls}>
            <AppButton
              title="Start"
              onPress={onStart}
              disabled={!snapshot.canStart}
              testID="focus-start-button"
              style={styles.controlButton}
            />
            <AppButton
              title="Pause"
              variant="secondary"
              onPress={onPause}
              disabled={!snapshot.canPause}
              testID="focus-pause-button"
              style={styles.controlButton}
            />
            <AppButton
              title="Resume"
              onPress={onResume}
              disabled={!snapshot.canResume}
              testID="focus-resume-button"
              style={styles.controlButton}
            />
            <AppButton
              title="Skip"
              variant="secondary"
              onPress={onSkip}
              disabled={!snapshot.canSkip}
              testID="focus-skip-button"
              style={styles.controlButton}
            />
            <AppButton
              title="Reset"
              variant="danger"
              onPress={onReset}
              disabled={!snapshot.canReset}
              testID="focus-reset-button"
              style={styles.controlButton}
            />
          </View>
        </AppCard>

        <AppCard style={styles.sideCard} testID="focus-task-card">
          <Text style={styles.sectionTitle}>Current task</Text>
          <Text style={styles.currentTask} testID="focus-selected-task">
            {snapshot.selectedTaskTitle ?? 'No task selected'}
          </Text>

          <AppButton
            title={isTaskPickerOpen ? 'Hide task list' : 'Select task'}
            variant="secondary"
            onPress={() => setIsTaskPickerOpen(open => !open)}
            testID="focus-task-selector-button"
            style={styles.selectorToggle}
          />

          {tasksError ? (
            <Text style={styles.errorText}>{tasksError}</Text>
          ) : null}

          {isTaskPickerOpen ? (
            <View style={styles.taskList} testID="focus-task-list">
              <Pressable
                accessibilityRole="button"
                onPress={() => onSelectTask(null)}
                style={styles.taskOption}
                testID="focus-task-option-none">
                <Text style={styles.taskOptionText}>No task</Text>
              </Pressable>
              {tasks.map(task => (
                <Pressable
                  key={task.id}
                  accessibilityRole="button"
                  onPress={() => onSelectTask(task)}
                  style={[
                    styles.taskOption,
                    snapshot.selectedTaskId === task.id &&
                      styles.taskOptionSelected,
                  ]}
                  testID={`focus-task-option-${task.id}`}>
                  <Text style={styles.taskOptionText}>{task.title}</Text>
                  <Text style={styles.taskOptionMeta}>
                    {task.status} · {task.priority}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.modeRow}>
            <Text
              style={[
                styles.modeChip,
                snapshot.mode === 'work' && styles.modeChipActive,
              ]}
              testID="focus-mode-work">
              Work Session
            </Text>
            <Text
              style={[
                styles.modeChip,
                snapshot.mode === 'shortBreak' && styles.modeChipActive,
              ]}
              testID="focus-mode-short-break">
              Short Break
            </Text>
            <Text
              style={[
                styles.modeChip,
                snapshot.mode === 'longBreak' && styles.modeChipActive,
              ]}
              testID="focus-mode-long-break">
              Long Break
            </Text>
          </View>
        </AppCard>
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
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xl,
  },
  timerCard: {
    flexGrow: 1,
    flexBasis: 420,
    gap: spacing.lg,
    alignItems: 'center',
  },
  sideCard: {
    flexGrow: 1,
    flexBasis: 320,
    gap: spacing.md,
  },
  modeLabel: {
    ...typography.sectionTitle,
    color: colors.primary,
  },
  countdown: {
    fontSize: 72,
    lineHeight: 80,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  progressTrack: {
    alignSelf: 'stretch',
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  meta: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    alignSelf: 'stretch',
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  controlButton: {
    minWidth: 110,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  currentTask: {
    ...typography.body,
    color: colors.textPrimary,
  },
  selectorToggle: {
    alignSelf: 'flex-start',
  },
  taskList: {
    gap: spacing.sm,
  },
  taskOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  taskOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  taskOptionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  taskOptionMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modeChip: {
    ...typography.caption,
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeChipActive: {
    color: colors.primary,
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
});
