import {useCallback, useEffect, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {AppButton} from '../components/AppButton';
import {AppCard} from '../components/AppCard';
import {PageHeader} from '../components/PageHeader';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';
import {statisticsEngine} from '../managers/StatisticsEngine';
import type {
  DailyProductivity,
  StatisticsDashboard,
} from '../models/DailyProductivity';

type DisplayPeriod = 'daily' | 'weekly';

function shiftDate(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function formatMinutes(minutes: number): string {
  return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
}

function historyColor(day: DailyProductivity): string {
  if (!day.hasActivity) {
    return colors.border;
  }
  if (day.score >= 85) {
    return colors.primaryPressed;
  }
  if (day.score >= 70) {
    return colors.primary;
  }
  if (day.score >= 50) {
    return '#60A5FA';
  }
  return colors.primaryMuted;
}

function MetricCard({label, value}: {label: string; value: string}) {
  return (
    <AppCard style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </AppCard>
  );
}

export function StatisticsScreen() {
  const [period, setPeriod] = useState<DisplayPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [dashboard, setDashboard] = useState<StatisticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await statisticsEngine.refresh(selectedDate);
      if (mounted.current) {
        setDashboard(next);
        setError(null);
      }
    } catch (refreshError) {
      if (mounted.current) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : 'Statistics could not be refreshed.',
        );
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (active) {
        await refresh();
      }
    };
    void run();
    const interval = setInterval(() => void run(), 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refresh]);

  const activeDaily = dashboard?.daily;
  const weekly = dashboard?.weekly;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      testID="statistics-screen">
      <PageHeader
        title="Statistics"
        subtitle="Review your productivity patterns."
      />

      <View style={styles.toolbar}>
        <View style={styles.buttonRow}>
          <AppButton
            title="Daily"
            variant={period === 'daily' ? 'primary' : 'secondary'}
            onPress={() => setPeriod('daily')}
            testID="statistics-daily"
          />
          <AppButton
            title="Weekly"
            variant={period === 'weekly' ? 'primary' : 'secondary'}
            onPress={() => setPeriod('weekly')}
            testID="statistics-weekly"
          />
        </View>
        <View style={styles.buttonRow}>
          <AppButton
            title="Previous"
            variant="secondary"
            onPress={() =>
              setSelectedDate(current =>
                shiftDate(current, period === 'daily' ? -1 : -7),
              )
            }
          />
          <AppButton
            title="Today"
            variant="secondary"
            onPress={() => setSelectedDate(new Date())}
          />
          <AppButton
            title="Next"
            variant="secondary"
            onPress={() =>
              setSelectedDate(current =>
                shiftDate(current, period === 'daily' ? 1 : 7),
              )
            }
          />
        </View>
      </View>

      {loading ? (
        <AppCard testID="statistics-loading">
          <Text style={styles.secondaryText}>Loading statistics…</Text>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard testID="statistics-error">
          <Text style={styles.errorText}>{error}</Text>
          <AppButton
            title="Retry"
            onPress={() => void refresh()}
            style={styles.retryButton}
          />
        </AppCard>
      ) : null}

      {!loading && !error && dashboard && activeDaily && weekly ? (
        <>
          <AppCard style={styles.scoreCard} testID="statistics-score">
            <View style={styles.scoreRow}>
              <View>
                <Text style={styles.eyebrow}>
                  {period === 'daily'
                    ? activeDaily.date
                    : `${weekly.weekStart} – ${weekly.weekEnd}`}
                </Text>
                <Text style={styles.score}>
                  {period === 'daily'
                    ? `${activeDaily.score}%`
                    : `${weekly.averageScore}%`}
                </Text>
                <Text style={styles.category}>
                  {period === 'daily'
                    ? activeDaily.category
                    : 'Weekly average'}
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakValue}>{dashboard.streak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
            <Text style={styles.message}>
              {period === 'daily'
                ? activeDaily.message
                : `${weekly.productiveDays} productive days this week.`}
            </Text>
          </AppCard>

          <View style={styles.metricGrid}>
            <MetricCard
              label="Tasks completed"
              value={String(
                period === 'daily'
                  ? activeDaily.completedTasks
                  : weekly.completedTasks,
              )}
            />
            <MetricCard
              label="Focus sessions"
              value={String(
                period === 'daily'
                  ? activeDaily.completedFocusSessions
                  : weekly.completedFocusSessions,
              )}
            />
            <MetricCard
              label="Focus minutes"
              value={formatMinutes(
                period === 'daily'
                  ? activeDaily.focusMinutes
                  : weekly.focusMinutes,
              )}
            />
            <MetricCard
              label="Break minutes"
              value={formatMinutes(
                period === 'daily'
                  ? activeDaily.breakMinutes
                  : weekly.breakMinutes,
              )}
            />
          </View>

          {period === 'weekly' ? (
            <AppCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Weekly summary</Text>
              <Text style={styles.secondaryText}>
                Best day:{' '}
                {weekly.bestDay
                  ? `${weekly.bestDay.date} (${weekly.bestDay.score}%)`
                  : 'No active days yet'}
              </Text>
              <View style={styles.weekRow}>
                {weekly.days.map(day => (
                  <View key={day.date} style={styles.weekDay}>
                    <Text style={styles.weekDayLabel}>
                      {day.date.slice(5)}
                    </Text>
                    <Text style={styles.weekDayScore}>{day.score}%</Text>
                  </View>
                ))}
              </View>
            </AppCard>
          ) : null}

          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>90-day activity</Text>
            <Text style={styles.secondaryText}>
              Each square is one calendar day. Darker squares indicate higher
              productivity scores.
            </Text>
            <View style={styles.historyGrid} testID="statistics-history-grid">
              {dashboard.history.map(day => (
                <View
                  key={day.date}
                  accessibilityLabel={`${day.date}: ${day.score}%`}
                  style={[
                    styles.historyCell,
                    {backgroundColor: historyColor(day)},
                  ]}
                />
              ))}
            </View>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recent history</Text>
            {dashboard.history
              .filter(day => day.hasActivity)
              .slice(-7)
              .reverse()
              .map(day => (
                <View key={day.date} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{day.date}</Text>
                  <Text style={styles.historyDetail}>
                    {day.completedTasks} tasks · {day.completedFocusSessions}{' '}
                    sessions · {day.score}%
                  </Text>
                </View>
              ))}
            {!dashboard.history.some(day => day.hasActivity) ? (
              <Text style={styles.secondaryText}>
                No runtime completion history yet. Complete a task or timer
                session to begin.
              </Text>
            ) : null}
          </AppCard>

          <Text style={styles.sourceNote}>
            Dated statistics include completions recorded during this app run.
            {` ${dashboard.existingCompletedTaskSnapshot}`} stored completed
            task(s) exist as an undated current snapshot and are not assigned
            to historical days.
          </Text>
        </>
      ) : null}
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
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  scoreCard: {
    gap: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.label,
    color: colors.textSecondary,
  },
  score: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '700',
    color: colors.primary,
  },
  category: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
  streakBadge: {
    minWidth: 112,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.primary,
  },
  streakLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 180,
    gap: spacing.xs,
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  secondaryText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
  },
  weekRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekDay: {
    flexGrow: 1,
    minWidth: 76,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  weekDayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  weekDayScore: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    maxWidth: 416,
  },
  historyCell: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  historyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  historyDetail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sourceNote: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
