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
      avatar: "https://ui-avatars.com/api/?name=Rohan+Navalyal&background=00ff88&color=000&size=128",
      usn: "1BM22IS162"
    },
    {
      name: "Suprit R Sanadi",
      role: "Cloud Engineer",
      bio: "Creating intuitive user interfaces and seamless user experiences for collaborative coding.",
      avatar: "https://ui-avatars.com/api/?name=Suprit+Sanadi&background=ff6b6b&color=fff&size=128",
      usn: "1BM23IS418"
    }
  ];

  const stats = [
    { icon: Users, value: "3", label: "Team Members" },
    { icon: Code, value: "1", label: "Major Project" },
    { icon: Globe, value: "2024-25", label: "Academic Year" },
    { icon: Star, value: "B.E.", label: "Degree Program" }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-br from-[#2FA1FF]/10 to-[#00ff88]/10">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#2FA1FF] to-[#00ff88] bg-clip-text text-transparent">
            About ColabDev
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            ColabDev is a cloud-based collaborative code editor developed as a final year project 
            at B.M.S. College of Engineering. This platform enables real-time collaborative coding, 
            making it easier for developers, students, and teams to work together seamlessly.
          </p>
          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            <p>A Project by students of Information Science and Engineering</p>
            <p>B.M.S. College of Engineering, Bengaluru - 2024-25</p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-[#2FA1FF]">Project Overview</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                ColabDev is our final year project for the Bachelor of Engineering in Information Science 
                and Engineering at B.M.S. College of Engineering. This cloud-based collaborative code editor 
                addresses the need for seamless real-time collaboration in software development, enabling 
                multiple developers to work together efficiently on the same codebase.
              </p>
              <div className="flex items-center gap-4 text-[#00ff88]">
                <Heart className="w-6 h-6" />
                <span className="font-semibold">Guided by Dr. B S Mahalakshmi, Associate Professor</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Code, title: "Real-time Coding", desc: "Code together in real-time" },
                { icon: Users, title: "Team Collaboration", desc: "Seamless team workflows" },
                { icon: Zap, title: "Instant Setup", desc: "Start coding immediately" },
                { icon: Globe, title: "Global Access", desc: "Work from anywhere" }
              ].map((feature, index) => (
                <div key={index} className="bg-card p-6 rounded-xl border border-border">
                  <feature.icon className="w-8 h-8 text-[#2FA1FF] mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Growing Community</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-12 h-12 text-[#00ff88] mx-auto mb-4" />
                <div className="text-3xl font-bold text-[#2FA1FF] mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-card p-8 rounded-xl border border-border text-center hover:shadow-lg transition-shadow">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-sm text-gray-500 mb-2">USN: {member.usn}</p>
                <p className="text-[#2FA1FF] font-medium mb-4">{member.role}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Information Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#2FA1FF]/5 to-[#00ff88]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Academic Information</h2>
          <div className="bg-background p-8 rounded-xl border border-border">
            <h3 className="text-2xl font-semibold mb-6 text-[#2FA1FF]">B.M.S. College of Engineering</h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              Autonomous Institute, Affiliated to VTU
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Bull Temple Road, Basavanagudi, Bengaluru - 560019
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-[#00ff88] mb-2">Project Details</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Bachelor of Engineering in Information Science and Engineering</li>
                  <li>• Final Year Project - 2024-25</li>
                  <li>• Cloud-Based Collaborative Code Editor</li>
                  <li>• Real-time collaborative development platform</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#00ff88] mb-2">Project Guidance</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• <strong>Guide:</strong> Dr. B S Mahalakshmi</li>
                  <li>• <strong>Designation:</strong> Associate Professor</li>
                  <li>• <strong>Department:</strong> Information Science and Engineering</li>
                  <li>• <strong>Institution:</strong> B.M.S. College of Engineering</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Values Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Project Objectives</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Real-time Collaboration",
                description: "Enable multiple developers to work simultaneously on the same codebase with live updates."
              },
              {
                title: "Cloud-based Development",
                description: "Provide a web-based IDE that eliminates local environment setup requirements."
              },
              {
                title: "Educational Impact",
                description: "Create a platform that enhances learning and collaboration in academic programming projects."
              }
            ].map((value, index) => (
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
