import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/editor(.*)',
  '/create-project(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Simple protection for defined routes
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  // Only run middleware on specific protected routes
  matcher: [
    '/dashboard/:path*',
    '/editor/:path*', 
    '/create-project/:path*'
  ],
};