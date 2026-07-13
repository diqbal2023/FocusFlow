import {StyleSheet, Text, View} from 'react-native';
import {AppCard} from '../components/AppCard';
import {PageHeader} from '../components/PageHeader';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';

export function FocusScreen() {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Focus Session"
        subtitle="Stay focused with timed work sessions."
      />
      <AppCard>
        <Text style={styles.cardText}>Your focus timer will appear here.</Text>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xxl,
    backgroundColor: colors.surfaceMuted,
  },
  cardText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
