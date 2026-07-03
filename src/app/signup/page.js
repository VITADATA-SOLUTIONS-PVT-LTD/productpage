"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
const roles = [
  ["PATIENT", "Patient"], ["DOCTOR", "Doctor"], ["RECEPTIONIST", "Receptionist"],
  ["LAB_MANAGER", "Lab Staff"], ["HOSPITAL_ADMIN", "Hospital Admin"],
];
const specializations = ["CARDIOLOGY", "NEUROLOGY", "ORTHOPEDICS", "GENERAL_SURGERY", "DERMATOLOGY", "PSYCHIATRY", "PEDIATRICS", "GYNECOLOGY", "ENT", "OPHTHALMOLOGY", "GENERAL_PRACTICE"];
const departments = ["PATHOLOGY", "RADIOLOGY", "GENERAL", "ICU", "ER", "CARDIOLOGY", "NEUROLOGY", "PEDIATRICS"];
const countryCodes = ["+91", "+1", "+44", "+61", "+971"];
const inputClass = "w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-3 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/10";

export default function SignupPage() {
  const [form, setForm] = useState({ role: "PATIENT", countryCode: "+91", firstName: "", lastName: "", phone: "", email: "", password: "", hospitalId: "", licenseNo: "", specialization: "", shift: "", department: "", gender: "", dob: "", bloodGroup: "" });
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const isStaff = form.role !== "PATIENT";

  useEffect(() => {
    if (!apiBaseUrl) return;
    fetch(`${apiBaseUrl}/users/signup-hospitals`)
      .then((response) => response.json())
      .then((payload) => setHospitals(payload.hospitals || []))
      .catch(() => setError("Unable to load hospitals. Please try again."));
  }, []);

  const phoneNumber = useMemo(() => `${form.countryCode}${form.phone.replace(/\D/g, "")}`, [form.countryCode, form.phone]);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/users/signup-request`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, phoneNumber }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to submit signup request");
      setResult(payload);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  if (result) return (
    <main className="flex min-h-screen items-center justify-center bg-[#F9F9F9] px-4">
      <section className="w-full max-w-lg rounded-3xl border border-[#EEDFD7] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">✓</div>
        <h1 className="mt-5 text-2xl font-bold text-[#3D2010]">{result.pendingApproval ? "Request submitted" : "Account created"}</h1>
        <p className="mt-3 text-sm leading-6 text-[#806B61]">{result.message}</p>
        {result.pendingApproval && <p className="mt-2 text-sm text-[#806B61]">Your professional and hospital details will be reviewed before your account is activated.</p>}
        <Link href={form.role === "PATIENT" ? "/patient-login" : form.role === "DOCTOR" ? "/doctor-login" : form.role === "HOSPITAL_ADMIN" ? "/admin" : "/login"} className="mt-7 inline-flex rounded-xl bg-[#3D2010] px-6 py-3 text-sm font-semibold text-white hover:bg-[#D97757]">Go to login</Link>
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#F9F9F9] px-4 py-10 text-[#3D2010]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium hover:text-[#D97757]">← Back to Home</Link>
        <section className="mt-5 rounded-3xl border border-[#EEDFD7] bg-white p-6 shadow-[0_10px_40px_rgba(61,32,16,0.08)] sm:p-9">
          <div className="text-center"><img src="/logo.png" alt="VitaData Solutions" className="mx-auto w-24" /><h1 className="mt-2 text-2xl font-bold">Create your VitaData account</h1><p className="mt-2 text-sm text-[#806B61]">Staff applications are verified by an administrator before access is enabled.</p></div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div><label className="mb-2 block text-sm font-semibold">I am signing up as</label><div className="grid gap-2 sm:grid-cols-3">{roles.map(([value, label]) => <button key={value} type="button" onClick={() => setForm((current) => ({ ...current, role: value }))} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${form.role === value ? "border-[#3D2010] bg-[#3D2010] text-white" : "border-[#E3D4CC] hover:border-[#D97757]"}`}>{label}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="First name"><input name="firstName" value={form.firstName} onChange={update} required className={inputClass} /></Field><Field label="Last name"><input name="lastName" value={form.lastName} onChange={update} required className={inputClass} /></Field></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Email address"><input name="email" type="email" value={form.email} onChange={update} required className={inputClass} /></Field><Field label="Phone number"><div className="flex gap-2"><select name="countryCode" value={form.countryCode} onChange={update} className={`${inputClass} w-28`}>{countryCodes.map((code) => <option key={code}>{code}</option>)}</select><input name="phone" type="tel" value={form.phone} onChange={update} required className={inputClass} placeholder="10-digit number" /></div></Field></div>
            <Field label="Password"><input name="password" type="password" minLength={8} value={form.password} onChange={update} required className={inputClass} /><p className="mt-1 text-xs text-[#9C8276]">Use at least 8 characters.</p></Field>
            {isStaff && <Field label="Hospital"><select name="hospitalId" value={form.hospitalId} onChange={update} required className={inputClass}><option value="">Select a hospital</option>{hospitals.map((hospital) => <option key={hospital.hospitalId} value={hospital.hospitalId}>{hospital.name} — {hospital.city}</option>)}</select></Field>}
            {form.role === "DOCTOR" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Medical license number"><input name="licenseNo" value={form.licenseNo} onChange={update} required className={inputClass} /></Field><Field label="Specialization"><select name="specialization" value={form.specialization} onChange={update} required className={inputClass}><option value="">Select specialization</option>{specializations.map((item) => <option key={item}>{item}</option>)}</select></Field></div>}
            {form.role === "RECEPTIONIST" && <Field label="Preferred shift"><select name="shift" value={form.shift} onChange={update} required className={inputClass}><option value="">Select shift</option><option>MORNING</option><option>AFTERNOON</option><option>NIGHT</option></select></Field>}
            {form.role === "LAB_MANAGER" && <Field label="Department"><select name="department" value={form.department} onChange={update} required className={inputClass}><option value="">Select department</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></Field>}
            {form.role === "PATIENT" && <div className="grid gap-4 sm:grid-cols-3"><Field label="Date of birth"><input name="dob" type="date" value={form.dob} onChange={update} className={inputClass} /></Field><Field label="Gender"><select name="gender" value={form.gender} onChange={update} className={inputClass}><option value="">Select</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></Field><Field label="Blood group"><select name="bloodGroup" value={form.bloodGroup} onChange={update} className={inputClass}><option value="">Select</option>{["A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE","AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE"].map((item) => <option key={item}>{item.replace("_", " ")}</option>)}</select></Field></div>}
            <button disabled={loading} className="w-full rounded-xl bg-[#3D2010] py-3 text-sm font-semibold text-white hover:bg-[#D97757] disabled:opacity-60">{loading ? "Submitting..." : isStaff ? "Send signup request" : "Create patient account"}</button>
          </form>
          <p className="mt-5 text-center text-sm text-[#806B61]">Already registered? <Link href="/" className="font-semibold text-[#D97757] hover:underline">Choose your login</Link></p>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }) { return <div><label className="mb-2 block text-sm font-semibold text-[#554238]">{label}</label>{children}</div>; }
