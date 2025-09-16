"use client";

import { useState } from 'react';
import useCollaboration from '@/hooks/useCollaboration';

const CollaborationPanel = ({ roomid }) => {
  const { 
    isConnected, 
    connectionError, 
    collaborators, 
    isReconnecting,
    reconnect 
  } = useCollaboration(roomid);

  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-purple-400">🤝 Collaboration</h3>
          <button 
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isPanelExpanded ? '📉' : '📈'}
          </button>
        </div>
        
        {/* Connection Status */}
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 
            isReconnecting ? 'bg-yellow-400 animate-pulse' : 
            'bg-red-400'
          }`}></div>
          <span className="text-xs text-gray-400">
            {isConnected ? 'Connected' :
             isReconnecting ? 'Reconnecting...' :
             connectionError ? 'Connection Error' : 'Disconnected'}
          </span>
        </div>
      </div>

      {isPanelExpanded && (
        <>
          {/* Connection Error */}
          {connectionError && (
            <div className="p-3 bg-red-900/30 border-b border-red-700">
              <p className="text-xs text-red-300 mb-2">❌ {connectionError}</p>
              <button 
                onClick={reconnect}
                className="text-xs bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Collaborators List */}
          <div className="flex-1 p-3">
            <h4 className="text-xs font-medium text-gray-300 mb-2">
              Online Users ({collaborators.length})
            </h4>
            
            {collaborators.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                {isConnected ? 'No other users online' : 'Connecting...'}
              </p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.color }}
                    ></div>
                    <span className="text-xs text-gray-300">{user.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features Status */}
          <div className="p-3 border-t border-gray-700 text-xs">
            <h4 className="font-medium text-gray-300 mb-2">Real-time Features</h4>
            <div className="space-y-1 text-gray-400">
              <div className="flex justify-between">
                <span>✅ WebSocket Connection</span>
                <span className="text-green-400">Ready</span>
              </div>
              <div className="flex justify-between">
                <span>🔄 Code Synchronization</span>
                <span className="text-yellow-400">Pending</span>
              </div>
              <div className="flex justify-between">
                <span>👆 Cursor Tracking</span>
                <span className="text-yellow-400">Pending</span>
              </div>
              <div className="flex justify-between">
                <span>💬 Live Chat</span>
                <span className="text-gray-500">Future</span>
              </div>
            </div>
          </div>

          {/* Room Info */}
          <div className="p-3 border-t border-gray-700 bg-gray-850">
            <div className="text-xs text-gray-400">
              <div>Room: <span className="text-white font-mono">{roomid}</span></div>
              <div className="mt-1">
                Protocol: <span className="text-green-400">Modern WebSocket</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CollaborationPanel;