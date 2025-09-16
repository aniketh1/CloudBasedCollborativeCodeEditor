"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import of EnhancedIntelliSense
const EnhancedIntelliSense = dynamic(() => import('./EnhancedIntelliSense'), {
  ssr: false,
  loading: () => null // No loading UI, it's a provider
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

const MonacoEditor = ({ selectedFile, roomid, projectFiles = [] }) => {
  const [editorValue, setEditorValue] = useState("// Welcome to CodeDev Collaborative Editor\n// Start coding in JavaScript, TypeScript, Python, and more!\n\nconsole.log('Hello World!');\n\nfunction example() {\n  return 'Monaco Editor Ready!';\n}");
  const [language, setLanguage] = useState("javascript");
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showIntelliSense, setShowIntelliSense] = useState(false);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

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
    if (selectedFile && selectedFile.path && selectedFile.type === 'file') {
      // In a real implementation, you would fetch the file content from the backend
      // For now, we'll just show a placeholder
      setEditorValue(`// Content of ${selectedFile.name}\n// This would be loaded from the backend\n\nconsole.log('File: ${selectedFile.name}');`);
    }
  }, [selectedFile]);

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
      }
    });
  };

  const handleEditorChange = (value) => {
    setEditorValue(value || "");
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header with file info and language badge */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">
              {selectedFile?.name || 'welcome.js'}
            </span>
            <div className="px-2 py-1 bg-blue-600 rounded text-xs text-white">
              {language.toUpperCase()}
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-700 rounded-md p-1">
            <button
              onClick={() => {setShowAdvancedMode(false); setShowCollaboration(false); setShowIntelliSense(false);}}
              className={`px-2 py-1 text-xs rounded ${
                !showAdvancedMode && !showCollaboration && !showIntelliSense
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => {setShowAdvancedMode(true); setShowCollaboration(false); setShowIntelliSense(false);}}
              className={`px-2 py-1 text-xs rounded ${
                showAdvancedMode && !showCollaboration && !showIntelliSense
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Advanced
            </button>
            <button
              onClick={() => {setShowAdvancedMode(false); setShowCollaboration(true); setShowIntelliSense(false);}}
              className={`px-2 py-1 text-xs rounded ${
                showCollaboration && !showIntelliSense
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Collab
            </button>
            <button
              onClick={() => {setShowAdvancedMode(false); setShowCollaboration(false); setShowIntelliSense(true);}}
              className={`px-2 py-1 text-xs rounded ${
                showIntelliSense
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              IntelliSense
            </button>
          </div>
        </div>
        <div className="ml-auto text-xs text-gray-400">
          Room: {roomid} | {showIntelliSense ? 'Enhanced IntelliSense' : showCollaboration ? 'Collaborative Mode' : showAdvancedMode ? 'Advanced Mode' : 'Simple Mode'}
        </div>
      </div>
      
      {/* Monaco Editor */}
      <div className="flex-1 relative">
        {showAdvancedMode ? (
          <div className="h-full flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-white mb-2">Advanced Mode</h3>
              <p className="text-gray-400">AdvancedMonacoEditor has build issues</p>
              <p className="text-xs text-gray-500 mt-2">
                Skipping to next integration step...
              </p>
            </div>
          </div>
        ) : showCollaboration ? (
          <div className="h-full flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-white mb-2">Collaborative Mode</h3>
              <p className="text-gray-400">CollaborativeFeatures has framer-motion conflicts</p>
              <p className="text-xs text-gray-500 mt-2">
                Skipping due to build issues...
              </p>
            </div>
          </div>
        ) : showIntelliSense ? (
          <>
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language}
              value={editorValue}
              theme="vs-dark"
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                renderWhitespace: "selection"
              }}
            />
            {/* Enhanced IntelliSense Provider */}
            {editorRef.current && monacoRef.current && (
              <EnhancedIntelliSense
                editor={editorRef.current}
                monaco={monacoRef.current}
                language={language}
                projectFiles={projectFiles}
              />
            )}
          </>
        ) : (
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={editorValue}
            theme="vs-dark"
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderWhitespace: "selection"
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MonacoEditor;
