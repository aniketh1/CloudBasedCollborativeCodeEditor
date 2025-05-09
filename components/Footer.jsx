// components/Footer.jsx
'use client';
import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-300 px-6 py-12  border-t border-gray-300 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Logo + Description */}
        <div>
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Collab Dev</h2>
          <p className="text-sm leading-relaxed">
            Real-time collaborative coding platform for developers, students, and teams to build, share, and learn together.
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#home" className="hover:text-blue-500">Home</a></li>
            <li><a href="#features" className="hover:text-blue-500">Features</a></li>
            <li><a href="#about" className="hover:text-blue-500">About</a></li>
            <li><a href="#contact" className="hover:text-blue-500">Contact</a></li>
          </ul>
        </div>

        {/* Socials */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Connect</h3>
          <div className="flex gap-4">
            <a href="https://github.com/aniketh1/CloudBasedCollborativeCodeEditor" target="_blank" rel="noopener noreferrer">
              <Github className="w-5 h-5 hover:text-blue-500" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <Twitter className="w-5 h-5 hover:text-blue-500" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Linkedin className="w-5 h-5 hover:text-blue-500" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Collab Dev. All rights reserved.
      </div>
    </footer>
  );
}
