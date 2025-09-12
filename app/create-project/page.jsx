'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FileText, Plus, Code, Terminal, FolderOpen } from 'lucide-react';
// import FolderBrowser from '@/components/FolderBrowser'; // Removed - no longer needed

export default function CreateProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: 'react'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const [showFolderBrowser, setShowFolderBrowser] = useState(false); // Removed - no longer needed
  const [projectTypes, setProjectTypes] = useState([
    { 
      value: 'react', 
      name: 'React App', 
      description: 'Interactive React components with modern styling and animations',
      features: ['Component library', 'State management', 'Modern CSS', 'Responsive design'],
      icon: Code 
    },
    { 
      value: 'nodejs', 
      name: 'Node.js API', 
      description: 'Express.js REST API with full CRUD operations and middleware',
      features: ['Express.js setup', 'RESTful routes', 'Error handling', 'CORS enabled'],
      icon: Terminal 
    },
    { 
      value: 'html', 
      name: 'HTML Website', 
      description: 'Responsive website with smooth animations and modern design',
      features: ['Responsive layout', 'CSS animations', 'Clean design', 'Interactive elements'],
      icon: FileText 
    },
    { 
      value: 'python', 
      name: 'Python Flask', 
      description: 'RESTful API with Flask, error handling, and JSON responses',
      features: ['Flask framework', 'API endpoints', 'Error handling', 'JSON responses'],
      icon: Code 
    }
  ]);

  // Fetch available project templates from backend (if any additional ones exist)
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${BACKEND_URL}/api/projects/templates`);
        const data = await response.json();
        
        if (data.success && data.templates && data.templates.length > 0) {
          // Add any additional templates from backend
          const backendTemplates = data.templates.filter(
            template => !['react', 'nodejs', 'html', 'python'].includes(template.value)
          ).map(template => ({
            ...template,
            icon: getIconForType(template.value)
          }));
          
          if (backendTemplates.length > 0) {
            setProjectTypes(prev => [...prev, ...backendTemplates]);
          }
        }
      } catch (error) {
        console.error('Error fetching additional templates:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🚀 Creating project with data:', formData);

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      // Prepare request data without localPath
      const requestData = {
        name: formData.name,
        description: formData.description,
        projectType: formData.projectType,
        userId: 'mock-user-id' // Replace with actual user ID when auth is implemented
      };
      
      console.log('🚀 Creating project with cleaned data:', requestData);
      
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projectTypes.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = formData.projectType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, projectType: type.value }))}
                      className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-[#00ff88] bg-[#00ff88]/10 shadow-lg shadow-[#00ff88]/20'
                          : 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600 hover:bg-[#1a1a2e]/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md ${
                          isSelected ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-gray-700 text-gray-400'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-sm ${
                            isSelected ? 'text-[#00ff88]' : 'text-white'
                          }`}>
                            {type.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 mb-2">
                            {type.description}
                          </p>
                          {type.features && (
                            <div className="flex flex-wrap gap-1">
                              {type.features.slice(0, 2).map((feature, index) => (
                                <span
                                  key={index}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    isSelected 
                                      ? 'bg-[#00ff88]/20 text-[#00ff88]' 
                                      : 'bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  {feature}
                                </span>
                              ))}
                              {type.features.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{type.features.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Show selected template details */}
              {formData.projectType && projectTypes.find(t => t.value === formData.projectType)?.features && (
                <div className="mt-4 p-4 bg-[#1a1a2e] rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-[#00ff88] mb-2">
                    {projectTypes.find(t => t.value === formData.projectType)?.name} Features:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projectTypes.find(t => t.value === formData.projectType)?.features.map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-[#00ff88]/10 text-[#00ff88] rounded-full border border-[#00ff88]/30"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                disabled={loading || !formData.name}
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
        
        {/* Folder Browser Modal - Removed since localPath is no longer required */}
        {/* 
        <FolderBrowser
          isOpen={showFolderBrowser}
          onClose={() => setShowFolderBrowser(false)}
          onSelectFolder={handleFolderSelected}
        />
        */}
      </div>
    </div>
  );
}
