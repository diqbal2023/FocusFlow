import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../constants/colors';
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
  return (
    <View style={styles.sidebar}>
      <View style={styles.header}>
        <Text style={styles.appName}>FocusFlow</Text>
        <Text style={styles.appTagline}>Stay focused. Get things done.</Text>
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
                isActive && styles.navItemActive,
                pressed && !isActive && styles.navItemPressed,
              ]}>
              <Text
                style={[styles.navLabel, isActive && styles.navLabelActive]}>
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
    backgroundColor: colors.sidebarBackground,
    borderRightWidth: 1,
    borderRightColor: colors.sidebarBorder,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  appName: {
    ...typography.appTitle,
    color: colors.sidebarTextActive,
    marginBottom: spacing.xs,
  },
  appTagline: {
    ...typography.caption,
    color: colors.sidebarTextMuted,
  },
  nav: {
    gap: spacing.xs,
  },
  navItem: {
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  navItemActive: {
    backgroundColor: colors.sidebarItemActive,
  },
  navItemPressed: {
    backgroundColor: colors.sidebarItemPressed,
  },
  navLabel: {
    ...typography.bodyMedium,
    color: colors.sidebarText,
  },
  navLabelActive: {
    color: colors.sidebarTextActive,
    fontWeight: '600',
  },
});
