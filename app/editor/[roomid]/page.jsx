'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import io from 'socket.io-client';
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  Play, 
  Save, 
  Users, 
  Terminal as TerminalIcon,
  Settings,
  Palette,
  Sun,
  Moon,
  Monitor,
  UserPlus,
  Mail,
  Search,
  Send,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import DebugPanel from '@/components/DebugPanel';
import ConnectionStatus from '@/components/ConnectionStatus';

// Dynamic imports for client-side components with loading fallback
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-[#0d1117] text-white">Loading Editor...</div>
});
const XTermWrapper = dynamic(() => import('./XTermWrapper_test'), { 
  ssr: false,
  loading: () => <div className="h-24 flex items-center justify-center bg-[#0c0c0c] text-green-400">Loading Terminal...</div>
});

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const roomId = params?.roomid;
  
  // Client-side only flags to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Authentication check
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Core state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [terminalStatus, setTerminalStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('// Welcome to ColabDev\n// Select a file to start editing...');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showTerminal, setShowTerminal] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  
  // Enhanced editor state
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState('on');
  const [showSettings, setShowSettings] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  
  // Invite system state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteMode, setInviteMode] = useState('search'); // 'search' or 'code'
  const [sessionCode, setSessionCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(new Set());
  
  // Collaboration state
  const [roomUsers, setRoomUsers] = useState([]);
  const [userCursors, setUserCursors] = useState(new Map());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [currentUser] = useState({
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: `User${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
    avatar: null
  });
  const [showUserList, setShowUserList] = useState(true);
  
  // Refs to prevent re-connections
  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Language detection based on file extension
  const getLanguageFromFileName = (fileName) => {
    if (!fileName) return 'plaintext';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'html',
      'htm': 'html',
      'xml': 'xml',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'r': 'r',
      'mat': 'matlab',
      'pl': 'perl',
      'lua': 'lua',
      'vim': 'vim'
    };
    
    return languageMap[extension] || 'plaintext';
  };

  // Available themes
  const themes = [
    { value: 'vs-dark', name: 'Dark (VS Code)', icon: Moon },
    { value: 'vs', name: 'Light (VS Code)', icon: Sun },
    { value: 'hc-black', name: 'High Contrast Dark', icon: Monitor }
  ];

  // Enhanced editor options
  const getEditorOptions = () => ({
    minimap: { enabled: showMinimap },
    fontSize: fontSize,
    lineNumbers: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: wordWrap,
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    renderWhitespace: 'boundary',
    rulers: [80, 120],
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',
    unfoldOnClickAfterEndOfLine: false,
    selectionHighlight: true,
    occurrencesHighlight: true,
    find: {
      autoFindInSelection: 'always',
      addExtraSpaceOnTop: true
    },
    suggest: {
      insertMode: 'replace',
      filterGraceful: true,
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
      showInterfaces: true,
      showModules: true,
      showProperties: true,
      showEvents: true,
      showOperators: true,
      showUnits: true,
      showValues: true,
      showConstants: true,
      showEnums: true,
      showEnumMembers: true,
      showColors: true,
      showFiles: true,
      showReferences: true,
      showFolders: true,
      showTypeParameters: true
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    quickSuggestionsDelay: 10,
    parameterHints: {
      enabled: true,
      cycle: true
    },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoSurround: 'languageDefined',
    bracketPairColorization: {
      enabled: true
    },
    guides: {
      bracketPairs: 'active',
      indentation: true
    },
    smoothScrolling: true,
    mouseWheelZoom: true,
    contextmenu: true,
    links: true,
    colorDecorators: true,
    lightbulb: {
      enabled: true
    },
    codeActionsOnSave: {
      source: {
        organizeImports: true
      }
    }
  });

  // Client-side mount handler to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    setIsMounted(true);
    
    // Set session code when component mounts
    if (roomId) {
      setSessionCode(roomId);
    }
    
    return () => {
      setIsMounted(false);
    };
  }, [roomId]);

  // Authentication check - simplified without backend dependency
  useEffect(() => {
    if (!isLoaded || !isClient) return;
    
    if (!user) {
      setIsAuthorized(false);
      setIsCheckingAuth(false);
      return;
    }
    
    // Simplified: if user is authenticated, allow access to any room
    // In production, you'd want proper room access control
    console.log('Editor: User authenticated, granting room access to room:', roomId);
    setIsAuthorized(true);
    setIsCheckingAuth(false);
    setSessionCode(roomId); // Use roomId as session code
    
  }, [user, isLoaded, roomId, isClient]);

  // User search functionality
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${user?.id}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Send email invite
  const sendEmailInvite = async (recipientUser) => {
    setSendingInvites(prev => new Set([...prev, recipientUser.id]));
    
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/api/invites/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.id}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientEmail: recipientUser.email,
          recipientName: recipientUser.name,
          roomId: roomId,
          senderName: user?.firstName || user?.username || 'Anonymous'
        })
      });
      
      if (response.ok) {
        alert(`Invite sent to ${recipientUser.email}!`);
      } else {
        alert('Failed to send invite. Please try again.');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Failed to send invite. Please try again.');
    } finally {
      setSendingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipientUser.id);
        return newSet;
      });
    }
  };

  // Copy session code
  const copySessionCode = async () => {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Initialize socket connection - ONLY if authenticated and client-side
  useEffect(() => {
    if (!roomId || socketRef.current || !isAuthorized || !isClient || !isMounted || !isLoaded) return;

    console.log('🚀 Initializing Socket.IO connection for room:', roomId);
    console.log('🔍 User:', user?.emailAddresses?.[0]?.emailAddress);
    setConnectionStatus('connecting');

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    console.log('🔗 Connecting to deployed backend:', BACKEND_URL);
    console.log('🌐 Backend type:', BACKEND_URL.includes('onrender.com') ? 'Production (Render)' : 'Local Development');
    
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 15000, // Increased timeout for deployed backend
      autoConnect: true,
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true,
      withCredentials: true
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events with enhanced logging
    newSocket.on('connect', () => {
      if (!mountedRef.current) return;
      console.log('✅ Socket.IO Connected! Socket ID:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Join room after successful connection
      console.log('🏠 Joining room:', roomId);
      newSocket.emit('join-room', roomId);
    });

    newSocket.on('disconnect', (reason) => {
      if (!mountedRef.current) return;
      console.log('❌ Socket.IO Disconnected. Reason:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setTerminalStatus('connecting');
    });

    // Enhanced connection error handling
    newSocket.on('connect_error', (error) => {
      console.error('🚨 Socket.IO Connection Error:', error);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      setTerminalStatus('error');
    });
    newSocket.on('connect_error', (error) => {
      console.error('🚨 Connection error:', error);
      setConnectionStatus('disconnected');
      setIsConnected(false);
    });

    // Room join confirmation
    newSocket.on('room-joined', (data) => {
      if (!mountedRef.current) return;
      console.log('🏠 Successfully joined room:', data);
      
      // Request project data after joining room
      console.log('📁 Requesting project data...');
      newSocket.emit('get-project', { roomId });
    });

    // Project data events - Enhanced for better debugging
    newSocket.on('project-loaded', (data) => {
      if (!mountedRef.current) return;
      console.log('📂 Project loaded:', data);
      
      if (data.project) {
        setProject(data.project);
        console.log('✅ Project data set:', data.project);
      }
      
      if (data.files && Array.isArray(data.files)) {
        setFiles(data.files);
        setIsProjectLoaded(true);
        console.log('✅ Files loaded:', data.files.length, 'files');
        
        // Auto-expand folders that have content (recursive)
        const foldersToExpand = new Set();
        
        const expandFoldersWithContent = (items) => {
          items.forEach(item => {
            if (item.type === 'folder' && item.children && item.children.length > 0) {
              foldersToExpand.add(item.path);
              // Recursively expand nested folders
              expandFoldersWithContent(item.children);
            }
          });
        };
        
        expandFoldersWithContent(data.files);
        setExpandedFolders(foldersToExpand);
        console.log('📁 Auto-expanded folders:', Array.from(foldersToExpand));
      } else {
        console.warn('⚠️ No files received in project-loaded event');
        setFiles([]);
        setIsProjectLoaded(true);
      }
    });

    // Terminal connection event
    newSocket.on('terminal-ready', (data) => {
      if (!mountedRef.current) return;
      console.log('🖥️ Terminal ready:', data);
      setTerminalStatus('connected');
    });

    newSocket.on('terminal-error', (error) => {
      if (!mountedRef.current) return;
      console.error('🖥️ Terminal error:', error);
      setTerminalStatus('error');
    });

    // File content events
    newSocket.on('file-content', (data) => {
      if (!mountedRef.current) return;
      console.log('📄 File content received:', data.path);
      setCode(data.content);
      setSelectedFile(data.path);
      setCurrentLanguage(getLanguageFromFileName(data.path));
      setHasUnsavedChanges(false); // Reset unsaved changes when loading new file
    });

    // File save confirmation
    newSocket.on('file-saved', (data) => {
      if (!mountedRef.current) return;
      console.log('💾 File saved successfully:', data.path);
      setHasUnsavedChanges(false);
      setIsSaving(false);
    });

    // Folder expansion events
    newSocket.on('folder-content', (data) => {
      if (!mountedRef.current) return;
      console.log('📁 Folder content received:', data.path, data.children);
      
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

    // Error handlers with user-friendly messages
    newSocket.on('file-error', (data) => {
      if (!mountedRef.current) return;
      console.error('📄 File error:', data.error);
      
      // Show user-friendly error message
      if (data.error === 'Room not found') {
        console.error('🏠 Room not found - this might be a room synchronization issue');
        // Could show a toast notification here
      } else if (data.error === 'File not found') {
        console.error('📄 File not found - file may have been deleted or moved');
        setCode('// File not found\n// The file may have been deleted or is not accessible');
      }
    });

    newSocket.on('folder-error', (data) => {
      if (!mountedRef.current) return;
      console.error('📁 Folder error:', data.error);
      
      if (data.error === 'Room not found') {
        console.error('🏠 Room not found - this might be a room synchronization issue');
      }
    });

    // Enhanced collaboration events
    newSocket.on('room-users', (users) => {
      if (!mountedRef.current) return;
      console.log('👥 Room users updated:', users);
      
      // Handle both array and object cases from backend
      let userArray = [];
      if (Array.isArray(users)) {
        userArray = users;
      } else if (users && typeof users === 'object') {
        // If backend sends an object with users property
        userArray = users.users || [users];
      } else {
        console.warn('⚠️ Unexpected users format:', users);
        userArray = [];
      }
      
      setRoomUsers(userArray.filter(user => user.id !== currentUser.id));
    });

    newSocket.on('user-joined', (userData) => {
      if (!mountedRef.current) return;
      console.log('👋 User joined:', userData);
      if (userData && userData.id !== currentUser.id) {
        setRoomUsers(prev => {
          // Ensure prev is an array
          const currentUsers = Array.isArray(prev) ? prev : [];
          return [...currentUsers.filter(user => user.id !== userData.id), userData];
        });
      }
    });

    newSocket.on('user-left', ({ userId }) => {
      if (!mountedRef.current) return;
      console.log('👋 User left:', userId);
      setRoomUsers(prev => {
        // Ensure prev is an array
        const currentUsers = Array.isArray(prev) ? prev : [];
        return currentUsers.filter(user => user.id !== userId);
      });
      setUserCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(userId);
        return newCursors;
      });
    });

    newSocket.on('user-typing', ({ userId, filePath, isTyping }) => {
      if (!mountedRef.current) return;
      if (userId !== currentUser.id && filePath === selectedFile) {
        setTypingUsers(prev => {
          const newTyping = new Set(prev);
          if (isTyping) {
            newTyping.add(userId);
          } else {
            newTyping.delete(userId);
          }
          return newTyping;
        });
      }
    });

    newSocket.on('cursor-update', (cursorData) => {
      if (!mountedRef.current) return;
      if (cursorData.userId !== currentUser.id && cursorData.filePath === selectedFile) {
        setUserCursors(prev => new Map(prev).set(cursorData.userId, cursorData));
      }
    });

    newSocket.on('code-operation', (operationData) => {
      if (!mountedRef.current) return;
      if (operationData.userId !== currentUser.id && operationData.filePath === selectedFile) {
        console.log('🔄 Received code operation:', operationData);
        // Apply the operation to the current code without triggering onChange
        setCode(operationData.content);
        setHasUnsavedChanges(true); // Mark as having changes from other users
      }
    });

    // Real-time file updates from other users
    newSocket.on('file-updated', (updateData) => {
      if (!mountedRef.current) return;
      console.log('🔄 File updated by another user:', updateData);
      
      // If the currently selected file was updated by someone else, reload it
      if (updateData.filePath === selectedFile && updateData.userId !== user?.id) {
        setCode(updateData.content);
        setHasUnsavedChanges(false);
        
        // Show notification that file was updated
        // You could add a toast notification here
        console.log(`📝 File "${updateData.filePath}" was updated by ${updateData.userName}`);
      }
    });

    // Project structure updates (files/folders added/deleted)
    newSocket.on('project-structure-updated', (structureData) => {
      if (!mountedRef.current) return;
      console.log('🔄 Project structure updated:', structureData);
      
      // Update the file tree
      setFiles(structureData.files || []);
      
      // If the currently selected file was deleted, clear the editor
      if (structureData.deletedFiles && structureData.deletedFiles.includes(selectedFile)) {
        setSelectedFile(null);
        setCode('// File was deleted by another user\n// Select a new file to start editing...');
        setHasUnsavedChanges(false);
      }
    });

    // User activity updates
    newSocket.on('user-activity', (activityData) => {
      if (!mountedRef.current) return;
      
      // Update user status (typing, editing file, etc.)
      if (activityData.type === 'typing-start') {
        setTypingUsers(prev => new Set([...prev, activityData.userId]));
      } else if (activityData.type === 'typing-stop') {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(activityData.userId);
          return newSet;
        });
      }
    });

    newSocket.on('user-typing', ({ userId, filePath, isTyping }) => {
      if (!mountedRef.current) return;
      if (userId !== currentUser.id && filePath === selectedFile) {
        setTypingUsers(prev => {
          const newTyping = new Set(prev);
          if (isTyping) {
            newTyping.add(userId);
          } else {
            newTyping.delete(userId);
          }
          return newTyping;
        });
      }
    });

    newSocket.on('user-file-selected', ({ userId, filePath }) => {
      if (!mountedRef.current) return;
      console.log(`📄 ${userId} selected file: ${filePath}`);
      // Update user presence indicator
    });

    newSocket.on('user-status-changed', ({ userId, isActive }) => {
      if (!mountedRef.current) return;
      setRoomUsers(prev => {
        // Ensure prev is an array
        const currentUsers = Array.isArray(prev) ? prev : [];
        return currentUsers.map(user => 
          user.id === userId ? { ...user, isActive } : user
        );
      });
    });

    // Send user join event
    newSocket.emit('user-join', {
      roomId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar
    });

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (newSocket) {
        console.log('🧹 Cleaning up socket');
        newSocket.disconnect();
      }
      socketRef.current = null;
    };
  }, [roomId, isAuthorized, isClient, isMounted, user?.emailAddresses, isLoaded]);

  // Save function
  const handleSave = async () => {
    if (!socket || !isConnected || !selectedFile || !hasUnsavedChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    console.log('💾 Saving file:', selectedFile);
    
    try {
      socket.emit('write-file', {
        roomId,
        filePath: selectedFile,
        content: code
      });
    } catch (error) {
      console.error('❌ Save error:', error);
      setIsSaving(false);
    }
  };

  // Collaboration helper functions
  const handleCursorPositionChange = (position, selection) => {
    if (socket && isConnected && selectedFile) {
      socket.emit('cursor-position', {
        roomId,
        userId: currentUser.id,
        filePath: selectedFile,
        position,
        selection
      });
    }
  };

  const handleCodeChange = (newCode, operation = 'replace') => {
    setCode(newCode || '');
    setHasUnsavedChanges(true);
    
    // Clear typing timeout and set new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing start indicator
    if (socket && isConnected && selectedFile) {
      socket.emit('typing-start', {
        roomId,
        userId: currentUser.id,
        userName: user?.firstName || user?.username || 'Anonymous',
        filePath: selectedFile
      });
      
      // Send code operation for real-time sync with debouncing
      socket.emit('code-operation', {
        roomId,
        userId: currentUser.id,
        userName: user?.firstName || user?.username || 'Anonymous',
        filePath: selectedFile,
        operation,
        position: editorRef.current?.getPosition(),
        content: newCode,
        timestamp: Date.now()
      });
      
      // Auto-save after a short delay (optional - can be removed if not wanted)
      // clearTimeout(autoSaveTimeoutRef.current);
      // autoSaveTimeoutRef.current = setTimeout(() => {
      //   if (hasUnsavedChanges) {
      //     handleSave();
      //   }
      // }, 2000); // Auto-save after 2 seconds of inactivity
      
      // Set timeout to send typing stop
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing-stop', {
          roomId,
          userId: currentUser.id,
          userName: user?.firstName || user?.username || 'Anonymous',
          filePath: selectedFile
        });
      }, 1000);
    }
  };

  const handleFileSelect = (filePath) => {
    console.log('📄 Requesting file:', filePath);
    
    // Validate file path and connection
    if (!filePath || !socket || !isConnected) {
      console.warn('⚠️ Cannot select file: missing path, socket, or connection');
      return;
    }
    
    setSelectedFile(filePath);
    setCurrentLanguage(getLanguageFromFileName(filePath));
    
    // Notify other users about file selection
    if (socket && isConnected) {
      socket.emit('file-selected', {
        roomId,
        userId: currentUser.id,
        filePath
      });
      
      // Request file content with error handling
      console.log('📄 Requesting file content for:', filePath);
      socket.emit('read-file', { roomId, filePath });
    }
  };

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, hasUnsavedChanges, isSaving, socket, isConnected, code, roomId]);

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
                    console.log('📁 Requesting folder:', item.path);
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
                console.log('📄 Requesting file:', item.path);
                handleFileSelect(item.path);
              }
            }}
          >
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              {item.name}
              {selectedFile === item.path && hasUnsavedChanges && (
                <span className="text-orange-400 ml-1">*</span>
              )}
            </span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      {/* Authentication Guard */}
      <SignedOut>
        <div className="h-screen flex flex-col items-center justify-center bg-[#0d1117] text-white">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold">Authentication Required</h1>
            <p className="text-gray-400">
              You need to sign in to access the collaborative editor.
            </p>
            <div className="space-y-3">
              <Link href="/sign-in">
                <Button className="w-full bg-[#2FA1FF] hover:bg-[#2FA1FF]/90 text-white">
                  Sign In to Continue
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {isCheckingAuth ? (
          <div className="h-screen flex items-center justify-center bg-[#0d1117] text-white">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-[#2FA1FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400">Checking room access...</p>
            </div>
          </div>
        ) : !isAuthorized ? (
          <div className="h-screen flex flex-col items-center justify-center bg-[#0d1117] text-white">
            <div className="text-center space-y-6 max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold">Access Denied</h1>
              <p className="text-gray-400">
                You don't have permission to access this room. Contact the room owner for an invite.
              </p>
              <div className="space-y-3">
                <Link href="/dashboard">
                  <Button className="w-full bg-[#2FA1FF] hover:bg-[#2FA1FF]/90 text-white">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
    <div className="h-screen flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="h-12 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">ColabDev</h1>
          {project && (
            <span className="text-sm text-gray-400">• {project.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Theme Toggle */}
          <div className="flex items-center gap-1 bg-[#21262d] rounded-lg p-1">
            {themes.map(theme => {
              const IconComponent = theme.icon;
              return (
                <button
                  key={theme.value}
                  onClick={() => setEditorTheme(theme.value)}
                  className={`p-1 rounded transition-colors ${
                    editorTheme === theme.value 
                      ? 'bg-[#00ff88] text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={theme.name}
                >
                  <IconComponent className="w-3 h-3" />
                </button>
              );
            })}
          </div>

          {/* Save Button */}
          {selectedFile && (
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title={`Save ${selectedFile} (Ctrl+S)`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}
            </button>
          )}
          
          {/* Terminal Toggle */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-2 rounded hover:bg-gray-700 ${showTerminal ? 'text-blue-400' : 'text-gray-400'}`}
            title="Toggle Terminal"
          >
            <TerminalIcon className="w-4 h-4" />
          </button>
          
          {/* User List */}
          <div className="relative">
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 text-gray-400"
              title="Online Users"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">{roomUsers.length + 1}</span>
            </button>
            
            {showUserList && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#161b22] border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="text-sm font-semibold text-white">Online Users ({roomUsers.length + 1})</h3>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {/* Current User */}
                  <div className="flex items-center gap-2 p-2 rounded bg-[#00ff88]/10 border border-[#00ff88]/30">
                    <div className="w-6 h-6 rounded-full bg-[#00ff88] flex items-center justify-center text-xs font-semibold text-black">
                      {currentUser.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#00ff88]">{currentUser.name} (You)</div>
                      <div className="text-xs text-gray-400">
                        {selectedFile ? `Editing: ${selectedFile.split('/').pop()}` : 'No file selected'}
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  
                  {/* Other Users */}
                  {roomUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-black"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{user.name}</div>
                        <div className="text-xs text-gray-400">
                          {typingUsers.has(user.id) ? 'Typing...' : 'Online'}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${user.isActive !== false ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    </div>
                  ))}
                  
                  {roomUsers.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      You're the only one here
                    </div>
                  )}
                </div>
                
                {/* Invite Button */}
                <div className="p-3 border-t border-gray-700">
                  <Button 
                    onClick={() => setShowInviteModal(true)}
                    className="w-full bg-[#2FA1FF] hover:bg-[#2FA1FF]/90 text-white text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Users
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <ConnectionStatus 
              socket={socket}
              isConnected={isConnected}
              connectionStatus={connectionStatus}
              terminalStatus={terminalStatus}
              isProjectLoaded={isProjectLoaded}
            />
          </div>
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
          {/* Editor Header */}
          <div className="h-10 bg-[#21262d] border-b border-gray-800 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Editor</span>
              {selectedFile && (
                <span className="text-xs text-gray-500">
                  • {currentLanguage} • {selectedFile.split('/').pop()}
                  {hasUnsavedChanges && <span className="text-orange-400 ml-1">●</span>}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 rounded hover:bg-gray-700 text-gray-400"
                title="Editor Settings"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Editor Settings Panel */}
          {showSettings && (
            <div className="h-40 bg-[#0d1117] border-b border-gray-800 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                {/* Theme Selection */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Theme</label>
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    className="w-full bg-[#1a1a2e] border border-gray-700 rounded text-xs text-white p-1"
                  >
                    {themes.map(theme => (
                      <option key={theme.value} value={theme.value}>{theme.name}</option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Font Size</label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{fontSize}px</span>
                </div>

                {/* Word Wrap */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Word Wrap</label>
                  <select
                    value={wordWrap}
                    onChange={(e) => setWordWrap(e.target.value)}
                    className="w-full bg-[#1a1a2e] border border-gray-700 rounded text-xs text-white p-1"
                  >
                    <option value="off">Off</option>
                    <option value="on">On</option>
                    <option value="bounded">Bounded</option>
                  </select>
                </div>

                {/* Minimap */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Minimap</label>
                  <button
                    onClick={() => setShowMinimap(!showMinimap)}
                    className={`w-full p-1 rounded text-xs ${
                      showMinimap 
                        ? 'bg-[#00ff88] text-black' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {showMinimap ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className={`${showTerminal ? 'flex-1' : 'h-full'}`}>
            {selectedFile ? (
              <MonacoEditor
                key={`${selectedFile}-${editorTheme}`}
                height="100%"
                language={currentLanguage}
                theme={editorTheme}
                value={code}
                onChange={(value) => {
                  handleCodeChange(value || '');
                }}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  
                  // Add custom keybindings using correct Monaco API
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
                  
                  // Track cursor position changes for collaboration
                  editor.onDidChangeCursorPosition((e) => {
                    const position = {
                      line: e.position.lineNumber,
                      column: e.position.column
                    };
                    const selection = editor.getSelection();
                    const selectionData = selection ? {
                      start: { line: selection.startLineNumber, column: selection.startColumn },
                      end: { line: selection.endLineNumber, column: selection.endColumn }
                    } : null;
                    
                    handleCursorPositionChange(position, selectionData);
                  });
                  
                  // Track selection changes
                  editor.onDidChangeCursorSelection((e) => {
                    const selection = e.selection;
                    const selectionData = {
                      start: { line: selection.startLineNumber, column: selection.startColumn },
                      end: { line: selection.endLineNumber, column: selection.endColumn }
                    };
                    const position = {
                      line: selection.endLineNumber,
                      column: selection.endColumn
                    };
                    
                    handleCursorPositionChange(position, selectionData);
                  });
                  
                  // Enhanced IntelliSense for JavaScript/TypeScript
                  if (['javascript', 'typescript'].includes(currentLanguage)) {
                    // Register additional completion providers
                    editor.onDidChangeModelContent(() => {
                      // Trigger suggestions automatically
                      editor.trigger('', 'editor.action.triggerSuggest', {});
                    });
                  }
                }}
                options={getEditorOptions()}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Welcome to ColabDev</p>
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

          {/* Terminal */}
          {showTerminal && (
            <div className="h-64 bg-[#0d1117] border-t border-gray-800">
              <div className="h-8 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <TerminalIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      terminalStatus === 'connected' ? 'bg-green-500' : 
                      terminalStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                      'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-500">
                      {terminalStatus === 'connected' ? 'Ready' : 
                       terminalStatus === 'connecting' ? 'Connecting...' : 
                       'Error'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="h-[calc(100%-2rem)]">
                {socket && isConnected ? (
                  <XTermWrapper 
                    socket={socket} 
                    roomId={roomId}
                    isConnected={isConnected}
                    isProjectLoaded={isProjectLoaded}
                    onTerminalReady={() => setTerminalStatus('connected')}
                    onTerminalError={() => setTerminalStatus('error')}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm">Connecting to terminal...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#161b22] border border-gray-700 rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Invite Users</h2>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              {/* Invite Mode Toggle */}
              <div className="flex bg-[#0d1117] rounded-lg p-1 mb-4">
                <button
                  onClick={() => setInviteMode('search')}
                  className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                    inviteMode === 'search' 
                      ? 'bg-[#2FA1FF] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-2" />
                  Search Users
                </button>
                <button
                  onClick={() => setInviteMode('code')}
                  className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                    inviteMode === 'code' 
                      ? 'bg-[#2FA1FF] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Copy className="w-4 h-4 inline mr-2" />
                  Session Code
                </button>
              </div>
              
              {inviteMode === 'search' ? (
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="pl-10 bg-[#0d1117] border-gray-600 text-white"
                    />
                  </div>
                  
                  {/* Search Results */}
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {isSearching ? (
                      <div className="text-center py-4">
                        <div className="w-5 h-5 border-2 border-[#2FA1FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-[#0d1117] rounded border border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2FA1FF] flex items-center justify-center text-white text-sm font-semibold">
                              {user.name?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">{user.name}</div>
                              <div className="text-gray-400 text-xs">{user.email}</div>
                            </div>
                          </div>
                          <Button
                            onClick={() => sendEmailInvite(user)}
                            disabled={sendingInvites.has(user.id)}
                            className="bg-[#00ff88] hover:bg-[#00ff88]/90 text-black text-xs px-3 py-1"
                          >
                            {sendingInvites.has(user.id) ? (
                              <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Mail className="w-3 h-3 mr-1" />
                                Invite
                              </>
                            )}
                          </Button>
                        </div>
                      ))
                    ) : searchQuery.length > 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        No users found
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        Start typing to search for users
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">
                    Share this session code with others to join:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={sessionCode}
                      readOnly
                      className="bg-[#0d1117] border-gray-600 text-white font-mono"
                    />
                    <Button
                      onClick={copySessionCode}
                      className="bg-[#00ff88] hover:bg-[#00ff88]/90 text-black px-3"
                    >
                      {copySuccess ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {copySuccess && (
                    <p className="text-[#00ff88] text-sm">Copied to clipboard!</p>
                  )}
                  <p className="text-gray-500 text-xs">
                    Users can paste this code in the "Join Room" section of their dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Panel - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel 
          socket={socket}
          connectionStatus={connectionStatus}
          isProjectLoaded={isProjectLoaded}
          files={files}
        />
      )}
    </div>
        )}
      </SignedIn>
    </>
  );
}
