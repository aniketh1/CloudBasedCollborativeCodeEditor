// components/Footer.jsx
'use client';
import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-[#1e1e1e] text-gray-800 dark:text-gray-300 px-6 py-12  border-t border-gray-300 dark:border-gray-700 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Logo + Description */}
        <div>
          <h2 className="text-2xl font-bold text-[#2FA1FF] mb-3">ColabDev</h2>
          <p className="text-sm leading-relaxed mb-4">
            Real-time collaborative coding platform for developers, students, and teams to build, share, and learn together.
          </p>
          <div className="flex gap-3">
            <a href="https://github.com/aniketh1/CloudBasedCollborativeCodeEditor" target="_blank" rel="noopener noreferrer" className="hover:text-[#2FA1FF] transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://twitter.com/colabdev" target="_blank" rel="noopener noreferrer" className="hover:text-[#2FA1FF] transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com/company/colabdev" target="_blank" rel="noopener noreferrer" className="hover:text-[#2FA1FF] transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Product Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Product</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-[#2FA1FF] transition-colors">Home</Link></li>
            <li><Link href="/features" className="hover:text-[#2FA1FF] transition-colors">Features</Link></li>
            <li><Link href="/dashboard" className="hover:text-[#2FA1FF] transition-colors">Dashboard</Link></li>
            <li><Link href="/create-project" className="hover:text-[#2FA1FF] transition-colors">Create Project</Link></li>
          </ul>
        </div>

        {/* Company Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-[#2FA1FF] transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-[#2FA1FF] transition-colors">Contact</Link></li>
            <li><a href="#careers" className="hover:text-[#2FA1FF] transition-colors">Careers</a></li>
            <li><a href="#blog" className="hover:text-[#2FA1FF] transition-colors">Blog</a></li>
          </ul>
        </div>

        {/* Support Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/help" className="hover:text-[#2FA1FF] transition-colors">Help Center</Link></li>
            <li><a href="#documentation" className="hover:text-[#2FA1FF] transition-colors">Documentation</a></li>
            <li><a href="#community" className="hover:text-[#2FA1FF] transition-colors">Community</a></li>
            <li><a href="#status" className="hover:text-[#2FA1FF] transition-colors">System Status</a></li>
          </ul>
        </div></div>

      {/* Bottom */}
      <div className="mt-10 pt-8 border-t border-gray-300 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} ColabDev. All rights reserved.
          </div>
          <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-400">
            <a href="#privacy" className="hover:text-[#2FA1FF] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#2FA1FF] transition-colors">Terms of Service</a>
            <a href="#cookies" className="hover:text-[#2FA1FF] transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
