import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';
import type {TaskPriority} from '../types/task';

const PRIORITY_OPTIONS: TaskPriority[] = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

type PrioritySelectProps = {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  testID?: string;
};

export function PrioritySelect({
  value,
  onChange,
  testID = 'priority-select',
}: PrioritySelectProps) {
  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.options}>
        {PRIORITY_OPTIONS.map(option => {
          const selected = option === value;

          return (
            <Pressable
              key={option}
              testID={`${testID}-${option.toLowerCase()}`}
              accessibilityRole="button"
              accessibilityState={{selected}}
              onPress={() => onChange(option)}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text
                style={[
                  styles.optionText,
                  selected && styles.optionTextSelected,
                ]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: '600',
  },
});
