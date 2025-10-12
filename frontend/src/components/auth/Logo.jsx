import React from 'react'

const Logo = () => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg mb-6">
        <img
          src="/logo.png"
          alt="Egg Farm Logo"
          className="w-12 h-12 object-contain"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextElementSibling.style.display = 'block'
          }}
        />
        <div className="hidden w-12 h-12 bg-gradient-to-br from-emerald-500 to-purple-600 rounded-xl items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default Logo