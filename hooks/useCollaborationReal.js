"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';

const SOCKET_URL = 'https://collaborative-code-editor-backend.onrender.com';

// Generate user data from Clerk authentication
const generateUserFromClerk = (clerkUser) => {
  // Default colors for users
  const colors = ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];
  
  if (clerkUser && clerkUser.id) {
    // Use Clerk user data
    const userHash = clerkUser.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colorIndex = Math.abs(userHash) % colors.length;
    
    return {
      id: clerkUser.id,
      name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Anonymous User',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      color: colors[colorIndex],
      avatarUrl: clerkUser.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(clerkUser.fullName || 'User')}&background=random`
    };
  }
  
  // Fallback to guest user if not authenticated
  return {
    id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Guest User',
    email: '',
    color: colors[Math.floor(Math.random() * colors.length)],
    avatarUrl: 'https://ui-avatars.com/api/?name=Guest&background=random'
  };
};

const useCollaboration = (roomId) => {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [myUser, setMyUser] = useState(null);
  const [documentState, setDocumentState] = useState('');
  const [fileEditors, setFileEditors] = useState({}); // Track who's editing which files
  const [liveCursors, setLiveCursors] = useState({}); // Track cursor positions
  const [editPermissions, setEditPermissions] = useState({}); // Track edit permissions per file
  
  const socket = useRef(null);
  const lastSentContent = useRef('');
  const currentFile = useRef(null);

  // Initialize user and socket connection
  useEffect(() => {
    if (!roomId || !userLoaded) return;

    // Generate user identity from Clerk
    const user = generateUserFromClerk(clerkUser);
    setMyUser(user);
    console.log('🆔 Generated user from Clerk:', user);

    // Initialize socket connection
    socket.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const handleConnect = () => {
      console.log('✅ Connected to collaboration server');
      setIsConnected(true);
      setConnectionError(null);
      
      // Join room with user info
      socket.current.emit('join-room', {
        roomId,
        user: user
      });
    };

    const handleDisconnect = () => {
      console.log('❌ Disconnected from collaboration server');
      setIsConnected(false);
      setConnectionError('Connection lost');
    };

    const handleReconnect = () => {
      console.log('🔄 Reconnected to collaboration server');
      setIsConnected(true);
      setConnectionError(null);
      
      // Rejoin room
      socket.current.emit('join-room', {
        roomId,
        user: user
      });
    };

    // Real-time collaboration events
    const handleRoomUsers = (users) => {
      console.log('👥 Room users updated:', users);
      setCollaborators(users.filter(u => u.id !== user.id));
    };

    const handleCodeUpdate = (data) => {
      console.log('📝 Received code update:', data);
      console.log('📂 Current file:', currentFile.current, 'Update file:', data.fileName);
      if (data.userId !== user.id && data.fileName === currentFile.current) {
        setDocumentState(data.content);
        lastSentContent.current = data.content;
        console.log('✅ Applied code update from user:', data.user?.name || data.userId);
      } else if (data.userId !== user.id) {
        console.log('⏭️ Skipped update - different file or same user');
      }
    };

    const handleCursorUpdate = (data) => {
      console.log('👆 Cursor update:', data);
      if (data.userId !== user.id) {
        setLiveCursors(prev => ({
          ...prev,
          [data.userId]: {
            position: data.position,
            line: data.line,
            column: data.column,
            user: data.user,
            fileName: data.fileName
          }
        }));
      }
    };

    const handleFileEditors = (data) => {
      console.log('📁 File editors updated:', data);
      setFileEditors(data.fileEditors);
      setEditPermissions(data.editPermissions);
    };

    const handleAutoSave = (data) => {
      console.log('💾 Auto-save completed:', data);
    };

    // Socket event listeners
    socket.current.on('connect', handleConnect);
    socket.current.on('disconnect', handleDisconnect);
    socket.current.on('reconnect', handleReconnect);
    socket.current.on('room-users', handleRoomUsers);
    socket.current.on('code-update', handleCodeUpdate);
    socket.current.on('cursor-update', handleCursorUpdate);
    socket.current.on('file-editors', handleFileEditors);
    socket.current.on('auto-save', handleAutoSave);
    socket.current.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setConnectionError(error.message);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [roomId, userLoaded, clerkUser]);

  // Send code updates with instant sync (character-by-character)
  const sendCodeUpdate = useCallback((content, fileName) => {
    if (!socket.current || !isConnected || !myUser) return;
    
    // Send every change immediately for instant sync
    if (content !== lastSentContent.current) {
      currentFile.current = fileName;
      lastSentContent.current = content;

      const update = {
        roomId,
        fileName,
        content,
        userId: myUser.id,
        user: myUser,
        timestamp: Date.now()
      };

      console.log('📤 Sending instant code update:', update);
      socket.current.emit('code-change', update);
      
      // Auto-save after 500ms of no changes
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        socket.current.emit('auto-save', {
          roomId,
          fileName,
          content,
          userId: myUser.id
        });
      }, 500);
    }
  }, [roomId, isConnected, myUser]);

  // Send cursor position updates
  const sendCursorUpdate = useCallback((position, line, column, fileName) => {
    if (!socket.current || !isConnected || !myUser) return;

    const cursorData = {
      roomId,
      fileName,
      position,
      line,
      column,
      userId: myUser.id,
      user: myUser,
      timestamp: Date.now()
    };

    socket.current.emit('cursor-change', cursorData);
  }, [roomId, isConnected, myUser]);

  // Request edit permission for a file
  const requestEditPermission = useCallback((fileName) => {
    if (!socket.current || !isConnected || !myUser) return;

    socket.current.emit('request-edit-permission', {
      roomId,
      fileName,
      userId: myUser.id,
      user: myUser
    });
  }, [roomId, isConnected, myUser]);

  // Release edit permission for a file
  const releaseEditPermission = useCallback((fileName) => {
    if (!socket.current || !isConnected || !myUser) return;

    socket.current.emit('release-edit-permission', {
      roomId,
      fileName,
      userId: myUser.id
    });
  }, [roomId, isConnected, myUser]);

  // Check if user can edit a specific file
  const canEdit = useCallback((fileName) => {
    if (!fileName || !myUser) return false;
    const editors = fileEditors[fileName] || [];
    return editors.length < 5 && (editors.includes(myUser.id) || editors.length < 5);
  }, [fileEditors, myUser]);

  // Get file border colors based on editors
  const getFileBorderStyle = useCallback((fileName) => {
    if (!fileName || !fileEditors[fileName]) return {};
    
    const editors = fileEditors[fileName];
    if (editors.length === 0) return {};
    
    const editorUsers = collaborators.concat(myUser).filter(user => 
      user && editors.includes(user.id)
    );
    
    if (editorUsers.length === 1) {
      return {
        borderLeft: `4px solid ${editorUsers[0].color}`,
        borderRight: `4px solid ${editorUsers[0].color}`
      };
    } else if (editorUsers.length > 1) {
      const percentage = Math.floor(100 / editorUsers.length);
      const gradient = editorUsers.map((user, index) => 
        `${user.color} ${index * percentage}% ${(index + 1) * percentage}%`
      ).join(', ');
      
      return {
        background: `linear-gradient(to right, ${gradient})`,
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent'
      };
    }
    
    return {};
  }, [fileEditors, collaborators, myUser]);

  // Set current file for proper synchronization
  const setCurrentFile = useCallback((fileName) => {
    currentFile.current = fileName;
    console.log('📂 Set current file to:', fileName);
  }, []);

  return {
    isConnected,
    connectionError,
    collaborators,
    myId: myUser?.id,
    myUser,
    documentState,
    fileEditors,
    liveCursors,
    editPermissions,
    sendCodeUpdate,
    sendCursorUpdate,
    requestEditPermission,
    releaseEditPermission,
    canEdit,
    getFileBorderStyle,
    setCurrentFile,
    // Helper functions
    getLineNumber: (position) => {
      if (!documentState) return 1;
      return documentState.substring(0, position).split('\n').length;
    }
  };
};

export default useCollaboration;