import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ListingCard } from '@/components/listings/ListingCard';
import { useAuthStore } from '@/store/authStore';
import { mockListings } from '@/services/mockData';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';
import { Listing, Campus } from '@/types';

type Tab = 'listings' | 'favorites' | 'settings';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout, selectedCampus, setSelectedCampus, campuses } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [showCampusPicker, setShowCampusPicker] = useState(false);

  const myListings = mockListings.filter((l) => l.seller.id === user?.id).slice(0, 3);
  const favoriteListings = mockListings.filter((l) => l.isFavorite);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const handleCampusSelect = (campus: Campus) => {
    setSelectedCampus(campus);
    setShowCampusPicker(false);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconContainer}>
            <Ionicons name="person" size={64} color={colors.primary.DEFAULT} />
          </View>
          <Text style={styles.authTitle}>Your Profile</Text>
          <Text style={styles.authDescription}>
            Sign in to manage your listings, favorites, and settings.
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/welcome')}
            fullWidth
          />
          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <Avatar name={user?.name || 'User'} uri={user?.avatar} size="xl" />
      <Text style={styles.userName}>{user?.name}</Text>
      <Text style={styles.userEmail}>{user?.email}</Text>
      <View style={styles.userMeta}>
        <View style={styles.metaBadge}>
          <Ionicons name="school" size={14} color={colors.primary.DEFAULT} />
          <Text style={styles.metaText}>{user?.role}</Text>
        </View>
        <View style={styles.metaBadge}>
          <Ionicons name="location" size={14} color={colors.primary.DEFAULT} />
          <Text style={styles.metaText}>{selectedCampus?.shortName}</Text>
        </View>
        {user?.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.secondary.DEFAULT} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'listings' && styles.tabActive]}
        onPress={() => setActiveTab('listings')}
      >
        <Text style={[styles.tabText, activeTab === 'listings' && styles.tabTextActive]}>
          My Listings
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
        onPress={() => setActiveTab('favorites')}
      >
        <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
          Favorites
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
        onPress={() => setActiveTab('settings')}
      >
        <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderListingsTab = () => (
    <View style={styles.tabContent}>
      {myListings.length > 0 ? (
        <>
          {myListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} variant="compact" />
          ))}
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All My Listings</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyTab}>
          <Ionicons name="cube-outline" size={48} color={colors.text.gray} />
          <Text style={styles.emptyTitle}>No listings yet</Text>
          <Text style={styles.emptyText}>
            Post your first listing to start selling or sharing with your campus.
          </Text>
          <Button
            title="Create Listing"
            onPress={() => router.push('/(tabs)/post')}
            variant="outline"
          />
        </View>
      )}
    </View>
  );

  const renderFavoritesTab = () => (
    <View style={styles.tabContent}>
      {favoriteListings.length > 0 ? (
        favoriteListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} variant="compact" />
        ))
      ) : (
        <View style={styles.emptyTab}>
          <Ionicons name="heart-outline" size={48} color={colors.text.gray} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on listings to save them here.
          </Text>
          <Button
            title="Browse Listings"
            onPress={() => router.push('/(tabs)')}
            variant="outline"
          />
        </View>
      )}
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      {/* Account Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Account</Text>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="person-outline" size={20} color={colors.text.dark} />
            <Text style={styles.settingsItemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.gray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsItem}
          onPress={() => setShowCampusPicker(true)}
        >
          <View style={styles.settingsItemLeft}>
            <Ionicons name="location-outline" size={20} color={colors.text.dark} />
            <Text style={styles.settingsItemText}>Campus</Text>
          </View>
          <View style={styles.settingsItemRight}>
            <Text style={styles.settingsItemValue}>{selectedCampus?.shortName}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.gray} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Preferences Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Preferences</Text>

        <View style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.text.dark} />
            <Text style={styles.settingsItemText}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border.DEFAULT, true: colors.secondary.light }}
            thumbColor={notificationsEnabled ? colors.primary.DEFAULT : colors.text.light}
          />
        </View>

        <View style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="moon-outline" size={20} color={colors.text.dark} />
            <Text style={styles.settingsItemText}>Dark Mode</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: colors.border.DEFAULT, true: colors.secondary.light }}
            thumbColor={darkModeEnabled ? colors.primary.DEFAULT : colors.text.light}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Support</Text>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="help-circle-outline" size={20} color={colors.text.dark} />
            <Text style={styles.settingsItemText}>Help Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.text.dark} />
            <Text style={styles.settingsItemText}>Safety Tips</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="document-text-outline" size={20} color={colors.text.dark} />
            <Text style={styles.settingsItemText}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <View style={styles.settingsItemLeft}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.text.dark} />
            <Text style={styles.settingsItemText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.gray} />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.accent.red} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Quad v1.0.0</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderTabs()}
        {activeTab === 'listings' && renderListingsTab()}
        {activeTab === 'favorites' && renderFavoritesTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </ScrollView>

      {/* Campus Picker Modal */}
      <Modal
        visible={showCampusPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCampusPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Campus</Text>
            <TouchableOpacity onPress={() => setShowCampusPicker(false)}>
              <Ionicons name="close" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {campuses.map((campus) => (
              <TouchableOpacity
                key={campus.id}
                style={[
                  styles.campusOption,
                  selectedCampus?.id === campus.id && styles.campusOptionSelected,
                ]}
                onPress={() => handleCampusSelect(campus)}
              >
                <View>
                  <Text style={styles.campusName}>{campus.name}</Text>
                  <Text style={styles.campusLocation}>{campus.city}, {campus.province}</Text>
                </View>
                {selectedCampus?.id === campus.id && (
                  <Ionicons name="checkmark" size={20} color={colors.primary.DEFAULT} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.white,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginTop: spacing.md,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: spacing.xs,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.light + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary.DEFAULT,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.secondary.DEFAULT,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary.DEFAULT,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.gray,
  },
  tabTextActive: {
    color: colors.primary.DEFAULT,
  },
  tabContent: {
    padding: spacing.lg,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary.DEFAULT,
  },
  emptyTab: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  settingsSection: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  settingsSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsItemText: {
    fontSize: fontSize.base,
    color: colors.text.dark,
  },
  settingsItemValue: {
    fontSize: fontSize.base,
    color: colors.text.gray,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.white,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  signOutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.accent.red,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing['3xl'],
  },
  authPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  authIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  authTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  authDescription: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  createAccountButton: {
    marginTop: spacing.lg,
  },
  createAccountText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary.DEFAULT,
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
    flex: 1,
  },
  campusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  campusOptionSelected: {
    backgroundColor: colors.secondary.light + '20',
  },
  campusName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  campusLocation: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
    marginTop: 2,
  },
});
