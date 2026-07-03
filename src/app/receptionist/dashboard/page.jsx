"use client";

import React from "react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardCalendar from "@/components/DashboardCalendar";

const navItems = [
  "Dashboard",
  "Register Patient",
  "Book Appointment",
  "Appointments",
  "Patients",
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
        <p className="mt-4 text-sm font-medium text-[#8B7469]">Loading portal data…</p>
      </div>
    </div>
  );
}

export default function ReceptionistDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState("view"); // "view" or "edit"
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emergencyContact: "",
  });


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Data States
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentFilterDate, setAppointmentFilterDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Form States
  const [patientForm, setPatientForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "male",
    dob: "",
    bloodGroup: "O_POSITIVE",
    chronicConditions: "",
  });

  const [bookingForm, setBookingForm] = useState({
    patientId: "",
    doctorId: "",
    visitType: "OPD",
    reason: "",
  });
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Search/New Patient booking states
  const [searchPhone, setSearchPhone] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle"); // "idle" | "searching" | "found" | "not_found"
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: "",
    lastName: "",
    dob: "",
  });
  const [selectedSpecialty, setSelectedSpecialty] = useState("");

  const [selectedPatientForPrescriptions, setSelectedPatientForPrescriptions] = useState(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);


  useEffect(() => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phoneNumber: profile.phoneNumber || "",
        emergencyContact: profile.emergencyContact || "",
      });
    }
  }, [profile, isProfileModalOpen]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSubmitting(true);
    const token = localStorage.getItem("receptionistToken");

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
      
      // Force reload data
      localStorage.removeItem("receptionist_cached_profile");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const receptionistEvents = useMemo(() => {
    return appointments.map(a => ({
      date: a.scheduledTime ? a.scheduledTime.split("T")[0] : "",
      type: a.visitType || "Appointment",
      title: `Appt: ${fullName(a.patient?.user)} with Dr. ${fullName(a.doctor?.user)}`,
      time: formatDate(a.scheduledTime, true).split(" - ")[1] || formatDate(a.scheduledTime, true),
      details: `Hospital: ${a.hospital?.name || "Clinic"} | Reason: ${a.reason || "General checkup"} (${a.status})`
    })).filter(e => e.date);
  }, [appointments]);

  const specialties = useMemo(() => {
    const set = new Set();
    doctors.forEach(d => {
      if (d.specialization) set.add(d.specialization);
    });
    return Array.from(set).sort();
  }, [doctors]);

  const logout = useCallback(() => {
    localStorage.removeItem("receptionistToken");
    localStorage.removeItem("receptionistRoles");
    localStorage.removeItem("receptionistUser");
    localStorage.removeItem("receptionist_cached_profile");
    localStorage.removeItem("receptionist_cached_doctors");
    document.cookie = "receptionist_token=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("receptionistToken");
    if (!token || !apiBaseUrl) {
      logout();
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. Load Profile & Hospital Info (cached)
      const cachedProfile = getCachedItem("receptionist_cached_profile");
      let currentProfile = cachedProfile;
      if (!currentProfile) {
        const profileRes = await fetch(`${apiBaseUrl}/users/myinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          currentProfile = profileData.data;
          setCachedItem("receptionist_cached_profile", currentProfile);
        }
      }
      setProfile(currentProfile);

      const hospitalId = currentProfile?.receptionist?.hospitalId;

      // 2. Load Doctors (cached)
      const cachedDoctors = getCachedItem("receptionist_cached_doctors");
      let currentDoctors = cachedDoctors || [];
      if (!cachedDoctors) {
        const doctorsRes = await fetch(`${apiBaseUrl}/doctors${hospitalId ? `?hospitalId=${hospitalId}` : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (doctorsRes.ok) {
          const doctorsData = await doctorsRes.json();
          currentDoctors = Array.isArray(doctorsData) ? doctorsData : [];
          setCachedItem("receptionist_cached_doctors", currentDoctors);
        }
      }
      setDoctors(currentDoctors);

      // 3. Load Patients (dynamic)
      const patientsRes = await fetch(`${apiBaseUrl}/patients${hospitalId ? `?hospitalId=${hospitalId}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      }

      // 4. Load Appointments (dynamic)
      const appointmentsRes = await fetch(`${apiBaseUrl}/encounters${hospitalId ? `?hospitalId=${hospitalId}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      }

    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the VitaData API");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const token = localStorage.getItem("receptionistToken");
    let expiryTimer;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const remaining = (payload.exp * 1000) - Date.now();
        if (remaining <= 0) {
          logout();
        } else {
          expiryTimer = setTimeout(() => {
            alert("Your session has expired. You are being logged out.");
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

  // Receptionist hospital details
  const receptionistName = profile ? fullName(profile) : "Receptionist";
  const hospitalName = profile?.receptionist?.hospital?.name || "VITADATA Solutions";
  const hospitalId = profile?.receptionist?.hospitalId;

  // Load available slots dynamically when hospital, doctor, date are selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!hospitalId || !bookingForm.doctorId || !bookingDate) {
        setSlots([]);
        return;
      }
      setLoadingSlots(true);
      setBookingSlot("");
      try {
        const token = localStorage.getItem("receptionistToken");
        // Receptionist can access patient slot lookup endpoint
        const res = await fetch(
          `${apiBaseUrl}/mobile/patient/doctors/${bookingForm.doctorId}/slots?date=${bookingDate}&hospitalId=${hospitalId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setSlots(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load doctor slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [hospitalId, bookingForm.doctorId, bookingDate]);

  // Actions
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("receptionistToken");
    setSubmitting(true);

    try {
      const payload = {
        ...patientForm,
        chronicConditions: patientForm.chronicConditions ? patientForm.chronicConditions.split(",").map(c => c.trim()) : [],
      };

      const res = await fetch(`${apiBaseUrl}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create patient profile");

      // OPTIMISTIC LOCAL STATE UPDATE
      const newPatient = data.data;
      if (newPatient) {
        setPatients(prev => [newPatient, ...prev]);
      }

      setSuccessMsg("Patient registered successfully!");
      setPatientForm({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        gender: "male",
        dob: "",
        bloodGroup: "O_POSITIVE",
        chronicConditions: "",
      });
      setActiveNav("Patients");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPrescriptionsModal = async (patient) => {
    setSelectedPatientForPrescriptions(patient);
    setIsPrescriptionModalOpen(true);
    setLoadingPrescriptions(true);
    setPatientPrescriptions([]);
    
    try {
      const token = localStorage.getItem("receptionistToken");
      const res = await fetch(`${apiBaseUrl}/prescriptions?patientId=${patient.patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatientPrescriptions(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error("Failed to load prescriptions", err);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleDownloadPDF = (prescription, patient) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download report PDFs.");
      return;
    }
    
    const patientName = fullName(patient.user);
    const dob = formatDate(patient.dob);
    const gender = patient.gender || "—";
    
    const doctorUser = prescription.encounter?.doctor?.user || prescription.doctor?.user;
    const doctorName = doctorUser ? fullName(doctorUser) : "Clinician";
    const doctorSpecialization = prescription.encounter?.doctor?.specialization || prescription.doctor?.specialization || "General Medicine";

    const diagnosis = prescription.encounter?.diagnosis || prescription.diagnosis || "Consultation Checkup";

    const medicines = prescription.prescriptionMedicines || prescription.medicines || [];

    const html = `
      <html>
      <head>
        <title>Prescription - ${patientName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #3D2010; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3D2010; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #D97757; }
          .doc-info { text-align: right; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #3D2010; border-bottom: 1px solid #EEDFD7; padding-bottom: 5px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { border-bottom: 2px solid #EEDFD7; text-align: left; padding: 8px; font-size: 14px; color: #6B554A; }
          td { padding: 10px 8px; border-bottom: 1px solid #F3EAE5; font-size: 13px; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #9C8276; border-top: 1px solid #EEDFD7; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">VitaData Healthcare</div>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #6B554A;">Patient Medical Record</p>
          </div>
          <div class="doc-info">
            <h3 style="margin: 0;">Dr. ${doctorName}</h3>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #6B554A;">${doctorSpecialization}</p>
          </div>
        </div>
        <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <strong>Patient Name:</strong> ${patientName}<br>
            <strong>Date of Birth:</strong> ${dob}<br>
            <strong>Gender:</strong> ${gender}
          </div>
          <div style="text-align: right;">
            <strong>Prescription ID:</strong> ${prescription.prescriptionId || "—"}<br>
            <strong>Date Issued:</strong> ${formatDate(prescription.createdAt)}<br>
            <strong>Next Follow-up:</strong> ${formatDate(prescription.encounter?.followUpDate)}
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Clinical Indication</div>
          <p><strong>Chief Symptoms / Diagnosis Summary:</strong> ${diagnosis}</p>
        </div>

        <div class="section">
          <div class="section-title">Prescribed Medications</div>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Intake Frequency</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${medicines.map(m => `
                <tr>
                  <td><strong>${m.medicine?.name || m.name || "Medicine"}</strong></td>
                  <td>${m.dosage || "—"}</td>
                  <td>${m.frequency || "—"}</td>
                  <td>${m.durationDays || "—"} days</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>This is a digitally generated medical prescription card from VitaData Solutions.</p>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleLookupPatient = async () => {
    if (!searchPhone && !searchEmail) {
      setError("Please enter a phone number or email to search.");
      return;
    }
    setError("");
    setSearchStatus("searching");
    setIsNewPatient(false);
    
    try {
      const token = localStorage.getItem("receptionistToken");
      let query = "";
      if (searchPhone) {
        // Normalize phone number
        const raw = String(searchPhone).trim();
        const digits = raw.replace(/\D/g, '');
        const canonicalPhone = raw.startsWith('+') ? `+${digits}` : (digits.length === 10 ? `+91${digits}` : `+${digits}`);
        query = `phoneNumber=${encodeURIComponent(canonicalPhone)}`;
      } else if (searchEmail) {
        query = `email=${encodeURIComponent(searchEmail.trim())}`;
      }

      const res = await fetch(`${apiBaseUrl}/patients?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        setSearchStatus("not_found");
        setIsNewPatient(true);
        setBookingForm(prev => ({ ...prev, patientId: "" }));
        setNewPatientForm({ firstName: "", lastName: "", dob: "" });
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to search patient");
      }

      const patientsData = await res.json();
      const patient = Array.isArray(patientsData) ? patientsData[0] : patientsData;
      
      if (!patient) {
        setSearchStatus("not_found");
        setIsNewPatient(true);
        setBookingForm(prev => ({ ...prev, patientId: "" }));
        setNewPatientForm({ firstName: "", lastName: "", dob: "" });
        return;
      }

      setSearchStatus("found");
      setIsNewPatient(false);
      setBookingForm(prev => ({ ...prev, patientId: patient.patientId }));
      setNewPatientForm({
        firstName: patient.user?.firstName || "",
        lastName: patient.user?.lastName || "",
        dob: patient.dob ? patient.dob.split("T")[0] : "",
      });
    } catch (err) {
      setError(err.message);
      setSearchStatus("idle");
    }
  };

  const handleClearPatientSearch = () => {
    setSearchPhone("");
    setSearchEmail("");
    setSearchStatus("idle");
    setIsNewPatient(false);
    setBookingForm(prev => ({ ...prev, patientId: "" }));
    setNewPatientForm({ firstName: "", lastName: "", dob: "" });
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("receptionistToken");
    setSubmitting(true);

    try {
      if (!hospitalId) throw new Error("Receptionist has no linked hospital");
      if (!bookingForm.doctorId) throw new Error("Please select a doctor");
      if (!bookingDate) throw new Error("Please select a date");
      if (!bookingSlot) throw new Error("Please select an available slot");

      let finalPatientId = bookingForm.patientId;

      if (isNewPatient) {
        // Validate new patient fields
        if (!newPatientForm.firstName || !newPatientForm.lastName || !newPatientForm.dob) {
          throw new Error("First Name, Last Name, and Date of Birth are required for new patients");
        }
        if (!searchPhone && !searchEmail) {
          throw new Error("Phone Number or Email is required");
        }

        // Register new patient
        const patientPayload = {
          firstName: newPatientForm.firstName,
          lastName: newPatientForm.lastName,
          phoneNumber: searchPhone || undefined,
          email: searchEmail || undefined,
          dob: newPatientForm.dob,
        };

        const patientRes = await fetch(`${apiBaseUrl}/patients`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(patientPayload),
        });

        const patientData = await patientRes.json();
        if (!patientRes.ok) throw new Error(patientData.message || "Failed to register new patient");

        finalPatientId = patientData.patientId || patientData.data?.patientId;
        if (!finalPatientId) throw new Error("New patient registration did not return a patient ID");

        // Optimistically add to patients registry local state
        setPatients(prev => [patientData, ...prev]);
      }

      if (!finalPatientId) throw new Error("Please verify or enter patient details");

      // Book encounter
      const encounterPayload = {
        patientId: finalPatientId,
        doctorId: bookingForm.doctorId,
        visitType: bookingForm.visitType,
        reason: bookingForm.reason,
        hospitalId,
        scheduledTime: `${bookingDate}T${bookingSlot}:00.000Z`,
        duration: 30,
      };

      const res = await fetch(`${apiBaseUrl}/encounters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(encounterPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to book appointment");

      const newAppt = data.data || data;
      if (newAppt) {
        setAppointments(prev => [newAppt, ...prev]);
      }

      setSuccessMsg("Appointment booked successfully!");
      
      // Reset forms
      handleClearPatientSearch();
      setBookingForm({
        patientId: "",
        doctorId: "",
        visitType: "OPD",
        reason: "",
      });
      setBookingDate("");
      setBookingSlot("");
      setSelectedSpecialty("");
      setActiveNav("Appointments");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (encounterId, newStatus) => {
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("receptionistToken");
    setSubmitting(true);

    // OPTIMISTIC LOCAL UPDATE
    const previousAppointments = JSON.parse(JSON.stringify(appointments));
    setAppointments(prev => prev.map(a => 
      a.encounterId === encounterId ? { ...a, status: newStatus } : a
    ));

    try {
      const res = await fetch(`${apiBaseUrl}/encounters/${encounterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");

      setSuccessMsg(`Appointment status updated to ${newStatus}`);
    } catch (err) {
      setAppointments(previousAppointments); // revert state
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Render Sub-Views
  const renderOverview = () => {
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(a => new Date(a.scheduledTime).toDateString() === today);
    const activePatientsCount = patients.length;

    return (
      <div className="space-y-7">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Today's Appointments" value={todayAppointments.length} detail="Scheduled for today" />
          <MetricCard label="Registered Patients" value={activePatientsCount} detail="Clinical records scope" tone="blue" />
          <MetricCard label="Available Doctors" value={doctors.length} detail="Linked to hospital network" tone="green" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader title="Today's Schedule" description="Latest appointment queue details for today." />
            <DataTable
              rows={todayAppointments}
              keyFor={(row) => row.encounterId}
              emptyMessage="No appointments scheduled for today."
              columns={[
                { label: "Token", render: (row) => <span className="font-bold text-[#D97757]">#{row.tokenNo || 1}</span> },
                { label: "Patient", render: (row) => fullName(row.patient?.user) },
                { label: "Doctor", render: (row) => fullName(row.doctor?.user) },
                { label: "Time", render: (row) => formatDate(row.scheduledTime, true) },
                { label: "Status", render: (row) => <StatusBadge value={row.status} /> },
                {
                  label: "Actions",
                  render: (row) => (
                    <div className="flex gap-2">
                      {row.status === "SCHEDULED" && (
                        <button
                          onClick={() => handleUpdateStatus(row.encounterId, "IN_PROGRESS")}
                          className="rounded-lg bg-[#3D2010] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#D97757]"
                        >
                          Check In
                        </button>
                      )}
                      {row.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => handleUpdateStatus(row.encounterId, "COMPLETED")}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Complete
                        </button>
                      )}
                      {row.status !== "CANCELLED" && row.status !== "COMPLETED" && (
                        <button
                          onClick={() => handleUpdateStatus(row.encounterId, "CANCELLED")}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <DashboardCalendar events={receptionistEvents} />
          </div>
        </div>
      </div>
    );
  };

  const renderRegisterPatient = () => {
    return (
      <div className="max-w-2xl bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#3D2010] mb-4">Register New Patient</h2>
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">First Name</label>
              <input
                type="text"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={patientForm.firstName}
                onChange={e => setPatientForm({ ...patientForm, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Last Name</label>
              <input
                type="text"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={patientForm.lastName}
                onChange={e => setPatientForm({ ...patientForm, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="+919900000000"
              className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              value={patientForm.phoneNumber}
              onChange={e => setPatientForm({ ...patientForm, phoneNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Gender</label>
              <select
                className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={patientForm.gender}
                onChange={e => setPatientForm({ ...patientForm, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Blood Group</label>
              <select
                className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={patientForm.bloodGroup}
                onChange={e => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
              >
                <option value="A_POSITIVE">A+</option>
                <option value="A_NEGATIVE">A-</option>
                <option value="B_POSITIVE">B+</option>
                <option value="B_NEGATIVE">B-</option>
                <option value="AB_POSITIVE">AB+</option>
                <option value="AB_NEGATIVE">AB-</option>
                <option value="O_POSITIVE">O+</option>
                <option value="O_NEGATIVE">O-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Date of Birth</label>
            <input
              type="date"
              className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              value={patientForm.dob}
              onChange={e => setPatientForm({ ...patientForm, dob: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Chronic Conditions (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. Asthma, Hypertension"
              className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              value={patientForm.chronicConditions}
              onChange={e => setPatientForm({ ...patientForm, chronicConditions: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white px-5 py-3 text-sm font-semibold transition-colors"
          >
            Register Patient
          </button>
        </form>
      </div>
    );
  };

  const renderBookAppointment = () => {
    const isPatientVerified = searchStatus === "found" || searchStatus === "not_found";
    const filteredDoctors = selectedSpecialty 
      ? doctors.filter(doc => doc.specialization === selectedSpecialty)
      : [];

    return (
      <div className="max-w-2xl bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#3D2010] mb-4">Book Patient Appointment</h2>
        
        {/* Step 1: Patient Search & verification */}
        <div className="mb-6 p-4 rounded-xl bg-[#FFF9F6] border border-[#F3EAE5] space-y-4">
          <h3 className="text-sm font-bold text-[#3D2010] uppercase tracking-wider mb-2 font-sans">1. Verify / Find Patient</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#554238] mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +919876543210"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2 text-sm focus:border-[#D97757] focus:outline-none"
                value={searchPhone}
                onChange={e => {
                  setSearchPhone(e.target.value);
                  if (searchStatus !== "idle") handleClearPatientSearch();
                }}
                disabled={searchStatus === "searching"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#554238] mb-1">Email Address</label>
              <input
                type="email"
                placeholder="patient@example.com"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2 text-sm focus:border-[#D97757] focus:outline-none"
                value={searchEmail}
                onChange={e => {
                  setSearchEmail(e.target.value);
                  if (searchStatus !== "idle") handleClearPatientSearch();
                }}
                disabled={searchStatus === "searching"}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLookupPatient}
              disabled={searchStatus === "searching" || (!searchPhone && !searchEmail)}
              className="px-4 py-2 rounded-lg bg-[#3D2010] hover:bg-[#D97757] text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {searchStatus === "searching" ? "Searching..." : "Verify / Search"}
            </button>
            {isPatientVerified && (
              <button
                type="button"
                onClick={handleClearPatientSearch}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>

          {searchStatus === "found" && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
              ✓ Existing Patient Found: <strong className="underline">{newPatientForm.firstName} {newPatientForm.lastName}</strong> (Date of Birth: {formatDate(newPatientForm.dob)})
            </div>
          )}

          {searchStatus === "not_found" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium">
                ⚠ New Patient Account. Please enter their name and date of birth below to register them alongside the appointment.
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">First Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-[#E3D4CC] px-3 py-2 text-xs focus:border-[#D97757] focus:outline-none text-gray-800"
                    value={newPatientForm.firstName}
                    onChange={e => setNewPatientForm({ ...newPatientForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Last Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-[#E3D4CC] px-3 py-2 text-xs focus:border-[#D97757] focus:outline-none text-gray-800"
                    value={newPatientForm.lastName}
                    onChange={e => setNewPatientForm({ ...newPatientForm, lastName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-[#E3D4CC] px-3 py-2 text-xs focus:border-[#D97757] focus:outline-none text-gray-800"
                    value={newPatientForm.dob}
                    onChange={e => setNewPatientForm({ ...newPatientForm, dob: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Appointment Details */}
        <form onSubmit={handleBookAppointment} className={`space-y-4 ${!isPatientVerified ? "opacity-40 pointer-events-none" : ""}`}>
          <h3 className="text-sm font-bold text-[#3D2010] uppercase tracking-wider mb-2 font-sans">2. Appointment Information</h3>
          
          <div>
            <AutocompleteSelect
              label="Select Doctor Type"
              value={selectedSpecialty}
              onChange={(val) => {
                setSelectedSpecialty(val);
                setBookingForm({ ...bookingForm, doctorId: "" });
              }}
              options={specialties.map(spec => ({
                id: spec,
                name: spec
              }))}
              placeholder="Type to search specialty (e.g. Cardiology, Orthopedics)..."
              required={isPatientVerified}
            />
          </div>

          <div>
            <AutocompleteSelect
              label="Select Doctor"
              value={bookingForm.doctorId}
              onChange={(val) => setBookingForm({ ...bookingForm, doctorId: val })}
              options={filteredDoctors.map(d => ({
                id: d.doctorId,
                name: `Dr. ${fullName(d.user)} (${d.specialization})`
              }))}
              placeholder={selectedSpecialty ? "Type to search clinician..." : "Please select specialty first"}
              required={isPatientVerified}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Visit Type</label>
              <select
                className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={bookingForm.visitType}
                onChange={e => setBookingForm({ ...bookingForm, visitType: e.target.value })}
              >
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Select Date</label>
              <input
                type="date"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={bookingDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setBookingDate(e.target.value)}
                required={isPatientVerified}
                disabled={!bookingForm.doctorId}
              />
            </div>
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
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Reason / Chief Complaint</label>
            <textarea
              className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              rows={3}
              placeholder="Primary symptoms or reason for scheduling..."
              value={bookingForm.reason}
              onChange={e => setBookingForm({ ...bookingForm, reason: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? "Booking..." : "Confirm & Book Appointment"}
          </button>
        </form>
      </div>
    );
  };

  const renderActiveView = () => {
    const views = {
      Dashboard: renderOverview(),
      "Register Patient": renderRegisterPatient(),
      "Book Appointment": renderBookAppointment(),
      Appointments: (
        <>
          <SectionHeader description="Full log of clinical encounters linked to your Hospital." />
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#EEDFD7] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#554238]">Consultation Date:</span>
              <input
                type="date"
                value={appointmentFilterDate}
                onChange={(e) => setAppointmentFilterDate(e.target.value)}
                className="rounded-xl border border-[#E3D4CC] px-4 py-2 text-sm text-[#3D2010] focus:border-[#D97757] focus:outline-none"
              />
            </div>
            <button
              onClick={() => setAppointmentFilterDate(new Date().toISOString().split("T")[0])}
              className="text-xs font-semibold text-[#D97757] hover:underline"
            >
              Reset to Today
            </button>
          </div>
          <DataTable
            rows={appointments.filter(a => a.scheduledTime && a.scheduledTime.split("T")[0] === appointmentFilterDate)}
            keyFor={(row) => row.encounterId}
            emptyMessage="No appointments scheduled."
            columns={[
              { label: "Token", render: (row) => <span className="font-bold text-[#D97757]">#{row.tokenNo || 1}</span> },
              { label: "Patient", render: (row) => fullName(row.patient?.user) },
              { label: "Doctor", render: (row) => `Dr. ${fullName(row.doctor?.user)}` },
              { label: "Visit", render: (row) => row.visitType },
              { label: "Scheduled", render: (row) => formatDate(row.scheduledTime, true) },
              { label: "Status", render: (row) => <StatusBadge value={row.status} /> },
              {
                label: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    {row.status === "SCHEDULED" && (
                      <button
                        onClick={() => handleUpdateStatus(row.encounterId, "IN_PROGRESS")}
                        className="rounded-lg bg-[#3D2010] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#D97757]"
                      >
                        Check In
                      </button>
                    )}
                    {row.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleUpdateStatus(row.encounterId, "COMPLETED")}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Complete
                      </button>
                    )}
                    {row.status !== "CANCELLED" && row.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleUpdateStatus(row.encounterId, "CANCELLED")}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </>
      ),
      Patients: (
        <>
          <SectionHeader description="Complete registry of patient identities." />
          <DataTable
            rows={patients}
            keyFor={(row) => row.patientId}
            emptyMessage="No patients registered yet."
            columns={[
              { label: "Name", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.user)}</span> },
              { label: "Phone", render: (row) => row.user?.phoneNumber || "—" },
              { label: "Gender", render: (row) => row.gender || "—" },
              { label: "DOB", render: (row) => formatDate(row.dob) },
              { label: "Blood Group", render: (row) => row.bloodGroup || "—" },
              { label: "Chronic Conditions", render: (row) => row.chronicConditions?.join(", ") || "None" },
              {
                label: "Actions",
                render: (row) => (
                  <button
                    onClick={() => handleOpenPrescriptionsModal(row)}
                    className="rounded-lg bg-[#3D2010] hover:bg-[#D97757] px-2.5 py-1 text-xs font-semibold text-white transition-colors"
                  >
                    View Prescriptions
                  </button>
                )
              }
            ]}
          />
        </>
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
          <button aria-label="Open navigation" className="rounded-lg p-2 text-[#6B554A] hover:bg-[#FFF4EC] lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1.5 block h-0.5 w-5 bg-current" />
            <span className="mt-1.5 block h-0.5 w-5 bg-current" />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-[#9C8276]">Front Desk Operations</p>
            <p className="text-sm font-bold text-[#3D2010]">{hospitalName}</p>
          </div>
          <div className="relative flex items-center gap-3">
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 focus:outline-none hover:opacity-90 text-left"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#3D2010]">{receptionistName}</p>
                <p className="text-xs text-[#9C8276]">Receptionist</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0CDBB] bg-[#FFF1E8] text-sm font-bold text-[#D97757]">
                {receptionistName.charAt(0)}
              </div>
            </button>

            {isProfileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#EEDFD7] bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-[#F3EAE5] mb-1">
                    <p className="text-xs text-[#9C8276] font-medium font-sans">Logged in as</p>
                    <p className="text-sm font-bold text-[#3D2010]">{receptionistName}</p>
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
                    {receptionistName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#3D2010]">{receptionistName}</h3>
                    <p className="text-xs text-[#9C8276] font-medium font-sans">Receptionist Account</p>
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
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Hospital Affiliation</p>
                    <p className="text-sm font-medium text-[#3D2010]">{hospitalName}</p>
                  </div>
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

      {isPrescriptionModalOpen && selectedPatientForPrescriptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsPrescriptionModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-[#3D2010] mb-2 font-sans">
              Patient Prescriptions
            </h2>
            <p className="text-xs text-[#8B7469] mb-6 font-medium">
              Registered Patient: <strong className="text-[#3D2010]">{fullName(selectedPatientForPrescriptions.user)}</strong> (DOB: {formatDate(selectedPatientForPrescriptions.dob)})
            </p>

            {loadingPrescriptions ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F3DED2] border-t-[#D97757] mb-3" />
                <span className="text-sm text-[#8B7469] font-medium font-sans">Retrieving prescription records...</span>
              </div>
            ) : patientPrescriptions.length === 0 ? (
              <div className="text-center py-12 text-[#9C8276] font-medium text-sm border border-dashed border-[#EEDFD7] rounded-2xl">
                No clinical prescriptions issued for this patient.
              </div>
            ) : (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {patientPrescriptions.map((p) => {
                  const doctorUser = p.encounter?.doctor?.user || p.doctor?.user;
                  const docName = doctorUser ? fullName(doctorUser) : "Clinician";
                  const diag = p.encounter?.diagnosis || p.diagnosis || "Consultation Diagnosis";
                  const meds = p.prescriptionMedicines || p.medicines || [];

                  return (
                    <div key={p.prescriptionId} className="p-4 rounded-2xl border border-[#EEDFD7] bg-[#FFFBF9] flex flex-col gap-3">
                      <div className="flex justify-between items-start border-b border-[#F3EAE5] pb-2">
                        <div>
                          <h4 className="font-bold text-[#3D2010] text-sm">Dr. {docName}</h4>
                          <p className="text-[10px] font-bold text-[#8B7469] uppercase tracking-wider">{p.encounter?.doctor?.specialization || "General Medicine"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-[#3D2010]">{formatDate(p.createdAt)}</p>
                          <p className="text-[10px] text-[#9C8276]">ID: {p.prescriptionId.slice(0, 8)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-[10px] font-bold text-[#8B7469] uppercase tracking-wider block mb-0.5">Indication / Diagnosis</span>
                        <p className="text-xs text-[#3D2010] font-medium">{diag}</p>
                      </div>

                      {meds.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-[#8B7469] uppercase tracking-wider block mb-1">Medications ({meds.length})</span>
                          <div className="bg-white rounded-lg border border-[#F3EAE5] overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-[#FFF4EC] border-b border-[#F3EAE5] text-[10px] font-bold text-[#8B7469] uppercase tracking-wider">
                                  <th className="p-1.5 pl-3">Medicine</th>
                                  <th className="p-1.5">Dosage</th>
                                  <th className="p-1.5">Frequency</th>
                                  <th className="p-1.5 pr-3 text-right">Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {meds.map((m, idx) => (
                                  <tr key={idx} className="border-b border-[#F3EAE5] last:border-none">
                                    <td className="p-1.5 pl-3 font-semibold text-[#3D2010]">{m.medicine?.name || m.name || "Medicine"}</td>
                                    <td className="p-1.5">{m.dosage || "—"}</td>
                                    <td className="p-1.5">{m.frequency || "—"}</td>
                                    <td className="p-1.5 pr-3 text-right">{m.durationDays || "—"} days</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadPDF(p, selectedPatientForPrescriptions)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3D2010] hover:bg-[#D97757] text-white text-xs font-bold transition-colors font-sans"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Print / Save PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t border-[#F3EAE5] mt-6">
              <button
                type="button"
                onClick={() => setIsPrescriptionModalOpen(false)}
                className="px-6 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 font-sans"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
