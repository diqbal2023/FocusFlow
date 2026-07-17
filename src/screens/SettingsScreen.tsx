import {useEffect, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {AppButton} from '../components/AppButton';
import {AppCard} from '../components/AppCard';
import {AppInput} from '../components/AppInput';
import {PageHeader} from '../components/PageHeader';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';
import {useTheme} from '../context/ThemeContext';
import {
  settingsManager,
  SettingsValidationError,
  type SettingsManager,
} from '../managers/SettingsManager';
import type {AppSettings, ThemePreference} from '../models/AppSettings';

type FormState = {
  workMinutes: string;
  shortBreakMinutes: string;
  longBreakMinutes: string;
  longBreakInterval: string;
  dailyTasks: string;
  dailySessions: string;
  dailyMinutes: string;
  weeklyTasks: string;
  weeklySessions: string;
  weeklyMinutes: string;
  autoStartBreaks: boolean;
  autoStartWorkSessions: boolean;
  theme: ThemePreference;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  confirmBeforeDeletingTasks: boolean;
  showCompletedTasks: boolean;
};

function toForm(settings: AppSettings): FormState {
  return {
    workMinutes: String(settings.timer.workMinutes),
    shortBreakMinutes: String(settings.timer.shortBreakMinutes),
    longBreakMinutes: String(settings.timer.longBreakMinutes),
    longBreakInterval: String(settings.timer.longBreakInterval),
    dailyTasks: String(settings.goals.daily.tasks),
    dailySessions: String(settings.goals.daily.focusSessions),
    dailyMinutes: String(settings.goals.daily.focusMinutes),
    weeklyTasks: String(settings.goals.weekly.tasks),
    weeklySessions: String(settings.goals.weekly.focusSessions),
    weeklyMinutes: String(settings.goals.weekly.focusMinutes),
    autoStartBreaks: settings.timer.autoStartBreaks,
    autoStartWorkSessions: settings.timer.autoStartWorkSessions,
    theme: settings.appearance.theme,
    ...settings.general,
  };
}

function parse(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

function fromForm(form: FormState): AppSettings {
  return {
    timer: {
      workMinutes: parse(form.workMinutes),
      shortBreakMinutes: parse(form.shortBreakMinutes),
      longBreakMinutes: parse(form.longBreakMinutes),
      longBreakInterval: parse(form.longBreakInterval),
      autoStartBreaks: form.autoStartBreaks,
      autoStartWorkSessions: form.autoStartWorkSessions,
    },
    goals: {
      daily: {
        tasks: parse(form.dailyTasks),
        focusSessions: parse(form.dailySessions),
        focusMinutes: parse(form.dailyMinutes),
      },
      weekly: {
        tasks: parse(form.weeklyTasks),
        focusSessions: parse(form.weeklySessions),
        focusMinutes: parse(form.weeklyMinutes),
      },
    },
    appearance: {theme: form.theme},
    general: {
      notificationsEnabled: form.notificationsEnabled,
      soundEnabled: form.soundEnabled,
      confirmBeforeDeletingTasks: form.confirmBeforeDeletingTasks,
      showCompletedTasks: form.showCompletedTasks,
    },
  };
}

const fieldPaths: Record<string, string> = {
  workMinutes: 'timer.workMinutes',
  shortBreakMinutes: 'timer.shortBreakMinutes',
  longBreakMinutes: 'timer.longBreakMinutes',
  longBreakInterval: 'timer.longBreakInterval',
  dailyTasks: 'goals.daily.tasks',
  dailySessions: 'goals.daily.focusSessions',
  dailyMinutes: 'goals.daily.focusMinutes',
  weeklyTasks: 'goals.weekly.tasks',
  weeklySessions: 'goals.weekly.focusSessions',
  weeklyMinutes: 'goals.weekly.focusMinutes',
};

export function SettingsScreen(
  {
    manager = settingsManager,
  }: {
  manager?: SettingsManager;
  } = {},
) {
  const {colors} = useTheme();
  const [form, setForm] = useState(() => toForm(manager.getCurrent()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(
    () => manager.subscribe(next => setForm(toForm(next))),
    [manager],
  );

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(current => ({...current, [field]: value}));
    setErrors(current => {
      const next = {...current};
      delete next[fieldPaths[field] ?? field];
      return next;
    });
    setMessage(null);
  };

  const save = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      await manager.save(fromForm(form));
      setMessage('Settings saved.');
    } catch (error) {
      if (error instanceof SettingsValidationError) {
        setErrors(error.fieldErrors);
      } else {
        setMessage(error instanceof Error ? error.message : 'Settings could not be saved.');
      }
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      const defaults = await manager.reset();
      setForm(toForm(defaults));
      setErrors({});
      setMessage('Defaults restored. Productivity data was not changed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Settings could not be reset.');
    } finally {
      setSaving(false);
    }
  };

  const confirmReset = () =>
    Alert.alert(
      'Restore default settings?',
      'This changes preferences only. Tasks, sessions, statistics, and goal progress are preserved.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Restore Defaults', style: 'destructive', onPress: reset},
      ],
    );

  const numberInput = (
    field: keyof FormState,
    label: string,
    testID: string,
  ) => (
    <View style={styles.field}>
      <AppInput
        label={label}
        value={String(form[field])}
        onChangeText={value => update(field, value as never)}
        error={errors[fieldPaths[field]]}
        testID={testID}
      />
    </View>
  );

  const toggle = (
    field: keyof FormState,
    label: string,
    testID: string,
  ) => (
    <View style={styles.toggleRow}>
      <Text style={[styles.toggleLabel, {color: colors.textPrimary}]}>{label}</Text>
      <Switch
        testID={testID}
        accessibilityLabel={label}
        value={Boolean(form[field])}
        onValueChange={value => update(field, value as never)}
      />
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.surfaceMuted}]}
      contentContainerStyle={styles.content}>
      <PageHeader
        title="Settings"
        subtitle="Customize your FocusFlow experience."
      />
      <AppCard style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Timer</Text>
        <View style={styles.grid}>
          {numberInput('workMinutes', 'Work minutes (1–180)', 'settings-work-minutes')}
          {numberInput('shortBreakMinutes', 'Short break minutes (1–60)', 'settings-short-break-minutes')}
          {numberInput('longBreakMinutes', 'Long break minutes (1–120)', 'settings-long-break-minutes')}
          {numberInput('longBreakInterval', 'Work sessions before long break (1–10)', 'settings-long-break-interval')}
        </View>
        {toggle('autoStartBreaks', 'Automatically start breaks', 'settings-auto-breaks')}
        {toggle('autoStartWorkSessions', 'Automatically start work sessions', 'settings-auto-work')}
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Goals</Text>
        <Text style={[styles.help, {color: colors.textSecondary}]}>
          Whole numbers only. Zero means the target is immediately fulfilled.
        </Text>
        <Text style={[styles.subheading, {color: colors.textPrimary}]}>Daily</Text>
        <View style={styles.grid}>
          {numberInput('dailyTasks', 'Tasks (0–10,000)', 'settings-daily-tasks')}
          {numberInput('dailySessions', 'Sessions (0–10,000)', 'settings-daily-sessions')}
          {numberInput('dailyMinutes', 'Minutes (0–100,000)', 'settings-daily-minutes')}
        </View>
        <Text style={[styles.subheading, {color: colors.textPrimary}]}>Weekly</Text>
        <View style={styles.grid}>
          {numberInput('weeklyTasks', 'Tasks (0–10,000)', 'settings-weekly-tasks')}
          {numberInput('weeklySessions', 'Sessions (0–10,000)', 'settings-weekly-sessions')}
          {numberInput('weeklyMinutes', 'Minutes (0–100,000)', 'settings-weekly-minutes')}
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Appearance</Text>
        <View style={styles.options}>
          {(['system', 'light', 'dark'] as const).map(theme => (
            <Pressable
              key={theme}
              testID={`settings-theme-${theme}`}
              accessibilityRole="radio"
              accessibilityState={{selected: form.theme === theme}}
              onPress={() => update('theme', theme)}
              style={[
                styles.option,
                {borderColor: colors.borderStrong},
                form.theme === theme && {backgroundColor: colors.primaryMuted},
              ]}>
              <Text style={[styles.optionText, {color: colors.textPrimary}]}>
                {theme[0].toUpperCase() + theme.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>General</Text>
        {toggle('notificationsEnabled', 'Enable notifications (preference only)', 'settings-notifications')}
        {toggle('soundEnabled', 'Enable sounds', 'settings-sound')}
        {toggle('confirmBeforeDeletingTasks', 'Confirm before deleting tasks', 'settings-confirm-delete')}
        {toggle('showCompletedTasks', 'Show completed tasks', 'settings-show-completed')}
      </AppCard>

      {message ? (
        <Text
          testID="settings-message"
          style={[styles.message, {color: colors.textSecondary}]}>
          {message}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <AppButton
          title={saving ? 'Saving…' : 'Save Settings'}
          onPress={save}
          disabled={saving}
          testID="settings-save"
        />
        <AppButton
          title="Restore Defaults"
          onPress={confirmReset}
          disabled={saving}
          variant="secondary"
          testID="settings-reset"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
  },
  subheading: {
    ...typography.bodyMedium,
    marginTop: spacing.sm,
  },
  help: {
    ...typography.body,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  field: {
    width: 250,
  },
  toggleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    ...typography.body,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  option: {
    minWidth: 120,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: {
    ...typography.bodyMedium,
  },
  message: {
    ...typography.body,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
