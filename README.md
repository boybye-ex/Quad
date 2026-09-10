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

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
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
