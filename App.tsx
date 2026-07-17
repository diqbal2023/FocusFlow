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
import {settingsManager} from './src/managers/SettingsManager';
import {FocusScreen} from './src/screens/FocusScreen';
import {GoalsScreen} from './src/screens/GoalsScreen';
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

function AppContent() {
  const {colors, isDark} = useTheme();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('tasks');
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const ActiveScreenComponent = SCREEN_COMPONENTS[activeScreen];

  useEffect(() => {
    let mounted = true;
    settingsManager
      .load()
      .catch(error => {
        if (mounted) {
          setStartupError(
            error instanceof Error ? error.message : 'Settings could not be loaded.',
          );
        }
      })
      .finally(() => mounted && setReady(true));
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={[styles.loading, {backgroundColor: colors.background}]}>
        <ActivityIndicator />
        <Text style={{color: colors.textPrimary}}>Loading settings…</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {startupError ? (
        <Text
          testID="settings-startup-warning"
          style={[styles.warning, {color: colors.error, backgroundColor: colors.surface}]}>
          {startupError} Defaults are active.
        </Text>
      ) : null}
      <View style={[styles.app, {backgroundColor: colors.background}]}>
        <Sidebar activeScreen={activeScreen} onSelect={setActiveScreen} />
        <View style={[styles.main, {backgroundColor: colors.surface}]}>
          <ActiveScreenComponent />
        </View>
      </View>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
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
});

export default App;
