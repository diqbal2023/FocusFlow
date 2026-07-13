import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {colors} from '../constants/colors';
import {spacing} from '../constants/spacing';

type AppCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppCard({children, style, testID}: AppCardProps) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.xl,
  },
});
