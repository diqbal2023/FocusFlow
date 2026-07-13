/**
 * FocusFlow - Offline productivity desktop app
 *
 * @format
 */

import {useState} from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Sidebar, type ScreenId} from './src/components/Sidebar';
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

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('tasks');
  const ActiveScreenComponent = SCREEN_COMPONENTS[activeScreen];

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <View style={styles.app}>
        <Sidebar activeScreen={activeScreen} onSelect={setActiveScreen} />
        <View style={styles.main}>
          <ActiveScreenComponent />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 768,
    backgroundColor: '#F3F4F6',
  },
  main: {
    flex: 1,
    minWidth: 784,
    backgroundColor: '#FFFFFF',
  },
});

export default App;
