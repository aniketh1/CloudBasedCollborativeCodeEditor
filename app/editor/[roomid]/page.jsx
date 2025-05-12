'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';
import FileExplorer from '@/components/FileExplorer';
import XtermTerminal from '@/components/Terminal';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const socket = io('http://localhost:3001');

export default function EditorRoomPage() {
  const { roomId } = useParams();
  const editorRef = useRef(null);
  const [code, setCode] = useState('// Start coding...');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    socket.emit('join-room', roomId);
    socket.on('code-update', (incomingCode) => {
      if (incomingCode !== code) {
        setCode(incomingCode);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [mounted, roomId]);

  const handleEditorChange = (value) => {
    setCode(value);
    socket.emit('code-change', { roomId, code: value });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="p-4 bg-gray-800 text-white font-semibold text-lg">
        Room: {roomId}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <FileExplorer />

        <div className="flex flex-col flex-1">
          {mounted && (
            <>
              <MonacoEditor
                height="calc(100vh - 200px)"
                defaultLanguage="javascript"
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                onMount={(editor) => (editorRef.current = editor)}
              />
              <div className="border-t border-gray-700 mt-2">
                <XtermTerminal />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
