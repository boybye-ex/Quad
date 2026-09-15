import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '@/store/authStore';
import { getAdminStats, AdminStats } from '@/lib/admin';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    const data = await getAdminStats();
    setStats(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    loadStats();
  }, [user, router, loadStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  if (user?.role !== 'admin') {
    return null;
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  const StatCard = ({
    title,
    value,
    icon,
    color = colors.primary.DEFAULT,
  }: {
    title: string;
    value: number;
    icon: string;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const MenuButton = ({
    title,
    subtitle,
    icon,
    onPress,
    badge,
  }: {
    title: string;
    subtitle: string;
    icon: string;
    onPress: () => void;
    badge?: number;
  }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon as any} size={24} color={colors.primary.DEFAULT} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={colors.text.gray} />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Admin Panel',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        >
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Users"
                value={stats?.total_users || 0}
                icon="people"
                color={colors.primary.DEFAULT}
              />
              <StatCard
                title="Verified"
                value={stats?.verified_users || 0}
                icon="checkmark-circle"
                color={colors.secondary.DEFAULT}
              />
              <StatCard
                title="Suspended"
                value={stats?.suspended_users || 0}
                icon="ban"
                color={colors.accent.red}
              />
              <StatCard
                title="Active Listings"
                value={stats?.active_listings || 0}
                icon="cube"
                color={colors.primary.DEFAULT}
              />
              <StatCard
                title="Hidden Listings"
                value={stats?.hidden_listings || 0}
                icon="eye-off"
                color={colors.accent.orange}
              />
              <StatCard
                title="Pending Reports"
                value={stats?.pending_reports || 0}
                icon="flag"
                color={colors.accent.red}
              />
            </View>

            <Text style={styles.sectionTitle}>Manage</Text>
            <View style={styles.menuSection}>
              <MenuButton
                title="Users"
                subtitle="Verify and manage user accounts"
                icon="people"
                onPress={() => router.push('/admin/users')}
              />
              <MenuButton
                title="Listings"
                subtitle="Moderate and manage listings"
                icon="cube"
                onPress={() => router.push('/admin/listings')}
              />
              <MenuButton
                title="Reports"
                subtitle="Review and resolve user reports"
                icon="flag"
                onPress={() => router.push('/admin/reports')}
                badge={stats?.pending_reports}
              />
            </View>

            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Total Conversations</Text>
                <Text style={styles.activityValue}>{stats?.total_conversations || 0}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Total Messages</Text>
                <Text style={styles.activityValue}>{stats?.total_messages || 0}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Resolved Reports</Text>
                <Text style={styles.activityValue}>{stats?.resolved_reports || 0}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  statTitle: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: spacing.xs,
  },
  menuSection: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  menuSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.accent.red,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.white,
  },
  activityCard: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  activityLabel: {
    fontSize: fontSize.base,
    color: colors.text.gray,
  },
  activityValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
});
