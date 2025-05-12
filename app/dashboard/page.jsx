'use client';

import { SignedIn, SignedOut, useUser } from  '@clerk/nextjs';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import CreateRoomBox from './components/CreateRoomBox';
import JoinRoomBox from './components/JoinRoomBox';
import RoomCard from './components/RoomCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useUser();
  if (!user) {
    return <>
      <div className="text-center p-10 text-lg">You are not Signed In</div>
      <div className='flex justify-center items-center'>
        <Link href="/sign-in">
          <Button className="flex">Please Sign In</Button>
        </Link>
      </div>
    </>
  }

  const mockRooms = [
    { id: 'react101', name: 'React Project', createdAt: 'Aug 1, 2025' },
    { id: 'node456', name: 'Node.js API', createdAt: 'Aug 5, 2025' },
  ];

  return (
    <>
      <SignedOut>
        <div className="text-center p-10 text-lg">Please sign in to access the dashboard.</div>
      </SignedOut>

      <SignedIn>
        <section className="max-w-6xl mx-auto px-6 py-12">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Welcome, {user.fullName} 👋
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <CreateRoomBox />
              <JoinRoomBox />
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {mockRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      </SignedIn>
    </>
  );
}
