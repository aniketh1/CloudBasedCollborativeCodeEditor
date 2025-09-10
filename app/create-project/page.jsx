'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FolderOpen, Plus, Code, Terminal, FileText } from 'lucide-react';
import FolderBrowser from '@/components/FolderBrowser';

export default function CreateProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    localPath: '',
    projectType: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [projectTypes, setProjectTypes] = useState([
    { value: 'general', name: 'General Project', description: 'Basic project setup', icon: FileText }
  ]);

  // Fetch available project templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/projects/templates');
        const data = await response.json();
        
        if (data.success) {
          const typesWithIcons = [
            { value: 'general', name: 'General Project', description: 'Basic project setup', icon: FileText },
            ...data.templates.map(template => ({
              ...template,
              icon: getIconForType(template.value)
            }))
          ];
          setProjectTypes(typesWithIcons);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };

    fetchTemplates();
  }, []);

  const getIconForType = (type) => {
    const iconMap = {
      nodejs: Code,
      react: Code,
      vue: Code,
      nextjs: Code,
      python: Terminal,
      angular: Code,
      java: Code,
      cpp: Code,
      go: Code,
      rust: Code,
      php: Code,
      ruby: Code
    };
    return iconMap[type] || Code;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectFolder = async () => {
    try {
      // Check if the File System Access API is supported
      if ('showDirectoryPicker' in window) {
        // Use modern File System Access API
        const directoryHandle = await window.showDirectoryPicker();
        // For security reasons, we can't get the full file system path
        // So we'll use the directory name and let the user confirm the path
        setFormData(prev => ({
          ...prev,
          localPath: `Selected: ${directoryHandle.name}` // This is just for display
        }));
        
        // Store the directory handle for potential future use
        setDirectoryHandle(directoryHandle);
      } else {
        // Show our custom folder browser as fallback
        setShowFolderBrowser(true);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled the dialog
        return;
      }
      console.error('Error selecting folder:', error);
      // Show our custom folder browser as fallback
      setShowFolderBrowser(true);
    }
  };

  const handleFolderSelected = (path) => {
    setFormData(prev => ({
      ...prev,
      localPath: path
    }));
    setShowFolderBrowser(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🚀 Creating project with data:', formData);

    try {
      const response = await fetch('http://localhost:3001/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: 'mock-user-id' // Replace with actual user ID when auth is implemented
        }),
      });

      const data = await response.json();
      console.log('📝 Project creation response:', data);

      if (data.success) {
        console.log('✅ Project created successfully, redirecting to:', `/editor/${data.roomId}`);
        // Redirect to the editor with the new project room
        router.push(`/editor/${data.roomId}`);
      } else {
        console.error('❌ Project creation failed:', data.error);
        setError(data.error || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
          <p className="text-gray-400">Set up a new collaborative coding project with local folder access</p>
        </div>

        <Card className="bg-[#16161e] border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Project Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter project name"
                className="bg-[#1a1a2e] border-gray-700 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter project description (optional)"
                rows={3}
                className="w-full px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-transparent"
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Project Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {projectTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, projectType: type.value }))}
                      className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                        formData.projectType === type.value
                          ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                          : 'border-gray-700 bg-[#1a1a2e] text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="text-xs text-center">{type.name}</span>
                      {type.description && (
                        <span className="text-xs text-gray-500 text-center">{type.description}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Local Folder Path */}
            <div>
              <label htmlFor="localPath" className="block text-sm font-medium mb-2">
                Local Folder Path *
              </label>
              <div className="flex gap-2">
                <Input
                  id="localPath"
                  name="localPath"
                  type="text"
                  required
                  value={formData.localPath}
                  onChange={handleInputChange}
                  placeholder="e.g., C:\\Users\\username\\projects\\my-project"
                  className="bg-[#1a1a2e] border-gray-700 text-white flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSelectFolder}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-[#1a1a2e]"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select the local folder where your project files are located. This will be the working directory for terminal commands.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-700 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !formData.name || !formData.localPath}
                className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90 flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Project
                  </div>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="border-gray-700 text-gray-300 hover:bg-[#1a1a2e]"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>

        {/* Features Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#16161e] border border-gray-800 rounded-lg p-4">
            <FolderOpen className="w-8 h-8 text-[#00ff88] mb-2" />
            <h3 className="font-semibold mb-1">Local File Access</h3>
            <p className="text-sm text-gray-400">Direct access to your local project files and folders</p>
          </div>
          <div className="bg-[#16161e] border border-gray-800 rounded-lg p-4">
            <Terminal className="w-8 h-8 text-[#00ff88] mb-2" />
            <h3 className="font-semibold mb-1">Terminal Integration</h3>
            <p className="text-sm text-gray-400">Run commands directly in your project directory</p>
          </div>
          <div className="bg-[#16161e] border border-gray-800 rounded-lg p-4">
            <Code className="w-8 h-8 text-[#00ff88] mb-2" />
            <h3 className="font-semibold mb-1">Real-time Collaboration</h3>
            <p className="text-sm text-gray-400">Code together with your team in real-time</p>
          </div>
        </div>
        
        {/* Folder Browser Modal */}
        <FolderBrowser
          isOpen={showFolderBrowser}
          onClose={() => setShowFolderBrowser(false)}
          onSelectFolder={handleFolderSelected}
        />
      </div>
    </div>
  );
}
