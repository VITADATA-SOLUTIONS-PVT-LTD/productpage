"use client"
import React from 'react';
import { useRouter } from 'next/navigation';

/* ────────────────────────────────────────────────────────────────────────
   Role Icons – warm brown (#D97757) line icons
   ──────────────────────────────────────────────────────────────────────── */

const AdminIcon = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M20 8v6" /><path d="M23 11h-6" />
  </svg>
);

const DoctorIcon = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

const ReceptionistIcon = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LabStaffIcon = () => (
  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v7.31" />
    <path d="M14 9.3V1.99" />
    <path d="M8.5 2h7" />
    <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
  </svg>
);

/* ──────────────────────────────────────────────────────────────────────── */

const roles = [
  { id: 'admin', label: 'admin', icon: AdminIcon, page: 'admin' },
  { id: 'doctor', label: 'Doctor', icon: DoctorIcon, page: 'doctor-login' },
  { id: 'receptionist', label: 'Receptionist', icon: ReceptionistIcon, page: 'login' },
  { id: 'lab-staff', label: 'Lab Staff', icon: LabStaffIcon, page: 'login' },
];

export default function LoginTypesPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F9F9F9',
    }}>

      {/* ── Symmetrical circle shaped gradients filled evenly (#FFCCAC + #D97757) ───────────── */}
      {[
        { t: '-10%', l: '-5%', c: 'rgba(255,204,172,0.5)', size: 450, blur: 70 },
        { t: '5%', l: '40%', c: 'rgba(217,119,87,0.25)', size: 350, blur: 60 },
        { t: '-10%', l: '80%', c: 'rgba(255,204,172,0.5)', size: 450, blur: 70 },

        { t: '35%', l: '10%', c: 'rgba(217,119,87,0.25)', size: 350, blur: 60 },
        { t: '30%', l: '50%', c: 'rgba(255,204,172,0.3)', size: 500, blur: 80 },
        { t: '35%', l: '75%', c: 'rgba(217,119,87,0.25)', size: 350, blur: 60 },

        { t: '75%', l: '-5%', c: 'rgba(255,204,172,0.5)', size: 450, blur: 70 },
        { t: '80%', l: '40%', c: 'rgba(217,119,87,0.25)', size: 350, blur: 60 },
        { t: '75%', l: '80%', c: 'rgba(255,204,172,0.5)', size: 450, blur: 70 },
      ].map((circle, i) => (
        <div key={i} className="animate-float" style={{
          position: 'absolute',
          top: circle.t,
          left: circle.l,
          width: circle.size,
          height: circle.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${circle.c} 0%, transparent 70%)`,
          filter: `blur(${circle.blur}px)`,
          zIndex: 0,
          animationDelay: `${i * 200}ms`,
        }} />
      ))}

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        width: '100%',
        maxWidth: 900,
        padding: '0 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Logo — 189 × 189 */}
        <div style={{
          marginBottom: 28,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <img
            src="/logo.png"
            alt="VitaData Solutions"
            style={{
              width: 189,
              height: 189,
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#D97757',
          margin: '0 0 56px',
          letterSpacing: '-0.01em',
          fontFamily: '',
        }}>
          Welcome to VITADATA SOLUTIONS
        </h1>

        {/* ── Role cards ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          flexWrap: 'wrap',
        }}>
          {roles.map(({ id, label, icon: Icon, page }, i) => (
            <button
              key={id}
              onClick={() => router.push(`/${page}`)}
              className={`hover:scale-105  hover:animate-fade-up delay-${(i + 1) * 100}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              {/* Circle with gradient border using #FFCCAC */}
              <div className="hover-glow" style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255,204,172,0.20) 0%, rgba(249,249,249,0.60) 100%)',
                border: '1.5px solid rgba(255,204,172,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(217,119,87,0.08)',
                transition: 'box-shadow 0.3s, border-color 0.3s, background 0.3s',
              }}>
                <Icon />
              </div>
              <span style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#6B7280',
                letterSpacing: '0.01em',
                transition: 'color 0.2s',
              }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Contact Us button (bottom-right corner) ──────────────────── */}
      <button
       
        className="hover-lift animate-fade-up delay-400"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          padding: '10px 24px',
          borderRadius: 6,
          border: '1px solid #D1D5DB',
          backgroundColor: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(8px)',
          color: '#D97757',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: 10,
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#D97757'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.90)'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
      >
        Contact Us
      </button>
    </div>
  );
}
