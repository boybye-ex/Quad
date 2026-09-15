# Listing Experience Polish Notes

This document summarizes the UI/UX polish changes made to improve the listing experience and photo handling in Quad.

## Changes Made

### 1. Shared Image Helper (`lib/images.ts`)

Created a reusable image utility module that provides:

- `resolveImageUri(uri)` - Converts storage paths to public URLs, handles HTTPS URLs, local file URIs
- `resolveImageUris(uris)` - Batch resolve and filter invalid URIs
- `getFirstImageUri(uris)` - Get the first valid image for thumbnails
- `hasImages(images)` - Check if a listing has any valid images

This ensures consistent image resolution across the app and prevents broken images when arrays are empty or contain invalid paths.

### 2. Listing Card Empty State (`components/listings/ListingCard.tsx`)

- Added branded placeholder when `images` array is empty
- Placeholder shows a subtle green icon circle with "No photo" text
- Works in both default and horizontal card variants
- Uses theme colors for dark mode compatibility

### 3. Listing Detail Improvements (`app/listing/[id].tsx`)

**Image Gallery:**
- Improved empty state with branded placeholder (icon circle + text)
- Uses the new `resolveImageUris` helper for proper URL resolution
- Better messaging: "No photos yet" with subtitle

**Condition Badge:**
- Redesigned from plain text to a pill-style badge
- Includes contextual icons (sparkles for new, star for like-new, etc.)
- Color-coded by condition (green for new/like-new, orange for fair)
- Functions: `formatCondition()`, `getConditionIcon()`, `getConditionColor()`

**Bottom Bar:**
- Shows original price with strikethrough when discounted
- Shortened "Contact Seller" to "Message" for better fit
- Improved responsive layout with proper spacing

### 4. Photo Picker in Post Flow (`app/(tabs)/post.tsx`)

- New welcoming empty state when no photos are selected
- Includes icon circle, title, and subtitle explaining value of photos
- Two prominent buttons: "Choose from Gallery" and "Take a Photo"
- Added hint text below: "Photos are optional but highly recommended"
- Once photos are added, shows count and inline add buttons

### 5. Empty Browse States

**Home Screen (`app/(tabs)/index.tsx`):**
- Updated copy to mention campus: "Campus board is quiet"
- Shows campus name: "No listings on {campus} yet"
- Added branded icon circle with storefront icon

**Category Screen (`app/category/[slug].tsx`):**
- Contextual empty states for search vs. browsing
- Encourages users to "Be the first to post in {category} on your campus!"
- Added branded icon circle

### 6. EmptyState Component (`components/common/EmptyState.tsx`)

- Now uses dynamic theme colors via `useThemeColors()` hook
- Dark mode compatible
- Branded icon circle style matching other empty states

## Dark Mode Compatibility

All changes use the `useThemeColors()` hook and dynamic `createStyles()` pattern to ensure proper rendering in both light and dark modes. Color calculations use theme tokens rather than hardcoded values.

## Files Changed

- `lib/images.ts` (new)
- `components/listings/ListingCard.tsx`
- `app/listing/[id].tsx`
- `app/(tabs)/post.tsx`
- `app/(tabs)/index.tsx`
- `app/category/[slug].tsx`
- `components/common/EmptyState.tsx`
- `docs/polish-notes.md` (new)
