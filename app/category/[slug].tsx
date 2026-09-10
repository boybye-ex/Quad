import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SearchBar } from '@/components/ui/SearchBar';
import { Chip } from '@/components/ui/Chip';
import { ListingCard } from '@/components/listings/ListingCard';
import { mockCategories, getListingsByCategory } from '@/services/mockData';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/constants/theme';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const category = mockCategories.find((c) => c.slug === slug);
  const allListings = getListingsByCategory(slug);

  const filteredListings = useMemo(() => {
    let filtered = [...allListings];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return filtered;
  }, [allListings, searchQuery, sortBy]);

  const handleFavorite = (id: string) => {
    console.log('Toggle favorite:', id);
  };

  const renderListingItem = ({ item }: { item: typeof allListings[0] }) => (
    <View style={styles.listingItem}>
      <ListingCard listing={item} variant="compact" onFavorite={handleFavorite} />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search in ${category?.name || 'category'}...`}
          showFilter={false}
        />
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.text.dark} />
          <Text style={styles.sortButtonText}>
            {sortOptions.find((s) => s.value === sortBy)?.label}
          </Text>
          <Ionicons
            name={showSortOptions ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.text.gray}
          />
        </TouchableOpacity>

        <Text style={styles.resultsCount}>
          {filteredListings.length} result{filteredListings.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {showSortOptions && (
        <View style={styles.sortOptions}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortBy(option.value);
                setShowSortOptions(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={18} color={colors.primary.DEFAULT} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Category chips for quick switching */}
      <View style={styles.categoryChips}>
        {mockCategories.slice(0, 6).map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            selected={cat.slug === slug}
            onPress={() => router.replace(`/category/${cat.slug}`)}
            size="sm"
          />
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.text.gray} />
      <Text style={styles.emptyTitle}>No listings found</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? `No results for "${searchQuery}"`
          : `No listings in ${category?.name || 'this category'} yet`}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: category?.name || 'Category',
          headerBackTitle: 'Back',
          headerTintColor: colors.primary.DEFAULT,
          headerStyle: {
            backgroundColor: colors.background.DEFAULT,
          },
          headerTitleStyle: {
            fontWeight: fontWeight.semibold,
            color: colors.text.dark,
          },
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  headerContent: {
    paddingBottom: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  sortButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  resultsCount: {
    fontSize: fontSize.sm,
    color: colors.text.gray,
  },
  sortOptions: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sortOptionActive: {
    backgroundColor: colors.secondary.light + '20',
  },
  sortOptionText: {
    fontSize: fontSize.base,
    color: colors.text.dark,
  },
  sortOptionTextActive: {
    fontWeight: fontWeight.semibold,
    color: colors.primary.DEFAULT,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
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
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.dark,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.gray,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
