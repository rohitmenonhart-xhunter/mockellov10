/**
 * Authentication helper functions for Clerk integration
 */

/**
 * Clear any potential stale authentication tokens or sessions
 * - This helps prevent issues with multiple Clerk instances
 */
export const clearAuthCookies = () => {
  try {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // Find and clear all Clerk-related cookies (be more aggressive)
    cookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      
      if (cookieName.startsWith('__clerk') || cookieName.includes('clerk')) {
        // Delete the cookie by setting expiration in the past - try all combinations
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        
        // Also try with subdomain wildcards
        const domain = window.location.hostname;
        if (domain.includes('.')) {
          const rootDomain = domain.split('.').slice(-2).join('.');
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain}`;
        }
      }
    });
    
    // Also clear localStorage items related to Clerk
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('clerk') || key.includes('clerk')) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clear sessionStorage items related to Clerk
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('clerk') || key.includes('clerk')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log("Auth cookies and storage cleared");
  } catch (error) {
    console.error("Error clearing auth cookies:", error);
  }
};

/**
 * Force reload the page to ensure fresh authentication state
 */
export const forceAuthRefresh = () => {
  clearAuthCookies();
  window.location.href = window.location.origin;
};

/**
 * Get domain-specific configuration for Clerk
 */
export const getClerkConfig = () => {
  // Determine if we're in production
  const isProd = import.meta.env.MODE === 'production';
  const domain = window.location.hostname;
  
  // For production domains, always use the production URL
  const isProductionDomain = domain.includes('mockello.com') || 
                            domain.includes('vercel.app');
  
  return {
    // Use the proxy URL in production or on production domains
    proxyUrl: (isProd || isProductionDomain) ? "https://clerk.mockello.com" : undefined,
    // Always use the CORS Origin in production
    corsOrigin: (isProd || isProductionDomain) ? window.location.origin : undefined
  };
}; 