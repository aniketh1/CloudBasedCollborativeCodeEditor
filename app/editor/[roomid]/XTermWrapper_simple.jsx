'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

export default function XTermWrapper({ socket, roomId, isConnected, isProjectLoaded }) {
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Don't initialize if conditions aren't met or already initialized
    if (!socket || !isConnected || !isProjectLoaded || !roomId || terminal.current) {
      return;
    }

    console.log('🖥️ Terminal: Starting initialization...', {
      hasSocket: !!socket,
      isConnected,
      isProjectLoaded,
      hasRoomId: !!roomId
    });

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!terminalRef.current) {
        console.error('❌ Terminal: DOM element not ready');
        return;
      }

      try {
        // Create terminal
        console.log('🖥️ Terminal: Creating terminal instance...');
        terminal.current = new Terminal({
          theme: {
            background: '#1a1a1a',
            foreground: '#ffffff',
            cursor: '#00ff88',
            selection: '#ffffff40',
          },
          fontSize: 14,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          cursorBlink: true,
          scrollback: 1000,
          allowTransparency: true,
          convertEol: true,
        });

        // Create fit addon
        fitAddon.current = new FitAddon();
        terminal.current.loadAddon(fitAddon.current);

        // Open terminal
        console.log('🖥️ Terminal: Opening terminal...');
        terminal.current.open(terminalRef.current);

        // Fit to container
        setTimeout(() => {
          if (fitAddon.current) {
            fitAddon.current.fit();
            console.log('✅ Terminal: Fitted to container');
          }
        }, 100);

        // Set up input handling - THIS IS CRITICAL
        console.log('🖥️ Terminal: Setting up input handling...');
        terminal.current.onData((data) => {
          console.log('📤 Terminal: Sending input:', data, 'Character code:', data.charCodeAt(0));
          if (socket && socket.connected) {
            socket.emit('terminal-input', { roomId, data });
          } else {
            console.error('❌ Socket not connected when trying to send input');
          }
        });

        // Set up key event handling for debugging
        terminal.current.onKey(({ key, domEvent }) => {
          console.log('⌨️ Terminal: Key pressed:', key, 'KeyCode:', domEvent.keyCode);
        });

        // Set up output handling
        const handleOutput = (data) => {
          console.log('📥 Terminal: Received output:', data);
          if (terminal.current) {
            terminal.current.write(data);
          }
        };

        socket.on('terminal-output', handleOutput);

        // Start terminal session
        console.log('📤 Terminal: Starting backend session...');
        socket.emit('start-terminal', { roomId });

        // Focus the terminal after everything is set up
        setTimeout(() => {
          if (terminal.current) {
            terminal.current.focus();
            console.log('🎯 Terminal: Auto-focused');
          }
        }, 200);

        setIsInitialized(true);
        console.log('✅ Terminal: Initialization complete');

        // Cleanup function
        return () => {
          console.log('🧹 Terminal: Cleaning up...');
          if (socket) {
            socket.off('terminal-output', handleOutput);
          }
          if (terminal.current) {
            terminal.current.dispose();
            terminal.current = null;
          }
          fitAddon.current = null;
          setIsInitialized(false);
        };

      } catch (error) {
        console.error('❌ Terminal: Initialization error:', error);
      }
    }, 100);

    return () => clearTimeout(timer);

  }, [socket, roomId, isConnected, isProjectLoaded]);

  // Focus terminal when clicked
  const handleClick = () => {
    if (terminal.current) {
      terminal.current.focus();
      console.log('🎯 Terminal: Focused');
    }
  };

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-full cursor-text"
      onClick={handleClick}
      style={{ 
        background: '#1a1a1a',
        padding: '4px'
      }}
    />
  );
}
