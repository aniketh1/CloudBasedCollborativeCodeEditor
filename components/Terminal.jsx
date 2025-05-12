'use client';

import { Terminal } from 'react-terminal';

const commands = {
  help: 'Available commands: npm run dev, clear, ls',
  ls: '📁 src  📁 public  📄 package.json',
  'npm run dev': '🚀 Starting development server on http://localhost:3000...',
  clear: () => '',
};

export default function SimulatedTerminal() {
  return (
    <div className="bg-black rounded-lg overflow-hidden text-white h-60">
      <Terminal
        color="green"
        prompt="dev@collab-dev:"
        commands={commands}
        welcomeMessage={`Type "help" to get started.`}
      />
    </div>
  );
}
