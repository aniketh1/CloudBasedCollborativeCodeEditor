"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Import Liveblocks components
import { RoomProvider } from '@/liveblocks.config';

// Dynamic imports for heavy components
const EnhancedIntelliSense = dynamic(() => import('./EnhancedIntelliSense'), {
  ssr: false,
  loading: () => null
});

const CodeAnalysisFeatures = dynamic(() => import('./CodeAnalysisFeatures'), {
  ssr: false,
  loading: () => null
});

const CollaborativeEditor = dynamic(() => import('./CollaborativeEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300 text-lg">Loading Collaborative Editor...</p>
        <p className="text-gray-500 text-sm mt-2">Initializing real-time features...</p>
      </div>
    </div>
  )
});

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300 text-sm">Loading Monaco Editor...</p>
      </div>
    </div>
  )
});

const UnifiedMonacoEditor = ({ selectedFile, roomid, projectFiles = [] }) => {
  const [editorValue, setEditorValue] = useState("// Welcome to CodeDev Unified Collaborative Editor\n// ✨ All features integrated: IntelliSense, Real-time Collaboration, Code Analysis\n// 🚀 Start coding with enhanced productivity!\n\nconsole.log('Hello World!');\n\nfunction example() {\n  return 'Advanced Monaco Editor Ready!';\n}");
  const [language, setLanguage] = useState("javascript");
  const [showAnalysisMode, setShowAnalysisMode] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [isCollaborativeMode, setIsCollaborativeMode] = useState(true);
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Theme options
  const themes = [
    { id: 'vs-dark', name: 'Dark', icon: '🌙' },
    { id: 'vs', name: 'Light', icon: '☀️' },
    { id: 'hc-black', name: 'High Contrast', icon: '🎯' },
  ];

  // Update language based on selected file extension
  useEffect(() => {
    if (selectedFile && selectedFile.name) {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      const languageMap = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'md': 'markdown',
        'txt': 'plaintext',
        'yml': 'yaml',
        'yaml': 'yaml',
        'xml': 'xml',
        'sql': 'sql'
      };
      setLanguage(languageMap[extension] || 'javascript');
    }
  }, [selectedFile]);

  // Load file content when selectedFile changes
  useEffect(() => {
    const fetchFileContent = async () => {
      if (selectedFile && selectedFile.id && selectedFile.type === 'file') {
        try {
          console.log(`📥 Fetching content for file: ${selectedFile.name} (ID: ${selectedFile.id})`);
          
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/file/${selectedFile.id}`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.file) {
            console.log(`✅ Loaded file content: ${data.file.name} (${data.file.content?.length || 0} chars)`);
            setEditorValue(data.file.content || '');
          } else {
            console.error('❌ Failed to load file content:', data.error);
            setEditorValue(`// Error loading ${selectedFile.name}\n// ${data.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('❌ Error fetching file content:', error);
          setEditorValue(`// Error loading ${selectedFile.name}\n// ${error.message}`);
        }
      }
    };
    
    fetchFileContent();
  }, [selectedFile]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Enhanced editor configuration with all features
    editor.updateOptions({
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
      },
      // Collaboration features
      renderValidationDecorations: 'on',
      occurrencesHighlight: true,
      selectionHighlight: true,
      colorDecorators: true
    });
  };

  const handleEditorChange = (value) => {
    setEditorValue(value || "");
  };

  const SettingsPanel = () => (
    <div className="absolute top-16 right-4 bg-gray-800 rounded-lg p-4 shadow-xl z-50 min-w-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white font-medium">Editor Settings</h4>
        <button
          onClick={() => setShowSettings(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Theme</label>
          <div className="grid grid-cols-1 gap-2">
            {themes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id)}
                className={`p-2 rounded text-sm flex items-center gap-2 transition-colors ${
                  theme === themeOption.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{themeOption.icon}</span>
                {themeOption.name}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Font Size</label>
          <input
            type="range"
            min="10"
            max="24"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-400 mt-1">{fontSize}px</div>
        </div>

        {/* Mode Toggle */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Editor Mode</label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCollaborativeMode(true)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                isCollaborativeMode
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🤝 Collaborative
            </button>
            <button
              onClick={() => setIsCollaborativeMode(false)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                !isCollaborativeMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ⚡ Solo
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditor = () => {
    if (showAnalysisMode) {
      // Analysis Mode - Enhanced editor with code analysis
      return (
        <div className="relative h-full">
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={editorValue}
            theme={theme}
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
          
          {/* Code Analysis Features */}
          {editorRef.current && monacoRef.current && (
            <CodeAnalysisFeatures
              editor={editorRef.current}
              monaco={monacoRef.current}
              language={language}
              code={editorValue}
              onErrorsDetected={(errors) => console.log('Errors detected:', errors)}
              onWarningsDetected={(warnings) => console.log('Warnings detected:', warnings)}
            />
          )}
        </div>
      );
    }

    if (isCollaborativeMode) {
      // Collaborative Mode - Full-featured editor with real-time collaboration
      return (
        <RoomProvider id={roomid} initialPresence={{ cursor: null, username: null, selection: null }}>
          <CollaborativeEditor
            selectedFile={selectedFile}
            roomid={roomid}
            projectFiles={projectFiles}
            language={language}
            theme={theme}
            fontSize={fontSize}
            onEditorMount={handleEditorDidMount}
            initialContent={editorValue}
          />
        </RoomProvider>
      );
    } else {
      // Solo Mode - Advanced editor with IntelliSense
      return (
        <div className="relative h-full">
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={editorValue}
            theme={theme}
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
          {editorRef.current && monacoRef.current && (
            <EnhancedIntelliSense
              editor={editorRef.current}
              monaco={monacoRef.current}
              language={language}
              projectFiles={projectFiles}
            />
          )}
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header with file info and controls */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">
              {selectedFile?.name || 'unified-editor.js'}
            </span>
            <div className="px-2 py-1 bg-blue-600 rounded text-xs text-white">
              {language.toUpperCase()}
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setShowAnalysisMode(false)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                !showAnalysisMode
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🚀 Unified
            </button>
            <button
              onClick={() => setShowAnalysisMode(true)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                showAnalysisMode
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔍 Analysis
            </button>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Room: {roomid} | {showAnalysisMode ? 'Code Analysis Mode' : isCollaborativeMode ? 'Collaborative Mode' : 'Solo Mode'}
          </span>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            ⚙️ Settings
          </button>
        </div>
      </div>
      
      {/* Monaco Editor with integrated features */}
      <div className="flex-1 relative">
        {renderEditor()}
        
        {/* Settings Panel */}
        {showSettings && <SettingsPanel />}
      </div>
    </div>
  );
};

export default UnifiedMonacoEditor;