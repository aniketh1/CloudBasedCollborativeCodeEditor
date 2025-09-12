# Backend Room Synchronization Fixes

## When Backend Repo is Moved Here

When you move the backend repo to this folder, I will apply these critical fixes to resolve the "Room not found" errors:

### 1. Core Issue: Race Condition in Room Operations

**File to Edit:** `backend-repo/index.js` (or whatever the main server file is named)

**Problem:** File operations are attempted before rooms are fully established in the `activeRooms` Map.

### 2. Required Fixes for Socket.IO Event Handlers

#### A. Fix `read-file` Event Handler
```javascript
// CURRENT (causing errors):
socket.on('read-file', async (data) => {
  try {
    const { roomId, filePath } = data;
    
    if (!activeRooms.has(roomId)) {
      socket.emit('file-error', { error: 'Room not found' });
      return;
    }
    // ... rest of handler
  } catch (error) {
    // error handling
  }
});

// FIXED (with waiting logic):
socket.on('read-file', async (data) => {
  try {
    const { roomId, filePath } = data;
    console.log(`📄 Read file request: ${filePath} in room ${roomId}`);
    
    // CRITICAL: Wait for room to be established (fixes race condition)
    let attempts = 0;
    while (attempts < 5 && !activeRooms.has(roomId)) {
      console.log(`⏳ Waiting for room ${roomId} to be initialized (attempt ${attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!activeRooms.has(roomId)) {
      console.error(`❌ Room ${roomId} not found after waiting`);
      socket.emit('file-error', { error: 'Room not found' });
      return;
    }

    const room = activeRooms.get(roomId);
    // ... rest of handler with enhanced logging
  } catch (error) {
    console.error('❌ Read file error:', error);
    socket.emit('file-error', { error: error.message });
  }
});
```

#### B. Fix `read-folder` Event Handler
Apply the same waiting logic pattern:
```javascript
socket.on('read-folder', async (data) => {
  try {
    const { roomId, folderPath } = data;
    console.log('📁 Read folder request:', { roomId, folderPath });
    
    // Wait for room establishment
    let attempts = 0;
    while (attempts < 5 && !activeRooms.has(roomId)) {
      console.log(`⏳ Waiting for room ${roomId} to be initialized (attempt ${attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!activeRooms.has(roomId)) {
      console.error(`❌ Room ${roomId} not found after waiting`);
      socket.emit('folder-error', { error: 'Room not found' });
      return;
    }
    // ... rest of handler
  } catch (error) {
    console.error('📁 Read folder error:', error);
    socket.emit('folder-error', { error: error.message });
  }
});
```

#### C. Fix `write-file` Event Handler
```javascript
socket.on('write-file', async (data) => {
  try {
    const { roomId, filePath, content } = data;
    console.log(`💾 Write file request: ${filePath} in room ${roomId}`);
    
    // Wait for room establishment
    let attempts = 0;
    while (attempts < 5 && !activeRooms.has(roomId)) {
      console.log(`⏳ Waiting for room ${roomId} to be initialized (attempt ${attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!activeRooms.has(roomId)) {
      console.error(`❌ Room ${roomId} not found after waiting`);
      socket.emit('file-error', { error: 'Room not found' });
      return;
    }
    // ... rest of handler
  } catch (error) {
    console.error('❌ Write file error:', error);
    socket.emit('file-error', { error: error.message });
  }
});
```

### 3. Enhanced Room Creation Logic

Ensure the `join-room` handler properly initializes rooms:
```javascript
socket.on('join-room', async (roomId) => {
  try {
    console.log(`📝 User ${socket.id} joining room ${roomId}`);
    
    // Join socket to room
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!activeRooms.has(roomId)) {
      const initialFiles = [
        // ... default file structure
      ];
      
      activeRooms.set(roomId, {
        participants: new Set(),
        code: '// Welcome to CodeDev!\\n// Start coding...',
        files: initialFiles,
        project: null
      });
      
      console.log(`🏠 Room ${roomId} initialized`);
    }
    
    // Add user to room
    const room = activeRooms.get(roomId);
    room.participants.add(socket.id);
    
    // Send project data immediately
    socket.emit('project-loaded', {
      project: room.project,
      files: room.files
    });
    
    // Update user list
    const participantList = Array.from(room.participants);
    io.to(roomId).emit('update-user-list', participantList);
    
  } catch (error) {
    console.error('❌ Join room error:', error);
    socket.emit('room-error', { error: 'Failed to join room' });
  }
});
```

### 4. Enhanced User Management

Add proper user management events:
```javascript
// User join event
socket.on('user-join', (userData) => {
  console.log('👤 User joined:', userData);
  const { roomId } = userData;
  if (roomId) {
    socket.to(roomId).emit('user-joined', userData);
  }
});

// User heartbeat to maintain presence
socket.on('user-heartbeat', (data) => {
  const { roomId } = data;
  if (roomId) {
    socket.to(roomId).emit('user-heartbeat-response', data);
  }
});

// User leave event
socket.on('user-leave', (data) => {
  console.log('👋 User leaving:', data);
  const { roomId } = data;
  if (roomId) {
    socket.to(roomId).emit('user-left', data);
  }
});
```

### 5. Improved Error Handling

Add comprehensive error logging throughout:
```javascript
// Enhanced disconnect handling
socket.on('disconnect', (reason) => {
  console.log(`❌ User disconnected: ${socket.id}, reason: ${reason}`);
  
  // Remove from all rooms
  for (const [roomId, room] of activeRooms.entries()) {
    if (room.participants.has(socket.id)) {
      room.participants.delete(socket.id);
      console.log(`🧹 Removed ${socket.id} from room ${roomId}`);
      
      // Notify remaining participants
      const participantList = Array.from(room.participants);
      io.to(roomId).emit('update-user-list', participantList);
      
      // Clean up empty rooms
      if (room.participants.size === 0) {
        activeRooms.delete(roomId);
        console.log(`🗑️ Deleted empty room: ${roomId}`);
      }
    }
  }
});
```

## Frontend Improvements Already Applied

✅ **Fixed user processing** - Enhanced room-users event handler
✅ **Added hydration guards** - Prevents React errors #418 and #423  
✅ **Improved error handling** - Better validation and logging
✅ **Enhanced file operations** - Room readiness checks

## When You Move the Backend Repo

1. **Move** `backend-repo` folder here temporarily
2. **Tell me** - I'll apply all the above fixes automatically
3. **Test** the fixes work (no more "Room not found" errors)
4. **Move back** the backend repo to its original location
5. **Deploy** the fixed backend to Render
6. **Git push** the final frontend

## Expected Results After Fixes

- ✅ No more "Room not found" errors
- ✅ File operations work reliably  
- ✅ Multi-user collaboration stable
- ✅ Real-time updates function properly
- ✅ User presence system works
- ✅ Terminal sessions stable

The key insight is that the race condition occurs because:
1. Frontend connects to Socket.IO
2. Frontend immediately emits `join-room`
3. Frontend immediately tries file operations
4. Backend hasn't finished processing `join-room` yet
5. File operations fail with "Room not found"

The solution is adding a brief waiting period in all file operations to allow room establishment to complete.