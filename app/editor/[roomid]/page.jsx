'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import io from 'socket.io-client';
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  Play, 
  Save, 
  Users, 
  Terminal as TerminalIcon,
  Settings,
  Palette,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

// Dynamic imports for client-side components
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const XTermWrapper = dynamic(() => import('./XTermWrapper_test'), { ssr: false });

export default function EditorPage() {
  const params = useParams();
  const roomId = params?.roomid;
  
  // Core state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('// Welcome to CodeDev\n// Select a file to start editing...');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showTerminal, setShowTerminal] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProjectLoaded, setIsProjectLoaded] = useState(false);
  
  // Enhanced editor state
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState('on');
  const [showSettings, setShowSettings] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  
  // Refs to prevent re-connections
  const socketRef = useRef(null);
  const mountedRef = useRef(true);
  const editorRef = useRef(null);

  // Language detection based on file extension
  const getLanguageFromFileName = (fileName) => {
    if (!fileName) return 'plaintext';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'html',
      'htm': 'html',
      'xml': 'xml',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'r': 'r',
      'mat': 'matlab',
      'pl': 'perl',
      'lua': 'lua',
      'vim': 'vim'
    };
    
    return languageMap[extension] || 'plaintext';
  };

  // Available themes
  const themes = [
    { value: 'vs-dark', name: 'Dark (VS Code)', icon: Moon },
    { value: 'vs', name: 'Light (VS Code)', icon: Sun },
    { value: 'hc-black', name: 'High Contrast Dark', icon: Monitor }
  ];

  // Enhanced editor options
  const getEditorOptions = () => ({
    minimap: { enabled: showMinimap },
    fontSize: fontSize,
    lineNumbers: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: wordWrap,
    cursorStyle: 'line',
    cursorBlinking: 'blink',
    renderWhitespace: 'boundary',
    rulers: [80, 120],
    folding: true,
    foldingStrategy: 'indentation',
    showFoldingControls: 'mouseover',
    unfoldOnClickAfterEndOfLine: false,
    selectionHighlight: true,
    occurrencesHighlight: true,
    find: {
      autoFindInSelection: 'always',
      addExtraSpaceOnTop: true
    },
    suggest: {
      insertMode: 'replace',
      filterGraceful: true,
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showConstructors: true,
      showFields: true,
      showVariables: true,
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
      other: true,
      comments: false,
      strings: false
    },
    quickSuggestionsDelay: 10,
    parameterHints: {
      enabled: true,
      cycle: true
    },
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoSurround: 'languageDefined',
    bracketPairColorization: {
      enabled: true
    },
    guides: {
      bracketPairs: 'active',
      indentation: true
    },
    smoothScrolling: true,
    mouseWheelZoom: true,
    contextmenu: true,
    links: true,
    colorDecorators: true,
    lightbulb: {
      enabled: true
    },
    codeActionsOnSave: {
      source: {
        organizeImports: true
      }
    }
  });

  // Initialize socket connection - ONCE
  useEffect(() => {
    if (!roomId || socketRef.current) return;

    console.log('🚀 Initializing connection for room:', roomId);

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      if (!mountedRef.current) return;
      console.log('✅ Connected to server');
      setIsConnected(true);
      newSocket.emit('join-room', roomId);
    });

    newSocket.on('disconnect', () => {
      if (!mountedRef.current) return;
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    // Project data events
    newSocket.on('project-loaded', (data) => {
      if (!mountedRef.current) return;
      console.log('📂 Project loaded:', data);
      setProject(data.project);
      setFiles(data.files || []);
      setIsProjectLoaded(true); // Mark project as loaded
      
      // Auto-expand folders that have content (recursive)
      if (data.files && data.files.length > 0) {
        const foldersToExpand = new Set();
        
        const expandFoldersWithContent = (items) => {
          items.forEach(item => {
            if (item.type === 'folder' && item.children && item.children.length > 0) {
              foldersToExpand.add(item.path);
              // Recursively expand nested folders
              expandFoldersWithContent(item.children);
            }
          });
        };
        
        expandFoldersWithContent(data.files);
        setExpandedFolders(foldersToExpand);
        console.log('📁 Auto-expanded folders:', Array.from(foldersToExpand));
      }
    });

    // File content events
    newSocket.on('file-content', (data) => {
      if (!mountedRef.current) return;
      console.log('📄 File content received:', data.path);
      setCode(data.content);
      setSelectedFile(data.path);
      setCurrentLanguage(getLanguageFromFileName(data.path));
      setHasUnsavedChanges(false); // Reset unsaved changes when loading new file
    });

    // File save confirmation
    newSocket.on('file-saved', (data) => {
      if (!mountedRef.current) return;
      console.log('💾 File saved successfully:', data.path);
      setHasUnsavedChanges(false);
      setIsSaving(false);
    });

    // Folder expansion events
    newSocket.on('folder-content', (data) => {
      if (!mountedRef.current) return;
      console.log('📁 Folder content received:', data.path, data.children);
      
      // Update the files array with the expanded folder's children
      setFiles(prevFiles => {
        const updateFileTree = (items) => {
          return items.map(item => {
            if (item.path === data.path && item.type === 'folder') {
              return { ...item, children: data.children };
            } else if (item.children) {
              return { ...item, children: updateFileTree(item.children) };
            }
            return item;
          });
        };
        return updateFileTree(prevFiles);
      });
    });

    // Error handlers
    newSocket.on('file-error', (data) => {
      if (!mountedRef.current) return;
      console.error('📄 File error:', data.error);
    });

    newSocket.on('folder-error', (data) => {
      if (!mountedRef.current) return;
      console.error('📁 Folder error:', data.error);
    });

    // Cleanup
    return () => {
      mountedRef.current = false;
      if (newSocket) {
        console.log('🧹 Cleaning up socket');
        newSocket.disconnect();
      }
      socketRef.current = null;
    };
  }, [roomId]);

  // Save function
  const handleSave = async () => {
    if (!socket || !isConnected || !selectedFile || !hasUnsavedChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    console.log('💾 Saving file:', selectedFile);
    
    try {
      socket.emit('write-file', {
        roomId,
        filePath: selectedFile,
        content: code
      });
    } catch (error) {
      console.error('❌ Save error:', error);
      setIsSaving(false);
    }
  };

  // Keyboard shortcut for save (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, hasUnsavedChanges, isSaving, socket, isConnected, code, roomId]);

  // File tree rendering
  const renderFileTree = (items, level = 0) => {
    if (!items || items.length === 0) {
      return (
        <div className="p-4 text-gray-400 text-sm">
          {isConnected ? 'No files in project' : 'Connecting...'}
        </div>
      );
    }

    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
        {item.type === 'folder' ? (
          <div>
            <div
              className="flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm"
              onClick={() => {
                const newExpanded = new Set(expandedFolders);
                if (newExpanded.has(item.path)) {
                  newExpanded.delete(item.path);
                } else {
                  newExpanded.add(item.path);
                  // Load folder contents if not already loaded
                  if (socket && isConnected && (!item.children || item.children.length === 0)) {
                    console.log('📁 Requesting folder:', item.path);
                    socket.emit('read-folder', { roomId, folderPath: item.path });
                  }
                }
                setExpandedFolders(newExpanded);
              }}
            >
              {expandedFolders.has(item.path) ? (
                <FolderOpen className="w-4 h-4 text-blue-400" />
              ) : (
                <Folder className="w-4 h-4 text-blue-400" />
              )}
              <span className="text-gray-300">{item.name}</span>
            </div>
            {expandedFolders.has(item.path) && item.children && (
              <div>
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm ${
              selectedFile === item.path ? 'bg-blue-900' : ''
            }`}
            onClick={() => {
              if (socket && isConnected) {
                console.log('📄 Requesting file:', item.path);
                setSelectedFile(item.path);
                setCurrentLanguage(getLanguageFromFileName(item.path));
                socket.emit('read-file', { roomId, filePath: item.path });
              }
            }}
          >
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              {item.name}
              {selectedFile === item.path && hasUnsavedChanges && (
                <span className="text-orange-400 ml-1">*</span>
              )}
            </span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="h-12 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white">CodeDev</h1>
          {project && (
            <span className="text-sm text-gray-400">• {project.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Theme Toggle */}
          <div className="flex items-center gap-1 bg-[#21262d] rounded-lg p-1">
            {themes.map(theme => {
              const IconComponent = theme.icon;
              return (
                <button
                  key={theme.value}
                  onClick={() => setEditorTheme(theme.value)}
                  className={`p-1 rounded transition-colors ${
                    editorTheme === theme.value 
                      ? 'bg-[#00ff88] text-black' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  title={theme.name}
                >
                  <IconComponent className="w-3 h-3" />
                </button>
              );
            })}
          </div>

          {/* Save Button */}
          {selectedFile && (
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              title={`Save ${selectedFile} (Ctrl+S)`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}
            </button>
          )}
          
          {/* Terminal Toggle */}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-2 rounded hover:bg-gray-700 ${showTerminal ? 'text-blue-400' : 'text-gray-400'}`}
            title="Toggle Terminal"
          >
            <TerminalIcon className="w-4 h-4" />
          </button>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - File Explorer */}
        <div className="w-64 bg-[#161b22] border-r border-gray-800 flex flex-col">
          <div className="h-10 bg-[#21262d] border-b border-gray-800 flex items-center px-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Explorer</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderFileTree(files)}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="h-10 bg-[#21262d] border-b border-gray-800 flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Editor</span>
              {selectedFile && (
                <span className="text-xs text-gray-500">
                  • {currentLanguage} • {selectedFile.split('/').pop()}
                  {hasUnsavedChanges && <span className="text-orange-400 ml-1">●</span>}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 rounded hover:bg-gray-700 text-gray-400"
                title="Editor Settings"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Editor Settings Panel */}
          {showSettings && (
            <div className="h-40 bg-[#0d1117] border-b border-gray-800 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                {/* Theme Selection */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Theme</label>
                  <select
                    value={editorTheme}
                    onChange={(e) => setEditorTheme(e.target.value)}
                    className="w-full bg-[#1a1a2e] border border-gray-700 rounded text-xs text-white p-1"
                  >
                    {themes.map(theme => (
                      <option key={theme.value} value={theme.value}>{theme.name}</option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Font Size</label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{fontSize}px</span>
                </div>

                {/* Word Wrap */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Word Wrap</label>
                  <select
                    value={wordWrap}
                    onChange={(e) => setWordWrap(e.target.value)}
                    className="w-full bg-[#1a1a2e] border border-gray-700 rounded text-xs text-white p-1"
                  >
                    <option value="off">Off</option>
                    <option value="on">On</option>
                    <option value="bounded">Bounded</option>
                  </select>
                </div>

                {/* Minimap */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Minimap</label>
                  <button
                    onClick={() => setShowMinimap(!showMinimap)}
                    className={`w-full p-1 rounded text-xs ${
                      showMinimap 
                        ? 'bg-[#00ff88] text-black' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {showMinimap ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className={`${showTerminal ? 'flex-1' : 'h-full'}`}>
            {selectedFile ? (
              <MonacoEditor
                height="100%"
                language={currentLanguage}
                theme={editorTheme}
                value={code}
                onChange={(value) => {
                  setCode(value || '');
                  setHasUnsavedChanges(true); // Mark as unsaved when content changes
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                  
                  // Add custom keybindings
                  editor.addCommand(
                    editor.createContextKey('alwaysTrue', true),
                    () => handleSave(),
                    'ctrl+s'
                  );
                  
                  // Enhanced IntelliSense for JavaScript/TypeScript
                  if (['javascript', 'typescript'].includes(currentLanguage)) {
                    // Register additional completion providers
                    editor.onDidChangeModelContent(() => {
                      // Trigger suggestions automatically
                      editor.trigger('', 'editor.action.triggerSuggest', {});
                    });
                  }
                }}
                options={getEditorOptions()}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Welcome to CodeDev</p>
                  <p>Select a file from the explorer to start editing</p>
                  {project && (
                    <p className="text-sm text-gray-400 mt-2">
                      Project: {project.name}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-64 bg-[#0d1117] border-t border-gray-800">
              <div className="h-8 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-3">
                <div className="flex items-center">
                  <TerminalIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Terminal</span>
                </div>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="h-[calc(100%-2rem)]">
                {socket && isConnected ? (
                  <XTermWrapper 
                    socket={socket} 
                    roomId={roomId} 
                    isConnected={isConnected}
                    isProjectLoaded={isProjectLoaded}
                  />
                ) : (
                  <div className="p-4 text-gray-400 text-sm">
                    Connecting to terminal...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
