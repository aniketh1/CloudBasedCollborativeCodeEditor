"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import useCollaborationReal from '@/hooks/useCollaborationReal';
import RealCollaboratorActivity from '@/components/RealCollaboratorActivity';

// Dynamic imports for real-time collaboration
const FileExplorer = dynamic(() => import('@/components/FileExplorer'), {
  ssr: false
});

const Terminal = dynamic(() => import('@/components/Terminal'), {
  ssr: false
});

const RealTimeEditor = dynamic(() => import('@/components/RealTimeEditor'), {
  ssr: false
});

export default function EditorPage({ params }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Always call the collaboration hook to maintain hook order
  const collaborationData = useCollaborationReal(params.roomid);
  const { 
    isConnected, 
    connectionError, 
    collaborators, 
    myUser,
    fileEditors
  } = collaborationData;
  
  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);
  
  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (this shouldn't be reached due to useEffect, but just in case)
  if (!user) {
    return null;
  }
  
  // Sample file structure for the demo
  const files = [
    {
      name: 'src',
      type: 'folder',
      children: [
        { 
          name: 'components', 
          type: 'folder', 
          children: [
            { name: 'Button.jsx', type: 'file', content: `import React from 'react';\n\nconst Button = ({ children, onClick, variant = 'primary' }) => {\n  return (\n    <button\n      onClick={onClick}\n      className={\`btn btn-\${variant}\`}\n    >\n      {children}\n    </button>\n  );\n};\n\nexport default Button;` },
            { name: 'Modal.jsx', type: 'file', content: `import React from 'react';\n\nconst Modal = ({ isOpen, onClose, children }) => {\n  if (!isOpen) return null;\n\n  return (\n    <div className="modal-overlay">\n      <div className="modal">\n        <button onClick={onClose}>×</button>\n        {children}\n      </div>\n    </div>\n  );\n};\n\nexport default Modal;` }
          ]
        },
        { 
          name: 'pages', 
          type: 'folder', 
          children: [
            { name: 'Home.jsx', type: 'file', content: `import React from 'react';\nimport Button from '../components/Button';\n\nconst Home = () => {\n  return (\n    <div className="home">\n      <h1>Welcome to Collaborative Coding!</h1>\n      <Button variant="primary">Get Started</Button>\n    </div>\n  );\n};\n\nexport default Home;` },
            { name: 'About.jsx', type: 'file', content: `import React from 'react';\n\nconst About = () => {\n  return (\n    <div className="about">\n      <h1>About Our Platform</h1>\n      <p>Real-time collaborative coding environment.</p>\n    </div>\n  );\n};\n\nexport default About;` }
          ]
        },
        { 
          name: 'utils', 
          type: 'folder', 
          children: [
            { name: 'helpers.js', type: 'file', content: `// Utility functions for the application\n\nexport const formatDate = (date) => {\n  return new Intl.DateTimeFormat('en-US').format(date);\n};\n\nexport const debounce = (func, wait) => {\n  let timeout;\n  return function executedFunction(...args) {\n    const later = () => {\n      clearTimeout(timeout);\n      func(...args);\n    };\n    clearTimeout(timeout);\n    timeout = setTimeout(later, wait);\n  };\n};` }
          ]
        }
      ]
    },
    {
      name: 'package.json',
      type: 'file',
      content: `{\n  "name": "collaborative-editor",\n  "version": "1.0.0",\n  "description": "Real-time collaborative code editor",\n  "main": "index.js",\n  "scripts": {\n    "start": "react-scripts start",\n    "build": "react-scripts build",\n    "test": "react-scripts test"\n  },\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  }\n}`
    },
    {
      name: 'README.md',
      type: 'file',
      content: `# Collaborative Code Editor\n\n🚀 A real-time collaborative coding environment powered by Socket.IO and operational transformation.\n\n## Features\n\n- ✨ Real-time collaboration\n- 🎨 VS Code-style interface\n- 🔄 Operational transformation\n- 👥 Live cursors\n- 📁 File explorer\n- 💻 Integrated terminal\n\n## Getting Started\n\n1. Clone the repository\n2. Install dependencies: \`npm install\`\n3. Start the server: \`npm start\`\n4. Open multiple browser windows to test collaboration\n\n## Usage\n\nOpen the editor and invite collaborators to work together in real-time!\n`
    }
  ];

  const handleFileSelect = (file) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
      {/* VS Code-style Title Bar */}
      <div className="h-8 bg-[#323233] border-b border-[#2d2d30] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
          </div>
          <span className="text-sm font-medium ml-4">
            🚀 Collaborative Editor - Room: {params.roomid}
          </span>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* Active Users Count with Real Data */}
          <div className="flex items-center gap-1 bg-[#007acc] px-2 py-1 rounded text-xs">
            <span>👥</span>
            <span>{(collaborators?.length || 0) + (myUser ? 1 : 0)} users</span>
          </div>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        <div className="w-80 bg-[#252526] border-r border-[#2d2d30] flex flex-col">
          {/* Explorer Header */}
          <div className="h-10 border-b border-[#2d2d30] flex items-center px-4 bg-[#2d2d30]">
            <span className="text-sm font-medium uppercase tracking-wide text-gray-300">
              📁 Explorer
            </span>
          </div>
          
          {/* File Tree */}
          <div className="flex-1 overflow-auto">
            <FileExplorer 
              files={files} 
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>
          
          {/* Collaboration Panel */}
          <div className="border-t border-[#2d2d30]">
            <RealCollaboratorActivity 
              collaborators={collaborators}
              myUser={myUser}
              isConnected={isConnected}
              fileEditors={fileEditors}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Code Editor with Real-time Collaboration */}
          <div className="flex-1">
            <RealTimeEditor 
              selectedFile={selectedFile}
              roomid={params.roomid}
              collaborationData={collaborationData}
            />
          </div>

          {/* Bottom Panel - Terminal */}
          <div className="h-64 border-t border-[#2d2d30] bg-[#1e1e1e]">
            <Terminal />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-4 text-xs text-white shrink-0">
        <div className="flex items-center gap-4">
          <span>🚀 Room: {params.roomid}</span>
          <span>⚡ Enhanced Collaboration</span>
          {connectionError && (
            <span className="text-red-200">⚠ {connectionError}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>{selectedFile ? selectedFile.name : 'No file selected'}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded">VS Code Style</span>
        </div>
      </div>
    </div>
  );
}