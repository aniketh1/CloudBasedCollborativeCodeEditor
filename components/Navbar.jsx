'use client'
import React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react' // You can swap icons

function Navbar() {
  const { theme, setTheme } = useTheme()

  const isDark = theme === 'dark'

  return (
    <section className="bg-gray-100 dark:bg-[#353536] text-black dark:text-white h-[80px] transition-colors duration-300">
      <div className="flex p-2 justify-between items-center h-full">
        <div className="flex gap-10">
          <h1>LOGO</h1>
          <p className="font-bold text-3xl" style={{ fontFamily: "'Lucida Sans Typewriter', 'Lucida Console', monospace" }}>
            Collab Dev
          </p>
        </div>

        <div className="flex gap-7 mr-10 items-center">
          {['Home', 'About', 'Features', 'Contact'].map((item) => (
            <p key={item} className="bg-[#2FA1FF] w-[120px] text-center font-bold p-2 rounded-lg text-white cursor-pointer">
              {item}
            </p>
          ))}

          {/* Theme Toggle Styled Like Other Buttons */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`w-[50px] h-[45px] flex items-center justify-center rounded-lg font-bold text-white cursor-pointer transition-colors duration-300 ${
              isDark ? 'bg-yellow-500' : 'bg-[#2FA1FF]'
            }`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </section>
  )
}

export default Navbar
