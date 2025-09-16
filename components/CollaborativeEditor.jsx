"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRoom, useOthers, useUpdateMyPresence } from '@/liveblocks.config';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300 text-sm">Loading Collaborative Editor...</p>
      </div>
    </div>
  )
});

const EnhancedIntelliSense = dynamic(() => import('./EnhancedIntelliSense'), {
  ssr: false,
  loading: () => null
});

const CollaborativeEditor = ({ 
  selectedFile, 
  roomid, 
  projectFiles = [], 
  language = 'javascript',
  theme = 'vs-dark',
  fontSize = 14,
  onEditorMount
}) => {
  const room = useRoom();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  
  const [editor, setEditor] = useState(null);
  const [monaco, setMonaco] = useState(null);
  const [editorValue, setEditorValue] = useState("// Welcome to Real-time Collaborative Editor\n// ✨ All users can edit simultaneously!\n// 🤝 Powered by Liveblocks\n\nconsole.log('Collaborative editing ready!');\n\nfunction collaborate() {\n  return 'Real-time magic!';\n}");
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editorInstance, monacoInstance) => {
    setEditor(editorInstance);
    setMonaco(monacoInstance);
    editorRef.current = editorInstance;

    // Enhanced editor configuration
    editorInstance.updateOptions({
      fontSize: fontSize,
      fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'SF Mono', Consolas, monospace",
      fontLigatures: true,
      lineHeight: 1.6,
      letterSpacing: 0.5,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
      padding: { top: 16, bottom: 16 },
      // Enhanced IntelliSense options
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      // Advanced features
      folding: true,
      foldingStrategy: 'auto',
      showFoldingControls: 'always',
      foldingHighlight: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        bracketPairsHorizontal: true,
        highlightActiveBracketPair: true,
        indentation: true
      }
    });

    // Setup cursor and selection tracking
    const updatePresence = () => {
      const selection = editorInstance.getSelection();
      const position = editorInstance.getPosition();
      
      if (selection && position) {
        updateMyPresence({
          cursor: {
            x: position.column,
            y: position.lineNumber
          },
          selection: {
            anchor: editorInstance.getModel().getOffsetAt({
              lineNumber: selection.startLineNumber,
              column: selection.startColumn
            }),
            head: editorInstance.getModel().getOffsetAt({
              lineNumber: selection.endLineNumber,
              column: selection.endColumn
            })
          }
        });
      }
    };

    // Listen for cursor changes
    const cursorDisposable = editorInstance.onDidChangeCursorPosition(updatePresence);
    const selectionDisposable = editorInstance.onDidChangeCursorSelection(updatePresence);

    // Listen for content changes to show typing indicators
    const contentDisposable = editorInstance.onDidChangeModelContent(() => {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set typing indicator
      updateMyPresence({ username: 'User' }); // You can replace with actual username
      
      // Clear typing indicator after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        updateMyPresence({ username: null });
      }, 2000);
    });

    // Call parent's onMount handler if provided
    if (onEditorMount) {
      onEditorMount(editorInstance, monacoInstance);
    }

    // Cleanup function
    return () => {
      cursorDisposable?.dispose();
      selectionDisposable?.dispose();
      contentDisposable?.dispose();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [fontSize, onEditorMount, updateMyPresence]);

  // Monitor connection status
  useEffect(() => {
    if (room) {
      setIsConnected(room.getConnectionState() === 'connected');
      
      const unsubscribe = room.subscribe('connection', (state) => {
        setIsConnected(state === 'connected');
      });

      return unsubscribe;
    }
  }, [room]);

  // Handle editor value changes
  const handleEditorChange = useCallback((value) => {
    setEditorValue(value || "");
    // In a full implementation, you would sync this with Yjs/Liveblocks
    // For now, this is a simplified version
  }, []);

  // Render collaborator cursors
  const renderCollaboratorCursors = () => {
    return others.map(({ connectionId, presence, info }) => {
      if (!presence?.cursor || !info) return null;
      
      const cursorColor = info.color || '#3b82f6';
      const userName = info.name || 'Anonymous';
      
      return (
        <div
          key={connectionId}
          className="absolute pointer-events-none z-50"
          style={{
            left: `${presence.cursor.x * 8}px`, // Approximate character width
            top: `${(presence.cursor.y - 1) * 24}px`, // Approximate line height
          }}
        >
          <div
            className="w-0.5 h-6 relative"
            style={{ backgroundColor: cursorColor }}
          >
            <div
              className="absolute -top-8 left-1 px-2 py-1 rounded text-white text-xs whitespace-nowrap"
              style={{ backgroundColor: cursorColor }}
            >
              {userName}
            </div>
          </div>
        </div>
      );
    });
  };

  // Count online users
  const onlineCount = others.length + 1;
  const typingCount = others.filter(other => other.presence?.username).length;

  return (
    <div className="h-full relative">
      {/* Editor */}
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        theme={theme}
        value={editorValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: fontSize,
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
          minimap: { enabled: true },
          wordWrap: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: "selection",
          lineNumbers: "on",
          folding: true,
          bracketPairColorization: { enabled: true }
        }}
      />

      {/* Enhanced IntelliSense */}
      {editor && monaco && (
        <EnhancedIntelliSense
          editor={editor}
          monaco={monaco}
          language={language}
          projectFiles={projectFiles}
        />
      )}

      {/* Collaborative cursors overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {renderCollaboratorCursors()}
      </div>

      {/* Collaboration status and user indicators */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Connection status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isConnected 
            ? 'bg-green-900/50 text-green-300 border border-green-500/30' 
            : 'bg-red-900/50 text-red-300 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`} />
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>

        {/* Online users */}
        <div className="bg-gray-800/90 backdrop-blur rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-300">Online ({onlineCount})</span>
          </div>
          
          <div className="space-y-1">
            {/* Current user */}
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-gray-300">You</span>
            </div>
            
            {/* Other users */}
            {others.map(({ connectionId, info, presence }) => (
              <div key={connectionId} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: info?.color || '#6b7280' }}
                />
                <span className="text-gray-300">
                  {info?.name || 'Anonymous'}
                </span>
                {presence?.username && (
                  <span className="text-green-400 text-xs">typing...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Typing indicators */}
      {typingCount > 0 && (
        <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg px-3 py-2 border border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>
              {typingCount} user{typingCount > 1 ? 's' : ''} typing...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditor;