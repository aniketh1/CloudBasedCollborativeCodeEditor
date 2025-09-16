"use client";

import React from 'react';

const RealCollaboratorActivity = ({ collaborators, myUser, isConnected, fileEditors }) => {
  // Get all users (collaborators + me)
  const allUsers = [...(collaborators || [])];
  if (myUser) {
    allUsers.push({ ...myUser, isMe: true });
  }

  // Get file editor stats
  const getFileEditorStats = () => {
    if (!fileEditors) return {};
    
    const stats = {};
    Object.entries(fileEditors).forEach(([fileName, editors]) => {
      stats[fileName] = {
        editorCount: editors.length,
        maxReached: editors.length >= 5
      };
    });
    return stats;
  };

  const fileStats = getFileEditorStats();

  return (
    <div className="h-60 bg-[#252526] border-t border-[#2d2d30] flex flex-col">
      {/* Header */}
      <div className="h-8 border-b border-[#2d2d30] flex items-center px-3 bg-[#2d2d30]">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-300">
          👥 Live Collaboration
        </span>
        <div className={`ml-auto w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Connection Status */}
        <div className={`p-2 rounded text-xs ${
          isConnected 
            ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
            : 'bg-red-900/30 text-red-300 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {isConnected ? '⚡ Real-time Sync Active' : '❌ Offline Mode'}
            </span>
          </div>
          {isConnected && (
            <div className="mt-1 text-green-400">
              Character-by-character synchronization enabled
            </div>
          )}
        </div>

        {/* Active Users */}
        <div>
          <div className="text-xs text-gray-400 mb-2 font-medium">
            Active Users ({allUsers.length})
          </div>
          <div className="space-y-2">
            {allUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center gap-3 p-2 bg-[#2d2d30] rounded-md hover:bg-[#3e3e42] transition-colors"
              >
                {/* User Avatar */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                  style={{ 
                    backgroundColor: user.color,
                    borderColor: user.isMe ? '#007acc' : 'transparent'
                  }}
                  title={user.isMe ? `${user.name} (You)` : user.name}
                >
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">
                      {user.name}
                    </span>
                    {user.isMe && (
                      <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {isConnected ? '🟢 Online' : '🔴 Offline'}
                  </div>
                </div>

                {/* Activity Indicator */}
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: user.color }}
                  ></div>
                  <span className="text-xs text-gray-400">Active</span>
                </div>
              </div>
            ))}
          </div>

          {allUsers.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-xs">
              No users connected
            </div>
          )}
        </div>

        {/* File Editor Status */}
        {Object.keys(fileStats).length > 0 && (
          <div>
            <div className="text-xs text-gray-400 mb-2 font-medium">
              File Editor Status
            </div>
            <div className="space-y-1">
              {Object.entries(fileStats).map(([fileName, stats]) => (
                <div 
                  key={fileName}
                  className="flex items-center justify-between p-2 bg-[#2d2d30] rounded text-xs"
                >
                  <span className="text-gray-300 truncate" title={fileName}>
                    📄 {fileName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${
                      stats.maxReached 
                        ? 'bg-red-600/30 text-red-300' 
                        : 'bg-green-600/30 text-green-300'
                    }`}>
                      {stats.editorCount}/5 editors
                    </span>
                    {stats.maxReached && (
                      <span className="text-red-400" title="Maximum editors reached">
                        🔒
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Features Info */}
        <div className="p-2 bg-[#2d2d30] rounded text-xs text-gray-400">
          <div className="font-medium text-white mb-1">💡 Real-time Features:</div>
          <ul className="space-y-0.5 text-gray-400">
            <li>⚡ Instant character-by-character sync</li>
            <li>👁️ Live cursor tracking</li>
            <li>💾 Auto-save every 500ms</li>
            <li>🔒 Max 5 editors per file</li>
            <li>🎨 Visual file border indicators</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RealCollaboratorActivity;