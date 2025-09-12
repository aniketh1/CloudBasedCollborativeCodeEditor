'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Search, 
  Book, 
  MessageSquare, 
  Video, 
  HelpCircle, 
  FileText, 
  Users, 
  Code, 
  Settings, 
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);

  const helpCategories = [
    {
      title: "Getting Started",
      icon: <Book className="w-6 h-6" />,
      color: "text-blue-500",
      articles: [
        "Setting up your first project",
        "Inviting team members",
        "Understanding the interface",
        "Basic collaboration features"
      ]
    },
    {
      title: "Collaboration",
      icon: <Users className="w-6 h-6" />,
      color: "text-green-500",
      articles: [
        "Real-time editing",
        "Live cursors and selections",
        "Voice and video chat",
        "Screen sharing"
      ]
    },
    {
      title: "Code Editor",
      icon: <Code className="w-6 h-6" />,
      color: "text-purple-500",
      articles: [
        "Syntax highlighting",
        "Code completion",
        "Debugging tools",
        "Extensions and plugins"
      ]
    },
    {
      title: "Project Management",
      icon: <FileText className="w-6 h-6" />,
      color: "text-orange-500",
      articles: [
        "Creating and organizing projects",
        "File management",
        "Version control integration",
        "Project templates"
      ]
    }
  ];

  const faqs = [
    {
      question: "How do I invite collaborators to my project?",
      answer: "You can invite collaborators by going to your project settings and clicking 'Invite Members'. You can send invitations via email or share a project link."
    },
    {
      question: "Is my code secure on ColabDev?",
      answer: "Yes, we use enterprise-grade security with end-to-end encryption. Your code is stored securely and only accessible to invited collaborators."
    },
    {
      question: "Can I work offline?",
      answer: "ColabDev is designed for real-time collaboration and requires an internet connection. However, you can download your projects for offline editing."
    },
    {
      question: "What programming languages are supported?",
      answer: "ColabDev supports all major programming languages including JavaScript, Python, Java, C++, Go, Rust, and many more with syntax highlighting and IntelliSense."
    },
    {
      question: "How many collaborators can work on a project simultaneously?",
      answer: "Our current limit is 10 simultaneous collaborators per project. For larger teams, please contact us for enterprise solutions."
    },
    {
      question: "Can I integrate with GitHub or other version control systems?",
      answer: "Yes, ColabDev integrates seamlessly with GitHub, GitLab, and Bitbucket. You can sync your projects and manage version control directly from the platform."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article => 
      article.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#2FA1FF] to-[#00ff88] bg-clip-text text-transparent">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Find answers, learn new features, and get the most out of ColabDev
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles, tutorials, or FAQs..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2FA1FF] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Video className="w-12 h-12 text-[#2FA1FF] mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Video Tutorials</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Step-by-step video guides to get you started quickly
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <MessageSquare className="w-12 h-12 text-[#00ff88] mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Community Forum</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with other developers and get help from the community
              </p>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <HelpCircle className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Contact Support</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get direct help from our support team for technical issues
              </p>
            </div>
          </div>

          {/* Help Categories */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">Browse Help Topics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className={`${category.color} mb-4`}>
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">{category.title}</h3>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <a href="#" className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#2FA1FF] transition-colors">
                          {article}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">Frequently Asked Questions</h2>
            <div className="max-w-4xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span className="font-medium text-foreground">{faq.question}</span>
                    {openFAQ === index ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {openFAQ === index && (
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
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#2FA1FF] to-[#00ff88] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Our support team is here to help you succeed with ColabDev
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-[#2FA1FF] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Contact Support
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#2FA1FF] transition-colors">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}