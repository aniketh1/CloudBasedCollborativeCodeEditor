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
      // Try getting auth info
      const authObject = auth();
      console.log('🔍 Middleware: Auth object type:', typeof authObject);
      console.log('🔍 Middleware: Auth object keys:', Object.keys(authObject || {}));
      
      const { userId, sessionId, user } = authObject;
      console.log('👤 Middleware: userId:', userId);
      console.log('🎫 Middleware: sessionId:', sessionId);
      console.log('👨‍💻 Middleware: user:', user ? 'exists' : 'null');
      
      // Also try the protect method approach
      try {
        authObject.protect();
        console.log('✅ Middleware: protect() succeeded - user is authenticated');
        return; // Allow access
      } catch (protectError) {
        console.log('❌ Middleware: protect() failed:', protectError.message);
        const url = req.nextUrl.clone();
        url.pathname = '/sign-in';
        return Response.redirect(url);
      }
      
    } catch (authError) {
      console.error('💥 Middleware: Auth error:', authError.message);
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