import {useState} from 'react';
import {
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
import {
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type ThemePreference,
} from '../models/AppSettings';

type FormState = {
  workMinutes: string;
  shortBreakMinutes: string;
  longBreakMinutes: string;
  dailyTasks: string;
  dailySessions: string;
  dailyMinutes: string;
  theme: ThemePreference;
  notificationsEnabled: boolean;
};

function toForm(settings: AppSettings): FormState {
  return {
    workMinutes: String(settings.timer.workMinutes),
    shortBreakMinutes: String(settings.timer.shortBreakMinutes),
    longBreakMinutes: String(settings.timer.longBreakMinutes),
    dailyTasks: String(settings.goals.daily.tasks),
    dailySessions: String(settings.goals.daily.focusSessions),
    dailyMinutes: String(settings.goals.daily.focusMinutes),
    theme: settings.appearance.theme,
    notificationsEnabled: settings.general.notificationsEnabled,
  };
}

function parse(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

function fromForm(form: FormState, base: AppSettings): AppSettings {
  return {
    timer: {
      ...base.timer,
      workMinutes: parse(form.workMinutes),
      shortBreakMinutes: parse(form.shortBreakMinutes),
      longBreakMinutes: parse(form.longBreakMinutes),
    },
    goals: {
      daily: {
        tasks: parse(form.dailyTasks),
        focusSessions: parse(form.dailySessions),
        focusMinutes: parse(form.dailyMinutes),
      },
      weekly: {...base.goals.weekly},
    },
    appearance: {theme: form.theme},
    general: {
      ...base.general,
      notificationsEnabled: form.notificationsEnabled,
    },
    onboardingCompleted: true,
  };
}

const fieldPaths: Record<string, string> = {
  workMinutes: 'timer.workMinutes',
  shortBreakMinutes: 'timer.shortBreakMinutes',
  longBreakMinutes: 'timer.longBreakMinutes',
  dailyTasks: 'goals.daily.tasks',
  dailySessions: 'goals.daily.focusSessions',
  dailyMinutes: 'goals.daily.focusMinutes',
};

type OnboardingScreenProps = {
  manager?: SettingsManager;
  onComplete?: () => void;
};

/**
 * Lightweight first-launch productivity setup.
 * Shown only when settings.onboardingCompleted is false.
 */
export function OnboardingScreen({
  manager = settingsManager,
  onComplete,
}: OnboardingScreenProps = {}) {
  const {colors} = useTheme();
  const [form, setForm] = useState(() => toForm(manager.getCurrent()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(current => ({...current, [field]: value}));
    setErrors(current => {
      const next = {...current};
      delete next[fieldPaths[field] ?? field];
      return next;
    });
    setMessage(null);
  };

  const finish = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      const base = manager.getCurrent();
      await manager.save(fromForm(form, base));
      onComplete?.();
    } catch (error) {
      if (error instanceof SettingsValidationError) {
        setErrors(error.fieldErrors);
      } else {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Setup could not be saved.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <ScrollView
      testID="onboarding-screen"
      style={[styles.container, {backgroundColor: colors.surfaceMuted}]}
      contentContainerStyle={styles.content}>
      <PageHeader
        title="Welcome to FocusFlow"
        subtitle="Set your initial productivity preferences. You can change these anytime in Settings."
      />

      <AppCard style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
          Focus timer
        </Text>
        <View style={styles.grid}>
          {numberInput('workMinutes', 'Work minutes', 'onboarding-work-minutes')}
          {numberInput(
            'shortBreakMinutes',
            'Short break minutes',
            'onboarding-short-break-minutes',
          )}
          {numberInput(
            'longBreakMinutes',
            'Long break minutes',
            'onboarding-long-break-minutes',
          )}
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
          Daily goals
        </Text>
        <Text style={[styles.help, {color: colors.textSecondary}]}>
          Defaults: {DEFAULT_APP_SETTINGS.goals.daily.tasks} tasks,{' '}
          {DEFAULT_APP_SETTINGS.goals.daily.focusSessions} sessions,{' '}
          {DEFAULT_APP_SETTINGS.goals.daily.focusMinutes} minutes. Weekly targets
          stay at their defaults until you edit them in Settings or Goals.
        </Text>
        <View style={styles.grid}>
          {numberInput('dailyTasks', 'Tasks', 'onboarding-daily-tasks')}
          {numberInput('dailySessions', 'Sessions', 'onboarding-daily-sessions')}
          {numberInput('dailyMinutes', 'Minutes', 'onboarding-daily-minutes')}
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
          Theme
        </Text>
        <View style={styles.options}>
          {(['system', 'light', 'dark'] as const).map(theme => (
            <Pressable
              key={theme}
              testID={`onboarding-theme-${theme}`}
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
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>
          Notifications
        </Text>
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, {color: colors.textPrimary}]}>
            Enable notifications (preference only)
          </Text>
          <Switch
            testID="onboarding-notifications"
            accessibilityLabel="Enable notifications"
            value={form.notificationsEnabled}
            onValueChange={value => update('notificationsEnabled', value)}
          />
        </View>
      </AppCard>

      {message ? (
        <Text
          testID="onboarding-message"
          style={[styles.message, {color: colors.error}]}>
          {message}
        </Text>
      ) : null}

      <AppButton
        title={saving ? 'Saving…' : 'Save and continue'}
        onPress={finish}
        disabled={saving}
        testID="onboarding-finish"
      />
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
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
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
    width: 220,
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
  toggleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    ...typography.body,
    flex: 1,
    paddingRight: spacing.md,
  },
  message: {
    ...typography.body,
  },
});
