"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const HelpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        <path fill="none" d="M0 0h48v48H0z" />
    </svg>
);

export default function StaffLoginPage() {
    const [loginType, setLoginType] = useState("phone"); // "phone" or "email"
    const [phoneNumber, setPhoneNumber] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotTarget, setForgotTarget] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPassword, setForgotNewPassword] = useState('');
    const [forgotStep, setForgotStep] = useState(1); // 1 = input phone/email, 2 = input otp and new password
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [showPendingModal, setShowPendingModal] = useState(false);

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess('');
        setForgotLoading(true);

        try {
            const isEmail = forgotTarget.includes('@');
            const payload = isEmail ? { email: forgotTarget } : { phoneNumber: forgotTarget };

            const res = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to send reset code');

            setForgotSuccess(data.message + (data.devOtp ? ` (DEV OTP: ${data.devOtp})` : ''));
            setForgotStep(2);
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess('');
        setForgotLoading(true);

        try {
            const isEmail = forgotTarget.includes('@');
            const payload = {
                otp: forgotOtp,
                newPassword: forgotNewPassword,
                ...(isEmail ? { email: forgotTarget } : { phoneNumber: forgotTarget }),
            };

            const res = await fetch(`${apiBaseUrl}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to reset password');

            setForgotSuccess('Password reset successfully! You can now sign in.');
            setTimeout(() => {
                setIsForgotModalOpen(false);
                setForgotTarget('');
                setForgotOtp('');
                setForgotNewPassword('');
                setForgotStep(1);
                setForgotSuccess('');
            }, 3000);
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const err = params.get('error');
        if (err) {
            Promise.resolve().then(() => {
                setError(decodeURIComponent(err));
            });
        }
    }, []);

    const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (!apiBaseUrl) {
                throw new Error("API URL is not configured");
            }

            const formattedPhone = loginType === 'phone' ? `${countryCode}${phoneNumber.trim()}` : '';

            const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: loginType === 'phone' ? formattedPhone : undefined,
                    email: loginType === 'email' ? email.trim().toLowerCase() : undefined,
                    password
                }),
            });

            const data = await response.json();

            if (!response.ok || data?.status !== 'OK' || !data?.accessToken) {
                if (response.status === 403 || data?.status === 'FORBIDDEN') {
                    setShowPendingModal(true);
                    return;
                }
                throw new Error(data?.error || data?.message || 'Login failed');
            }

            const isReceptionist = data?.roles?.includes('RECEPTIONIST');
            const isLabManager = data?.roles?.includes('LAB_MANAGER');

            if (!isReceptionist && !isLabManager) {
                throw new Error('This account does not have staff access');
            }

            if (isReceptionist) {
                localStorage.setItem('receptionistToken', data.accessToken);
                localStorage.setItem('receptionistRoles', JSON.stringify(data.roles));
                localStorage.setItem('receptionistUser', JSON.stringify(data.user));
                document.cookie = `receptionist_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
                router.push('/receptionist/dashboard');
            } else if (isLabManager) {
                localStorage.setItem('labStaffToken', data.accessToken);
                localStorage.setItem('labStaffRoles', JSON.stringify(data.roles));
                localStorage.setItem('labStaffUser', JSON.stringify(data.user));
                document.cookie = `lab_staff_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
                router.push('/lab-staff/dashboard');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center font-sans text-[#3D2010] relative overflow-hidden">
            {/* Main Card */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(217,119,87,0.08)] w-full max-w-[320px] sm:max-w-90 p-5 sm:p-7 flex flex-col items-center mx-4 border border-[rgba(255,204,172,0.3)] relative z-10 animate-fade-up">
                {/* Logo */}
                <div className="flex flex-col items-center mb-2">
                    <Link href="/" className="border-none bg-transparent cursor-pointer p-0" title="Back to Home">
                            <img src="/logo.png" alt="VitaData Solutions" className="w-21.25 sm:w-25 h-auto object-contain mb-1" />
                    </Link>
                </div>

                {/* Heading */}
                <h1 className="text-[20px] sm:text-[22px] font-bold text-[#3D2010] mb-1.5">Staff Login</h1>
                <p className="text-[#6B7280] text-[13px] sm:text-[14px] mb-3">Sign in to access your dashboard</p>

                {error && (
                    <div className="w-full mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] sm:text-[13px] text-red-700">
                        {error}
                    </div>
                )}

                {/* Login Method Toggle */}
                <div className="w-full flex border-b border-[#F3EAE5] mb-4">
                    <button
                        type="button"
                        onClick={() => { setLoginType("phone"); setError(""); }}
                        className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${loginType === 'phone' ? 'text-[#D97757] border-b-2 border-[#D97757]' : 'text-gray-400'}`}
                    >
                        Phone Number
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLoginType("email"); setError(""); }}
                        className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${loginType === 'email' ? 'text-[#D97757] border-b-2 border-[#D97757]' : 'text-gray-400'}`}
                    >
                        Email Address
                    </button>
                </div>

                {/* Form */}
                <form className="w-full" onSubmit={handleSubmit}>
                    {loginType === 'phone' ? (
                        <div className="mb-3.5">
                            <label className="block text-[#374151] text-[12px] sm:text-[13px] font-medium mb-1.5">Phone Number</label>
                            <div className="flex gap-2">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="px-2.5 py-2 rounded-lg border border-[rgba(255,204,172,0.4)] bg-white text-[13px] sm:text-[14px] text-[#3D2010] outline-none"
                                >
                                    <option value="+91">+91 (IN)</option>
                                    <option value="+1">+1 (US)</option>
                                    <option value="+44">+44 (UK)</option>
                                    <option value="+971">+971 (AE)</option>
                                </select>
                                <input
                                    type="tel"
                                    placeholder="9876543210"
                                    className="flex-1 px-3 py-2 rounded-lg border border-[rgba(255,204,172,0.4)] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] text-[13px] sm:text-[14px] text-[#3D2010]"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, ""); // Keep only digits
                                        if (val.length <= 10) {
                                            setPhoneNumber(val);
                                        }
                                    }}
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-3.5">
                            <label className="block text-[#374151] text-[12px] sm:text-[13px] font-medium mb-1.5">Email Address</label>
                            <input
                                type="email"
                                placeholder="staff@example.com"
                                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-[rgba(255,204,172,0.4)] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] text-[13px] sm:text-[14px] text-[#3D2010]"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-[#374151] text-[12px] sm:text-[13px] font-medium mb-1.5">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-[rgba(255,204,172,0.4)] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] text-[13px] sm:text-[14px] text-[#3D2010]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between mb-5">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-[#FFCCAC] text-[#D97757] focus:ring-[#D97757]" />
                            <span className="text-[#3D2010] text-[12px] sm:text-[13px] font-medium">Remember me</span>
                        </label>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setIsForgotModalOpen(true); }}
                            className="text-[#D97757] text-[12px] sm:text-[13px] hover:underline hover:text-[#9B6B5A]"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="hover-lift w-full bg-[#3D2010] hover:bg-[#D97757] disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors text-[13px] sm:text-[14px] mb-4 shadow-sm"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <div className="text-center mb-4">
                        <span className="text-xs text-gray-500 font-sans">Don&apos;t have an account? </span>
                        <Link href="/signup" className="text-xs font-bold text-[#D97757] hover:underline">
                            Apply/Sign Up
                        </Link>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center mb-4">
                        <div className="absolute w-full border-t border-[#E5E7EB]"></div>
                        <span className="relative bg-white px-3 text-[#9CA3AF] text-[11px] sm:text-[12px]">Or continue with</span>
                    </div>

                    {/* Google Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (!apiBaseUrl) return;
                            window.location.href = `${apiBaseUrl}/auth/google?state=${encodeURIComponent(window.location.pathname)}`;
                        }}
                        className="hover-lift w-full bg-white border border-[rgba(255,204,172,0.4)] hover:bg-[rgba(255,204,172,0.1)] text-[#3D2010] font-semibold py-2 sm:py-2.5 rounded-lg transition-colors text-[12px] sm:text-[13px] flex items-center justify-center gap-2 mb-5"
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>
                </form>
            </div>

            {/* Floating Help Button */}
            <button className="hover-lift absolute bottom-8 right-8 w-12 h-12 bg-[#3D2010] hover:bg-[#D97757] text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-20">
                <HelpIcon />
            </button>

            {/* Back to Home Link */}
            <Link href="/" className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-[#3D2010] hover:text-[#D97757] font-medium transition-colors text-[14px] sm:text-[16px] z-20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Home
            </Link>
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-sm w-full relative animate-in zoom-in-95 duration-200 text-left">
                        <button 
                            type="button"
                            onClick={() => {
                                setIsForgotModalOpen(false);
                                setForgotTarget('');
                                setForgotOtp('');
                                setForgotNewPassword('');
                                setForgotStep(1);
                                setForgotError('');
                                setForgotSuccess('');
                            }}
                            className="absolute right-4 top-4 rounded-full p-1.5 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <h2 className="text-lg font-bold text-[#3D2010] mb-2 font-sans">
                            Forgot Password
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">
                            {forgotStep === 1 
                                ? 'Enter your registered phone number or email to receive a verification code.' 
                                : 'Enter the code sent to your account and choose a new password.'
                            }
                        </p>

                        {forgotError && (
                            <div className="w-full mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                                {forgotError}
                            </div>
                        )}
                        {forgotSuccess && (
                            <div className="w-full mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                                {forgotSuccess}
                            </div>
                        )}

                        {forgotStep === 1 ? (
                            <form onSubmit={handleRequestReset} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Email or Phone Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. +919900000301 or mail@example.com"
                                        value={forgotTarget}
                                        onChange={(e) => setForgotTarget(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm font-sans disabled:opacity-50"
                                >
                                    {forgotLoading ? 'Sending...' : 'Send Verification Code'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Verification Code (OTP)</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        placeholder="Enter 6-digit code"
                                        value={forgotOtp}
                                        onChange={(e) => setForgotOtp(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter new password"
                                        value={forgotNewPassword}
                                        onChange={(e) => setForgotNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm font-sans disabled:opacity-50"
                                >
                                    {forgotLoading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
            {showPendingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-sm w-full relative animate-in zoom-in-95 duration-200 text-left">
                        <button 
                            type="button"
                            onClick={() => setShowPendingModal(false)}
                            className="absolute right-4 top-4 rounded-full p-1.5 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mb-4 animate-pulse">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>

                        <h2 className="text-lg font-bold text-[#3D2010] mb-2 font-sans text-center">
                            ID Under Review
                        </h2>
                        
                        <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                            Your account is pending administrator verification. Please wait until verification completes.
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowPendingModal(false)}
                            className="w-full py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm font-sans"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
