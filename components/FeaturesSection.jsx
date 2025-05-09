// components/FeaturesSection.jsx

import React from "react";
import FeatureCard from "./FeatureCard";
import { Users, Code2, Cloud, ShieldCheck, MessageSquare } from "lucide-react";

const features = [
  {
    icon: 
            <Users className="w-8 h-8 text-blue-400" />
         ,
    title: "Real-time Collaboration",
    description: "Work simultaneously with team members on the same codebase. See changes as they happen with live cursors and edits.",
  },
  {
    icon: <Code2 className="w-8 h-8 text-green-400" />,
    title: "Multi-language Support",
    description: "Develop in over 40+ programming languages with intelligent syntax highlighting and code completion.",
  },
  {
    icon: <Cloud className="w-8 h-8 text-sky-400" />,
    title: "Cloud Auto-save & Version History",
    description: "Never lose your work with automatic cloud saving. Access previous versions of your code anytime.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-purple-400" />,
    title: "Role-based Access Control",
    description: "Manage permissions and access levels for different team members and collaborators.",
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-yellow-400" />,
    title: "Chat & Commenting System",
    description: "Discuss code and share feedback directly within the IDE using inline comments and chat.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative h-screen overflow-hidden py-20 px-4 sm:px-6 lg:px-16 bg-gray-900 text-white">
        {/* Background SVG */}
        <div className="absolute top-[600px] left-[-100px] transition-all inset-0 pointer-events-none z-0">
            <img
            src="/assets/features-bg.svg"
            alt="Decorative Background"
            className="object-cover opacity-70"
            />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 max-w-6xl mx-auto text-center">
           
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">
            Collab Dev IDE Features
            </h2>
            <p className="text-gray-300 mb-12 max-w-2xl mx-auto">
            A modern development environment designed for team collaboration and productivity
            </p>
        


        <div className="grid grid-cols-1 md:grid-cols-3 gap-14">
          {features.map((feature, idx) => (
            <FeatureCard
              key={idx}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
