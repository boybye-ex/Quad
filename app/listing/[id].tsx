import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { RatingBadge, Badge } from '@/components/ui/Badge';
import { ReportSheet } from '@/components/ReportSheet';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fetchListingById, toggleFavourite } from '@/lib/listings';
import { getOrCreateConversation } from '@/lib/chat';
import { isPaymentsEnabled } from '@/lib/payments';
import { formatPrice, formatOriginalPrice } from '@/lib/format';
import { resolveImageUris, hasImages } from '@/lib/images';
import { fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';
import { Listing } from '@/types';

const { width: screenWidth } = Dimensions.get('window');

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatCondition(condition: string): string {
  const labels: Record<string, string> = {
    'new': 'Brand New',
    'like-new': 'Like New',
    'good': 'Good Condition',
    'fair': 'Fair Condition',
  };
  return labels[condition] || condition;
}

function getConditionIcon(condition: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    'new': 'sparkles',
    'like-new': 'star',
    'good': 'checkmark-circle',
    'fair': 'information-circle',
  };
  return icons[condition] || 'help-circle';
}

function getConditionColor(condition: string, colors: ReturnType<typeof useThemeColors>): string {
  const colorMap: Record<string, string> = {
    'new': colors.secondary.DEFAULT,
    'like-new': colors.primary.DEFAULT,
    'good': colors.text.gray,
    'fair': colors.accent.orange,
  };
  return colorMap[condition] || colors.text.gray;
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactingLoading, setIsContactingLoading] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);

  const paymentsEnabled = isPaymentsEnabled();
  const canShowPayButton = paymentsEnabled && user && listing?.seller.id !== user.id && listing?.priceType !== 'free';

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    setIsLoading(true);
    const data = await fetchListingById(id, user?.id);
    setListing(data);
    setIsFavorite(data?.isFavorite || false);
    setIsLoading(false);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }

    const result = await toggleFavourite(id, user.id);
    if (!result.error) {
      setIsFavorite(result.isFavourite);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

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

  const handleContactSeller = async () => {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }

    if (!listing) return;

    if (listing.seller.id === user.id) {
      Alert.alert('Your Listing', "You can't message yourself!");
      return;
    }

    setIsContactingLoading(true);
    const result = await getOrCreateConversation(user.id, listing.seller.id, listing.id);
    setIsContactingLoading(false);

    if (result.error) {
      Alert.alert('Error', 'Could not start conversation. Please try again.');
      return;
    }

    if (result.conversationId) {
      router.push(`/(tabs)/messages?conversationId=${result.conversationId}`);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }

    if (!listing) return;

    if (listing.seller.id === user.id) {
      Alert.alert('Your Listing', "You can't buy your own listing!");
      return;
    }

    router.push(`/checkout?listingId=${listing.id}`);
  };

  const displayPrice = () => formatPrice(listing.price, listing.priceType);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={colors.text.dark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavorite}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite ? colors.accent.red : colors.text.dark}
                />
              </TouchableOpacity>
              {user && listing?.seller.id !== user.id && (
                <TouchableOpacity style={styles.headerButton} onPress={() => setShowReportSheet(true)}>
                  <Ionicons name="flag-outline" size={22} color={colors.text.dark} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {(() => {
            const resolvedImages = resolveImageUris(listing.images);
            const showPlaceholder = resolvedImages.length === 0;
            
            return (
              <>
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
                  {showPlaceholder ? (
                    <View style={[styles.image, styles.noImage]}>
                      <View style={styles.placeholderIconCircle}>
                        <Ionicons name="cube-outline" size={40} color={colors.primary.DEFAULT} />
                      </View>
                      <Text style={styles.placeholderTitle}>No photos yet</Text>
                      <Text style={styles.placeholderSubtitle}>
                        This listing doesn't have any images
                      </Text>
                    </View>
                  ) : (
                    resolvedImages.map((uri, index) => (
                      <Image
                        key={index}
                        source={{ uri }}
                        style={styles.image}
                        contentFit="cover"
                        transition={200}
                      />
                    ))
                  )}
                </ScrollView>
                {resolvedImages.length > 1 && (
                  <View style={styles.imageDots}>
                    {resolvedImages.map((_, index) => (
                      <View
                        key={index}
                        style={[styles.imageDot, currentImageIndex === index && styles.imageDotActive]}
                      />
                    ))}
                  </View>
                )}
              </>
            );
          })()}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Price and Category */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{displayPrice()}</Text>
              {listing.originalPrice && listing.originalPrice > listing.price && (
                <Text style={styles.originalPrice}>{formatOriginalPrice(listing.originalPrice)}</Text>
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
            <View style={styles.conditionSection}>
              <View style={styles.conditionBadge}>
                <Ionicons 
                  name={getConditionIcon(listing.condition)} 
                  size={16} 
                  color={getConditionColor(listing.condition, colors)} 
                />
                <Text style={[styles.conditionBadgeText, { color: getConditionColor(listing.condition, colors) }]}>
                  {formatCondition(listing.condition)}
                </Text>
              </View>
            </View>
          )}

          {/* Seller Info */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <Avatar name={listing.seller.name} uri={listing.seller.avatar} size="lg" />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{listing.seller.name}</Text>
                <View style={styles.sellerMeta}>
                  <Text style={styles.sellerRole}>{listing.seller.role}</Text>
                  <Text style={styles.sellerDot}>•</Text>
                  <Text style={styles.sellerCampus}>
                    {listing.campus?.shortName || 'Unknown'}
                  </Text>
                </View>
                {listing.seller.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.secondary.DEFAULT} />
                    <Text style={styles.verifiedText}>Verified student</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.postedTime}>Posted {formatTimeAgo(listing.createdAt)}</Text>
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
          <View style={styles.bottomPriceSection}>
            <Text style={styles.bottomPriceLabel}>Price</Text>
            <Text style={styles.bottomPriceValue}>{displayPrice()}</Text>
            {listing.originalPrice && listing.originalPrice > listing.price && (
              <Text style={styles.bottomOriginalPrice}>{formatOriginalPrice(listing.originalPrice)}</Text>
            )}
          </View>
          <View style={styles.bottomButtons}>
            {canShowPayButton && (
              <Button
                title="Buy Now"
                onPress={handleBuyNow}
                icon={<Ionicons name="card-outline" size={18} color={colors.text.white} />}
                iconPosition="left"
              />
            )}
            <Button
              title={isContactingLoading ? 'Opening...' : 'Message'}
              onPress={handleContactSeller}
              variant={canShowPayButton ? 'outline' : 'primary'}
              icon={
                isContactingLoading ? (
                  <ActivityIndicator size="small" color={canShowPayButton ? colors.primary.DEFAULT : colors.text.white} />
                ) : (
                  <Ionicons name="chatbubble-outline" size={18} color={canShowPayButton ? colors.primary.DEFAULT : colors.text.white} />
                )
              }
              iconPosition="left"
              disabled={isContactingLoading}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Report Sheet */}
      {listing && (
        <ReportSheet
          visible={showReportSheet}
          onClose={() => setShowReportSheet(false)}
          targetType="listing"
          targetId={listing.id}
          targetName={listing.title}
        />
      )}
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.white,
    },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  noImage: {
    backgroundColor: colors.secondary.light + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary.light + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  placeholderTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  placeholderSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
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
  conditionSection: {
    marginBottom: spacing.lg,
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.background.DEFAULT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  conditionBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  bottomPriceSection: {
    flexShrink: 1,
    minWidth: 80,
  },
  bottomPriceLabel: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
    marginBottom: 2,
  },
  bottomPriceValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  bottomOriginalPrice: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    textDecorationLine: 'line-through',
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 0,
  },
});
