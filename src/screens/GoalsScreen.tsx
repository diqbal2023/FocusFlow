import {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../components/AppButton';
import {AppCard} from '../components/AppCard';
import {AppInput} from '../components/AppInput';
import {PageHeader} from '../components/PageHeader';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';
import {goalManager} from '../managers/GoalManager';
import type {
  GoalPeriod,
  GoalPeriodProgress,
  GoalsProgress,
  GoalTargets,
} from '../models/Goal';

type TargetForm = Record<keyof GoalTargets, string>;

function targetsToForm(targets: GoalTargets): TargetForm {
  return {
    tasks: String(targets.tasks),
    focusSessions: String(targets.focusSessions),
    focusMinutes: String(targets.focusMinutes),
  };
}

function GoalSection({
  progress,
  form,
  onChange,
  onSave,
}: {
  progress: GoalPeriodProgress;
  form: TargetForm;
  onChange: (field: keyof GoalTargets, value: string) => void;
  onSave: () => void;
}) {
  return (
    <View style={styles.section} testID={`goals-${progress.period}-section`}>
      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionTitle}>{progress.title}</Text>
          <Text style={styles.sectionSummary}>
            {progress.formattedProgress}
          </Text>
        </View>
        <View style={styles.overallBadge}>
          <Text style={styles.overallPercentage}>
            {progress.overallPercentage}%
          </Text>
          <Text style={styles.overallStatus}>{progress.status}</Text>
        </View>
      </View>

      {progress.completionMessage ? (
        <Text
          style={styles.completionMessage}
          testID={`goals-${progress.period}-completion`}>
          {progress.completionMessage}
        </Text>
      ) : null}

      <View style={styles.metricGrid}>
        {progress.metrics.map(metric => (
          <AppCard
            key={metric.metric}
            style={styles.metricCard}
            testID={`goals-${progress.period}-${metric.metric}`}>
            <View style={styles.metricHeading}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricPercentage}>
                {metric.percentage}%
              </Text>
            </View>
            <Text style={styles.metricProgress}>
              {metric.formattedProgress}
            </Text>
            <View style={styles.progressTrack}>
              <View
                testID={`goals-${progress.period}-${metric.metric}-bar`}
                style={[
                  styles.progressFill,
                  {width: `${metric.percentage}%`},
                ]}
              />
            </View>
            <Text style={styles.metricDetail}>
              Completed: {metric.completed} · Remaining: {metric.remaining}
            </Text>
            <Text
              style={[
                styles.metricStatus,
                metric.isComplete && styles.completeStatus,
              ]}>
              {metric.status}
            </Text>
          </AppCard>
        ))}
      </View>

      <AppCard style={styles.targetCard}>
        <Text style={styles.targetTitle}>Edit {progress.period} targets</Text>
        <View style={styles.targetFields}>
          <View style={styles.targetField}>
            <AppInput
              label="Tasks"
              value={form.tasks}
              onChangeText={value => onChange('tasks', value)}
              testID={`goals-${progress.period}-tasks-input`}
            />
          </View>
          <View style={styles.targetField}>
            <AppInput
              label="Focus sessions"
              value={form.focusSessions}
              onChangeText={value => onChange('focusSessions', value)}
              testID={`goals-${progress.period}-sessions-input`}
            />
          </View>
          <View style={styles.targetField}>
            <AppInput
              label="Focus minutes"
              value={form.focusMinutes}
              onChangeText={value => onChange('focusMinutes', value)}
              testID={`goals-${progress.period}-minutes-input`}
            />
          </View>
        </View>
        <AppButton
          title="Apply Targets"
          onPress={onSave}
          testID={`goals-${progress.period}-apply`}
          style={styles.applyButton}
        />
      </AppCard>
    </View>
  );
}

export function GoalsScreen() {
  const [goals, setGoals] = useState<GoalsProgress>(() =>
    goalManager.getProgress(),
  );
  const [dailyForm, setDailyForm] = useState<TargetForm>(() =>
    targetsToForm(goalManager.getTargets('daily')),
  );
  const [weeklyForm, setWeeklyForm] = useState<TargetForm>(() =>
    targetsToForm(goalManager.getTargets('weekly')),
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let refreshing = false;

    const refresh = async () => {
      if (refreshing) {
        return;
      }
      refreshing = true;
      try {
        const next = await goalManager.refreshFromManagers();
        if (!cancelled) {
          setGoals(next);
          setMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Goal progress could not be refreshed.',
          );
        }
      } finally {
        refreshing = false;
      }
    };

    void refresh();
    const interval = setInterval(() => void refresh(), 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const updateForm = (
    period: GoalPeriod,
    field: keyof GoalTargets,
    value: string,
  ) => {
    const update = (current: TargetForm): TargetForm => ({
      ...current,
      [field]: value,
    });
    if (period === 'daily') {
      setDailyForm(update);
    } else {
      setWeeklyForm(update);
    }
  };

  const applyTargets = (period: GoalPeriod) => {
    const form = period === 'daily' ? dailyForm : weeklyForm;
    try {
      const next = goalManager.setTargets(period, {
        tasks: Number(form.tasks),
        focusSessions: Number(form.focusSessions),
        focusMinutes: Number(form.focusMinutes),
      });
      setGoals(next);
      setMessage(`${period === 'daily' ? 'Daily' : 'Weekly'} targets updated.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Targets could not be updated.',
      );
    }
  };

  const resetGoals = async () => {
    try {
      await goalManager.refreshFromManagers();
      setGoals(goalManager.resetAll());
      setMessage('Daily and weekly progress reset. Targets were preserved.');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Goals could not be reset.',
      );
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      testID="goals-screen">
      <PageHeader
        title="Goals"
        subtitle="Set and monitor productivity goals."
      />

      <AppCard style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Goal summary</Text>
            <Text style={styles.summaryBody} testID="goals-summary">
              {goals.summary}
            </Text>
            <Text style={styles.sourceNote}>
              Uses completed stored tasks and focus sessions completed during
              this app run.
            </Text>
          </View>
          <AppButton
            title="Reset Goals"
            variant="danger"
            onPress={() => void resetGoals()}
            testID="goals-reset"
          />
        </View>
        {message ? (
          <Text style={styles.message} testID="goals-message">
            {message}
          </Text>
        ) : null}
      </AppCard>

      <GoalSection
        progress={goals.daily}
        form={dailyForm}
        onChange={(field, value) => updateForm('daily', field, value)}
        onSave={() => applyTargets('daily')}
      />
      <GoalSection
        progress={goals.weekly}
        form={weeklyForm}
        onChange={(field, value) => updateForm('weekly', field, value)}
        onSave={() => applyTargets('weekly')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  container: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl,
  },
  summaryCard: {
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  summaryText: {
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.xs,
  },
  summaryTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  summaryBody: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  sourceNote: {
    ...typography.caption,
    color: colors.textMuted,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  sectionSummary: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  overallBadge: {
    minWidth: 112,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
  },
  overallPercentage: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.primary,
  },
  overallStatus: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  completionMessage: {
    ...typography.bodyMedium,
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    borderRadius: 8,
    padding: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 250,
    gap: spacing.sm,
  },
  metricHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  metricLabel: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  metricPercentage: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
  metricProgress: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  metricDetail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricStatus: {
    ...typography.caption,
    color: colors.textMuted,
  },
  completeStatus: {
    color: colors.primary,
  },
  targetCard: {
    gap: spacing.md,
  },
  targetTitle: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  targetFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  targetField: {
    flexGrow: 1,
    flexBasis: 180,
  },
  applyButton: {
    alignSelf: 'flex-start',
    minWidth: 150,
  },
});
