# Quad Mobile

A React Native mobile application for campus marketplace - buy, sell, and share textbooks, housing, tutoring, rides, and more with verified students at your campus.

## Features

- **Browse Listings** - Explore textbooks, housing, tutoring, rides, shifts, electronics, and furniture
- **Search & Filter** - Find what you need with powerful search and filtering
- **Post Listings** - Create listings with photos, pricing, and descriptions
- **Real-Time Messaging** - Chat securely with other students with live message updates (no phone numbers shared)
- **Contact Seller** - One-click to start or resume conversations about listings
- **User Profiles** - Manage your listings, favorites, and settings
- **Campus Communities** - Connect with verified students at your campus
- **SA University Support** - All 26 public universities and 9 major private colleges

## Tech Stack

- **Framework**: React Native with Expo (SDK 57)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand + React Query
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Forms**: React Hook Form + Zod
- **Storage**: expo-secure-store, AsyncStorage
- **Images**: expo-image, expo-image-picker

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Supabase account (free tier available)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your Supabase credentials

# Start the development server
npm start
```

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key from Settings > API

2. **Run Migrations**
   ```bash
   # Option A: Using Supabase Dashboard
   # Go to SQL Editor and run the contents of (in order):
   # - supabase/migrations/00001_initial_schema.sql
   # - supabase/migrations/00002_listings.sql
   # - supabase/seed.sql
   # - supabase/seed_listings.sql (after creating a test user)

   # Option B: Using Supabase CLI
   supabase link --project-ref your-project-ref
   supabase db push
   ```

3. **Configure Environment Variables**
   ```bash
   # In your .env file:
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Enable Email Confirmation**
   - In Supabase Dashboard > Authentication > Providers > Email
   - Enable "Confirm email" (recommended for production)
   - For local testing, you can disable this temporarily

5. **Create Admin User**
   ```bash
   # In Supabase Dashboard > Authentication > Users > Add User
   # Email: admin@quad.local (or your admin email)
   # After creation, run this SQL to make them admin:
   UPDATE profiles SET role = 'admin', campus_id = NULL WHERE email = 'admin@quad.local';
   ```

### Running on Device/Simulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Testing Authentication

1. **Sign Up Flow**
   - Select a campus (e.g., "University of Cape Town")
   - Enter an email matching that campus domain (e.g., `test@myuct.ac.za`)
   - Personal emails (Gmail, Yahoo, etc.) are rejected
   - Confirm your email if email confirmation is enabled

2. **Sign In Flow**
   - Use your registered campus email and password
   - Admin users can sign in with `admin@quad.local`

### Seeded Campuses

The database includes all 26 South African public universities and 9 major private colleges:

**Public Universities (26):**
- Western Cape: UCT, Stellenbosch, UWC, CPUT
- Gauteng: Wits, UJ, UP, TUT, UNISA, SMU, VUT
- KwaZulu-Natal: UKZN, DUT, UniZulu, MUT
- Eastern Cape: NMU, WSU, Rhodes, UFH
- Free State: UFS, CUT
- Limpopo: UL, Univen
- North West: NWU
- Northern Cape: SPU
- Mpumalanga: UMP

**Private Colleges (9):**
IIE MSA, Varsity College, Rosebank College, Vega, Eduvos, AFDA, STADIO, MANCOSA, Boston

### Email Domain Verification

Students must register with their campus email. Each campus has specific allowed domains:
- UCT: `myuct.ac.za`, `uct.ac.za`
- Wits: `students.wits.ac.za`, `wits.ac.za`
- etc.

Personal email providers (Gmail, Yahoo, Hotmail, etc.) are blocked.
Alumni domains are not allowed in v1 (current students only).

### Storage Bucket Setup (Step 2)

The app uses Supabase Storage for listing images. The migration creates a `listing-images` bucket, but you may need to verify it in the dashboard:

1. Go to Supabase Dashboard > Storage
2. Verify `listing-images` bucket exists (created by migration)
3. If not, create it manually:
   - Name: `listing-images`
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

The storage policies allow:
- Public read access to all images
- Authenticated users can upload to their own folder (`{user_id}/`)
- Users can only modify/delete their own images

### Demo Listings (Step 2)

After creating a test user, seed demo listings:

```sql
-- Run supabase/seed_listings.sql after creating at least one verified user
-- The seed creates 15 realistic listings across UCT, Wits, Stellenbosch, UJ, and UNISA
```

Categories seeded: Textbooks, Housing, Tutoring, Rides, Shifts, Electronics, Furniture

### Listings Features (Step 2)

- **Browse**: View fresh listings from all campuses
- **Search**: Full-text search with category and price filters
- **Post**: Upload photos, set pricing (fixed/hourly/monthly/free), add tags
- **Favourites**: Save listings to your favourites
- **Detail View**: Full listing info, seller profile, contact button

### Chat & Messaging (Step 3)

The app includes real-time chat functionality using Supabase Realtime.

**Features:**
- **Messages Tab**: View all conversations with other students
- **Real-time Updates**: New messages appear instantly (no refresh needed)
- **Contact Seller**: Click "Contact Seller" on any listing to start/resume a conversation
- **Conversation Context**: Each conversation links to the relevant listing
- **Unread Counts**: See unread message counts per conversation
- **Read Receipts**: Messages are marked as read when opened

**Migration (Step 3):**

```sql
-- Run in Supabase SQL Editor (after Step 1 and 2 migrations):
-- supabase/migrations/00003_chat.sql
```

This creates:
- `conversations` table: Links two participants with optional listing reference
- `messages` table: Individual messages with sender, content, read status
- RLS policies: Only participants can read/write their conversations
- Helper functions: `get_or_create_conversation`, `mark_conversation_read`, `get_unread_count`
- Realtime: Messages table enabled for live subscriptions

**Enable Realtime:**

The migration automatically enables realtime on the messages table. If you need to verify or enable manually:
1. Go to Supabase Dashboard > Database > Replication
2. Ensure `messages` table is in the publication list

**Testing Chat:**

1. Create two test users with different campus emails
2. Sign in as User A, browse listings, click "Contact Seller" on User B's listing
3. Send a message
4. Sign in as User B, go to Messages tab, see the conversation
5. Reply - User A will see it in real-time if they have the conversation open

### Future Enhancements (Not in Step 3)

- Admin moderation panel (Step 4)
- Report user/listing functionality
- Block user feature
- Student number verification APIs
- Campus SSO integration
- TVET colleges (50+, pending email domain standardization)

## Project Structure

```
quad-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Tab navigation screens
│   ├── listing/           # Listing detail screens
│   └── category/          # Category screens
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── listings/         # Listing-related components
│   ├── categories/       # Category components
│   └── common/           # Shared components
├── hooks/                 # Custom React hooks
├── store/                 # Zustand stores
├── services/              # API and data services
├── types/                 # TypeScript interfaces
├── constants/             # Theme and constants
└── utils/                 # Helper functions
```

## Design System

### Colors

- **Primary Green**: `#1B5E20`
- **Secondary Green**: `#4CAF50`
- **Background**: `#F5F5F5`
- **Text Dark**: `#1A1A1A`
- **Text Gray**: `#666666`

### Components

- Button (primary, secondary, outline, ghost)
- Card (default, elevated, outlined)
- Chip (selectable category chips)
- Badge (price, rating, live)
- Avatar (image or initials)
- SearchBar (with filters)
- Input (text input with label/error)

## Mock Data

The app uses mock data for development. In production, connect to your backend API by updating the services in `/services/`.

## License

MIT License - See LICENSE file for details.
