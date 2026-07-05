"use client";

import React from "react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardCalendar from "@/components/DashboardCalendar";

const navItems = [
  "Dashboard",
  "Book Appointment",
  "My Appointments",
  "Medical Records",
  "Medications & Refills",
  "Payments",
];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL;

const CACHE_EXPIRY_MS = 15 * 60 * 1000;

function getCachedItem(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedItem(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore quota issues
  }
}

const fullName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Unknown";

const formatDate = (value, includeTime = false) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
};

const isTakenToday = (row) => {
  if (!row.lastTakenAt) return false;
  const takenDate = new Date(row.lastTakenAt);
  const today = new Date();
  return takenDate.getFullYear() === today.getFullYear() &&
         takenDate.getMonth() === today.getMonth() &&
         takenDate.getDate() === today.getDate();
};

const statusStyles = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ value }) {
  const text = String(value || "Unknown").replaceAll("_", " ");
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        statusStyles[value] || "border-gray-200 bg-gray-50 text-gray-600"
      }`}
    >
      {text}
    </span>
  );
}

function MetricCard({ label, value, detail, tone = "peach" }) {
  const tones = {
    peach: "from-[#FFF4EC] to-white border-[#F2D7C8]",
    green: "from-emerald-50 to-white border-emerald-100",
    blue: "from-blue-50 to-white border-blue-100",
    amber: "from-amber-50 to-white border-amber-100",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9C8276]">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[#3D2010]">{value}</p>
      {detail && <p className="mt-2 text-xs text-[#7A655B]">{detail}</p>}
    </div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-[#2F1A10]">{title}</h2>
        <p className="mt-1 text-sm text-[#8B7469]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function DataTable({ columns, rows, keyFor, emptyMessage }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredRows = React.useMemo(() => {
    if (!searchQuery) return rows;
    const query = searchQuery.toLowerCase();
    
    const searchVal = (val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === "object") {
        return Object.values(val).some(sub => searchVal(sub));
      }
      return String(val).toLowerCase().includes(query);
    };

    return rows.filter((row) => {
      return Object.values(row).some((val) => searchVal(val));
    });
  }, [rows, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#EEDFD7] bg-white px-4 py-2 text-sm text-[#3D2010] placeholder-[#9C8276] outline-none transition-all focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-[#9C8276] hover:text-[#3D2010]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#EEDFD7] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-[#FFF9F5]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.label}
                    className="border-b border-[#EEDFD7] px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B7469]"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={keyFor(row, index)} className="transition-colors hover:bg-[#FFFCFA]">
                  {columns.map((column) => (
                    <td key={column.label} className="border-b border-[#F3EAE5] px-5 py-4 text-sm text-[#554238] last:border-b-0">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRows.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-[#9C8276]">{emptyMessage}</div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#EEDFD7] bg-[#FFF9F5] px-6 py-4">
            <span className="text-xs text-[#7A655B]">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRows.length)} of {filteredRows.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-[#F2D7C8] bg-white px-3 py-1.5 text-xs font-semibold text-[#D97757] hover:bg-[#FFF4EC] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-[#F2D7C8] bg-white px-3 py-1.5 text-xs font-semibold text-[#D97757] hover:bg-[#FFF4EC] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AutocompleteSelect({ label, value, onChange, options, placeholder, required }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find((opt) => opt.id === value);
  
  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.name);
    } else {
      setQuery("");
    }
  }, [value, selectedOption]);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      {label && <label className="block text-sm font-semibold text-[#554238] mb-1.5">{label}</label>}
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (!e.target.value) {
            onChange("");
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
        }}
        className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
        required={required}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[#EEDFD7] bg-white py-1 shadow-lg">
          {filteredOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={() => {
                onChange(opt.id);
                setQuery(opt.name);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-[#3D2010] hover:bg-[#FFF1E8] hover:text-[#D97757] transition-colors"
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
      {isOpen && filteredOptions.length === 0 && query && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-[#EEDFD7] bg-white px-4 py-2.5 text-xs text-[#9C8276] shadow-lg">
          No matches found
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#EEDFD7] bg-white">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#F3DED2] border-t-[#D97757]" />
        <p className="mt-4 text-sm font-medium text-[#8B7469]">Loading patient health records…</p>
      </div>
    </div>
  );
}

function StarSelector({ label, value, onChange }) {
  const [hoverValue, setHoverValue] = useState(null);
  const activeVal = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F3EAE5] last:border-b-0">
      <span className="text-sm font-medium text-[#554238]">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starNum) => {
          const isFull = activeVal >= starNum;
          const isHalf = activeVal === starNum - 0.5;

          return (
            <div 
              key={starNum} 
              className="relative w-7 h-7 cursor-pointer"
              onMouseLeave={() => setHoverValue(null)}
            >
              {/* Left half detector */}
              <div 
                className="absolute left-0 top-0 w-3.5 h-7 z-20"
                onClick={() => onChange(starNum - 0.5)}
                onMouseEnter={() => setHoverValue(starNum - 0.5)}
              />
              {/* Right half detector */}
              <div 
                className="absolute right-0 top-0 w-3.5 h-7 z-20"
                onClick={() => onChange(starNum)}
                onMouseEnter={() => setHoverValue(starNum)}
              />

              {/* SVG Star Container */}
              <svg 
                className="absolute inset-0 w-7 h-7" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background Gray Star */}
                <path 
                  d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" 
                  fill="#E5E7EB" 
                />
                {/* Yellow Star Overlay */}
                {(isFull || isHalf) && (
                  <path 
                    d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" 
                    fill="#F59E0B"
                    clipPath={isHalf ? "url(#left-half-clip)" : undefined}
                  />
                )}
              </svg>
            </div>
          );
        })}
        
        {/* Left Half Clip Path Definition */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <clipPath id="left-half-clip">
              <rect x="0" y="0" width="12" height="24" />
            </clipPath>
          </defs>
        </svg>

        <span className="text-xs font-bold text-[#D97757] ml-2 w-8 text-right">
          {activeVal.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PatientDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data States
  const [profile, setProfile] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [records, setRecords] = useState({
    appointments: [],
    prescriptions: [],
    labReports: [],
    medications: [],
  });
  const [medDashboard, setMedDashboard] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    encounterId: "",
    doctorRating: 5,
    hospitalRating: 5,
    receptionistRating: 5,
    comment: ""
  });
  const [isTechFeedbackModalOpen, setIsTechFeedbackModalOpen] = useState(false);
  const [techFeedbackForm, setTechFeedbackForm] = useState({
    encounterId: "",
    websiteRating: 5,
    paymentRating: 5,
    comment: ""
  });  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("patientToken");
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json();
        setNotifications(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    const token = localStorage.getItem("patientToken");
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/notifications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Form States
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState("view"); // "view" or "edit"

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest(".notification-bell-btn") && !e.target.closest(".notification-dropdown-menu")) {
        setIsNotificationOpen(false);
      }
      if (!e.target.closest(".profile-dropdown-btn") && !e.target.closest(".profile-dropdown-menu")) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emergencyContact: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    chronicConditions: "",
  });

  useEffect(() => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phoneNumber: profile.phoneNumber || "",
        emergencyContact: profile.emergencyContact || "",
        gender: profile.patient?.gender || "",
        dob: profile.patient?.dob ? profile.patient.dob.split("T")[0] : "",
        bloodGroup: profile.patient?.bloodGroup || "",
        chronicConditions: profile.patient?.chronicConditions ? profile.patient.chronicConditions.join(", ") : "",
      });
    }
  }, [profile, isProfileModalOpen]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSubmitting(true);
    const token = localStorage.getItem("patientToken");

    try {
      const res = await fetch(`${apiBaseUrl}/users/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      setSuccessMsg("Profile updated successfully!");
      setIsProfileModalOpen(false);
      
      // Force reload data to refresh cached profile and update UI
      localStorage.removeItem("patient_cached_profile");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (invoice) => {
    const resScript = await loadRazorpayScript();
    if (!resScript) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const token = localStorage.getItem("patientToken");
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${apiBaseUrl}/payments/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          invoiceId: invoice.invoiceId,
          amount: Number(invoice.finalAmount),
          currency: "INR"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to initiate payment");
      }

      const { payment, order, keyId } = await res.json();
      const patientName = profile ? `${profile.firstName} ${profile.lastName}` : "Patient";

      const options = {
        key: keyId || "rzp_test_eWy2N5D5vF6W3t",
        amount: order.amount,
        currency: order.currency,
        name: "VitaData Healthcare",
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        order_id: order.id,
        handler: async function (response) {
          setLoading(true);
          try {
            const verifyRes = await fetch(`${apiBaseUrl}/payments/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                paymentId: payment.paymentId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              })
            });

              if (verifyRes.ok) {
              setSuccessMsg("Payment completed successfully!");
              
              // Load the tech & payments feedback form — show only once per encounter
              const encounterItem = invoice.items?.find(item => item.itemType === "ENCOUNTER");
              const techEncId = encounterItem?.itemId || "";
              const techAlreadySeen = techEncId && localStorage.getItem('feedback_tech_seen_' + techEncId);
              if (!techAlreadySeen) {
                setTechFeedbackForm({
                  encounterId: techEncId,
                  websiteRating: 5,
                  paymentRating: 5,
                  comment: ""
                });
                setIsTechFeedbackModalOpen(true);
              }
              
              await loadData();
            } else {
              const errData = await verifyRes.json();
              throw new Error(errData.message || "Payment verification failed.");
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: patientName,
          email: profile?.email || "",
          contact: profile?.phoneNumber || ""
        },
        theme: {
          color: "#D97757"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("patientToken");
    if (!token || !apiBaseUrl) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${apiBaseUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          encounterId: feedbackForm.encounterId,
          doctorRating: feedbackForm.doctorRating,
          hospitalRating: feedbackForm.hospitalRating,
          receptionistRating: feedbackForm.receptionistRating,
          comment: feedbackForm.comment
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to submit feedback");
      }

      setSuccessMsg("Clinical feedback submitted successfully! Thank you.");
      setIsFeedbackModalOpen(false);
      localStorage.setItem('feedback_clinical_seen_' + feedbackForm.encounterId, 'true');
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTechFeedbackSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("patientToken");
    if (!token || !apiBaseUrl) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`${apiBaseUrl}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          encounterId: techFeedbackForm.encounterId,
          websiteRating: techFeedbackForm.websiteRating,
          paymentRating: techFeedbackForm.paymentRating,
          comment: techFeedbackForm.comment
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to submit feedback");
      }

      setSuccessMsg("Technical feedback submitted successfully! Thank you.");
      setIsTechFeedbackModalOpen(false);
      if (techFeedbackForm.encounterId) {
        localStorage.setItem('feedback_tech_seen_' + techFeedbackForm.encounterId, 'true');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPayments = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="My Invoices & Payments" description="Pay consultation fees online via Razorpay and download printable receipts." />
        <DataTable
          rows={invoices}
          keyFor={(row) => row.invoiceId}
          emptyMessage="No billing or invoice details found."
          columns={[
            {
              label: "Invoice No.",
              render: (row) => (
                <span className="font-bold text-[#3D2010]">{row.invoiceNumber}</span>
              ),
            },
            {
              label: "Doctor / Service",
              render: (row) => {
                const encounterItem = row.items?.find(item => item.itemType === "ENCOUNTER");
                const doctorName = encounterItem?.encounter?.doctor?.user
                  ? `Dr. ${encounterItem.encounter.doctor.user.firstName} ${encounterItem.encounter.doctor.user.lastName}`
                  : "Healthcare Specialist";
                return <span className="text-[#554238]">{doctorName}</span>;
              },
            },
            {
              label: "Date",
              render: (row) => {
                const encounterItem = row.items?.find(item => item.itemType === "ENCOUNTER");
                const scheduledTime = encounterItem?.encounter?.scheduledTime;
                return scheduledTime
                  ? <span className="text-[#7A655B]">{formatDate(scheduledTime, true)}</span>
                  : <span className="text-[#9C8276] italic text-xs">—</span>;
              },
            },
            {
              label: "Consult Fee",
              render: (row) => <span className="text-[#554238]">₹{Number(row.totalAmount).toFixed(2)}</span>,
            },
            {
              label: "GST",
              render: (row) => <span className="text-[#9C8276]">₹{Number(row.taxAmount).toFixed(2)}</span>,
            },
            {
              label: "Discount",
              render: (row) => Number(row.discountAmount) > 0
                ? <span className="text-emerald-600 font-semibold">−₹{Number(row.discountAmount).toFixed(2)}</span>
                : <span className="text-[#9C8276]">—</span>,
            },
            {
              label: "Total",
              render: (row) => {
                const isPaid = row.status === "PAID";
                return (
                  <span className={`font-black text-sm ${isPaid ? "text-emerald-600" : "text-[#D97757]"}`}>
                    ₹{Number(row.finalAmount).toFixed(2)}
                  </span>
                );
              },
            },
            {
              label: "Status",
              render: (row) => {
                const isPaid = row.status === "PAID";
                return (
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    isPaid
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}>
                    {isPaid ? "Paid" : "Pending"}
                  </span>
                );
              },
            },
            {
              label: "Action",
              render: (row) => {
                const isPaid = row.status === "PAID";
                return isPaid ? (
                  <button
                    onClick={() => handleDownloadPDF("invoice", row)}
                    className="rounded-lg bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Invoice
                  </button>
                ) : (
                  <button
                    onClick={() => handlePayment(row)}
                    className="rounded-lg bg-[#3D2010] hover:bg-[#D97757] text-white px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay Now
                  </button>
                );
              },
            },
          ]}
        />
      </div>
    );
  };


  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [bookingForm, setBookingForm] = useState({
    doctorId: "",
    reason: "",
  });
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const patientEvents = useMemo(() => {
    return appointments.map(a => ({
      date: a.scheduledTime ? a.scheduledTime.split("T")[0] : "",
      type: a.visitType || "Appointment",
      title: `Appointment: Dr. ${a.doctor?.name || "Clinician"}`,
      time: formatDate(a.scheduledTime, true).split(" - ")[1] || formatDate(a.scheduledTime, true),
      details: `Location: ${a.hospital?.name || "Clinic"} | Reason: ${a.reason || "General checkup"} (${a.status})`
    })).filter(e => e.date);
  }, [appointments]);

  const logout = useCallback(() => {
    localStorage.removeItem("patientToken");
    localStorage.removeItem("patientRoles");
    localStorage.removeItem("patientUser");
    localStorage.removeItem("patient_cached_profile");
    localStorage.removeItem("patient_cached_hospitals");
    localStorage.removeItem("patient_cached_doctors");
    document.cookie = "patient_token=; path=/; max-age=0; samesite=lax";
    router.replace("/patient-login");
  }, [router]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("patientToken");
    if (!token || !apiBaseUrl) {
      logout();
      return;
    }
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        (async () => {
          // 1. Profile Info (cached)
          const cachedProfile = getCachedItem("patient_cached_profile");
          let currentProfile = cachedProfile;
          if (!currentProfile) {
            const profileRes = await fetch(`${apiBaseUrl}/users/myinfo`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (profileRes.status === 401) { logout(); return; }
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              currentProfile = profileData.data;
              setCachedItem("patient_cached_profile", currentProfile);
            }
          }
          setProfile(currentProfile);
        })(),

        (async () => {
          // 2. Mobile Patient Hospitals (cached)
          const cachedHospitals = getCachedItem("patient_cached_hospitals");
          let currentHospitals = cachedHospitals || [];
          if (!cachedHospitals) {
            const hospitalsRes = await fetch(`${apiBaseUrl}/mobile/patient/hospitals`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (hospitalsRes.ok) {
              const hospData = await hospitalsRes.json();
              currentHospitals = hospData.data || [];
              setCachedItem("patient_cached_hospitals", currentHospitals);
            }
          }
          setHospitals(currentHospitals);
        })(),

        (async () => {
          // 3. Mobile Patient Doctors (cached)
          const cachedDoctors = getCachedItem("patient_cached_doctors");
          let currentDoctors = cachedDoctors || [];
          if (!cachedDoctors) {
            const doctorsRes = await fetch(`${apiBaseUrl}/mobile/patient/doctors`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (doctorsRes.ok) {
              const docData = await doctorsRes.json();
              currentDoctors = docData.data || [];
              setCachedItem("patient_cached_doctors", currentDoctors);
            }
          }
          setDoctors(currentDoctors);
        })(),

        (async () => {
          // 4. Mobile Patient Records (dynamic)
          const recordsRes = await fetch(`${apiBaseUrl}/mobile/patient/records`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (recordsRes.ok) {
            const recData = await recordsRes.json();
            const activeRecs = recData.data || { appointments: [], prescriptions: [], labReports: [], medications: [] };
            setRecords(activeRecs);
            setAppointments(activeRecs.appointments || []);
          }
        })(),

        (async () => {
          // 5. Medications Dashboard (dynamic)
          const medRes = await fetch(`${apiBaseUrl}/mobile/patient/medications/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (medRes.ok) {
            const medData = await medRes.json();
            setMedDashboard(medData.data || null);
          }
        })(),

        (async () => {
          // 6. Invoices (dynamic)
          const invoicesRes = await fetch(`${apiBaseUrl}/mobile/patient/invoices`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (invoicesRes.ok) {
            const invData = await invoicesRes.json();
            setInvoices(invData.data || []);
          }
        })(),

        fetchNotifications()
      ]);
    } catch (requestError) {
      setError(requestError.message || "Failed to load patient records");
    } finally {
      setLoading(false);
    }
  }, [logout, fetchNotifications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger Clinical Feedback Modal once per completed encounter (most recent)
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      // Pick the most recently completed encounter
      const completed = appointments
        .filter(a => a.status === 'COMPLETED')
        .sort((a, b) => new Date(b.scheduledTime || 0) - new Date(a.scheduledTime || 0));
      if (completed.length > 0) {
        const latestEncounter = completed[0];
        const encId = latestEncounter.id || latestEncounter.encounterId;
        if (!encId) return;
        const alreadySeen = localStorage.getItem('feedback_clinical_seen_' + encId);
        if (!alreadySeen) {
          setFeedbackForm({
            encounterId: encId,
            doctorRating: 5,
            hospitalRating: 5,
            receptionistRating: 5,
            comment: ""
          });
          setIsFeedbackModalOpen(true);
        }
      }
    }
  }, [appointments]);

  useEffect(() => {
    const token = localStorage.getItem("patientToken");
    let expiryTimer;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const remaining = (payload.exp * 1000) - Date.now();
        if (remaining <= 0) {
          logout();
        } else {
        expiryTimer = setTimeout(() => {
            logout();
          }, remaining);
        }
      } catch (e) {}
    }

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      const confirmLogout = window.confirm("Do you want to log out of your session?");
      if (confirmLogout) {
        logout();
      }
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      if (expiryTimer) clearTimeout(expiryTimer);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [logout]);

  // Fetch Available Slots dynamically when date, doc, hospital are selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedHospitalId || !bookingForm.doctorId || !bookingDate) {
        setSlots([]);
        return;
      }
      setLoadingSlots(true);
      setBookingSlot("");
      try {
        const token = localStorage.getItem("patientToken");
        const res = await fetch(
          `${apiBaseUrl}/mobile/patient/doctors/${bookingForm.doctorId}/slots?date=${bookingDate}&hospitalId=${selectedHospitalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSlots(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedHospitalId, bookingForm.doctorId, bookingDate]);

  const patientName = profile ? fullName(profile) : "Patient";
  const patientBloodGroup = profile?.patient?.bloodGroup || "Not Recorded";

  // Build deduplicated active medication list across all prescriptions.
  // For each medicine name, pick the prescription that still has remaining days.
  // "remaining days" = durationDays − days elapsed since the prescription's encounter date.
  const activeMedications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Flatten all medicines with their prescription context
    const allMeds = (records.prescriptions || []).flatMap((presc) => {
      const startDate = presc.generatedAt
        ? new Date(presc.generatedAt)
        : presc.encounter?.scheduledTime
        ? new Date(presc.encounter.scheduledTime)
        : null;
      return (presc.medicines || []).map((med) => {
        const durationDays = Number(med.durationDays) || 0;
        let daysElapsed = 0;
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          daysElapsed = Math.max(0, Math.floor((today - start) / 86400000));
        }
        const daysRemaining = Math.max(0, durationDays - daysElapsed);
        return { ...med, daysRemaining, daysElapsed, startDate };
      });
    });
    // Deduplicate: for each medicine name keep the one with most remaining days
    const byName = {};
    allMeds.forEach((med) => {
      const key = (med.name || med.medicineName || "").toLowerCase().trim();
      if (!key) return;
      if (!byName[key] || med.daysRemaining > byName[key].daysRemaining) {
        byName[key] = med;
      }
    });
    // Only show medicines that still have days remaining (active)
    return Object.values(byName).filter((m) => m.daysRemaining > 0);
  }, [records.prescriptions]);

  // Extract unique doctor specialties
  const specialties = useMemo(() => {
    const set = new Set();
    doctors.forEach(d => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [doctors]);

  // Filter hospitals that have doctors of selectedSpecialty
  const filteredHospitals = useMemo(() => {
    if (!selectedSpecialty) return [];
    const matchingHospitalIds = new Set();
    doctors.forEach(doc => {
      if (doc.specialty === selectedSpecialty && doc.hospitalId) {
        matchingHospitalIds.add(doc.hospitalId);
      }
    });
    return hospitals.filter(h => matchingHospitalIds.has(h.id));
  }, [selectedSpecialty, doctors, hospitals]);

  // Filter doctors based on selected specialty and selected hospital
  const filteredDoctors = useMemo(() => {
    if (!selectedSpecialty || !selectedHospitalId) return [];
    return doctors.filter(doc => doc.specialty === selectedSpecialty && doc.hospitalId === selectedHospitalId);
  }, [selectedSpecialty, selectedHospitalId, doctors]);

  const handleCancelAppointment = async (encounterId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this appointment?");
    if (!confirmCancel) return;

    const token = localStorage.getItem("patientToken");
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${apiBaseUrl}/encounters/${encounterId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to cancel appointment");
      }
      setSuccessMsg("Appointment cancelled successfully!");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("patientToken");
    setSubmitting(true);

    try {
      if (!selectedHospitalId) throw new Error("Please select a hospital location");
      if (!bookingForm.doctorId) throw new Error("Please select a clinician");
      if (!bookingDate) throw new Error("Please select a date");
      if (!bookingSlot) throw new Error("Please select an available slot");

      const payload = {
        ...bookingForm,
        hospitalId: selectedHospitalId,
        scheduledTime: `${bookingDate}T${bookingSlot}:00.000Z`,
        duration: 30,
      };

      const res = await fetch(`${apiBaseUrl}/mobile/patient/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to book appointment");

      // OPTIMISTIC LOCAL STATE UPDATE
      const newAppt = data.data;
      if (newAppt) {
        setAppointments(prev => [newAppt, ...prev]);
        setRecords(prev => ({
          ...prev,
          appointments: [newAppt, ...prev.appointments],
        }));
      }

      setSuccessMsg("Appointment booked successfully!");
      setBookingForm({
        doctorId: "",
        reason: "",
      });
      setBookingDate("");
      setBookingSlot("");
      setSelectedSpecialty("");
      setSelectedHospitalId("");
      setActiveNav("My Appointments");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkMedTaken = async (scheduleId) => {
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("patientToken");
    setSubmitting(true);

    // OPTIMISTIC UPDATE
    let previousDashboardState = null;
    if (medDashboard) {
      previousDashboardState = JSON.parse(JSON.stringify(medDashboard));
      
      const updatedSchedule = medDashboard.todaySchedule.map(s => 
        s.id === scheduleId ? { ...s, lastTakenAt: new Date().toISOString() } : s
      );
      const totalDoses = updatedSchedule.length;
      const takenDoses = updatedSchedule.filter(s => isTakenToday(s)).length;
      const adherencePercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

      setMedDashboard({
        ...medDashboard,
        summary: {
          totalDosesToday: totalDoses,
          takenDosesToday: takenDoses,
          adherencePercent
        },
        todaySchedule: updatedSchedule
      });
    }

    try {
      const res = await fetch(`${apiBaseUrl}/mobile/patient/medications/schedules/${scheduleId}/taken`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to log medication intake");
      }

      setSuccessMsg("Dose intake logged successfully!");
    } catch (err) {
      if (previousDashboardState) {
        setMedDashboard(previousDashboardState);
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnmarkMedTaken = async (scheduleId) => {
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("patientToken");
    setSubmitting(true);

    // OPTIMISTIC UPDATE
    let previousDashboardState = null;
    if (medDashboard) {
      previousDashboardState = JSON.parse(JSON.stringify(medDashboard));
      
      const updatedSchedule = medDashboard.todaySchedule.map(s => 
        s.id === scheduleId ? { ...s, lastTakenAt: null } : s
      );
      const totalDoses = updatedSchedule.length;
      const takenDoses = updatedSchedule.filter(s => isTakenToday(s)).length;
      const adherencePercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

      setMedDashboard({
        ...medDashboard,
        summary: {
          totalDosesToday: totalDoses,
          takenDosesToday: takenDoses,
          adherencePercent
        },
        todaySchedule: updatedSchedule
      });
    }

    try {
      const res = await fetch(`${apiBaseUrl}/mobile/patient/medications/schedules/${scheduleId}/unmark`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to unmark medication intake");
      }

      setSuccessMsg("Dose intake unmarked successfully!");
    } catch (err) {
      if (previousDashboardState) {
        setMedDashboard(previousDashboardState);
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = (type, data) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download report PDFs.");
      return;
    }
    
    const patientName = profile ? fullName(profile) : "Patient";
    const dob = profile?.patient?.dob ? formatDate(profile.patient.dob) : "—";
    const gender = profile?.patient?.gender || "—";
    
    let html = "";
    if (type === "prescription") {
      const diagnosesList = data.encounter?.diagnoses || [];
      const diagnosisSummaryText = diagnosesList.length > 0
        ? diagnosesList.map(d => d.diagnosisText).filter(Boolean).join(", ")
        : (data.encounter?.diagnosis || data.encounter?.reason || "—");

      const symptomsText = diagnosesList.length > 0
        ? diagnosesList.map(d => d.symptoms).filter(Boolean).join("; ")
        : (data.encounter?.chiefComplaint || data.encounter?.reason || "—");

      html = `
        <html>
        <head>
          <title>Prescription - ${patientName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
            
            body { 
              font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif; 
              padding: 28px 36px; 
              color: #3D2010; 
              background-color: #ffffff;
              line-height: 1.45;
            }
            
            .header-container { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              border-bottom: 2px solid #EEDFD7; 
              padding-bottom: 14px; 
              margin-bottom: 16px; 
            }
            
            .brand-section {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .logo-img {
              height: 42px;
              width: auto;
              object-fit: contain;
            }
            
            .brand-details h1 {
              font-size: 20px;
              font-weight: 800;
              color: #D97757;
              margin: 0;
              letter-spacing: -0.02em;
            }
            
            .brand-details p {
              margin: 2px 0 0 0;
              font-size: 11px;
              color: #8B7469;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .clinic-info { 
              text-align: right; 
            }
            
            .clinic-info h3 { 
              margin: 0; 
              font-size: 15px; 
              font-weight: 700;
              color: #3D2010;
            }
            
            .clinic-info .specialty { 
              margin: 2px 0 0 0; 
              font-size: 11px; 
              color: #D97757; 
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .clinic-info .hospital {
              margin: 2px 0 0 0;
              font-size: 11px;
              color: #8B7469;
              font-weight: 400;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1.2fr 1fr;
              gap: 24px;
              margin-bottom: 16px;
              background-color: #FFFDFB;
              border: 1px solid #F2D7C8;
              border-radius: 10px;
              padding: 12px 16px;
            }
            
            .info-block p {
              margin: 4px 0;
              font-size: 12.5px;
              color: #554238;
            }
            
            .info-block strong {
              color: #3D2010;
              font-weight: 600;
            }
            
            .section { 
              margin-bottom: 14px; 
            }
            
            .section-title { 
              font-size: 11px; 
              font-weight: 700; 
              color: #D97757; 
              text-transform: uppercase;
              letter-spacing: 0.08em;
              border-bottom: 1.5px solid #F2D7C8; 
              padding-bottom: 4px; 
              margin-bottom: 8px; 
            }

            .vitals-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 4px;
            }

            .vital-card {
              background-color: #FFF5F0;
              border: 1px solid #FBE5D8;
              border-radius: 8px;
              padding: 5px 12px;
              font-size: 12px;
              color: #3D2010;
              display: flex;
              align-items: center;
              gap: 5px;
            }

            .vital-card strong {
              color: #D97757;
            }

            .meds-table { 
              width: 100%; 
              border-collapse: separate; 
              border-spacing: 0;
              margin-top: 6px; 
              border: 1px solid #EEDFD7;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .meds-table th { 
              background-color: #FFF9F5;
              border-bottom: 1.5px solid #EEDFD7; 
              text-align: left; 
              padding: 8px 12px; 
              font-size: 11px; 
              font-weight: 700;
              color: #806B61; 
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .meds-table td { 
              padding: 8px 12px; 
              border-bottom: 1px solid #F3EAE5; 
              font-size: 12.5px; 
              color: #3D2010;
            }
            
            .meds-table tr:last-child td {
              border-bottom: none;
            }
            
            .med-name {
              font-weight: 700;
              color: #3D2010;
            }

            .sig-section {
              margin-top: 24px;
              display: flex;
              justify-content: flex-end;
            }

            .sig-box {
              text-align: center;
              width: 170px;
            }

            .sig-image {
              max-height: 50px;
              width: auto;
              margin-bottom: 6px;
            }

            .sig-line {
              border-top: 1px solid #8B7469;
              padding-top: 5px;
              font-size: 12px;
              font-weight: 600;
              color: #554238;
            }
            
            .footer { 
              margin-top: 20px; 
              text-align: center; 
              font-size: 10px; 
              color: #9C8276; 
              border-top: 1px solid #EEDFD7; 
              padding-top: 10px; 
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="brand-section">
              <img src="${window.location.origin}/logo.png" class="logo-img" alt="VitaData Logo" onerror="this.style.display='none'" />
              <div class="brand-details">
                <h1>VitaData Healthcare</h1>
                <p>Patient Medical Record</p>
              </div>
            </div>
            <div class="clinic-info">
              <h3>Dr. ${data.encounter?.doctor?.name || "Clinician"}</h3>
              <div class="specialty">${data.encounter?.doctor?.specialty || data.encounter?.doctor?.specialization || "General Medicine"}</div>
              <div class="hospital">${data.encounter?.hospital?.name || "VitaData Hospital"}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <p><strong>Patient Name:</strong> ${patientName}</p>
              <p><strong>Date of Birth:</strong> ${dob}</p>
              <p><strong>Gender:</strong> <span style="text-transform: capitalize;">${gender}</span></p>
            </div>
            <div class="info-block" style="text-align: right;">
              <p><strong>Prescription ID:</strong> <span style="font-family: monospace; font-size: 12px;">${data.id || "—"}</span></p>
              <p><strong>Date Issued:</strong> ${formatDate(data.generatedAt)}</p>
              <p><strong>Next Follow-up:</strong> ${formatDate(data.nextVisit)}</p>
            </div>
          </div>

          <!-- Vitals Section -->
          ${data.encounter?.vitals && data.encounter.vitals.length > 0 ? `
            <div class="section">
              <div class="section-title">Recorded Vitals</div>
              <div class="vitals-grid">
                ${data.encounter.vitals.map(v => `
                  <div class="vital-card">
                    <strong>${v.name || v.vitalType?.name || "Vital"}:</strong>
                    <span>${v.value} ${v.unit || v.vitalType?.unit || ""}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Suggested Lab Tests -->
          ${data.encounter?.labResults && data.encounter.labResults.length > 0 ? `
            <div class="section">
              <div class="section-title">Suggested Lab Tests</div>
              <table class="meds-table">
                <thead>
                  <tr>
                    <th style="width:40%;">Test Name</th>
                    <th style="width:20%;">Status</th>
                    <th style="width:40%;">Pre-test Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.encounter.labResults.map(r => `
                    <tr>
                      <td><span class="med-name">${r.testName || "Lab Test"}</span></td>
                      <td>${r.resultValue != null ? r.resultValue : "<em style='color:#9C8276;'>Pending</em>"}</td>
                      <td>${r.remarks || "—"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : ""}
          
          <div class="section">
            <div class="section-title">Clinical Indication & Diagnosis</div>
            <p style="font-size: 14.5px; color: #554238;">
              <strong>Symptoms / chief complaint:</strong> ${symptomsText}<br>
              <span style="display: block; margin-top: 8px;">
                <strong>Diagnosis Summary:</strong> ${diagnosisSummaryText}
              </span>
            </p>
          </div>

          <div class="section">
            <div class="section-title">Prescribed Medications</div>
            <table class="meds-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Medicine</th>
                  <th style="width: 15%;">Dosage</th>
                  <th style="width: 30%;">Intake Frequency</th>
                  <th style="width: 15%;">Duration</th>
                </tr>
              </thead>
              <tbody>
                ${(data.medicines || []).map(m => `
                  <tr>
                    <td><span class="med-name">${m.name || "Medicine"}</span></td>
                    <td>${m.dosage || "—"}</td>
                    <td>${m.frequency || "—"}</td>
                    <td>${m.durationDays || "—"} days</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Clinical Advice / Notes -->
          ${data.encounter?.notes ? `
            <div class="section">
              <div class="section-title">Advice & Clinical Notes</div>
              <p style="font-size: 14px; color: #554238; white-space: pre-wrap; background-color: #FAFAFA; padding: 16px; border-radius: 12px; border: 1px solid #EEDFD7;">${data.encounter.notes}</p>
            </div>
          ` : ""}

          <!-- Doctor Signature -->
          <div class="sig-section">
            <div class="sig-box">
              ${data.encounter?.doctor?.signatureUrl ? `
                <img src="${data.encounter.doctor.signatureUrl}" class="sig-image" alt="Doctor Signature" />
              ` : `
                <div style="height: 50px;"></div>
              `}
              <div class="sig-line">Dr. ${data.encounter?.doctor?.name || "Clinician"}</div>
              <div style="font-size: 11px; color: #8B7469; margin-top: 2px;">Authorized Signatory</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a digitally generated medical prescription card from VitaData Solutions.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }
          </script>
        </body>
        </html>
      `;
    } else if (type === "labReport") {
      html = `
        <html>
        <head>
          <title>Lab Report - ${data.testName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #3D2010; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3D2010; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #D97757; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #3D2010; border-bottom: 1px solid #EEDFD7; padding-bottom: 5px; margin-bottom: 10px; }
            .report-card { border: 1px solid #EEDFD7; border-radius: 12px; padding: 20px; background-color: #FFF9F5; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
            .footer { margin-top: 80px; text-align: center; font-size: 11px; color: #9C8276; border-top: 1px solid #EEDFD7; padding-top: 15px; }
            .abnormal { color: #DC2626; font-weight: bold; }
            .normal { color: #059669; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">VitaData Laboratories</div>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #6B554A;">Diagnostic Laboratory Report</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0;">${data.encounter?.hospital?.name || "VITADATA Solutions"}</h3>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #6B554A;">Report Date: ${formatDate(data.reportedAt, true)}</p>
            </div>
          </div>
          <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <strong>Patient Name:</strong> ${patientName}<br>
              <strong>Date of Birth:</strong> ${dob}<br>
              <strong>Gender:</strong> ${gender}
            </div>
            <div style="text-align: right;">
              <strong>Report ID:</strong> ${data.id || "—"}<br>
              <strong>Visit Reference:</strong> ${data.encounter?.visitType || "OPD"}<br>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Diagnostic Result Summary</div>
            <div class="report-card">
              <div>
                <p><strong>Test Name:</strong> ${data.testName}</p>
                <p><strong>Result Value:</strong> <span class="${data.isAbnormal ? "abnormal" : "normal"}">${data.resultValue}</span></p>
              </div>
              <div>
                <p><strong>Status:</strong> <span class="${data.isAbnormal ? "abnormal" : "normal"}">${data.isAbnormal ? "ABNORMAL" : "NORMAL"}</span></p>
                <p><strong>Lab Technician Remarks:</strong> ${data.remarks || "No abnormal conditions detected."}</p>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an official laboratory report generated from VitaData Healthcare.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }
          </script>
        </body>
        </html>
      `;
    } else if (type === "invoice") {
      const encounterItem = data.items?.find(item => item.itemType === "ENCOUNTER");
      const doctorName = encounterItem?.encounter?.doctor?.user 
        ? `Dr. ${encounterItem.encounter.doctor.user.firstName} ${encounterItem.encounter.doctor.user.lastName}`
        : "Healthcare Specialist";
      const specialization = encounterItem?.encounter?.doctor?.specialization || "General Medicine";
      const hospitalName = encounterItem?.encounter?.hospital?.name || "VitaData Hospital";
      const patientFullName = data.patient?.user ? `${data.patient.user.firstName} ${data.patient.user.lastName}` : patientName;
      
      html = `
        <html>
        <head>
          <title>Invoice - ${data.invoiceNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #3D2010; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3D2010; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #D97757; }
            .hosp-info { text-align: right; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #3D2010; border-bottom: 1px solid #EEDFD7; padding-bottom: 5px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { border-bottom: 2px solid #EEDFD7; text-align: left; padding: 10px 8px; font-size: 14px; color: #6B554A; }
            td { padding: 12px 8px; border-bottom: 1px solid #F3EAE5; font-size: 13px; }
            .total-row td { border-bottom: none; font-weight: bold; font-size: 14px; padding-top: 15px; }
            .grand-total { color: #D97757; font-size: 18px !important; }
            .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
            .badge-paid { background-color: #E6F4EA; color: #137333; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #9C8276; border-top: 1px solid #EEDFD7; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${window.location.origin}/logo.png" style="height:40px; width:auto; object-fit:contain;" alt="VitaData" onerror="this.style.display='none'" />
              <div>
                <div class="logo">VitaData Healthcare</div>
                <p style="margin: 3px 0 0 0; font-size: 13px; color: #6B554A;">Official Payment Receipt</p>
              </div>
            </div>
            <div class="hosp-info">
              <h3 style="margin: 0;">${hospitalName}</h3>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #6B554A;">Invoice: ${data.invoiceNumber}</p>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #6B554A;">Status: <span class="badge badge-paid">${data.status}</span></p>
            </div>
          </div>
          
          <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <strong style="color: #6B554A; font-size: 12px; text-transform: uppercase;">Billed To:</strong><br>
              <span style="font-size: 15px; font-weight: bold; color: #3D2010;">${patientFullName}</span><br>
              <strong>Gender:</strong> ${gender}<br>
              <strong>Date of Birth:</strong> ${dob}
            </div>
            <div style="text-align: right;">
              <strong style="color: #6B554A; font-size: 12px; text-transform: uppercase;">Invoice Details:</strong><br>
              <strong>Issued Date:</strong> ${formatDate(data.generatedAt)}<br>
              <strong>Payment Date:</strong> ${data.paidDate ? formatDate(data.paidDate, true) : formatDate(new Date(), true)}<br>
              <strong>Payment Mode:</strong> Online (Razorpay Gateway)
            </div>
          </div>

          <div class="section">
            <div class="section-title">Billing Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${data.items && data.items.length > 0 ? data.items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.description || "Medical Service"}</strong><br>
                      <span style="font-size: 11px; color: #8B7469;">Referenced to ${doctorName} (${specialization})</span>
                    </td>
                    <td style="text-align: right;">${item.quantity || 1}</td>
                    <td style="text-align: right;">₹${Number(item.unitPrice || data.totalAmount).toFixed(2)}</td>
                    <td style="text-align: right;">₹${Number(item.totalPrice || data.totalAmount).toFixed(2)}</td>
                  </tr>
                `).join('') : `
                  <tr>
                    <td>
                      <strong>Doctor Consultation Fee</strong><br>
                      <span style="font-size: 11px; color: #8B7469;">Referenced to ${doctorName} (${specialization})</span>
                    </td>
                    <td style="text-align: right;">1</td>
                    <td style="text-align: right;">₹${Number(data.totalAmount).toFixed(2)}</td>
                    <td style="text-align: right;">₹${Number(data.totalAmount).toFixed(2)}</td>
                  </tr>
                `}
                
                <tr class="total-row" style="border-top: 2px solid #F3EAE5;">
                  <td colspan="2"></td>
                  <td style="text-align: right; color: #8B7469;">Subtotal:</td>
                  <td style="text-align: right; color: #3D2010;">₹${Number(data.totalAmount).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="2"></td>
                  <td style="text-align: right; color: #8B7469;">Tax (GST 10%):</td>
                  <td style="text-align: right; color: #3D2010;">₹${Number(data.taxAmount || 0).toFixed(2)}</td>
                </tr>
                ${Number(data.discountAmount) > 0 ? `
                  <tr class="total-row" style="color: #137333;">
                    <td colspan="2"></td>
                    <td style="text-align: right;">Discount:</td>
                    <td style="text-align: right;">-₹${Number(data.discountAmount).toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr class="total-row grand-total">
                  <td colspan="2"></td>
                  <td style="text-align: right; color: #3D2010;">Grand Total:</td>
                  <td style="text-align: right;" class="grand-total">₹${Number(data.finalAmount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing VitaData Healthcare. This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }
          </script>
        </body>
        </html>
      `;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Views
  const renderOverview = () => {
    const nextAppt = appointments.find(a => a.status === "SCHEDULED" || a.status === "IN_PROGRESS");
    const activePrescCount = records.prescriptions.length;

    return (
      <div className="space-y-7">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Active Medications" value={activeMedications.length} detail="Currently active courses" />
          <MetricCard label="Lab Reports" value={records.labReports.length} detail="Completed test logs" tone="blue" />
          <MetricCard label="Prescription Sheets" value={activePrescCount} detail="Issued by clinicians" tone="green" />
        </div>

        {nextAppt && (
          <div className="bg-gradient-to-br from-[#FFF4EC] to-white border border-[#F2D7C8] rounded-2xl p-6 shadow-sm">
            <h3 className="text-md font-bold text-[#3D2010] mb-2">Upcoming Consultation Details</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-[#9C8276] uppercase font-semibold">Doctor</p>
                <p className="text-sm font-bold text-[#3D2010]">{nextAppt.doctor?.name || "Doctor"}</p>
                <p className="text-xs text-[#7A655B]">{nextAppt.doctor?.specialty}</p>
              </div>
              <div>
                <p className="text-xs text-[#9C8276] uppercase font-semibold">Location</p>
                <p className="text-sm font-bold text-[#3D2010]">{nextAppt.hospital?.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#9C8276] uppercase font-semibold">Date & Time</p>
                <p className="text-sm font-bold text-[#3D2010]">{formatDate(nextAppt.scheduledTime, true)}</p>
                <p className="mt-1"><StatusBadge value={nextAppt.status} /></p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-white rounded-2xl border border-[#EEDFD7] p-5 shadow-sm">
            <h3 className="font-bold text-[#3D2010] mb-4">Medication Adherence Ad-hoc Summary</h3>
            {medDashboard?.summary ? (
              <div className="space-y-4">
                <div className="flex justify-between border-b border-[#F3EAE5] pb-2">
                  <span className="text-sm text-[#7A655B]">Total Doses Today</span>
                  <span className="text-sm font-bold text-[#3D2010]">{medDashboard.summary.totalDosesToday}</span>
                </div>
                <div className="flex justify-between border-b border-[#F3EAE5] pb-2">
                  <span className="text-sm text-[#7A655B]">Logged Intakes Today</span>
                  <span className="text-sm font-bold text-emerald-600">{medDashboard.summary.takenDosesToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#7A655B]">Adherence Rate</span>
                  <span className="text-sm font-bold text-[#D97757]">{medDashboard.summary.adherencePercent}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#9C8276] text-center py-6">No medication schedule logged.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#EEDFD7] p-5 shadow-sm">
            <h3 className="font-bold text-[#3D2010] mb-4 font-sans">Physical Vitals & Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-[#F3EAE5] pb-2">
                <span className="text-sm text-[#7A655B]">Blood Group</span>
                <span className="text-sm font-bold text-[#3D2010]">{patientBloodGroup.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between border-b border-[#F3EAE5] pb-2">
                <span className="text-sm text-[#7A655B]">Gender</span>
                <span className="text-sm font-bold text-[#3D2010]">{profile?.patient?.gender || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#7A655B]">Date of Birth</span>
                <span className="text-sm font-bold text-[#3D2010]">{formatDate(profile?.patient?.dob)}</span>
              </div>
            </div>
          </div>

          <div>
            <DashboardCalendar events={patientEvents} />
          </div>
        </div>
      </div>
    );
  };

  const renderBookAppointment = () => {
    return (
      <div className="max-w-2xl bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#3D2010] mb-4">Book Health Consultation</h2>
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <AutocompleteSelect
              label="Select Doctor Type"
              value={selectedSpecialty}
              onChange={(val) => {
                setSelectedSpecialty(val);
                setSelectedHospitalId("");
                setBookingForm({ ...bookingForm, doctorId: "" });
              }}
              options={specialties.map(spec => ({
                id: spec,
                name: spec
              }))}
              placeholder="Type to search specialty (e.g. Cardiology, Orthopedics)..."
              required
            />
          </div>

          <div>
            <AutocompleteSelect
              label="Select Hospital Location"
              value={selectedHospitalId}
              onChange={(val) => { setSelectedHospitalId(val); setBookingForm({ ...bookingForm, doctorId: "" }); }}
              options={filteredHospitals.map(h => ({
                id: h.id,
                name: `${h.name} (${h.city})`
              }))}
              placeholder={selectedSpecialty ? "Type to search hospital by location..." : "Please select doctor type first"}
              required
            />
          </div>

          <div>
            <AutocompleteSelect
              label="Select Doctor"
              value={bookingForm.doctorId}
              onChange={(val) => setBookingForm({ ...bookingForm, doctorId: val })}
              options={filteredDoctors.map(d => ({
                id: d.id,
                name: `${d.name} (${d.specialty})`
              }))}
              placeholder={selectedHospitalId ? "Type to search clinician..." : "Please select hospital location first"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Select Date</label>
            <input
              type="date"
              className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              value={bookingDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setBookingDate(e.target.value)}
              required
              disabled={!bookingForm.doctorId}
            />
          </div>

          {bookingDate && (
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-2">Select Available Slot</label>
              {loadingSlots ? (
                <div className="text-xs text-[#9C8276] animate-pulse">Checking doctor availability...</div>
              ) : slots.length === 0 ? (
                <div className="text-xs text-red-500 font-semibold">No slots available for this clinician on selected date.</div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(s => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={!s.available}
                      onClick={() => setBookingSlot(s.time)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                        !s.available
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through"
                          : bookingSlot === s.time
                          ? "bg-[#D97757] border-[#D97757] text-white"
                          : "bg-white border-[#E3D4CC] text-[#3D2010] hover:border-[#D97757]"
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Reason for Visit</label>
            <textarea
              className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              rows={3}
              placeholder="Fever, routine checkup, pain..."
              value={bookingForm.reason}
              onChange={e => setBookingForm({ ...bookingForm, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white px-5 py-3 text-sm font-semibold transition-colors"
          >
            Confirm Booking
          </button>
        </form>
      </div>
    );
  };

  const renderActiveView = () => {
    const views = {
      Dashboard: renderOverview(),
      "Book Appointment": renderBookAppointment(),
      Payments: renderPayments(),
      "My Appointments": (
        <>
          <SectionHeader description="Log of all appointments booked by you." />
          <DataTable
            rows={appointments}
            keyFor={(row) => row.id}
            emptyMessage="No appointments scheduled."
            columns={[
              { label: "Token No", render: (row) => <span className="font-bold text-[#D97757]">#{row.tokenNo || 1}</span> },
              { label: "Doctor", render: (row) => row.doctor?.name || "Doctor" },
              { label: "Hospital Location", render: (row) => row.hospital?.name || "—" },
              {
                label: "Scheduled At",
                render: (row) => {
                  const scheduled = row.scheduledTime ? new Date(row.scheduledTime) : null;
                  const now = new Date();
                  const isPast = scheduled ? scheduled.getTime() < now.getTime() : false;
                  const isNotVisited = row.status !== "COMPLETED" && row.status !== "CANCELLED";
                  const isMissed = isPast && isNotVisited;

                  if (isMissed) {
                    return (
                      <div className="leading-tight">
                        <div>{formatDate(row.scheduledTime, true)}</div>
                        <div className="text-[11px] text-[#554238] font-semibold mt-0.5">Missed</div>
                      </div>
                    );
                  }

                  return formatDate(row.scheduledTime, true);
                },
              },
              { label: "Reason", render: (row) => row.reason || "General Checkup" },
              {
                label: "Recorded Vitals",
                render: (row) => {
                  const vList = row.vitals || [];
                  if (vList.length === 0) return <span className="text-[#8B7469] italic text-xs">No vitals</span>;
                  return (
                    <div className="flex flex-wrap gap-1">
                      {vList.map((v, i) => (
                        <span key={i} className="inline-flex items-center rounded-lg bg-[#FFF1E8] border border-[#F2D7C8] px-2 py-0.5 text-[11px] font-semibold text-[#D97757]">
                          {v.name}: {v.value} {v.unit}
                        </span>
                      ))}
                    </div>
                  );
                }
              },
              {
                label: "Status",
                render: (row) => {
                  const scheduled = row.scheduledTime ? new Date(row.scheduledTime) : null;
                  const now = new Date();
                  const isPast = scheduled ? scheduled.getTime() < now.getTime() : false;
                  const isNotVisited = row.status !== "COMPLETED" && row.status !== "CANCELLED";
                  const isMissed = isPast && isNotVisited;

                  if (isMissed) {
                    return (
                      <span className="inline-flex rounded-full border border-gray-400 bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                        MISSED
                      </span>
                    );
                  }

                  return <StatusBadge value={row.status} />;
                }
              },
              {
                label: "Actions",
                render: (row) => {
                  const scheduled = row.scheduledTime ? new Date(row.scheduledTime) : null;
                  const now = new Date();
                  const isPast = scheduled ? scheduled.getTime() < now.getTime() : false;
                  const isNotVisited = row.status !== "COMPLETED" && row.status !== "CANCELLED";
                  const isMissed = isPast && isNotVisited;
                  const canCancel = !isMissed && (row.status === "SCHEDULED" || row.status === "CONFIRMED" || row.status === "RESCHEDULED");
                  if (!canCancel) return "—";
                  return (
                    <button
                      onClick={() => handleCancelAppointment(row.id || row.encounterId)}
                      className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none"
                    >
                      Cancel
                    </button>
                  );
                }
              },
            ]}
          />
        </>
      ),
      "Medical Records": (
        <div className="space-y-6">
          <div>
            <SectionHeader title="Clinical Prescriptions" description="Prescription sheets issued by doctors." />
            <DataTable
              rows={records.prescriptions}
              keyFor={(row) => row.id}
              emptyMessage="No prescriptions recorded."
              columns={[
                { label: "Issued Date", render: (row) => formatDate(row.generatedAt || row.encounter?.scheduledTime) },
                { label: "Doctor Name", render: (row) => row.encounter?.doctor?.name || "Clinical staff" },
                { label: "Diagnosis Summary", render: (row) => row.encounter?.diagnoses?.[0]?.diagnosisText || row.encounter?.diagnosis || row.encounter?.reason || "—" },
                {
                  label: "Prescribed Medicines",
                  render: (row) => (
                    <div className="space-y-1">
                      {row.medicines.map((m, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-bold text-[#3D2010]">{m.name}</span> - {m.dosage} ({m.frequency}, {m.durationDays} days)
                        </div>
                      ))}
                    </div>
                  ),
                },
                { label: "Next Follow-Up", render: (row) => formatDate(row.nextVisit) },
                {
                  label: "Actions",
                  render: (row) => (
                    <button
                      onClick={() => handleDownloadPDF("prescription", row)}
                      className="rounded-lg bg-[#FFF1E8] border border-[#F2D7C8] text-[#D97757] px-3 py-1.5 text-xs font-semibold hover:bg-[#FFF4EC]"
                    >
                      Download PDF
                    </button>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <SectionHeader title="Laboratory Diagnostic Reports" description="Laboratory results logbook." />
            <DataTable
              rows={records.labReports}
              keyFor={(row) => row.id}
              emptyMessage="No lab reports found."
              columns={[
                { label: "Test Name", render: (row) => <span className="font-semibold text-[#3D2010]">{row.testName}</span> },
                { label: "Value Result", render: (row) => row.resultValue },
                { label: "Remarks", render: (row) => row.remarks || "—" },
                { label: "Status Flag", render: (row) => <span className={`font-semibold ${row.isAbnormal ? "text-red-600" : "text-emerald-600"}`}>{row.isAbnormal ? "ABNORMAL" : "NORMAL"}</span> },
                { label: "Reported Date", render: (row) => formatDate(row.reportedAt, true) },
                {
                  label: "Actions",
                  render: (row) => (
                    <button
                      onClick={() => handleDownloadPDF("labReport", row)}
                      className="rounded-lg bg-[#FFF1E8] border border-[#F2D7C8] text-[#D97757] px-3 py-1.5 text-xs font-semibold hover:bg-[#FFF4EC]"
                    >
                      Download PDF
                    </button>
                  ),
                },
              ]}
            />
          </div>
        </div>
      ),
      "Medications & Refills": (
        <div className="space-y-6">
          <div>
            <SectionHeader title="Today's Dose Schedule" description="Log of today's medication intake queue." />
            <DataTable
              rows={(() => {
                // Only show entries for currently active medications, deduplicated by medicineName
                const activeNames = new Set(
                  activeMedications.map((m) => (m.name || "").toLowerCase().trim())
                );
                const seen = new Set();
                return (medDashboard?.todaySchedule || []).filter((row) => {
                  const key = (row.medicineName || "").toLowerCase().trim();
                  if (!activeNames.has(key) || seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
              })()}
              keyFor={(row) => row.id}
              emptyMessage="No medications scheduled for today."
              columns={[
                { label: "Medicine Name", render: (row) => <span className="font-semibold text-[#3D2010]">{row.medicineName}</span> },
                { label: "Dosage", render: (row) => row.dosage || "1 Unit" },
                { label: "Intake Time", render: (row) => <span className="font-semibold text-[#D97757]">{row.timeOfDay}</span> },
                { label: "Instructions", render: (row) => row.instructions || "No instructions" },
                {
                  label: "Log Actions",
                  render: (row) => (
                    <div>
                      {isTakenToday(row) ? (
                        <div className="flex items-center gap-2.5">
                          <span className="text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded-lg">Intake Logged</span>
                          <button
                            onClick={() => handleUnmarkMedTaken(row.id)}
                            className="text-[#D97757] hover:text-[#3D2010] text-xs font-semibold underline"
                          >
                            Unmark
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkMedTaken(row.id)}
                          className="rounded-lg bg-[#3D2010] px-3 py-1 text-xs font-semibold text-white hover:bg-[#D97757]"
                        >
                          Mark Taken
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <SectionHeader title="Active Medications" description="Deduplicated active medicines across all prescriptions — showing remaining days left." />
            <DataTable
              rows={activeMedications}
              keyFor={(row, i) => `${row.name}-${i}`}
              emptyMessage="No active medicines currently prescribed."
              columns={[
                { label: "Medicine Name", render: (row) => <span className="font-semibold text-[#3D2010]">{row.name}</span> },
                { label: "Dosage", render: (row) => row.dosage || "—" },
                { label: "Frequency", render: (row) => row.frequency || "—" },
                {
                  label: "Days Remaining",
                  render: (row) => {
                    const pct = row.durationDays > 0 ? Math.round((row.daysRemaining / row.durationDays) * 100) : 0;
                    const color = pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-400" : "bg-red-400";
                    return (
                      <div className="space-y-1 min-w-[90px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#3D2010]">{row.daysRemaining}</span>
                          <span className="text-[#9C8276]">/ {row.durationDays}d</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#F3EAE5] overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  }
                },
              ]}
            />
          </div>
        </div>
      ),
    };
    return views[activeNav];
  };

  return (
    <div className="flex min-h-screen bg-[#F9F9F9] font-sans text-[#3D2010]">
      {isSidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed bottom-0 left-0 top-0 z-50 flex w-[250px] shrink-0 flex-col border-r border-[#EEDFD7] bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-[74px] justify-center items-center border-b border-[#EEDFD7]">
          <button onClick={() => setActiveNav("Dashboard")} className="flex justify-center items-center w-full h-full px-4">
            <Image src="/logo.png" alt="VitaData Solutions" width={180} height={90} className="h-[60px] w-auto object-contain" priority />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  onClick={() => { setActiveNav(item); setIsSidebarOpen(false); setSuccessMsg(""); }}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${activeNav === item ? "bg-[#FFF1E8] text-[#D97757]" : "text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#3D2010]"}`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-[#EEDFD7] p-4">
          <button onClick={logout} className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[#806B61] transition-colors hover:bg-red-50 hover:text-red-600">Logout</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-[#EEDFD7] bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button aria-label="Open navigation" className="rounded-lg p-2 text-[#6B554A] hover:bg-[#FFF4EC] lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <span className="block h-0.5 w-5 bg-current" />
              <span className="mt-1.5 block h-0.5 w-5 bg-current" />
              <span className="mt-1.5 block h-0.5 w-5 bg-current" />
            </button>
            <span className="text-xl font-extrabold tracking-tight text-[#D97757]">VitaData</span>
            <div className="hidden sm:block border-l border-[#EEDFD7] pl-3">
              <p className="text-xs font-medium text-[#9C8276]">Personal Patient Health Records</p>
              <p className="text-sm font-bold text-[#3D2010]">VitaData Health Portal</p>
            </div>
          </div>
          <div className="relative flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="notification-bell-btn relative rounded-full p-2 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors focus:outline-none"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 rounded-full bg-[#D97757] ring-2 ring-white animate-pulse" />
                )}
              </button>

              {isNotificationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                  <div className="notification-dropdown-menu absolute right-0 top-12 z-50 w-80 rounded-2xl border border-[#EEDFD7] bg-white p-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between border-b border-[#F3EAE5] pb-2 mb-2">
                      <span className="text-sm font-bold text-[#3D2010] font-sans">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-[#FFF1E8] px-2 py-0.5 text-[10px] font-extrabold text-[#D97757] leading-none">
                          {unreadCount} new
                        </span>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 font-sans pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400 italic">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.notificationId} 
                            className={`p-2.5 rounded-xl border transition-colors text-left ${
                              n.isRead ? "border-gray-50 bg-gray-50/50" : "border-[#FFF1E8] bg-[#FFFBF8]"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-xs font-bold ${n.isRead ? "text-gray-500" : "text-[#3D2010]"}`}>
                                {n.title}
                              </span>
                              {!n.isRead && (
                                <button 
                                  onClick={() => markAsRead(n.notificationId)}
                                  className="text-[10px] font-extrabold text-[#D97757] hover:underline focus:outline-none"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                            <p className={`text-[11px] mt-1 leading-relaxed ${n.isRead ? "text-gray-400" : "text-gray-600"}`}>
                              {n.message}
                            </p>
                            <span className="text-[9px] text-gray-400 block mt-1">
                              {new Date(n.createdAt).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="profile-dropdown-btn flex items-center gap-3 focus:outline-none hover:opacity-90 text-left"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#3D2010]">{patientName}</p>
                <p className="text-xs text-[#9C8276]">Patient User</p>
              </div>
              {profile?.profile ? (
                <img src={profile.profile} alt={patientName} className="h-10 w-10 rounded-full border border-[#F0CDBB] object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0CDBB] bg-[#FFF1E8] text-sm font-bold text-[#D97757]">
                  {patientName.charAt(0)}
                </div>
              )}
            </button>

            {isProfileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                <div className="profile-dropdown-menu absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#EEDFD7] bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-[#F3EAE5] mb-1">
                    <p className="text-xs text-[#9C8276] font-medium font-sans">Logged in as</p>
                    <p className="text-sm font-bold text-[#3D2010]">{patientName}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); setProfileModalMode("view"); setIsProfileModalOpen(true); }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#D97757] font-medium"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); setProfileModalMode("edit"); setIsProfileModalOpen(true); }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#D97757] font-medium"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); alert("Settings config: Theme & preferences are set to auto-detect."); }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#D97757] font-medium"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); alert("Contact Us:\nSupport: support@vitadata.example\nPhone: +91-80-VITA-DATA"); }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#D97757] font-medium"
                  >
                    Contact Us
                  </button>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); alert("About VitaData:\nVersion 1.0.0 (Production)\nAdvanced Clinical Workspace Platform."); }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#D97757] font-medium"
                  >
                    About Page
                  </button>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); alert("Theme Selector:\nSystem theme is currently set to Warm Gold / Autumn Sunset (Aesthetic Default)."); }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#D97757] font-medium"
                  >
                    Theme
                  </button>
                  <div className="border-t border-[#F3EAE5] mt-1 pt-1">
                    <button
                      onClick={() => { setIsProfileDropdownOpen(false); logout(); }}
                      className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#2F1A10] md:text-3xl">{activeNav}</h1>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <span>{successMsg}</span>
              </div>
            )}

            {loading ? <LoadingState /> : renderActiveView()}
          </div>
        </main>

        <button onClick={() => { window.location.href = "mailto:support@vitadata.example"; }} className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#3D2010] text-lg font-bold text-white shadow-lg transition-colors hover:bg-[#D97757]">?</button>
      </div>
      {submitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#EEDFD7] p-8 shadow-2xl flex flex-col items-center max-w-sm text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F3DED2] border-t-[#D97757] mb-4" />
            <h3 className="font-bold text-lg text-[#3D2010] mb-1">Processing Request</h3>
            <p className="text-sm text-[#8B7469]">Please do not close this window or navigate away while we update the system.</p>
          </div>
        </div>
      )}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-[#3D2010] mb-6 font-sans">
              {profileModalMode === "view" ? "My Profile" : "Edit Profile"}
            </h2>

            {profileModalMode === "view" ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-[#F3EAE5]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#F0CDBB] bg-[#FFF1E8] text-2xl font-bold text-[#D97757]">
                    {patientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#3D2010]">{patientName}</h3>
                    <p className="text-xs text-[#9C8276] font-medium font-sans">Patient Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Email Address</p>
                    <p className="text-sm font-medium text-[#3D2010] break-all">{profile?.email || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Phone Number</p>
                    <p className="text-sm font-medium text-[#3D2010]">{profile?.phoneNumber || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Emergency Contact</p>
                    <p className="text-sm font-medium text-[#3D2010]">{profile?.emergencyContact || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Blood Group</p>
                    <p className="text-sm font-semibold text-[#D97757]">
                      {profile?.patient?.bloodGroup ? String(profile.patient.bloodGroup).replace("_", " ") : "Not Recorded"}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Gender</p>
                    <p className="text-sm font-medium text-[#3D2010] capitalize">{profile?.patient?.gender || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Date of Birth</p>
                    <p className="text-sm font-medium text-[#3D2010]">
                      {profile?.patient?.dob ? formatDate(profile.patient.dob) : "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1">Chronic Conditions</p>
                  {profile?.patient?.chronicConditions && profile.patient.chronicConditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {profile.patient.chronicConditions.map((cond, idx) => (
                        <span key={idx} className="rounded-lg bg-orange-50 border border-orange-100 px-2 py-0.5 text-xs text-[#D97757] font-medium">
                          {cond}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9C8276] italic">None recorded</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#F3EAE5] mt-6">
                  <button
                    type="button"
                    onClick={() => setProfileModalMode("edit")}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm font-sans"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 font-sans"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">First Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Last Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.lastName}
                      onChange={(e) => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Emergency Contact</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact}
                      onChange={(e) => setEditForm(p => ({ ...p, emergencyContact: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Blood Group</label>
                    <select
                      value={editForm.bloodGroup}
                      onChange={(e) => setEditForm(p => ({ ...p, bloodGroup: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A_POSITIVE">A+ (Positive)</option>
                      <option value="A_NEGATIVE">A- (Negative)</option>
                      <option value="B_POSITIVE">B+ (Positive)</option>
                      <option value="B_NEGATIVE">B- (Negative)</option>
                      <option value="AB_POSITIVE">AB+ (Positive)</option>
                      <option value="AB_NEGATIVE">AB- (Negative)</option>
                      <option value="O_POSITIVE">O+ (Positive)</option>
                      <option value="O_NEGATIVE">O- (Negative)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm(p => ({ ...p, gender: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => setEditForm(p => ({ ...p, dob: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Chronic Conditions</label>
                  <input
                    type="text"
                    value={editForm.chronicConditions}
                    onChange={(e) => setEditForm(p => ({ ...p, chronicConditions: e.target.value }))}
                    placeholder="e.g. Diabetes, Asthma (comma separated)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] placeholder-gray-400 outline-none focus:border-[#D97757]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#F3EAE5] mt-6">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm font-sans"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileModalMode("view")}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 font-sans"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Clinical Experience Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-md w-full relative animate-in zoom-in-95 duration-200">
            <button 
              type="button"
              onClick={() => {
                setIsFeedbackModalOpen(false);
                if (feedbackForm.encounterId) {
                  localStorage.setItem('feedback_clinical_seen_' + feedbackForm.encounterId, 'true');
                }
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-[#3D2010] mb-2 font-sans">
              Clinical Experience Feedback
            </h2>
            <p className="text-xs text-[#8B7469] mb-6">
              Please share your experience about your recent appointment to help us improve our services.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <StarSelector 
                label="Doctor Consultation" 
                value={feedbackForm.doctorRating} 
                onChange={(val) => setFeedbackForm(prev => ({ ...prev, doctorRating: val }))} 
              />
              <StarSelector 
                label="Hospital Cleanliness & Facilities" 
                value={feedbackForm.hospitalRating} 
                onChange={(val) => setFeedbackForm(prev => ({ ...prev, hospitalRating: val }))} 
              />
              <StarSelector 
                label="Receptionist & Staff" 
                value={feedbackForm.receptionistRating} 
                onChange={(val) => setFeedbackForm(prev => ({ ...prev, receptionistRating: val }))} 
              />

              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-bold text-[#8B7469] uppercase tracking-wider">Any suggestions for improvements?</label>
                <textarea
                  value={feedbackForm.comment}
                  onChange={e => setFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tell us what went well or what we can improve..."
                  rows={3}
                  className="w-full rounded-xl border border-[#E3D4CC] px-4 py-3 text-sm focus:border-[#D97757] focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFeedbackModalOpen(false);
                    if (feedbackForm.encounterId) {
                      localStorage.setItem('feedback_clinical_seen_' + feedbackForm.encounterId, 'true');
                    }
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 font-sans"
                >
                  Not Now
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm font-sans"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Website & Payments Experience Feedback Modal */}
      {isTechFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-md w-full relative animate-in zoom-in-95 duration-200">
            <button 
              type="button"
              onClick={() => {
                setIsTechFeedbackModalOpen(false);
                if (techFeedbackForm.encounterId) {
                  localStorage.setItem('feedback_tech_seen_' + techFeedbackForm.encounterId, 'true');
                }
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-[#3D2010] mb-2 font-sans">
              Website & Payment Experience
            </h2>
            <p className="text-xs text-[#8B7469] mb-6">
              Help us improve our portal! Rate the technical speed and booking experience.
            </p>

            <form onSubmit={handleTechFeedbackSubmit} className="space-y-4">
              <StarSelector 
                label="Website Speed & Interface" 
                value={techFeedbackForm.websiteRating} 
                onChange={(val) => setTechFeedbackForm(prev => ({ ...prev, websiteRating: val }))} 
              />
              <StarSelector 
                label="Online Payment Experience" 
                value={techFeedbackForm.paymentRating} 
                onChange={(val) => setTechFeedbackForm(prev => ({ ...prev, paymentRating: val }))} 
              />

              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-bold text-[#8B7469] uppercase tracking-wider">Any technical issues / improvements?</label>
                <textarea
                  value={techFeedbackForm.comment}
                  onChange={e => setTechFeedbackForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tell us if the payment checkout was smooth or if you faced bugs..."
                  rows={3}
                  className="w-full rounded-xl border border-[#E3D4CC] px-4 py-3 text-sm focus:border-[#D97757] focus:outline-none resize-none font-sans"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTechFeedbackModalOpen(false);
                    if (techFeedbackForm.encounterId) {
                      localStorage.setItem('feedback_tech_seen_' + techFeedbackForm.encounterId, 'true');
                    }
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 font-sans"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm font-sans"
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
