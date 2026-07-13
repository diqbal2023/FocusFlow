import {StyleSheet, Text, View} from 'react-native';
import {AppCard} from '../components/AppCard';
import {PageHeader} from '../components/PageHeader';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <PageHeader
        title="Settings"
        subtitle="Customize your FocusFlow experience."
      />
      <AppCard>
        <Text style={styles.cardText}>
          Application settings will appear here.
        </Text>
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
