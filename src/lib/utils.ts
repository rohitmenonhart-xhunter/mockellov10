import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utility to check if we're in production environment
 */
export function isProduction(): boolean {
  return import.meta.env.MODE === 'production';
}

/**
 * Clears any development Clerk cookies when in production
 * to prevent double authentication
 */
export function clearDevAuthCookies(): void {
  // Only run in production
  if (!isProduction()) return;
  
  // Get all cookies
  const cookies = document.cookie.split(';');
  
  // Find and remove any clerk development cookies
  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    
    // If it's a Clerk cookie from a non-production domain
    if (cookieName.startsWith('__clerk') && !document.location.host.includes('mockello.com')) {
      // Delete the cookie by setting expiration in the past
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
}
