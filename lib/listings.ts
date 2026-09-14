import { supabase } from './supabase';
import { Listing, Category, Campus, User, PriceType, SearchFilters } from '@/types';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  display_order: number;
  created_at: string;
}

export interface SupabaseListing {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  price_type: PriceType;
  category_id: string;
  images: string[];
  seller_id: string;
  campus_id: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | null;
  tags: string[];
  status: 'active' | 'hidden' | 'deleted';
  view_count: number;
  created_at: string;
  updated_at: string;
  categories?: SupabaseCategory;
  profiles?: {
    id: string;
    name: string;
    avatar_url: string | null;
    role: 'student' | 'ta' | 'admin';
    is_verified: boolean;
    campus_id: string | null;
  };
  campuses?: {
    id: string;
    name: string;
    short_name: string;
    city: string;
    province: string;
  };
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  priceType: PriceType;
  categoryId: string;
  images: string[];
  campusId: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair';
  tags?: string[];
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return (data || []).map((cat: SupabaseCategory) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    count: 0,
  }));
}

function mapListing(listing: SupabaseListing, isFavourite: boolean = false): Listing {
  const category: Category = listing.categories
    ? {
        id: listing.categories.id,
        name: listing.categories.name,
        slug: listing.categories.slug,
        icon: listing.categories.icon,
        count: 0,
      }
    : { id: listing.category_id, name: 'Unknown', slug: 'unknown', icon: 'grid-outline', count: 0 };

  const campus: Campus = listing.campuses
    ? {
        id: listing.campuses.id,
        name: listing.campuses.name,
        shortName: listing.campuses.short_name,
        city: listing.campuses.city,
        province: listing.campuses.province,
        kind: 'public_university',
        allowedEmailDomains: [],
        createdAt: new Date(),
      }
    : {
        id: listing.campus_id,
        name: 'Unknown',
        shortName: 'Unknown',
        city: '',
        province: '',
        kind: 'public_university',
        allowedEmailDomains: [],
        createdAt: new Date(),
      };

  const seller: User = listing.profiles
    ? {
        id: listing.profiles.id,
        name: listing.profiles.name,
        email: '',
        avatar: listing.profiles.avatar_url || undefined,
        role: listing.profiles.role,
        isVerified: listing.profiles.is_verified,
        isSuspended: false,
        campus: null,
        campusId: listing.profiles.campus_id,
        createdAt: new Date(),
      }
    : {
        id: listing.seller_id,
        name: 'Unknown',
        email: '',
        role: 'student',
        isVerified: false,
        isSuspended: false,
        campus: null,
        campusId: null,
        createdAt: new Date(),
      };

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    originalPrice: listing.original_price || undefined,
    priceType: listing.price_type,
    category,
    images: listing.images,
    seller,
    campus,
    condition: listing.condition || undefined,
    tags: listing.tags,
    createdAt: new Date(listing.created_at),
    isFavorite: isFavourite,
  };
}

