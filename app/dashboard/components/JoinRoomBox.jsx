'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function JoinRoomBox() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Join a Room</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Input placeholder="Enter room code" />
        <Button>Join</Button>
      </CardContent>
    </Card>
  );
}
