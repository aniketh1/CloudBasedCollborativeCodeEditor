'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function DebugPanel({ socket, connectionStatus, isProjectLoaded, files }) {
  const { user } = useUser();
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setDebugInfo({
      timestamp: new Date().toLocaleTimeString(),
      userAuthenticated: !!user,
      userId: user?.id || 'Not authenticated',
      socketConnected: !!socket,
      socketId: socket?.id || 'No socket',
      connectionStatus,
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'Not configured',
      isProjectLoaded,
      filesCount: files?.length || 0,
      environment: process.env.NODE_ENV || 'unknown'
    });
  }, [socket, connectionStatus, isProjectLoaded, files, user]);

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-3 py-2 rounded text-xs hover:bg-gray-700"
        title="Show debug info"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm text-xs text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Debug Info</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-gray-400">Time:</div>
          <div>{debugInfo.timestamp}</div>
          
          <div className="text-gray-400">Auth:</div>
          <div className={debugInfo.userAuthenticated ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.userAuthenticated ? '✅ Yes' : '❌ No'}
          </div>
          
          <div className="text-gray-400">User ID:</div>
          <div className="truncate" title={debugInfo.userId}>
            {debugInfo.userId?.substring(0, 10)}...
          </div>
          
          <div className="text-gray-400">Socket:</div>
          <div className={debugInfo.socketConnected ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.socketConnected ? '✅ Connected' : '❌ Disconnected'}
          </div>
          
          <div className="text-gray-400">Socket ID:</div>
          <div className="truncate" title={debugInfo.socketId}>
            {debugInfo.socketId?.substring(0, 8)}...
          </div>
          
          <div className="text-gray-400">Status:</div>
          <div className={
            connectionStatus === 'connected' ? 'text-green-400' : 
            connectionStatus === 'connecting' ? 'text-yellow-400' : 
            'text-red-400'
          }>
            {connectionStatus}
          </div>
          
          <div className="text-gray-400">Backend:</div>
          <div className="truncate" title={debugInfo.backendUrl}>
            {debugInfo.backendUrl?.replace('https://', '')}
          </div>
          
          <div className="text-gray-400">Project:</div>
          <div className={debugInfo.isProjectLoaded ? 'text-green-400' : 'text-yellow-400'}>
            {debugInfo.isProjectLoaded ? '✅ Loaded' : '⏳ Loading'}
          </div>
          
          <div className="text-gray-400">Files:</div>
          <div>{debugInfo.filesCount} files</div>
          
          <div className="text-gray-400">Env:</div>
          <div>{debugInfo.environment}</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <button
          onClick={() => {
            console.log('🐛 Debug Info:', debugInfo);
            console.log('🔧 Socket Object:', socket);
            console.log('👤 User Object:', user);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
        >
          Log to Console
        </button>
      </div>
    </div>
  );
}