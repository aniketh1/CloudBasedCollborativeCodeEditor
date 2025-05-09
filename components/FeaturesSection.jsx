'use client';
import React from "react";
import FeatureCard from "./FeatureCard";
import { Users, Code2, Cloud, ShieldCheck, MessageSquare } from "lucide-react";

const features = [
  {
    icon: <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    title: "Real-time Collaboration",
    description: "Work simultaneously with team members on the same codebase. See changes as they happen with live cursors and edits.",
  },
  {
    icon: <Code2 className="w-8 h-8 text-green-600 dark:text-green-400" />,
    title: "Multi-language Support",
    description: "Develop in over 10+ programming languages with intelligent syntax highlighting and code completion.",
  },
  {
    icon: <Cloud className="w-8 h-8 text-sky-600 dark:text-sky-400" />,
    title: "Cloud Auto-save & Version History",
    description: "Never lose your work with automatic cloud saving. Access previous versions of your code anytime.",
  },
  {
    icon: <ShieldCheck className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
    title: "Role-based Access Control",
    description: "Manage permissions and access levels for different team members and collaborators.",
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
    title: "Chat & Commenting System",
    description: "Discuss code and share feedback directly within the IDE using inline comments and chat.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-16 bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      {/* Background SVG */}
      <div className="absolute top-[-50px] inset-0 pointer-events-none z-0 opacity-30 dark:opacity-60">
        <img
          src="/assets/features-bg.svg"
          alt="Decorative Background"
          className="object-cover w-5xl"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-4">
          Collab Dev IDE Features
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          A modern development environment designed for team collaboration and productivity.
        </p>

       <div className="flex flex-wrap justify-center gap-14">
  {/* First row: 3 items */}
  <div className="flex w-full justify-center gap-14">
    {features.slice(0, 3).map((feature, idx) => (
      <div key={idx} className="w-full md:w-1/3 flex">
        <div className="flex flex-col flex-grow h-full">
          <FeatureCard {...feature} />
        </div>
      </div>
    ))}
  </div>

  {/* Second row: 2 items centered */}
  <div className="flex w-full justify-center gap-14 mt-8">
    {features.slice(3).map((feature, idx) => (
      <div key={idx} className="w-full md:w-1/3 flex">
        <div className="flex flex-col flex-grow h-full">
          <FeatureCard {...feature} />
        </div>
      </div>
    ))}
  </div>
</div>



      </div>
    </section>
  );
}
