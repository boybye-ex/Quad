import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import { formatPrice, formatOriginalPrice, getPriceSuffix } from '@/lib/format';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`]]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

interface PriceBadgeProps {
  price: number;
  originalPrice?: number;
  priceType?: 'fixed' | 'hourly' | 'monthly' | 'free';
}

export function PriceBadge({ price, originalPrice, priceType = 'fixed' }: PriceBadgeProps) {
  const suffix = getPriceSuffix(priceType);

  return (
    <View style={styles.priceContainer}>
      <Text style={styles.price}>
        {formatPrice(price, priceType, { includeSuffix: false })}
        {suffix && <Text style={styles.priceSuffix}>{suffix}</Text>}
      </Text>
      {originalPrice && originalPrice > price && (
        <Text style={styles.originalPrice}>{formatOriginalPrice(originalPrice)}</Text>
      )}
    </View>
  );
}

interface LiveBadgeProps {
  label?: string;
}

export function LiveBadge({ label = 'Live' }: LiveBadgeProps) {
  return (
    <View style={styles.liveBadge}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>{label}</Text>
    </View>
  );
}

interface RatingBadgeProps {
  rating: number;
  reviewCount?: number;
}

export function RatingBadge({ rating, reviewCount }: RatingBadgeProps) {
  return (
    <View style={styles.ratingContainer}>
      <Text style={styles.ratingStar}>★</Text>
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      {reviewCount !== undefined && (
        <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.sm,
  },
  default: {
    backgroundColor: colors.background.DEFAULT,
  },
  primary: {
    backgroundColor: colors.primary.DEFAULT,
  },
  success: {
    backgroundColor: colors.secondary.DEFAULT,
  },
  warning: {
    backgroundColor: colors.accent.orange,
  },
  error: {
    backgroundColor: colors.accent.red,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  size_sm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
  },
  size_md: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontWeight: fontWeight.medium,
  },
  text_default: {
    color: colors.text.dark,
  },
  text_primary: {
    color: colors.text.white,
  },
  text_success: {
    color: colors.text.white,
  },
  text_warning: {
    color: colors.text.white,
  },
  text_error: {
    color: colors.text.white,
  },
  text_outline: {
    color: colors.text.dark,
  },
  text_sm: {
    fontSize: fontSize.xs,
  },
  text_md: {
    fontSize: fontSize.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.background.white,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  priceSuffix: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.text.gray,
  },
  originalPrice: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text.gray,
    textDecorationLine: 'line-through',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.red,
    marginRight: spacing.xs,
  },
  liveText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.accent.red,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    fontSize: fontSize.sm,
    color: colors.accent.yellow,
    marginRight: 2,
  },
  ratingText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  reviewCount: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
    marginLeft: spacing.xs,
  },
});
