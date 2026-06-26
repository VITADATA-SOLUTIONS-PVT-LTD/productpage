import React from 'react';

/* ── Shield-exclamation icon (terracotta) ─────────────────────────────── */
const ShieldAlertIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ── Help icon ───────────────────────────────────────────────────────── */
const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ── Gradient circles config ─────────────────────────────────────────── */
const bgCircles = [
  { t: '-10%', l: '-5%', c: 'rgba(255,204,172,0.4)', size: 400, blur: 80 },
  { t: '5%', l: '50%', c: 'rgba(217,119,87,0.15)', size: 300, blur: 60 },
  { t: '-10%', l: '85%', c: 'rgba(255,204,172,0.35)', size: 380, blur: 70 },
  { t: '50%', l: '5%', c: 'rgba(217,119,87,0.12)', size: 320, blur: 65 },
  { t: '45%', l: '60%', c: 'rgba(255,204,172,0.25)', size: 350, blur: 70 },
  { t: '80%', l: '-5%', c: 'rgba(255,204,172,0.35)', size: 400, blur: 75 },
  { t: '75%', l: '50%', c: 'rgba(217,119,87,0.15)', size: 300, blur: 60 },
  { t: '80%', l: '85%', c: 'rgba(255,204,172,0.4)', size: 380, blur: 70 },
];

export default function AccessDeniedPage({ onReturn, onLogin }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F9F9F9',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Playfair Display', serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background gradient circles */}
      {bgCircles.map((circle, i) => (
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
          animationDelay: `${i * 300}ms`,
        }} />
      ))}

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(217,119,87,0.08)',
        width: '100%',
        maxWidth: 420,
        padding: '48px 40px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 16px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Icon circle */}
        <div className="animate-pulse-subtle" style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,204,172,0.30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}>
          <ShieldAlertIcon />
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#3D2010',
          margin: '0 0 12px',
          textAlign: 'center',
        }}>Access Denied</h1>

        {/* Subtitle */}
        <p style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: '#9C8276',
          textAlign: 'center',
          margin: '0 0 32px',
        }}>
          You do not have permission to access this<br />
          dashboard.<br />
          Please contact your administrator for assistance.
        </p>

        {/* Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => { if (onLogin) onLogin(); else if (onReturn) onReturn(); }}
            className="hover-lift"
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#3D2010',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D97757'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#3D2010'; }}
          >
            Return to Login
          </button>

          <button
            className="hover-lift"
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 8,
              border: '1.5px solid rgba(217,119,87,0.3)',
              backgroundColor: '#FFFFFF',
              color: '#3D2010',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,204,172,0.15)'; e.currentTarget.style.borderColor = '#D97757'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(217,119,87,0.3)'; }}
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* ── Floating help button ─────────────────────────────────────── */}
      <button 
        className="hover-lift animate-fade-up delay-200"
        style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#3D2010',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(61,32,16,0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        zIndex: 2,
      }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D97757'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#3D2010'; }}
      >
        <HelpIcon />
      </button>
    </div>
  );
}
