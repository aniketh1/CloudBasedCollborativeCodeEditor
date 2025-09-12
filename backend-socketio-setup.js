// Socket.io Server Configuration for Render Deployment
const { Server } = require('socket.io');
const http = require('http');

function initializeSocketServer(app) {
  // Create HTTP server
  const server = http.createServer(app);
  
  // Initialize Socket.IO with CORS configuration for Vercel
  const io = new Server(server, {
    cors: {
      origin: [
        "https://cloud-based-collborative-code-editor.vercel.app",
        "http://localhost:3000",
        "https://localhost:3000"
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  });

  // Store room information
  const rooms = new Map();
  const userSessions = new Map();

  io.on('connection', (socket) => {
    console.log('👋 User connected:', socket.id);

    // Handle user joining a room
    socket.on('join-room', (roomId) => {
      console.log(`🏠 User ${socket.id} joining room: ${roomId}`);
      
      socket.join(roomId);
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          users: new Set(),
          files: [
            {
              name: 'src',
              type: 'folder',
              children: [
                { name: 'index.js', type: 'file', path: '/src/index.js' },
                { name: 'App.jsx', type: 'file', path: '/src/App.jsx' },
                { name: 'styles.css', type: 'file', path: '/src/styles.css' }
              ]
            },
            { name: 'package.json', type: 'file', path: '/package.json' },
            { name: 'README.md', type: 'file', path: '/README.md' }
          ]
        });
      }

      const room = rooms.get(roomId);
      room.users.add(socket.id);

      // Send initial project structure
      socket.emit('project-loaded', {
        project: {
          id: roomId,
          name: `Project ${roomId}`,
          description: 'Collaborative coding project'
        },
        files: room.files,
        success: true
      });

      // Notify room about new user
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        roomId: roomId
      });

      // Send room users list
      const roomUsers = Array.from(room.users).map(userId => ({
        id: userId,
        name: `User-${userId.slice(-4)}`,
        isActive: true
      }));
      
      io.in(roomId).emit('room-users', roomUsers);
      
      console.log(`✅ User ${socket.id} joined room ${roomId}. Total users: ${room.users.size}`);
    });

    // Handle get-project requests
    socket.on('get-project', (data) => {
      console.log(`📂 Project requested for room: ${data.roomId}`);
      
      const room = rooms.get(data.roomId);
      if (room) {
        socket.emit('project-loaded', {
          project: {
            id: data.roomId,
            name: `Project ${data.roomId}`,
            description: 'Collaborative coding project'
          },
          files: room.files,
          success: true
        });
      }
    });

    // Handle user joining event
    socket.on('user-join', (userData) => {
      console.log('👤 User join event:', userData);
      userSessions.set(socket.id, userData);
      
      if (userData.roomId) {
        socket.to(userData.roomId).emit('user-joined', {
          id: socket.id,
          name: userData.userName || `User-${socket.id.slice(-4)}`,
          avatar: userData.userAvatar
        });
      }
    });

    // Handle file requests
    socket.on('request-file', (filePath) => {
      console.log(`📄 File requested: ${filePath}`);
      
      // Mock file content
      const mockContent = {
        '/src/index.js': '// Main JavaScript file\nconsole.log("Welcome to your collaborative project!");',
        '/src/App.jsx': '// React App Component\nimport React from "react";\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello from Collaborative React!</h1>\n      <p>Edit this file and see changes in real-time!</p>\n    </div>\n  );\n}\n\nexport default App;',
        '/src/styles.css': '/* Main stylesheet */\nbody {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f5f5f5;\n}\n\nh1 {\n  color: #333;\n  text-align: center;\n}',
        '/package.json': '{\n  "name": "collaborative-project",\n  "version": "1.0.0",\n  "main": "src/index.js",\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  },\n  "scripts": {\n    "start": "react-scripts start",\n    "build": "react-scripts build"\n  }\n}',
        '/README.md': '# Collaborative Project\n\nThis is a real-time collaborative coding project.\n\n## Features\n\n- Real-time editing\n- Multiple users\n- File synchronization\n- Terminal integration\n\n## Getting Started\n\n1. Select a file from the explorer\n2. Start editing\n3. Invite collaborators\n4. Code together in real-time!\n\n**Status: Connected to Socket.io backend** ✅'
      };

      const content = mockContent[filePath] || '// New file\n// Start coding here!';
      
      socket.emit('file-content', {
        path: filePath,
        content: content
      });
    });

    // Handle file saving
    socket.on('save-file', (data) => {
      console.log(`💾 Saving file: ${data.filePath}`);
      
      // Broadcast file update to other users in the room
      socket.to(data.roomId || 'default').emit('file-updated', {
        filePath: data.filePath,
        content: data.content,
        userId: socket.id,
        userName: userSessions.get(socket.id)?.userName || 'Anonymous'
      });

      // Confirm save to sender
      socket.emit('file-saved', {
        path: data.filePath,
        success: true
      });
    });

    // Handle write-file (alternative save event)
    socket.on('write-file', (data) => {
      console.log(`💾 Writing file: ${data.filePath}`);
      
      // Broadcast file update to other users in the room
      socket.to(data.roomId || 'default').emit('file-updated', {
        filePath: data.filePath,
        content: data.content,
        userId: socket.id,
        userName: userSessions.get(socket.id)?.userName || 'Anonymous'
      });

      // Confirm save to sender
      socket.emit('file-saved', {
        path: data.filePath,
        success: true
      });
    });

    // Handle real-time code changes
    socket.on('code-change', (data) => {
      // Broadcast to other users in the room
      socket.to(data.roomId || 'default').emit('code-operation', {
        filePath: data.filePath,
        content: data.content,
        userId: socket.id,
        operation: data.operation || 'edit'
      });
    });

    // Handle terminal commands (mock)
    socket.on('terminal-command', (data) => {
      console.log(`💻 Terminal command: ${data.command}`);
      
      // Mock terminal responses
      const mockResponses = {
        'ls': 'src/\npackage.json\nREADME.md\nnode_modules/',
        'pwd': '/workspace/project',
        'whoami': 'collaborator',
        'date': new Date().toString(),
        'echo hello': 'hello',
        'npm --version': '8.19.2',
        'node --version': 'v18.17.0'
      };

      const response = mockResponses[data.command] || `Command executed: ${data.command}`;
      
      socket.emit('terminal-output', {
        output: response,
        command: data.command
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`👋 User disconnected: ${socket.id}, reason: ${reason}`);
      
      // Remove user from all rooms
      rooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          
          // Notify other users
          socket.to(roomId).emit('user-left', {
            userId: socket.id
          });
          
          // Update room users list
          const roomUsers = Array.from(room.users).map(userId => ({
            id: userId,
            name: `User-${userId.slice(-4)}`,
            isActive: true
          }));
          
          socket.to(roomId).emit('room-users', roomUsers);
          
          console.log(`User ${socket.id} left room ${roomId}. Remaining users: ${room.users.size}`);
        }
      });
      
      // Clean up user session
      userSessions.delete(socket.id);
    });

    // Emit terminal ready
    setTimeout(() => {
      socket.emit('terminal-ready', {
        status: 'connected',
        message: 'Terminal is ready for commands'
      });
    }, 1000);
  });

  return { server, io };
}

module.exports = { initializeSocketServer };