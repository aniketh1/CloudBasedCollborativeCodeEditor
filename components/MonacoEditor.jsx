"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import useCollaboration from '@/hooks/useCollaboration';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300 text-sm">Loading Monaco Editor...</p>
      </div>
    </div>
  )
});

const MonacoEditor = ({ selectedFile, roomid }) => {
  const [editorValue, setEditorValue] = useState(`// Welcome to CodeDev Collaborative Editor 🚀
// Real-time collaboration powered by operational transformation

console.log("Start collaborating!");

function welcomeMessage() {
  return "Happy coding with your team! 👨‍💻👩‍💻";
}

// Your code here...`);
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false);
  
  // Real collaboration integration
  const {
    isConnected,
    connectionError,
    collaborators,
    myId,
    documentState,
    sendCodeUpdate,
    sendCursorUpdate,
    getLineNumber
  } = useCollaboration(roomid);

  // Listen for real-time code updates from collaborators
  useEffect(() => {
    console.log('🚀 Collaboration system active for room:', roomid);
    console.log('📊 Connection status:', isConnected);
    console.log('👥 Active collaborators:', collaborators.length);
  }, [roomid, isConnected, collaborators]);

  // Sync document state with editor
  useEffect(() => {
    if (documentState && editorRef.current && !isRemoteChange.current) {
      const currentValue = editorRef.current.getValue();
      if (documentState !== currentValue) {
        isRemoteChange.current = true;
        editorRef.current.setValue(documentState);
        setEditorValue(documentState);
      }
    }
  }, [documentState]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Set VS Code dark theme
    monaco.editor.setTheme('vs-dark');
    
    // Configure editor options for modern VS Code look
    editor.updateOptions({
      fontSize: 14,
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
      padding: { top: 16, bottom: 16 }
    });

    // Handle code changes for collaboration
    editor.onDidChangeModelContent((event) => {
      if (!isRemoteChange.current) {
        const value = editor.getValue();
        setEditorValue(value);
        
        // Send code update to collaborators with debouncing
        clearTimeout(window.collaborationTimeout);
        window.collaborationTimeout = setTimeout(() => {
          sendCodeUpdate(value, selectedFile?.name || 'untitled.js');
        }, 300);
      }
      isRemoteChange.current = false;
    });

    // Handle cursor position changes
    editor.onDidChangeCursorPosition((event) => {
      const position = editor.getPosition();
      const offset = editor.getModel().getOffsetAt(position);
      
      // Send cursor update with debouncing
      clearTimeout(window.cursorTimeout);
      window.cursorTimeout = setTimeout(() => {
        sendCursorUpdate(offset, selectedFile?.name || 'untitled.js');
      }, 150);
    });
  };

  const handleEditorChange = (value) => {
    if (!isRemoteChange.current) {
      setEditorValue(value);
    }
  };

  // Update language based on selected file
  useEffect(() => {
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'txt': 'plaintext'
      };
      setLanguage(languageMap[extension] || 'javascript');
    }
  }, [selectedFile]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#2d2d30]">
      {/* Modern VS Code-style Tab Bar */}
      <div className="h-10 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* File Tab */}
          <div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-1.5 rounded-sm border border-[#3e3e42]">
            <div className="w-4 h-4 flex items-center justify-center">
              {selectedFile ? (
                <span className="text-xs">📄</span>
              ) : (
                <span className="text-xs">✨</span>
              )}
            </div>
            <span className="text-sm text-gray-200 font-medium">
              {selectedFile?.name || 'welcome.js'}
            </span>
          </div>
          
          {/* Language Badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-[#0e639c] rounded text-xs text-white">
            <span>⚡</span>
            <span className="font-medium">{language.toUpperCase()}</span>
          </div>
        </div>

        {/* Right side - Collaboration Status */}
        <div className="ml-auto flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">
              {isConnected ? 'Live' : 'Offline'}
            </span>
            {connectionError && (
              <span className="text-xs text-red-400 ml-2">⚠ {connectionError}</span>
            )}
          </div>
          
          {/* Collaborator Count */}
          {collaborators.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-purple-400">👥 {collaborators.length}</span>
              <div className="flex -space-x-1">
                {collaborators.slice(0, 3).map((collab, index) => (
                  <div 
                    key={collab.id}
                    className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center text-xs"
                    style={{ backgroundColor: collab.color }}
                    title={`${collab.name} - Line ${getLineNumber(editorValue, collab.cursorOffset)}`}
                  >
                    {collab.name.charAt(0)}
                  </div>
                ))}
                {collaborators.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-gray-600 border border-gray-600 flex items-center justify-center text-xs text-gray-300">
                    +{collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-gray-500'}`}>
            {isConnected ? '✅ Real-time Sync' : '❌ Offline Mode'}
          </span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={editorValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
            fontLigatures: true,
            lineHeight: 1.6
          }}
        />
        
        {/* Collaboration Overlay */}
        {isConnected && (
          <div className="absolute top-4 right-4 bg-[#0e639c] text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            🔄 Collaborative Mode
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-4 text-xs text-white shrink-0">
        <div className="flex items-center gap-4">
          <span>Room: {roomid}</span>
          <span>Language: {language}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
};

export default MonacoEditor;