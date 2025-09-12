'use client';

import { useUser, useAuth } from '@clerk/nextjs';

export default function TestAuth() {
  const { user, isLoaded } = useUser();
  const { isSignedIn, userId } = useAuth();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🧪 Authentication Test Page</h1>
      
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Clerk Authentication Status:</h2>
        <div className="space-y-1 font-mono text-sm">
          <p>isLoaded: {isLoaded ? '✅' : '❌'}</p>
          <p>isSignedIn: {isSignedIn ? '✅' : '❌'}</p>
          <p>userId: {userId || 'null'}</p>
          <p>user exists: {user ? '✅' : '❌'}</p>
        </div>
      </div>

      {user && (
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">User Details:</h3>
          <p>Email: {user.emailAddresses?.[0]?.emailAddress}</p>
          <p>Full Name: {user.fullName}</p>
          <p>ID: {user.id}</p>
        </div>
      )}

      <div className="space-y-2">
        <a 
          href="/dashboard" 
          className="block bg-blue-600 text-white px-4 py-2 rounded text-center hover:bg-blue-700"
        >
          🎯 Try Dashboard (Will test middleware)
        </a>
        
        <p className="text-sm text-gray-600">
          This page is NOT protected by middleware. If you see your user info above but 
          dashboard still redirects, the issue is in the middleware logic.
        </p>
      </div>
    </div>
  );
}