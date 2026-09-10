import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PriceBadge, RatingBadge, Badge } from '@/components/ui/Badge';
import { getListingById, formatTimeAgo } from '@/services/mockData';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const listing = getListingById(id);

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.text.gray} />
          <Text style={styles.notFoundText}>Listing not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${listing.title}" on Quad!`,
        title: listing.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleContactSeller = () => {
    router.push('/(tabs)/messages');
  };

  const formatPrice = () => {
    if (listing.priceType === 'free') return 'Free';
    const suffix = listing.priceType === 'hourly' ? '/hour' : 
                   listing.priceType === 'monthly' ? '/month' : '';
    return `$${listing.price}${suffix}`;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={colors.text.dark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsFavorite(!isFavorite)}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite ? colors.accent.red : colors.text.dark}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {listing.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
            ))}
          </ScrollView>
          {listing.images.length > 1 && (
            <View style={styles.imageDots}>
              {listing.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageDot,
                    currentImageIndex === index && styles.imageDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Price and Category */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatPrice()}</Text>
              {listing.originalPrice && listing.originalPrice > listing.price && (
                <Text style={styles.originalPrice}>${listing.originalPrice}</Text>
              )}
            </View>
            <Badge label={listing.category.name} variant="outline" />
          </View>

          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {listing.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Rating */}
          {listing.rating !== undefined && (
            <View style={styles.ratingContainer}>
              <RatingBadge rating={listing.rating} reviewCount={listing.reviewCount} />
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Condition */}
          {listing.condition && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Condition</Text>
              <Text style={styles.conditionText}>
                {listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1)}
              </Text>
            </View>
          )}

          {/* Seller Info */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <Avatar
                name={listing.seller.name}
                uri={listing.seller.avatar}
                size="lg"
              />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{listing.seller.name}</Text>
                <View style={styles.sellerMeta}>
                  <Text style={styles.sellerRole}>{listing.seller.role}</Text>
                  <Text style={styles.sellerDot}>•</Text>
                  <Text style={styles.sellerCampus}>
                    {listing.seller.campus.shortName}
                  </Text>
                </View>
                {listing.seller.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.secondary.DEFAULT}
                    />
                    <Text style={styles.verifiedText}>Verified student</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.postedTime}>
              Posted {formatTimeAgo(listing.createdAt)}
            </Text>
          </View>

          {/* Safety Tips */}
          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary.DEFAULT} />
            <View style={styles.safetyContent}>
              <Text style={styles.safetyTitle}>Stay safe on Quad</Text>
              <Text style={styles.safetyText}>
                Meet in public places on campus. Never share personal financial info.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          <View style={styles.bottomPrice}>
            <Text style={styles.bottomPriceLabel}>Price</Text>
            <Text style={styles.bottomPriceValue}>{formatPrice()}</Text>
          </View>
          <Button
            title="Contact Seller"
            onPress={handleContactSeller}
            icon={<Ionicons name="chatbubble-outline" size={18} color={colors.text.white} />}
            iconPosition="left"
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  notFoundText: {
    fontSize: fontSize.lg,
    color: colors.text.gray,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: screenWidth,
    height: 300,
  },
  imageDots: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageDotActive: {
    backgroundColor: colors.text.white,
  },
  content: {
    padding: spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  price: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  originalPrice: {
    fontSize: fontSize.md,
    color: colors.text.gray,
    textDecorationLine: 'line-through',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.secondary.light + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary.DEFAULT,
  },
  ratingContainer: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    lineHeight: 24,
  },
  conditionText: {
    fontSize: fontSize.base,
    color: colors.text.dark,
  },
  sellerCard: {
    backgroundColor: colors.background.DEFAULT,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sellerHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  sellerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  sellerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sellerRole: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  sellerDot: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginHorizontal: spacing.xs,
  },
  sellerCampus: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    color: colors.secondary.DEFAULT,
    fontWeight: fontWeight.medium,
  },
  postedTime: {
    fontSize: fontSize.sm,
    color: colors.text.light,
  },
  safetyCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary.light + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing['3xl'],
  },
  safetyContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  safetyTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary.DEFAULT,
    marginBottom: 2,
  },
  safetyText: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    lineHeight: 20,
  },
  bottomBar: {
    backgroundColor: colors.background.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  bottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  bottomPrice: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
  },
  bottomPriceValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
});
