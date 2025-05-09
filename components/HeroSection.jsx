'use client'
import React from "react";

export default function HeroSection() {
  return (
    <section className="w-full bg-background h-screen text-foreground py-20 px-6 md:px-12"
    style={{ backgroundImage: "url('/hero-bg.png')" }}>
      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 items-center gap-12">
        {/* Left Content */}
        <div className="bg-black/30 rounded-xl shadow-xl px-10 py-5">
            <h1 className="text-white font-bold text-5xl md:text-6xl font-mono leading-tight">
            Code. Connect. <br />
            Create. Live.
            </h1>
            <p className="mt-6 text-lg text-white/80 font-mono max-w-md">
            A collaborative coding platform where devs build together and learners
            watch it unfold – distraction-free.
            </p>

            {/* Terminal Style Button */}
            <div className="mt-6 flex items-center justify-center">
            <div className="bg-black/70 text-green-500 w-1/2 text-center font-mono px-4 py-2 inline-block rounded-md shadow">
                $ npm run dev
            </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-4 flex gap-4">
            <button className="bg-blue-400 text-white font-semibold px-6 py-2 rounded-lg">
                Get Started
            </button>
            <button className="bg-blue-400 text-white font-semibold px-6 py-2 rounded-lg">
                Explore
            </button>
            </div>
        </div>

        {/* Code Preview Card */}
        <div className="bg-[#2b2d3a] rounded-xl shadow-xl text-white p-6 relative">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
            </div>
            <span className="text-sm font-mono">Platform Preview</span>
            </div>

            {/* Code */}
            <pre className="text-sm font-mono whitespace-pre-wrap">
        {`// Join a live coding session
        const session = await CloudEditor.join("live-session-789");

        // Sync code in real-time
        session.editor.onChange((code) => {
        session.broadcast(code);
        });

        // Stream code to viewers (read-only mode)
        session.viewerMode = true;
        session.stream();`}
            </pre>
        </div>
    </div>

    </section>
  );
}
