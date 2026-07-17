import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';

export type ScreenId =
  | 'tasks'
  | 'focus'
  | 'statistics'
  | 'goals'
  | 'settings';

type NavItem = {
  id: ScreenId;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  {id: 'tasks', label: 'Tasks'},
  {id: 'focus', label: 'Focus Session'},
  {id: 'statistics', label: 'Statistics'},
  {id: 'goals', label: 'Goals'},
  {id: 'settings', label: 'Settings'},
];

type SidebarProps = {
  activeScreen: ScreenId;
  onSelect: (screen: ScreenId) => void;
};

export function Sidebar({activeScreen, onSelect}: SidebarProps) {
  const {colors} = useTheme();
  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.sidebarBackground,
          borderRightColor: colors.sidebarBorder,
        },
      ]}>
      <View style={styles.header}>
        <Text style={[styles.appName, {color: colors.sidebarTextActive}]}>
          FocusFlow
        </Text>
        <Text style={[styles.appTagline, {color: colors.sidebarTextMuted}]}>
          Stay focused. Get things done.
        </Text>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === activeScreen;

          return (
            <Pressable
              key={item.id}
              testID={`nav-${item.id}`}
              accessibilityRole="button"
              accessibilityState={{selected: isActive}}
              onPress={() => onSelect(item.id)}
              style={({pressed}) => [
                styles.navItem,
                isActive && {backgroundColor: colors.sidebarItemActive},
                pressed &&
                  !isActive && {backgroundColor: colors.sidebarItemPressed},
              ]}>
              <Text
                style={[
                  styles.navLabel,
                  {color: colors.sidebarText},
                  isActive && {
                    ...styles.navLabelActive,
                    color: colors.sidebarTextActive,
                  },
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    minWidth: 240,
    borderRightWidth: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  appName: {
    ...typography.appTitle,
    marginBottom: spacing.xs,
  },
  appTagline: {
    ...typography.caption,
  },
  nav: {
    gap: spacing.xs,
  },
  navItem: {
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  navLabel: {
    ...typography.bodyMedium,
  },
  navLabelActive: {
    fontWeight: '600',
  },
});
