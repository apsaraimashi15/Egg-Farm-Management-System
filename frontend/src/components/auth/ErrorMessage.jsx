import React from 'react'

const ErrorMessage = ({ message }) => {
  if (!message) return null

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
      <div className="flex items-center">
        <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {message}
      </div>
    </div>
  )
}

export default ErrorMessage