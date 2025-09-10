'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

export default function XTermWrapper({ socket, roomId, isConnected, isProjectLoaded }) {
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  useEffect(() => {
    // Only initialize terminal if all conditions are met
    if (!terminalRef.current || !socket || !isConnected || !isProjectLoaded || terminal.current) {
      console.log('🖥️ Terminal initialization skipped:', {
        hasRef: !!terminalRef.current,
        hasSocket: !!socket,
        isConnected,
        isProjectLoaded,
        hasTerminal: !!terminal.current
      });
      return;
    }

    console.log('🖥️ Initializing terminal after project loaded...');

    const initializeTerminal = () => {
      try {
        // Create terminal instance
        terminal.current = new Terminal({
          theme: {
            background: '#1a1a1a',
            foreground: '#ffffff',
            cursor: '#00ff88',
          },
          fontSize: 14,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          cursorBlink: true,
          scrollback: 1000,
          allowTransparency: true,
        });

        // Create and load fit addon
        fitAddon.current = new FitAddon();
        terminal.current.loadAddon(fitAddon.current);

        // Open terminal in the DOM element
        terminal.current.open(terminalRef.current);
        console.log('✅ Terminal opened successfully');

        // Fit terminal to container
        setTimeout(() => {
          try {
            if (fitAddon.current) {
              fitAddon.current.fit();
              console.log('✅ Terminal fitted successfully');
            }
          } catch (error) {
            console.error('❌ Error fitting terminal:', error);
          }
        }, 100);

        // Set up terminal input handling
        terminal.current.onData((data) => {
          if (socket) {
            socket.emit('terminal-input', { roomId, data });
          }
        });

        // Set up terminal output handling
        const handleTerminalOutput = (data) => {
          if (terminal.current) {
            terminal.current.write(data);
          }
        };

        socket.on('terminal-output', handleTerminalOutput);
        socket.on('terminal-started', () => {
          console.log('✅ Terminal backend session started');
        });

        // Start terminal session on backend
        setTimeout(() => {
          console.log('📤 Starting terminal session for room:', roomId);
          socket.emit('start-terminal', { roomId });
        }, 200);

        // Set up resize handling
        const handleResize = () => {
          try {
            if (fitAddon.current && terminal.current) {
              fitAddon.current.fit();
            }
          } catch (error) {
            console.error('❌ Error during resize:', error);
          }
        };

        window.addEventListener('resize', handleResize);

        setIsTerminalReady(true);

        // Cleanup function
        return () => {
          try {
            window.removeEventListener('resize', handleResize);
            
            if (socket) {
              socket.off('terminal-output', handleTerminalOutput);
              socket.off('terminal-started');
            }
            
            if (terminal.current) {
              terminal.current.dispose();
              terminal.current = null;
            }
            
            fitAddon.current = null;
            setIsTerminalReady(false);
          } catch (error) {
            console.error('❌ Error during terminal cleanup:', error);
          }
        };

      } catch (error) {
        console.error('❌ Error initializing terminal:', error);
      }
    };

    // Initialize terminal
    const cleanup = initializeTerminal();

    return cleanup;
  }, [socket, roomId, isConnected, isProjectLoaded]);

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-full"
      style={{ background: 'transparent' }}
    />
  );
}
