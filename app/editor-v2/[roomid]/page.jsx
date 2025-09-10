'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import io from 'socket.io-client';
import { FileText, Folder, FolderOpen, Play, Save, Users, Terminal as TerminalIcon } from 'lucide-react';

// Dynamic imports for client-side components
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function EditorPageV2() {
  const params = useParams();
  const roomId = params?.roomid;
  
  // Core state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('// Welcome to CodeDev V2\n// Select a file to start editing...');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  
  // Refs to prevent re-connections
  const socketRef = useRef(null);
  const mountedRef = useRef(true);

  // Initialize socket connection - ONCE
  useEffect(() => {
    if (!roomId || socketRef.current) return;

    console.log('🚀 V2: Initializing connection for room:', roomId);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      if (!mountedRef.current) return;
      console.log('✅ V2: Connected to server');
      setIsConnected(true);
      newSocket.emit('join-room', roomId);
    });

    newSocket.on('disconnect', () => {
      if (!mountedRef.current) return;
      console.log('❌ V2: Disconnected from server');
      setIsConnected(false);
    });

    // Project data events
    newSocket.on('project-loaded', (data) => {
      if (!mountedRef.current) return;
      console.log('📂 V2: Project loaded:', data);
      setProject(data.project);
      setFiles(data.files || []);
      
      // Auto-expand first level folders
      if (data.files && data.files.length > 0) {
        const foldersToExpand = new Set();
        data.files.forEach(item => {
          if (item.type === 'folder') {
            foldersToExpand.add(item.path);
          }
        });
        setExpandedFolders(foldersToExpand);
      }
    });

    // File content events
    newSocket.on('file-content', (data) => {
      if (!mountedRef.current) return;
      console.log('📄 V2: File content received:', data.path);
      setCode(data.content);
      setSelectedFile(data.path);
    });

    // Folder expansion events
    newSocket.on('folder-content', (data) => {
      if (!mountedRef.current) return;
      console.log('📁 V2: Folder content received:', data.path, data.children);
      
      // Update the files array with the expanded folder's children
      setFiles(prevFiles => {
        const updateFileTree = (items) => {
          return items.map(item => {
            if (item.path === data.path && item.type === 'folder') {
              return { ...item, children: data.children };
            } else if (item.children) {
              return { ...item, children: updateFileTree(item.children) };
            }
            return item;
          });
        };
        return updateFileTree(prevFiles);
      });
    });

    // Error handlers
    newSocket.on('file-error', (data) => {
      if (!mountedRef.current) return;
      console.error('📄 V2: File error:', data.error);
    });

    newSocket.on('folder-error', (data) => {
      if (!mountedRef.current) return;
      console.error('📁 V2: Folder error:', data.error);
    });

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (newSocket) {
        console.log('🧹 V2: Cleaning up socket');
        newSocket.disconnect();
      }
      socketRef.current = null;
    };
  }, [roomId]);

  // File tree rendering
  const renderFileTree = (items, level = 0) => {
    if (!items || items.length === 0) {
      return (
        <div className="p-4 text-gray-400 text-sm">
          {isConnected ? 'No files in project' : 'Connecting...'}
        </div>
      );
    }

    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
        {item.type === 'folder' ? (
          <div>
            <div
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm"
              onClick={() => {
                const newExpanded = new Set(expandedFolders);
                if (newExpanded.has(item.path)) {
                  newExpanded.delete(item.path);
                } else {
                  newExpanded.add(item.path);
                  // Load folder contents if not already loaded
                  if (socket && isConnected && (!item.children || item.children.length === 0)) {
                    console.log('📁 V2: Requesting folder:', item.path);
                    socket.emit('read-folder', { roomId, folderPath: item.path });
                  }
                }
                setExpandedFolders(newExpanded);
              }}
            >
              {expandedFolders.has(item.path) ? (
                <FolderOpen className="w-4 h-4 text-blue-400" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-gray-300">{item.name}</span>
            </div>
            {expandedFolders.has(item.path) && item.children && (
              <div>
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm ${
              selectedFile === item.path ? 'bg-blue-900' : ''
            }`}
            onClick={() => {
              if (socket && isConnected) {
                console.log('📄 V2: Requesting file:', item.path);
                setSelectedFile(item.path);
                socket.emit('read-file', { roomId, filePath: item.path });
              }
            }}
          >
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">{item.name}</span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="h-12 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">CodeDev V2</h1>
          {project && (
            <span className="text-sm text-gray-400">• {project.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - File Explorer */}
        <div className="w-64 bg-[#161b22] border-r border-gray-800 flex flex-col">
          <div className="h-10 bg-[#21262d] border-b border-gray-800 flex items-center px-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Explorer</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderFileTree(files)}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Editor */}
          <div className="flex-1">
            {selectedFile ? (
              <MonacoEditor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={(value) => {
                  setCode(value || '');
                  // Auto-save could be implemented here
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Welcome to CodeDev V2</p>
                  <p>Select a file from the explorer to start editing</p>
                  {project && (
                    <p className="text-sm text-gray-400 mt-2">
                      Project: {project.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Simple Terminal Placeholder */}
          <div className="h-48 bg-[#0d1117] border-t border-gray-800">
            <div className="h-8 bg-[#161b22] border-b border-gray-800 flex items-center px-3">
              <TerminalIcon className="w-4 h-4 mr-2 text-gray-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Terminal</span>
            </div>
            <div className="p-4 text-green-400 font-mono text-sm">
              <div>CodeDev V2 Terminal</div>
              <div className="text-gray-500">Terminal integration coming soon...</div>
              {project && (
                <div className="text-gray-400 mt-2">
                  Working directory: {project.localPath}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
