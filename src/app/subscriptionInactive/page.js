"use client";

import { useRouter } from "next/navigation";

/* ── Alert icon ─────────────────────────────────────────── */
const AlertCircleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ── Help icon ───────────────────────────────────────── */
const HelpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ── Background circles ───────────────────────────────── */

const bgCircles = [
  { t: "-10%", l: "-5%", c: "rgba(255,204,172,0.4)", size: 400, blur: 80 },
  { t: "5%", l: "50%", c: "rgba(217,119,87,0.15)", size: 300, blur: 60 },
  { t: "-10%", l: "85%", c: "rgba(255,204,172,0.35)", size: 380, blur: 70 },
  { t: "50%", l: "5%", c: "rgba(217,119,87,0.12)", size: 320, blur: 65 },
  { t: "45%", l: "60%", c: "rgba(255,204,172,0.25)", size: 350, blur: 70 },
  { t: "80%", l: "-5%", c: "rgba(255,204,172,0.35)", size: 400, blur: 75 },
  { t: "75%", l: "50%", c: "rgba(217,119,87,0.15)", size: 300, blur: 60 },
  { t: "80%", l: "85%", c: "rgba(255,204,172,0.4)", size: 380, blur: 70 },
];

export default function SubscriptionInactivePage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F9F9F9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Playfair Display', serif",
      }}
    >
      {bgCircles.map((circle, i) => (
        <div
          key={i}
          className="animate-float"
          style={{
            position: "absolute",
            top: circle.t,
            left: circle.l,
            width: circle.size,
            height: circle.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${circle.c} 0%, transparent 70%)`,
            filter: `blur(${circle.blur}px)`,
            animationDelay: `${i * 300}ms`,
          }}
        />
      ))}

      <div
        className="animate-fade-up"
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(217,119,87,0.08)",
          width: "100%",
          maxWidth: 440,
          padding: "48px 40px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "0 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          className="animate-pulse-subtle"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "rgba(255,204,172,0.30)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <AlertCircleIcon />
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#3D2010",
            marginBottom: 12,
          }}
        >
          Subscription Inactive
        </h1>

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "#9C8276",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          Your hospital subscription is inactive.
          <br />
          Please contact support to activate your account.
        </p>

        <div
          style={{
            width: "100%",
            background: "rgba(255,204,172,0.10)",
            border: "1px solid rgba(255,204,172,0.30)",
            borderRadius: 10,
            padding: "16px 20px",
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "#9C8276",
              marginBottom: 6,
            }}
          >
            Support Email
          </div>

          <a
            href="mailto:vitadatasolutions@gmail.com"
            style={{
              color: "#D97757",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            vitadatasolutions@gmail.com
          </a>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <button
            onClick={() => router.push("/admin")}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: 8,
              background: "#3D2010",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Return to Login
          </button>

          <button
            onClick={() =>
              (window.location.href =
                "mailto:vitadatasolutions@gmail.com")
            }
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 8,
              border: "1px solid rgba(217,119,87,0.3)",
              background: "#fff",
              color: "#3D2010",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Contact Support
          </button>
        </div>
      </div>

      <button
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: "#3D2010",
          color: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <HelpIcon />
      </button>
    </div>
  );
}