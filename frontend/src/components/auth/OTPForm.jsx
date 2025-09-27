import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ErrorMessage from './ErrorMessage'

const otpSchema = yup.object({
  otp: yup.string().required('OTP is required').length(6, 'OTP must be 6 digits')
})

const OTPForm = ({ onSubmit, loading, error, userEmail, onBack }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(otpSchema)
  })

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
        <p className="text-slate-600">
          We've sent a 6-digit OTP to <strong>{userEmail}</strong>
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <ErrorMessage message={error} />

        <div>
          <label htmlFor="otp" className="block text-sm font-semibold text-slate-700 mb-2">
            Enter OTP
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <input
              {...register('otp')}
              type="text"
              maxLength="6"
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
            />
          </div>
          {errors.otp && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.otp.message}
            </p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Verifying...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verify OTP
              </div>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            ← Back to registration
          </button>
        </div>
      </form>
    </>
  )
}

export default OTPForm