'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import io from 'socket.io-client';

export default function XtermTerminal() {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    socket.current = io('http://localhost:3001');

    term.current = new Terminal({
      theme: {
        background: '#1a1a2e',
        foreground: '#00ff88',
        cursor: '#00ff88',
        selection: '#ffffff20',
      },
      fontSize: 14,
      fontFamily: 'Geist Mono, monospace',
      cursorBlink: true,
      allowProposedApi: true,
    });

    term.current.open(terminalRef.current);

    // Start terminal session when component mounts
    socket.current.emit('start-terminal');

    // Send terminal input to backend
    term.current.onData(data => {
      socket.current.emit('terminal-input', data);
    });

    // Write backend output to terminal
    socket.current.on('terminal-output', data => {
      term.current.write(data);
    });

    // Handle terminal ready
    socket.current.on('terminal-ready', () => {
      term.current.write('\r\n🚀 Terminal ready! Type your commands below:\r\n\r\n');
    });

    // Handle resize
    const handleResize = () => {
      if (term.current && terminalRef.current) {
        const { cols, rows } = term.current;
        socket.current.emit('resize', { cols, rows });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (socket.current) {
        socket.current.disconnect();
      }
      if (term.current) {
        term.current.dispose();
      }
    };
  }, []);

  return (
    <div className="h-full bg-[#1a1a2e] flex flex-col">
      <div className="bg-[#16161e] px-4 py-2 border-b border-gray-800">
        <span className="text-sm text-gray-400">Terminal</span>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 bg-[#1a1a2e] text-white"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}
