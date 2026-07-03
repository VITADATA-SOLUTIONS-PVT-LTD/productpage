"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const countryCodes = ["+91", "+1", "+44", "+61"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PatientLoginPage() {
  const router = useRouter();
  const [identifierType, setIdentifierType] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState("profile");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupForm, setSetupForm] = useState({ firstName: "", lastName: "", email: "", dob: "", gender: "", verifyCode: "" });

  const loginValue = identifierType === "phone" ? `${countryCode}${phoneNumber.replace(/\D/g, "")}` : email.trim();
  const loginValid = useMemo(() => (identifierType === "email" ? emailRegex.test(loginValue) : String(phoneNumber).replace(/\D/g, "").length >= 10), [identifierType, loginValue, phoneNumber]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      if (!loginValid) throw new Error(identifierType === "email" ? "Enter a valid email address" : "Enter a valid phone number");

      const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifierType === "email" ? loginValue : undefined,
          phoneNumber: identifierType === "phone" ? loginValue : undefined,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) throw new Error(data?.message || data?.error || "Login failed");

      if (data?.setUp === false || data?.needsProfileSetup) {
        setSetupOpen(true);
        setSetupStep("profile");
        setSetupForm((current) => ({ ...current, email: identifierType === "email" ? loginValue : current.email }));
        return;
      }

      localStorage.setItem("patientToken", data.accessToken);
      localStorage.setItem("patientRoles", JSON.stringify(data.roles || ["PATIENT"]));
      localStorage.setItem("patientUser", JSON.stringify(data.user || {}));
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSetup = async (event) => {
    event.preventDefault();
    setSetupError("");

    if (setupStep === "profile") {
      if (!setupForm.firstName.trim() || !setupForm.lastName.trim()) {
        setSetupError("Enter your name to continue");
        return;
      }
      if (!emailRegex.test(setupForm.email.trim())) {
        setSetupError("Enter a valid email address");
        return;
      }
      setSetupStep("verify");
      return;
    }

    setSetupSubmitting(true);
    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp-temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: setupForm.verifyCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) throw new Error(data?.message || "Verification failed");
      localStorage.setItem("patientToken", data.accessToken);
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setSetupError(requestError.message || "Verification failed");
    } finally {
      setSetupSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1EA] px-4 py-10 text-[#3D2010]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center rounded-[36px] border border-[#E9D8CC] bg-white p-6 shadow-[0_24px_80px_rgba(61,32,16,0.08)] sm:p-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-[linear-gradient(160deg,#3D2010_0%,#5E3523_50%,#D97757_100%)] p-8 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F8D7C8]">Patient access</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Sign in with phone or email</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#F7E8DD]">New patients can verify their details in the setup modal before reaching the dashboard. Existing patients continue directly after login.</p>
            <div className="mt-8 rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold">Need an account?</p>
              <Link href="/signup" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3D2010]">Create one</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E9D8CC] bg-[#FFFDFB] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2F1A10]">Patient Login</h2>
              <p className="mt-2 text-sm text-[#806B61]">Use your registered phone number or email address.</p>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Login with</label>
                <div className="inline-flex rounded-full border border-[#E3D4CC] bg-white p-1">
                  {[ ["phone", "Phone"], ["email", "Email"] ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setIdentifierType(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${identifierType === value ? "bg-[#3D2010] text-white" : "text-[#6B554A] hover:text-[#D97757]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {identifierType === "email" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Email address</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="name@example.com" />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Phone number</label>
                  <div className="flex gap-3">
                    <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-28 rounded-2xl border border-[#E3D4CC] px-3 py-3 outline-none focus:border-[#D97757]">
                      {countryCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Phone number" />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Password" />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                {loading ? "Signing in..." : "Continue"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[#806B61]">New here? <Link href="/signup" className="font-semibold text-[#D97757]">Sign up</Link></p>
          </div>
        </div>
      </div>

      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.18)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B17D67]">First time patient setup</p>
              <h3 className="mt-2 text-2xl font-bold text-[#2F1A10]">Complete your profile</h3>
            </div>

            {setupError && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{setupError}</div>}

            <form onSubmit={submitSetup} className="space-y-4">
              {setupStep === "profile" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="First name" value={setupForm.firstName} onChange={(event) => setSetupForm((current) => ({ ...current, firstName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                    <input placeholder="Last name" value={setupForm.lastName} onChange={(event) => setSetupForm((current) => ({ ...current, lastName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  </div>
                  <input type="email" placeholder="Email address" value={setupForm.email} onChange={(event) => setSetupForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <input placeholder="Date of birth" type="date" value={setupForm.dob} onChange={(event) => setSetupForm((current) => ({ ...current, dob: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <select value={setupForm.gender} onChange={(event) => setSetupForm((current) => ({ ...current, gender: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]">
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#806B61]">We have sent a verification code to the identifier you used to log in.</p>
                  <input placeholder="Verification code" value={setupForm.verifyCode} onChange={(event) => setSetupForm((current) => ({ ...current, verifyCode: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                {setupStep === "verify" && <button type="button" onClick={() => setSetupStep("profile")} className="rounded-full border border-[#E3D4CC] px-4 py-2 text-sm font-semibold text-[#6B554A]">Back</button>}
                <button type="submit" disabled={setupSubmitting} className="rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                  {setupSubmitting ? "Verifying..." : setupStep === "profile" ? "Continue" : "Finish setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const countryCodes = ["+91", "+1", "+44", "+61"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PatientLoginPage() {
  const router = useRouter();
  const [identifierType, setIdentifierType] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState("profile");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupForm, setSetupForm] = useState({ firstName: "", lastName: "", email: "", dob: "", gender: "", verifyCode: "" });

  const loginValue = identifierType === "phone" ? `${countryCode}${phoneNumber.replace(/\D/g, "")}` : email.trim();
  const loginValid = useMemo(
    () => (identifierType === "email" ? emailRegex.test(loginValue) : String(phoneNumber).replace(/\D/g, "").length >= 10),
    [identifierType, loginValue, phoneNumber],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      if (!loginValid) throw new Error(identifierType === "email" ? "Enter a valid email address" : "Enter a valid phone number");

      const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifierType === "email" ? loginValue : undefined,
          phoneNumber: identifierType === "phone" ? loginValue : undefined,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || data?.error || "Login failed");
      }

      if (data?.setUp === false || data?.needsProfileSetup) {
        setSetupOpen(true);
        setSetupStep("profile");
        setSetupForm((current) => ({ ...current, email: identifierType === "email" ? loginValue : current.email }));
        return;
      }

      localStorage.setItem("patientToken", data.accessToken);
      localStorage.setItem("patientRoles", JSON.stringify(data.roles || ["PATIENT"]));
      localStorage.setItem("patientUser", JSON.stringify(data.user || {}));
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSetup = async (event) => {
    event.preventDefault();
    setSetupError("");

    if (setupStep === "profile") {
      if (!setupForm.firstName.trim() || !setupForm.lastName.trim()) {
        setSetupError("Enter your name to continue");
        return;
      }
      if (!emailRegex.test(setupForm.email.trim())) {
        setSetupError("Enter a valid email address");
        return;
      }
      setSetupStep("verify");
      return;
    }

    setSetupSubmitting(true);
    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp-temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: setupForm.verifyCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || "Verification failed");
      }
      localStorage.setItem("patientToken", data.accessToken);
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setSetupError(requestError.message || "Verification failed");
    } finally {
      setSetupSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1EA] px-4 py-10 text-[#3D2010]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center rounded-[36px] border border-[#E9D8CC] bg-white p-6 shadow-[0_24px_80px_rgba(61,32,16,0.08)] sm:p-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-[linear-gradient(160deg,#3D2010_0%,#5E3523_50%,#D97757_100%)] p-8 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F8D7C8]">Patient access</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Sign in with phone or email</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#F7E8DD]">New patients can verify their details in the setup modal before reaching the dashboard. Existing patients continue directly after login.</p>
            <div className="mt-8 rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold">Need an account?</p>
              <Link href="/signup" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3D2010]">Create one</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E9D8CC] bg-[#FFFDFB] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2F1A10]">Patient Login</h2>
              <p className="mt-2 text-sm text-[#806B61]">Use your registered phone number or email address.</p>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Login with</label>
                <div className="inline-flex rounded-full border border-[#E3D4CC] bg-white p-1">
                  {[["phone", "Phone"], ["email", "Email"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setIdentifierType(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${identifierType === value ? "bg-[#3D2010] text-white" : "text-[#6B554A] hover:text-[#D97757]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {identifierType === "email" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Email address</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="name@example.com" />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Phone number</label>
                  <div className="flex gap-3">
                    <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-28 rounded-2xl border border-[#E3D4CC] px-3 py-3 outline-none focus:border-[#D97757]">
                      {countryCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Phone number" />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Password" />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                {loading ? "Signing in..." : "Continue"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[#806B61]">New here? <Link href="/signup" className="font-semibold text-[#D97757]">Sign up</Link></p>
          </div>
        </div>
      </div>

      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.18)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B17D67]">First time patient setup</p>
              <h3 className="mt-2 text-2xl font-bold text-[#2F1A10]">Complete your profile</h3>
            </div>

            {setupError && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{setupError}</div>}

            <form onSubmit={submitSetup} className="space-y-4">
              {setupStep === "profile" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="First name" value={setupForm.firstName} onChange={(event) => setSetupForm((current) => ({ ...current, firstName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                    <input placeholder="Last name" value={setupForm.lastName} onChange={(event) => setSetupForm((current) => ({ ...current, lastName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  </div>
                  <input type="email" placeholder="Email address" value={setupForm.email} onChange={(event) => setSetupForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <input placeholder="Date of birth" type="date" value={setupForm.dob} onChange={(event) => setSetupForm((current) => ({ ...current, dob: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <select value={setupForm.gender} onChange={(event) => setSetupForm((current) => ({ ...current, gender: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]">
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#806B61]">We have sent a verification code to the identifier you used to log in.</p>
                  <input placeholder="Verification code" value={setupForm.verifyCode} onChange={(event) => setSetupForm((current) => ({ ...current, verifyCode: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                {setupStep === "verify" && <button type="button" onClick={() => setSetupStep("profile")} className="rounded-full border border-[#E3D4CC] px-4 py-2 text-sm font-semibold text-[#6B554A]">Back</button>}
                <button type="submit" disabled={setupSubmitting} className="rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                  {setupSubmitting ? "Verifying..." : setupStep === "profile" ? "Continue" : "Finish setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const countryCodes = ["+91", "+1", "+44", "+61"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PatientLoginPage() {
  const router = useRouter();
  const [identifierType, setIdentifierType] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState("profile");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupForm, setSetupForm] = useState({ firstName: "", lastName: "", email: "", dob: "", gender: "", verifyCode: "" });

  const loginValue = identifierType === "phone" ? `${countryCode}${phoneNumber.replace(/\D/g, "")}` : email.trim();
  const loginValid = useMemo(
    () => (identifierType === "email" ? emailRegex.test(loginValue) : String(phoneNumber).replace(/\D/g, "").length >= 10),
    [identifierType, loginValue, phoneNumber],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      if (!loginValid) throw new Error(identifierType === "email" ? "Enter a valid email address" : "Enter a valid phone number");

      const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifierType === "email" ? loginValue : undefined,
          phoneNumber: identifierType === "phone" ? loginValue : undefined,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || data?.error || "Login failed");
      }

      if (data?.setUp === false || data?.needsProfileSetup) {
        setSetupOpen(true);
        setSetupStep("profile");
        setSetupForm((current) => ({ ...current, email: identifierType === "email" ? loginValue : current.email }));
        return;
      }
  </div>
  );
}
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState("profile");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupForm, setSetupForm] = useState({ firstName: "", lastName: "", email: "", dob: "", gender: "", verifyCode: "" });

  const loginValue = identifierType === "phone" ? `${countryCode}${phoneNumber.replace(/\D/g, "")}` : email.trim();
  const loginValid = useMemo(
    () => (identifierType === "email" ? emailRegex.test(loginValue) : String(phoneNumber).replace(/\D/g, "").length >= 10),
    [identifierType, loginValue, phoneNumber],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      if (!loginValid) throw new Error(identifierType === "email" ? "Enter a valid email address" : "Enter a valid phone number");

      const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifierType === "email" ? loginValue : undefined,
          phoneNumber: identifierType === "phone" ? loginValue : undefined,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || data?.error || "Login failed");
      }

      if (data?.setUp === false || data?.needsProfileSetup) {
        setSetupOpen(true);
        setSetupStep("profile");
        setSetupForm((current) => ({ ...current, email: identifierType === "email" ? loginValue : current.email }));
        return;
      }

      localStorage.setItem("patientToken", data.accessToken);
      localStorage.setItem("patientRoles", JSON.stringify(data.roles || ["PATIENT"]));
      localStorage.setItem("patientUser", JSON.stringify(data.user || {}));
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSetup = async (event) => {
    event.preventDefault();
    setSetupError("");

    if (setupStep === "profile") {
      if (!setupForm.firstName.trim() || !setupForm.lastName.trim()) {
        setSetupError("Enter your name to continue");
        return;
      }
      if (!emailRegex.test(setupForm.email.trim())) {
        setSetupError("Enter a valid email address");
        return;
      }
      setSetupStep("verify");
      return;
    }

    setSetupSubmitting(true);
    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp-temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: setupForm.verifyCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || "Verification failed");
      }
      localStorage.setItem("patientToken", data.accessToken);
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setSetupError(requestError.message || "Verification failed");
    } finally {
      setSetupSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1EA] px-4 py-10 text-[#3D2010]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center rounded-[36px] border border-[#E9D8CC] bg-white p-6 shadow-[0_24px_80px_rgba(61,32,16,0.08)] sm:p-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-[linear-gradient(160deg,#3D2010_0%,#5E3523_50%,#D97757_100%)] p-8 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F8D7C8]">Patient access</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Sign in with phone or email</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#F7E8DD]">New patients can verify their details in the setup modal before reaching the dashboard. Existing patients continue directly after login.</p>
            <div className="mt-8 rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold">Need an account?</p>
              <Link href="/signup" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3D2010]">Create one</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E9D8CC] bg-[#FFFDFB] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2F1A10]">Patient Login</h2>
              <p className="mt-2 text-sm text-[#806B61]">Use your registered phone number or email address.</p>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Login with</label>
                <div className="inline-flex rounded-full border border-[#E3D4CC] bg-white p-1">
                  {[["phone", "Phone"], ["email", "Email"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setIdentifierType(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${identifierType === value ? "bg-[#3D2010] text-white" : "text-[#6B554A] hover:text-[#D97757]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {identifierType === "email" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Email address</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="name@example.com" />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Phone number</label>
                  <div className="flex gap-3">
                    <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-28 rounded-2xl border border-[#E3D4CC] px-3 py-3 outline-none focus:border-[#D97757]">
                      {countryCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Phone number" />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Password" />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                {loading ? "Signing in..." : "Continue"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[#806B61]">New here? <Link href="/signup" className="font-semibold text-[#D97757]">Sign up</Link></p>
          </div>
        </div>
      </div>

      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.18)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B17D67]">First time patient setup</p>
              <h3 className="mt-2 text-2xl font-bold text-[#2F1A10]">Complete your profile</h3>
            </div>

            {setupError && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{setupError}</div>}

            <form onSubmit={submitSetup} className="space-y-4">
              {setupStep === "profile" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="First name" value={setupForm.firstName} onChange={(event) => setSetupForm((current) => ({ ...current, firstName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                    <input placeholder="Last name" value={setupForm.lastName} onChange={(event) => setSetupForm((current) => ({ ...current, lastName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  </div>
                  <input type="email" placeholder="Email address" value={setupForm.email} onChange={(event) => setSetupForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <input placeholder="Date of birth" type="date" value={setupForm.dob} onChange={(event) => setSetupForm((current) => ({ ...current, dob: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <select value={setupForm.gender} onChange={(event) => setSetupForm((current) => ({ ...current, gender: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]">
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#806B61]">We have sent a verification code to the identifier you used to log in.</p>
                  <input placeholder="Verification code" value={setupForm.verifyCode} onChange={(event) => setSetupForm((current) => ({ ...current, verifyCode: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                {setupStep === "verify" && <button type="button" onClick={() => setSetupStep("profile")} className="rounded-full border border-[#E3D4CC] px-4 py-2 text-sm font-semibold text-[#6B554A]">Back</button>}
                <button type="submit" disabled={setupSubmitting} className="rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                  {setupSubmitting ? "Verifying..." : setupStep === "profile" ? "Continue" : "Finish setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const countryCodes = ["+91", "+1", "+44", "+61"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PatientLoginPage() {
  const router = useRouter();
  const [identifierType, setIdentifierType] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState("profile");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupForm, setSetupForm] = useState({ firstName: "", lastName: "", email: "", dob: "", gender: "", verifyCode: "" });

  const loginValue = identifierType === "phone" ? `${countryCode}${phoneNumber.replace(/\D/g, "")}` : email.trim();
  const loginValid = useMemo(
    () => (identifierType === "email" ? emailRegex.test(loginValue) : String(phoneNumber).replace(/\D/g, "").length >= 10),
    [identifierType, loginValue, phoneNumber],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      if (!loginValid) throw new Error(identifierType === "email" ? "Enter a valid email address" : "Enter a valid phone number");

      const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifierType === "email" ? loginValue : undefined,
          phoneNumber: identifierType === "phone" ? loginValue : undefined,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || data?.error || "Login failed");
      }

      if (data?.setUp === false || data?.needsProfileSetup) {
        setSetupOpen(true);
        setSetupStep("profile");
        setSetupForm((current) => ({
          ...current,
          email: identifierType === "email" ? loginValue : current.email,
        }));
        return;
      }

      localStorage.setItem("patientToken", data.accessToken);
      localStorage.setItem("patientRoles", JSON.stringify(data.roles || ["PATIENT"]));
      localStorage.setItem("patientUser", JSON.stringify(data.user || {}));
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSetup = async (event) => {
    event.preventDefault();
    setSetupError("");

    if (setupStep === "profile") {
      if (!setupForm.firstName.trim() || !setupForm.lastName.trim()) {
        setSetupError("Enter your name to continue");
        return;
      }
      if (!emailRegex.test(setupForm.email.trim())) {
        setSetupError("Enter a valid email address");
        return;
      }
      setSetupStep("verify");
      return;
    }

    setSetupSubmitting(true);
    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp-temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: setupForm.verifyCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || "Verification failed");
      }
      localStorage.setItem("patientToken", data.accessToken);
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setSetupError(requestError.message || "Verification failed");
    } finally {
      setSetupSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1EA] px-4 py-10 text-[#3D2010]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center rounded-[36px] border border-[#E9D8CC] bg-white p-6 shadow-[0_24px_80px_rgba(61,32,16,0.08)] sm:p-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-[linear-gradient(160deg,#3D2010_0%,#5E3523_50%,#D97757_100%)] p-8 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F8D7C8]">Patient access</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Sign in with phone or email</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#F7E8DD]">New patients can verify their details in the setup modal before reaching the dashboard. Existing patients continue directly after login.</p>
            <div className="mt-8 rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold">Need an account?</p>
              <Link href="/signup" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3D2010]">Create one</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E9D8CC] bg-[#FFFDFB] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2F1A10]">Patient Login</h2>
              <p className="mt-2 text-sm text-[#806B61]">Use your registered phone number or email address.</p>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Login with</label>
                <div className="inline-flex rounded-full border border-[#E3D4CC] bg-white p-1">
                  {[["phone", "Phone"], ["email", "Email"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setIdentifierType(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${identifierType === value ? "bg-[#3D2010] text-white" : "text-[#6B554A] hover:text-[#D97757]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {identifierType === "email" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Email address</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="name@example.com" />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Phone number</label>
                  <div className="flex gap-3">
                    <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-28 rounded-2xl border border-[#E3D4CC] px-3 py-3 outline-none focus:border-[#D97757]">
                      {countryCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Phone number" />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Password" />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                {loading ? "Signing in..." : "Continue"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[#806B61]">New here? <Link href="/signup" className="font-semibold text-[#D97757]">Sign up</Link></p>
          </div>
        </div>
      </div>

      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.18)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B17D67]">First time patient setup</p>
              <h3 className="mt-2 text-2xl font-bold text-[#2F1A10]">Complete your profile</h3>
            </div>

            {setupError && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{setupError}</div>}

            <form onSubmit={submitSetup} className="space-y-4">
              {setupStep === "profile" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="First name" value={setupForm.firstName} onChange={(event) => setSetupForm((current) => ({ ...current, firstName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                    <input placeholder="Last name" value={setupForm.lastName} onChange={(event) => setSetupForm((current) => ({ ...current, lastName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  </div>
                  <input type="email" placeholder="Email address" value={setupForm.email} onChange={(event) => setSetupForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <input placeholder="Date of birth" type="date" value={setupForm.dob} onChange={(event) => setSetupForm((current) => ({ ...current, dob: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <select value={setupForm.gender} onChange={(event) => setSetupForm((current) => ({ ...current, gender: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]">
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#806B61]">We have sent a verification code to the identifier you used to log in.</p>
                  <input placeholder="Verification code" value={setupForm.verifyCode} onChange={(event) => setSetupForm((current) => ({ ...current, verifyCode: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                {setupStep === "verify" && <button type="button" onClick={() => setSetupStep("profile")} className="rounded-full border border-[#E3D4CC] px-4 py-2 text-sm font-semibold text-[#6B554A]">Back</button>}
                <button type="submit" disabled={setupSubmitting} className="rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                  {setupSubmitting ? "Verifying..." : setupStep === "profile" ? "Continue" : "Finish setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const countryCodes = ["+91", "+1", "+44", "+61"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PatientLoginPage() {
  const router = useRouter();
  const [identifierType, setIdentifierType] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState("profile");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupForm, setSetupForm] = useState({ firstName: "", lastName: "", email: "", dob: "", gender: "", verifyCode: "" });

  const loginValue = identifierType === "phone" ? `${countryCode}${phoneNumber.replace(/\D/g, "")}` : email.trim();
  const loginValid = useMemo(() => identifierType === "email" ? emailRegex.test(loginValue) : String(phoneNumber).replace(/\D/g, "").length >= 10, [identifierType, loginValue, phoneNumber]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      if (!loginValid) throw new Error(identifierType === "email" ? "Enter a valid email address" : "Enter a valid phone number");

      const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifierType === "email" ? loginValue : undefined,
          phoneNumber: identifierType === "phone" ? loginValue : undefined,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || data?.error || "Login failed");
      }

      if (data?.setUp === false || data?.needsProfileSetup) {
        setSetupOpen(true);
        setSetupStep("profile");
        setSetupForm((current) => ({
          ...current,
          email: identifierType === "email" ? loginValue : current.email,
        }));
        return;
      }

      localStorage.setItem("patientToken", data.accessToken);
      localStorage.setItem("patientRoles", JSON.stringify(data.roles || ["PATIENT"]));
      localStorage.setItem("patientUser", JSON.stringify(data.user || {}));
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSetup = async (event) => {
    event.preventDefault();
    setSetupError("");

    if (setupStep === "profile") {
      if (!setupForm.firstName.trim() || !setupForm.lastName.trim()) {
        setSetupError("Enter your name to continue");
        return;
      }
      if (!emailRegex.test(setupForm.email.trim())) {
        setSetupError("Enter a valid email address");
        return;
      }
      setSetupStep("verify");
      return;
    }

    setSetupSubmitting(true);
    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp-temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: setupForm.verifyCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || "Verification failed");
      }
      localStorage.setItem("patientToken", data.accessToken);
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setSetupError(requestError.message || "Verification failed");
    } finally {
      setSetupSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1EA] px-4 py-10 text-[#3D2010]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center rounded-[36px] border border-[#E9D8CC] bg-white p-6 shadow-[0_24px_80px_rgba(61,32,16,0.08)] sm:p-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-[linear-gradient(160deg,#3D2010_0%,#5E3523_50%,#D97757_100%)] p-8 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F8D7C8]">Patient access</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Sign in with phone or email</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#F7E8DD]">New patients can verify their details in the setup modal before reaching the dashboard. Existing patients continue directly after login.</p>
            <div className="mt-8 rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold">Need an account?</p>
              <Link href="/signup" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3D2010]">Create one</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E9D8CC] bg-[#FFFDFB] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2F1A10]">Patient Login</h2>
              <p className="mt-2 text-sm text-[#806B61]">Use your registered phone number or email address.</p>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Login with</label>
                <div className="inline-flex rounded-full border border-[#E3D4CC] bg-white p-1">
                  {[["phone", "Phone"], ["email", "Email"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setIdentifierType(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${identifierType === value ? "bg-[#3D2010] text-white" : "text-[#6B554A] hover:text-[#D97757]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {identifierType === "email" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Email address</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="name@example.com" />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Phone number</label>
                  <div className="flex gap-3">
                    <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-28 rounded-2xl border border-[#E3D4CC] px-3 py-3 outline-none focus:border-[#D97757]">
                      {countryCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Phone number" />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Password" />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                {loading ? "Signing in..." : "Continue"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[#806B61]">New here? <Link href="/signup" className="font-semibold text-[#D97757]">Sign up</Link></p>
          </div>
        </div>
      </div>

      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.18)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B17D67]">First time patient setup</p>
              <h3 className="mt-2 text-2xl font-bold text-[#2F1A10]">Complete your profile</h3>
            </div>

            {setupError && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{setupError}</div>}

            <form onSubmit={submitSetup} className="space-y-4">
              {setupStep === "profile" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="First name" value={setupForm.firstName} onChange={(event) => setSetupForm((current) => ({ ...current, firstName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                    <input placeholder="Last name" value={setupForm.lastName} onChange={(event) => setSetupForm((current) => ({ ...current, lastName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  </div>
                  <input type="email" placeholder="Email address" value={setupForm.email} onChange={(event) => setSetupForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <input placeholder="Date of birth" type="date" value={setupForm.dob} onChange={(event) => setSetupForm((current) => ({ ...current, dob: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <select value={setupForm.gender} onChange={(event) => setSetupForm((current) => ({ ...current, gender: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]">
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#806B61]">We have sent a verification code to the identifier you used to log in.</p>
                  <input placeholder="Verification code" value={setupForm.verifyCode} onChange={(event) => setSetupForm((current) => ({ ...current, verifyCode: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                {setupStep === "verify" && <button type="button" onClick={() => setSetupStep("profile")} className="rounded-full border border-[#E3D4CC] px-4 py-2 text-sm font-semibold text-[#6B554A]">Back</button>}
                <button type="submit" disabled={setupSubmitting} className="rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                  {setupSubmitting ? "Verifying..." : setupStep === "profile" ? "Continue" : "Finish setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const countryCodes = ["+91", "+1", "+44", "+61"];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PatientLoginPage() {
  const router = useRouter();
  const [identifierType, setIdentifierType] = useState("phone");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState("profile");
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupForm, setSetupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dob: "",
    gender: "",
    verifyCode: "",
  });

  const loginValue = identifierType === "phone" ? `${countryCode}${phoneNumber.replace(/\D/g, "")}` : email.trim();
  const isEmailLogin = identifierType === "email";

  const loginValid = useMemo(() => {
    if (isEmailLogin) return emailRegex.test(loginValue);
    return String(phoneNumber).replace(/\D/g, "").length >= 10;
  }, [identifierType, email, phoneNumber]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      if (!loginValid) throw new Error(isEmailLogin ? "Enter a valid email address" : "Enter a valid phone number");

      const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isEmailLogin ? loginValue : undefined,
          phoneNumber: isEmailLogin ? undefined : loginValue,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || data?.error || "Login failed");
      }

      if (data?.setUp === false || data?.needsProfileSetup) {
        setSetupOpen(true);
        setSetupStep("profile");
        setSetupForm((current) => ({
          ...current,
          email: isEmailLogin ? loginValue : "",
          phoneNumber: isEmailLogin ? "" : loginValue,
        }));
        return;
      }

      localStorage.setItem("patientToken", data.accessToken);
      localStorage.setItem("patientRoles", JSON.stringify(data.roles || ["PATIENT"]));
      localStorage.setItem("patientUser", JSON.stringify(data.user || {}));
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submitSetup = async (event) => {
    event.preventDefault();
    setSetupError("");

    if (setupStep === "profile") {
      if (!setupForm.firstName.trim() || !setupForm.lastName.trim()) {
        setSetupError("Enter your name to continue");
        return;
      }
      if (!emailRegex.test(setupForm.email.trim())) {
        setSetupError("Enter a valid email address");
        return;
      }
      setSetupStep("verify");
      return;
    }

    setSetupSubmitting(true);
    try {
      if (!apiBaseUrl) throw new Error("API URL is not configured");
      const response = await fetch(`${apiBaseUrl}/auth/verify-otp-temp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: setupForm.verifyCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.status !== "OK" || !data?.accessToken) {
        throw new Error(data?.message || "Verification failed");
      }
      localStorage.setItem("patientToken", data.accessToken);
      document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;
      router.push("/patient/dashboard");
    } catch (requestError) {
      setSetupError(requestError.message || "Verification failed");
    } finally {
      setSetupSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1EA] px-4 py-10 text-[#3D2010]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center rounded-[36px] border border-[#E9D8CC] bg-white p-6 shadow-[0_24px_80px_rgba(61,32,16,0.08)] sm:p-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-[linear-gradient(160deg,#3D2010_0%,#5E3523_50%,#D97757_100%)] p-8 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F8D7C8]">Patient access</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">Sign in with phone or email</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#F7E8DD]">New patients can verify their details in the setup modal before reaching the dashboard. Existing patients continue directly after login.</p>
            <div className="mt-8 rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-semibold">Need an account?</p>
              <Link href="/signup" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3D2010]">Create one</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E9D8CC] bg-[#FFFDFB] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#2F1A10]">Patient Login</h2>
              <p className="mt-2 text-sm text-[#806B61]">Use your registered phone number or email address.</p>
            </div>

            {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Login with</label>
                <div className="inline-flex rounded-full border border-[#E3D4CC] bg-white p-1">
                  {[
                    ["phone", "Phone"],
                    ["email", "Email"],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setIdentifierType(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${identifierType === value ? "bg-[#3D2010] text-white" : "text-[#6B554A] hover:text-[#D97757]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {isEmailLogin ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Email address</label>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="name@example.com" />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#554238]">Phone number</label>
                  <div className="flex gap-3">
                    <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="w-28 rounded-2xl border border-[#E3D4CC] px-3 py-3 outline-none focus:border-[#D97757]">
                      {countryCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <input type="tel" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="min-w-0 flex-1 rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Phone number" />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#554238]">Password</label>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" placeholder="Password" />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                {loading ? "Signing in..." : "Continue"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[#806B61]">New here? <Link href="/signup" className="font-semibold text-[#D97757]">Sign up</Link></p>
          </div>
        </div>
      </div>

      {setupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-[0_30px_100px_rgba(0,0,0,0.18)]">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B17D67]">First time patient setup</p>
              <h3 className="mt-2 text-2xl font-bold text-[#2F1A10]">Complete your profile</h3>
            </div>

            {setupError && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{setupError}</div>}

            <form onSubmit={submitSetup} className="space-y-4">
              {setupStep === "profile" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input placeholder="First name" value={setupForm.firstName} onChange={(event) => setSetupForm((current) => ({ ...current, firstName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                    <input placeholder="Last name" value={setupForm.lastName} onChange={(event) => setSetupForm((current) => ({ ...current, lastName: event.target.value }))} className="rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  </div>
                  <input type="email" placeholder="Email address" value={setupForm.email} onChange={(event) => setSetupForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <input placeholder="Date of birth" type="date" value={setupForm.dob} onChange={(event) => setSetupForm((current) => ({ ...current, dob: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                  <select value={setupForm.gender} onChange={(event) => setSetupForm((current) => ({ ...current, gender: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]">
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#806B61]">We have sent a verification code to the identifier you used to log in.</p>
                  <input placeholder="Verification code" value={setupForm.verifyCode} onChange={(event) => setSetupForm((current) => ({ ...current, verifyCode: event.target.value }))} className="w-full rounded-2xl border border-[#E3D4CC] px-4 py-3 outline-none focus:border-[#D97757]" />
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                {setupStep === "verify" && (
                  <button type="button" onClick={() => setSetupStep("profile")} className="rounded-full border border-[#E3D4CC] px-4 py-2 text-sm font-semibold text-[#6B554A]">Back</button>
                )}
                <button type="submit" disabled={setupSubmitting} className="rounded-full bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:opacity-60">
                  {setupSubmitting ? "Verifying..." : setupStep === "profile" ? "Continue" : "Finish setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}"use client"
import React, { useState } from 'react';
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

export default function PatientLoginPage() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (!apiBaseUrl) {
                throw new Error("API URL is not configured");
            }

            const response = await fetch(`${apiBaseUrl}/auth/login/password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber, password }),
            });

            const data = await response.json();

            if (!response.ok || data?.status !== 'OK' || !data?.accessToken) {
                throw new Error(data?.error || data?.message || 'Login failed');
            }

            const isPatient = data?.roles?.includes('PATIENT');

            if (!isPatient) {
                throw new Error('This account does not have patient access');
            }

            localStorage.setItem('patientToken', data.accessToken);
            localStorage.setItem('patientRoles', JSON.stringify(data.roles));
            localStorage.setItem('patientUser', JSON.stringify(data.user));
            document.cookie = `patient_token=${encodeURIComponent(data.accessToken)}; path=/; max-age=28800; samesite=lax`;

            router.push('/patient/dashboard');
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
                <h1 className="text-[20px] sm:text-[22px] font-bold text-[#3D2010] mb-1.5">Patient Login</h1>
                <p className="text-[#6B7280] text-[13px] sm:text-[14px] mb-3">Sign in to access your personal health record</p>

                {error && (
                    <div className="w-full mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] sm:text-[13px] text-red-700">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form className="w-full" onSubmit={handleSubmit}>
                    <div className="mb-3.5">
                        <label className="block text-[#374151] text-[12px] sm:text-[13px] font-medium mb-1.5">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="Enter phone number, e.g. +919900001001"
                            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border border-[rgba(255,204,172,0.4)] focus:outline-none focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] text-[13px] sm:text-[14px] text-[#3D2010]"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />
                    </div>

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
                        <a href="#" className="text-[#D97757] text-[12px] sm:text-[13px] hover:underline hover:text-[#9B6B5A]">
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="hover-lift w-full bg-[#3D2010] hover:bg-[#D97757] disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors text-[13px] sm:text-[14px] mb-4 shadow-sm"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center mb-4">
                        <div className="absolute w-full border-t border-[#E5E7EB]"></div>
                        <span className="relative bg-white px-3 text-[#9CA3AF] text-[11px] sm:text-[12px]">Or continue with</span>
                    </div>

                    {/* Google Button */}
                    <button
                        type="button"
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
        </div>
    );
}
