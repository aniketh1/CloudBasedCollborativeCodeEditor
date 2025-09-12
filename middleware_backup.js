import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/create-project(.*)'
]);

export default clerkMiddleware((auth, req) => {
  console.log('🚀 SIMPLE: Processing request to:', req.nextUrl.pathname);
  
  if (isProtectedRoute(req)) {
    console.log('🔒 SIMPLE: Protecting route with auth.protect()');
    auth().protect();
    console.log('✅ SIMPLE: Protection successful');
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};