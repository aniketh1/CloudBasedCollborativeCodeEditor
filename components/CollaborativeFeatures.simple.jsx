"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Simplified collaborative features for Monaco Editor (without framer-motion)
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
    
    if (onUserTyping) {
      onUserTyping(userId, isTyping);
    }
  }, [onUserTyping]);

  // Handle user selections and cursors
  const handleUserSelection = useCallback((userId, selection) => {
    if (!editor || !monaco) return;

    setUserSelections(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, selection);
      return newMap;
    });

    if (onUserSelection) {
      onUserSelection(userId, selection);
    }
  }, [editor, monaco, onUserSelection]);

  // Update user presence
  const updateUserPresence = useCallback((userId, data) => {
    setUserPresence(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, {
        ...data,
        lastSeen: Date.now()
      });
      return newMap;
    });
  }, []);

  // Render collaborative cursors
  const renderCollaborativeCursors = useCallback(() => {
    if (!editor || !monaco) return;

    const decorations = [];
    
    collaborators.forEach(collaborator => {
      if (collaborator.id !== myId && collaborator.cursorPosition) {
        const position = collaborator.cursorPosition;
        
        decorations.push({
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          options: {
            className: `cursor-${collaborator.id}`,
            beforeContentClassName: `cursor-label-${collaborator.id}`,
            beforeContentText: collaborator.name,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        });
      }
    });

    setCursorDecorations(editor.deltaDecorations(cursorDecorations, decorations));
  }, [editor, monaco, collaborators, myId, cursorDecorations]);

  // Render collaborative selections
  const renderCollaborativeSelections = useCallback(() => {
    if (!editor || !monaco) return;

    const decorations = [];
    
    userSelections.forEach((selection, userId) => {
      if (userId !== myId && selection) {
        decorations.push({
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          options: {
            className: `selection-${userId}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        });
      }
    });

    setSelectionDecorations(editor.deltaDecorations(selectionDecorations, decorations));
  }, [editor, monaco, userSelections, myId, selectionDecorations]);

  // Update decorations when collaborators change
  useEffect(() => {
    renderCollaborativeCursors();
    renderCollaborativeSelections();
  }, [renderCollaborativeCursors, renderCollaborativeSelections]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="collaborative-features">
      {/* User Presence Panel */}
      <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-3 shadow-lg min-w-[200px]">
        <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Collaborators ({collaborators.length})
        </h4>
        
        <div className="space-y-2">
          {collaborators.map(collaborator => (
            <div 
              key={collaborator.id}
              className="flex items-center gap-2 text-xs"
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: collaborator.color }}
              ></div>
              <span className="text-gray-300 flex-1">{collaborator.name}</span>
              {typingUsers.has(collaborator.id) && (
                <span className="text-green-400 text-xs">typing...</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Typing Indicators */}
      {typingUsers.size > 0 && (
        <div className="absolute bottom-4 left-4 bg-gray-800 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {Array.from(typingUsers).slice(0, 2).map(userId => {
                const user = collaborators.find(c => c.id === userId);
                return user?.name;
              }).filter(Boolean).join(', ')}
              {typingUsers.size > 2 && ` and ${typingUsers.size - 2} more`}
              {typingUsers.size === 1 ? ' is' : ' are'} typing...
            </span>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="absolute bottom-4 right-4">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 shadow-lg">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Dynamic CSS for user-specific colors */}
      <style jsx>{`
        ${collaborators.map(collaborator => `
          .cursor-${collaborator.id}::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 2px;
            height: 100%;
            background-color: ${collaborator.color};
            z-index: 10;
          }
          
          .cursor-label-${collaborator.id}::before {
            content: '${collaborator.name}';
            position: absolute;
            left: 2px;
            top: -20px;
            background-color: ${collaborator.color};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            white-space: nowrap;
            z-index: 11;
          }
          
          .selection-${collaborator.id} {
            background-color: ${collaborator.color}33 !important;
          }
        `).join('')}
      `}</style>
    </div>
  );
};

export default CollaborativeFeatures;