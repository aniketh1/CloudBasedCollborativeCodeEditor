"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useCollaboration from '@/hooks/useCollaboration';
import CollaboratorActivity from '@/components/CollaboratorActivity';

// Dynamic imports for better performance and SSR compatibility
const FileExplorer = dynamic(() => import('@/components/FileExplorer'), {
  ssr: false,
  loading: () => <div className="w-64 h-full bg-gray-800 animate-pulse"></div>
});

const Terminal = dynamic(() => import('@/components/Terminal'), {
  ssr: false,
  loading: () => <div className="h-48 bg-black animate-pulse"></div>
});

const MonacoEditor = dynamic(() => import('@/components/EnhancedMonacoEditor'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-900 animate-pulse"></div>
});

export default function EditorPage({ params }) {
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Use collaboration hook
  const { 
    isConnected, 
    connectionError, 
    collaborators, 
    myId 
  } = useCollaboration(params.roomid);
  
  // Sample file structure for the demo
  const [files] = useState([
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'components', type: 'folder', children: [
          { name: 'Button.jsx', type: 'file' },
          { name: 'Modal.jsx', type: 'file' }
        ]},
        { name: 'pages', type: 'folder', children: [
          { name: 'Home.jsx', type: 'file' },
          { name: 'About.jsx', type: 'file' }
        ]},
        { name: 'utils', type: 'folder', children: [
          { name: 'helpers.js', type: 'file' },
          { name: 'constants.js', type: 'file' }
        ]}
      ]
    },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' },
    { name: 'tailwind.config.js', type: 'file' }
  ]);

  const handleFileSelect = (file) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };

  const handleFileCreate = (type, parent) => {
    console.log(`Creating ${type}:`, parent);
    // TODO: Implement file creation
  };

  const handleContextMenu = (e, item) => {
    console.log('Context menu:', item);
    // TODO: Implement context menu
  };

  return (
    <div className="h-screen bg-[#1e1e1e] text-gray-200 flex flex-col overflow-hidden">
      {/* VS Code-style Header */}
      <header className="h-9 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-4 shrink-0 text-sm">
        <div className="flex items-center gap-3">
          {/* VS Code Logo */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚡</span>
            </div>
            <span className="font-medium text-gray-300">CodeDev</span>
          </div>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-gray-400">
            <span>›</span>
            <span className="text-blue-400">Room: {params.roomid}</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {/* Connection Status with Avatar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                Y
              </div>
              <span className="text-xs text-gray-400">You</span>
            </div>
            
            <div className="w-px h-4 bg-gray-600"></div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400">
                {isConnected ? `Connected • ${collaborators.length} users` : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {connectionError && (
            <div className="flex items-center gap-1">
              <span className="text-red-400 text-xs">⚠</span>
              <span className="text-xs text-red-400">{connectionError}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex flex-1 overflow-hidden bg-[#1e1e1e]">
        {/* File Explorer Sidebar */}
        <aside className="w-64 shrink-0 bg-[#252526] border-r border-[#3e3e42]">
          <FileExplorer 
            files={files}
            onSelect={handleFileSelect}
            selected={selectedFile}
            onCreate={handleFileCreate}
            onContextMenu={handleContextMenu}
          />
        </aside>

        {/* Editor Area */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {/* Tab Bar */}
          <div className="h-9 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-3">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] border-t-2 border-blue-500 text-sm">
                <span className="text-blue-400">📄</span>
                <span className="text-gray-200">{selectedFile?.name || 'Welcome.js'}</span>
                <button className="text-gray-500 hover:text-gray-300 ml-2">×</button>
              </div>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 bg-[#1e1e1e]">
            <MonacoEditor 
              selectedFile={selectedFile}
              roomid={params.roomid}
            />
          </div>

          {/* Terminal Panel */}
          <div className="h-48 bg-[#181818] border-t border-[#3e3e42] shrink-0">
            <div className="h-9 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-400">⚡</span>
                  <span className="text-gray-200">Terminal</span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-4 h-4 bg-gray-600 hover:bg-gray-500 rounded-sm flex items-center justify-center">
                    <span className="text-xs">+</span>
                  </button>
                </div>
              </div>
            </div>
            <Terminal />
          </div>
        </section>

        {/* Modern VS Code-style Collaboration Panel */}
        <aside className="w-80 shrink-0 bg-[#252526] border-l border-[#3e3e42]">
          {/* Panel Header */}
          <div className="h-9 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-purple-400">👥</span>
              <span className="text-gray-200 font-medium">Live Share</span>
              <span className="text-xs text-gray-500">({collaborators.length})</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button className="w-4 h-4 text-gray-500 hover:text-gray-300 flex items-center justify-center">
                ⚙
              </button>
            </div>
          </div>

          <div className="p-4 h-full overflow-y-auto">
            {/* Connection Status */}
            <div className="mb-6">
              <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-lg border border-[#3e3e42]">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-200">
                    {isConnected ? 'Connected to Room' : 'Disconnected'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {isConnected ? 'Real-time collaboration active' : 'Trying to reconnect...'}
                  </div>
                </div>
                <div className="text-xs text-blue-400 font-mono">
                  {params.roomid.slice(0, 8)}...
                </div>
              </div>
            </div>

            {/* Active Collaborators */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <span className="text-purple-400">🟢</span>
                Active Now
              </h4>
              
              {collaborators.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">👋</div>
                  <div className="text-sm text-gray-400">
                    Invite others to start collaborating
                  </div>
                  <button className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md transition-colors">
                    Copy Invite Link
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {collaborators.map((collaborator) => (
                    <div 
                      key={collaborator.id} 
                      className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-lg border border-[#3e3e42] hover:border-[#555] transition-colors"
                    >
                      {/* User Avatar */}
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2"
                        style={{ 
                          backgroundColor: collaborator.color + '20',
                          borderColor: collaborator.color,
                          color: collaborator.color 
                        }}
                      >
                        {collaborator.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-sm font-medium truncate"
                            style={{ color: collaborator.color }}
                          >
                            {collaborator.name}
                          </span>
                          {collaborator.id === myId && (
                            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Editing line 42 • Just now
                        </div>
                      </div>
                      
                      {/* Activity Indicator */}
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">●</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Features Status */}
            <div className="bg-[#1e1e1e] rounded-lg border border-[#3e3e42] p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Features</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Real-time editing</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cursor tracking</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Auto-sync</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
