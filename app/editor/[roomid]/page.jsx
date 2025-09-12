'use client';

import { useParams } from 'next/navigation';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EditorTest() {
  const params = useParams();
  const { user, isLoaded } = useUser();
  const roomId = params?.roomid;

  return (
    <>
      <SignedOut>
        <div className="h-screen flex flex-col items-center justify-center bg-[#0d1117] text-white">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold">Authentication Required</h1>
            <p className="text-gray-400">
              You need to sign in to access the collaborative editor.
            </p>
            <Link href="/sign-in">
              <Button className="w-full bg-[#2FA1FF] hover:bg-[#2FA1FF]/90 text-white">
                Sign In to Continue
              </Button>
            </Link>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="h-screen flex flex-col items-center justify-center bg-[#0d1117] text-white">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-3xl font-bold">Editor Test Page</h1>
            <p className="text-gray-400">
              Room ID: {roomId || 'No room ID'}
            </p>
            <p className="text-gray-400">
              User: {user?.emailAddresses?.[0]?.emailAddress || 'Loading...'}
            </p>
            <p className="text-gray-400">
              Authentication is working! This is a simplified editor test.
            </p>
            <Link href="/dashboard">
              <Button className="w-full bg-[#2FA1FF] hover:bg-[#2FA1FF]/90 text-white">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </SignedIn>
    </>
  );
}