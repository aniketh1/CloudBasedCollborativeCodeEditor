'use client';
import { SignUp } from '@clerk/nextjs';
import { CodeSquare } from 'lucide-react';

export default function SignUpPage() {
  return (
    <section className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-[#0f0f11] transition-colors duration-300">
      
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-500 dark:to-blue-700 text-white p-10">
        <CodeSquare className="w-24 h-24 mb-4" />
        <h2 className="text-4xl font-extrabold mb-2">Welcome to Collab Dev</h2>
        <p className="text-lg text-blue-100 text-center max-w-sm">
          Real-time code collaboration for developers, students, and remote teams. Code. Connect. Create. Live.
        </p>
      </div>

      {/* Right Panel: Clerk Form */}
      <div className="flex items-center justify-center px-6 py-16 bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white text-center">
            Create your account
          </h1>
          <SignUp
            path="/sign-up"
            signInUrl="/sign-in" 
            routing="path"
            appearance={{
              elements: {
                formButtonPrimary:
                  'bg-blue-600 hover:bg-blue-700 text-white font-semibold transition duration-300',
                formFieldInput:
                  'border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-[#2a2a2a] text-black dark:text-white',
                footerActionLink: 'text-blue-600 hover:underline',
                headerTitle: 'text-xl font-bold text-gray-900 dark:text-white',
                card: 'shadow-lg bg-white dark:bg-[#1e1e1e] rounded-lg p-6',
              },
              variables: {
                colorPrimary: '#2563eb', // Tailwind blue-600
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}
