'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Search, 
  Book, 
  MessageSquare, 
  Video, 
  Download,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Zap,
  Shield,
  Users,
  Code,
  Settings,
  FileText,
  PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const helpCategories = [
    {
      icon: Zap,
      title: "Getting Started",
      description: "Quick start guides and basic tutorials",
      articles: 12,
      color: "text-[#2FA1FF]"
    },
    {
      icon: Code,
      title: "Editor Features", 
      description: "Learn about advanced coding features",
      articles: 18,
      color: "text-[#00ff88]"
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Working with teams and sharing projects",
      articles: 15,
      color: "text-purple-500"
    },
    {
      icon: Settings,
      title: "Account & Settings",
      description: "Manage your account and preferences",
      articles: 10,
      color: "text-orange-500"
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description: "Keep your code and data secure",
      articles: 8,
      color: "text-red-500"
    },
    {
      icon: FileText,
      title: "API Documentation",
      description: "Integrate with ColabDev APIs",
      articles: 22,
      color: "text-indigo-500"
    }
  ];

  const quickActions = [
    {
      icon: MessageSquare,
      title: "Contact Support",
      description: "Get help from our team",
      action: "Contact Us",
      href: "/contact"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      action: "Watch Now",
      href: "#tutorials"
    },
    {
      icon: Book,
      title: "Documentation",
      description: "Comprehensive guides and references",
      action: "Read Docs",
      href: "#docs"
    },
    {
      icon: Download,
      title: "Download Resources",
      description: "Templates, examples, and tools",
      action: "Download",
      href: "#resources"
    }
  ];

  const faqs = [
    {
      question: "How do I create my first project in ColabDev?",
      answer: "Creating a project is simple! Go to your dashboard, click 'Create Project', choose from our templates (React, Node.js, HTML, or Python Flask), give your project a name, and click create. Your project will be ready in seconds with a fully configured development environment."
    },
    {
      question: "Can multiple people edit the same file simultaneously?",
      answer: "Yes! ColabDev supports real-time collaborative editing. Multiple users can edit the same file simultaneously with live cursors, typing indicators, and automatic conflict resolution. Changes are synced instantly across all connected users."
    },
    {
      question: "How do I invite team members to my project?",
      answer: "To invite team members, open your project and click the 'Share' button in the editor. You can generate an invite link or enter email addresses directly. Team members will receive an invitation and can join your project room instantly."
    },
    {
      question: "Is my code stored securely?",
      answer: "Absolutely! We use enterprise-grade security with end-to-end encryption, secure cloud storage, and regular backups. Your code is protected with industry-standard security measures and is only accessible by you and your invited collaborators."
    },
    {
      question: "Can I work offline?",
      answer: "While ColabDev is primarily designed for online collaboration, basic editing features work offline. Your changes will sync automatically when you reconnect to the internet. For the best experience, we recommend staying connected."
    },
    {
      question: "What programming languages are supported?",
      answer: "ColabDev supports syntax highlighting and IntelliSense for 150+ programming languages including JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP, and many more. Our Monaco editor provides rich language features for all major languages."
    },
    {
      question: "How do I change my account settings?",
      answer: "Click on your profile avatar in the top right corner and select 'Settings'. From there you can update your profile information, change your password, manage billing, and configure notification preferences."
    },
    {
      question: "Can I export my projects?",
      answer: "Yes! You can export your projects as ZIP files or push them directly to GitHub. Go to your project settings and choose your preferred export method. All files and folder structures are preserved."
    }
  ];

  const tutorials = [
    {
      title: "Getting Started with ColabDev",
      duration: "5 min",
      description: "Complete beginner's guide to using the platform",
      thumbnail: "🚀"
    },
    {
      title: "Real-time Collaboration",
      duration: "8 min", 
      description: "Learn how to collaborate with your team",
      thumbnail: "👥"
    },
    {
      title: "Advanced Editor Features",
      duration: "12 min",
      description: "Master the Monaco editor and shortcuts",
      thumbnail: "⚡"
    },
    {
      title: "Project Templates Deep Dive",
      duration: "10 min",
      description: "Explore all available project templates",
      thumbnail: "📁"
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-br from-[#2FA1FF]/10 to-[#00ff88]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#2FA1FF] to-[#00ff88] bg-clip-text text-transparent">
            Help & Support
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Find answers, learn new skills, and get the most out of ColabDev
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search help articles, FAQs, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-4 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <div key={index} className="bg-card p-6 rounded-xl border border-border text-center hover:shadow-lg transition-shadow group">
                <action.icon className="w-12 h-12 text-[#2FA1FF] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{action.description}</p>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-[#2FA1FF] text-[#2FA1FF] hover:bg-[#2FA1FF] hover:text-white"
                >
                  <a href={action.href}>{action.action}</a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-16 px-6 bg-card" id="docs">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category, index) => (
              <div key={index} className="bg-background p-6 rounded-xl border border-border hover:shadow-lg transition-shadow group cursor-pointer">
                <category.icon className={`w-10 h-10 ${category.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{category.articles} articles</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#2FA1FF] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-16 px-6" id="tutorials">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Video Tutorials</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tutorials.map((tutorial, index) => (
              <div key={index} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-[#2FA1FF]/20 to-[#00ff88]/20 flex items-center justify-center relative">
                  <div className="text-4xl mb-2">{tutorial.thumbnail}</div>
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{tutorial.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{tutorial.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Video className="w-3 h-3" />
                    {tutorial.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button className="bg-[#2FA1FF] hover:bg-[#2FA1FF]/90 text-white">
              View All Tutorials
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="bg-background rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <h3 className="font-semibold pr-4">{faq.question}</h3>
                  {openFaq === index ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 px-6" id="resources">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border border-border">
              <FileText className="w-12 h-12 text-[#2FA1FF] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Documentation</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Complete technical documentation and API references
              </p>
              <Button variant="outline" className="border-[#2FA1FF] text-[#2FA1FF] hover:bg-[#2FA1FF] hover:text-white">
                Read Docs
              </Button>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border">
              <Download className="w-12 h-12 text-[#00ff88] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Templates</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Download starter templates and example projects
              </p>
              <Button variant="outline" className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-white">
                Download
              </Button>
            </div>
            
            <div className="bg-card p-6 rounded-xl border border-border">
              <MessageSquare className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Community</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Join our community forums and Discord server
              </p>
              <Button variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white">
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#2FA1FF]/10 to-[#00ff88]/10">
        <div className="max-w-4xl mx-auto text-center">
          <HelpCircle className="w-16 h-16 text-[#2FA1FF] mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Our support team is here to assist you with any questions or issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-[#2FA1FF] hover:bg-[#2FA1FF]/90 text-white">
              <a href="/contact">Contact Support</a>
            </Button>
            <Button asChild variant="outline" className="border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-white">
              <a href="#tutorials">Watch Tutorials</a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
