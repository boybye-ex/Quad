import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { fetchListingById } from '@/lib/listings';
import { isPaymentsEnabled, formatZAR, priceToAmountCents, getPaymentConfig } from '@/lib/payments';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';
import { Listing } from '@/types';

export default function CheckoutScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentConfig = getPaymentConfig();
  const paymentsEnabled = isPaymentsEnabled();

  useEffect(() => {
    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  const loadListing = async () => {
    setIsLoading(true);
    const data = await fetchListingById(listingId, user?.id);
    setListing(data);
    setIsLoading(false);
  };

  const handlePayment = async () => {
    if (!listing || !user) return;

    setIsProcessing(true);

    // In Phase 2, this would:
    // 1. Call createPayment() to create a payment record
    // 2. Initialize Paystack checkout with the payment reference
    // 3. Handle the callback to update payment status
    
    // For now, just simulate and show coming soon
    setTimeout(() => {
      setIsProcessing(false);
      // Show coming soon message
    }, 1000);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Checkout',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Checkout',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.text.gray} />
          <Text style={styles.errorText}>Listing not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const amountCents = priceToAmountCents(listing.price);
  const formattedAmount = formatZAR(amountCents);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Checkout',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Listing Summary */}
          <Card style={styles.listingCard}>
            <View style={styles.listingHeader}>
              {listing.images.length > 0 ? (
                <Image
                  source={{ uri: listing.images[0] }}
                  style={styles.listingImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.listingImage, styles.noImage]}>
                  <Ionicons name="image-outline" size={32} color={colors.text.gray} />
                </View>
              )}
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={styles.listingSeller}>
                  Sold by {listing.seller.name}
                </Text>
                <Text style={styles.listingCampus}>
                  {listing.campus?.shortName || 'Unknown Campus'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Price Breakdown */}
          <Card style={styles.priceCard}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Item Price</Text>
              <Text style={styles.priceValue}>{formattedAmount}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Text style={styles.priceFree}>Free (for now)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formattedAmount}</Text>
            </View>
          </Card>

          {/* Payment Method */}
          <Card style={styles.paymentCard}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentOption}>
              <View style={styles.paymentIconContainer}>
                <Ionicons name="card-outline" size={24} color={colors.primary.DEFAULT} />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentName}>Pay with Paystack</Text>
                <Text style={styles.paymentDescription}>
                  Card, Instant EFT, or Mobile Money
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={colors.secondary.DEFAULT} />
            </View>
          </Card>

          {/* Coming Soon Notice */}
          {!paymentsEnabled && (
            <Card style={styles.comingSoonCard}>
              <View style={styles.comingSoonHeader}>
                <Ionicons name="time-outline" size={28} color={colors.accent.orange} />
                <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              </View>
              <Text style={styles.comingSoonText}>
                Online payments are not yet enabled. For now, contact the seller directly
                to arrange payment and pickup.
              </Text>
              <Button
                title="Contact Seller Instead"
                onPress={() => router.back()}
                variant="outline"
              />
            </Card>
          )}

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.secondary.DEFAULT} />
            <Text style={styles.securityText}>
              Payments are processed securely by Paystack. Quad never stores your card details.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomContent}>
            <View style={styles.bottomPrice}>
              <Text style={styles.bottomPriceLabel}>Total</Text>
              <Text style={styles.bottomPriceValue}>{formattedAmount}</Text>
            </View>
            <Button
              title={
                isProcessing
                  ? 'Processing...'
                  : paymentsEnabled
                  ? `Pay ${formattedAmount}`
                  : 'Coming Soon'
              }
              onPress={paymentsEnabled ? handlePayment : () => {}}
              disabled={!paymentsEnabled || isProcessing}
              icon={
                isProcessing ? (
                  <ActivityIndicator size="small" color={colors.text.white} />
                ) : (
                  <Ionicons name="lock-closed" size={18} color={colors.text.white} />
                )
              }
              iconPosition="left"
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.text.gray,
  },
  headerButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  listingCard: {
    marginBottom: spacing.lg,
  },
  listingHeader: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
  },
  noImage: {
    backgroundColor: colors.background.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  listingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  listingSeller: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  listingCampus: {
    fontSize: fontSize.sm,
    color: colors.text.light,
  },
  priceCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  priceLabel: {
    fontSize: fontSize.base,
    color: colors.text.gray,
  },
  priceValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  priceFree: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.secondary.DEFAULT,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  paymentCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  paymentName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  paymentDescription: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: 2,
  },
  comingSoonCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.accent.orange + '10',
    borderColor: colors.accent.orange + '40',
    borderWidth: 1,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  comingSoonTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.accent.orange,
  },
  comingSoonText: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.secondary.light + '20',
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.gray,
    lineHeight: 20,
  },
  bottomBar: {
    backgroundColor: colors.background.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.md,
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
