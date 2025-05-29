# Mockello - AI Interview Assistant

## Clerk Authentication Setup

This application uses Clerk for authentication. The following configuration has been set up:

### Clerk Configuration
- **Frontend API URL**: https://clerk.mockello.com
- **Backend API URL**: https://api.clerk.com
- **JWKS URL**: https://clerk.mockello.com/.well-known/jwks.json
- **Sign In URL**: https://accounts.mockello.com/sign-in
- **Sign Up URL**: https://accounts.mockello.com/sign-up
- **User Profile URL**: https://accounts.mockello.com/user

### Environment Variables
The following environment variables are required for Clerk to function properly:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsubW9ja2VsbG8uY29tJA
VITE_CLERK_SIGN_IN_URL=https://accounts.mockello.com/sign-in
VITE_CLERK_SIGN_UP_URL=https://accounts.mockello.com/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/
VITE_CLERK_AFTER_SIGN_UP_URL=/
```

## Deployment Instructions

### Deploying to Vercel

1. Ensure you have the Vercel CLI installed: `npm install -g vercel`
2. Run `vercel` from the project root to deploy
3. Set the environment variables in the Vercel dashboard, or they will be picked up from the vercel.json file

### Important Notes

- The Clerk authentication is configured to work with the mockello.com domain
- The application uses client-side routing, so all routes should redirect to index.html
- CORS headers are configured to allow proper authentication

## Development

To run the application locally:

```bash
cd frontend
npm install
npm run dev
```

The application will be available at http://localhost:8080
