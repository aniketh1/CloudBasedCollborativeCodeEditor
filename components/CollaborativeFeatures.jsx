"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced collaborative features for Monaco Editor
const CollaborativeFeatures = ({ 
  editor, 
  monaco, 
  collaborators, 
  myId, 
  isConnected,
  onUserTyping,
  onUserSelection 
}) => {
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [userSelections, setUserSelections] = useState(new Map());
  const [cursorDecorations, setCursorDecorations] = useState([]);
  const [selectionDecorations, setSelectionDecorations] = useState([]);
  const [userPresence, setUserPresence] = useState(new Map());
  const typingTimeouts = useRef(new Map());

  // Handle typing indicators
  const handleUserTyping = useCallback((userId, isTyping) => {
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (isTyping) {
        newSet.add(userId);
        // Clear existing timeout
        if (typingTimeouts.current.has(userId)) {
          clearTimeout(typingTimeouts.current.get(userId));
        }
        // Set new timeout to remove typing indicator
        const timeout = setTimeout(() => {
          setTypingUsers(current => {
            const updated = new Set(current);
            updated.delete(userId);
            return updated;
          });
          typingTimeouts.current.delete(userId);
        }, 3000);
        typingTimeouts.current.set(userId, timeout);
      } else {
        newSet.delete(userId);
        if (typingTimeouts.current.has(userId)) {
          clearTimeout(typingTimeouts.current.get(userId));
          typingTimeouts.current.delete(userId);
        }
      }
      return newSet;
    });
  }, []);

  // Handle user selections
  const handleUserSelection = useCallback((userId, selection) => {
    setUserSelections(prev => {
      const newMap = new Map(prev);
      if (selection) {
        newMap.set(userId, selection);
      } else {
        newMap.delete(userId);
      }
      return newMap;
    });
  }, []);

  // Update user presence
  const updateUserPresence = useCallback((userId, presence) => {
    setUserPresence(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, {
        ...presence,
        lastSeen: Date.now()
      });
      return newMap;
    });
  }, []);

  // Render cursor decorations in Monaco Editor
  useEffect(() => {
    if (!editor || !monaco) return;

    const decorations = [];
    
    collaborators.forEach(collaborator => {
      if (collaborator.id === myId) return;

      // Cursor decoration
      if (collaborator.cursorPosition) {
        decorations.push({
          range: new monaco.Range(
            collaborator.cursorPosition.lineNumber,
            collaborator.cursorPosition.column,
            collaborator.cursorPosition.lineNumber,
            collaborator.cursorPosition.column
          ),
          options: {
            className: `collaborator-cursor cursor-${collaborator.id}`,
            beforeContentClassName: `collaborator-cursor-label cursor-label-${collaborator.id}`,
            before: {
              content: collaborator.name,
              inlineClassName: 'collaborator-cursor-name',
              backgroundColor: collaborator.color,
              color: 'white',
              border: `2px solid ${collaborator.color}`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 'bold'
            },
            afterContentClassName: `collaborator-cursor-line cursor-line-${collaborator.id}`,
            after: {
              content: '',
              inlineClassName: 'collaborator-cursor-indicator',
              backgroundColor: collaborator.color,
              width: '2px',
              height: '18px',
              position: 'absolute',
              animation: 'blink 1s infinite'
            }
          }
        });
      }

      // Selection decoration
      const selection = userSelections.get(collaborator.id);
      if (selection && selection.startLineNumber && selection.endLineNumber) {
        decorations.push({
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          options: {
            className: `collaborator-selection selection-${collaborator.id}`,
            backgroundColor: `${collaborator.color}30`, // 30% opacity
            borderLeft: `3px solid ${collaborator.color}`,
            borderRadius: '2px',
            minimap: {
              color: collaborator.color,
              position: monaco.editor.MinimapPosition.Inline
            }
          }
        });
      }
    });

    // Apply decorations
    const newDecorations = editor.deltaDecorations([...cursorDecorations, ...selectionDecorations], decorations);
    setCursorDecorations(newDecorations.slice(0, collaborators.length));
    setSelectionDecorations(newDecorations.slice(collaborators.length));

  }, [editor, monaco, collaborators, myId, userSelections, cursorDecorations, selectionDecorations]);

  // Listen for editor selection changes
  useEffect(() => {
    if (!editor) return;

    const selectionChangeListener = editor.onDidChangeCursorSelection((e) => {
      if (onUserSelection) {
        onUserSelection({
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn
        });
      }
    });

    return () => selectionChangeListener.dispose();
  }, [editor, onUserSelection]);

  // Listen for content changes to show typing indicators
  useEffect(() => {
    if (!editor) return;

    const contentChangeListener = editor.onDidChangeModelContent(() => {
      if (onUserTyping) {
        onUserTyping(true);
      }
    });

    return () => contentChangeListener.dispose();
  }, [editor, onUserTyping]);

  // Live Activity Panel Component
  const LiveActivityPanel = () => (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 min-w-64 z-50"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-gray-800">Live Activity</span>
      </div>
      
      <div className="space-y-2">
        {collaborators.map(collaborator => (
          <motion.div 
            key={collaborator.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 p-2 rounded bg-gray-50"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-800">{collaborator.name}</div>
              <div className="text-xs text-gray-600 flex items-center gap-2">
                {typingUsers.has(collaborator.id) && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1 text-blue-600"
                  >
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    typing...
                  </motion.span>
                )}
                
                {collaborator.cursorPosition && !typingUsers.has(collaborator.id) && (
                  <span className="text-gray-500">
                    Line {collaborator.cursorPosition.lineNumber}
                  </span>
                )}
                
                {userSelections.has(collaborator.id) && (
                  <span className="text-purple-600 bg-purple-100 px-2 py-1 rounded text-xs">
                    text selected
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              {userPresence.get(collaborator.id)?.status || 'active'}
            </div>
          </motion.div>
        ))}
      </div>
      
      {collaborators.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          <div className="mb-2">👤</div>
          <div>You're working alone</div>
          <div className="text-xs">Share this room to collaborate</div>
        </div>
      )}
    </motion.div>
  );

  // Typing Indicators Overlay
  const TypingIndicators = () => (
    <AnimatePresence>
      {Array.from(typingUsers).map(userId => {
        const user = collaborators.find(c => c.id === userId);
        if (!user) return null;
        
        return (
          <motion.div
            key={userId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-4 left-4 bg-white rounded-full px-3 py-2 shadow-lg flex items-center gap-2 z-40"
          >
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-700 ml-1">{user.name} is typing...</span>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );

  // Selection Preview Component
  const SelectionPreview = ({ userId, selection, user }) => {
    if (!selection || !user) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-40"
        style={{ borderLeft: `4px solid ${user.color}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: user.color }}
          ></div>
          <span className="text-sm font-medium text-gray-800">{user.name}</span>
          <span className="text-xs text-gray-500">selected text</span>
        </div>
        <div className="text-xs text-gray-600">
          Lines {selection.startLineNumber}-{selection.endLineNumber}
        </div>
      </motion.div>
    );
  };

  // Custom CSS for cursor animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      
      .collaborator-cursor {
        position: relative;
        z-index: 100;
      }
      
      .collaborator-cursor-name {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        white-space: nowrap;
        position: absolute;
        top: -25px;
        left: 0;
        z-index: 101;
      }
      
      .collaborator-cursor-indicator {
        width: 2px;
        height: 18px;
        position: absolute;
        animation: blink 1s infinite;
        z-index: 100;
      }
      
      .collaborator-selection {
        border-radius: 2px;
        transition: all 0.2s ease;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      {isConnected && collaborators.length > 0 && <LiveActivityPanel />}
      <TypingIndicators />
      
      <AnimatePresence>
        {Array.from(userSelections.entries()).map(([userId, selection]) => {
          const user = collaborators.find(c => c.id === userId);
          return (
            <SelectionPreview 
              key={userId}
              userId={userId}
              selection={selection}
              user={user}
            />
          );
        })}
      </AnimatePresence>
    </>
  );
};

export default CollaborativeFeatures;