import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePaystack } from 'react-native-paystack-webview';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { fetchListingById } from '@/lib/listings';
import {
  isPaymentsEnabled,
  formatZAR,
  priceToAmountCents,
  getPaymentConfig,
  createPayment,
  verifyPaystackPayment,
  updatePaymentFailed,
} from '@/lib/payments';
import { fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';
import { Listing } from '@/types';

type CheckoutState = 'loading' | 'ready' | 'processing' | 'success' | 'failed' | 'cancelled';

interface PaystackTransactionResponse {
  reference: string;
  trans: string;
  transaction: string;
  status: string;
  message?: string;
}

export default function CheckoutScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('loading');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const paymentConfig = getPaymentConfig();
  const paymentsEnabled = isPaymentsEnabled();
  
  // Get Paystack popup - will be undefined if provider not wrapped
  let paystackPopup: ReturnType<typeof usePaystack>['popup'] | null = null;
  try {
    const paystack = usePaystack();
    paystackPopup = paystack?.popup || null;
  } catch {
    // PaystackProvider not available
  }

  useEffect(() => {
    if (listingId) {
      loadListing();
    }
  }, [listingId]);

  const loadListing = async () => {
    setCheckoutState('loading');
    const data = await fetchListingById(listingId, user?.id);
    setListing(data);
    setCheckoutState(data ? 'ready' : 'loading');
  };

  const handlePaystackSuccess = useCallback(async (response: PaystackTransactionResponse) => {
    console.log('[Checkout] Paystack success:', response);
    setCheckoutState('processing');
    setPaymentReference(response.reference);

    // Verify payment server-side
    const verifyResult = await verifyPaystackPayment(response.reference);
    
    if (verifyResult.success && verifyResult.status === 'completed') {
      setCheckoutState('success');
    } else {
      setErrorMessage(verifyResult.error || 'Payment verification failed');
      setCheckoutState('failed');
    }
  }, []);

  const handlePaystackCancel = useCallback(() => {
    console.log('[Checkout] Paystack cancelled');
    setCheckoutState('cancelled');
    
    // Mark payment as cancelled if we have a paymentId
    if (paymentId) {
      updatePaymentFailed(paymentId, 'User cancelled checkout');
    }
  }, [paymentId]);

  const handlePayment = async () => {
    if (!listing || !user || !paystackPopup) return;

    setCheckoutState('processing');
    setErrorMessage(null);

    try {
      const amountCents = priceToAmountCents(listing.price);

      // Create payment record first
      const { paymentId: newPaymentId, error: createError } = await createPayment({
        listingId: listing.id,
        amountCents,
        provider: 'paystack',
      });

      if (createError || !newPaymentId) {
        setErrorMessage(createError || 'Failed to create payment');
        setCheckoutState('failed');
        return;
      }

      setPaymentId(newPaymentId);

      // Generate reference
      const reference = `QUAD_${newPaymentId.replace(/-/g, '').substring(0, 12)}_${Date.now()}`;
      setPaymentReference(reference);

      // Open Paystack checkout popup (currency is set at provider level)
      paystackPopup.checkout({
        email: user.email,
        amount: amountCents,
        reference,
        metadata: {
          custom_fields: [
            {
              display_name: 'Payment ID',
              variable_name: 'payment_id',
              value: newPaymentId,
            },
            {
              display_name: 'Listing',
              variable_name: 'listing_title',
              value: listing.title,
            },
          ],
        },
        onSuccess: handlePaystackSuccess,
        onCancel: handlePaystackCancel,
      });

      // Reset to ready after popup opens (popup handles the rest)
      setCheckoutState('ready');
    } catch (err) {
      console.error('[Checkout] Payment error:', err);
      setErrorMessage('An error occurred while processing payment');
      setCheckoutState('failed');
    }
  };

  const handleContactSeller = () => {
    if (listing) {
      router.push(`/listing/${listing.id}`);
    } else {
      router.back();
    }
  };

  const handleRetry = () => {
    setCheckoutState('ready');
    setErrorMessage(null);
    setPaymentId(null);
    setPaymentReference(null);
  };

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  // Loading state
  if (checkoutState === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Checkout',
            headerBackTitle: 'Back',
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No listing found
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
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.text.gray} />
          <Text style={styles.errorTitle}>Listing not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  // Success state
  if (checkoutState === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Payment Complete',
            headerLeft: () => null,
          }}
        />
        <View style={styles.centerContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={colors.secondary.DEFAULT} />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your payment of {formatZAR(priceToAmountCents(listing.price))} has been processed.
          </Text>
          
          <Card style={styles.successCard}>
            <View style={styles.successDetailRow}>
              <Text style={styles.successLabel}>Item</Text>
              <Text style={styles.successValue} numberOfLines={1}>{listing.title}</Text>
            </View>
            <View style={styles.successDetailRow}>
              <Text style={styles.successLabel}>Seller</Text>
              <Text style={styles.successValue}>{listing.seller.name}</Text>
            </View>
            {paymentReference && (
              <View style={styles.successDetailRow}>
                <Text style={styles.successLabel}>Reference</Text>
                <Text style={styles.successValueSmall}>{paymentReference}</Text>
              </View>
            )}
          </Card>

          <Text style={styles.nextStepsTitle}>Next Steps</Text>
          <Text style={styles.nextStepsText}>
            Contact the seller to arrange pickup or delivery of your item.
          </Text>

          <View style={styles.successButtons}>
            <Button
              title="Contact Seller"
              onPress={handleContactSeller}
              icon={<Ionicons name="chatbubble-outline" size={18} color={colors.text.white} />}
              iconPosition="left"
            />
            <Button
              title="Done"
              onPress={handleDone}
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Failed state
  if (checkoutState === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Payment Failed',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <Ionicons name="close" size={24} color={colors.text.dark} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.centerContainer}>
          <View style={styles.failedIconContainer}>
            <Ionicons name="close-circle" size={80} color={colors.accent.red} />
          </View>
          <Text style={styles.failedTitle}>Payment Failed</Text>
          <Text style={styles.failedSubtitle}>
            {errorMessage || 'Something went wrong with your payment. Please try again.'}
          </Text>

          <View style={styles.failedButtons}>
            <Button
              title="Try Again"
              onPress={handleRetry}
              icon={<Ionicons name="refresh" size={18} color={colors.text.white} />}
              iconPosition="left"
            />
            <Button
              title="Contact Seller Instead"
              onPress={handleContactSeller}
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Cancelled state
  if (checkoutState === 'cancelled') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Checkout Cancelled',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <Ionicons name="close" size={24} color={colors.text.dark} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.centerContainer}>
          <View style={styles.cancelledIconContainer}>
            <Ionicons name="arrow-undo-circle" size={80} color={colors.accent.orange} />
          </View>
          <Text style={styles.cancelledTitle}>Checkout Cancelled</Text>
          <Text style={styles.cancelledSubtitle}>
            No payment was made. You can try again or contact the seller directly.
          </Text>

          <View style={styles.cancelledButtons}>
            <Button
              title="Try Again"
              onPress={handleRetry}
              icon={<Ionicons name="card-outline" size={18} color={colors.text.white} />}
              iconPosition="left"
            />
            <Button
              title="Contact Seller"
              onPress={handleContactSeller}
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Ready state - show checkout form
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

          {/* Coming Soon Notice - shown when payments not enabled */}
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
                onPress={handleContactSeller}
                variant="outline"
              />
            </Card>
          )}

          {/* Test Mode Notice */}
          {paymentsEnabled && paymentConfig.publicKey?.startsWith('pk_test') && (
            <Card style={styles.testModeCard}>
              <View style={styles.testModeHeader}>
                <Ionicons name="flask-outline" size={20} color={colors.primary.DEFAULT} />
                <Text style={styles.testModeTitle}>Test Mode</Text>
              </View>
              <Text style={styles.testModeText}>
                Use test card 4084 0840 8408 4081 with any future expiry and CVV.
              </Text>
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
                checkoutState === 'processing'
                  ? 'Processing...'
                  : paymentsEnabled
                  ? `Pay ${formattedAmount}`
                  : 'Coming Soon'
              }
              onPress={paymentsEnabled ? handlePayment : () => {}}
              disabled={!paymentsEnabled || checkoutState === 'processing'}
              icon={
                checkoutState === 'processing' ? (
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

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.DEFAULT,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: fontSize.base,
      color: colors.text.gray,
    },
    errorTitle: {
      fontSize: fontSize.lg,
      color: colors.text.gray,
      marginBottom: spacing.lg,
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
    testModeCard: {
      padding: spacing.md,
      marginBottom: spacing.lg,
      backgroundColor: colors.primary.DEFAULT + '10',
      borderColor: colors.primary.DEFAULT + '30',
      borderWidth: 1,
    },
    testModeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
      gap: spacing.xs,
    },
    testModeTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.primary.DEFAULT,
    },
    testModeText: {
      fontSize: fontSize.sm,
      color: colors.text.gray,
      lineHeight: 18,
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
    // Success state styles
    successIconContainer: {
      marginBottom: spacing.lg,
    },
    successTitle: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: colors.text.dark,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    successSubtitle: {
      fontSize: fontSize.base,
      color: colors.text.gray,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    successCard: {
      width: '100%',
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    successDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    successLabel: {
      fontSize: fontSize.sm,
      color: colors.text.gray,
    },
    successValue: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text.dark,
      flex: 1,
      textAlign: 'right',
      marginLeft: spacing.md,
    },
    successValueSmall: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: colors.text.gray,
      flex: 1,
      textAlign: 'right',
      marginLeft: spacing.md,
    },
    nextStepsTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text.dark,
      marginBottom: spacing.xs,
    },
    nextStepsText: {
      fontSize: fontSize.sm,
      color: colors.text.gray,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    successButtons: {
      width: '100%',
      gap: spacing.md,
    },
    // Failed state styles
    failedIconContainer: {
      marginBottom: spacing.lg,
    },
    failedTitle: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: colors.text.dark,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    failedSubtitle: {
      fontSize: fontSize.base,
      color: colors.text.gray,
      textAlign: 'center',
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    failedButtons: {
      width: '100%',
      gap: spacing.md,
    },
    // Cancelled state styles
    cancelledIconContainer: {
      marginBottom: spacing.lg,
    },
    cancelledTitle: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: colors.text.dark,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    cancelledSubtitle: {
      fontSize: fontSize.base,
      color: colors.text.gray,
      textAlign: 'center',
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    cancelledButtons: {
      width: '100%',
      gap: spacing.md,
    },
  });