export async function fetchListings(options?: {
  category?: string;
  campusId?: string;
  limit?: number;
  offset?: number;
  userId?: string;
}): Promise<Listing[]> {
  const { category, campusId, limit = 20, offset = 0, userId } = options || {};

  let query = supabase
    .from('listings')
    .select(
      `
      *,
      categories(*),
      profiles(id, name, avatar_url, role, is_verified, campus_id),
      campuses(id, name, short_name, city, province)
    `
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && category !== 'all') {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();

    if (categoryData) {
      query = query.eq('category_id', categoryData.id);
    }
  }

  if (campusId) {
    query = query.eq('campus_id', campusId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  let favouriteIds: Set<string> = new Set();
  if (userId) {
    const { data: favData } = await supabase
      .from('favourites')
      .select('listing_id')
      .eq('user_id', userId);

    if (favData) {
      favouriteIds = new Set(favData.map((f) => f.listing_id));
    }
  }

  return (data || []).map((listing: SupabaseListing) =>
    mapListing(listing, favouriteIds.has(listing.id))
  );
}

export async function fetchFreshListings(limit: number = 10, userId?: string): Promise<Listing[]> {
  return fetchListings({ limit, userId });
}

export async function fetchListingById(id: string, userId?: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      `
      *,
      categories(*),
      profiles(id, name, avatar_url, role, is_verified, campus_id),
      campuses(id, name, short_name, city, province)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    return null;
  }

  let isFavourite = false;
  if (userId) {
    const { data: favData } = await supabase
      .from('favourites')
      .select('id')
      .eq('listing_id', id)
      .eq('user_id', userId)
      .single();

    isFavourite = !!favData;
  }

  try {
    await supabase.from('listings').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id);
  } catch {
    // Ignore view count increment errors
  }

  return mapListing(data, isFavourite);
}

export async function searchListings(
  filters: SearchFilters,
  userId?: string
): Promise<Listing[]> {
  const { query, category, minPrice, maxPrice, campus, sortBy } = filters;

  let dbQuery = supabase
    .from('listings')
    .select(
      `
      *,
      categories(*),
      profiles(id, name, avatar_url, role, is_verified, campus_id),
      campuses(id, name, short_name, city, province)
    `
    )
    .eq('status', 'active');

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (category && category !== 'all') {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();

    if (categoryData) {
      dbQuery = dbQuery.eq('category_id', categoryData.id);
    }
  }

  if (minPrice !== undefined) {
    dbQuery = dbQuery.gte('price', minPrice);
  }

  if (maxPrice !== undefined) {
    dbQuery = dbQuery.lte('price', maxPrice);
  }

  if (campus) {
    dbQuery = dbQuery.eq('campus_id', campus);
  }

  switch (sortBy) {
    case 'price-low':
      dbQuery = dbQuery.order('price', { ascending: true });
      break;
    case 'price-high':
      dbQuery = dbQuery.order('price', { ascending: false });
      break;
    case 'newest':
    default:
      dbQuery = dbQuery.order('created_at', { ascending: false });
      break;
  }

  const { data, error } = await dbQuery.limit(50);

  if (error) {
    console.error('Error searching listings:', error);
    return [];
  }

  let favouriteIds: Set<string> = new Set();
  if (userId) {
    const { data: favData } = await supabase
      .from('favourites')
      .select('listing_id')
      .eq('user_id', userId);

    if (favData) {
      favouriteIds = new Set(favData.map((f) => f.listing_id));
    }
  }

  return (data || []).map((listing: SupabaseListing) =>
    mapListing(listing, favouriteIds.has(listing.id))
  );
}

export async function fetchUserListings(userId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      `
      *,
      categories(*),
      profiles(id, name, avatar_url, role, is_verified, campus_id),
      campuses(id, name, short_name, city, province)
    `
    )
    .eq('seller_id', userId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user listings:', error);
    return [];
  }

  return (data || []).map((listing: SupabaseListing) => mapListing(listing, false));
}

export async function fetchFavourites(userId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('favourites')
    .select(
      `
      listing_id,
      listings(
        *,
        categories(*),
        profiles(id, name, avatar_url, role, is_verified, campus_id),
        campuses(id, name, short_name, city, province)
      )
    `
    )
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching favourites:', error);
    return [];
  }

  const results: Listing[] = [];
  for (const fav of data || []) {
    const listing = fav.listings as unknown as SupabaseListing | null;
    if (listing && listing.status === 'active') {
      results.push(mapListing(listing, true));
    }
  }
  return results;
}

export async function toggleFavourite(
  listingId: string,
  userId: string
): Promise<{ isFavourite: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('favourites')
    .select('id')
    .eq('listing_id', listingId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('favourites')
      .delete()
      .eq('listing_id', listingId)
      .eq('user_id', userId);

    if (error) {
      return { isFavourite: true, error: error.message };
    }
    return { isFavourite: false };
  } else {
    const { error } = await supabase.from('favourites').insert({
      listing_id: listingId,
      user_id: userId,
    });

    if (error) {
      return { isFavourite: false, error: error.message };
    }
    return { isFavourite: true };
  }
}

export async function uploadListingImage(
  userId: string,
  imageUri: string
): Promise<{ url: string | null; error?: string }> {
  try {
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return { url: null, error: error.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('listing-images').getPublicUrl(data.path);

    return { url: publicUrl };
  } catch (err) {
    console.error('Error uploading image:', err);
    return { url: null, error: 'Failed to upload image' };
  }
}

export async function createListing(
  input: CreateListingInput,
  sellerId: string
): Promise<{ listing: Listing | null; error?: string }> {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      title: input.title,
      description: input.description,
      price: input.price,
      original_price: input.originalPrice,
      price_type: input.priceType,
      category_id: input.categoryId,
      images: input.images,
      seller_id: sellerId,
      campus_id: input.campusId,
      condition: input.condition,
      tags: input.tags || [],
      status: 'active',
    })
    .select(
      `
      *,
      categories(*),
      profiles(id, name, avatar_url, role, is_verified, campus_id),
      campuses(id, name, short_name, city, province)
    `
    )
    .single();

  if (error) {
    console.error('Error creating listing:', error);
    return { listing: null, error: error.message };
  }

  return { listing: mapListing(data, false) };
}

export async function updateListing(
  listingId: string,
  updates: Partial<CreateListingInput>
): Promise<{ listing: Listing | null; error?: string }> {
  const updateData: Record<string, unknown> = {};

  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.originalPrice !== undefined) updateData.original_price = updates.originalPrice;
  if (updates.priceType) updateData.price_type = updates.priceType;
  if (updates.categoryId) updateData.category_id = updates.categoryId;
  if (updates.images) updateData.images = updates.images;
  if (updates.condition) updateData.condition = updates.condition;
  if (updates.tags) updateData.tags = updates.tags;

  const { data, error } = await supabase
    .from('listings')
    .update(updateData)
    .eq('id', listingId)
    .select(
      `
      *,
      categories(*),
      profiles(id, name, avatar_url, role, is_verified, campus_id),
      campuses(id, name, short_name, city, province)
    `
    )
    .single();

  if (error) {
    console.error('Error updating listing:', error);
    return { listing: null, error: error.message };
  }

  return { listing: mapListing(data, false) };
}

export async function hideListing(listingId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'hidden' })
    .eq('id', listingId);

  if (error) {
    return { error: error.message };
  }
  return {};
}

export async function deleteListing(listingId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('listings')
    .update({ status: 'deleted' })
    .eq('id', listingId);

  if (error) {
    return { error: error.message };
  }
  return {};
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('listings')
    .select('category_id')
    .eq('status', 'active');

  if (error || !data) {
    return {};
  }

  const counts: Record<string, number> = {};
  data.forEach((l) => {
    counts[l.category_id] = (counts[l.category_id] || 0) + 1;
  });

  return counts;
}
