'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Code, Users, Zap, Heart, Globe, Star } from 'lucide-react';

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Aniket V Korwar",
      role: "Full Stack Developer & Project Lead",
      bio: "Leading the development of ColabDev with expertise in React, Node.js, and real-time systems.",
      avatar: "https://ui-avatars.com/api/?name=Aniket+Korwar&background=2FA1FF&color=fff&size=128",
      usn: "1BM23IS403"
    },
    {
      name: "Rohan Raju Navalyal", 
      role: "Backend Developer & System Architect",
      bio: "Specializing in scalable backend systems, database design, and cloud infrastructure.",
      avatar: "https://ui-avatars.com/api/?name=Rohan+Navalyal&background=00FF88&color=000&size=128",
      usn: "1BM23IS406"
    }
  ];

  const coreValues = [
    {
      title: "Collaboration First",
      description: "We believe that the best code is written together. Our platform is designed to make remote collaboration as seamless as working side by side."
    },
    {
      title: "Developer Experience",
      description: "Every feature is crafted with developers in mind. From syntax highlighting to real-time debugging, we prioritize what makes coding enjoyable."
    },
    {
      title: "Open Innovation",
      description: "We're committed to open-source principles and making collaborative coding accessible to developers worldwide, regardless of their background."
    },
    {
      title: "Continuous Learning",
      description: "Our platform evolves with the developer community, incorporating feedback and staying ahead of the latest technologies and practices."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#2FA1FF] to-[#00ff88] bg-clip-text text-transparent">
            About ColabDev
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Empowering developers worldwide with seamless real-time collaboration tools that make coding together as natural as coding alone.
          </p>
          <div className="flex justify-center items-center space-x-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2FA1FF]">50K+</div>
              <div className="text-gray-600 dark:text-gray-400">Lines of Code</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00ff88]">2+</div>
              <div className="text-gray-600 dark:text-gray-400">Developers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#2FA1FF]">∞</div>
              <div className="text-gray-600 dark:text-gray-400">Possibilities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                To revolutionize the way developers collaborate by providing a cloud-based platform 
                that eliminates geographical barriers and makes real-time coding collaboration 
                accessible to everyone.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                We envision a world where developers can seamlessly work together on projects, 
                share knowledge, and build innovative solutions regardless of their physical location.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-[#2FA1FF] to-[#00ff88] p-8 rounded-2xl text-white">
                <Code className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Real-time Collaboration</h3>
                <p className="text-blue-100">
                  Experience synchronized coding with live cursors, instant updates, and seamless communication tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Meet Our Team</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The passionate developers behind ColabDev
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-card p-6 rounded-xl border border-border text-center">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-2 text-foreground">{member.name}</h3>
                <p className="text-[#2FA1FF] font-medium mb-2">{member.role}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{member.usn}</p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Our Core Values</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {coreValues.map((value, index) => (
              <div key={index} className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-xl font-semibold mb-4 text-[#2FA1FF]">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}