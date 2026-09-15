import React, { useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { borderRadius, fontSize, spacing, shadows } from '@/constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onFilterPress?: () => void;
  showFilter?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search for textbooks, rooms, rides, tutoring...',
  onSubmit,
  onFilterPress,
  showFilter = true,
  autoFocus = false,
}: SearchBarProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.text.gray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.light}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={colors.text.gray} />
          </TouchableOpacity>
        )}
      </View>
      {showFilter && onFilterPress && (
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
          <Ionicons name="options-outline" size={20} color={colors.text.dark} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.white,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border.light,
      paddingHorizontal: spacing.md,
      height: 48,
      ...shadows.sm,
    },
    searchIcon: {
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: fontSize.base,
      color: colors.text.dark,
      paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    },
    clearButton: {
      padding: spacing.xs,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.background.white,
      borderWidth: 1,
      borderColor: colors.border.light,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
  });
