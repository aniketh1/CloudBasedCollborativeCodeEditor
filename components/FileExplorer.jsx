'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  FolderOpen,
  FilePlus, 
  FolderPlus, 
  Trash2,
  File,
  Edit,
  Save,
  X
} from 'lucide-react';

// File type icons mapping
const getFileIcon = (fileName, isFolder = false, isExpanded = false) => {
  if (isFolder) {
    return isExpanded ? 
      <FolderOpen className="w-4 h-4 text-yellow-400" /> : 
      <Folder className="w-4 h-4 text-yellow-500" />;
  }

  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClass = "w-4 h-4";
  
  switch (ext) {
    case 'js':
    case 'jsx':
      return <div className={`${iconClass} bg-yellow-400 rounded text-black flex items-center justify-center text-xs font-bold`}>JS</div>;
    case 'ts':
    case 'tsx':
      return <div className={`${iconClass} bg-blue-500 rounded text-white flex items-center justify-center text-xs font-bold`}>TS</div>;
    case 'py':
      return <div className={`${iconClass} bg-green-500 rounded text-white flex items-center justify-center text-xs font-bold`}>PY</div>;
    case 'html':
      return <div className={`${iconClass} bg-orange-500 rounded text-white flex items-center justify-center text-xs font-bold`}>H</div>;
    case 'css':
      return <div className={`${iconClass} bg-blue-400 rounded text-white flex items-center justify-center text-xs font-bold`}>C</div>;
    case 'json':
      return <div className={`${iconClass} bg-yellow-600 rounded text-white flex items-center justify-center text-xs font-bold`}>J</div>;
    case 'md':
      return <div className={`${iconClass} bg-gray-600 rounded text-white flex items-center justify-center text-xs font-bold`}>M</div>;
    case 'txt':
      return <FileText className={`${iconClass} text-gray-400`} />;
    default:
      return <File className={`${iconClass} text-gray-300`} />;
  }
};

// Context menu component
const ContextMenu = ({ x, y, item, onClose, onAction }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div 
      className="fixed bg-gray-800 border border-gray-600 rounded shadow-lg z-50 py-1 min-w-32"
      style={{ left: x, top: y }}
    >
      {item.type === 'folder' && (
        <>
          <button
            className="w-full text-left px-3 py-1 hover:bg-gray-700 text-sm text-gray-200"
            onClick={() => onAction('newFile', item)}
          >
            <FilePlus className="w-3 h-3 inline mr-2" />
            New File
          </button>
          <button
            className="w-full text-left px-3 py-1 hover:bg-gray-700 text-sm text-gray-200"
            onClick={() => onAction('newFolder', item)}
          >
            <FolderPlus className="w-3 h-3 inline mr-2" />
            New Folder
          </button>
          <hr className="border-gray-600 my-1" />
        </>
      )}
      <button
        className="w-full text-left px-3 py-1 hover:bg-gray-700 text-sm text-gray-200"
        onClick={() => onAction('rename', item)}
      >
        <Edit className="w-3 h-3 inline mr-2" />
        Rename
      </button>
      <button
        className="w-full text-left px-3 py-1 hover:bg-gray-700 text-sm text-red-400"
        onClick={() => onAction('delete', item)}
      >
        <Trash2 className="w-3 h-3 inline mr-2" />
        Delete
      </button>
    </div>
  );
};

