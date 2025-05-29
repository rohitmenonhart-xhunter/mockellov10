/**
 * Clerk initialization helper script
 * This runs before Clerk is initialized to ensure proper configuration
 */
(function() {
  // Clear any existing clerk cookies
  function clearClerkCookies() {
    var cookies = document.cookie.split(';');
    
    cookies.forEach(function(cookie) {
      var cookieName = cookie.split('=')[0].trim();
      
      if (cookieName.startsWith('__clerk') || cookieName.includes('clerk')) {
        // Delete cookie with various domain combinations
        document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Try with domain
        if (window.location.hostname.includes('.')) {
          var domain = window.location.hostname;
          document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domain;
          
          // Try with wildcard domain
          var rootDomain = domain.split('.').slice(-2).join('.');
          document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + rootDomain;
        }
      }
    });
    
    // Also clear localStorage items related to Clerk
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && (key.startsWith('clerk') || key.includes('clerk'))) {
        localStorage.removeItem(key);
      }
    }
    
    // Also clear sessionStorage items related to Clerk
    for (var j = 0; j < sessionStorage.length; j++) {
      var sKey = sessionStorage.key(j);
      if (sKey && (sKey.startsWith('clerk') || sKey.includes('clerk'))) {
        sessionStorage.removeItem(sKey);
      }
    }
  }
  
  // Run immediately
  clearClerkCookies();
  
  // Set a flag to indicate we've initialized
  window.__CLERK_INITIALIZED = true;
  
  // Check for production domain
  var isProdDomain = window.location.hostname.includes('mockello.com') || 
                     window.location.hostname.includes('vercel.app');
  
  // Export this for the main app to use
  window.__CLERK_PROD_DOMAIN = isProdDomain;
})(); 