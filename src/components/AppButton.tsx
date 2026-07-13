import {Pressable, StyleSheet, Text, type ViewStyle} from 'react-native';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  testID,
  accessibilityLabel,
  style,
}: AppButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        stylesByVariant[variant],
        pressed && !disabled && pressedByVariant[variant],
        disabled && styles.disabled,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          labelByVariant[variant],
          disabled && styles.labelDisabled,
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.disabledBackground,
    borderColor: colors.disabledBackground,
  },
  label: {
    ...typography.button,
  },
  labelDisabled: {
    color: colors.disabledText,
  },
});

const stylesByVariant = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryBorder,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
});

const pressedByVariant = StyleSheet.create({
  primary: {
    backgroundColor: colors.primaryPressed,
    borderColor: colors.primaryPressed,
  },
  secondary: {
    backgroundColor: colors.secondaryPressed,
  },
  danger: {
    backgroundColor: colors.dangerPressed,
    borderColor: colors.dangerPressed,
  },
});

const labelByVariant = StyleSheet.create({
  primary: {
    color: colors.textOnPrimary,
  },
  secondary: {
    color: colors.textPrimary,
  },
  danger: {
    color: colors.textOnDanger,
  },
});
