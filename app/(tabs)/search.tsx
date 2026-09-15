import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ListingCard } from '@/components/listings/ListingCard';
import { useAuthStore } from '@/store/authStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { searchListings, fetchCategories, toggleFavourite } from '@/lib/listings';
import { fontSize, fontWeight, spacing, borderRadius, shadows } from '@/constants/theme';
import { Listing, Category, SearchFilters } from '@/types';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating';

const recentSearches = [
  'Organic Chemistry textbook',
  'Studio apartment',
  'Python tutor',
  'Airport ride',
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!params.q);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (params.q) {
      performSearch();
    }
  }, [params.q]);

  const performSearch = useCallback(async () => {
    setIsLoading(true);
    setHasSearched(true);

    const filters: SearchFilters = {
      query: searchQuery,
      category: selectedCategory || undefined,
      minPrice: priceRange?.min,
      maxPrice: priceRange?.max === Infinity ? undefined : priceRange?.max,
      sortBy,
    };

    const results = await searchListings(filters, user?.id);
    setSearchResults(results);
    setIsLoading(false);
  }, [searchQuery, selectedCategory, priceRange, sortBy, user?.id]);

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    performSearch();
  }, [performSearch]);

  const handleRecentSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
    performSearch();
  }, [performSearch]);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory(null);
    setPriceRange(null);
    setSortBy('newest');
  }, []);

  const handleFavorite = async (id: string) => {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }

    const result = await toggleFavourite(id, user.id);
    if (!result.error) {
      setSearchResults((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isFavorite: result.isFavourite } : l))
      );
    }
  };

  const handleApplyFilters = useCallback(() => {
    setShowFilters(false);
    performSearch();
  }, [performSearch]);

  const activeFiltersCount = (() => {
    let count = 0;
    if (selectedCategory && selectedCategory !== 'all') count++;
    if (priceRange) count++;
    if (sortBy !== 'newest') count++;
    return count;
  })();

  const renderSearchHeader = () => (
    <View style={styles.searchHeader}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color={colors.text.gray} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search listings..."
          placeholderTextColor={colors.text.light}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoFocus={!params.q}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.text.gray} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.filterButton, activeFiltersCount > 0 && styles.filterButtonActive]}
        onPress={() => setShowFilters(true)}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={activeFiltersCount > 0 ? colors.text.white : colors.text.dark}
        />
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCategoryFilters = () => (
    <View style={styles.categoryFilters}>
      <Chip
        label="All"
        selected={!selectedCategory || selectedCategory === 'all'}
        onPress={() => {
          setSelectedCategory('all');
          performSearch();
        }}
        size="sm"
      />
      {categories.slice(0, 5).map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          selected={selectedCategory === category.slug}
          onPress={() => {
            setSelectedCategory(category.slug);
            performSearch();
          }}
          size="sm"
        />
      ))}
    </View>
  );

  const renderRecentSearches = () => (
    <View style={styles.recentSearches}>
      <Text style={styles.sectionTitle}>Recent Searches</Text>
      {recentSearches.map((query, index) => (
        <TouchableOpacity
          key={index}
          style={styles.recentSearchItem}
          onPress={() => handleRecentSearch(query)}
        >
          <Ionicons name="time-outline" size={18} color={colors.text.gray} />
          <Text style={styles.recentSearchText}>{query}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.suggestionsSection}>
        <Text style={styles.sectionTitle}>Popular Categories</Text>
        <View style={styles.popularCategories}>
          {categories.slice(0, 4).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.popularCategory}
              onPress={() => router.push(`/category/${category.slug}`)}
            >
              <View style={styles.categoryIcon}>
                <Ionicons
                  name={getCategoryIcon(category.slug)}
                  size={24}
                  color={colors.primary.DEFAULT}
                />
              </View>
              <Text style={styles.popularCategoryText}>{category.name}</Text>
              <Text style={styles.popularCategoryCount}>{category.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderResultsHeader = () => (
    <View style={styles.resultsHeader}>
      {renderCategoryFilters()}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsCount}>
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </Text>
        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearFilters}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderListingItem = ({ item }: { item: Listing }) => (
    <View style={styles.listingItem}>
      <ListingCard listing={item} variant="compact" onFavorite={handleFavorite} />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.text.gray} />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
      <Button title="Clear filters" onPress={handleClearFilters} variant="outline" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderSearchHeader()}

      {!hasSearched ? (
        renderRecentSearches()
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          ListHeaderComponent={renderResultsHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.filtersModal}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={colors.text.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.filtersContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              {(['newest', 'price-low', 'price-high'] as SortOption[]).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.filterOption}
                  onPress={() => setSortBy(option)}
                >
                  <Text style={styles.filterOptionText}>
                    {option === 'newest'
                      ? 'Newest First'
                      : option === 'price-low'
                      ? 'Price: Low to High'
                      : 'Price: High to Low'}
                  </Text>
                  {sortBy === option && (
                    <Ionicons name="checkmark" size={20} color={colors.primary.DEFAULT} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceRangeOptions}>
                {[
                  { label: 'Any', min: 0, max: Infinity },
                  { label: 'Under R500', min: 0, max: 500 },
                  { label: 'R500 - R2000', min: 500, max: 2000 },
                  { label: 'R2000 - R10000', min: 2000, max: 10000 },
                  { label: 'Over R10000', min: 10000, max: Infinity },
                ].map((range, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.priceRangeChip,
                      priceRange?.min === range.min &&
                        priceRange?.max === range.max &&
                        styles.priceRangeChipActive,
                    ]}
                    onPress={() =>
                      setPriceRange(
                        range.min === 0 && range.max === Infinity
                          ? null
                          : { min: range.min, max: range.max }
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.priceRangeChipText,
                        priceRange?.min === range.min &&
                          priceRange?.max === range.max &&
                          styles.priceRangeChipTextActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.filtersFooter}>
            <Button title="Clear All" onPress={handleClearFilters} variant="outline" />
            <View style={{ width: spacing.md }} />
            <Button title="Apply Filters" onPress={handleApplyFilters} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getCategoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    textbooks: 'book-outline',
    housing: 'home-outline',
    tutoring: 'school-outline',
    rides: 'car-outline',
    shifts: 'briefcase-outline',
    electronics: 'laptop-outline',
    furniture: 'bed-outline',
  };
  return icons[slug] || 'grid-outline';
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
    searchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.white,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      height: 48,
      gap: spacing.sm,
      ...shadows.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize.base,
      color: colors.text.dark,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.background.white,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
    filterButtonActive: {
      backgroundColor: colors.primary.DEFAULT,
    },
    filterBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.accent.red,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: fontWeight.bold,
      color: colors.text.white,
    },
    categoryFilters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    recentSearches: {
      padding: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text.dark,
      marginBottom: spacing.md,
    },
    recentSearchItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      gap: spacing.md,
    },
    recentSearchText: {
      fontSize: fontSize.base,
      color: colors.text.dark,
    },
    suggestionsSection: {
      marginTop: spacing.xl,
    },
    popularCategories: {
      gap: spacing.sm,
    },
    popularCategory: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.white,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      ...shadows.sm,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondary.light + '30',
      alignItems: 'center',
      justifyContent: 'center',
    },
    popularCategoryText: {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: colors.text.dark,
      marginLeft: spacing.md,
    },
    popularCategoryCount: {
      fontSize: fontSize.sm,
      color: colors.text.gray,
    },
    resultsHeader: {
      marginBottom: spacing.md,
    },
    resultsInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    resultsCount: {
      fontSize: fontSize.sm,
      color: colors.text.gray,
    },
    clearFilters: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.primary.DEFAULT,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing['3xl'],
    },
    listingItem: {
      marginBottom: spacing.md,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing['4xl'],
      paddingHorizontal: spacing.xl,
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
    },
    filtersModal: {
      flex: 1,
      backgroundColor: colors.background.white,
    },
    filtersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    filtersTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text.dark,
    },
    filtersContent: {
      flex: 1,
      padding: spacing.lg,
    },
    filterSection: {
      marginBottom: spacing.xl,
    },
    filterSectionTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.text.dark,
      marginBottom: spacing.md,
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    filterOptionText: {
      fontSize: fontSize.base,
      color: colors.text.dark,
    },
    priceRangeOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    priceRangeChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.DEFAULT,
      backgroundColor: colors.background.white,
    },
    priceRangeChipActive: {
      backgroundColor: colors.primary.DEFAULT,
      borderColor: colors.primary.DEFAULT,
    },
    priceRangeChipText: {
      fontSize: fontSize.sm,
      color: colors.text.dark,
    },
    priceRangeChipTextActive: {
      color: colors.text.white,
    },
    filtersFooter: {
      flexDirection: 'row',
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
  });
