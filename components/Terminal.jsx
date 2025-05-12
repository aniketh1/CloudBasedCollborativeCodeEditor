// components/Terminal.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

export default function XtermTerminal() {
  const terminalRef = useRef(null);
  const [term, setTerm] = useState(null);

  useEffect(() => {
    const xterm = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#00ff00',
      },
      fontSize: 14,
      cursorBlink: true,
    });

    if (terminalRef.current) {
      xterm.open(terminalRef.current);
      xterm.write('Welcome to Collab Dev Terminal\r\n');
      xterm.write('$ ');
      setTerm(xterm);
    }

    return () => {
      xterm?.dispose();
    };
  }, []);

  return (
    <div
      ref={terminalRef}
      className="bg-black text-white"
      style={{ height: '200px', width: '100%' }}
    />
  );
}
