# Quad Mobile

A React Native mobile application for campus marketplace - buy, sell, and share textbooks, housing, tutoring, rides, and more with verified students at your campus.

## Features

- **Browse Listings** - Explore textbooks, housing, tutoring, rides, shifts, electronics, and furniture
- **Search & Filter** - Find what you need with powerful search and filtering
- **Post Listings** - Create listings with photos, pricing, and descriptions
- **In-App Messaging** - Chat securely with other students (no phone numbers shared)
- **User Profiles** - Manage your listings, favorites, and settings
- **Campus Communities** - Connect with verified students at your campus

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
   # Go to SQL Editor and run the contents of:
   # - supabase/migrations/00001_initial_schema.sql
   # - supabase/seed.sql

   # Option B: Using Supabase CLI
   supabase link --project-ref your-project-ref
   supabase db push
   supabase db seed
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

### Future Enhancements (Not in Step 1)

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
