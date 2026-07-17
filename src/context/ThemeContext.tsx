import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Appearance, useColorScheme} from 'react-native';
import {darkColors, lightColors, type ColorTokens} from '../constants/colors';
import {settingsManager, type SettingsManager} from '../managers/SettingsManager';
import type {ThemePreference} from '../models/AppSettings';

type ThemeValue = {
  preference: ThemePreference;
  isDark: boolean;
  colors: ColorTokens;
};

const ThemeContext = createContext<ThemeValue>({
  preference: 'system',
  isDark: false,
  colors: lightColors,
});

export function ThemeProvider({
  children,
  manager = settingsManager,
}: {
  children: React.ReactNode;
  manager?: SettingsManager;
}) {
  const systemScheme = useColorScheme() ?? Appearance.getColorScheme();
  const [preference, setPreference] = useState(
    manager.getCurrent().appearance.theme,
  );

  useEffect(
    () =>
      manager.subscribe(settings => {
        setPreference(settings.appearance.theme);
      }),
    [manager],
  );

  const value = useMemo<ThemeValue>(() => {
    const isDark =
      preference === 'dark' ||
      (preference === 'system' && systemScheme === 'dark');
    return {
      preference,
      isDark,
      colors: isDark ? darkColors : lightColors,
    };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
