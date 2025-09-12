import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/create-project(.*)'
]);

export default clerkMiddleware((auth, req) => {
  try {
    console.log('Middleware: Processing request to:', req.nextUrl.pathname);
    console.log('Middleware: Environment check - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET');
    console.log('Middleware: Environment check - CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT SET');
    
    // Only protect routes if we're in a properly configured environment
    if (isProtectedRoute(req)) {
      console.log('Middleware: Route is protected:', req.nextUrl.pathname);
      
      // Check if we have the necessary environment variables
      if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
        console.log('Middleware: Environment variables are set, checking authentication...');
        try {
          const { userId } = auth();
          console.log('Middleware: User ID:', userId ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
          
          if (!userId) {
            console.log('Middleware: No user ID found, redirecting to sign-in');
            const url = req.nextUrl.clone();
            url.pathname = '/sign-in';
            return Response.redirect(url);
          }
          
          console.log('Middleware: User is authenticated, allowing access to protected route');
        } catch (authError) {
          console.error('Middleware: Authentication failed:', authError.message);
          const url = req.nextUrl.clone();
          url.pathname = '/sign-in';
          console.log('Middleware: Redirecting to sign-in due to auth error');
          return Response.redirect(url);
        }
      } else {
        console.warn('Middleware: Clerk environment variables not properly configured, redirecting to sign-in');
        // In development or when env vars are missing, redirect to sign-in
        const url = req.nextUrl.clone();
        url.pathname = '/sign-in';
        return Response.redirect(url);
      }
    } else {
      console.log('Middleware: Route is not protected, allowing access');
    }
  } catch (error) {
    console.error('Middleware: Unexpected error:', error);
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