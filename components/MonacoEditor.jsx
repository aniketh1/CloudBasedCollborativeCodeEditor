"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import of the new UnifiedMonacoEditor
const UnifiedMonacoEditor = dynamic(() => import('./UnifiedMonacoEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300 text-lg">Loading Unified Monaco Editor...</p>
        <p className="text-gray-500 text-sm mt-2">Initializing all features...</p>
      </div>
    </div>
  )
});

const MonacoEditor = ({ selectedFile, roomid, projectFiles = [] }) => {
  return (
    <UnifiedMonacoEditor 
      selectedFile={selectedFile}
      roomid={roomid}
      projectFiles={projectFiles}
    />
  );
};

export default MonacoEditor;
