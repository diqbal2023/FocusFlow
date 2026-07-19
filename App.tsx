/**
 * FocusFlow - Offline productivity desktop app
 *
 * @format
 */

import {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Sidebar, type ScreenId} from './src/components/Sidebar';
import {ThemeProvider, useTheme} from './src/context/ThemeContext';
import {
  settingsManager,
  type SettingsManager,
} from './src/managers/SettingsManager';
import {FocusScreen} from './src/screens/FocusScreen';
import {GoalsScreen} from './src/screens/GoalsScreen';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {StatisticsScreen} from './src/screens/StatisticsScreen';
import {TasksScreen} from './src/screens/TasksScreen';

const SCREEN_COMPONENTS: Record<ScreenId, () => React.JSX.Element> = {
  tasks: TasksScreen,
  focus: FocusScreen,
  statistics: StatisticsScreen,
  goals: GoalsScreen,
  settings: SettingsScreen,
};

function AppContent({manager}: {manager: SettingsManager}) {
  const {colors, isDark} = useTheme();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('tasks');
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(
    () => manager.getCurrent().onboardingCompleted,
  );
  const ActiveScreenComponent = SCREEN_COMPONENTS[activeScreen];

  useEffect(() => {
    let mounted = true;
    settingsLoad();
    const unsubscribe = manager.subscribe(settings => {
      if (mounted) {
        setOnboardingCompleted(settings.onboardingCompleted);
      }
    });
    return () => {
      mounted = false;
      unsubscribe();
    };

    async function settingsLoad() {
      try {
        const loaded = await manager.load();
        if (mounted) {
          setOnboardingCompleted(loaded.onboardingCompleted);
        }
      } catch (error) {
        if (mounted) {
          setStartupError(
            error instanceof Error
              ? error.message
              : 'Settings could not be loaded.',
          );
          // Prefer the main app with defaults when storage cannot load; do not
          // force first-launch setup on a failed database open (e.g. Jest).
          setOnboardingCompleted(true);
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }
  }, [manager]);

  if (!ready) {
    return (
      <View style={[styles.loading, {backgroundColor: colors.background}]}>
        <ActivityIndicator />
        <Text style={{color: colors.textPrimary}}>Loading settings…</Text>
      </View>
    );
  }

  const showOnboarding = !startupError && !onboardingCompleted;

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {startupError ? (
        <Text
          testID="settings-startup-warning"
          style={[
            styles.warning,
            {color: colors.error, backgroundColor: colors.surface},
          ]}>
          {startupError} Defaults are active.
        </Text>
      ) : null}
      {showOnboarding ? (
        <View style={[styles.app, {backgroundColor: colors.background}]}>
          <View style={[styles.main, styles.onboardingMain, {backgroundColor: colors.surface}]}>
            <OnboardingScreen manager={manager} />
          </View>
        </View>
      ) : (
        <View style={[styles.app, {backgroundColor: colors.background}]}>
          <Sidebar activeScreen={activeScreen} onSelect={setActiveScreen} />
          <View style={[styles.main, {backgroundColor: colors.surface}]}>
            <ActiveScreenComponent />
          </View>
        </View>
      )}
    </>
  );
}

function App({
  manager = settingsManager,
}: {
  manager?: SettingsManager;
} = {}) {
  return (
    <SafeAreaProvider>
      <ThemeProvider manager={manager}>
        <AppContent manager={manager} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  warning: {
    padding: 8,
    textAlign: 'center',
  },
  app: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 768,
  },
  main: {
    flex: 1,
    minWidth: 784,
  },
  onboardingMain: {
    minWidth: 0,
  },
});

export default App;
