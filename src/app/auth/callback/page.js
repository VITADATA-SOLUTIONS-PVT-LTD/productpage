'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const rolesStr = searchParams.get('roles');
      const userStr = searchParams.get('user');

      if (!token || !rolesStr || !userStr) {
        throw new Error('Authentication data is missing');
      }

      const roles = JSON.parse(rolesStr);
      const user = JSON.parse(decodeURIComponent(userStr));

      // Determine where to redirect based on roles
      if (roles.includes('PATIENT')) {
        localStorage.setItem('patientToken', token);
        localStorage.setItem('patientRoles', JSON.stringify(roles));
        localStorage.setItem('patientUser', JSON.stringify(user));
        document.cookie = `patient_token=${encodeURIComponent(token)}; path=/; max-age=28800; samesite=lax`;
        router.replace('/patient/dashboard');
      } else if (roles.includes('RECEPTIONIST')) {
        localStorage.setItem('receptionistToken', token);
        localStorage.setItem('receptionistRoles', JSON.stringify(roles));
        localStorage.setItem('receptionistUser', JSON.stringify(user));
        document.cookie = `receptionist_token=${encodeURIComponent(token)}; path=/; max-age=28800; samesite=lax`;
        router.replace('/receptionist/dashboard');
      } else if (roles.includes('LAB_MANAGER')) {
        localStorage.setItem('labStaffToken', token);
        localStorage.setItem('labStaffRoles', JSON.stringify(roles));
        localStorage.setItem('labStaffUser', JSON.stringify(user));
        document.cookie = `lab_staff_token=${encodeURIComponent(token)}; path=/; max-age=28800; samesite=lax`;
        router.replace('/lab-staff/dashboard');
      } else if (roles.includes('DOCTOR')) {
        localStorage.setItem('doctorToken', token);
        localStorage.setItem('doctorRoles', JSON.stringify(roles));
        localStorage.setItem('doctorUser', JSON.stringify(user));
        document.cookie = `doctor_token=${encodeURIComponent(token)}; path=/; max-age=28800; samesite=lax`;
        router.replace('/doctor/dashboard');
      } else {
        throw new Error('No supported role found for this account');
      }
    } catch (err) {
      console.error('OAuth callback processing error:', err);
      setError(err?.message || 'Failed to process login');
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(217,119,87,0.08)] w-full max-w-[360px] p-8 flex flex-col items-center border border-red-100 animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4 text-xl font-bold">!</div>
        <h1 className="text-xl font-bold text-[#3D2010] mb-2">Login Failed</h1>
        <p className="text-sm text-red-600 text-center mb-4">{error}</p>
        <p className="text-xs text-gray-500 text-center">Redirecting you to the login page...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(217,119,87,0.08)] w-full max-w-[360px] p-8 flex flex-col items-center border border-[rgba(255,204,172,0.3)] animate-fade-in">
      <div className="relative mb-5 flex items-center justify-center">
        {/* Modern double spinner */}
        <div className="w-12 h-12 rounded-full border-4 border-[#FFCCAC]/30 border-t-[#D97757] animate-spin"></div>
        <div className="absolute w-6 h-6 rounded-full border-4 border-transparent border-t-[#3D2010] animate-spin [animation-direction:reverse]"></div>
      </div>
      <h1 className="text-xl font-bold text-[#3D2010] mb-1.5">Authenticating</h1>
      <p className="text-gray-500 text-sm text-center">Please wait while we log you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center font-sans text-[#3D2010] px-4">
      <Suspense fallback={
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(217,119,87,0.08)] w-full max-w-[360px] p-8 flex flex-col items-center border border-[rgba(255,204,172,0.3)]">
          <div className="w-12 h-12 rounded-full border-4 border-[#FFCCAC]/30 border-t-[#D97757] animate-spin mb-5"></div>
          <h1 className="text-xl font-bold text-[#3D2010] mb-1.5">Loading</h1>
          <p className="text-gray-500 text-sm text-center">Preparing environment...</p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}
