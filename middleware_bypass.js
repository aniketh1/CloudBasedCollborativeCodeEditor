// Temporary middleware bypass for testing
// Use this if the main middleware continues to fail

import { NextResponse } from 'next/server';

export function middleware(request) {
  // Log the request for debugging
  console.log('Middleware bypass - Request to:', request.url);
  
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