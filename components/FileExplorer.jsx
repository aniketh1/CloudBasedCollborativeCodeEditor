'use client';

import { Folder, FileText } from 'lucide-react';

const files = [
  { name: 'index.js', type: 'file' },
  { name: 'App.jsx', type: 'file' },
  { name: 'components', type: 'folder', children: ['Navbar.jsx', 'Editor.jsx'] },
];

export default function FileExplorer() {
  return (
    <div className="bg-[#1e1e2f] text-white w-64 p-4 h-full">
      <h3 className="text-sm font-semibold mb-4">Explorer</h3>
      <ul className="space-y-2 text-sm">
        {files.map((file, idx) =>
          file.type === 'file' ? (
            <li key={idx} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {file.name}
            </li>
          ) : (
            <li key={idx}>
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4" />
                {file.name}
              </div>
              <ul className="pl-6 mt-1 space-y-1">
                {file.children.map((child, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <FileText className="w-4 h-4" />
                    {child}
                  </li>
                ))}
              </ul>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