// Recursive component to render file tree
const FileTreeItem = ({ 
  item, 
  depth = 0, 
  onSelect, 
  selected, 
  onContextMenu,
  editingItem,
  editingName,
  onEditChange,
  onEditSave,
  onEditCancel
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const isEditing = editingItem?.id === item.id;

  return (
    <div>
      <div 
        className={`
          flex items-center cursor-pointer hover:bg-gray-700/50 
          ${selected?.id === item.id ? 'bg-blue-600/30 border-l-2 border-blue-400' : ''}
          text-sm py-1 group relative
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onContextMenu={(e) => !isEditing && onContextMenu(e, item)}
        onClick={() => !isEditing && item.type === 'file' && onSelect(item)}
      >
        {item.type === 'folder' && (
          <div 
            className="mr-1 flex items-center hover:bg-gray-600 rounded p-0.5 -ml-0.5"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
          >
            {isExpanded ? 
              <ChevronDown className="w-3 h-3 text-gray-400" /> : 
              <ChevronRight className="w-3 h-3 text-gray-400" />
            }
          </div>
        )}
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getFileIcon(item.name, item.type === 'folder', isExpanded)}
          
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditChange(e.target.value)}
                className="bg-gray-800 text-white px-1 py-0 text-sm border border-blue-500 rounded flex-1 min-w-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditSave();
                  if (e.key === 'Escape') onEditCancel();
                }}
                onBlur={onEditSave}
              />
              <button
                onClick={onEditSave}
                className="text-green-400 hover:text-green-300 p-0.5"
              >
                <Save className="w-3 h-3" />
              </button>
              <button
                onClick={onEditCancel}
                className="text-red-400 hover:text-red-300 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className={`
              ${selected?.id === item.id ? 'text-white' : 'text-gray-300'}
              group-hover:text-white truncate
            `}>
              {item.name}
            </span>
          )}
        </div>
      </div>

      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
              selected={selected}
              onContextMenu={onContextMenu}
              editingItem={editingItem}
              editingName={editingName}
              onEditChange={onEditChange}
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer({ 
  roomId,
  onSelect, 
  selected,
  onFileCreate,
  onFileDelete,
  onFileRename
}) {
  const [files, setFiles] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch file structure from backend
  const fetchFileStructure = useCallback(async () => {
    if (!roomId) return;
    
    try {
      setLoading(true);
      console.log('🔍 [FileExplorer] Fetching file structure for room:', roomId);
      console.log('🔍 [FileExplorer] Backend URL:', process.env.NEXT_PUBLIC_BACKEND_URL);
      console.log('🔍 [FileExplorer] Full URL:', `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/structure/${roomId}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/structure/${roomId}`);
      
      console.log('🔍 [FileExplorer] Response status:', response.status);
      console.log('🔍 [FileExplorer] Response headers:', {
        'content-type': response.headers.get('content-type'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin')
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FileExplorer] HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [FileExplorer] File structure response:', data);
      
      if (data.success) {
        // Transform flat structure to tree
        const tree = buildFileTree(data.structure);
        console.log('🌳 [FileExplorer] Built file tree with', tree.length, 'root items');
        setFiles(tree);
      } else {
        console.error('❌ [FileExplorer] Backend error:', data.error);
        setFiles([]);
      }
    } catch (error) {
      console.error('❌ [FileExplorer] Error fetching file structure:', error);
      console.error('❌ [FileExplorer] Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Check if it's a CORS error
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        console.error('🚨 [FileExplorer] Possible CORS error - check browser console Network tab');
      }
      
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Build tree structure from flat file/folder arrays
  const buildFileTree = (structure) => {
    const { files = [], folders = [] } = structure;
    const allItems = [...folders, ...files];
    const tree = [];
    const itemMap = new Map();

    // Create item map
    allItems.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Build tree
    allItems.forEach(item => {
      const treeItem = itemMap.get(item.id);
      if (item.parentFolderId) {
        const parent = itemMap.get(item.parentFolderId);
        if (parent) {
          parent.children.push(treeItem);
        } else {
          tree.push(treeItem);
        }
      } else {
        tree.push(treeItem);
      }
    });

    // Auto-select main file on first load (index.js, main.js, app.js, or first .js file)
    if (files.length > 0 && onSelect) {
      const mainFile = files.find(f => 
        f.name === 'index.js' || 
        f.name === 'main.js' || 
        f.name === 'app.js' ||
        f.name === 'index.py' ||
        f.name === 'main.py'
      ) || files.find(f => f.name.endsWith('.js')) || files[0];
      
      if (mainFile) {
        console.log(`🎯 Auto-selecting main file: ${mainFile.name}`);
        // Delay to ensure parent component is ready
        setTimeout(() => onSelect(mainFile), 100);
      }
    }

    // Sort items: folders first, then files, alphabetically
    const sortItems = (items) => {
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      items.forEach(item => {
        if (item.children) {
          sortItems(item.children);
        }
      });
    };

    sortItems(tree);
    return tree;
  };

  // Create new file or folder
  const handleCreate = async (type, parentFolder = null) => {
    const baseName = type === 'file' ? 'untitled.txt' : 'New Folder';
    let name = baseName;
    let counter = 1;

    // Generate unique name
    const checkExists = (items, name) => {
      return items.some(item => item.name === name);
    };

    const parentItems = parentFolder ? parentFolder.children : files;
    while (checkExists(parentItems, name)) {
      name = type === 'file' ? `untitled${counter}.txt` : `New Folder ${counter}`;
      counter++;
    }

    const parentPath = parentFolder ? parentFolder.path : '';
    const fullPath = parentPath + '/' + name;

    try {
      const userId = 'current-user'; // Replace with actual user ID
      const endpoint = type === 'file' 
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/save-file/${roomId}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/create-folder/${roomId}`;
      
      const bodyData = type === 'file' 
        ? { filePath: fullPath, content: '', userId }
        : { folderPath: fullPath, userId };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        await fetchFileStructure();
        if (onFileCreate) onFileCreate(name, type);
      }
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  // Delete file or folder
  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const endpoint = item.type === 'file'
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/delete-file/${roomId}`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/filesystem/delete-folder/${roomId}`;
      
      const bodyData = item.type === 'file'
        ? { filePath: item.path }
        : { folderPath: item.path };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (response.ok) {
        await fetchFileStructure();
        if (onFileDelete) onFileDelete(item.name, item.type);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Handle context menu actions
  const handleContextAction = async (action, item) => {
    setContextMenu(null);
    
    switch (action) {
      case 'newFile':
        await handleCreate('file', item);
        break;
      case 'newFolder':
        await handleCreate('folder', item);
        break;
      case 'rename':
        setEditingItem(item);
        setEditingName(item.name);
        break;
      case 'delete':
        await handleDelete(item);
        break;
    }
  };

  // Handle rename save
  const handleEditSave = async () => {
    if (!editingItem || !editingName.trim()) {
      setEditingItem(null);
      return;
    }

    // TODO: Implement rename API call
    console.log('Rename:', editingItem.name, 'to', editingName);
    
    setEditingItem(null);
    setEditingName('');
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditingName('');
  };

  // Initialize file structure
  useEffect(() => {
    fetchFileStructure();
  }, [fetchFileStructure]);

  return (
    <div className="bg-[#1e1e2e] text-white w-64 h-full flex flex-col border-r border-gray-700">
      {/* Explorer header */}
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-[#181825] border-b border-gray-700 flex items-center justify-between">
        <span className="text-gray-300">Explorer</span>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => handleCreate('file')}
            className="hover:bg-gray-600 rounded p-1 transition-colors"
            title="New File"
          >
            <FilePlus className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button 
            onClick={() => handleCreate('folder')}
            className="hover:bg-gray-600 rounded p-1 transition-colors"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            <p>No files yet</p>
            <button 
              onClick={() => handleCreate('file')}
              className="mt-2 text-blue-400 hover:text-blue-300 text-xs"
            >
              Create your first file
            </button>
          </div>
        ) : (
          files.map((item) => (
            <FileTreeItem
              key={item.id}
              item={item}
              onSelect={onSelect}
              selected={selected}
              onContextMenu={(e, item) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, item });
              }}
              editingItem={editingItem}
              editingName={editingName}
              onEditChange={setEditingName}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}