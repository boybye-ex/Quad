import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { LiveBadge } from '@/components/ui/Badge';
import { ListingCard } from '@/components/listings/ListingCard';
import { CategoryChips } from '@/components/categories/CategoryChips';
import { useAuthStore } from '@/store/authStore';
import {
  mockCategories,
  mockListings,
  getFreshListings,
  appStats,
} from '@/services/mockData';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { selectedCampus, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const freshListings = getFreshListings(6);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(tabs)/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleFavorite = (id: string) => {
    console.log('Toggle favorite:', id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logo}>Quad.</Text>
            <TouchableOpacity style={styles.campusSelector}>
              <Ionicons name="location" size={16} color={colors.primary.DEFAULT} />
              <Text style={styles.campusText}>{selectedCampus?.shortName || 'Campus'}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.text.gray} />
            </TouchableOpacity>
          </View>
          {!isAuthenticated && (
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/welcome')}
            >
              <Text style={styles.signInText}>Sign in</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Everything you need,</Text>
          <Text style={styles.heroTitleGreen}>from the people next door.</Text>
          <Text style={styles.heroDescription}>
            A secure noticeboard for your campus: course books, rooms, tutoring, 
            shifts, and rides.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
            onFilterPress={() => router.push('/(tabs)/search')}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Browse the board"
            onPress={() => setSelectedCategory('all')}
            icon={<Ionicons name="arrow-forward" size={16} color={colors.text.white} />}
          />
          <TouchableOpacity style={styles.postButton} onPress={() => router.push('/(tabs)/post')}>
            <Ionicons name="add" size={20} color={colors.text.dark} />
            <Text style={styles.postButtonText}>Post listing</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appStats.students}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appStats.listings}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appStats.campuses}</Text>
            <Text style={styles.statLabel}>Campuses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{appStats.verification}</Text>
            <Text style={styles.statLabel}>Student-verified</Text>
          </View>
        </View>

        {/* Campus Rideshare Promo */}
        <TouchableOpacity style={styles.promoCard}>
          <View style={styles.promoIconContainer}>
            <Ionicons name="car" size={24} color={colors.primary.DEFAULT} />
          </View>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Campus Rideshare</Text>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>Weekend trips</Text>
            </View>
            <Text style={styles.promoDescription}>
              Share rides home, airports & split gas
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.gray} />
        </TouchableOpacity>

        {/* Fresh on the board */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Fresh on the board</Text>
            <LiveBadge />
          </View>
          <TouchableOpacity onPress={() => router.push('/category/all')}>
            <Text style={styles.viewAll}>View all →</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={freshListings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard listing={item} onFavorite={handleFavorite} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listingsContainer}
        />

        {/* Explore Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore categories</Text>
          <Text style={styles.activeHubs}>5 active hubs</Text>
        </View>

        <CategoryChips
          categories={mockCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Built by Students Section */}
        <View style={styles.builtBySection}>
          <View style={styles.builtByContent}>
            <Text style={styles.builtByTitle}>Built by students.</Text>
            <Text style={styles.builtByTitleGreen}>For students.</Text>
            <Text style={styles.builtByDescription}>
              Buy, sell, share and connect — safely within your campus community. 
              Verified .edu accounts keep it real.
            </Text>
            <Button
              title="Join quad"
              onPress={() => router.push('/(auth)/sign-up')}
              icon={<Ionicons name="arrow-forward" size={16} color={colors.text.white} />}
            />
            <View style={styles.features}>
              <FeatureItem icon="checkmark-circle" text="Student-verified" />
              <FeatureItem icon="call-outline" text="No phone numbers" />
              <FeatureItem icon="school" text="Campus only" />
            </View>
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400' }}
            style={styles.builtByImage}
            contentFit="cover"
          />
        </View>

        {/* Footer Spacing */}
        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={16} color={colors.secondary.DEFAULT} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  campusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...shadows.sm,
  },
  campusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  signInButton: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  signInText: {
    color: colors.text.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    lineHeight: 32,
  },
  heroTitleGreen: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary.DEFAULT,
    fontStyle: 'italic',
    lineHeight: 32,
  },
  heroDescription: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  postButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.gray,
    marginTop: 2,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  promoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary.light + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  promoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
  },
  promoBadge: {
    backgroundColor: colors.secondary.DEFAULT,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
  },
  promoBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.white,
  },
  promoDescription: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  viewAll: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary.DEFAULT,
  },
  activeHubs: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  listingsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  builtBySection: {
    backgroundColor: colors.background.cream,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  builtByContent: {
    padding: spacing.xl,
  },
  builtByTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    lineHeight: 32,
  },
  builtByTitleGreen: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary.DEFAULT,
    lineHeight: 32,
    marginBottom: spacing.md,
  },
  builtByDescription: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  builtByImage: {
    width: '100%',
    height: 200,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  footerSpace: {
    height: spacing['3xl'],
  },
});
