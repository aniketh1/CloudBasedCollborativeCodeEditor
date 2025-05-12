'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function RoomCard({ room }) {
  return (
    <Card className="hover:shadow-lg transition">
      <CardHeader>
        <CardTitle>{room.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Room ID: {room.id}
        <br />
        Created on: {room.createdAt}
      </CardContent>
    </Card>
  );
}
