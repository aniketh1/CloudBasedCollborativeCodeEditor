"use client";

import React from 'react';

const CollaboratorActivity = ({ collaborators, code, myId, isConnected }) => {
  // Helper to get line number from offset
  const getLineNumber = (code, offset) => {
    if (!code || offset < 0) return 1;
    return code.substring(0, offset).split('\n').length;
  };

  return (
    <div className="h-full bg-gray-800 p-4">
      <h3 className="text-lg font-semibold text-purple-400 mb-3 border-b border-gray-700 pb-2">
        Active Collaborators ({collaborators.length})
      </h3>
      
      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-xs text-gray-400">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Collaborators List */}
      {collaborators.length === 0 ? (
        <p className="text-sm text-gray-400">No other collaborators active.</p>
      ) : (
        <ul className="space-y-3">
          {collaborators.map((collaborator) => (
            <li 
              key={collaborator.id} 
              className="flex items-center text-sm p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
            >
              {/* Collaborator Color */}
              <span 
                className="w-3 h-3 rounded-full mr-3 border border-gray-500"
                style={{ backgroundColor: collaborator.color }}
              ></span>
              
              {/* Info */}
              <div className="flex-1">
                <span 
                  className="font-medium"
                  style={{ color: collaborator.color }}
                >
                  {collaborator.name} {collaborator.id === myId ? "(You)" : ""}
                </span>
                
                {/* Cursor Position */}
                <div className="text-xs text-gray-400 mt-1">
                  Line {getLineNumber(code, collaborator.cursorOffset)}
                  {collaborator.lastSeen && (
                    <span className="ml-2">
                      • {new Date(collaborator.lastSeen).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Activity */}
              <div className="ml-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Features */}
      <div className="mt-6 p-3 bg-gray-750 rounded-lg">
        <p className="text-xs text-gray-500">
          💡 Real-time collaboration active. Changes sync automatically.
        </p>
      </div>
    </div>
  );
};

export default CollaboratorActivity;