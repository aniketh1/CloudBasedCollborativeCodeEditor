"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300 text-lg">Loading Advanced Monaco Editor...</p>
        <p className="text-gray-500 text-sm mt-2">Initializing IntelliSense, themes, and advanced features...</p>
      </div>
    </div>
  )
});

// Advanced Monaco Editor with comprehensive features
const AdvancedMonacoEditor = ({ selectedFile, roomid, onFileContentChange }) => {
  // Editor state
  const [editorValue, setEditorValue] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('Fira Code');
  const [wordWrap, setWordWrap] = useState('on');
  const [minimap, setMinimap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState('on');
  const [folding, setFolding] = useState(true);
  const [bracketMatching, setBracketMatching] = useState('always');
  const [autoClosingBrackets, setAutoClosingBrackets] = useState('always');
  const [autoSave, setAutoSave] = useState(true);
  const [formatOnPaste, setFormatOnPaste] = useState(true);
  const [formatOnType, setFormatOnType] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [suggestions, setSuggestions] = useState(true);
  const [quickSuggestions, setQuickSuggestions] = useState(true);
  const [parameterHints, setParameterHints] = useState(true);
  const [showErrors, setShowErrors] = useState(true);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const isRemoteChange = useRef(false);
  const cursorDecorations = useRef([]);

  // Temporary placeholder for collaboration (will be enhanced later)
  const isConnected = false;
  const connectionError = null;
  const collaborators = [];
  const myId = 'user-1';
  const documentState = null;
  const sendCodeUpdate = () => {};
  const sendCursorUpdate = () => {};
  const getLineNumber = (content, offset) => {
    if (!content || offset === undefined) return 1;
    return content.substring(0, offset).split('\n').length;
  };

  // Advanced theme options
  const themes = [
    { id: 'vs-dark', name: 'Dark (Visual Studio)', icon: '🌙' },
    { id: 'vs', name: 'Light (Visual Studio)', icon: '☀️' },
    { id: 'hc-black', name: 'High Contrast Dark', icon: '🎯' },
    { id: 'github-dark', name: 'GitHub Dark', icon: '🐱' },
    { id: 'monokai', name: 'Monokai', icon: '🎨' },
    { id: 'solarized-dark', name: 'Solarized Dark', icon: '🌅' }
  ];

  // Font options
  const fontOptions = [
    'Fira Code',
    'JetBrains Mono',
    'Cascadia Code',
    'SF Mono',
    'Consolas',
    'Monaco',
    'Menlo',
    'Source Code Pro'
  ];

  // Language detection from file extension
  const getLanguageFromFile = useCallback((filename) => {
    if (!filename) return 'javascript';
    
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'kt': 'kotlin',
      'swift': 'swift',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'vue': 'html',
      'svelte': 'html',
      'txt': 'plaintext',
      'log': 'plaintext'
    };
    
    return languageMap[extension] || 'javascript';
  }, []);

  // Initialize editor with advanced configuration
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register custom themes
    monaco.editor.defineTheme('github-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f97583' },
        { token: 'number', foreground: '79b8ff' },
        { token: 'string', foreground: '9ecbff' }
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editorLineNumber.foreground': '#484f58',
        'editorCursor.foreground': '#c9d1d9'
      }
    });

    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f92672' },
        { token: 'number', foreground: 'ae81ff' },
        { token: 'string', foreground: 'e6db74' }
      ],
      colors: {
        'editor.background': '#272822',
        'editor.foreground': '#f8f8f2'
      }
    });

    monaco.editor.defineTheme('solarized-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
        { token: 'keyword', foreground: '859900' },
        { token: 'number', foreground: 'd33682' },
        { token: 'string', foreground: '2aa198' }
      ],
      colors: {
        'editor.background': '#002b36',
        'editor.foreground': '#839496'
      }
    });

    // Set theme
    monaco.editor.setTheme(theme);

    // Configure advanced editor options
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily: `'${fontFamily}', 'JetBrains Mono', 'Cascadia Code', monospace`,
      fontLigatures: true,
      fontWeight: '400',
      lineHeight: 1.6,
      letterSpacing: 0.5,
      minimap: { enabled: minimap },
      scrollBeyondLastLine: false,
      wordWrap: wordWrap,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
      smoothScrolling: true,
      padding: { top: 16, bottom: 16 },
      lineNumbers: lineNumbers,
      folding: folding,
      showFoldingControls: 'always',
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      },
      suggest: {
        enabled: suggestions,
        showKeywords: true,
        showSnippets: true,
        showFunctions: true,
        showConstructors: true,
        showFields: true,
        showVariables: true,
        showClasses: true,
        showStructs: true,
        showInterfaces: true,
        showModules: true,
        showProperties: true,
        showEvents: true,
        showOperators: true,
        showUnits: true,
        showValues: true,
        showConstants: true,
        showEnums: true,
        showEnumMembers: true,
        showColors: true,
        showFiles: true,
        showReferences: true,
        showFolders: true,
        showTypeParameters: true
      },
      quickSuggestions: {
        other: quickSuggestions,
        comments: false,
        strings: quickSuggestions
      },
      parameterHints: { enabled: parameterHints },
      autoClosingBrackets: autoClosingBrackets,
      autoClosingQuotes: 'always',
      autoSurround: 'languageDefined',
      formatOnPaste: formatOnPaste,
      formatOnType: formatOnType,
      multiCursorModifier: 'ctrlCmd',
      selectionHighlight: true,
      occurrencesHighlight: true,
      codeLens: true,
      hover: { enabled: true },
      contextmenu: true,
      mouseWheelZoom: true,
      links: true,
      colorDecorators: true,
      lightbulb: { enabled: true }
    });

    // Enhanced IntelliSense for different languages
    if (language === 'javascript' || language === 'typescript') {
      // Add JavaScript/TypeScript specific completions
      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: (model, position) => {
          const suggestions = [
            {
              label: 'console.log',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'console.log(${1:value});',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Log a message to the console'
            },
            {
              label: 'function',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'function ${1:name}(${2:params}) {\n\t${3:// code}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a function'
            },
            {
              label: 'async function',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'async function ${1:name}(${2:params}) {\n\t${3:// code}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create an async function'
            },
            {
              label: 'try-catch',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'try {\n\t${1:// code}\n} catch (${2:error}) {\n\t${3:// handle error}\n}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Try-catch block'
            },
            {
              label: 'React Component',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'import React from \'react\';\n\nconst ${1:ComponentName} = () => {\n\treturn (\n\t\t<div>\n\t\t\t${2:// JSX content}\n\t\t</div>\n\t);\n};\n\nexport default ${1:ComponentName};',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a React functional component'
            }
          ];
          return { suggestions };
        }
      });
    }

    // Add Python-specific completions
    if (language === 'python') {
      monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: () => {
          const suggestions = [
            {
              label: 'print',
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: 'print(${1:value})',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Print a value to the console'
            },
            {
              label: 'def',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Define a function'
            },
            {
              label: 'class',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, params}):\n\t\t${3:pass}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Create a class'
            },
            {
              label: 'if __name__ == "__main__"',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: 'if __name__ == "__main__":\n\t${1:main()}',
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: 'Main execution block'
            }
          ];
          return { suggestions };
        }
      });
    }

    // Handle content changes for collaboration
    editor.onDidChangeModelContent((event) => {
      if (!isRemoteChange.current) {
        const value = editor.getValue();
        setEditorValue(value);
        
        // Notify parent component of file changes
        if (onFileContentChange) {
          onFileContentChange(selectedFile?.name || 'untitled', value);
        }
        
        // Send to collaborators with debouncing
        clearTimeout(window.collaborationTimeout);
        window.collaborationTimeout = setTimeout(() => {
          sendCodeUpdate(value, selectedFile?.name || 'untitled.js');
        }, 300);

        // Auto-save functionality
        if (autoSave) {
          clearTimeout(window.autoSaveTimeout);
          window.autoSaveTimeout = setTimeout(() => {
            console.log('🔄 Auto-saving file:', selectedFile?.name);
            // Here you would implement actual file saving to backend
          }, 2000);
        }
      }
      isRemoteChange.current = false;
    });

    // Handle cursor position changes for collaboration
    editor.onDidChangeCursorPosition((event) => {
      const position = editor.getPosition();
      const offset = editor.getModel().getOffsetAt(position);
      
      clearTimeout(window.cursorTimeout);
      window.cursorTimeout = setTimeout(() => {
        sendCursorUpdate(offset, selectedFile?.name || 'untitled.js');
      }, 150);
    });

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      console.log('💾 Save command triggered');
      // Implement save functionality
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      editor.trigger('', 'editor.action.quickCommand');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
      editor.trigger('', 'editor.action.commentLine');
    });

    // Format document shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      editor.trigger('', 'editor.action.formatDocument');
    });

  }, [theme, fontSize, fontFamily, wordWrap, minimap, lineNumbers, folding, suggestions, quickSuggestions, parameterHints, autoClosingBrackets, formatOnPaste, formatOnType, autoSave, language, selectedFile, onFileContentChange, sendCodeUpdate, sendCursorUpdate]);

  // Sync with collaboration state
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

  // Update language when file changes
  useEffect(() => {
    if (selectedFile) {
      const detectedLanguage = getLanguageFromFile(selectedFile.name);
      setLanguage(detectedLanguage);
    }
  }, [selectedFile, getLanguageFromFile]);

  // Render collaborator cursors
  useEffect(() => {
    if (editorRef.current && monacoRef.current && collaborators.length > 0) {
      const decorations = collaborators.map(collaborator => {
        if (collaborator.cursorOffset && editorValue) {
          const position = editorRef.current.getModel().getPositionAt(collaborator.cursorOffset);
          return {
            range: new monacoRef.current.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            options: {
              className: `cursor-${collaborator.id}`,
              beforeContentClassName: `cursor-label-${collaborator.id}`,
              before: {
                content: collaborator.name,
                backgroundColor: collaborator.color,
                color: 'white'
              }
            }
          };
        }
        return null;
      }).filter(Boolean);

      cursorDecorations.current = editorRef.current.deltaDecorations(cursorDecorations.current, decorations);
    }
  }, [collaborators, editorValue]);

  // Settings panel component
  const SettingsPanel = () => (
    <div className="absolute top-12 right-4 w-80 bg-[#2d2d30] border border-[#3e3e42] rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-[#3e3e42]">
        <h3 className="text-white font-semibold flex items-center gap-2">
          ⚙️ Editor Settings
        </h3>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">Theme</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-2 text-white text-sm"
          >
            {themes.map(t => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Font Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Font Family</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-2 text-white text-sm"
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>
          
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
            <span className="text-xs text-gray-400">{fontSize}px</span>
          </div>
        </div>

        {/* Editor Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Minimap</span>
            <button
              onClick={() => setMinimap(!minimap)}
              className={`w-12 h-6 rounded-full transition-colors ${minimap ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${minimap ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Word Wrap</span>
            <button
              onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
              className={`w-12 h-6 rounded-full transition-colors ${wordWrap === 'on' ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${wordWrap === 'on' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Code Folding</span>
            <button
              onClick={() => setFolding(!folding)}
              className={`w-12 h-6 rounded-full transition-colors ${folding ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${folding ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Auto Save</span>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`w-12 h-6 rounded-full transition-colors ${autoSave ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${autoSave ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">IntelliSense</span>
            <button
              onClick={() => setSuggestions(!suggestions)}
              className={`w-12 h-6 rounded-full transition-colors ${suggestions ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${suggestions ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Format on Paste</span>
            <button
              onClick={() => setFormatOnPaste(!formatOnPaste)}
              className={`w-12 h-6 rounded-full transition-colors ${formatOnPaste ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formatOnPaste ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(false)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors"
        >
          Apply Settings
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#2d2d30] relative">
      {/* Enhanced Tab Bar */}
      <div className="h-12 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* File Tab with enhanced styling */}
          <div className="flex items-center gap-2 bg-[#1e1e1e] px-4 py-2 rounded-lg border border-[#3e3e42] shadow-sm">
            <div className="w-5 h-5 flex items-center justify-center">
              {selectedFile ? (
                language === 'javascript' ? '🟨' :
                language === 'typescript' ? '🔷' :
                language === 'python' ? '🐍' :
                language === 'html' ? '🌐' :
                language === 'css' ? '🎨' :
                language === 'json' ? '📄' : '📝'
              ) : '✨'}
            </div>
            <span className="text-sm text-gray-200 font-medium">
              {selectedFile?.name || 'untitled.js'}
            </span>
            {autoSave && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Auto-save enabled" />
            )}
          </div>
          
          {/* Language Badge with enhanced info */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#0e639c] to-[#1177bb] rounded-lg text-xs text-white shadow-sm">
            <span>⚡</span>
            <span className="font-medium">{language.toUpperCase()}</span>
          </div>

          {/* Feature indicators */}
          <div className="flex items-center gap-2 text-xs">
            {suggestions && <span className="text-green-400" title="IntelliSense Active">🧠</span>}
            {formatOnType && <span className="text-blue-400" title="Auto-formatting">✨</span>}
            {folding && <span className="text-purple-400" title="Code Folding">📁</span>}
          </div>
        </div>

        {/* Right side - Enhanced Controls */}
        <div className="flex items-center gap-4">
          {/* Collaboration Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'} shadow-lg`}></div>
              <span className="text-xs text-gray-400 font-medium">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            {/* Enhanced Collaborator Display */}
            {collaborators.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-400 font-medium">👥 {collaborators.length}</span>
                <div className="flex -space-x-2">
                  {collaborators.slice(0, 4).map((collab, index) => (
                    <div 
                      key={collab.id}
                      className="w-7 h-7 rounded-full border-2 border-gray-600 flex items-center justify-center text-xs font-bold shadow-lg hover:scale-110 transition-transform"
                      style={{ backgroundColor: collab.color }}
                      title={`${collab.name} - Line ${getLineNumber(editorValue, collab.cursorOffset)}`}
                    >
                      {collab.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {collaborators.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-gray-600 border-2 border-gray-600 flex items-center justify-center text-xs text-gray-300 font-bold">
                      +{collaborators.length - 4}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#3e3e42] rounded-lg transition-colors"
            title="Editor Settings"
          >
            ⚙️
          </button>

          {/* Connection Indicator */}
          <span className={`text-xs px-3 py-1 rounded-full ${isConnected ? 'text-green-400 bg-green-400/10' : 'text-gray-500 bg-gray-500/10'}`}>
            {isConnected ? '🟢 Real-time Sync' : '🔴 Offline Mode'}
          </span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          value={editorValue}
          onMount={handleEditorDidMount}
          theme={theme}
          options={{
            selectOnLineNumbers: true,
            automaticLayout: true,
            fontSize: fontSize,
            fontFamily: `'${fontFamily}', monospace`,
            fontLigatures: true,
            lineHeight: 1.6,
            minimap: { enabled: minimap },
            wordWrap: wordWrap,
            lineNumbers: lineNumbers,
            folding: folding
          }}
        />
        
        {/* Advanced Overlays */}
        {isConnected && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-[#0e639c] to-[#1177bb] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            🔄 Collaborative Mode
          </div>
        )}

        {connectionError && (
          <div className="absolute top-16 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
            ⚠️ {connectionError}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && <SettingsPanel />}
      </div>

      {/* Enhanced Status Bar */}
      <div className="h-7 bg-[#007acc] flex items-center justify-between px-4 text-xs text-white shrink-0">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1">
            <span>📁</span>
            Room: {roomid}
          </span>
          <span className="flex items-center gap-1">
            <span>🔤</span>
            {language}
          </span>
          <span className="flex items-center gap-1">
            <span>👥</span>
            {collaborators.length} online
          </span>
          {autoSave && (
            <span className="flex items-center gap-1 text-green-200">
              <span>💾</span>
              Auto-save: ON
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <span>UTF-8</span>
          <span>LF</span>
          <span>Spaces: 2</span>
          <span className="flex items-center gap-1">
            <span>🎨</span>
            {themes.find(t => t.id === theme)?.name || theme}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMonacoEditor;