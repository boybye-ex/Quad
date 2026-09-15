import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAdminListings, updateListingStatus, AdminListing } from '@/lib/admin';
import { formatOriginalPrice } from '@/lib/format';
import { fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';

type FilterStatus = 'all' | 'active' | 'hidden' | 'deleted';

export default function AdminListingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const loadListings = useCallback(async () => {
    const status = filter === 'all' ? undefined : filter;
    const data = await getAdminListings(50, 0, status as any);
    setListings(data);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    loadListings();
  }, [user, router, loadListings]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadListings();
    setIsRefreshing(false);
  };

  const handleStatusChange = (listing: AdminListing, newStatus: 'active' | 'hidden' | 'deleted') => {
    const actionLabels = {
      active: 'Approve',
      hidden: 'Hide',
      deleted: 'Delete',
    };

    Alert.alert(
      `${actionLabels[newStatus]} Listing`,
      `Are you sure you want to ${actionLabels[newStatus].toLowerCase()} "${listing.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabels[newStatus],
          style: newStatus === 'deleted' ? 'destructive' : 'default',
          onPress: async () => {
            const result = await updateListingStatus(listing.id, newStatus);
            if (result.success) {
              loadListings();
            } else {
              Alert.alert('Error', result.error || 'Failed to update listing');
            }
          },
        },
      ]
    );
  };

  if (user?.role !== 'admin') return null;

  const renderFilterButton = (status: FilterStatus, label: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === status && styles.filterButtonActive]}
      onPress={() => {
        setFilter(status);
        setIsLoading(true);
      }}
    >
      <Text style={[styles.filterButtonText, filter === status && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.secondary.DEFAULT;
      case 'hidden':
        return colors.accent.orange;
      case 'deleted':
        return colors.accent.red;
      default:
        return colors.text.gray;
    }
  };

  const renderListing = ({ item }: { item: AdminListing }) => (
    <View style={styles.listingCard}>
      <View style={styles.listingHeader}>
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.listingPrice}>{formatOriginalPrice(item.price)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.listingMeta}>
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={14} color={colors.text.gray} />
          <Text style={styles.metaText}>{item.seller_name}</Text>
        </View>
        {item.campus_name && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.text.gray} />
            <Text style={styles.metaText}>{item.campus_name}</Text>
          </View>
        )}
        {item.category_name && (
          <View style={styles.metaRow}>
            <Ionicons name="pricetag-outline" size={14} color={colors.text.gray} />
            <Text style={styles.metaText}>{item.category_name}</Text>
          </View>
        )}
      </View>

      {item.report_count > 0 && (
        <View style={styles.reportWarning}>
          <Ionicons name="flag" size={14} color={colors.accent.red} />
          <Text style={styles.reportWarningText}>{item.report_count} pending report(s)</Text>
        </View>
      )}

      <View style={styles.listingActions}>
        {item.status !== 'active' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonApprove]}
            onPress={() => handleStatusChange(item, 'active')}
          >
            <Ionicons name="checkmark" size={16} color={colors.text.white} />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'hidden' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonHide]}
            onPress={() => handleStatusChange(item, 'hidden')}
          >
            <Ionicons name="eye-off" size={16} color={colors.text.white} />
            <Text style={styles.actionButtonText}>Hide</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'deleted' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDelete]}
            onPress={() => handleStatusChange(item, 'deleted')}
          >
            <Ionicons name="trash" size={16} color={colors.text.white} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => router.push(`/listing/${item.id}`)}
      >
        <Text style={styles.viewButtonText}>View Listing</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary.DEFAULT} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Moderate Listings',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('active', 'Active')}
          {renderFilterButton('hidden', 'Hidden')}
          {renderFilterButton('deleted', 'Deleted')}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            renderItem={renderListing}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color={colors.text.gray} />
                <Text style={styles.emptyText}>No listings found</Text>
              </View>
            }
          />
        )}
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
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  backButton: {
    padding: spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.white,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  filterButtonActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  filterButtonText: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  filterButtonTextActive: {
    color: colors.text.white,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  listingCard: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  listingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  listingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  listingPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary.DEFAULT,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'capitalize',
  },
  listingMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
  },
  reportWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.red + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  reportWarningText: {
    fontSize: fontSize.sm,
    color: colors.accent.red,
    fontWeight: fontWeight.medium,
  },
  listingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  actionButtonApprove: {
    backgroundColor: colors.secondary.DEFAULT,
  },
  actionButtonHide: {
    backgroundColor: colors.accent.orange,
  },
  actionButtonDelete: {
    backgroundColor: colors.accent.red,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.white,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.xs,
  },
  viewButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary.DEFAULT,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    marginTop: spacing.md,
  },
});
