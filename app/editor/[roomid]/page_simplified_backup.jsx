'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Folder, 
  Play, 
  Save, 
  Settings,
  Users,
  Terminal as TerminalIcon 
} from 'lucide-react';

// Dynamic imports for client-side components
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function EditorPageSimplified() {
  const params = useParams();
  const { user, isLoaded } = useUser();
  const roomId = params?.roomid;
  
  // Client-side only flags
  const [isClient, setIsClient] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('// Welcome to ColabDev Editor\n// This is a simplified version without backend dependency\n\nconsole.log("Hello, World!");');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);

  // Mock file structure
  const [files] = useState([
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'index.js', type: 'file', path: '/src/index.js' },
        { name: 'App.jsx', type: 'file', path: '/src/App.jsx' },
        { name: 'styles.css', type: 'file', path: '/src/styles.css' }
      ]
    },
    { name: 'package.json', type: 'file', path: '/package.json' },
    { name: 'README.md', type: 'file', path: '/README.md' }
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileSelect = (file) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      // Mock file content based on file type
      const mockContent = {
        '/src/index.js': '// Main JavaScript file\nconsole.log("Welcome to your project!");',
        '/src/App.jsx': '// React App Component\nimport React from "react";\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello from React!</h1>\n    </div>\n  );\n}\n\nexport default App;',
        '/src/styles.css': '/* Main stylesheet */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n\nh1 {\n  color: #333;\n}',
        '/package.json': '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "main": "src/index.js",\n  "dependencies": {\n    "react": "^18.0.0"\n  }\n}',
        '/README.md': '# My Project\n\nThis is a collaborative coding project.\n\n## Getting Started\n\n1. Edit files in the editor\n2. Save your changes\n3. Collaborate with team members\n\n**Note:** This is currently a simplified version without real-time collaboration.'
      };
      setCode(mockContent[file.path] || '// New file\n');
      setHasUnsavedChanges(false);
    }
  };

  const renderFileTree = (files, level = 0) => {
    return files.map((file, index) => (
      <div key={index} style={{ marginLeft: level * 20 }}>
        <div
          className={`flex items-center space-x-2 px-2 py-1 hover:bg-gray-700 cursor-pointer rounded ${
            selectedFile?.path === file.path ? 'bg-blue-600' : ''
          }`}
          onClick={() => handleFileSelect(file)}
        >
          {file.type === 'folder' ? (
            <Folder className="w-4 h-4 text-yellow-400" />
          ) : (
            <FileText className="w-4 h-4 text-blue-400" />
          )}
          <span className="text-sm text-gray-300">{file.name}</span>
        </div>
        {file.children && renderFileTree(file.children, level + 1)}
      </div>
    ));
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    console.log('File saved (mock):', selectedFile?.path);
    // In a real implementation, this would save to backend
  };

  if (!isClient) {
    return <div className="h-screen bg-[#0d1117] flex items-center justify-center text-white">Loading...</div>;
  }

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
        <div className="h-screen bg-[#0d1117] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <h1 className="text-white font-semibold">Room: {roomId}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span>1 user (simplified mode)</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* File Explorer */}
            <div className="w-64 bg-[#161b22] border-r border-gray-700 p-2 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4 text-gray-300">
                <Folder className="w-5 h-5" />
                <span className="font-semibold">Project Files</span>
              </div>
              {renderFileTree(files)}
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col">
              {/* Editor */}
              <div className="flex-1">
                {selectedFile ? (
                  <MonacoEditor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => {
                      setCode(value || '');
                      setHasUnsavedChanges(true);
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      wordWrap: 'on'
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-[#0d1117] text-gray-400">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Select a file to start editing</p>
                      <p className="text-sm mt-2">Choose a file from the explorer on the left</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Terminal (Mock) */}
              {showTerminal && (
                <div className="h-48 bg-[#0c0c0c] border-t border-gray-700 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TerminalIcon className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-semibold">Terminal (Simplified)</span>
                    <button
                      onClick={() => setShowTerminal(false)}
                      className="ml-auto text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-green-400 text-sm font-mono">
                    <div>$ echo "Welcome to ColabDev Terminal"</div>
                    <div>Welcome to ColabDev Terminal</div>
                    <div>$ # This is a simplified version without backend connection</div>
                    <div>$ # Full terminal functionality requires backend setup</div>
                    <div className="flex">
                      <span>$ </span>
                      <span className="bg-green-400 w-2 h-4 ml-1 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="bg-[#161b22] border-t border-gray-700 px-4 py-2 text-sm text-gray-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span>✅ Simplified Mode Active</span>
                <span>👤 {user?.emailAddresses?.[0]?.emailAddress}</span>
                {selectedFile && <span>📄 {selectedFile.name}</span>}
              </div>
              <div>
                {hasUnsavedChanges && <span className="text-yellow-400">● Unsaved changes</span>}
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
    </>
  );
}