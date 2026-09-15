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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAdminReports, resolveReport, AdminReport } from '@/lib/admin';
import { fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';

type FilterStatus = 'all' | 'pending' | 'resolved' | 'dismissed';

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate content',
  scam: 'Scam or fraud',
  harassment: 'Harassment',
  fake_listing: 'Fake listing',
  prohibited_item: 'Prohibited item',
  other: 'Other',
};

export default function AdminReportsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionType, setResolutionType] = useState<'resolved' | 'dismissed'>('resolved');

  const loadReports = useCallback(async () => {
    const status = filter === 'all' ? undefined : filter;
    const data = await getAdminReports(50, 0, status as any);
    setReports(data);
    setIsLoading(false);
  }, [filter]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/(tabs)');
      return;
    }
    loadReports();
  }, [user, router, loadReports]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReports();
    setIsRefreshing(false);
  };

  const openResolutionModal = (report: AdminReport, type: 'resolved' | 'dismissed') => {
    setSelectedReport(report);
    setResolutionType(type);
    setResolutionNotes('');
    setShowResolutionModal(true);
  };

  const handleResolve = async () => {
    if (!selectedReport) return;

    const result = await resolveReport(
      selectedReport.id,
      resolutionType,
      resolutionNotes || undefined
    );

    if (result.success) {
      setShowResolutionModal(false);
      loadReports();
    } else {
      Alert.alert('Error', result.error || 'Failed to resolve report');
    }
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
      case 'pending':
        return colors.accent.orange;
      case 'resolved':
        return colors.secondary.DEFAULT;
      case 'dismissed':
        return colors.text.gray;
      default:
        return colors.text.gray;
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'listing':
        return 'cube';
      case 'user':
        return 'person';
      case 'message':
        return 'chatbubble';
      default:
        return 'help-circle';
    }
  };

  const renderReport = ({ item }: { item: AdminReport }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.targetInfo}>
          <View style={[styles.targetIcon, { backgroundColor: colors.primary.DEFAULT + '20' }]}>
            <Ionicons
              name={getTargetIcon(item.target_type) as any}
              size={16}
              color={colors.primary.DEFAULT}
            />
          </View>
          <View>
            <Text style={styles.targetType}>{item.target_type}</Text>
            <Text style={styles.targetTitle} numberOfLines={1}>
              {item.target_title}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.reasonContainer}>
        <Text style={styles.reasonLabel}>Reason:</Text>
        <Text style={styles.reasonText}>{REASON_LABELS[item.reason] || item.reason}</Text>
      </View>

      {item.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Details:</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
      )}

      <View style={styles.reporterInfo}>
        <Ionicons name="person-outline" size={14} color={colors.text.gray} />
        <Text style={styles.reporterText}>
          Reported by {item.reporter_name} • {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      {item.status !== 'pending' && item.resolver_name && (
        <View style={styles.resolutionInfo}>
          <Text style={styles.resolutionLabel}>
            {item.status === 'resolved' ? 'Resolved' : 'Dismissed'} by {item.resolver_name}
          </Text>
          {item.resolution_notes && (
            <Text style={styles.resolutionNotes}>{item.resolution_notes}</Text>
          )}
        </View>
      )}

      {item.status === 'pending' && (
        <View style={styles.reportActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonResolve]}
            onPress={() => openResolutionModal(item, 'resolved')}
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.text.white} />
            <Text style={styles.actionButtonText}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDismiss]}
            onPress={() => openResolutionModal(item, 'dismissed')}
          >
            <Ionicons name="close-circle" size={16} color={colors.text.white} />
            <Text style={styles.actionButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.target_type === 'listing' && (
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push(`/listing/${item.target_id}`)}
        >
          <Text style={styles.viewButtonText}>View Listing</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Reports Queue',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.filterContainer}>
          {renderFilterButton('pending', 'Pending')}
          {renderFilterButton('resolved', 'Resolved')}
          {renderFilterButton('dismissed', 'Dismissed')}
          {renderFilterButton('all', 'All')}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={renderReport}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="flag-outline" size={48} color={colors.text.gray} />
                <Text style={styles.emptyText}>No reports found</Text>
              </View>
            }
          />
        )}

        <Modal
          visible={showResolutionModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowResolutionModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {resolutionType === 'resolved' ? 'Resolve Report' : 'Dismiss Report'}
              </Text>
              <TouchableOpacity onPress={() => setShowResolutionModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.dark} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Resolution Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={resolutionNotes}
                onChangeText={setResolutionNotes}
                placeholder="Add notes about this resolution..."
                placeholderTextColor={colors.text.light}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  resolutionType === 'dismissed' && styles.submitButtonDismiss,
                ]}
                onPress={handleResolve}
              >
                <Text style={styles.submitButtonText}>
                  {resolutionType === 'resolved' ? 'Mark as Resolved' : 'Dismiss Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
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
  reportCard: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  targetIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetType: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
    textTransform: 'capitalize',
  },
  targetTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
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
  reasonContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  reasonLabel: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginRight: spacing.xs,
  },
  reasonText: {
    fontSize: fontSize.sm,
    color: colors.text.dark,
    fontWeight: fontWeight.medium,
  },
  descriptionContainer: {
    backgroundColor: colors.background.DEFAULT,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  descriptionLabel: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    color: colors.text.dark,
    lineHeight: 20,
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  reporterText: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
  },
  resolutionInfo: {
    backgroundColor: colors.secondary.light + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  resolutionLabel: {
    fontSize: fontSize.sm,
    color: colors.secondary.DEFAULT,
    fontWeight: fontWeight.medium,
  },
  resolutionNotes: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: spacing.xs,
  },
  reportActions: {
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
  actionButtonResolve: {
    backgroundColor: colors.secondary.DEFAULT,
  },
  actionButtonDismiss: {
    backgroundColor: colors.text.gray,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  modalContent: {
    padding: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.background.DEFAULT,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.dark,
    minHeight: 120,
    marginBottom: spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.secondary.DEFAULT,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  submitButtonDismiss: {
    backgroundColor: colors.text.gray,
  },
  submitButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.white,
  },
});
