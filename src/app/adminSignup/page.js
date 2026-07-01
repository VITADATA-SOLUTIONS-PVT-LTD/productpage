"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateAdminAccount() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    if (!apiBaseUrl) {
      setSubmitError("Missing API base URL. Set NEXT_PUBLIC_URL or NEXT_PUBLIC_API_URL.");
      return;
    }

    setIsLoading(true);
    setSubmitError("");

    try {
      const response = await fetch(`${apiBaseUrl}/admin/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        const message = data?.errors || data?.message || "Signup failed";
        throw new Error(Array.isArray(message) ? message.join("\n") : String(message));
      }

      if (data?.token) {
        localStorage.setItem("adminSignupToken", data.token);
        document.cookie = `admin_signup_token=${encodeURIComponent(data.token)}; path=/; max-age=86400; samesite=lax`;
      }

      router.push("/otpVerification");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-lg border text-sm text-gray-800 placeholder-gray-400 outline-none transition-all ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-[#F5F0EB] px-2 py-8">
      {/* Back to Home */}
      <div className="max-w-2xl mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150"
          style={{ color: '#3D2010' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#D97757'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3D2010'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-2xl mx-auto px-10 py-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.png"
            alt="VitaData Solutions"
            style={{ width: 189, height: 189, objectFit: 'contain' }}
          />
        </div>

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create Admin Account</h1>
          <p className="text-sm text-gray-500">Sign up to get started</p>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={handleChange("fullName")}
              className={inputClass("fullName")}
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange("email")}
              className={inputClass("email")}
            />
            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handleChange("phone")}
              className={inputClass("phone")}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange("password")}
                className={inputClass("password") + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                className={inputClass("confirmPassword") + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirm ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>
        </div>

        {/* Create Account Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full mt-6 py-3.5 rounded-lg text-white text-sm font-semibold tracking-wide transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
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
              Creating Account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>

        {/* Sign In Link */}
        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/admin">
            <button
              className="font-medium transition-colors duration-150"
              style={{ color: '#D97757' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#3D2010'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#D97757'; }}
            >
              Sign in
            </button>
          </Link>
        </p>
      </div>

      {/* Help Button */}
      <button
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg transition-colors duration-150"
        style={{ backgroundColor: '#3D2010' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D97757'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#3D2010'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}