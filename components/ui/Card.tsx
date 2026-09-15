import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { borderRadius, spacing, shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  return (
    <View style={[styles.base, styles[variant], styles[`padding_${padding}`], style]}>
      {children}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    base: {
      backgroundColor: colors.background.white,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    default: {
      ...shadows.sm,
    },
    elevated: {
      ...shadows.md,
    },
    outlined: {
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    padding_none: {
      padding: 0,
    },
    padding_sm: {
      padding: spacing.sm,
    },
    padding_md: {
      padding: spacing.md,
    },
    padding_lg: {
      padding: spacing.lg,
    },
  });
