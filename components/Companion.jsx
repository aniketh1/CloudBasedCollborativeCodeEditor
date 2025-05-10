'use client';
import React from "react";
import FeatureCard from "./FeatureCard";
import { Code, GraduationCap, ClipboardList, User2, Rocket } from "lucide-react";
import { Button } from "./ui/button";

const features = [
  {
    icon: <Code className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    title: "Developers",
    description: "Work faster with live collaboration, cloud saves, and smart tools.",
    buttonText: "Try Editor",
  },
  {
    icon: <GraduationCap className="w-8 h-8 text-green-600 dark:text-green-400" />,
    title: "Students",
    description: "Code distraction-free and team up on projects easily.",
    buttonText: "Join Challenge",
  },
  {
    icon: <ClipboardList className="w-8 h-8 text-sky-600 dark:text-sky-400" />,
    title: "Interviewers",
    description: "Run live interviews with sharing, history, and roles.",
    buttonText: "Explore Trending",
  },
  {
    icon: <User2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
    title: "Bootcamps",
    description: "Collaborate, track progress, and guide learners live.",
    buttonText: "Start Session",
  },
  {
    icon: <Rocket className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
    title: "Remote Teams",
    description: "Stay synced with shared workspace and chat support.",
    buttonText: "Collab Now",
  },
];

export default function Companion() {
  return (
    <section className="relative h-screen/2 overflow-hidden py-20 px-4 sm:px-6 lg:px-16 bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300">
      {/* Background SVG */}
      <div className="absolute top-[500px] right-[-100px] pointer-events-none z-0 opacity-30 dark:opacity-60">
        <img
          src="/assets/companion-bg.svg"
          alt="Decorative Background"
          className="object-cover"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-4">
          Your Coding Companion, No Matter Who You Are
        </h2>
        
      <div className="flex gap-8 mt-28  justify-center">
        {features.map((feature, idx) => (
            <div key={idx} className="w-full md:w-1/3 bg-[#2C3E50]/80 p-5 rounded-2xl flex flex-col gap-4">
                <FeatureCard 
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                 />
                <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md w-full transition">
                {feature.buttonText}
                </Button>
            </div>
        ))}
      </div>
      </div>
    </section>
  );
}
