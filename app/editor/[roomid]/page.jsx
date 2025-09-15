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
  const [editingUsers, setEditingUsers] = useState(new Map()); // filePath -> Set of userIds
  const [realtimeContent, setRealtimeContent] = useState(new Map()); // filePath -> content
  const [collaborativeUpdates, setCollaborativeUpdates] = useState(false);
  
  // Real user data from Clerk
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserList, setShowUserList] = useState(true);
  
  // Refs to prevent re-connections
  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastContentRef = useRef('');
  const syncTimeoutRef = useRef(null);

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
    
    // Set real user data from Clerk
    setCurrentUser({
      id: user.id,
      name: user.fullName || user.firstName || user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Anonymous',
      email: user.emailAddresses?.[0]?.emailAddress || '',
      avatar: user.imageUrl || null,
      color: `hsl(${Math.abs(user.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`
    });
    
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
    if (!roomId || socketRef.current || !isAuthorized || !isClient || !isMounted || !isLoaded || !currentUser) return;

    console.log('🚀 Initializing Socket.IO connection for room:', roomId);
    console.log('🔍 User:', currentUser.name, '(' + currentUser.email + ')');
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
      console.log('🔗 Backend URL:', BACKEND_URL);
      console.log('👤 Current User:', currentUser?.name, currentUser?.id);
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

    // Enhanced collaboration events with better user persistence
    newSocket.on('room-users', (users) => {
      if (!mountedRef.current) return;
      console.log('👥 Room users updated:', users);
      
      // Handle both array and object cases from backend
      let userArray = [];
      if (Array.isArray(users)) {
        userArray = users;
      } else if (users && typeof users === 'object') {
        // If backend sends an object with users property
        userArray = users.users || users.participants || [users];
      } else {
        console.warn('⚠️ Unexpected users format:', users);
        userArray = [];
      }
      
      // Enhanced user processing with better validation
      const filteredUsers = userArray
        .filter(user => {
          // More robust user validation
          if (!user || typeof user !== 'object') {
            console.warn('⚠️ Invalid user object:', user);
            return false;
          }
          
          if (!user.id) {
            console.warn('⚠️ User missing ID:', user);
            return false;
          }
          
          // Only filter out current user if we have current user data
          if (currentUser && user.id === currentUser.id) {
            console.log('👤 Filtering out current user:', user.id);
            return false;
          }
          
          return true;
        })
        .map(user => ({
          id: user.id,
          name: user.userName || user.name || user.displayName || 'Unknown User',
          email: user.userEmail || user.email || '',
          avatar: user.userAvatar || user.avatar || user.profileImageUrl,
          color: user.userColor || user.color || `hsl(${Math.abs(user.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`,
          isActive: user.isActive !== false,
          lastSeen: user.lastSeen || Date.now()
        }));
      
      setRoomUsers(filteredUsers);
      console.log('👥 Processed room users:', filteredUsers);
      console.log('👤 Current user for comparison:', currentUser ? currentUser.id : 'No current user');
    });

    newSocket.on('user-joined', (userData) => {
      if (!mountedRef.current || !currentUser) return;
      console.log('👋 User joined:', userData);
      
      if (userData && userData.id && userData.id !== currentUser.id) {
        const newUser = {
          id: userData.id,
          name: userData.userName || userData.name || 'Unknown User',
          email: userData.userEmail || userData.email || '',
          avatar: userData.userAvatar || userData.avatar,
          color: userData.userColor || userData.color || `hsl(${Math.abs(userData.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`,
          isActive: true,
          lastSeen: Date.now()
        };
        
        setRoomUsers(prev => {
          // Ensure prev is an array and filter out any existing instance of this user
          const currentUsers = Array.isArray(prev) ? prev : [];
          const filteredUsers = currentUsers.filter(user => user.id !== userData.id);
          return [...filteredUsers, newUser];
        });
        
        console.log('👋 Added user to room:', newUser);
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

    // Send periodic heartbeat to maintain presence
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected && currentUser) {
        newSocket.emit('user-heartbeat', {
          roomId,
          userId: currentUser.id,
          timestamp: Date.now()
        });
      }
    }, 10000); // Send heartbeat every 10 seconds

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

    // ================== ENHANCED COLLABORATIVE FEATURES ==================
    
    // Real-time content synchronization - INSTANT updates
    newSocket.on('realtime-content-sync', ({ userId, userName, filePath, content, selection, cursor, timestamp }) => {
      if (!mountedRef.current || userId === currentUser.id) {
        console.log(`⏭️ Skipping real-time sync from self: ${userId === currentUser.id ? 'same user' : 'not mounted'}`);
        return;
      }
      
      console.log(`🔄 INSTANT real-time content from ${userName} in ${filePath} (${content?.length} chars)`);
      console.log(`📍 Current selected file: "${selectedFile}"`);
      console.log(`📍 Incoming file path: "${filePath}"`);
      console.log(`📍 Files match: ${filePath === selectedFile}`);
      
      // Always store content for when user switches to this file
      setRealtimeContent(prev => {
        const newContent = new Map(prev);
        newContent.set(filePath, content);
        console.log(`💾 Stored real-time content for ${filePath}`);
        return newContent;
      });
      
      // Apply to editor if it's the currently selected file
      if (filePath === selectedFile) {
        console.log(`📝 APPLYING real-time content update to active editor for ${filePath}`);
        
        // Force apply real-time content regardless of collaborative updates flag
        // This ensures real-time sync always works
        setCode(content);
        lastContentRef.current = content;
        
        // Set collaborative updates flag to prevent echo
        setCollaborativeUpdates(true);
        setTimeout(() => {
          setCollaborativeUpdates(false);
          console.log(`✨ Real-time sync complete for ${filePath}`);
        }, 100); // Slightly longer timeout to ensure no conflicts
      } else {
        console.log(`📋 Stored content for ${filePath} (currently selected: ${selectedFile})`);
      }
    });

    // Enhanced typing indicators with line information
    newSocket.on('user-enhanced-typing', ({ userId, userName, filePath, lineNumber, position, type, timestamp }) => {
      if (!mountedRef.current || userId === currentUser.id) return;
      
      console.log(`⌨️ ${userName} ${type} at line ${lineNumber} in ${filePath}`);
      
      if (filePath === selectedFile) {
        setTypingUsers(prev => {
          const newTyping = new Set(prev);
          if (type === 'typing-start') {
            newTyping.add(`${userId}-${lineNumber}`);
          } else {
            // Remove all typing indicators for this user
            Array.from(newTyping).forEach(item => {
              if (item.startsWith(`${userId}-`)) {
                newTyping.delete(item);
              }
            });
          }
          return newTyping;
        });
        
        // Update editing users for the file
        setEditingUsers(prev => {
          const newEditing = new Map(prev);
          if (!newEditing.has(filePath)) {
            newEditing.set(filePath, new Set());
          }
          
          if (type === 'typing-start') {
            newEditing.get(filePath).add(userId);
          } else {
            newEditing.get(filePath).delete(userId);
          }
          
          return newEditing;
        });
      }
    });

    // Enhanced cursor tracking
    newSocket.on('cursor-update', ({ userId, userName, filePath, position, selection, color }) => {
      if (!mountedRef.current || userId === currentUser.id) return;
      
      if (filePath === selectedFile) {
        setUserCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.set(userId, {
            userId,
            userName,
            position,
            selection,
            color: color || `hsl(${Math.abs(userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`,
            timestamp: Date.now()
          });
          return newCursors;
        });
      }
    });

    // Code operation handling (for conflict resolution)
    newSocket.on('code-operation', ({ userId, userName, filePath, operation, position, content, range, operationId }) => {
      if (!mountedRef.current || userId === currentUser.id) return;
      
      console.log(`⚡ Code operation from ${userName}: ${operation} in ${filePath}`);
      
      // Only apply if it's the currently selected file and not our own operation
      if (filePath === selectedFile && !collaborativeUpdates) {
        setCollaborativeUpdates(true);
        
        // Apply the operation content
        if (content && content !== lastContentRef.current) {
          setCode(content);
          lastContentRef.current = content;
        }
        
        // Reset collaborative updates flag
        setTimeout(() => {
          setCollaborativeUpdates(false);
        }, 100);
      }
    });

    // File operation results with enhanced feedback
    newSocket.on('file-created', ({ filePath, success, error }) => {
      if (!mountedRef.current) return;
      
      if (success) {
        console.log(`✅ File created successfully: ${filePath}`);
        // Refresh file tree
        if (socket && isConnected) {
          socket.emit('refresh-files', { roomId });
        }
        // You could show a success toast here
      } else {
        console.error(`❌ Failed to create file: ${filePath}`, error);
        alert(`Failed to create file "${filePath}": ${error || 'Unknown error'}`);
      }
    });

    newSocket.on('folder-created', ({ folderPath, success, error }) => {
      if (!mountedRef.current) return;
      
      if (success) {
        console.log(`✅ Folder created successfully: ${folderPath}`);
        // Refresh file tree
        if (socket && isConnected) {
          socket.emit('refresh-files', { roomId });
        }
        // You could show a success toast here
      } else {
        console.error(`❌ Failed to create folder: ${folderPath}`, error);
        alert(`Failed to create folder "${folderPath}": ${error || 'Unknown error'}`);
      }
    });

    newSocket.on('file-deleted', ({ filePath, success, error }) => {
      if (!mountedRef.current) return;
      
      if (success) {
        console.log(`✅ File deleted successfully: ${filePath}`);
        
        // If the deleted file was selected, clear the editor
        if (filePath === selectedFile) {
          setSelectedFile(null);
          setCode('// Select a file to start editing...');
          setHasUnsavedChanges(false);
        }
        
        // Refresh file tree
        if (socket && isConnected) {
          socket.emit('refresh-files', { roomId });
        }
      } else {
        console.error(`❌ Failed to delete file: ${filePath}`, error);
        alert(`Failed to delete file "${filePath}": ${error || 'Unknown error'}`);
      }
    });

    newSocket.on('folder-deleted', ({ folderPath, success, error }) => {
      if (!mountedRef.current) return;
      
      if (success) {
        console.log(`✅ Folder deleted successfully: ${folderPath}`);
        // Refresh file tree
        if (socket && isConnected) {
          socket.emit('refresh-files', { roomId });
        }
      } else {
        console.error(`❌ Failed to delete folder: ${folderPath}`, error);
        alert(`Failed to delete folder "${folderPath}": ${error || 'Unknown error'}`);
      }
    });

    newSocket.on('file-operation-error', ({ error, operation, filePath }) => {
      if (!mountedRef.current) return;
      console.error(`❌ File operation error (${operation}):`, error, filePath);
      alert(`File operation failed (${operation}): ${error}`);
    });

    // ================== END ENHANCED FEATURES ==================

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

    // Send user join event with real Clerk data
    newSocket.emit('user-join', {
      roomId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userAvatar: currentUser.avatar,
      userColor: currentUser.color
    });

    // Cleanup
    return () => {
      mountedRef.current = false;
      
      // Clear heartbeat interval
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
      if (newSocket) {
        console.log('🧹 Cleaning up socket');
        // Send user leave event before disconnecting
        if (currentUser) {
          newSocket.emit('user-leave', {
            roomId,
            userId: currentUser.id
          });
        }
        newSocket.disconnect();
      }
      socketRef.current = null;
    };
  }, [roomId, isAuthorized, isClient, isMounted, isLoaded, currentUser]);

  // Debug selectedFile changes
  useEffect(() => {
    console.log(`🎯 Selected file changed to: "${selectedFile}"`);
  }, [selectedFile]);

  // Enhanced file selection handler with real-time content
  const handleFileSelect = (filePath) => {
    console.log(`🎯 HANDLE FILE SELECT: "${selectedFile}" → "${filePath}"`);
    
    if (!socket || !isConnected || !isProjectLoaded) {
      console.warn('⚠️ Cannot select file: not ready', { socket: !!socket, isConnected, isProjectLoaded });
      return;
    }

    // Validate file path and current user
    if (!filePath || !currentUser) {
      console.warn('⚠️ Cannot select file: missing path or user data');
      return;
    }

    console.log('📄 Requesting file content for:', filePath);
    setSelectedFile(filePath);
    console.log(`🔄 setSelectedFile called with: "${filePath}"`);
    setCurrentLanguage(getLanguageFromFileName(filePath));
    
    // Check if we have real-time content for this file
    if (realtimeContent.has(filePath)) {
      const content = realtimeContent.get(filePath);
      console.log(`📄 Loading real-time content for: ${filePath} (${content?.length} chars)`);
      setCode(content);
      lastContentRef.current = content;
      setHasUnsavedChanges(false); // Real-time content is considered saved
    } else {
      console.log(`📄 No real-time content found for: ${filePath}, requesting from server...`);
    }
    
    // Notify other users about file selection
    if (socket && isConnected && currentUser) {
      socket.emit('file-selected', {
        roomId,
        userId: currentUser.id,
        filePath
      });
    }
    
    // Request file content with error handling
    socket.emit('read-file', { roomId, filePath });
    console.log(`📡 Sent read-file request for: ${filePath}`);
  };
  };

  // Enhanced save function
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

  // ================== FILE OPERATION FUNCTIONS ==================
  
  const createFile = (folderPath = '') => {
    const fileName = prompt('Enter file name:');
    if (!fileName || !fileName.trim()) {
      console.log('❌ File creation cancelled - no name provided');
      return;
    }
    
    const cleanFileName = fileName.trim();
    const filePath = folderPath ? `${folderPath}/${cleanFileName}` : cleanFileName;
    
    console.log('📄 Creating file:', filePath);
    
    if (socket && isConnected && currentUser) {
      socket.emit('create-file', {
        roomId,
        filePath,
        initialContent: `// ${cleanFileName}\n// Created by ${currentUser.name}\n// ${new Date().toISOString()}\n\n`
      });
      console.log('📡 Sent create-file request for:', filePath);
    } else {
      console.error('❌ Cannot create file - missing requirements:', {
        socket: !!socket,
        isConnected,
        currentUser: !!currentUser
      });
      alert('Cannot create file. Please check your connection and try again.');
    }
  };

  const createFolder = (parentPath = '') => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) {
      console.log('❌ Folder creation cancelled - no name provided');
      return;
    }
    
    const cleanFolderName = folderName.trim();
    const folderPath = parentPath ? `${parentPath}/${cleanFolderName}` : cleanFolderName;
    
    console.log('📁 Creating folder:', folderPath);
    
    if (socket && isConnected && currentUser) {
      socket.emit('create-folder', {
        roomId,
        folderPath
      });
      console.log('📡 Sent create-folder request for:', folderPath);
    } else {
      console.error('❌ Cannot create folder - missing requirements:', {
        socket: !!socket,
        isConnected,
        currentUser: !!currentUser
      });
      alert('Cannot create folder. Please check your connection and try again.');
    }
  };

  const deleteFile = (filePath) => {
    const confirmed = confirm(`Are you sure you want to delete "${filePath}"?`);
    if (!confirmed) return;
    
    console.log('🗑️ Deleting file:', filePath);
    
    if (socket && isConnected && currentUser) {
      socket.emit('delete-file', {
        roomId,
        filePath
      });
      console.log('📡 Sent delete-file request for:', filePath);
    } else {
      console.error('❌ Cannot delete file - missing requirements:', {
        socket: !!socket,
        isConnected,
        currentUser: !!currentUser
      });
      alert('Cannot delete file. Please check your connection and try again.');
    }
  };

  const deleteFolder = (folderPath) => {
    const confirmed = confirm(`Are you sure you want to delete folder "${folderPath}" and all its contents?`);
    if (!confirmed) return;
    
    console.log('🗑️ Deleting folder:', folderPath);
    
    if (socket && isConnected && currentUser) {
      socket.emit('delete-folder', {
        roomId,
        folderPath
      });
      console.log('📡 Sent delete-folder request for:', folderPath);
    } else {
      console.error('❌ Cannot delete folder - missing requirements:', {
        socket: !!socket,
        isConnected,
        currentUser: !!currentUser
      });
      alert('Cannot delete folder. Please check your connection and try again.');
    }
  };

  // ================== FILE ICONS ==================
  
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'js':
      case 'jsx':
        return '📄'; // JavaScript
      case 'ts':
      case 'tsx':
        return '🔷'; // TypeScript
      case 'html':
        return '🌐'; // HTML
      case 'css':
        return '🎨'; // CSS
      case 'scss':
      case 'sass':
        return '💄'; // SCSS/SASS
      case 'json':
        return '📋'; // JSON
      case 'md':
        return '📝'; // Markdown
      case 'py':
        return '🐍'; // Python
      case 'java':
        return '☕'; // Java
      case 'cpp':
      case 'c':
        return '⚡'; // C/C++
      case 'php':
        return '🐘'; // PHP
      case 'rb':
        return '💎'; // Ruby
      case 'go':
        return '🐹'; // Go
      case 'rs':
        return '🦀'; // Rust
      case 'sql':
        return '🗃️'; // SQL
      case 'xml':
        return '📰'; // XML
      case 'yml':
      case 'yaml':
        return '⚙️'; // YAML
      case 'docker':
      case 'dockerfile':
        return '🐳'; // Docker
      case 'git':
      case 'gitignore':
        return '🌳'; // Git
      case 'txt':
        return '📄'; // Text
      case 'log':
        return '📊'; // Log
      case 'env':
        return '🔐'; // Environment
      case 'config':
        return '⚙️'; // Config
      default:
        return '📄'; // Default file
    }
  };

  const getFolderIcon = (isExpanded) => {
    return isExpanded ? '📂' : '📁';
  };

  // ================== END FILE OPERATIONS ==================

  // Collaboration helper functions
  const handleCursorPositionChange = (position, selection) => {
    if (socket && isConnected && selectedFile && currentUser) {
      socket.emit('cursor-position', {
        roomId,
        userId: currentUser.id,
        filePath: selectedFile,
        position,
        selection
      });
    }
  };

  // Enhanced real-time collaborative code change handler
  const handleCodeChange = (newCode, operation = 'replace') => {
    // Skip if this is a collaborative update to prevent infinite loops
    if (collaborativeUpdates) {
      console.log('⏭️ Skipping collaborative update to prevent loop');
      return;
    }
    
    console.log(`✏️ Local code change detected (${newCode?.length || 0} chars), sending real-time sync...`);
    
    setCode(newCode || '');
    setHasUnsavedChanges(true);
    lastContentRef.current = newCode || '';
    
    // Clear previous timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    if (socket && isConnected && selectedFile && currentUser) {
      // Get current cursor position and selection
      const editor = editorRef.current;
      const position = editor?.getPosition();
      const selection = editor?.getSelection();
      
      // Send enhanced typing start indicator with line information
      socket.emit('enhanced-typing-start', {
        roomId,
        userId: currentUser.id,
        userName: currentUser.name,
        filePath: selectedFile,
        lineNumber: position?.lineNumber || 1,
        position
      });

      // IMMEDIATE real-time content synchronization (without saving)
      console.log(`📡 Emitting INSTANT real-time sync for: ${selectedFile}`);
      socket.emit('realtime-content-sync', {
        roomId,
        userId: currentUser.id,
        userName: currentUser.name,
        filePath: selectedFile,
        content: newCode,
        selection: selection ? {
          start: { line: selection.startLineNumber, column: selection.startColumn },
          end: { line: selection.endLineNumber, column: selection.endColumn }
        } : null,
        cursor: position,
        timestamp: Date.now()
      });
      
      // Enhanced code operation with range information (backup sync method)
      socket.emit('code-operation', {
        roomId,
        userId: currentUser.id,
        userName: currentUser.name,
        filePath: selectedFile,
        operation,
        position,
        content: newCode,
        range: selection ? {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn
        } : null,
        timestamp: Date.now()
      });
      
      // Set timeout to send enhanced typing stop
      typingTimeoutRef.current = setTimeout(() => {
        if (socket && currentUser) {
          console.log('⏹️ Sending typing stop for:', selectedFile);
          socket.emit('enhanced-typing-stop', {
            roomId,
            userId: currentUser.id,
            userName: currentUser.name,
            filePath: selectedFile
          });
        }
      }, 1000);
    } else {
      console.warn('⚠️ Cannot sync - missing requirements:', {
        socket: !!socket,
        isConnected,
        selectedFile,
        currentUser: !!currentUser
      });
    }
  };  // Keyboard shortcut for save (Ctrl+S)
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

  // Enhanced file tree rendering with icons and context menus
  const renderFileTree = (items, level = 0) => {
    if (!items || items.length === 0) {
      return (
        <div className="p-4 text-gray-400 text-sm space-y-2">
          {isConnected ? (
            <div>
              <p>No files in project</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => createFile()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                  title="Create New File"
                >
                  📄 New File
                </button>
                <button
                  onClick={() => createFolder()}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                  title="Create New Folder"
                >
                  📁 New Folder
                </button>
              </div>
            </div>
          ) : (
            'Connecting...'
          )}
        </div>
      );
    }

    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
        {item.type === 'folder' ? (
          <div>
            <div
              className="group flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm relative"
              onContextMenu={(e) => {
                e.preventDefault();
                // Context menu for folders
                const menu = document.createElement('div');
                menu.className = 'fixed bg-[#161b22] border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-32';
                menu.style.left = `${e.clientX}px`;
                menu.style.top = `${e.clientY}px`;
                
                menu.innerHTML = `
                  <button class="w-full text-left px-3 py-1 hover:bg-gray-700 text-white text-xs" data-action="new-file">📄 New File</button>
                  <button class="w-full text-left px-3 py-1 hover:bg-gray-700 text-white text-xs" data-action="new-folder">📁 New Folder</button>
                  <hr class="border-gray-700 my-1">
                  <button class="w-full text-left px-3 py-1 hover:bg-gray-700 text-red-400 text-xs" data-action="delete">🗑️ Delete Folder</button>
                `;
                
                document.body.appendChild(menu);
                
                const handleMenuClick = (e) => {
                  const action = e.target.dataset.action;
                  if (action === 'new-file') createFile(item.path);
                  else if (action === 'new-folder') createFolder(item.path);
                  else if (action === 'delete') deleteFolder(item.path);
                  
                  document.body.removeChild(menu);
                  document.removeEventListener('click', handleMenuClick);
                };
                
                document.addEventListener('click', handleMenuClick);
                
                // Remove menu when clicking outside
                setTimeout(() => {
                  const handleClickOutside = () => {
                    if (document.body.contains(menu)) {
                      document.body.removeChild(menu);
                    }
                    document.removeEventListener('click', handleClickOutside);
                  };
                  document.addEventListener('click', handleClickOutside);
                }, 100);
              }}
              onClick={() => {
                const newExpanded = new Set(expandedFolders);
                if (newExpanded.has(item.path)) {
                  newExpanded.delete(item.path);
                } else {
                  newExpanded.add(item.path);
                  // Load folder contents if not already loaded and room is ready
                  if (socket && isConnected && isProjectLoaded && (!item.children || item.children.length === 0)) {
                    console.log('📁 Requesting folder:', item.path);
                    socket.emit('read-folder', { roomId, folderPath: item.path });
                  }
                }
                setExpandedFolders(newExpanded);
              }}
            >
              <span className="text-lg">{getFolderIcon(expandedFolders.has(item.path))}</span>
              <span className="text-gray-300 flex-1">{item.name}</span>
              
              {/* Editing indicator for folders */}
              {editingUsers.has(item.path) && editingUsers.get(item.path).size > 0 && (
                <div className="flex -space-x-1">
                  {Array.from(editingUsers.get(item.path)).slice(0, 3).map((userId) => {
                    const user = roomUsers.find(u => u.id === userId);
                    return (
                      <div
                        key={userId}
                        className="w-2 h-2 rounded-full border border-gray-800"
                        style={{ backgroundColor: user?.color || '#6b7280' }}
                        title={`${user?.name || userId} is editing`}
                      />
                    );
                  })}
                </div>
              )}
              
              {/* Quick action buttons on hover */}
              <div className="hidden group-hover:flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createFile(item.path);
                  }}
                  className="text-gray-500 hover:text-white p-1"
                  title="New File"
                >
                  <span className="text-xs">📄</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createFolder(item.path);
                  }}
                  className="text-gray-500 hover:text-white p-1"
                  title="New Folder"
                >
                  <span className="text-xs">📁</span>
                </button>
              </div>
            </div>
            {expandedFolders.has(item.path) && item.children && (
              <div>
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </div>
        ) : (
          <div
            className="group flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm relative"
            onContextMenu={(e) => {
              e.preventDefault();
              // Context menu for files
              const menu = document.createElement('div');
              menu.className = 'fixed bg-[#161b22] border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-32';
              menu.style.left = `${e.clientX}px`;
              menu.style.top = `${e.clientY}px`;
              
              menu.innerHTML = `
                <button class="w-full text-left px-3 py-1 hover:bg-gray-700 text-white text-xs" data-action="open">📂 Open</button>
                <hr class="border-gray-700 my-1">
                <button class="w-full text-left px-3 py-1 hover:bg-gray-700 text-red-400 text-xs" data-action="delete">🗑️ Delete File</button>
              `;
              
              document.body.appendChild(menu);
              
              const handleMenuClick = (e) => {
                const action = e.target.dataset.action;
                if (action === 'open') handleFileSelect(item.path);
                else if (action === 'delete') deleteFile(item.path);
                
                document.body.removeChild(menu);
                document.removeEventListener('click', handleMenuClick);
              };
              
              document.addEventListener('click', handleMenuClick);
              
              // Remove menu when clicking outside
              setTimeout(() => {
                const handleClickOutside = () => {
                  if (document.body.contains(menu)) {
                    document.body.removeChild(menu);
                  }
                  document.removeEventListener('click', handleClickOutside);
                };
                document.addEventListener('click', handleClickOutside);
              }, 100);
            }}
            onClick={() => handleFileSelect(item.path)}
          >
            <span className="text-sm">{getFileIcon(item.name)}</span>
            <span className={`text-sm flex-1 ${selectedFile === item.path ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
              {item.name}
            </span>
            
            {/* Unsaved changes indicator */}
            {selectedFile === item.path && hasUnsavedChanges && (
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Unsaved changes" />
            )}
            
            {/* Editing indicator */}
            {editingUsers.has(item.path) && editingUsers.get(item.path).size > 0 && (
              <div className="flex -space-x-1">
                {Array.from(editingUsers.get(item.path)).slice(0, 3).map((userId) => {
                  const user = roomUsers.find(u => u.id === userId);
                  return (
                    <div
                      key={userId}
                      className="w-2 h-2 rounded-full border border-gray-800"
                      style={{ backgroundColor: user?.color || '#6b7280' }}
                      title={`${user?.name || userId} is editing`}
                    />
                  );
                })}
                {editingUsers.get(item.path).size > 3 && (
                  <div className="text-xs text-gray-400">+{editingUsers.get(item.path).size - 3}</div>
                )}
              </div>
            )}
            
            {/* Typing indicator */}
            {Array.from(typingUsers).some(typing => typing.startsWith(`${roomUsers.find(u => editingUsers.get(item.path)?.has(u.id))?.id}-`) && selectedFile === item.path) && (
              <div className="flex items-center">
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    ));
  };

  // Early return for hydration safety
  if (!isClient || !isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d1117] text-white">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#2FA1FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Initializing editor...</p>
        </div>
      </div>
    );
  }

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
          
          {/* Real-time Collaboration Status */}
          {selectedFile && (
            <div className="flex items-center gap-2">
              <div className="w-px h-4 bg-gray-700"></div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-400">{selectedFile.split('/').pop()}</span>
                
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-1 ml-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} title={`Socket: ${isConnected ? 'Connected' : 'Disconnected'}`}></div>
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                
                {/* Show who's editing this file */}
                {editingUsers.has(selectedFile) && editingUsers.get(selectedFile).size > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    <div className="flex -space-x-1">
                      {Array.from(editingUsers.get(selectedFile)).slice(0, 3).map((userId) => {
                        const user = roomUsers.find(u => u.id === userId);
                        return (
                          <div
                            key={userId}
                            className="w-4 h-4 rounded-full border border-gray-800 flex items-center justify-center text-xs font-semibold"
                            style={{ backgroundColor: user?.color || '#6b7280', color: '#000' }}
                            title={`${user?.name || userId} is editing`}
                          >
                            {(user?.name || userId).slice(0, 1).toUpperCase()}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Typing indicator */}
                    {Array.from(typingUsers).some(typing => 
                      editingUsers.get(selectedFile).has(typing.split('-')[0])
                    ) && (
                      <div className="flex items-center gap-1 text-green-400">
                        <div className="flex space-x-0.5">
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs">typing...</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Real-time sync indicator */}
                {collaborativeUpdates && (
                  <div className="flex items-center gap-1 text-blue-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs">syncing</span>
                  </div>
                )}
              </div>
            </div>
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
                      {currentUser?.name?.slice(0, 2).toUpperCase() || 'ME'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#00ff88]">{currentUser?.name || 'You'} (You)</div>
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
                          {user.email ? user.email.slice(0, 20) + (user.email.length > 20 ? '...' : '') : 'Online'}
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
