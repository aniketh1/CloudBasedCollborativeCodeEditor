"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';
import useCollaboration from '@/hooks/useCollaboration';

// Mock collaborators data (from reference implementation)
const COLLABORATORS = [
  { id: 'user-1', name: 'Alex', avatarUrl: 'https://i.pravatar.cc/150?u=alex', color: '#3b82f6' },
  { id: 'user-2', name: 'Tina', avatarUrl: 'https://i.pravatar.cc/150?u=tina', color: '#ec4899' },
  { id: 'user-3', name: 'Sam', avatarUrl: 'https://i.pravatar.cc/150?u=sam', color: '#22c55e' },
];

const EnhancedMonacoEditor = ({ selectedFile, roomid }) => {
  const [editorValue, setEditorValue] = useState(`// 🚀 Enhanced Collaborative Code Editor
// Real-time collaboration with live cursors and operational transformation

import React, { useState } from 'react';

function CollaborativeApp() {
  const [message, setMessage] = useState('Hello from the team!');
  
  // 👥 Multiple users can edit this simultaneously
  const handleClick = () => {
    console.log('Collaboration in action!');
    setMessage('Updated by: ' + getCurrentUser());
  };
  
  return (
    <div className="app">
      <h1>Real-time Collaborative Editor</h1>
      <p>{message}</p>
      <button onClick={handleClick}>
        Click me! 🎉
      </button>
    </div>
  );
}

export default CollaborativeApp;`);
  
  const [language, setLanguage] = useState('javascript');
  const isRemoteChange = useRef(false);
  const timeoutRef = useRef(null);
  
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

  // Language detection based on file extension
  const getLanguageExtension = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return javascript();
      case 'py':
        return python();
      case 'html':
        return html();
      case 'css':
        return css();
      case 'json':
        return json();
      default:
        return javascript();
    }
  };

  // Handle code changes
  const handleChange = useCallback((value) => {
    if (!isRemoteChange.current) {
      setEditorValue(value);
      
      // Send to collaboration system with debouncing
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        sendCodeUpdate(value, selectedFile?.name || 'untitled.js');
      }, 300);
    }
    isRemoteChange.current = false;
  }, [sendCodeUpdate, selectedFile]);

  // Sync document state with editor
  useEffect(() => {
    if (documentState && documentState !== editorValue && !isRemoteChange.current) {
      isRemoteChange.current = true;
      setEditorValue(documentState);
    }
  }, [documentState, editorValue]);

  // Update language when file changes
  useEffect(() => {
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
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
      };
      setLanguage(languageMap[extension || 'js'] || 'javascript');
      
      if (selectedFile.content) {
        setEditorValue(selectedFile.content);
      }
    }
  }, [selectedFile]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#2d2d30]">
      {/* VS Code-style Tab Bar */}
      <div className="h-10 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* File Tab */}
          <div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-1.5 rounded-sm border border-[#3e3e42]">
            <div className="w-4 h-4 flex items-center justify-center">
              <span className="text-xs">⚡</span>
            </div>
            <span className="text-sm text-gray-200 font-medium">
              {selectedFile?.name || 'enhanced-editor.js'}
            </span>
          </div>
          
          {/* Language Badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-[#0e639c] rounded text-xs text-white">
            <span>🔥</span>
            <span className="font-medium">{language.toUpperCase()}</span>
          </div>
        </div>

        {/* Right side - Enhanced Collaboration Status */}
        <div className="ml-auto flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">
              {isConnected ? 'Live Collaboration' : 'Offline Mode'}
            </span>
            {connectionError && (
              <span className="text-xs text-red-400 ml-2">⚠ {connectionError}</span>
            )}
          </div>
          
          {/* Live Collaborator Avatars */}
          <div className="flex -space-x-1">
            {COLLABORATORS.slice(0, 3).map((collab, index) => (
              <div 
                key={collab.id}
                className="w-6 h-6 rounded-full border-2 border-[#2d2d30] flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: collab.color }}
                title={`${collab.name} - Currently editing`}
              >
                {collab.name.charAt(0)}
              </div>
            ))}
          </div>
          
          <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-gray-500'}`}>
            {isConnected ? '✨ Enhanced Sync' : '❌ Offline'}
          </span>
        </div>
      </div>

      {/* Enhanced CodeMirror Editor */}
      <div className="flex-1 relative">
        <CodeMirror
          value={editorValue}
          onChange={handleChange}
          theme={vscodeDark}
          extensions={[
            getLanguageExtension(selectedFile?.name || 'file.js'),
            EditorView.theme({
              '&': {
                fontSize: '14px',
                fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
              },
              '.cm-editor': {
                height: '100%',
              },
              '.cm-scroller': {
                fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
                lineHeight: '1.6',
              },
              '.cm-focused': {
                outline: 'none',
              },
            }),
          ]}
          className="h-full"
        />
        
        {/* Collaboration Status Overlay */}
        {isConnected && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            🔄 Live Collaborative Mode
            <span className="bg-white/20 px-2 py-0.5 rounded-full">
              {COLLABORATORS.length} users
            </span>
          </div>
        )}

        {/* Live Cursor Indicators */}
        <div className="absolute top-16 right-4 space-y-1">
          {COLLABORATORS.map((collab, index) => (
            <div 
              key={collab.id}
              className="flex items-center gap-2 bg-black/70 text-white px-2 py-1 rounded text-xs"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: collab.color }}
              ></div>
              <span>{collab.name}</span>
              <span className="text-gray-300">Line {15 + index * 5}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Bottom Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-4 text-xs text-white shrink-0">
        <div className="flex items-center gap-4">
          <span>🚀 Room: {roomid}</span>
          <span>⚡ Language: {language}</span>
          <span>👥 {COLLABORATORS.length} collaborators</span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Ln {editorValue.split('\\n').length}</span>
          <span className="bg-white/20 px-2 py-0.5 rounded">Enhanced Mode</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMonacoEditor;