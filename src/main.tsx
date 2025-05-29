import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/clerk-react";
import { getClerkConfig } from "@/lib/auth";
import App from './App.tsx'
import './index.css'

// Declare global window interface extension
declare global {
  interface Window {
    __CLERK_INITIALIZED?: boolean;
    __CLERK_PROD_DOMAIN?: boolean;
  }
}

// Get domain-specific Clerk configuration
const clerkConfig = getClerkConfig();

// Check if we're on a production domain (from clerk-init.js)
const isProdDomain = window.__CLERK_PROD_DOMAIN === true || 
                    window.location.hostname.includes('mockello.com') || 
                    window.location.hostname.includes('vercel.app');

// Get environment variables or use hardcoded production values if on production domain
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
                        "pk_live_Y2xlcmsubW9ja2VsbG8uY29tJA";
const SIGN_IN_URL = isProdDomain 
                    ? "https://accounts.mockello.com/sign-in"
                    : import.meta.env.VITE_CLERK_SIGN_IN_URL || "/sign-in";
const SIGN_UP_URL = isProdDomain
                    ? "https://accounts.mockello.com/sign-up"
                    : import.meta.env.VITE_CLERK_SIGN_UP_URL || "/sign-up";
const AFTER_SIGN_IN_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL || "/";
const AFTER_SIGN_UP_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL || "/";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    signInUrl={SIGN_IN_URL}
    signUpUrl={SIGN_UP_URL}
    afterSignInUrl={AFTER_SIGN_IN_URL}
    afterSignUpUrl={AFTER_SIGN_UP_URL}
    afterSignOutUrl="/"
    proxyUrl={isProdDomain ? "https://clerk.mockello.com" : undefined}
    appearance={{
      layout: {
        logoPlacement: "inside",
        logoImageUrl: "https://mockello.com/logo192.png",
        socialButtonsVariant: "iconButton",
        termsPageUrl: "https://mockello.com/terms",
        privacyPageUrl: "https://mockello.com/privacy"
      },
      variables: {
        colorPrimary: "#000000",
        colorBackground: "#FFFAF5"
      }
    }}
  >
    <App />
  </ClerkProvider>
);
