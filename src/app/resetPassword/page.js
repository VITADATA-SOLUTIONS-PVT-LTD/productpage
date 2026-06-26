"use client"
import { useState } from "react";
import Link from "next/link";
export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB] px-4">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md px-10 py-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.png"
            alt="VitaData Solutions"
            style={{ width: 189, height: 189, objectFit: 'contain' }}
          />
        </div>

        {!sent ? (
          <>
            {/* Heading */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Reset Password
              </h1>
              <p className="text-sm text-gray-500">
                Enter your email to receive a verification code
              </p>
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={`w-full px-4 py-3 rounded-lg border text-sm text-gray-800 placeholder-gray-400 outline-none transition-all
                  ${error
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  }`}
              />
              {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3.5 rounded-lg text-white text-sm font-semibold tracking-wide transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#3D2010' }}
              onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#D97757'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#3D2010'; }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send Verification Code"
              )}
            </button>

            {/* Back to Login */}
            <div className="mt-5 text-center">
               <Link href="./">
    <button

              className="inline-flex items-center gap-1.5 text-sm text-[#C0392B] hover:text-[#96281B] font-medium transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Login
            </button>
    </Link>
            </div>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Check your inbox</h2>
            <p className="text-sm text-gray-500 mb-6">
              We've sent a verification code to<br />
              <span className="font-medium text-gray-700">{email}</span>
            </p>
            
          </div>
        )}
      
      </div>
    
      {/* Help Button */}
       <button className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}