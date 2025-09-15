'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';

export default function JoinRoomBox() {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useUser();

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!user) {
      setError('Please sign in to join a room');
      return;
    }

    setIsJoining(true);
    setError('');

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      // For now, just try to navigate to the room
      // The room validation will happen in the editor page
      console.log('🚀 Joining room:', roomCode);
      router.push(`/editor/${roomCode.trim()}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please try again.');
      setIsJoining(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join a Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input 
            placeholder="Enter room code (e.g., abc123)" 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isJoining}
          />
          <Button 
            onClick={handleJoinRoom}
            disabled={isJoining || !roomCode.trim()}
          >
            {isJoining ? 'Joining...' : 'Join'}
          </Button>
        </div>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
        <p className="text-gray-500 text-xs">
          Enter the room code shared by another user to join their collaborative session.
        </p>
      </CardContent>
    </Card>
  );
}
