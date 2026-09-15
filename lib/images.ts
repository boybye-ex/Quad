import { supabase } from './supabase';

/**
 * Default placeholder image for listings without photos.
 * Uses a branded gradient background with the Quad logo concept.
 */
export const LISTING_PLACEHOLDER_URI = 'quad-placeholder';

/**
 * Checks if a URI is the placeholder constant (not a real image).
 */
export function isPlaceholder(uri: string | undefined): boolean {
  return !uri || uri === LISTING_PLACEHOLDER_URI;
}

/**
 * Resolves an image URI to a displayable URL.
 * Handles:
 * - Full HTTPS URLs (returned as-is)
 * - Supabase storage paths (converted to public URLs)
 * - Empty/undefined (returns undefined)
 * 
 * @param uri - The image URI (could be a full URL or a storage path)
 * @returns The resolved public URL, or undefined if invalid
 */
export function resolveImageUri(uri: string | undefined): string | undefined {
  if (!uri || uri === LISTING_PLACEHOLDER_URI) {
    return undefined;
  }

  if (uri.startsWith('https://') || uri.startsWith('http://')) {
    return uri;
  }

  if (uri.startsWith('file://')) {
    return uri;
  }

  const { data } = supabase.storage.from('listing-images').getPublicUrl(uri);
  return data?.publicUrl;
}

/**
 * Resolves an array of image URIs, filtering out invalid ones.
 * 
 * @param uris - Array of image URIs
 * @returns Array of resolved public URLs
 */
export function resolveImageUris(uris: string[] | undefined): string[] {
  if (!uris || uris.length === 0) {
    return [];
  }

  return uris
    .map(resolveImageUri)
    .filter((uri): uri is string => uri !== undefined);
}

/**
 * Gets the first valid image URI from an array, or undefined if none exist.
 * Useful for thumbnail/card displays.
 * 
 * @param uris - Array of image URIs
 * @returns The first resolved URL, or undefined
 */
export function getFirstImageUri(uris: string[] | undefined): string | undefined {
  const resolved = resolveImageUris(uris);
  return resolved.length > 0 ? resolved[0] : undefined;
}

/**
 * Checks if a listing has any valid images.
 * 
 * @param images - Array of image URIs from a listing
 * @returns true if at least one valid image exists
 */
export function hasImages(images: string[] | undefined): boolean {
  return resolveImageUris(images).length > 0;
}
