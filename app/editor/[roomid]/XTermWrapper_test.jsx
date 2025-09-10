'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

export default function XTermWrapper({ socket, roomId, isConnected, isProjectLoaded }) {
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);

  useEffect(() => {
    console.log('🔍 Terminal: useEffect triggered', {
      socket: !!socket,
      roomId,
      isConnected,
      isProjectLoaded,
      hasTerminal: !!terminalInstance.current
    });

    // Don't proceed if conditions aren't met
    if (!socket || !isConnected || !isProjectLoaded || !roomId) {
      console.log('⏸️ Terminal: Waiting for conditions...');
      return;
    }

    // Don't recreate if already exists
    if (terminalInstance.current) {
      console.log('♻️ Terminal: Already exists, skipping...');
      return;
    }

    // Wait for DOM
    if (!terminalRef.current) {
      console.log('⏸️ Terminal: DOM not ready...');
      return;
    }

    console.log('🚀 Terminal: Starting initialization...');

    // Create terminal
    terminalInstance.current = new Terminal({
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
      },
      fontSize: 14,
      cursorBlink: true,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminalInstance.current.loadAddon(fitAddon);

    // Open terminal
    terminalInstance.current.open(terminalRef.current);
    console.log('✅ Terminal: Opened');

    // Fit to size
    setTimeout(() => fitAddon.fit(), 100);

    // CRITICAL: Set up input handling - NO local echo for PowerShell
    terminalInstance.current.onData((data) => {
      console.log('🎯 TERMINAL INPUT DETECTED:', data, 'Code:', data.charCodeAt(0));
      console.log('🔗 Socket status:', socket ? `connected: ${socket.connected}, id: ${socket.id}` : 'null');
      
      // Handle special key mappings for PowerShell
      let processedData = data;
      
      // Convert DEL (127) to Backspace (8) for PowerShell compatibility
      if (data === '\x7F') {
        processedData = '\b'; // Convert DEL to Backspace
        console.log('🔄 Converted DEL to Backspace');
      }
      
      if (socket && socket.connected) {
        console.log('📤 Sending to backend with roomId:', roomId);
        console.log('📤 Event payload:', { roomId, data: processedData });
        socket.emit('terminal-input', { roomId, data: processedData });
        console.log('📤 Event sent successfully');
      } else {
        console.error('❌ Socket not connected!', socket ? `Status: ${socket.connected}` : 'Socket is null');
      }
    });

    // Set up output handling
    const outputHandler = (data) => {
      console.log('📥 Terminal output:', data);
      if (terminalInstance.current) {
        terminalInstance.current.write(data);
      }
    };

    socket.on('terminal-output', outputHandler);

    // Start backend session
    console.log('📡 Starting backend session...');
    socket.emit('start-terminal', { roomId });

    // Auto-focus
    setTimeout(() => {
      if (terminalInstance.current) {
        terminalInstance.current.focus();
        console.log('🎯 Terminal focused');
      }
    }, 300);

    // Cleanup
    return () => {
      console.log('🧹 Terminal: Cleanup');
      socket.off('terminal-output', outputHandler);
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
        terminalInstance.current = null;
      }
    };

  }, [socket, roomId, isConnected, isProjectLoaded]);

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-full"
      style={{ 
        background: '#1a1a1a',
        minHeight: '200px'
      }}
      onClick={() => {
        if (terminalInstance.current) {
          terminalInstance.current.focus();
          console.log('🖱️ Terminal clicked and focused');
        }
      }}
    />
  );
}
