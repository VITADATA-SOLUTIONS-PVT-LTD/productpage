"use client"
import React, { useState } from "react";

const LogoutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const UserIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const HelpCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

export default function AdminDashboard({ onLogout, adminName = "John Doe", role = "Admin" }) {
    const [activeNav, setActiveNav] = useState("Dashboard");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { label: "Dashboard", id: "Dashboard" },
        { label: "Doctors", id: "Doctors" },
        { label: "Receptionists", id: "Receptionists" },
        { label: "Lab Staff", id: "Lab Staff" },
        { label: "Appointments", id: "Appointments" },
        { label: "Patients", id: "Patients" },
        { label: "Lab Reports", id: "Lab Reports" },
        { label: "Financial Reports", id: "Financial Reports" },
        { label: "Analytics", id: "Analytics" },
        { label: "Hospital Settings", id: "Hospital Settings" },
    ];

    return (
        <div className="flex min-h-screen bg-[#F9F9F9] font-sans text-[#3D2010] relative overflow-hidden">

            {/* ── MOBILE SIDEBAR OVERLAY ────────────────────────────────────── */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
            <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-[240px] flex flex-col bg-white border-r border-[rgba(255,204,172,0.3)] shrink-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>

                {/* Logo Area */}
                <div className="h-[80px] flex items-center px-6 border-b border-[rgba(255,204,172,0.3)]">
                    <button onClick={onLogout} className="border-none bg-transparent cursor-pointer p-0" title="Back to Home">
                        <img
                            src="/logo.png"
                            alt="VitaData Solutions"
                            className="w-[100px] md:w-[115px] object-contain object-left"
                        />
                    </button>
                </div>

                {/* Navigation Area */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <ul className="flex flex-col gap-1">
                        {navItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => {
                                        setActiveNav(item.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full text-left px-6 py-[8px] text-[14px] font-medium transition-colors ${activeNav === item.id
                                        ? "text-[#D97757] bg-[rgba(255,204,172,0.15)]"
                                        : "text-[#9C8276] hover:text-[#3D2010] hover:bg-[rgba(255,204,172,0.08)]"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout Area */}
                <div className="p-4 border-t border-[rgba(255,204,172,0.3)]">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-3 w-full px-2 py-2 text-[#9C8276] hover:text-[#D97757] text-[14px] font-medium transition-colors"
                    >
                        <LogoutIcon />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 w-full">

                {/* Top Header */}
                <header className="h-[70px] md:h-[80px] bg-white border-b border-[rgba(255,204,172,0.3)] flex items-center justify-between lg:justify-end px-4 md:px-8 shrink-0">

                    <button
                        className="lg:hidden p-2 text-[#6B7280] hover:text-[#1F2937]"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <MenuIcon />
                    </button>

                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-[13px] md:text-[14px] text-[#6B7280] font-medium">{adminName}</div>
                            <div className="text-[14px] md:text-[15px] text-[#1F2937] font-semibold">{role}</div>
                        </div>

                        <div className="w-10 h-10 rounded-full border border-[#FFCCAC] bg-[rgba(255,204,172,0.15)] text-[#9C8276] flex items-center justify-center overflow-hidden ml-1">
                            <UserIcon />
                        </div>
                    </div>
                </header>

                {/* Workspace Area */}
                <main className="flex-1 p-4 md:p-8 bg-[#F9F9F9] relative overflow-y-auto">

                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F2937] mb-6 md:mb-8 text-left">
                        Dashboard
                    </h1>

                    {/* Blank White Canvas */}
                    <div className="animate-fade-up w-full bg-white rounded-xl shadow-sm border border-[rgba(255,204,172,0.3)] p-4 md:p-8 min-h-[400px] md:min-h-[500px] flex items-center justify-center">
                        <p className="text-[#9CA3AF] text-[14px] md:text-[15px] text-center">
                            Dashboard content goes here
                        </p>
                    </div>

                    {/* Floating Help Button */}
                    <button className="hover-lift animate-fade-up delay-200 fixed bottom-4 right-4 md:bottom-8 md:right-8 w-12 h-12 bg-[#3D2010] hover:bg-[#D97757] text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-50">
                        <HelpCircleIcon />
                    </button>

                </main>
            </div>

        </div>
    );
}
