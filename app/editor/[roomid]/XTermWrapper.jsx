'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';

export default function XTermWrapper({ socket, roomId, isConnected, isProjectLoaded }) {
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);

  useEffect(() => {
    // Add safety checks - now also wait for project to be loaded
    if (!terminalRef.current || terminal.current || !socket || !isConnected || !isProjectLoaded) {
      console.log('🖥️ Terminal initialization skipped:', {
        hasRef: !!terminalRef.current,
        hasTerminal: !!terminal.current,
        hasSocket: !!socket,
        isConnected,
        isProjectLoaded
      });
      return;
    }

    console.log('🖥️ Initializing terminal after project loaded...');

    // Add a delay to ensure DOM is fully ready
    const initializeTerminal = () => {
      try {
        // Double check the ref is still available
        if (!terminalRef.current) {
          console.warn('⚠️ Terminal ref lost during initialization');
          return;
        }

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

        fitAddon.current = new FitAddon();
        terminal.current.loadAddon(fitAddon.current);
        
        // Wait for next tick to ensure everything is ready
        setTimeout(() => {
          try {
            if (terminal.current && terminalRef.current) {
              terminal.current.open(terminalRef.current);
              console.log('✅ Terminal opened successfully');
              
              // Wait another tick before fitting
              setTimeout(() => {
                try {
                  if (fitAddon.current && terminal.current && terminal.current._core && terminal.current._core._renderService) {
                    fitAddon.current.fit();
                    console.log('✅ Terminal fitted successfully');
                  }
                } catch (error) {
                  console.error('❌ Error fitting terminal:', error);
                }
              }, 50);
            }
          } catch (error) {
            console.error('❌ Error opening terminal:', error);
          }
        }, 10);

        // Start terminal session on backend
        socket.emit('start-terminal', { roomId });
        console.log('📤 Terminal session started for room:', roomId);

        // Handle terminal input
        terminal.current.onData((data) => {
          if (socket) {
            socket.emit('terminal-input', { roomId, data });
          }
        });

        // Listen for terminal output
        const handleTerminalOutput = (data) => {
          if (terminal.current) {
            terminal.current.write(data);
          }
        };

        socket.on('terminal-output', handleTerminalOutput);
        socket.on('terminal-started', () => {
          console.log('✅ Terminal backend session started');
        });

        // Handle terminal resize with error checking
        const handleResize = () => {
          try {
            if (fitAddon.current && terminal.current && terminal.current._core && terminal.current._core._renderService) {
              fitAddon.current.fit();
            }
          } catch (error) {
            console.error('❌ Error resizing terminal:', error);
          }
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
          try {
            console.log('🧹 Cleaning up terminal...');
            
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
          } catch (error) {
            console.error('❌ Error during terminal cleanup:', error);
          }
        };
      } catch (error) {
        console.error('❌ Error initializing terminal:', error);
      }
    };

    // Initialize terminal with a small delay
    const timeoutId = setTimeout(initializeTerminal, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [socket, roomId, isConnected, isProjectLoaded]);

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-full"
      style={{ background: 'transparent' }}
    />
  );
}
