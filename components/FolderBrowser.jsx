'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FolderOpen, Folder, HardDrive, ArrowLeft, Home, X, Upload, FileText } from 'lucide-react';

export default function FolderBrowser({ isOpen, onClose, onSelectFolder }) {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadPath('');
    }
  }, [isOpen]);

  const loadPath = async (path) => {
    setLoading(true);
    setError('');
    
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/api/filesystem/browse?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentPath(data.currentPath);
        setItems(data.items);
        if (data.message) {
          console.log('📁 Workspace info:', data.message);
        }
      } else {
        setError(data.error || 'Failed to load directory');
      }
    } catch (error) {
      console.error('Error loading path:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'directory' || item.type === 'drive' || item.type === 'parent') {
      loadPath(item.path);
    }
  };

  const handleSelectCurrent = () => {
    if (currentPath) {
      onSelectFolder(currentPath);
      onClose();
    }
  };

  // Handle local folder upload
  const handleFolderUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      // Get project name from the first file's path
      const projectName = files[0].webkitRelativePath.split('/')[0] || 'uploaded-project';
      
      // Process files
      const fileData = await Promise.all(
        files.map(async (file) => {
          const content = await readFileAsBase64(file);
          return {
            path: file.webkitRelativePath.replace(`${projectName}/`, ''),
            content: content.split(',')[1], // Remove data:type;base64, prefix
            name: file.name,
            size: file.size
          };
        })
      );

      // Upload to backend
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/api/filesystem/upload-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName,
          files: fileData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Reload the current path to show the uploaded project
        await loadPath('');
        alert(`Project "${projectName}" uploaded successfully!`);
      } else {
        setError(result.error || 'Failed to upload project');
      }
    } catch (error) {
      console.error('Error uploading project:', error);
      setError('Failed to upload project');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to read file as base64
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const triggerFolderUpload = () => {
    fileInputRef.current?.click();
  };

  const getItemIcon = (item) => {
    switch (item.type) {
      case 'drive':
        return <HardDrive className="w-4 h-4 text-blue-400" />;
      case 'parent':
        return <ArrowLeft className="w-4 h-4 text-gray-400" />;
      case 'file':
        return <FileText className="w-4 h-4 text-green-400" />;
      default:
        return <Folder className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] bg-[#16161e] border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#00ff88]" />
            <h2 className="text-lg font-semibold text-white">Select Project Folder</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={triggerFolderUpload}
              disabled={isUploading}
              variant="outline"
              size="sm"
              className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Folder'}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hidden file input for folder upload */}
        <input
          ref={fileInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
          onChange={handleFolderUpload}
          accept="*"
        />

        {/* Current Path */}
        <div className="p-4 border-b border-gray-800 bg-[#1a1a2e]">
          <div className="flex items-center gap-2 text-sm">
            <Home className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">
              {currentPath || 'Workspace - Upload local folders or browse existing projects'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ff88]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
              <Button 
                onClick={() => loadPath('')} 
                className="mt-2"
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#1a1a2e] rounded-lg transition-colors"
                >
                  {getItemIcon(item)}
                  <span className="text-white">{item.name}</span>
                  {item.type === 'drive' && (
                    <span className="text-xs text-gray-400 ml-auto">Drive</span>
                  )}
                </button>
              ))}
              
              {items.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-400">
                  <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No projects found in workspace</p>
                  <p className="text-sm mb-4">Upload a local folder to get started</p>
                  <Button
                    onClick={triggerFolderUpload}
                    disabled={isUploading}
                    variant="outline"
                    className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Local Folder
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-gray-700 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSelectCurrent}
            disabled={!currentPath}
            className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90"
          >
            Select This Folder
          </Button>
        </div>
      </Card>
    </div>
  );
}
