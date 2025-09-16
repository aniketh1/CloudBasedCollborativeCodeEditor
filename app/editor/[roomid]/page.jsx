"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function EditorPage({ params }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="flex-1 p-4">
        <h1 className="text-xl mb-4">Editor Room: {params.roomid}</h1>
        <p>Collaborative Code Editor - Room: {params.roomid}</p>
        <p>Welcome, {user.firstName || user.emailAddresses[0].emailAddress}!</p>
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <p>This is a simplified editor page. The full collaboration features will be restored after fixing the build issue.</p>
        </div>
      </div>
    </div>
  );
}
