import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/Avatar';
import { PriceBadge, RatingBadge } from '@/components/ui/Badge';
import { Listing } from '@/types';
import { formatTimeAgo } from '@/services/mockData';
import { colors, borderRadius, fontSize, fontWeight, spacing, shadows } from '@/constants/theme';

interface ListingCardProps {
  listing: Listing;
  variant?: 'default' | 'compact' | 'horizontal';
  onFavorite?: (id: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.7;

export function ListingCard({ listing, variant = 'default', onFavorite }: ListingCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/listing/${listing.id}`);
  };

  const handleFavorite = () => {
    onFavorite?.(listing.id);
  };

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: listing.images[0] }}
          style={styles.horizontalImage}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.horizontalContent}>
          <Text style={styles.horizontalTitle} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text style={styles.horizontalDescription} numberOfLines={2}>
            {listing.description}
          </Text>
          <View style={styles.horizontalFooter}>
            <PriceBadge
              price={listing.price}
              originalPrice={listing.originalPrice}
              priceType={listing.priceType}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, variant === 'compact' && styles.compactCard]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: listing.images[0] }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={listing.isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={listing.isFavorite ? colors.accent.red : colors.text.white}
          />
        </TouchableOpacity>
        <View style={styles.priceOverlay}>
          <PriceBadge
            price={listing.price}
            originalPrice={listing.originalPrice}
            priceType={listing.priceType}
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          {listing.tags && listing.tags.length > 0 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{listing.tags[0]}</Text>
            </View>
          )}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {listing.description}
        </Text>

        {listing.rating !== undefined && (
          <View style={styles.ratingRow}>
            <RatingBadge rating={listing.rating} reviewCount={listing.reviewCount} />
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.sellerInfo}>
            <Avatar name={listing.seller.name} uri={listing.seller.avatar} size="sm" />
            <View style={styles.sellerText}>
              <Text style={styles.sellerName}>{listing.seller.name.split(' ')[0]}</Text>
              <Text style={styles.sellerRole}>{listing.seller.role}</Text>
            </View>
          </View>
          <Text style={styles.timeAgo}>{formatTimeAgo(listing.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.md,
  },
  compactCard: {
    width: '100%',
    marginRight: 0,
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  tag: {
    backgroundColor: colors.secondary.light,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary.DEFAULT,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerText: {
    marginLeft: spacing.sm,
  },
  sellerName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  sellerRole: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
  },
  timeAgo: {
    fontSize: fontSize.xs,
    color: colors.text.light,
  },
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  horizontalImage: {
    width: 100,
    height: 100,
  },
  horizontalContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  horizontalTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  horizontalDescription: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    lineHeight: 18,
  },
  horizontalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
