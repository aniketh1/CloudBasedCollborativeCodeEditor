"use client";

import { useState } from 'react';

/**
 * Session Manager for creating/joining collaboration sessions
 * Based on the reference implementation
 */
const SessionManager = ({ onSessionStart, currentRoomId }) => {
  const [inputValue, setInputValue] = useState('');

  const handleCreateSession = () => {
    const newSessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
    onSessionStart(newSessionId);
  };

  const handleJoinSession = () => {
    if (inputValue.trim()) {
      onSessionStart(inputValue.trim());
    } else {
      alert("Please enter a session ID to join.");
    }
  };

  // If already in a session, show session info
  if (currentRoomId) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-xl font-semibold text-purple-400 mb-4">Active Session</h2>
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <p className="text-gray-300 text-sm mb-2">Current Room ID:</p>
          <code className="text-blue-300 bg-gray-900 px-2 py-1 rounded font-mono text-sm">
            {currentRoomId}
          </code>
        </div>
        <p className="text-gray-400 text-sm">
          Share this room ID with others to collaborate together!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl flex flex-col items-center space-y-6 border border-gray-700">
      <h2 className="text-2xl font-semibold text-purple-400">Start Collaborating</h2>
      <p className="text-gray-300 text-center">Create a new session or join an existing one using a session ID.</p>
      
      <button
        onClick={handleCreateSession}
        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
      >
        Create New Session
      </button>
      
      <div className="w-full flex flex-col space-y-2 items-center">
        <span className="text-gray-400">OR</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter Session ID to Join"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
        />
        <button
          onClick={handleJoinSession}
          className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-opacity-75"
        >
          Join Session
        </button>
      </div>
    </div>
  );
};

export default SessionManager;