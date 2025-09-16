"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import useCollaboration from '@/hooks/useCollaboration';
import AdvancedMonacoEditor from './AdvancedMonacoEditor';
// import CollaborativeFeatures from './CollaborativeFeatures';
// import CodeAnalysisFeatures from './CodeAnalysisFeatures';
// import EnhancedIntelliSense from './EnhancedIntelliSense';

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

const MonacoEditor = ({ selectedFile, roomid, projectFiles = [] }) => {
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(true);
  const [editorValue, setEditorValue] = useState(`// Welcome to CodeDev Collaborative Editor 🚀
// Enhanced with Advanced Features & Real-time Collaboration

console.log("Advanced Monaco Editor with full feature set!");

// Try typing to see:
// ✨ Enhanced IntelliSense & Auto-complete
// 🔍 Live Code Analysis & Error Detection  
// 👥 Real-time Collaborative Features
// 🎨 Multiple Themes & Customization
// 📊 Code Metrics & Quality Analysis

function welcomeToAdvancedEditor() {
  const features = [
    "Smart Auto-completion",
    "Real-time Error Detection", 
    "Collaborative Cursors",
    "Code Quality Metrics",
    "Advanced IntelliSense",
    "Custom Themes & Settings"
  ];
  
  return "Enjoy coding with " + features.length + " enhanced features! 🚀";
}

// Start collaborating with your team! 👨‍💻👩‍💻
welcomeToAdvancedEditor();`);
  const [language, setLanguage] = useState('javascript');
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
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

  // Handle editor mount for both simple and advanced modes
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Enhanced editor configuration
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
      parameterHints: {
        enabled: true,
        cycle: true
      }
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
      {/* Enhanced Tab Bar with Editor Mode Toggle */}
      <div className="h-10 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Editor Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-md p-1">
            <button
              onClick={() => setShowAdvancedEditor(true)}
              className={`px-2 py-1 text-xs rounded ${
                showAdvancedEditor 
                  ? 'bg-[#0e639c] text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🚀 Advanced
            </button>
            <button
              onClick={() => setShowAdvancedEditor(false)}
              className={`px-2 py-1 text-xs rounded ${
                !showAdvancedEditor 
                  ? 'bg-[#0e639c] text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📝 Simple
            </button>
          </div>
          
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
          
          {/* Feature Status Indicators */}
          {showAdvancedEditor && (
            <div className="flex items-center gap-2 ml-2">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <span>🔍</span>
                <span>Analysis</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <span>🧠</span>
                <span>IntelliSense</span>
              </div>
              {errors.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-red-400">
                  <span>❌</span>
                  <span>{errors.length} errors</span>
                </div>
              )}
              {warnings.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-yellow-400">
                  <span>⚠️</span>
                  <span>{warnings.length} warnings</span>
                </div>
              )}
            </div>
          )}
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

      {/* Enhanced Monaco Editor */}
      <div className="flex-1 relative">
        {showAdvancedEditor ? (
          // Advanced Monaco Editor with all features
          <AdvancedMonacoEditor
            value={editorValue}
            onChange={setEditorValue}
            language={language}
            onMount={handleEditorDidMount}
            collaborators={collaborators}
            isConnected={isConnected}
            roomid={roomid}
            selectedFile={selectedFile}
            projectFiles={projectFiles}
          />
        ) : (
          // Simple Monaco Editor
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
        )}
        
        {/* Enhanced Feature Overlays - Testing one component at a time */}
        {/* Temporarily disabled while testing 
        {showAdvancedEditor && editorRef.current && monacoRef.current && (
          <>
            <CollaborativeFeatures
              editor={editorRef.current}
              monaco={monacoRef.current}
              collaborators={collaborators}
              myId={myId}
              isConnected={isConnected}
            />
            
            <CodeAnalysisFeatures
              editor={editorRef.current}
              monaco={monacoRef.current}
              language={language}
              code={editorValue}
              onErrorsDetected={setErrors}
              onWarningsDetected={setWarnings}
            />
            
            <EnhancedIntelliSense
              editor={editorRef.current}
              monaco={monacoRef.current}
              language={language}
              projectFiles={projectFiles}
            />
          </>
        )}
        */}
        
        {/* Collaboration Status Overlay */}
        {isConnected && (
          <div className="absolute top-4 right-4 bg-[#0e639c] text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            🔄 {showAdvancedEditor ? 'Advanced' : 'Simple'} Collaborative Mode
          </div>
        )}
      </div>

      {/* Enhanced Status Bar */}
      <div className="h-6 bg-[#007acc] flex items-center justify-between px-4 text-xs text-white shrink-0">
        <div className="flex items-center gap-4">
          <span>Room: {roomid}</span>
          <span>Language: {language}</span>
          {showAdvancedEditor && (
            <>
              <span>Mode: Advanced</span>
              {errors.length > 0 && <span className="text-red-200">Errors: {errors.length}</span>}
              {warnings.length > 0 && <span className="text-yellow-200">Warnings: {warnings.length}</span>}
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Spaces: 2</span>
          {showAdvancedEditor && (
            <span className="flex items-center gap-1">
              🚀 Enhanced Features Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonacoEditor;