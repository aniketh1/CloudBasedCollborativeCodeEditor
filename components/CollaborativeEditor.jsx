"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { LiveblocksYjsProvider } from '@liveblocks/yjs';
import { MonacoBinding } from 'y-monaco';
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

const CollaborativeEditor = ({ 
  selectedFile, 
  roomid, 
  projectFiles = [], 
  language = 'javascript',
  theme = 'vs-dark',
  fontSize = 14,
  onEditorMount,
  initialContent = ''
}) => {
  const room = useRoom();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  
  const [editor, setEditor] = useState(null);
  const [monaco, setMonaco] = useState(null);
  const [provider, setProvider] = useState(null);
  const [binding, setBinding] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const ydoc = useRef(null);
  const ytext = useRef(null);
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Yjs document and provider
  useEffect(() => {
    if (!room) return;

    try {
      // Create Yjs document
      ydoc.current = new Y.Doc();
      ytext.current = ydoc.current.getText('monaco');

      // Set initial content if provided and document is empty
      if (initialContent && ytext.current.length === 0) {
        ytext.current.insert(0, initialContent);
      }

      // Create Liveblocks provider
      const liveblocksProvider = new LiveblocksYjsProvider(room, ydoc.current);
      setProvider(liveblocksProvider);

      // Connection status monitoring
      liveblocksProvider.on('status', (event) => {
        setIsConnected(event.status === 'connected');
      });

      setIsConnected(true);
      setIsInitialized(true);

      console.log('✅ Yjs document and provider initialized');

      return () => {
        liveblocksProvider?.destroy();
        ydoc.current?.destroy();
      };
    } catch (error) {
      console.error('Error initializing Yjs:', error);
    }
  }, [room, initialContent]);

  // Setup Monaco binding when editor is ready
  useEffect(() => {
    if (!editor || !monaco || !provider || !ytext.current || !isInitialized) return;

    try {
      // Create Monaco binding for real-time text synchronization
      const monacoBinding = new MonacoBinding(
        ytext.current,
        editor.getModel(),
        new Set([editor]),
        provider.awareness
      );

      setBinding(monacoBinding);
      console.log('✅ Monaco binding created - Real-time sync active!');

      return () => {
        monacoBinding?.destroy();
      };
    } catch (error) {
      console.error('Error setting up Monaco binding:', error);
    }
  }, [editor, monaco, provider, updateMyPresence, isInitialized]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editorInstance, monacoInstance) => {
    setEditor(editorInstance);
    setMonaco(monacoInstance);
    editorRef.current = editorInstance;

    // Enhanced editor configuration
    editorInstance.updateOptions({
      fontSize: fontSize,
      fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth'
    });

    if (onEditorMount) {
      onEditorMount(editorInstance, monacoInstance);
    }

    console.log('✅ Monaco editor mounted and configured');
  }, [fontSize, onEditorMount]);

  // Count online users
  const onlineCount = others.length + 1;

  return (
    <div className="h-full relative">
      {/* Editor */}
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        theme={theme}
        value={!isInitialized ? initialContent : undefined}
        onMount={handleEditorDidMount}
        options={{
          fontSize: fontSize,
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          minimap: { enabled: true },
          wordWrap: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: "selection",
          lineNumbers: "on",
          folding: true
        }}
      />

      {/* Collaboration status */}
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
          {isConnected ? 'Real-time Sync Active' : 'Connecting...'}
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
                  {info?.name || 'User'}
                </span>
                {presence?.isTyping && (
                  <span className="text-green-400 text-xs">typing...</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur rounded-lg p-2 border border-gray-700">
          <div className="text-xs text-gray-400">
            <div>Room: {roomid}</div>
            <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
            <div>Provider: {provider ? '✅' : '❌'}</div>
            <div>Binding: {binding ? '✅' : '❌'}</div>
            <div>Y-Doc: {ydoc.current ? '✅' : '❌'}</div>
          </div>
        </div>
      )}

      {/* Welcome message */}
      {!initialContent && isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-gray-800/80 backdrop-blur rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-gray-200 mb-2">��� Real-time Collaboration Ready!</h3>
            <p className="text-sm text-gray-400 mb-4">Start typing to see the magic happen.</p>
            <div className="text-xs text-gray-500">
              <p>✨ Share this link with others to collaborate in real-time</p>
              <p>��� All changes are synchronized instantly</p>
              <p>��� See live cursors and typing indicators</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborativeEditor;
