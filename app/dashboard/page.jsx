'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, useUser } from  '@clerk/nextjs';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import CreateRoomBox from './components/CreateRoomBox';
import JoinRoomBox from './components/JoinRoomBox';
import RoomCard from './components/RoomCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Code, Clock, Users } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/api/projects?userId=mock-user-id`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <>
      <div className="text-center p-10 text-lg">You are not Signed In</div>
      <div className='flex justify-center items-center'>
        <Link href="/sign-in">
          <Button className="flex">Please Sign In</Button>
        </Link>
      </div>
    </>
  }

  const mockRooms = [
    { id: 'react101', name: 'React Project', createdAt: 'Aug 1, 2025' },
    { id: 'node456', name: 'Node.js API', createdAt: 'Aug 5, 2025' },
  ];

  return (
    <>
      <SignedOut>
        <div className="text-center p-10 text-lg">Please sign in to access the dashboard.</div>
      </SignedOut>

      <SignedIn>
        <section className="max-w-7xl mx-auto px-6 py-12">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Welcome, {user.fullName} 👋
              </CardTitle>
              <p className="text-gray-400">Manage your projects and collaborate with your team</p>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <CreateRoomBox />
              </div>
              <div className="md:col-span-1">
                <JoinRoomBox />
              </div>
              <div className="md:col-span-1">
                <Link href="/create-project">
                  <Card className="h-full border-dashed border-2 border-[#00ff88]/30 hover:border-[#00ff88]/60 transition-colors cursor-pointer group">
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <div className="w-12 h-12 bg-[#00ff88]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#00ff88]/20 transition-colors">
                        <Plus className="w-6 h-6 text-[#00ff88]" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Create Project</h3>
                      <p className="text-sm text-gray-400">Start a new project with local folder access</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Projects Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Your Projects
              </h2>
              <Link href="/create-project">
                <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-700 rounded mb-4"></div>
                      <div className="h-3 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project._id} className="border-gray-800 hover:border-gray-700 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#00ff88]/10 rounded-lg flex items-center justify-center">
                            <Code className="w-5 h-5 text-[#00ff88]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <p className="text-sm text-gray-400 capitalize">{project.projectType}</p>
                          </div>
                        </div>
                      </div>
                      
                      {project.description && (
                        <p className="text-sm text-gray-300 mb-4 line-clamp-2">{project.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {project.participants?.length || 0} users
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/editor/${project.roomId}`} className="flex-1">
                          <Button className="w-full bg-[#00ff88] text-black hover:bg-[#00ff88]/90">
                            Open Project
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-gray-700">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-gray-400 mb-6">Create your first project to start collaborating</p>
                  <Link href="/create-project">
                    <Button className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Rooms Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Quick Collaboration Rooms
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          </div>
        </section>
      </SignedIn>
    </>
  );
}
