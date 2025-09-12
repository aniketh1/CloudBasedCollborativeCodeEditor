import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/create-project(.*)'
]);

export default clerkMiddleware((auth, req) => {
  console.log('🚀 Middleware: Processing request to:', req.nextUrl.pathname);
  
  // Only protect certain routes
  if (isProtectedRoute(req)) {
    console.log('🔒 Middleware: Route is protected, checking auth...');
    
    try {
      const { userId, sessionId } = auth();
      console.log('👤 Middleware: userId:', userId);
      console.log('🎫 Middleware: sessionId:', sessionId);
      
      if (!userId) {
        console.log('❌ Middleware: No userId, redirecting to sign-in');
        const url = req.nextUrl.clone();
        url.pathname = '/sign-in';
        return Response.redirect(url);
      }
      
      console.log('✅ Middleware: User authenticated, allowing access');
    } catch (authError) {
      console.error('💥 Middleware: Auth error:', authError);
      const url = req.nextUrl.clone();
      url.pathname = '/sign-in';
      return Response.redirect(url);
    }
  } else {
    console.log('🌐 Middleware: Public route, allowing access');
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