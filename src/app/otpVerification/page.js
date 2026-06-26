"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OtpVerificationPage() {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminSignupToken') : null;

      if (!token) {
        setStatus({ success: false, message: 'Signup token not found. Please sign up again.' });
        setLoading(false);
        return;
      }

      const res = await fetch(`${apiBase}/admin/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();
      setStatus({ success: data.success, message: data.message || (data.success ? 'Verified' : 'Verification failed') });

      if (data.success) {
        // on success redirect to admin login
        setTimeout(() => router.push('./admin'), 800);
      }
    } catch (err) {
      setStatus({ success: false, message: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[rgba(255,204,172,0.4)] shadow-[0_8px_30px_rgba(217,119,87,0.12)] p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <button  className="text-[#3D2010] hover:text-[#D97757] text-sm">
            Back
          </button>
          <button  className="text-[#3D2010] hover:text-[#D97757] text-sm">
            Home
          </button>
        </div>
        {/* Logo */}
                <div className="flex flex-col items-center mb-2">
                    <Link href={"./"}>
                    <button  className="border-none bg-transparent cursor-pointer p-0" title="Back to Home">
                        <img src="/logo.png" alt="VitaData Solutions" className="w-[85px] sm:w-[100px] h-auto object-contain mb-1" />
                    </button>
                    </Link>
                </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3D2010] mb-2">Verify OTP</h1>
        <p className="text-[#6B7280] mb-6">Enter the verification code sent to your email.</p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            required
            className="w-full text-gray-900 rounded-lg border border-[rgba(255,204,172,0.5)] px-4 py-3 tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-[#D97757]/20"
          />
          <button type="submit" className="w-full py-3 rounded-lg bg-[#3D2010] text-white hover:bg-[#D97757] transition-colors">
            Verify and Continue
          </button>
        </form>
      </div>
    </div>
  );
}
