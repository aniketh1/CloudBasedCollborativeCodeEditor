'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import io from 'socket.io-client';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FolderOpen, Play, Save, Users, Settings, Minus, X, Menu, ChevronRight, ChevronDown } from 'lucide-react';
import ErrorBoundary from '../../../components/ErrorBoundary';

// Dynamic imports for client-side only components
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// Dynamic import for XTerm to avoid SSR issues
const XTermWrapper = dynamic(() => import('./XTermWrapper'), { ssr: false });

export default function EditorPage() {
  const params = useParams();
  const roomId = params?.roomid;
  
  // State management
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [code, setCode] = useState('// Welcome to the collaborative editor\nconsole.log("Hello, World!");');
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]); // Start empty, wait for real project data
  const [selectedFile, setSelectedFile] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [projectLoading, setProjectLoading] = useState(false); // Changed to false to show editor immediately
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [openTabs, setOpenTabs] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['src', 'public'])); // Pre-expand folders

  // Socket ref to prevent multiple connections  
  const socketRef = useRef(null);
  const connectionAttempted = useRef(false);

  // Debug render states
  console.log('🎨 Render State:', {
    roomId,
    isConnected,
    projectLoading,
    filesCount: files.length,
    selectedFile,
    openTabsCount: openTabs.length
  });

  // Initialize socket connection
  useEffect(() => {
    console.log('🚀 useEffect running with roomId:', roomId);
    
    // Prevent multiple connection attempts
    if (!roomId || connectionAttempted.current || socketRef.current) {
      console.log('🚫 Skipping socket connection - already connected or attempted');
      return;
    }

    connectionAttempted.current = true;
    console.log('🔌 Initializing socket connection to http://localhost:3001');
    console.log('🔧 Socket.IO client version:', typeof io);
    
    let newSocket;
    
    try {
      newSocket = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 10000
      });
      
      socketRef.current = newSocket; // Store in ref
      setSocket(newSocket);
      console.log('✅ Socket created successfully');
      
      // Immediate fallback for testing - show editor after 1 second regardless
      setTimeout(() => {
        console.log('🚀 Quick fallback: Setting projectLoading to false');
        setProjectLoading(false);
      }, 1000);

      newSocket.on('connect', () => {
        console.log('✅ Connected to server with socket ID:', newSocket.id);
        setIsConnected(true);
        
        // Join room and load project
        console.log('📤 Joining room:', roomId);
        newSocket.emit('join-room', roomId);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server. Reason:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setIsConnected(false);
      });

      // Project and file events
      newSocket.on('project-loaded', (projectData) => {
        console.log('📂 Project loaded:', projectData);
        console.log('🔧 Setting projectLoading to false');
        setProject(projectData.project);
        setFiles(projectData.files || []);
        setProjectLoading(false);
        
        // Auto-expand main folders by default
        const foldersToExpand = new Set(['src', 'public', 'components']);
        setExpandedFolders(foldersToExpand);
        console.log('📁 Expanding folders:', Array.from(foldersToExpand));
        
        // Helper function to find first file
        const findFirstFile = (fileArray) => {
          for (const item of fileArray) {
            if (item.type === 'file') return item;
            if (item.type === 'directory' && item.children) {
              const found = findFirstFile(item.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        // Auto-select first file if available
        if (projectData.files && projectData.files.length > 0) {
          console.log('📁 Files available:', projectData.files.length, 'files');
          const firstFile = findFirstFile(projectData.files);
          if (firstFile) {
            console.log('📄 Auto-selecting first file:', firstFile.path);
            // Use the actual function that exists
            if (socket) {
              socket.emit('read-file', { roomId, filePath: firstFile.path });
            }
          }
        } else {
          console.log('⚠️ No files in project data');
        }
      });

      newSocket.on('file-structure-update', (filesData) => {
        console.log('🗂️ File structure update (ignoring, waiting for project-loaded):', filesData);
        // Commented out to prevent overriding project-loaded data
        // setFiles(filesData || []);
      });

      newSocket.on('file-content', (data) => {
        setCode(data.content);
        setSelectedFile(data.path);
        
        // Add to open tabs
        const fileName = data.path.split(/[/\\]/).pop();
        setOpenTabs(prev => {
          const exists = prev.find(tab => tab.path === data.path);
          if (!exists) {
            return [...prev, { name: fileName, path: data.path, content: data.content }];
          }
          return prev.map(tab => 
            tab.path === data.path ? { ...tab, content: data.content } : tab
          );
        });
      });

      newSocket.on('code-change', (newCode) => {
        setCode(newCode);
        
        // Update tab content
        setOpenTabs(prev => 
          prev.map(tab => 
            tab.path === selectedFile ? { ...tab, content: newCode } : tab
          )
        );
      });

      newSocket.on('users-update', (users) => {
        setConnectedUsers(users);
      });

      newSocket.on('file-error', (data) => {
        console.error('File error:', data.error);
      });

      newSocket.on('file-saved', (data) => {
        console.log('File saved:', data.filePath);
      });

      newSocket.on('file-updated', (data) => {
        // Update code if it's the currently selected file
        if (data.filePath === selectedFile) {
          setCode(data.content);
        }
        
        // Update tab content
        setOpenTabs(prev => 
          prev.map(tab => 
            tab.path === data.filePath ? { ...tab, content: data.content } : tab
          )
        );
      });
      
      // Fallback timeout - show editor even if socket fails (reduced to 3 seconds)
      const timeoutId = setTimeout(() => {
        console.log('⏰ Timeout: Setting projectLoading to false (fallback)');
        setProjectLoading(false);
      }, 3000);

      return () => {
        clearTimeout(timeoutId);
        if (newSocket) {
          console.log('🧹 Cleaning up socket connection');
          newSocket.disconnect();
        }
        // Reset connection flags for potential reconnection
        socketRef.current = null;
        connectionAttempted.current = false;
      };
      
    } catch (error) {
      console.error('❌ Failed to create socket:', error);
      // Even if socket fails, show the editor
      setProjectLoading(false);
    }
  }, [roomId]);

  // Utility functions
  const findFirstFile = (fileArray) => {
    for (const item of fileArray) {
      if (item.type === 'file') return item;
      if (item.type === 'directory' && item.children) {
        const found = findFirstFile(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const getFileLanguage = (filePath) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      css: 'css',
      html: 'html',
      json: 'json',
      md: 'markdown',
      txt: 'plaintext',
    };
    return languageMap[extension] || 'plaintext';
  };

  // Handle code changes
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket && selectedFile) {
      socket.emit('code-change', { roomId, code: newCode, file: selectedFile });
    }
    
    // Update tab content
    setOpenTabs(prev => 
      prev.map(tab => 
        tab.path === selectedFile ? { ...tab, content: newCode } : tab
      )
    );
  };

  // Handle file selection
  const handleFileSelect = (filePath) => {
    console.log('🔍 File selected:', filePath);
    
    // Mock file content for testing
    const mockContent = {
      'src/App.jsx': `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Hello World</h1>
      <p>This is a React app!</p>
    </div>
  );
}

export default App;`,
      'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(<App />, document.getElementById('root'));`,
      'package.json': `{
  "name": "my-react-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}`,
      'README.md': '# My Project\n\nThis is a sample project for testing the collaborative editor.'
    };
    
    const content = mockContent[filePath] || `// Content for ${filePath}\nconsole.log('Hello from ${filePath}');`;
    
    setCode(content);
    setSelectedFile(filePath);
    
    // Add to open tabs
    const fileName = filePath.split(/[/\\]/).pop();
    setOpenTabs(prev => {
      const exists = prev.find(tab => tab.path === filePath);
      if (!exists) {
        console.log('📂 Adding new tab:', fileName);
        return [...prev, { name: fileName, path: filePath, content: content }];
      }
      return prev.map(tab => 
        tab.path === filePath ? { ...tab, content: content } : tab
      );
    });
    
    if (socket) {
      console.log('📤 Emitting read-file event for:', filePath);
      socket.emit('read-file', { roomId, filePath });
    } else {
      console.log('⚠️ No socket connection, using mock content');
    }
  };

  // Handle tab selection
  const handleTabSelect = (tab) => {
    setSelectedFile(tab.path);
    setCode(tab.content);
  };

  // Handle tab close
  const handleTabClose = (tabToClose) => {
    setOpenTabs(prev => {
      const newTabs = prev.filter(tab => tab.path !== tabToClose.path);
      
      // If closing the active tab, switch to another tab
      if (tabToClose.path === selectedFile && newTabs.length > 0) {
        const newActiveTab = newTabs[0];
        setSelectedFile(newActiveTab.path);
        setCode(newActiveTab.content);
      } else if (newTabs.length === 0) {
        setSelectedFile(null);
        setCode('// Select a file to start editing');
      }
      
      return newTabs;
    });
  };

  // Handle file save
  const handleFileSave = () => {
    if (socket && selectedFile) {
      socket.emit('write-file', { roomId, filePath: selectedFile, content: code });
    }
  };

  // Handle running code/commands
  const handleRunCode = () => {
    if (socket && selectedFile) {
      const extension = selectedFile.split('.').pop();
      let command = '';
      
      switch (extension) {
        case 'js':
          command = `node "${selectedFile}"`;
          break;
        case 'py':
          command = `python "${selectedFile}"`;
          break;
        case 'java':
          const className = selectedFile.replace('.java', '').split(/[/\\]/).pop();
          command = `javac "${selectedFile}" && java ${className}`;
          break;
        default:
          command = `cat "${selectedFile}"`;
      }
      
      socket.emit('terminal-input', { roomId, data: command + '\r' });
    }
  };

  // Render file tree with expandable folders
  const renderFileTree = (files, level = 0) => {
    console.log('🌳 Rendering file tree at level', level, 'with', files.length, 'items');
    return files.map((file) => (
      <div key={file.path || file.name} style={{ marginLeft: level * 16 }}>
        <button
          onClick={() => {
            console.log('🖱️ Clicked on:', file.name, 'Type:', file.type);
            if (file.type === 'file') {
              console.log('📄 Opening file:', file.path);
              handleFileSelect(file.path);
            } else if (file.type === 'directory') {
              console.log('📁 Toggling folder:', file.path || file.name);
              // Toggle folder expansion
              setExpandedFolders(prev => {
                const newSet = new Set(prev);
                const folderKey = file.path || file.name;
                if (newSet.has(folderKey)) {
                  console.log('📁 Collapsing folder:', folderKey);
                  newSet.delete(folderKey);
                } else {
                  console.log('📁 Expanding folder:', folderKey);
                  newSet.add(folderKey);
                }
                return newSet;
              });
            }
          }}
          className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-800 rounded flex items-center gap-2 ${
            selectedFile === file.path ? 'bg-gray-700' : ''
          }`}
        >
          {file.type === 'directory' ? (
            <>
              {expandedFolders.has(file.path || file.name) ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <FolderOpen className="w-4 h-4 text-yellow-500" />
            </>
          ) : (
            <>
              <span className="w-4" /> {/* Spacing for alignment */}
              <FileText className="w-4 h-4 text-blue-400" />
            </>
          )}
          <span className="truncate">{file.name}</span>
        </button>
        {file.type === 'directory' && 
         file.children && 
         expandedFolders.has(file.path || file.name) && 
         renderFileTree(file.children, level + 1)}
      </div>
    ));
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00ff88] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Loading Project...</h2>
          <p className="text-gray-400">Room ID: {roomId}</p>
          <p className="text-sm text-gray-500 mt-2">
            Status: {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
          </p>
          <button 
            onClick={() => setProjectLoading(false)}
            className="mt-4 px-4 py-2 bg-[#00ff88] text-black rounded hover:bg-[#00ff88]/90 text-sm"
          >
            Skip Loading & Enter Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* VS Code-style Header */}
      <div className="bg-[#16161e] h-8 flex justify-between items-center px-2 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Menu className="w-4 h-4 text-gray-300" />
          <span className="text-sm text-gray-300">
            {project?.name || `Room ${roomId}`} - Collab Dev
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">
            {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online
          </span>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <div className="flex items-center space-x-1">
          <Minus className="w-4 h-4 text-gray-300 hover:bg-gray-700 rounded p-0.5" />
          <X className="w-4 h-4 text-gray-300 hover:bg-red-600 rounded p-0.5" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-32px)]">
        {/* Sidebar - File Explorer */}
        <div 
          className="bg-gray-950 border-r border-gray-800 flex flex-col"
          style={{ width: sidebarWidth }}
        >
          <div className="p-3 border-b border-gray-800">
            <h3 className="font-medium text-xs text-gray-300 uppercase tracking-wider mb-1">
              Explorer
            </h3>
            <div className="text-xs text-gray-500">
              {project?.name || 'Project'}
            </div>
            {project?.localPath && (
              <div className="text-xs text-gray-600 truncate mt-1" title={project.localPath}>
                {project.localPath}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-1">
            {files.length > 0 ? (
              renderFileTree(files)
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files found</p>
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className="w-1 bg-gray-800 cursor-col-resize hover:bg-gray-700"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = sidebarWidth;
            
            const handleMouseMove = (e) => {
              const newWidth = Math.max(200, Math.min(400, startWidth + (e.clientX - startX)));
              setSidebarWidth(newWidth);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* Editor and Terminal */}
        <div className="flex-1 flex flex-col">
          {/* Tabs Bar */}
          <div className="bg-[#1a1a2e] border-b border-gray-800 flex items-center h-10">
            <div className="flex flex-1 overflow-x-auto">
              {openTabs.map((tab) => (
                <div
                  key={tab.path}
                  className={`flex items-center px-3 py-2 border-r border-gray-800 cursor-pointer min-w-0 ${
                    selectedFile === tab.path 
                      ? 'bg-[#16161e] text-white' 
                      : 'text-gray-400 hover:bg-[#16161e]'
                  }`}
                  onClick={() => handleTabSelect(tab)}
                >
                  <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate text-sm">{tab.name}</span>
                  <X 
                    className="w-4 h-4 ml-2 hover:bg-red-600 rounded flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTabClose(tab);
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center px-3 gap-2 border-l border-gray-800">
              <Button 
                onClick={handleFileSave}
                size="sm"
                className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90 h-7 px-2"
                disabled={!selectedFile}
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              
              <Button 
                onClick={handleRunCode}
                size="sm"
                variant="outline"
                className="h-7 px-2"
                disabled={!selectedFile}
              >
                <Play className="w-3 h-3 mr-1" />
                Run
              </Button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 bg-[#1e1e1e]">
            {selectedFile ? (
              <MonacoEditor
                height="100%"
                language={getFileLanguage(selectedFile)}
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  renderLineHighlight: 'line',
                  selectionHighlight: false,
                  renderValidationDecorations: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  bracketMatching: 'always',
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Welcome to Collab Dev</p>
                  <p>Select a file from the explorer to start editing</p>
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          <div className="h-64 bg-[#1a1a1a] border-t border-gray-800">
            <div className="h-8 bg-[#16161e] border-b border-gray-800 flex items-center px-3">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Terminal</span>
            </div>
            <div className="h-56 p-2">
              <ErrorBoundary>
                <XTermWrapper 
                  socket={socket}
                  roomId={roomId}
                  isConnected={isConnected}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
