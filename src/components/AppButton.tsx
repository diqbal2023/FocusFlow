import {Pressable, StyleSheet, Text, type ViewStyle} from 'react-native';
import {useTheme} from '../context/ThemeContext';
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
  const {colors: themeColors} = useTheme();
  const backgroundColor =
    variant === 'primary'
      ? themeColors.primary
      : variant === 'danger'
        ? themeColors.danger
        : themeColors.secondary;
  const labelColor =
    variant === 'secondary'
      ? themeColors.textPrimary
      : variant === 'danger'
        ? themeColors.textOnDanger
        : themeColors.textOnPrimary;
  const pressedBackgroundColor =
    variant === 'primary'
      ? themeColors.primaryPressed
      : variant === 'danger'
        ? themeColors.dangerPressed
        : themeColors.secondaryPressed;
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
        {
          backgroundColor: disabled
            ? themeColors.disabledBackground
            : backgroundColor,
          borderColor:
            variant === 'secondary'
              ? themeColors.secondaryBorder
              : backgroundColor,
        },
        pressed &&
          !disabled && {
            backgroundColor: pressedBackgroundColor,
            borderColor:
              variant === 'secondary'
                ? themeColors.secondaryBorder
                : pressedBackgroundColor,
          },
        style,
      ]}>
      <Text
        style={[
          styles.label,
          labelByVariant[variant],
          {color: disabled ? themeColors.disabledText : labelColor},
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
  label: {
    ...typography.button,
  },
});

const stylesByVariant = StyleSheet.create({
  primary: {
    borderColor: 'transparent',
  },
  secondary: {
    borderColor: 'transparent',
  },
  danger: {
    borderColor: 'transparent',
  },
});

const labelByVariant = StyleSheet.create({
  primary: {
    color: '#FFFFFF',
  },
  secondary: {
    color: '#111827',
  },
  danger: {
    color: '#FFFFFF',
  },
});
