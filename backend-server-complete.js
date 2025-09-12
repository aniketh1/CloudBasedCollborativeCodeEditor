// Complete Backend Server with Socket.io for Render Deployment
const express = require('express');
const cors = require('cors');
const { initializeSocketServer } = require('./backend-socketio-setup');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for Vercel frontend
app.use(cors({
  origin: [
    "https://cloud-based-collborative-code-editor.vercel.app",
    "http://localhost:3000",
    "https://localhost:3000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// Basic routes for your existing API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Backend server with Socket.io is running',
    timestamp: new Date().toISOString()
  });
});

// Mock projects API (since your dashboard uses this)
app.get('/api/projects', (req, res) => {
  const mockProjects = [
    {
      id: '1',
      name: 'React Todo App',
      description: 'A collaborative todo application',
      language: 'JavaScript',
      framework: 'React',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      collaborators: 1
    },
    {
      id: '2', 
      name: 'Node.js API',
      description: 'RESTful API with Express',
      language: 'JavaScript',
      framework: 'Node.js',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      collaborators: 2
    }
  ];

  res.json({
    success: true,
    projects: mockProjects
  });
});

// Create project endpoint
app.post('/api/projects', (req, res) => {
  const { name, description, template, userId } = req.body;
  
  const newProject = {
    id: Date.now().toString(),
    name: name || 'New Project',
    description: description || 'A collaborative project',
    language: 'JavaScript',
    framework: template || 'React',
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    collaborators: 1,
    roomId: `room-${Date.now()}`
  };

  res.json({
    success: true,
    project: newProject,
    message: 'Project created successfully'
  });
});

// Room access endpoint (simplified)
app.get('/api/rooms/:roomId/access', (req, res) => {
  const { roomId } = req.params;
  
  // For now, allow access to all rooms
  res.json({
    success: true,
    hasAccess: true,
    roomId: roomId,
    message: 'Access granted'
  });
});

// Initialize Socket.io
const { server, io } = initializeSocketServer(app);

// Add Socket.io info to health check
app.get('/api/socket-status', (req, res) => {
  res.json({
    socketio: 'active',
    connectedClients: io.engine.clientsCount,
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server initialized`);
  console.log(`🌐 CORS enabled for Vercel frontend`);
  console.log(`💻 Backend URL: https://your-render-app.onrender.com`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('👋 Process terminated');
    process.exit(0);
  });
});