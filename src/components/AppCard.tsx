import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {spacing} from '../constants/spacing';

type AppCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppCard({children, style, testID}: AppCardProps) {
  const {colors} = useTheme();
  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {backgroundColor: colors.surface, borderColor: colors.border},
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.xl,
  },
});
