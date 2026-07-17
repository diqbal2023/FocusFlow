import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({title, subtitle}: PageHeaderProps) {
  const {colors} = useTheme();
  return (
    <View style={styles.header}>
      <Text style={[styles.title, {color: colors.textPrimary}]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.pageTitle,
  },
  subtitle: {
    ...typography.body,
  },
});
