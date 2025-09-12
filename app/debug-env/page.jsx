'use client';

import { useEffect, useState } from 'react';

export default function DebugEnvironment() {
  const [envVars, setEnvVars] = useState({});

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
      <h1 className="text-3xl font-bold mb-6">Environment Debug Page</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <pre className="bg-white p-4 rounded border overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Instructions for Vercel Deployment</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Go to your Vercel project dashboard</li>
          <li>Navigate to Settings → Environment Variables</li>
          <li>Add the following variables:
            <ul className="list-disc list-inside ml-4 mt-2">
              <li><code>NEXT_PUBLIC_BACKEND_URL</code> - Your backend API URL</li>
              <li><code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> - From Clerk dashboard</li>
              <li><code>CLERK_SECRET_KEY</code> - From Clerk dashboard (keep secret)</li>
              <li><code>NEXT_PUBLIC_CLERK_SIGN_IN_URL</code> - /sign-in</li>
              <li><code>NEXT_PUBLIC_CLERK_SIGN_UP_URL</code> - /sign-up</li>
            </ul>
          </li>
          <li>Redeploy your application</li>
        </ol>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>If NEXT_PUBLIC_BACKEND_URL is not set, API calls will fail</li>
          <li>If Clerk keys are not set, authentication will not work</li>
          <li>Remove this debug page before going to production</li>
        </ul>
      </div>
    </div>
  );
}