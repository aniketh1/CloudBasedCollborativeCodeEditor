'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';
import { 
  Menu, 
  MoreHorizontal, 
  Minus, 
  X, 
  Copy, 
  Folder, 
  FileText, 
  Layout, 
  GitBranch,
  FilePlus,
  FolderPlus
} from 'lucide-react';
import FileExplorer from '@/components/FileExplorer';
import XtermTerminal from '@/components/Terminal';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const socket = io('http://localhost:3001');

export default function EditorRoomPage() {
  const { roomId } = useParams();
  const editorRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [contextMenuItem, setContextMenuItem] = useState(null);
  const [activeTab, setActiveTab] = useState('explorer');
  const [openTabs, setOpenTabs] = useState([]);

  const [files, setFiles] = useState([
    { name: 'index.js', type: 'file', content: '// index.js content' },
    { name: 'App.jsx', type: 'file', content: '// App.jsx content' },
    {
      name: 'components',
      type: 'folder',
      children: [
        { name: 'Navbar.jsx', type: 'file', content: '// Navbar.jsx content' },
        { name: 'Editor.jsx', type: 'file', content: '// Editor.jsx content' },
      ],
    },
  ]);

  const handleCreate = (type, parentFolder = null) => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    setFiles(prevFiles => {
      // If no parent folder, add to root
      if (!parentFolder) {
        return type === 'file'
          ? [...prevFiles, { name, type: 'file', content: '' }]
          : [...prevFiles, { name, type: 'folder', children: [] }];
      }

      // Find and update the parent folder
      return prevFiles.map(item => {
        if (item.type === 'folder' && item.name === parentFolder.name) {
          if (type === 'file') {
            return {
              ...item,
              children: [
                ...(item.children || []),
                { name, type: 'file', content: '' }
              ]
            };
          }
          return {
            ...item,
            children: [
              ...(item.children || []),
              { name, type: 'folder', children: [] }
            ]
          };
        }
        return item;
      });
    });

    // Close context menu
    setContextMenuPosition(null);
    setContextMenuItem(null);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuItem(item);
  };

  const handleCloseContextMenu = () => {
    setContextMenuPosition(null);
    setContextMenuItem(null);
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('// Start coding...');

  const handleEditorChange = (value) => {
    setCode(value);
    socket.emit('code-change', { roomId, code: value });

    if (!selectedFile) return;

    // Update the content in files
    setFiles((prevFiles) => {
      // Helper function to recursively update files
      const updateFileContent = (items) => {
        return items.map(item => {
          if (item.type === 'folder') {
            return {
              ...item,
              children: updateFileContent(item.children)
            };
          }
          
          if (item.name === selectedFile.name) {
            return { ...item, content: value };
          }
          
          return item;
        });
      };

      return updateFileContent(prevFiles);
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedFile && mounted) {
      const defaultFile = findFirstFile(files);
      if (defaultFile) {
        setSelectedFile(defaultFile);
        setCode(defaultFile.content);
      }
    }
  }, [mounted, selectedFile, files]);

  useEffect(() => {
    if (!mounted) return;

    socket.emit('join-room', roomId);
    socket.on('code-update', (incomingCode) => {
      if (incomingCode !== code) {
        setCode(incomingCode);
      }
    });

    // Add click listener to close context menu when clicking outside
    const handleClickOutside = () => {
      handleCloseContextMenu();
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      socket.disconnect();
      document.removeEventListener('click', handleClickOutside);
    };
  }, [mounted, roomId]);

  // Recursive function to find the first file in the file structure
  const findFirstFile = (fileList) => {
    for (const item of fileList) {
      if (item.type === 'file') return item;
      if (item.type === 'folder' && item.children) {
        const nestedFile = findFirstFile(item.children);
        if (nestedFile) return nestedFile;
      }
    }
    return null;
  };

  const handleFileSelect = (file) => {
    // Recursive function to find the full file object
    const findFullFile = (fileList) => {
      for (const item of fileList) {
        if (item.type === 'file' && item.name === file.name) return item;
        if (item.type === 'folder' && item.children) {
          const nestedFile = item.children.find(child => child.name === file.name);
          if (nestedFile) return nestedFile;
        }
      }
      return null;
    };

    const fullFile = findFullFile(files);
    
    if (fullFile) {
      setSelectedFile(fullFile);
      setCode(fullFile.content || '');

      // Add to open tabs if not already open
      setOpenTabs(prevTabs => {
        const isAlreadyOpen = prevTabs.some(tab => tab.name === fullFile.name);
        return isAlreadyOpen 
          ? prevTabs 
          : [...prevTabs, fullFile];
      });
    }
  };

  const handleCloseTab = (file) => {
    setOpenTabs(prevTabs => prevTabs.filter(tab => tab.name !== file.name));
    
    // If closing the currently selected file, select another open tab or reset
    if (selectedFile?.name === file.name) {
      const remainingTabs = openTabs.filter(tab => tab.name !== file.name);
      if (remainingTabs.length > 0) {
        const newSelectedFile = remainingTabs[0];
        setSelectedFile(newSelectedFile);
        setCode(newSelectedFile.content || '');
      } else {
        setSelectedFile(null);
        setCode('// Start coding...');
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e]">
      {/* Top Bar */}
      <div className="h-10 bg-[#16161e] flex items-center justify-between drag">
        <div className="flex items-center">
          <div className="px-4 flex items-center space-x-4">
            <Menu className="w-5 h-5 text-gray-300" />
            <span className="text-sm">File Edit View Selection Help</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-2">
          <Minus className="w-5 h-5 text-gray-300 hover:bg-gray-700 rounded" />
          <X className="w-5 h-5 text-gray-300 hover:bg-red-600 rounded" />
        </div>
      </div>

      {/* Activity Bar and Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-16 bg-[#16161e] flex flex-col items-center pt-4 space-y-4">
          <button 
            className={`p-2 rounded ${activeTab === 'explorer' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            onClick={() => setActiveTab('explorer')}
            title="Explorer"
          >
            <Folder className="w-6 h-6" />
          </button>
          <button 
            className={`p-2 rounded ${activeTab === 'search' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            onClick={() => setActiveTab('search')}
            title="Search"
          >
            <Copy className="w-6 h-6" />
          </button>
          <button 
            className={`p-2 rounded ${activeTab === 'git' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            onClick={() => setActiveTab('git')}
            title="Source Control"
          >
            <GitBranch className="w-6 h-6" />
          </button>
          <button 
            className={`p-2 rounded ${activeTab === 'debug' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            onClick={() => setActiveTab('debug')}
            title="Run and Debug"
          >
            <Layout className="w-6 h-6" />
          </button>
        </div>

        {/* Side Bar */}
        {activeTab === 'explorer' && (
          <FileExplorer
            files={files}
            onSelect={handleFileSelect}
            selected={selectedFile}
            onCreate={handleCreate}
            onContextMenu={handleContextMenu}
          />
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="bg-[#1a1a2e] border-b border-gray-800 flex">
            {openTabs.map((tab) => (
              <div 
                key={tab.name} 
                className={`
                  flex items-center px-4 py-2 border-r border-gray-800 
                  ${selectedFile?.name === tab.name ? 'bg-[#16161e] text-white' : 'text-gray-400 hover:bg-[#16161e]'}
                  cursor-pointer
                `}
                onClick={() => {
                  setSelectedFile(tab);
                  setCode(tab.content || '');
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                {tab.name}
                <X 
                  className="w-4 h-4 ml-2 hover:bg-red-600 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab);
                  }}
                />
              </div>
            ))}
          </div>

          {/* Context Menu */}
          {contextMenuPosition && contextMenuItem && (
            <div 
              className="absolute z-50 bg-[#2a2a3a] border border-gray-700 rounded shadow-lg"
              style={{ 
                top: contextMenuPosition.y, 
                left: contextMenuPosition.x 
              }}
            >
              <ul className="py-1">
                <li 
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                  onClick={() => handleCreate('file', contextMenuItem.type === 'folder' ? contextMenuItem : null)}
                >
                  <FilePlus className="w-4 h-4" /> New File
                </li>
                <li 
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                  onClick={() => handleCreate('folder', contextMenuItem.type === 'folder' ? contextMenuItem : null)}
                >
                  <FolderPlus className="w-4 h-4" /> New Folder
                </li>
              </ul>
            </div>
          )}

          {/* Editor */}
          {mounted && selectedFile && (
            <MonacoEditor
              height="calc(100vh - 120px)"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              onMount={(editor) => (editorRef.current = editor)}
            />
          )}

          {/* Terminal */}
          <div className="h-32 border-t border-gray-800">
            <XtermTerminal />
          </div>
        </div>
      </div>
    </div>
  );
}