import React from "react";

export default function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-[#2C3E50]/80 text-white text-left pt-[30px] rounded-xl p-6 shadow-md w-full md:w-auto h-full flex flex-col justify-between">
      <div className="mb-3 relative">
        <div className="bg-black/70 absolute left-[-10px] top-[-60px] p-4 rounded-lg shadow-lg">
          {icon}
        </div>  
      </div>
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      <p className="text-md text-gray-300">{description}</p>
    </div>
  );
}
