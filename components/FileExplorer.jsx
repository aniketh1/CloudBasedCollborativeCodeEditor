'use client';
import { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, File, FolderPlus, FilePlus } from 'lucide-react';

// Recursive component to render file tree
const FileTreeItem = ({ 
  item, 
  depth = 0, 
  onSelect, 
  selected, 
  onContextMenu,
  onToggleExpand 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    onToggleExpand?.(item);
  };

  const renderIcon = () => {
    if (item.type === 'folder') {
      return isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />;
    }
    return null;
  };

  const getFileIcon = () => {
    if (item.type === 'folder') {
      return isExpanded ? <Folder className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />;
    }
    return <FileText className="w-4 h-4 text-blue-200" />;
  };

  return (
    <div>
      <div 
        className={`
          flex items-center cursor-pointer hover:bg-gray-700 
          ${selected?.name === item.name ? 'bg-gray-700' : ''}
          pl-${depth * 4} text-sm py-0.5 group
        `}
        onContextMenu={(e) => onContextMenu(e, item)}
        onClick={() => item.type === 'file' && onSelect(item)}
      >
        {item.type === 'folder' && (
          <div 
            className="mr-1 flex items-center hover:bg-gray-600 rounded"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
          >
            {renderIcon()}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {getFileIcon()}
          <span className={`
            ${selected?.name === item.name ? 'text-white' : 'text-gray-300'}
            group-hover:text-white
          `}>
            {item.name}
          </span>
        </div>
      </div>

      {item.type === 'folder' && isExpanded && item.children && (
        <div>
          {item.children.map((child, index) => (
            <FileTreeItem
              key={index}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
              selected={selected}
              onContextMenu={onContextMenu}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function FileExplorer({ 
  files, 
  onSelect, 
  selected, 
  onCreate, 
  onContextMenu 
}) {
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    onContextMenu(e, item);
  };

  return (
    <div className="bg-[#1a1a2e] text-white w-64 h-full flex flex-col border-r border-gray-800">
      {/* Explorer header */}
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#16161e] border-b border-gray-800 flex items-center justify-between">
        <span>Explorer</span>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onCreate('file', null)}
            className="hover:bg-gray-700 rounded p-1 transition"
            title="New File"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onCreate('folder', null)}
            className="hover:bg-gray-700 rounded p-1 transition"
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.map((item, index) => (
          <FileTreeItem
            key={index}
            item={item}
            onSelect={onSelect}
            selected={selected}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>
    </div>
  );
}