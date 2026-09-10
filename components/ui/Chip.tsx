import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  size?: 'sm' | 'md';
}

export function Chip({
  label,
  icon,
  selected = false,
  onPress,
  count,
  size = 'md',
}: ChipProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.base,
        styles[`size_${size}`],
        selected && styles.selected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, styles[`label_${size}`], selected && styles.labelSelected]}>
        {label}
      </Text>
      {count !== undefined && (
        <Text style={[styles.count, selected && styles.countSelected]}>{count}</Text>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 32,
  },
  size_md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 40,
  },
  selected: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  label_sm: {
    fontSize: fontSize.xs,
  },
  label_md: {
    fontSize: fontSize.sm,
  },
  labelSelected: {
    color: colors.text.white,
  },
  count: {
    marginLeft: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.text.gray,
  },
  countSelected: {
    color: colors.text.white,
    opacity: 0.8,
  },
});
