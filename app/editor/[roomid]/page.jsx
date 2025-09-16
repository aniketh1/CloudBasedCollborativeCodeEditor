"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import FileExplorer from '@/components/FileExplorer';
import MonacoEditor from '@/components/MonacoEditor';

export default function EditorPage({ params }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Handle file selection from explorer
  const handleFileSelect = async (file) => {
    if (!file || file.type !== 'file') return;
    
    setSelectedFile(file);
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/file/${params.roomid}?path=${encodeURIComponent(file.path)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setFileContent(data.content || '');
      } else {
        console.error('Failed to load file:', data.error);
        setFileContent('// Error loading file content');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      setFileContent('// Error loading file content');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file content changes
  const handleContentChange = async (newContent) => {
    if (!selectedFile) return;
    
    setFileContent(newContent);
    
    // Auto-save after a short delay (debounced)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/file/${params.roomid}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            path: selectedFile.path,
            content: newContent, 
            userId: user.id 
          })
        }
      );
      
      if (!response.ok) {
        console.error('Failed to save file');
      }
    } catch (error) {
      console.error('Error saving file:', error);
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
      setSelectedFile(null);
      setFileContent('');
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
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
    <div className="h-screen flex bg-[#1e1e1e] text-white">
      {/* File Explorer Sidebar */}
      <FileExplorer
        roomId={params.roomid}
        onSelect={handleFileSelect}
        selected={selectedFile}
        onFileCreate={handleFileCreate}
        onFileDelete={handleFileDelete}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="bg-[#181825] border-b border-gray-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {selectedFile ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Editing:</span>
                <span className="text-sm font-medium text-white">{selectedFile.name}</span>
                {selectedFile.path !== selectedFile.name && (
                  <span className="text-xs text-gray-500">{selectedFile.path}</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-400">No file selected</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-400">Room: {params.roomid}</span>
            <span className="text-xs text-gray-400">
              {user.firstName || user.emailAddresses[0].emailAddress}
            </span>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 relative">
          {selectedFile ? (
            <>
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-400">Loading file...</p>
                  </div>
                </div>
              ) : (
                <MonacoEditor
                  value={fileContent}
                  onChange={handleContentChange}
                  language={selectedFile.language || 'javascript'}
                  theme="vs-dark"
                />
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gray-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Welcome to Collaborative Editor</h3>
                <p className="text-gray-400 mb-4">Select a file from the explorer to start editing</p>
                <p className="text-sm text-gray-500">Room: {params.roomid}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
