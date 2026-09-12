import { Campus, Category, User, Listing, Conversation } from '@/types';

export const mockCampuses: Campus[] = [
  {
    id: 'campus_1',
    name: 'University of Cape Town',
    shortName: 'UCT',
    city: 'Cape Town',
    province: 'Western Cape',
    kind: 'public_university',
    allowedEmailDomains: ['myuct.ac.za', 'uct.ac.za'],
    createdAt: new Date(),
  },
  {
    id: 'campus_2',
    name: 'University of the Witwatersrand',
    shortName: 'Wits',
    city: 'Johannesburg',
    province: 'Gauteng',
    kind: 'public_university',
    allowedEmailDomains: ['students.wits.ac.za', 'wits.ac.za'],
    createdAt: new Date(),
  },
  {
    id: 'campus_3',
    name: 'Stellenbosch University',
    shortName: 'SU',
    city: 'Stellenbosch',
    province: 'Western Cape',
    kind: 'public_university',
    allowedEmailDomains: ['sun.ac.za'],
    createdAt: new Date(),
  },
  {
    id: 'campus_4',
    name: 'University of Pretoria',
    shortName: 'UP',
    city: 'Pretoria',
    province: 'Gauteng',
    kind: 'public_university',
    allowedEmailDomains: ['tuks.co.za', 'up.ac.za'],
    createdAt: new Date(),
  },
  {
    id: 'campus_5',
    name: 'University of KwaZulu-Natal',
    shortName: 'UKZN',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    kind: 'public_university',
    allowedEmailDomains: ['stu.ukzn.ac.za', 'ukzn.ac.za'],
    createdAt: new Date(),
  },
];

export const mockCategories: Category[] = [
  { id: 'cat_1', name: 'All', slug: 'all', icon: 'grid', count: 0 },
  { id: 'cat_2', name: 'Textbooks', slug: 'textbooks', icon: 'book', count: 48 },
  { id: 'cat_3', name: 'Housing', slug: 'housing', icon: 'home', count: 19 },
  { id: 'cat_4', name: 'Tutoring', slug: 'tutoring', icon: 'school', count: 24 },
  { id: 'cat_5', name: 'Rides', slug: 'rides', icon: 'car', count: 15 },
  { id: 'cat_6', name: 'Shifts', slug: 'shifts', icon: 'briefcase', count: 8 },
  { id: 'cat_7', name: 'Electronics', slug: 'electronics', icon: 'laptop', count: 32 },
  { id: 'cat_8', name: 'Furniture', slug: 'furniture', icon: 'bed', count: 12 },
];

export const mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'Sarah Mitchell',
    email: 'sarah.m@myuct.ac.za',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'student',
    isVerified: true,
    isSuspended: false,
    campus: mockCampuses[0],
    campusId: mockCampuses[0].id,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user_2',
    name: 'Alex Thompson',
    email: 'alex.t@myuct.ac.za',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'student',
    isVerified: true,
    isSuspended: false,
    campus: mockCampuses[0],
    campusId: mockCampuses[0].id,
    createdAt: new Date('2023-09-01'),
  },
  {
    id: 'user_3',
    name: 'Elena Vasquez',
    email: 'elena.v@myuct.ac.za',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'ta',
    isVerified: true,
    isSuspended: false,
    campus: mockCampuses[0],
    campusId: mockCampuses[0].id,
    createdAt: new Date('2023-06-20'),
  },
  {
    id: 'user_4',
    name: 'Michael Chen',
    email: 'michael.c@myuct.ac.za',
    avatar: 'https://i.pravatar.cc/150?img=4',
    role: 'student',
    isVerified: true,
    isSuspended: false,
    campus: mockCampuses[0],
    campusId: mockCampuses[0].id,
    createdAt: new Date('2024-02-10'),
  },
  {
    id: 'user_5',
    name: 'Emma Rodriguez',
    email: 'emma.r@myuct.ac.za',
    avatar: 'https://i.pravatar.cc/150?img=5',
    role: 'student',
    isVerified: true,
    isSuspended: false,
    campus: mockCampuses[0],
    campusId: mockCampuses[0].id,
    createdAt: new Date('2022-08-15'),
  },
];

