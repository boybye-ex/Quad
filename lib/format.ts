import { PriceType } from '@/types';

/**
 * Formats a price amount for display in South African Rand (ZAR).
 * 
 * @param amount - The price amount in Rands
 * @param priceType - The type of pricing (fixed, hourly, monthly, free)
 * @param options - Formatting options
 * @param options.includeSuffix - Whether to include the price type suffix (default: true)
 * @returns Formatted price string (e.g., "R280", "R150/hr", "R4 500/mo", "Free")
 */
export function formatPrice(
  amount: number,
  priceType: PriceType = 'fixed',
  options: { includeSuffix?: boolean } = {}
): string {
  const { includeSuffix = true } = options;

  if (priceType === 'free' || amount === 0) {
    return 'Free';
  }

  const suffix = includeSuffix ? getPriceSuffix(priceType) : '';
  return `R${amount}${suffix}`;
}

/**
 * Gets the price type suffix string.
 * 
 * @param priceType - The type of pricing
 * @returns Suffix string (e.g., "/hr", "/mo", or "")
 */
export function getPriceSuffix(priceType: PriceType): string {
  switch (priceType) {
    case 'hourly':
      return '/hr';
    case 'monthly':
      return '/mo';
    default:
      return '';
  }
}

/**
 * Formats an original/crossed-out price for display.
 * Used when showing discounted prices.
 * 
 * @param amount - The original price amount in Rands
 * @returns Formatted price string (e.g., "R350")
 */
export function formatOriginalPrice(amount: number): string {
  return `R${amount}`;
}
