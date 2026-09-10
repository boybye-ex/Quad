import React from 'react';
import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Category } from '@/types';
import { colors, borderRadius, fontSize, fontWeight, spacing, shadows } from '@/constants/theme';

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory?: string;
  onSelectCategory?: (categorySlug: string) => void;
  showCounts?: boolean;
}

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  all: 'grid-outline',
  textbooks: 'book-outline',
  housing: 'home-outline',
  tutoring: 'school-outline',
  rides: 'car-outline',
  shifts: 'briefcase-outline',
  electronics: 'laptop-outline',
  furniture: 'bed-outline',
};

export function CategoryChips({
  categories,
  selectedCategory = 'all',
  onSelectCategory,
  showCounts = true,
}: CategoryChipsProps) {
  const router = useRouter();

  const handlePress = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category.slug);
    } else {
      router.push(`/category/${category.slug}`);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = selectedCategory === category.slug;
        const iconName = categoryIcons[category.slug] || 'ellipsis-horizontal-outline';

        return (
          <TouchableOpacity
            key={category.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => handlePress(category)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
              <Ionicons
                name={iconName}
                size={20}
                color={isSelected ? colors.text.white : colors.primary.DEFAULT}
              />
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {category.name}
            </Text>
            {showCounts && category.count > 0 && (
              <Text style={[styles.count, isSelected && styles.countSelected]}>
                {category.count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.moreChip} activeOpacity={0.7}>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.text.gray} />
        <Text style={styles.moreLabel}>More</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface CategoryGridProps {
  categories: Category[];
  onSelectCategory?: (categorySlug: string) => void;
}

export function CategoryGrid({ categories, onSelectCategory }: CategoryGridProps) {
  const router = useRouter();

  const handlePress = (category: Category) => {
    if (onSelectCategory) {
      onSelectCategory(category.slug);
    } else {
      router.push(`/category/${category.slug}`);
    }
  };

  return (
    <View style={styles.grid}>
      {categories.slice(0, 8).map((category) => {
        const iconName = categoryIcons[category.slug] || 'ellipsis-horizontal-outline';

        return (
          <TouchableOpacity
            key={category.id}
            style={styles.gridItem}
            onPress={() => handlePress(category)}
            activeOpacity={0.7}
          >
            <View style={styles.gridIconContainer}>
              <Ionicons name={iconName} size={24} color={colors.primary.DEFAULT} />
            </View>
            <Text style={styles.gridLabel} numberOfLines={1}>
              {category.name}
            </Text>
            {category.count > 0 && (
              <Text style={styles.gridCount}>{category.count}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    minWidth: 72,
    ...shadows.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary.DEFAULT,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.text.white,
  },
  count: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
    marginTop: 2,
  },
  countSelected: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  moreChip: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 72,
    ...shadows.sm,
  },
  moreLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.gray,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  gridLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
    textAlign: 'center',
  },
  gridCount: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
    marginTop: 2,
  },
});
