'use client';

import React, { useState, useEffect } from 'react';

export default function ConnectionStatus({ 
  socket, 
  isConnected, 
  connectionStatus, 
  terminalStatus,
  isProjectLoaded 
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Server-side render - show loading state
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 rounded-full bg-gray-500" />
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'ready':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'ready':
        return 'Ready';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Socket Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)}`} />
        <span className="text-gray-400">
          Socket: {getStatusText(connectionStatus)}
        </span>
      </div>

      {/* Terminal Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(terminalStatus)}`} />
        <span className="text-gray-400">
          Terminal: {getStatusText(terminalStatus)}
        </span>
      </div>

      {/* Project Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isProjectLoaded ? 'bg-green-500' : 'bg-gray-500'}`} />
        <span className="text-gray-400">
          Project: {isProjectLoaded ? 'Loaded' : 'Loading...'}
        </span>
      </div>

      {/* Socket ID for debugging */}
      {socket?.id && (
        <span className="text-xs text-gray-500 font-mono">
          ID: {socket.id.slice(0, 8)}...
        </span>
      )}
    </div>
  );
}