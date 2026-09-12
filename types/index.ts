export interface Campus {
  id: string;
  name: string;
  shortName: string;
  city: string;
  province: string;
  kind: 'public_university' | 'private_college' | 'tvet';
  allowedEmailDomains: string[];
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'ta' | 'admin';
  isVerified: boolean;
  isSuspended: boolean;
  campus: Campus | null;
  campusId: string | null;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export type PriceType = 'fixed' | 'hourly' | 'monthly' | 'free';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  priceType: PriceType;
  category: Category;
  images: string[];
  seller: User;
  campus: Campus;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  condition?: 'new' | 'like-new' | 'good' | 'fair';
  createdAt: Date;
  isFavorite?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  listing?: Listing;
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedCampus: Campus | null;
}

export interface SearchFilters {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  campus?: string;
  sortBy: 'newest' | 'price-low' | 'price-high' | 'rating';
}
