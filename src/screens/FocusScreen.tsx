import {StyleSheet, Text, View} from 'react-native';

export function FocusScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Focus Session</Text>
      <Text style={styles.subtitle}>
        Start focused work sessions without distractions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
});
