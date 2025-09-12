'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Code, 
  Users, 
  Cloud, 
  ShieldCheck, 
  MessageSquare, 
  Zap, 
  GitBranch, 
  Terminal,
  Video,
  FileText,
  Download,
  Globe,
  Palette,
  CheckCircle
} from 'lucide-react';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('collaboration');

  const featureCategories = {
    collaboration: {
      title: "Real-time Collaboration",
      features: [
        {
          icon: Users,
          title: "Multi-user Editing",
          description: "Work simultaneously with team members on the same codebase. See live cursors and edits in real-time.",
          highlight: true
        },
        {
          icon: MessageSquare,
          title: "Integrated Chat",
          description: "Communicate with your team without leaving the editor. Discuss code and share feedback instantly.",
          highlight: false
        },
        {
          icon: Video,
          title: "Voice & Video Calls",
          description: "Start voice or video calls directly from the editor for more complex discussions.",
          highlight: false
        },
        {
          icon: Users,
          title: "Presence Indicators",
          description: "See who's online, what they're working on, and their current activity status.",
          highlight: false
        }
      ]
    },
    development: {
      title: "Development Tools",
      features: [
        {
          icon: Code,
          title: "Multi-language Support",
          description: "Support for 15+ programming languages with intelligent syntax highlighting and autocompletion.",
          highlight: true
        },
        {
          icon: Terminal,
          title: "Integrated Terminal",
          description: "Run commands, install packages, and manage your project directly from the browser.",
          highlight: false
        },
        {
          icon: GitBranch,
          title: "Version Control",
          description: "Built-in Git integration for version control and branch management.",
          highlight: false
        },
        {
          icon: Palette,
          title: "Customizable Themes",
          description: "Choose from multiple editor themes and customize your coding environment.",
          highlight: false
        }
      ]
    },
    cloud: {
      title: "Cloud & Storage",
      features: [
        {
          icon: Cloud,
          title: "Auto-save & Sync",
          description: "Never lose your work with automatic cloud saving and real-time synchronization.",
          highlight: true
        },
        {
          icon: FileText,
          title: "Version History",
          description: "Access previous versions of your code and restore any changes when needed.",
          highlight: false
        },
        {
          icon: Download,
          title: "Export Projects",
          description: "Download your projects as ZIP files or push directly to your Git repositories.",
          highlight: false
        },
        {
          icon: Globe,
          title: "Global Access",
          description: "Access your projects from anywhere in the world with our global CDN.",
          highlight: false
        }
      ]
    },
    security: {
      title: "Security & Privacy",
      features: [
        {
          icon: ShieldCheck,
          title: "Role-based Access",
          description: "Control who can view, edit, or manage your projects with granular permissions.",
          highlight: true
        },
        {
          icon: ShieldCheck,
          title: "Secure Environments",
          description: "All code execution happens in secure, isolated containers to protect your data.",
          highlight: false
        },
        {
          icon: ShieldCheck,
          title: "End-to-end Encryption",
          description: "Your code and communications are encrypted both in transit and at rest.",
          highlight: false
        },
        {
          icon: ShieldCheck,
          title: "Compliance Ready",
          description: "Enterprise-grade security features that meet industry compliance standards.",
          highlight: false
        }
      ]
    }
  };

  const stats = [
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "< 50ms", label: "Global Latency" },
    { number: "15+", label: "Programming Languages" },
    { number: "24/7", label: "Support Available" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-br from-[#2FA1FF]/10 to-[#00ff88]/10">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#2FA1FF] to-[#00ff88] bg-clip-text text-transparent">
            Powerful Features
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Everything you need to build, collaborate, and deploy amazing projects. 
            From real-time collaboration to enterprise-grade security.
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="bg-card p-6 rounded-xl border border-border">
                <div className="text-3xl font-bold text-[#2FA1FF] mb-2">{stat.number}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {Object.entries(featureCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === key
                    ? 'bg-[#2FA1FF] text-white shadow-lg'
                    : 'bg-card text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>

          {/* Active Category Features */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-center mb-12">{featureCategories[activeTab].title}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featureCategories[activeTab].features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`p-8 rounded-xl border transition-all hover:shadow-lg ${
                    feature.highlight 
                      ? 'bg-gradient-to-br from-[#2FA1FF]/5 to-[#00ff88]/5 border-[#2FA1FF]/30' 
                      : 'bg-card border-border'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      feature.highlight ? 'bg-[#2FA1FF] text-white' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        {feature.title}
                        {feature.highlight && <CheckCircle className="w-5 h-5 text-[#00ff88]" />}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="py-16 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Built for Performance</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform is engineered for speed, reliability, and scale. Experience lightning-fast 
              performance whether you're working solo or with a team of hundreds.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Sub-second response times powered by global edge computing and optimized infrastructure."
              },
              {
                icon: Globe,
                title: "Global Scale",
                description: "Distributed across multiple regions to ensure low latency no matter where you are."
              },
              {
                icon: ShieldCheck,
                title: "99.9% Uptime",
                description: "Enterprise-grade reliability with automatic failover and redundancy built-in."
              }
            ].map((item, index) => (
              <div key={index} className="text-center bg-background p-8 rounded-xl border border-border">
                <item.icon className="w-12 h-12 text-[#00ff88] mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#2FA1FF]/5 to-[#00ff88]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of developers who are already building amazing projects with ColabDev.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/sign-up" 
              className="bg-[#2FA1FF] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#2FA1FF]/90 transition-colors"
            >
              Start Free Trial
            </a>
            <a 
              href="/dashboard" 
              className="bg-[#00ff88] text-black px-8 py-4 rounded-lg font-semibold hover:bg-[#00ff88]/90 transition-colors"
            >
              View Dashboard
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
