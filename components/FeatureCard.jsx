// components/FeatureCard.jsx
import React from "react";

export default function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-[#2C3E50]/80 text-white rounded-xl p-6 shadow-md w-full md:w-auto">
      <div className="mb-3">
        <div className="w-full flex justify-center items-center">
          {icon}
        </div>  
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}
