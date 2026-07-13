import {Pressable, StyleSheet, Text, View} from 'react-native';

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
    backgroundColor: '#1F2937',
    borderRightWidth: 1,
    borderRightColor: '#374151',
    paddingTop: 24,
    paddingHorizontal: 12,
  },
  header: {
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  appName: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  appTagline: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 18,
  },
  nav: {
    gap: 4,
  },
  navItem: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  navItemActive: {
    backgroundColor: '#2563EB',
  },
  navItemPressed: {
    backgroundColor: '#374151',
  },
  navLabel: {
    color: '#D1D5DB',
    fontSize: 15,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