export const mockListings: Listing[] = [
  {
    id: 'listing_1',
    title: 'Organic Chemistry 8th Ed',
    description: 'Marked good condition, no missing pages. Perfect for CHEM 33.',
    price: 45,
    originalPrice: 120,
    priceType: 'fixed',
    category: mockCategories[1],
    images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400'],
    seller: mockUsers[0],
    campus: mockCampuses[0],
    tags: ['CHEM 33'],
    condition: 'good',
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    isFavorite: false,
  },
  {
    id: 'listing_2',
    title: 'Sunny Studio Sublet (Summer)',
    description: 'Furnished, AC + high-speed fiber included. 2 blks from campus.',
    price: 850,
    priceType: 'monthly',
    category: mockCategories[2],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
    seller: mockUsers[1],
    campus: mockCampuses[0],
    tags: ['2 blks from campus'],
    createdAt: new Date(Date.now() - 24 * 60 * 1000),
    isFavorite: true,
  },
  {
    id: 'listing_3',
    title: 'CS106B Exam Prep & Tutoring',
    description: 'Recursion, trees & pointers mastery. Available weekends.',
    price: 32,
    priceType: 'hourly',
    category: mockCategories[3],
    images: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'],
    seller: mockUsers[2],
    campus: mockCampuses[0],
    rating: 5.0,
    reviewCount: 18,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    id: 'listing_4',
    title: 'MacBook Pro 14" M3 Pro',
    description: '16GB RAM, 512GB SSD. Perfect condition, AppleCare+ until 2025.',
    price: 1450,
    originalPrice: 1999,
    priceType: 'fixed',
    category: mockCategories[6],
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
    seller: mockUsers[3],
    campus: mockCampuses[0],
    condition: 'like-new',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    id: 'listing_5',
    title: 'Ride to OR Tambo - Friday 3PM',
    description: 'Have 3 seats available. Split petrol. Going to JNB airport.',
    price: 150,
    priceType: 'fixed',
    category: mockCategories[4],
    images: ['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400'],
    seller: mockUsers[4],
    campus: mockCampuses[0],
    tags: ['Weekend trips'],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    id: 'listing_6',
    title: 'IKEA Desk + Chair Set',
    description: 'MALM desk and MARKUS chair. Like new, selling due to move.',
    price: 1200,
    originalPrice: 2800,
    priceType: 'fixed',
    category: mockCategories[7],
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400'],
    seller: mockUsers[1],
    campus: mockCampuses[0],
    condition: 'like-new',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isFavorite: true,
  },
  {
    id: 'listing_7',
    title: 'Coffee Shop Shift Coverage',
    description: 'Need someone to cover my shift at Vida e Caffè this Saturday 8am-2pm.',
    price: 0,
    priceType: 'free',
    category: mockCategories[5],
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
    seller: mockUsers[0],
    campus: mockCampuses[0],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    id: 'listing_8',
    title: 'Physics 41 + 43 Bundle',
    description: 'Both textbooks for intro physics sequence. Some highlighting.',
    price: 750,
    originalPrice: 2000,
    priceType: 'fixed',
    category: mockCategories[1],
    images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400'],
    seller: mockUsers[4],
    campus: mockCampuses[0],
    tags: ['PHYSICS 41', 'PHYSICS 43'],
    condition: 'good',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    id: 'listing_9',
    title: 'Math 51 Linear Algebra Tutor',
    description: 'Graduate student offering help with proofs and problem sets.',
    price: 400,
    priceType: 'hourly',
    category: mockCategories[3],
    images: ['https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=400'],
    seller: mockUsers[4],
    campus: mockCampuses[0],
    rating: 4.8,
    reviewCount: 12,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    isFavorite: false,
  },
  {
    id: 'listing_10',
    title: '2BR Apartment - Second Semester',
    description: 'Looking for 1 roommate. Close to Jammie Shuttle, parking included.',
    price: 6000,
    priceType: 'monthly',
    category: mockCategories[2],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'],
    seller: mockUsers[3],
    campus: mockCampuses[0],
    tags: ['Second Semester', 'Parking'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isFavorite: false,
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    participants: [mockUsers[0], mockUsers[1]],
    listing: mockListings[1],
    lastMessage: {
      id: 'msg_1',
      senderId: mockUsers[1].id,
      receiverId: mockUsers[0].id,
      content: 'Is the studio still available for June?',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
    },
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 'conv_2',
    participants: [mockUsers[0], mockUsers[2]],
    listing: mockListings[2],
    lastMessage: {
      id: 'msg_2',
      senderId: mockUsers[0].id,
      receiverId: mockUsers[2].id,
      content: 'Can we schedule for this weekend?',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true,
    },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

export const appStats = {
  students: '120K+',
  listings: '50K+',
  campuses: 35,
  verification: '100%',
};

export function getListingsByCategory(categorySlug: string): Listing[] {
  if (categorySlug === 'all') return mockListings;
  return mockListings.filter((l) => l.category.slug === categorySlug);
}

export function getListingById(id: string): Listing | undefined {
  return mockListings.find((l) => l.id === id);
}

export function searchListings(query: string): Listing[] {
  const lowercaseQuery = query.toLowerCase();
  return mockListings.filter(
    (l) =>
      l.title.toLowerCase().includes(lowercaseQuery) ||
      l.description.toLowerCase().includes(lowercaseQuery) ||
      l.tags?.some((t) => t.toLowerCase().includes(lowercaseQuery))
  );
}

export function getFreshListings(limit: number = 10): Listing[] {
  return [...mockListings]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
