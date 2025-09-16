"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

// Mock names and colors for demo
const MOCK_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Emma', 'Felix'];
const MOCK_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

/**
 * Real-time collaboration hook with operational transformation
 * Implements Google Docs-style collaborative editing
 */
const useCollaboration = (roomid) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [myId] = useState(`user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
  
  // Socket.IO connection
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // --- Operational Transformation scaffolding ---
  // Mutation queue for local edits (FIFO)
  const mutationQueueRef = useRef([]);
  // Undo stack for local/collaborator mutations (LIFO)
  const undoStackRef = useRef([]);
  
  // Current document state
  const [documentState, setDocumentState] = useState('');
  const documentVersionRef = useRef(0);

  // Transformer function: shifts indexes of incoming mutations
  const transformMutation = useCallback((incoming, queue) => {
    let transformed = { ...incoming };
    for (const mutation of queue) {
      if (mutation.type === 'insert' && mutation.index <= transformed.index) {
        transformed.index += mutation.text.length;
      } else if (mutation.type === 'delete' && mutation.index < transformed.index) {
        transformed.index -= Math.min(mutation.length, transformed.index - mutation.index);
      }
    }
    return transformed;
  }, []);

  // Apply mutation to document
  const applyMutation = useCallback((mutation, content) => {
    if (mutation.type === 'insert') {
      return content.slice(0, mutation.index) + mutation.text + content.slice(mutation.index);
    } else if (mutation.type === 'delete') {
      return content.slice(0, mutation.index) + content.slice(mutation.index + mutation.length);
    }
    return content;
  }, []);

  // Add mutation to queue and send to server
  const addMutation = useCallback((mutation) => {
    mutation.id = `${myId}-${Date.now()}-${Math.random()}`;
    mutation.version = documentVersionRef.current;
    mutationQueueRef.current.push(mutation);
    
    // Send to server via Socket.IO
    if (socketRef.current?.connected) {
      socketRef.current.emit('mutation', {
        roomid,
        mutation,
        authorId: myId
      });
    }
    
    return mutation;
  }, [myId, roomid]);

  // Apply incoming mutation (from server)
  const applyIncomingMutation = useCallback((data) => {
    const { mutation, authorId } = data;
    
    // Don't apply our own mutations
    if (authorId === myId) {
      // Remove acknowledged mutation from queue
      mutationQueueRef.current = mutationQueueRef.current.filter(m => m.id !== mutation.id);
      return;
    }
    
    // Transform incoming mutation against local queue
    const transformed = transformMutation(mutation, mutationQueueRef.current);
    
    // Apply to document state
    setDocumentState(prevState => applyMutation(transformed, prevState));
    documentVersionRef.current++;
    
    // Update collaborator cursor position
    setCollaborators(prev => 
      prev.map(collab => 
        collab.id === authorId 
          ? { ...collab, cursorOffset: transformed.index, lastSeen: Date.now() }
          : collab
      )
    );
  }, [myId, transformMutation, applyMutation]);

  // Connect to Socket.IO server
  const connect = useCallback(() => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      console.log('🔗 Connecting to collaboration server:', BACKEND_URL);
      
      socketRef.current = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });
      
      socketRef.current.on('connect', () => {
        console.log('✅ Connected to collaboration server');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Join the room
        socketRef.current.emit('join-room', {
          roomid,
          user: {
            id: myId,
            name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
            color: MOCK_COLORS[Math.floor(Math.random() * MOCK_COLORS.length)],
            cursorOffset: 0,
            lastSeen: Date.now()
          }
        });
      });

      socketRef.current.on('disconnect', () => {
        console.log('❌ Disconnected from collaboration server');
        setIsConnected(false);
        
        // Auto-reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.log(`🔄 Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            connect();
          }, 2000);
        } else {
          setConnectionError('Failed to reconnect after multiple attempts');
        }
      });

      // Handle collaboration events
      socketRef.current.on('user-joined', (data) => {
        console.log('👋 User joined:', data.user);
        setCollaborators(prev => {
          const existing = prev.find(c => c.id === data.user.id);
          if (existing) return prev;
          return [...prev, { ...data.user, lastSeen: Date.now() }];
        });
      });

      socketRef.current.on('user-left', (data) => {
        console.log('👋 User left:', data.userId);
        setCollaborators(prev => prev.filter(c => c.id !== data.userId));
      });

      socketRef.current.on('collaborators-list', (data) => {
        console.log('👥 Collaborators list updated:', data.users);
        setCollaborators(data.users || []);
      });

      // Handle real-time mutations
      socketRef.current.on('mutation', applyIncomingMutation);

      socketRef.current.on('cursor-update', (data) => {
        if (data.authorId !== myId) {
          setCollaborators(prev => 
            prev.map(c => 
              c.id === data.authorId 
                ? { ...c, cursorOffset: data.position, lastSeen: Date.now() }
                : c
            )
          );
        }
      });

      socketRef.current.on('error', (error) => {
        console.error('🚨 Socket error:', error);
        setConnectionError('Connection error occurred');
      });

    } catch (error) {
      console.error('❌ Failed to create socket connection:', error);
      setConnectionError('Failed to initialize connection');
    }
  }, [roomid, myId, applyIncomingMutation]);  // Initialize connection when component mounts
  useEffect(() => {
    if (roomid) {
      connect();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomid, connect]);

  // Send code update to other collaborators
  const sendCodeUpdate = useCallback((content, filePath = 'untitled.js') => {
    const currentContent = documentState;
    
    // Calculate mutations between current and new content
    if (content !== currentContent) {
      // Simple diff: for now, replace entire content
      // In production, use a proper diff algorithm
      const mutation = {
        type: 'replace',
        index: 0,
        length: currentContent.length,
        text: content,
        filePath
      };
      
      addMutation(mutation);
      setDocumentState(content);
      documentVersionRef.current++;
    }
    
    return true;
  }, [documentState, addMutation]);

  // Send cursor position update
  const sendCursorUpdate = useCallback((position, filePath = 'untitled.js') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor-update', {
        roomid,
        authorId: myId,
        position,
        filePath,
        timestamp: Date.now()
      });
    }
    return true;
  }, [roomid, myId]);

  // Mock functions (keeping for fallback)
  const sendCodeUpdate_old = useCallback(() => true, []);
  const sendCursorUpdate_old = useCallback(() => true, []);
  const getLineNumber = useCallback((code, offset) => {
    if (!code || offset < 0) return 1;
    return code.substring(0, offset).split('\n').length;
  }, []);

  return {
    isConnected,
    connectionError,
    collaborators,
    myId,
    documentState,
    sendCodeUpdate,
    sendCursorUpdate,
    getLineNumber,
    addMutation,
    reconnect: connect
  };
};

export default useCollaboration;