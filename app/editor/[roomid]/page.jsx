"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import MonacoEditor from '@/components/MonacoEditor';
import FileExplorer from '@/components/FileExplorer';

export default function EditorPage({ params }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null); // ← No default file

  // Handle file selection from explorer
  const handleFileSelect = (file) => {
    if (file && file.type === 'file') {
      setSelectedFile(file);
    }
  };

  // Handle file operations from explorer
  const handleFileCreate = (name, type) => {
    console.log(`Created ${type}: ${name}`);
  };

  const handleFileDelete = (name, type) => {
    console.log(`Deleted ${type}: ${name}`);
    // Clear editor if deleted file was selected
    if (selectedFile && selectedFile.name === name) {
      setSelectedFile({
        name: 'welcome.js',
        path: 'welcome.js',
        type: 'file'
      });
    }
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      {/* File Explorer Sidebar */}
      <FileExplorer
        roomId={params.roomid}
        onSelect={handleFileSelect}
        selected={selectedFile}
        onFileCreate={handleFileCreate}
        onFileDelete={handleFileDelete}
      />

      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <span className="text-sm text-gray-400">Monaco Editor - With FileExplorer</span>
        </div>
        
        <div className="flex-1">
          <MonacoEditor
            selectedFile={selectedFile}
            roomid={params.roomid}
            projectFiles={[]}
          />
        </div>
      </div>
    </div>
  );
}
