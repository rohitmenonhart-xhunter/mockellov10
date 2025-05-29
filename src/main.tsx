import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/clerk-react";
import { getClerkConfig } from "@/lib/auth";
import App from './App.tsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const SIGN_IN_URL = import.meta.env.VITE_CLERK_SIGN_IN_URL;
const SIGN_UP_URL = import.meta.env.VITE_CLERK_SIGN_UP_URL;
const AFTER_SIGN_IN_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL;
const AFTER_SIGN_UP_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Get domain-specific Clerk configuration
const clerkConfig = getClerkConfig();

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    signInUrl={SIGN_IN_URL}
    signUpUrl={SIGN_UP_URL}
    afterSignInUrl={AFTER_SIGN_IN_URL}
    afterSignUpUrl={AFTER_SIGN_UP_URL}
    afterSignOutUrl="/"
    proxyUrl={clerkConfig.proxyUrl}
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
