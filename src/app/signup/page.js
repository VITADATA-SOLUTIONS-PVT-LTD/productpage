"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UnifiedSignupPage() {
    const router = useRouter();
    const [hospitals, setHospitals] = useState([]);
    const [isLoadingHospitals, setIsLoadingHospitals] = useState(true);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        contactMethod: 'phone', // 'phone' or 'email'
        phoneNumber: '',
        countryCode: '+91',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'PATIENT', // PATIENT, DOCTOR, RECEPTIONIST, LAB_MANAGER, HOSPITAL_ADMIN
        hospitalId: '',
        specialization: 'GENERAL_PRACTICE',
        licenseNo: '',
        shift: 'MORNING',
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    // OTP Modal states for Patient signup
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [tempSignupToken, setTempSignupToken] = useState('');
    const [otpError, setOtpError] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [devOtp, setDevOtp] = useState('');

    // Profile Details Modal states for Patient
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({
        gender: 'male',
        dob: '',
        bloodGroup: 'O_POSITIVE',
        chronicConditions: '',
    });
    const [profileError, setProfileError] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [newPatientAccessToken, setNewPatientAccessToken] = useState('');

    const apiBaseUrl = process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const response = await fetch(`${apiBaseUrl}/users/public-hospitals`);
                const resData = await response.json();
                if (resData?.status === 'OK') {
                    setHospitals(resData.data);
                    if (resData.data.length > 0) {
                        setForm(prev => ({ ...prev, hospitalId: resData.data[0].hospitalId }));
                    }
                }
            } catch (err) {
                console.error("Failed to load hospitals list:", err);
            } finally {
                setIsLoadingHospitals(false);
            }
        };
        if (apiBaseUrl) fetchHospitals();
    }, [apiBaseUrl]);

    const handleInputChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
        setSubmitError('');
    };

    const validateForm = () => {
        const e = {};
        if (!form.firstName.trim()) e.firstName = "First name is required.";
        if (!form.lastName.trim()) e.lastName = "Last name is required.";

        if (form.role === 'PATIENT') {
            if (form.contactMethod === 'phone') {
                if (!form.phoneNumber.trim()) e.phoneNumber = "Phone number is required.";
                else if (!/^\d{10}$/.test(form.phoneNumber.trim())) e.phoneNumber = "Enter a valid 10-digit phone number.";
            } else {
                if (!form.email.trim()) e.email = "Email is required.";
                else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address.";
            }
        } else {
            if (!form.phoneNumber.trim()) e.phoneNumber = "Phone number is required.";
            else if (!/^\d{10}$/.test(form.phoneNumber.trim())) e.phoneNumber = "Enter a valid 10-digit phone number.";
            
            if (form.email.trim()) {
                if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address.";
            }
        }

        if (!form.password) e.password = "Password is required.";
        else if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
        else {
            const hasUpperCase = /[A-Z]/.test(form.password);
            const hasLowerCase = /[a-z]/.test(form.password);
            const hasDigit = /\d/.test(form.password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);
            if (!hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecialChar) {
                e.password = "Password must contain uppercase, lowercase, number, and special character.";
            }
        }

        if (form.password !== form.confirmPassword) {
            e.confirmPassword = "Passwords do not match.";
        }

        if (form.role === 'DOCTOR') {
            if (!form.licenseNo.trim()) e.licenseNo = "License number is required for clinicians.";
        }

        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsLoading(true);
        setSubmitError('');
        setSubmitSuccess('');

        const formattedPhone = `${form.countryCode}${form.phoneNumber.trim()}`;

        try {
            if (form.role === 'PATIENT') {
                const body = form.contactMethod === 'phone'
                    ? { firstName: form.firstName, lastName: form.lastName, phoneNumber: formattedPhone, password: form.password }
                    : { firstName: form.firstName, lastName: form.lastName, email: form.email.trim().toLowerCase(), password: form.password };

                const endpoint = form.contactMethod === 'phone'
                    ? `${apiBaseUrl}/auth/signup/phone`
                    : `${apiBaseUrl}/auth/signup/email`;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const data = await response.json();

                if (!response.ok || data?.status === 'Failed') {
                    throw new Error(data?.message || 'Patient verification request failed');
                }

                setTempSignupToken(data.token);
                if (data.devOtp) setDevOtp(data.devOtp);
                setShowOtpModal(true);
            } else {
                const body = {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phoneNumber: formattedPhone,
                    email: form.email.trim().toLowerCase() || null,
                    password: form.password,
                    role: form.role,
                    hospitalId: form.hospitalId || null,
                    specialization: form.role === 'DOCTOR' ? form.specialization : undefined,
                    licenseNo: form.role === 'DOCTOR' ? form.licenseNo : undefined,
                    shift: form.role === 'RECEPTIONIST' ? form.shift : undefined,
                };

                const response = await fetch(`${apiBaseUrl}/users/signup-request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const data = await response.json();

                if (!response.ok || data?.status === 'ERROR') {
                    throw new Error(data?.message || 'Signup request failed');
                }

                setSubmitSuccess(data.message || 'Signup request submitted successfully!');
                setForm({
                    firstName: '',
                    lastName: '',
                    contactMethod: 'phone',
                    phoneNumber: '',
                    countryCode: '+91',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'PATIENT',
                    hospitalId: hospitals[0]?.hospitalId || '',
                    specialization: 'GENERAL_PRACTICE',
                    licenseNo: '',
                    shift: 'MORNING',
                });
            }
        } catch (err) {
            setSubmitError(err.message || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        if (!otpCode.trim()) {
            setOtpError('OTP code is required.');
            return;
        }

        setOtpError('');
        setOtpLoading(true);

        try {
            const response = await fetch(`${apiBaseUrl}/auth/verify-otp-temp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempSignupToken}`
                },
                body: JSON.stringify({ otp: otpCode.trim() })
            });

            const data = await response.json();

            if (!response.ok || data?.status === 'ERROR') {
                throw new Error(data?.message || 'OTP verification failed');
            }

            setNewPatientAccessToken(data.accessToken);
            setShowOtpModal(false);
            setShowProfileModal(true);
        } catch (err) {
            setOtpError(err.message || 'Verification failed. Please check the OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileLoading(true);

        try {
            const response = await fetch(`${apiBaseUrl}/users/verify-patient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${newPatientAccessToken}`
                },
                body: JSON.stringify({
                    gender: profileForm.gender,
                    dob: profileForm.dob,
                    bloodGroup: profileForm.bloodGroup,
                    chronicConditions: profileForm.chronicConditions
                })
            });

            const data = await response.json();

            if (!response.ok || data?.status === 'ERROR') {
                throw new Error(data?.message || 'Failed to complete patient profile');
            }

            localStorage.setItem('patientToken', newPatientAccessToken);
            localStorage.setItem('patientRoles', JSON.stringify(['PATIENT']));
            document.cookie = `patient_token=${encodeURIComponent(newPatientAccessToken)}; path=/; max-age=28800; samesite=lax`;

            setShowProfileModal(false);
            router.push('/patient/dashboard');
        } catch (err) {
            setProfileError(err.message || 'Failed to complete patient details');
        } finally {
            setProfileLoading(false);
        }
    };

    const specializations = [
        { value: 'CARDIOLOGY', label: 'Cardiology' },
        { value: 'NEUROLOGY', label: 'Neurology' },
        { value: 'ORTHOPEDICS', label: 'Orthopedics' },
        { value: 'GENERAL_SURGERY', label: 'General Surgery' },
        { value: 'DERMATOLOGY', label: 'Dermatology' },
        { value: 'PSYCHIATRY', label: 'Psychiatry' },
        { value: 'PEDIATRICS', label: 'Pediatrics' },
        { value: 'GYNECOLOGY', label: 'Gynecology' },
        { value: 'ENT', label: 'ENT' },
        { value: 'OPHTHALMOLOGY', label: 'Ophthalmology' },
        { value: 'GENERAL_PRACTICE', label: 'General Practice' },
    ];

    const inputClass = (field) =>
        `w-full px-4 py-2.5 rounded-xl border text-sm text-gray-800 placeholder-gray-400 outline-none transition-all ${
            errors[field]
                ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-[#D97757] focus:ring-2 focus:ring-orange-50"
        }`;

    return (
        <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center font-sans text-[#3D2010] relative overflow-hidden py-12 px-4">
            
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-radial-gradient from-[rgba(255,204,172,0.3)] to-transparent blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-radial-gradient from-[rgba(217,119,87,0.15)] to-transparent blur-[80px]" />

            {/* Back to Home */}
            <div className="w-full max-w-xl mb-4 text-left z-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8B7469] hover:text-[#D97757] transition-colors"
                >
                    &larr; Back to Login Portals
                </Link>
            </div>

            {/* Card wrapper */}
            <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-[0_10px_40px_rgba(217,119,87,0.06)] w-full max-w-xl p-6 sm:p-8 flex flex-col items-center relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-250">
                
                {/* Logo */}
                <div className="flex flex-col items-center mb-4">
                    <img src="/logo.png" alt="VitaData Solutions" className="h-12 w-auto object-contain mb-1" />
                    <h1 className="text-xl font-bold tracking-tight">Create an Account</h1>
                    <p className="text-xs text-gray-500">Sign up as a Patient or apply for a Medical Staff role</p>
                </div>

                {submitError && (
                    <div className="w-full mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                        {submitError}
                    </div>
                )}

                {submitSuccess && (
                    <div className="w-full mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                        {submitSuccess}
                    </div>
                )}

                <form className="w-full space-y-4" onSubmit={handleSubmit}>
                    
                    {/* Role Selection */}
                    <div>
                        <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Sign up as</label>
                        <select
                            value={form.role}
                            onChange={handleInputChange('role')}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#3D2010] focus:border-[#D97757] outline-none"
                        >
                            <option value="PATIENT">Patient (Verified Instantly via OTP)</option>
                            <option value="DOCTOR">Doctor / Clinician (Pending Admin Approval)</option>
                            <option value="RECEPTIONIST">Receptionist (Pending Admin Approval)</option>
                            <option value="LAB_MANAGER">Lab Staff (Pending Admin Approval)</option>
                            <option value="HOSPITAL_ADMIN">Hospital Administrator (Pending Admin Approval)</option>
                        </select>
                    </div>

                    {/* Name grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">First Name</label>
                            <input
                                type="text"
                                value={form.firstName}
                                onChange={handleInputChange('firstName')}
                                placeholder="John"
                                className={inputClass('firstName')}
                            />
                            {errors.firstName && <p className="text-red-500 text-[11px] mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Last Name</label>
                            <input
                                type="text"
                                value={form.lastName}
                                onChange={handleInputChange('lastName')}
                                placeholder="Doe"
                                className={inputClass('lastName')}
                            />
                            {errors.lastName && <p className="text-red-500 text-[11px] mt-1">{errors.lastName}</p>}
                        </div>
                    </div>

                    {/* Contact Method Selection (Only visible for Patient role) */}
                    {form.role === 'PATIENT' && (
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Verification Method</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                                    <input
                                        type="radio"
                                        name="contactMethod"
                                        checked={form.contactMethod === 'phone'}
                                        onChange={() => setForm(p => ({ ...p, contactMethod: 'phone' }))}
                                        className="text-[#D97757] focus:ring-[#D97757]"
                                    />
                                    Phone Number (+91)
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                                    <input
                                        type="radio"
                                        name="contactMethod"
                                        checked={form.contactMethod === 'email'}
                                        onChange={() => setForm(p => ({ ...p, contactMethod: 'email' }))}
                                        className="text-[#D97757] focus:ring-[#D97757]"
                                    />
                                    Email Address
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Dynamic Email / Phone inputs */}
                    {(form.role !== 'PATIENT' || form.contactMethod === 'phone') && (
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Phone Number</label>
                            <div className="flex gap-2">
                                <select
                                    value={form.countryCode}
                                    onChange={handleInputChange('countryCode')}
                                    className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#3D2010] outline-none"
                                >
                                    <option value="+91">+91 (IN)</option>
                                    <option value="+1">+1 (US)</option>
                                    <option value="+44">+44 (UK)</option>
                                    <option value="+971">+971 (UAE)</option>
                                </select>
                                <input
                                    type="text"
                                    value={form.phoneNumber}
                                    onChange={handleInputChange('phoneNumber')}
                                    placeholder="9876543210"
                                    className={inputClass('phoneNumber')}
                                />
                            </div>
                            {errors.phoneNumber && <p className="text-red-500 text-[11px] mt-1">{errors.phoneNumber}</p>}
                        </div>
                    )}

                    {(form.role !== 'PATIENT' || form.contactMethod === 'email') && (
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Email Address</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={handleInputChange('email')}
                                placeholder="john.doe@example.com"
                                className={inputClass('email')}
                            />
                            {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
                        </div>
                    )}

                    {/* Hospital Selection (For Doctor, Receptionist, Lab, and Admin) */}
                    {form.role !== 'PATIENT' && (
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Linked Hospital</label>
                            {isLoadingHospitals ? (
                                <p className="text-xs text-gray-400">Loading hospitals list...</p>
                            ) : (
                                <select
                                    value={form.hospitalId}
                                    onChange={handleInputChange('hospitalId')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#3D2010] focus:border-[#D97757] outline-none"
                                >
                                    {hospitals.map(h => (
                                        <option key={h.hospitalId} value={h.hospitalId}>
                                            {h.name} — {h.city}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Doctor Details */}
                    {form.role === 'DOCTOR' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Specialization</label>
                                <select
                                    value={form.specialization}
                                    onChange={handleInputChange('specialization')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#3D2010] focus:border-[#D97757] outline-none"
                                >
                                    {specializations.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">License Number</label>
                                <input
                                    type="text"
                                    value={form.licenseNo}
                                    onChange={handleInputChange('licenseNo')}
                                    placeholder="MC-123456"
                                    className={inputClass('licenseNo')}
                                />
                                {errors.licenseNo && <p className="text-red-500 text-[11px] mt-1">{errors.licenseNo}</p>}
                            </div>
                        </div>
                    )}

                    {/* Receptionist Details */}
                    {form.role === 'RECEPTIONIST' && (
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Shift Duty</label>
                            <select
                                value={form.shift}
                                onChange={handleInputChange('shift')}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#3D2010] focus:border-[#D97757] outline-none"
                            >
                                <option value="MORNING">Morning Shift</option>
                                <option value="AFTERNOON">Afternoon Shift</option>
                                <option value="NIGHT">Night Shift</option>
                            </select>
                        </div>
                    )}

                    {/* Passwords */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={handleInputChange('password')}
                                placeholder="••••••••"
                                className={inputClass('password')}
                            />
                            {errors.password && <p className="text-red-500 text-[11px] mt-1">{errors.password}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5">Confirm Password</label>
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={handleInputChange('confirmPassword')}
                                placeholder="••••••••"
                                className={inputClass('confirmPassword')}
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-[11px] mt-1">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-2 py-3 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors duration-150 disabled:opacity-50 text-sm shadow-sm"
                    >
                        {isLoading ? 'Submitting Registration...' : form.role === 'PATIENT' ? 'Proceed with Verification' : 'Submit Registration Request'}
                    </button>

                    <div className="text-center mt-4">
                        <span className="text-xs text-gray-500">Already have an account? </span>
                        <Link href="/" className="text-xs font-bold text-[#D97757] hover:underline">
                            Log In here
                        </Link>
                    </div>
                </form>
            </div>

            {/* OTP VERIFICATION MODAL */}
            {showOtpModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-sm w-full relative">
                        <h2 className="text-lg font-bold text-[#3D2010] mb-1 font-sans">Verify Verification Code</h2>
                        <p className="text-xs text-gray-500 mb-4 font-sans">
                            We have sent a verification code to your selected {form.contactMethod === 'phone' ? 'phone number' : 'email address'}.
                        </p>

                        {otpError && (
                            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 px-3 py-2 font-sans">
                                {otpError}
                            </div>
                        )}

                        {devOtp && (
                            <div className="mb-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-[#D97757] px-3 py-2 font-mono">
                                Development OTP: {devOtp}
                            </div>
                        )}

                        <form onSubmit={handleOtpVerify} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Enter Code</label>
                                <input
                                    type="text"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    placeholder="123456"
                                    className="w-full text-center px-4 py-3 rounded-xl border border-gray-200 text-lg font-bold tracking-widest focus:border-[#D97757] outline-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowOtpModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 font-sans"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={otpLoading}
                                    className="flex-1 py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors disabled:opacity-50 text-xs font-sans"
                                >
                                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* COMPLETE PATIENT PROFILE DETAILS MODAL */}
            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-md w-full relative">
                        <h2 className="text-lg font-bold text-[#3D2010] mb-1 font-sans">Complete Patient Profile</h2>
                        <p className="text-xs text-gray-500 mb-4 font-sans">
                            Almost there! Please fill in your primary clinical profile details to finalize registration.
                        </p>

                        {profileError && (
                            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 px-3 py-2 font-sans">
                                {profileError}
                            </div>
                        )}

                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Gender</label>
                                    <select
                                        value={profileForm.gender}
                                        onChange={(e) => setProfileForm(p => ({ ...p, gender: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#3D2010] focus:border-[#D97757] outline-none font-sans"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Date of Birth</label>
                                    <input
                                        type="date"
                                        required
                                        value={profileForm.dob}
                                        onChange={(e) => setProfileForm(p => ({ ...p, dob: e.target.value }))}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:border-[#D97757] outline-none font-sans"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Blood Group</label>
                                    <select
                                        value={profileForm.bloodGroup}
                                        onChange={(e) => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#3D2010] focus:border-[#D97757] outline-none font-sans"
                                    >
                                        <option value="O_POSITIVE">O+ (Positive)</option>
                                        <option value="O_NEGATIVE">O- (Negative)</option>
                                        <option value="A_POSITIVE">A+ (Positive)</option>
                                        <option value="A_NEGATIVE">A- (Negative)</option>
                                        <option value="B_POSITIVE">B+ (Positive)</option>
                                        <option value="B_NEGATIVE">B- (Negative)</option>
                                        <option value="AB_POSITIVE">AB+ (Positive)</option>
                                        <option value="AB_NEGATIVE">AB- (Negative)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Chronic Conditions (Optional)</label>
                                    <input
                                        type="text"
                                        value={profileForm.chronicConditions}
                                        onChange={(e) => setProfileForm(p => ({ ...p, chronicConditions: e.target.value }))}
                                        placeholder="Diabetes, Asthma, Hypertension (comma separated)"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:border-[#D97757] outline-none font-sans"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="w-full py-3 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors disabled:opacity-50 text-sm shadow-sm font-sans"
                            >
                                {profileLoading ? 'Finalizing Profile...' : 'Complete Signup'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
