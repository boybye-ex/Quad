import React, { forwardRef, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerStyle,
      style,
      ...props
    },
    ref
  ) => {
    const colors = useThemeColors();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const hasError = !!error;

    return (
      <View style={containerStyle}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View
          style={[
            styles.inputContainer,
            hasError && styles.inputContainerError,
            props.editable === false && styles.inputContainerDisabled,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              leftIcon ? styles.inputWithLeftIcon : undefined,
              rightIcon ? styles.inputWithRightIcon : undefined,
              style,
            ]}
            placeholderTextColor={colors.text.light}
            {...props}
          />
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text.dark,
      marginBottom: spacing.sm,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.white,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.DEFAULT,
      minHeight: 48,
    },
    inputContainerError: {
      borderColor: colors.accent.red,
    },
    inputContainerDisabled: {
      backgroundColor: colors.background.DEFAULT,
    },
    input: {
      flex: 1,
      fontSize: fontSize.base,
      color: colors.text.dark,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    inputWithLeftIcon: {
      paddingLeft: spacing.sm,
    },
    inputWithRightIcon: {
      paddingRight: spacing.sm,
    },
    leftIcon: {
      paddingLeft: spacing.lg,
    },
    rightIcon: {
      paddingRight: spacing.lg,
    },
    error: {
      fontSize: fontSize.xs,
      color: colors.accent.red,
      marginTop: spacing.xs,
    },
    hint: {
      fontSize: fontSize.xs,
      color: colors.text.gray,
      marginTop: spacing.xs,
    },
  });
