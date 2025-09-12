import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/create-project(.*)'
]);

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/create-project(.*)'
]);

export default clerkMiddleware((auth, req) => {
  try {
    // Only protect routes if we're in a properly configured environment
    if (isProtectedRoute(req)) {
      // Check if we have the necessary environment variables
      if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
        auth().protect();
      } else {
        console.warn('Clerk environment variables not properly configured, skipping authentication');
        // In development or when env vars are missing, redirect to sign-in
        const url = req.nextUrl.clone();
        if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/editor') || url.pathname.startsWith('/create-project')) {
          url.pathname = '/sign-in';
          return Response.redirect(url);
        }
      }
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // If middleware fails, redirect to sign-in instead of throwing error
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};