'use client';

import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

export default function DebugEnvironment() {
  const [envVars, setEnvVars] = useState({});
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    // Only show public environment variables for security
    const publicEnvVars = {
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      NODE_ENV: process.env.NODE_ENV,
    };
    setEnvVars(publicEnvVars);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🔧 Authentication Debug Page</h1>
      
      {/* Authentication Status */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">🔐 Authentication Status</h2>
        <div className="space-y-2 font-mono text-sm">
          <p><strong>Clerk Loaded:</strong> {isLoaded ? '✅ YES' : '❌ NO'}</p>
          <p><strong>User Signed In:</strong> {isSignedIn ? '✅ YES' : '❌ NO'}</p>
          <p><strong>User Object:</strong> {user ? '✅ EXISTS' : '❌ NULL'}</p>
          <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
          <p><strong>User Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'Not available'}</p>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">🌍 Environment Variables</h2>
        <pre className="bg-white dark:bg-gray-900 p-4 rounded border overflow-auto text-sm">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      {/* Middleware Test */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">⚡ Middleware Test</h2>
        <p className="mb-4">If you can see this page, basic routing is working.</p>
        <div className="space-y-2">
          <a 
            href="/dashboard" 
            className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-center"
          >
            🎯 Test Dashboard Access
          </a>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If this redirects to sign-in, there's an authentication issue.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">📋 Troubleshooting Guide</h2>
        <div className="space-y-3 text-sm">
          <div>
            <strong>If NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY shows "NOT SET":</strong>
            <p>Set this in Vercel → Settings → Environment Variables</p>
          </div>
          <div>
            <strong>If User Signed In shows "NO" but you think you're signed in:</strong>
            <p>Check Clerk domain configuration and try signing out/in again</p>
          </div>
          <div>
            <strong>If dashboard redirects to sign-in:</strong>
            <p>Check Vercel function logs for middleware debugging output</p>
          </div>
        </div>
      </div>
    </div>
  );
}