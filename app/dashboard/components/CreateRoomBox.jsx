'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid'; // install uuid: npm i uuid

export default function CreateRoomBox() {
  const router = useRouter();

  const handleCreate = () => {
    const newRoomId = uuidv4(); // e.g., '2f5a...'
    router.push(`/editor/${newRoomId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Room</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="w-full flex gap-2" onClick={handleCreate}>
          <PlusCircle className="w-5 h-5" />
          Create Room
        </Button>
      </CardContent>
    </Card>
  );
}
