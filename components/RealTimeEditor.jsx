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

const RealTimeEditor = ({ selectedFile, roomid, collaborationData }) => {
  const [editorValue, setEditorValue] = useState(`// 🚀 Real-time Collaborative Code Editor
// Live character-by-character synchronization

import React, { useState, useEffect } from 'react';

function RealTimeCollabApp() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('Type here and see it sync instantly!');
  
  // 👥 Real users can edit this simultaneously
  // 💾 Auto-saves every 500ms
  // 🎨 File borders show who's editing
  
  useEffect(() => {
    console.log('Real-time collaboration active!');
  }, []);
  
  const handleUserInput = (event) => {
    setMessage(event.target.value);
    // Every keystroke syncs instantly! ⚡
  };
  
  return (
    <div className="collaborative-editor">
      <h1>🔥 Live Collaboration Demo</h1>
      <input 
        type="text" 
        value={message}
        onChange={handleUserInput}
        placeholder="Type here - others see it instantly!"
      />
      <p>Active users: {users.length}</p>
      
      {/* 🎯 Try opening multiple browser windows! */}
      <button onClick={() => console.log('Collaborative action!')}>
        Test Collaboration 🚀
      </button>
    </div>
  );
}

export default RealTimeCollabApp;`);
  
  const [language, setLanguage] = useState('javascript');
  const isRemoteChange = useRef(false);
  const editorRef = useRef(null);
  const cursorTimeoutRef = useRef(null);
  
  // Real collaboration integration
  const {
    isConnected,
    connectionError,
    collaborators,
    myUser,
    documentState,
    fileEditors,
    liveCursors,
    sendCodeUpdate,
    sendCursorUpdate,
    requestEditPermission,
    releaseEditPermission,
    canEdit,
    getFileBorderStyle,
    setCurrentFile
  } = collaborationData || {};

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

  // Handle instant code changes (character-by-character)
  const handleChange = useCallback((value) => {
    if (!isRemoteChange.current) {
      setEditorValue(value);
      
      // Send immediately for instant sync (no debouncing)
      sendCodeUpdate(value, selectedFile?.name || 'untitled.js');
    }
    isRemoteChange.current = false;
  }, [sendCodeUpdate, selectedFile]);

  // Handle cursor position changes
  const handleCursorActivity = useCallback((view) => {
    if (!view || !myUser) return;
    
    const selection = view.state.selection.main;
    const pos = selection.head;
    const line = view.state.doc.lineAt(pos);
    const lineNumber = line.number;
    const column = pos - line.from;
    
    // Clear previous timeout
    if (cursorTimeoutRef.current) {
      clearTimeout(cursorTimeoutRef.current);
    }
    
    // Send cursor update with slight delay to avoid spam
    cursorTimeoutRef.current = setTimeout(() => {
      sendCursorUpdate(pos, lineNumber, column, selectedFile?.name || 'untitled.js');
    }, 100);
  }, [sendCursorUpdate, selectedFile, myUser]);

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
      
      // Set current file for collaboration
      setCurrentFile(selectedFile.name);
      
      if (selectedFile.content && selectedFile.content !== editorValue) {
        setEditorValue(selectedFile.content);
        sendCodeUpdate(selectedFile.content, selectedFile.name);
      }
      
      // Request edit permission
      requestEditPermission(selectedFile.name);
    } else {
      // Default file for collaboration
      setCurrentFile('untitled.js');
    }
    
    return () => {
      if (selectedFile) {
        releaseEditPermission(selectedFile.name);
      }
    };
  }, [selectedFile, requestEditPermission, releaseEditPermission, setCurrentFile, sendCodeUpdate, editorValue]);

  // Get current file editors for display
  const currentFileEditors = selectedFile ? fileEditors[selectedFile.name] || [] : [];
  const currentEditorUsers = collaborators.filter(user => 
    currentFileEditors.includes(user.id)
  );
  if (myUser && currentFileEditors.includes(myUser.id)) {
    currentEditorUsers.push(myUser);
  }

  // Get file border style
  const fileBorderStyle = selectedFile ? getFileBorderStyle(selectedFile.name) : {};
  const canEditCurrentFile = selectedFile ? canEdit(selectedFile.name) : true;

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#2d2d30]" style={fileBorderStyle}>
      {/* Enhanced Tab Bar with Real User Info */}
      <div className="h-10 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* File Tab with Edit Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-all duration-200 ${
            canEditCurrentFile ? 'bg-[#1e1e1e] border-[#3e3e42]' : 'bg-[#2d2d30] border-red-500'
          }`}>
            <div className="w-4 h-4 flex items-center justify-center">
              {canEditCurrentFile ? (
                <span className="text-xs text-green-400">✏️</span>
              ) : (
                <span className="text-xs text-red-400">👁️</span>
              )}
            </div>
            <span className="text-sm text-gray-200 font-medium">
              {selectedFile?.name || 'realtime-editor.js'}
            </span>
            {!canEditCurrentFile && (
              <span className="text-xs text-red-400 ml-1">(View Only)</span>
            )}
          </div>
          
          {/* Language Badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-[#0e639c] rounded text-xs text-white">
            <span>🔥</span>
            <span className="font-medium">{language.toUpperCase()}</span>
          </div>

          {/* File Editors Indicator */}
          {currentEditorUsers.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-[#2d2d30] rounded text-xs border border-[#3e3e42]">
              <span>👥</span>
              <span className="text-white">{currentEditorUsers.length}/5 editing</span>
            </div>
          )}
        </div>

        {/* Right side - Real Collaboration Status */}
        <div className="ml-auto flex items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">
              {isConnected ? 'Live Sync Active' : 'Offline Mode'}
            </span>
            {connectionError && (
              <span className="text-xs text-red-400 ml-2">⚠ {connectionError}</span>
            )}
          </div>
          
          {/* Real User Avatars */}
          <div className="flex -space-x-1">
            {myUser && (
              <div 
                className="w-6 h-6 rounded-full border-2 border-[#2d2d30] flex items-center justify-center text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-500"
                title={`${myUser.name} (You)`}
              >
                {myUser.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            {collaborators.slice(0, 4).map((collab) => (
              <div 
                key={collab.id}
                className="w-6 h-6 rounded-full border-2 border-[#2d2d30] flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: collab.color }}
                title={`${collab.name} - ${currentFileEditors.includes(collab.id) ? 'Editing' : 'Viewing'}`}
              >
                {collab.name.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
            {collaborators.length > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-[#2d2d30] bg-[#3e3e42] flex items-center justify-center text-xs text-white">
                +{collaborators.length - 4}
              </div>
            )}
          </div>
          
          <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-gray-500'}`}>
            {isConnected ? '⚡ Instant Sync' : '❌ Offline'}
          </span>
        </div>
      </div>

      {/* Enhanced CodeMirror Editor */}
      <div className="flex-1 relative">
        <CodeMirror
          ref={editorRef}
          value={editorValue}
          onChange={handleChange}
          onUpdate={(view) => handleCursorActivity(view)}
          readOnly={!canEditCurrentFile}
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
              '.cm-editor.cm-focused': {
                outline: canEditCurrentFile ? '2px solid #007acc' : '2px solid #ef4444',
              },
            }),
          ]}
          className="h-full"
        />
        
        {/* Live Collaboration Overlay */}
        {isConnected && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            ⚡ Character-by-Character Sync
            <span className="bg-white/20 px-2 py-0.5 rounded-full">
              {collaborators.length + 1} users
            </span>
          </div>
        )}

        {/* Live Cursor Indicators */}
        <div className="absolute top-16 right-4 space-y-1 max-w-xs">
          {Object.entries(liveCursors).map(([userId, cursor]) => (
            cursor.fileName === (selectedFile?.name || 'untitled.js') && (
              <div 
                key={userId}
                className="flex items-center gap-2 bg-black/80 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm"
              >
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: cursor.user.color }}
                ></div>
                <span className="font-medium">{cursor.user.name}</span>
                <span className="text-gray-300">Ln {cursor.line}, Col {cursor.column}</span>
              </div>
            )
          ))}
        </div>

        {/* Auto-save Indicator */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-400 flex items-center gap-1">
          <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
          Auto-saving...
        </div>

        {/* View-only Overlay */}
        {!canEditCurrentFile && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
              👁️ View Only - Maximum 5 editors reached
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-4 text-xs text-white shrink-0">
        <div className="flex items-center gap-4">
          <span>🚀 Room: {roomid}</span>
          <span>⚡ Language: {language}</span>
          <span>👥 {collaborators.length + 1} users online</span>
          {selectedFile && (
            <span>📁 {selectedFile.name}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Ln {editorValue.split('\\n').length}</span>
          {canEditCurrentFile ? (
            <span className="bg-green-500/30 px-2 py-0.5 rounded">✏️ Editing</span>
          ) : (
            <span className="bg-red-500/30 px-2 py-0.5 rounded">👁️ Viewing</span>
          )}
          <span className="bg-white/20 px-2 py-0.5 rounded">Real-time Mode</span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeEditor;