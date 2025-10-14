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
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const ydoc = useRef(null);
  const ytext = useRef(null);
  const editorRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const lastContentRef = useRef(initialContent);

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

  // Update content when selectedFile changes (file switching)
  useEffect(() => {
    if (!ytext.current || !isInitialized) return;
    
    // SAVE CURRENT FILE BEFORE SWITCHING (if content changed)
    const currentContent = ytext.current.toString();
    if (selectedFile?.id && currentContent && currentContent !== lastContentRef.current) {
      console.log(`💾 Saving previous file before switching...`);
      // Immediately save (no debounce) before switching
      saveFileContent(currentContent);
    }
    
    // NOW clear and load new file
    if (!initialContent) return;
    
    const newContent = ytext.current.toString();
    if (newContent !== initialContent) {
      console.log(`🔄 Updating editor content for file: ${selectedFile?.name}`);
      
      // Clear existing content COMPLETELY
      const currentLength = ytext.current.length;
      if (currentLength > 0) {
        ytext.current.delete(0, currentLength);
      }
      
      // Insert new file content
      if (initialContent) {
        ytext.current.insert(0, initialContent);
        lastContentRef.current = initialContent; // Update ref
      }
    }
  }, [selectedFile?.id, initialContent, isInitialized, saveFileContent]);

  // Auto-save function
  const saveFileContent = useCallback(async (content) => {
    if (!selectedFile?.id || !content) return;
    
    try {
      setIsSaving(true);
      console.log(`💾 Auto-saving ${selectedFile.name}...`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/file/${selectedFile.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setLastSaved(new Date());
        lastContentRef.current = content;
        console.log(`✅ Auto-saved ${selectedFile.name} to ${data.file.storageType}`);
      } else {
        console.error('❌ Failed to save:', data.error);
      }
    } catch (error) {
      console.error('❌ Error auto-saving file:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedFile?.id, selectedFile?.name]);

  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!ytext.current || !isInitialized || !selectedFile?.id) return;

    const handleContentChange = () => {
      const currentContent = ytext.current.toString();
      
      // Only save if content actually changed
      if (currentContent === lastContentRef.current) return;
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce save for 2 seconds after last change
      saveTimeoutRef.current = setTimeout(() => {
        saveFileContent(currentContent);
      }, 2000);
    };

    // Listen to Yjs text changes
    ytext.current.observe(handleContentChange);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      ytext.current?.unobserve(handleContentChange);
    };
  }, [isInitialized, selectedFile?.id, saveFileContent]);

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
        {/* Save status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isSaving
            ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
            : lastSaved
            ? 'bg-green-900/50 text-green-300 border border-green-500/30'
            : 'bg-gray-900/50 text-gray-300 border border-gray-500/30'
        }`}>
          <span className="text-lg">
            {isSaving ? '⏳' : lastSaved ? '✅' : '📝'}
          </span>
          <span className="font-medium">
            {isSaving 
              ? 'Saving...' 
              : lastSaved 
              ? `Saved ${new Date(lastSaved).toLocaleTimeString()}`
              : 'Not saved'}
          </span>
        </div>
        
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
