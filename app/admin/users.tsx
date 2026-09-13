import { useState, useEffect, useCallback } from 'react';
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
import { getAdminUsers, verifyUser, suspendUser, AdminUser } from '@/lib/admin';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';

type FilterStatus = 'all' | 'verified' | 'unverified' | 'suspended';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const loadUsers = useCallback(async () => {
    const status = filter === 'all' ? undefined : filter;
    const data = await getAdminUsers(50, 0, status as any);
    setUsers(data);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    loadUsers();
  }, [user, router, loadUsers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  const handleVerify = (targetUser: AdminUser) => {
    const action = targetUser.is_verified ? 'unverify' : 'verify';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${targetUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            const result = await verifyUser(targetUser.id, !targetUser.is_verified);
            if (result.success) {
              loadUsers();
            } else {
              Alert.alert('Error', result.error || 'Failed to update user');
            }
          },
        },
      ]
    );
  };

  const handleSuspend = (targetUser: AdminUser) => {
    const action = targetUser.is_suspended ? 'unsuspend' : 'suspend';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${targetUser.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: targetUser.is_suspended ? 'default' : 'destructive',
          onPress: async () => {
            const result = await suspendUser(targetUser.id, !targetUser.is_suspended);
            if (result.success) {
              loadUsers();
            } else {
              Alert.alert('Error', result.error || 'Failed to update user');
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

  const renderUser = ({ item }: { item: AdminUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          {item.campus_name && <Text style={styles.userCampus}>{item.campus_name}</Text>}
        </View>
        <View style={styles.userBadges}>
          {item.is_verified && (
            <View style={[styles.badge, styles.badgeVerified]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.secondary.DEFAULT} />
              <Text style={styles.badgeTextVerified}>Verified</Text>
            </View>
          )}
          {item.is_suspended && (
            <View style={[styles.badge, styles.badgeSuspended]}>
              <Ionicons name="ban" size={12} color={colors.accent.red} />
              <Text style={styles.badgeTextSuspended}>Suspended</Text>
            </View>
          )}
          {item.role === 'admin' && (
            <View style={[styles.badge, styles.badgeAdmin]}>
              <Ionicons name="shield" size={12} color={colors.primary.DEFAULT} />
              <Text style={styles.badgeTextAdmin}>Admin</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.userMeta}>
        <Text style={styles.userMetaText}>{item.listing_count} listings</Text>
        <Text style={styles.userMetaText}>
          Joined {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      {item.role !== 'admin' && (
        <View style={styles.userActions}>
          <TouchableOpacity
            style={[styles.actionButton, item.is_verified && styles.actionButtonOutline]}
            onPress={() => handleVerify(item)}
          >
            <Ionicons
              name={item.is_verified ? 'close-circle' : 'checkmark-circle'}
              size={16}
              color={item.is_verified ? colors.text.gray : colors.text.white}
            />
            <Text
              style={[styles.actionButtonText, item.is_verified && styles.actionButtonTextOutline]}
            >
              {item.is_verified ? 'Unverify' : 'Verify'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.is_suspended ? styles.actionButtonSuccess : styles.actionButtonDanger,
            ]}
            onPress={() => handleSuspend(item)}
          >
            <Ionicons
              name={item.is_suspended ? 'checkmark' : 'ban'}
              size={16}
              color={colors.text.white}
            />
            <Text style={styles.actionButtonText}>
              {item.is_suspended ? 'Unsuspend' : 'Suspend'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Manage Users',
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
          {renderFilterButton('verified', 'Verified')}
          {renderFilterButton('unverified', 'Unverified')}
          {renderFilterButton('suspended', 'Suspended')}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.text.gray} />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
          />
        )}
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
  userCard: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: 2,
  },
  userCampus: {
    fontSize: fontSize.sm,
    color: colors.primary.DEFAULT,
    marginTop: 2,
  },
  userBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  badgeVerified: {
    backgroundColor: colors.secondary.light + '30',
  },
  badgeTextVerified: {
    fontSize: fontSize.xs,
    color: colors.secondary.DEFAULT,
  },
  badgeSuspended: {
    backgroundColor: colors.accent.red + '20',
  },
  badgeTextSuspended: {
    fontSize: fontSize.xs,
    color: colors.accent.red,
  },
  badgeAdmin: {
    backgroundColor: colors.primary.DEFAULT + '20',
  },
  badgeTextAdmin: {
    fontSize: fontSize.xs,
    color: colors.primary.DEFAULT,
  },
  userMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  userMetaText: {
    fontSize: fontSize.xs,
    color: colors.text.light,
  },
  userActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.DEFAULT,
    gap: spacing.xs,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  actionButtonDanger: {
    backgroundColor: colors.accent.red,
  },
  actionButtonSuccess: {
    backgroundColor: colors.secondary.DEFAULT,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.white,
  },
  actionButtonTextOutline: {
    color: colors.text.gray,
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
