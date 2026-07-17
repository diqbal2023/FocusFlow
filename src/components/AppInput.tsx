import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {spacing} from '../constants/spacing';
import {typography} from '../constants/typography';

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  testID?: string;
  accessibilityLabel?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  testID,
  accessibilityLabel,
  secureTextEntry,
  autoCapitalize,
}: AppInputProps) {
  const {colors} = useTheme();
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: colors.textPrimary}]}>{label}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={accessibilityLabel ?? label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: hasError ? colors.error : colors.borderStrong,
          },
        ]}
      />
      {hasError ? (
        <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  input: {
    ...typography.body,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: {
    ...typography.caption,
  },
});
