// Temporary middleware bypass for testing dashboard access
// Replace your main middleware.js with this content to test if dashboard works without authentication

import { NextResponse } from 'next/server';

export function middleware(request) {
  console.log('BYPASS Middleware: Request to:', request.url);
  console.log('BYPASS Middleware: Allowing all requests through for testing');
  
  // Allow all requests to pass through without authentication
  // This is for testing purposes only - not for production use
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

// INSTRUCTIONS FOR TESTING:
// 1. Backup your current middleware.js: mv middleware.js middleware_auth.js
// 2. Copy this content to middleware.js: cp middleware_bypass.js middleware.js  
// 3. Deploy and test if dashboard works
// 4. If it works, the issue is with Clerk configuration
// 5. Restore original: mv middleware_auth.js middleware.js