"use client";

import React from "react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardCalendar from "@/components/DashboardCalendar";

const navItems = [
  "Dashboard",
  "Appointments Queue",
  "Prescribe Medication",
  "Record Vitals",
  "Patients Registry",
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
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
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

function DataTable({ columns, rows, keyFor, emptyMessage, filterSlot }) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full">
          {filterSlot}
        </div>
        <div className="relative w-full sm:max-w-xs shrink-0">
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

function AutocompleteSelect({ label, value, onChange, options, placeholder, required, disabled }) {
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
        disabled={disabled}
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
        className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
        <p className="mt-4 text-sm font-medium text-[#8B7469]">Loading clinical workspace…</p>
      </div>
    </div>
  );
}

function getDoctorIdentity(profile) {
  return {
    doctorId: profile?.doctor?.doctorId || null,
    userId: profile?.user?.userId || null,
  };
}

function isCurrentDoctorEncounter(encounter, doctorIdentity) {
  if (!encounter || !doctorIdentity.doctorId) return false;
  return encounter.doctorId === doctorIdentity.doctorId;
}

function isCurrentDoctorPrescription(prescription, doctorIdentity) {
  if (!prescription || !doctorIdentity.doctorId) return false;
  return prescription.encounter?.doctorId === doctorIdentity.doctorId;
}

function uniquePatientsFromEncounters(encounters) {
  const seen = new Set();
  return encounters.reduce((list, encounter) => {
    const patient = encounter?.patient;
    if (!patient?.patientId || seen.has(patient.patientId)) return list;
    seen.add(patient.patientId);
    list.push(patient);
    return list;
  }, []);
}

// Medicine Search Component
function MedicineSearchInput({ value, onChange, placeholder, apiBaseUrl }) {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userHasTyped, setUserHasTyped] = useState(false);

  // Initialize display text if value is already set
  useEffect(() => {
    if (!value) {
      setSearchText("");
      return;
    }
    const token = localStorage.getItem("doctorToken");
    fetch(`${apiBaseUrl}/medicines/${value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        if (res.data?.name) setSearchText(res.data.name);
      })
      .catch(() => {});
  }, [value, apiBaseUrl]);

  // Live Query filter search
  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("doctorToken");
    const delayDebounce = setTimeout(() => {
      const url = (userHasTyped && searchText.trim())
        ? `${apiBaseUrl}/medicines?name=${encodeURIComponent(searchText.trim())}`
        : `${apiBaseUrl}/medicines`;
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(res => {
          setSuggestions(res.data || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, (userHasTyped && searchText.trim()) ? 300 : 0);

    return () => clearTimeout(delayDebounce);
  }, [searchText, isOpen, apiBaseUrl, userHasTyped]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#E3D4CC] px-3 py-2 text-xs focus:border-[#D97757] focus:outline-none"
        value={searchText}
        onChange={(e) => { 
          setSearchText(e.target.value); 
          setIsOpen(true);
          setUserHasTyped(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setUserHasTyped(false);
        }}
      />
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#E3D4CC] bg-white shadow-lg">
          {loading && <div className="px-4 py-2 text-xs text-[#9C8276] animate-pulse">Searching catalog...</div>}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-2 text-xs text-red-500">No matching medicines found</div>
          )}
          {!loading && suggestions.map((m) => (
            <button
              key={m.medicineId}
              type="button"
              onClick={() => {
                onChange(m.medicineId);
                setSearchText(m.name);
                setIsOpen(false);
                setUserHasTyped(false);
              }}
              className="w-full px-4 py-2 text-left text-xs text-[#554238] hover:bg-[#FFF4EC] transition-colors border-b border-[#F3EAE5] last:border-b-0"
            >
              <div className="font-semibold">{m.name}</div>
              <div className="text-[10px] text-[#8B7469]">{m.manufacturer} • {m.type}</div>
            </button>
          ))}
        </div>
      )}
      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-transparent cursor-default"
        />
      )}
    </div>
  );
}

// Lab Test Autocomplete Search Component
function LabTestSearchInput({ value, onChange, placeholder, labTests }) {
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [userHasTyped, setUserHasTyped] = useState(false);

  // Sync display text when value or labTests change
  useEffect(() => {
    if (!value) {
      setSearchText("");
      return;
    }
    const found = labTests.find(t => t.labTestId === value);
    if (found) {
      setSearchText(found.testName || "");
    }
  }, [value, labTests]);

  const filteredSuggestions = React.useMemo(() => {
    if (!isOpen) return [];
    if (!userHasTyped || !searchText.trim()) return labTests; // Show all if empty
    const query = searchText.toLowerCase();
    return labTests.filter(t => 
      (t.testName || "").toLowerCase().includes(query) ||
      (t.department || "").toLowerCase().includes(query) ||
      (t.shortCode || "").toLowerCase().includes(query)
    );
  }, [searchText, labTests, isOpen, userHasTyped]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#C7D9F8] px-3 py-2 text-xs focus:border-[#4B7BF5] focus:outline-none"
        value={searchText}
        onChange={(e) => { 
          setSearchText(e.target.value); 
          setIsOpen(true); 
          setUserHasTyped(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setUserHasTyped(false);
        }}
      />
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#C7D9F8] bg-white shadow-lg">
          {filteredSuggestions.length === 0 && (
            <div className="px-4 py-2 text-xs text-red-500">No matching lab tests found</div>
          )}
          {filteredSuggestions.map((t) => (
            <button
              key={t.labTestId}
              type="button"
              onClick={() => {
                onChange(t.labTestId);
                setSearchText(t.testName);
                setIsOpen(false);
                setUserHasTyped(false);
              }}
              className="w-full px-4 py-2 text-left text-xs text-[#554238] hover:bg-[#EEF4FF] transition-colors border-b border-[#F3EAE5] last:border-b-0"
            >
              <div className="font-semibold">{t.testName}</div>
              <div className="text-[10px] text-[#8B7469]">
                {t.department || "General"} • Normal: {t.normalRange || "Not specified"} {t.unit ? `(${t.unit})` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-transparent cursor-default"
        />
      )}
    </div>
  );
}

export default function DoctorDashboard() {
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
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [vitalTypes, setVitalTypes] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [queueDate, setQueueDate] = useState(new Date().toISOString().split("T")[0]);
  const [queueHospitalId, setQueueHospitalId] = useState("");

  // Profile & Modal States
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    phoneNumber: "",
    emergencyContact: "",
    isAvailable: true,
    consultationFee: "",
  });

  useEffect(() => {
    if (profile) {
      setEditProfileForm({
        phoneNumber: profile.phoneNumber || "",
        emergencyContact: profile.emergencyContact || "",
        isAvailable: profile.doctor?.isAvailable !== false,
        consultationFee: profile.doctor?.consultationFee || "500",
      });
    }
  }, [profile]);

  // Sub-Navigation / Modal States
  const [managingPatient, setManagingPatient] = useState(null);
  const [isPrescriptionFormOpen, setIsPrescriptionFormOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);

  // Form States - Vitals
  const [vitalForm, setVitalForm] = useState({
    encounterId: "",
    vitalTypeId: "",
    value: "",
    source: "MANUAL",
  });

  // Form States - Prescriptions
  const [prescriptionMeta, setPrescriptionMeta] = useState({
    encounterId: "",
    symptoms: "",
    diagnosisText: "",
    severity: "MILD",
    nextVisit: "",
  });
  
  const [prescriptionMedicines, setPrescriptionMedicines] = useState([
    { medicineId: "", dosage: "", times: { morning: false, afternoon: false, night: false }, durationDays: 5 }
  ]);

  // Lab Tests
  const [labTests, setLabTests] = useState([]);
  const [suggestedLabTests, setSuggestedLabTests] = useState([]);

  const doctorIdentity = React.useMemo(() => getDoctorIdentity(profile), [profile]);
  const scopedPatients = React.useMemo(
    () => {
      const doctorEncounters = appointments.filter((encounter) => isCurrentDoctorEncounter(encounter, doctorIdentity));
      const doctorPatients = uniquePatientsFromEncounters(doctorEncounters);
      const visiblePatientIds = new Set(doctorPatients.map((patient) => patient.patientId));
      return patients.filter((patient) => visiblePatientIds.has(patient.patientId));
    },
    [appointments, doctorIdentity, patients],
  );
  const scopedPrescriptions = React.useMemo(
    () => prescriptions.filter((prescription) => isCurrentDoctorPrescription(prescription, doctorIdentity)),
    [prescriptions, doctorIdentity],
  );

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("doctorToken");
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
    const token = localStorage.getItem("doctorToken");
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

  const doctorEvents = useMemo(() => {
    return appointments.map(a => ({
      date: a.scheduledTime ? a.scheduledTime.split("T")[0] : "",
      type: a.visitType || "Consultation",
      title: `Consultation: ${fullName(a.patient?.user)}`,
      time: formatDate(a.scheduledTime, true).split(" - ")[1] || formatDate(a.scheduledTime, true),
      details: `Reason: ${a.reason || "General checkup"} (${a.status})`
    })).filter(e => e.date);
  }, [appointments]);

  const doctorHospitals = useMemo(() => {
    const list = [];
    const seen = new Set();
    appointments.forEach(a => {
      if (a.hospital && !seen.has(a.hospitalId)) {
        seen.add(a.hospitalId);
        list.push(a.hospital);
      }
    });
    return list;
  }, [appointments]);

  useEffect(() => {
    if (doctorHospitals.length > 0 && !queueHospitalId) {
      setQueueHospitalId(doctorHospitals[0].hospitalId);
    }
  }, [doctorHospitals, queueHospitalId]);

  const filteredQueue = useMemo(() => {
    return appointments.filter(a => {
      const apptDate = a.scheduledTime ? a.scheduledTime.split("T")[0] : "";
      const dateMatch = apptDate === queueDate;
      const hospitalMatch = !queueHospitalId || a.hospitalId === queueHospitalId;
      return dateMatch && hospitalMatch;
    });
  }, [appointments, queueDate, queueHospitalId]);

  const filteredActiveEncounters = useMemo(() => {
    return appointments.filter(enc => enc.status === "SCHEDULED" || enc.status === "IN_PROGRESS").filter(a => {
      const apptDate = a.scheduledTime ? a.scheduledTime.split("T")[0] : "";
      const dateMatch = apptDate === queueDate;
      const hospitalMatch = !queueHospitalId || a.hospitalId === queueHospitalId;
      return dateMatch && hospitalMatch;
    });
  }, [appointments, queueDate, queueHospitalId]);

  const logout = useCallback(() => {
    localStorage.removeItem("doctorToken");
    localStorage.removeItem("doctorRoles");
    localStorage.removeItem("doctorUser");
    localStorage.removeItem("doctor_cached_profile");
    localStorage.removeItem("doctor_cached_vital_types");
    document.cookie = "doctor_token=; path=/; max-age=0; samesite=lax";
    router.replace("/doctor-login");
  }, [router]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("doctorToken");
    if (!token || !apiBaseUrl) {
      logout();
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. Profile Info (always fresh to fetch hospitals list)
      const profileRes = await fetch(`${apiBaseUrl}/users/myinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.status === 401) { logout(); return; }
      let currentProfile = null;
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        currentProfile = profileData.data;
      }
      setProfile(currentProfile);

      const firstHospitalId = currentProfile?.doctor?.hospitals?.[0]?.hospital?.hospitalId;
      if (firstHospitalId) {
        setQueueHospitalId(prev => prev || firstHospitalId);
      }

      const docId = currentProfile?.doctor?.doctorId;

      // Fetch the rest of the data in parallel
      await Promise.all([
        (async () => {
          // 2. Encounters (dynamic)
          const encountersUrl = docId ? `${apiBaseUrl}/encounters?doctorId=${encodeURIComponent(docId)}` : `${apiBaseUrl}/encounters`;
          const encountersRes = await fetch(encountersUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (encountersRes.ok) {
            const encountersData = await encountersRes.json();
            setAppointments(Array.isArray(encountersData) ? encountersData : []);
          }
        })(),

        (async () => {
          // 3. Patients (dynamic)
          const patientsRes = await fetch(`${apiBaseUrl}/patients`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (patientsRes.ok) {
            const patientsData = await patientsRes.json();
            setPatients(Array.isArray(patientsData) ? patientsData : []);
          }
        })(),

        (async () => {
          // 4. Vital Types (cached)
          const cachedVitalTypes = getCachedItem("doctor_cached_vital_types");
          let currentVitalTypes = cachedVitalTypes || [];
          if (!cachedVitalTypes) {
            const vitalsRes = await fetch(`${apiBaseUrl}/vitals/types`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (vitalsRes.ok) {
              const vitalsData = await vitalsRes.json();
              currentVitalTypes = Array.isArray(vitalsData) ? vitalsData : [];
              setCachedItem("doctor_cached_vital_types", currentVitalTypes);
            }
          }
          setVitalTypes(currentVitalTypes);
        })(),

        (async () => {
          // 5. Prescriptions (dynamic)
          const prescriptionsRes = await fetch(`${apiBaseUrl}/prescriptions`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (prescriptionsRes.ok) {
            const prescData = await prescriptionsRes.json();
            setPrescriptions(Array.isArray(prescData) ? prescData : []);
          }
        })(),

        (async () => {
          // 6. Lab Tests (cached)
          const cachedLabTests = getCachedItem("doctor_cached_lab_tests");
          let currentLabTests = cachedLabTests || [];
          if (!cachedLabTests) {
            const labTestsRes = await fetch(`${apiBaseUrl}/lab-managers/lab-tests`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (labTestsRes.ok) {
              const labTestsData = await labTestsRes.json();
              currentLabTests = Array.isArray(labTestsData) ? labTestsData : [];
              setCachedItem("doctor_cached_lab_tests", currentLabTests);
            }
          }
          setLabTests(currentLabTests);
        })(),

        fetchNotifications()
      ]);
    } catch (requestError) {
      setError(requestError.message || "Failed to load clinical portal data");
    } finally {
      setLoading(false);
    }
  }, [logout, fetchNotifications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const token = localStorage.getItem("doctorToken");
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

  const doctorName = profile ? fullName(profile) : "Doctor";
  const docSpecialization = profile?.doctor?.specialization || "General Medicine";

  // Actions
  const handleUpdateStatus = async (encounterId, newStatus) => {
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("doctorToken");
    setSubmitting(true);

    // OPTIMISTIC LOCAL UPDATE
    const previousAppointments = appointments;
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update encounter status");
      }

      setSuccessMsg(`Encounter status updated to ${newStatus}`);
    } catch (err) {
      setAppointments(previousAppointments);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("doctorToken");
    if (!token || !apiBaseUrl) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${apiBaseUrl}/users/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: editProfileForm.phoneNumber,
          emergencyContact: editProfileForm.emergencyContact,
          isAvailable: editProfileForm.isAvailable,
          consultationFee: editProfileForm.consultationFee,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Profile updated successfully!");
        setIsEditProfileOpen(false);
        await loadData();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while updating profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("doctorToken");
    if (!token || !apiBaseUrl) return;

    setUploadingPhoto(true);
    setError("");
    setSuccessMsg("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBaseUrl}/users/uploadProfile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg("Profile image updated successfully!");
        await loadData();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during upload");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRecordVital = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("doctorToken");
    setSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/vitals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(vitalForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record vitals");

      setSuccessMsg("Vitals recorded successfully!");
      setVitalForm({
        encounterId: "",
        vitalTypeId: "",
        value: "",
        source: "MANUAL",
      });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMedicineRow = () => {
    setPrescriptionMedicines([...prescriptionMedicines, { medicineId: "", dosage: "", times: { morning: false, afternoon: false, night: false }, durationDays: 5 }]);
  };

  const handleRemoveMedicineRow = (index) => {
    setPrescriptionMedicines(prescriptionMedicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...prescriptionMedicines];
    if (field === "times") {
      updated[index].times = value;
    } else {
      updated[index][field] = field === "durationDays" ? Number(value) : value;
    }
    setPrescriptionMedicines(updated);
  };

  // Convert Morning, Afternoon, Night checkboxes to frequency string
  const getFrequencyString = (timesObj) => {
    const selected = [];
    if (timesObj.morning) selected.push("Morning");
    if (timesObj.afternoon) selected.push("Afternoon");
    if (timesObj.night) selected.push("Night");

    if (selected.length === 3) return "Thrice daily (Morning, Afternoon, Night)";
    if (selected.length === 2) return `Twice daily (${selected.join(", ")})`;
    if (selected.length === 1) return `Once daily (${selected[0]})`;
    return "Once daily (Morning)"; // default fallback
  };

  // Parse frequency string back to Morning, Afternoon, Night checkboxes
  const parseFrequencyString = (freqStr) => {
    const freq = String(freqStr || "").toLowerCase();
    const times = { morning: false, afternoon: false, night: false };
    if (freq.includes("morning")) times.morning = true;
    if (freq.includes("afternoon")) times.afternoon = true;
    if (freq.includes("night")) times.night = true;
    
    // Thrice/three default
    if (freq.includes("thrice") || freq.includes("three")) {
      times.morning = true;
      times.afternoon = true;
      times.night = true;
    }
    // Twice default if not specified
    if ((freq.includes("twice") || freq.includes("two")) && !times.morning && !times.afternoon && !times.night) {
      times.morning = true;
      times.night = true;
    }
    return times;
  };

  const handlePrescribe = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("doctorToken");
    setSubmitting(true);

    try {
      let prescriptionId = editingPrescription?.prescriptionId;
      let finalPrescriptionData = null;

      if (editingPrescription) {
        // 1. Edit existing prescription metadata
        const res = await fetch(`${apiBaseUrl}/prescriptions/${prescriptionId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nextVisit: prescriptionMeta.nextVisit || null,
            diagnosisText: prescriptionMeta.diagnosisText,
            symptoms: prescriptionMeta.symptoms,
            severity: prescriptionMeta.severity,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update prescription");
        finalPrescriptionData = data;

        // 2. Diff and update medications list
        const originalMedicines = editingPrescription.medicines || [];

        // Delete removed ones
        for (const orig of originalMedicines) {
          const isKept = prescriptionMedicines.some(m => m.prescriptionMedicineId === orig.prescriptionMedicineId);
          if (!isKept) {
            await fetch(`${apiBaseUrl}/prescriptions/${prescriptionId}/medications/${orig.prescriptionMedicineId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }

        // Add or update
        for (const med of prescriptionMedicines) {
          if (!med.medicineId) continue;
          const payload = {
            dosage: med.dosage,
            frequency: getFrequencyString(med.times),
            durationDays: med.durationDays,
          };

          if (med.prescriptionMedicineId) {
            // Update
            await fetch(`${apiBaseUrl}/prescriptions/${prescriptionId}/medications/${med.prescriptionMedicineId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            });
          } else {
            // Add new
            await fetch(`${apiBaseUrl}/prescriptions/${prescriptionId}/medications`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                prescriptionId,
                medicineId: med.medicineId,
                ...payload
              }),
            });
          }
        }
      } else {
        // 1. Create prescription meta
        const prescRes = await fetch(`${apiBaseUrl}/prescriptions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(prescriptionMeta),
        });

        const prescData = await prescRes.json();
        if (!prescRes.ok) throw new Error(prescData.message || "Failed to create prescription");

        prescriptionId = prescData.prescriptionId;
        finalPrescriptionData = prescData.data || prescData;

        // 2. Loop to add medicines
        for (const med of prescriptionMedicines) {
          if (!med.medicineId) continue;
          await fetch(`${apiBaseUrl}/prescriptions/${prescriptionId}/medications`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              prescriptionId,
              medicineId: med.medicineId,
              dosage: med.dosage,
              frequency: getFrequencyString(med.times),
              durationDays: med.durationDays,
            }),
          });
        }

        // 3. Submit suggested lab tests
        const encounterId = prescriptionMeta.encounterId;
        for (const lab of suggestedLabTests) {
          if (!lab.labTestId) continue;
          await fetch(`${apiBaseUrl}/lab-managers/lab-results`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              encounterId,
              labTestId: lab.labTestId,
              resultValue: null,
              isAbnormal: null,
              remarks: lab.notes || null,
            }),
          });
        }
      }

      // Re-fetch all prescriptions
      const prescriptionsRes = await fetch(`${apiBaseUrl}/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (prescriptionsRes.ok) {
        const prescData = await prescriptionsRes.json();
        setPrescriptions(Array.isArray(prescData) ? prescData : []);
      }

      setSuccessMsg(editingPrescription ? "Prescription updated successfully!" : "Prescription recorded successfully!");
      setPrescriptionMeta({ encounterId: "", symptoms: "", diagnosisText: "", severity: "MILD", nextVisit: "" });
      setPrescriptionMedicines([{ medicineId: "", dosage: "", times: { morning: false, afternoon: false, night: false }, durationDays: 5 }]);
      setSuggestedLabTests([]);
      setEditingPrescription(null);
      setIsPrescriptionFormOpen(false);
      if (managingPatient) {
        setActiveNav("Patients Registry");
      } else {
        setActiveNav("Dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditPrescription = (presc) => {
    setEditingPrescription(presc);
    const diag = presc.encounter?.diagnoses?.[0] || {};
    setPrescriptionMeta({
      encounterId: presc.encounterId,
      symptoms: diag.symptoms || "",
      diagnosisText: diag.diagnosisText || "",
      severity: diag.severity || "MILD",
      nextVisit: presc.nextVisit ? new Date(presc.nextVisit).toISOString().split("T")[0] : "",
    });
    setPrescriptionMedicines(
      presc.medicines.map(m => ({
        prescriptionMedicineId: m.prescriptionMedicineId,
        medicineId: m.medicineId,
        dosage: m.dosage,
        times: parseFrequencyString(m.frequency),
        durationDays: m.durationDays,
      }))
    );
    setIsPrescriptionFormOpen(true);
  };

  // Only show active encounters in prescribe forms
  const activeEncounters = appointments.filter(enc => enc.status === "SCHEDULED" || enc.status === "IN_PROGRESS");

  // Views
  const renderOverview = () => {
    const today = new Date().toDateString();
    const todayAppointments = appointments.filter(a => new Date(a.scheduledTime).toDateString() === today);
    const activeVisits = appointments.filter(a => a.status === "IN_PROGRESS");

    return (
      <div className="space-y-7">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Today's Appointments" value={todayAppointments.length} detail="Assigned scheduled cases" />
          <MetricCard label="Active Consultations" value={activeVisits.length} detail="In progress right now" tone="blue" />
          <MetricCard label="Total Prescriptions Issued" value={scopedPrescriptions.length} detail="Recorded clinical catalog" tone="green" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader title="Clinical Schedule" description="Today's patient consultation queue." />
            <DataTable
              rows={todayAppointments}
              keyFor={(row) => row.encounterId}
              emptyMessage="No consultation schedule recorded for today."
              columns={[
                { label: "Token", render: (row) => <span className="font-bold text-[#D97757]">#{row.tokenNo || 1}</span> },
                { label: "Patient", render: (row) => fullName(row.patient?.user) },
                { label: "Gender/DOB", render: (row) => `${row.patient?.gender || "—"}, ${formatDate(row.patient?.dob)}` },
                { label: "Scheduled", render: (row) => formatDate(row.scheduledTime, true) },
                { label: "Reason", render: (row) => row.reason || "General Checkup" },
                { label: "Status", render: (row) => <StatusBadge value={row.status} /> },
                {
                  label: "Consultation Actions",
                  render: (row) => (
                    <div className="flex gap-2">
                      {row.status === "SCHEDULED" && (
                        <button
                          onClick={() => handleUpdateStatus(row.encounterId, "IN_PROGRESS")}
                          className="rounded-lg bg-[#3D2010] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#D97757]"
                        >
                          Start Consultation
                        </button>
                      )}
                      {row.status === "IN_PROGRESS" && (
                        <button
                          onClick={() => handleUpdateStatus(row.encounterId, "COMPLETED")}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Complete Consultation
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div>
            <DashboardCalendar events={doctorEvents} />
          </div>
        </div>
      </div>
    );
  };

  const renderPrescribe = () => {
    return (
      <div className="bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm max-w-4xl">
        <h2 className="text-xl font-bold text-[#3D2010] mb-4">
          {editingPrescription ? `Edit Prescription Sheet` : "New Prescription Sheet"}
        </h2>

        {!editingPrescription && (
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl bg-[#FFF9F5] border border-[#EEDFD7]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Filter Date:</span>
              <input
                type="date"
                value={queueDate}
                onChange={e => setQueueDate(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Filter Hospital:</span>
              <select
                value={queueHospitalId}
                onChange={e => setQueueHospitalId(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-sm text-[#3D2010] outline-none focus:border-[#D97757] max-w-[200px]"
              >
                {doctorHospitals.map(h => (
                  <option key={h.hospitalId} value={h.hospitalId}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <form onSubmit={handlePrescribe} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AutocompleteSelect
                label="Select Appointment / Patient"
                value={prescriptionMeta.encounterId}
                onChange={(val) => {
                  const selectedEnc = appointments.find(e => e.encounterId === val);
                  setPrescriptionMeta({
                    ...prescriptionMeta,
                    encounterId: val,
                    symptoms: selectedEnc?.chiefComplaint || selectedEnc?.reason || "",
                    diagnosisText: selectedEnc?.diagnosis || selectedEnc?.reason || ""
                  });
                }}
                options={(editingPrescription 
                  ? [editingPrescription.encounter, ...filteredActiveEncounters.filter(e => e.encounterId !== editingPrescription.encounterId)].filter(Boolean)
                  : filteredActiveEncounters
                ).map(enc => ({
                  id: enc.encounterId,
                  name: `${fullName(enc.patient?.user)} - ${formatDate(enc.scheduledTime)} (${enc.status})`
                }))}
                placeholder="Type to search encounter..."
                required
                disabled={!!editingPrescription}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Severity</label>
              <select
                className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={prescriptionMeta.severity}
                onChange={e => setPrescriptionMeta({ ...prescriptionMeta, severity: e.target.value })}
              >
                <option value="MILD">Mild</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Chief Symptoms</label>
              <input
                type="text"
                placeholder="e.g. Fever, Sore throat, Cough"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={prescriptionMeta.symptoms}
                onChange={e => setPrescriptionMeta({ ...prescriptionMeta, symptoms: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Diagnosis Notes</label>
              <input
                type="text"
                placeholder="e.g. Viral Pharyngitis"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={prescriptionMeta.diagnosisText}
                onChange={e => setPrescriptionMeta({ ...prescriptionMeta, diagnosisText: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Next Follow-Up Date</label>
            <input
              type="date"
              className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              value={prescriptionMeta.nextVisit}
              onChange={e => setPrescriptionMeta({ ...prescriptionMeta, nextVisit: e.target.value })}
            />
          </div>

          {/* Medications Section */}
          <div className="border-t border-[#F3EAE5] pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-bold text-[#3D2010]">Prescribed Medicines</h3>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="rounded-lg bg-[#FFF1E8] border border-[#F2D7C8] px-3 py-1.5 text-xs font-semibold text-[#D97757] hover:bg-[#FFF4EC]"
              >
                + Add Medication
              </button>
            </div>

            <div className="space-y-4">
              {prescriptionMedicines.map((row, idx) => (
                <div key={idx} className="grid gap-3 sm:grid-cols-6 items-end bg-[#FFF9F5] p-3 rounded-xl border border-[#F2D7C8]">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#554238] mb-1">Search & Select Medicine</label>
                    <MedicineSearchInput
                      value={row.medicineId}
                      onChange={(val) => handleMedicineChange(idx, "medicineId", val)}
                      placeholder="Type to search medicine..."
                      apiBaseUrl={apiBaseUrl}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#554238] mb-1">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 tab"
                      className="w-full rounded-lg border border-[#E3D4CC] bg-white px-3 py-2 text-xs focus:border-[#D97757] focus:outline-none"
                      value={row.dosage}
                      onChange={e => handleMedicineChange(idx, "dosage", e.target.value)}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#554238] mb-1">Intake Timings (Checkboxes)</label>
                    <div className="flex gap-3 py-2">
                      <label className="flex items-center gap-1.5 text-xs text-[#554238] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.times.morning}
                          onChange={(e) => handleMedicineChange(idx, "times", { ...row.times, morning: e.target.checked })}
                          className="accent-[#D97757]"
                        />
                        Morning
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-[#554238] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.times.afternoon}
                          onChange={(e) => handleMedicineChange(idx, "times", { ...row.times, afternoon: e.target.checked })}
                          className="accent-[#D97757]"
                        />
                        Afternoon
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-[#554238] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.times.night}
                          onChange={(e) => handleMedicineChange(idx, "times", { ...row.times, night: e.target.checked })}
                          className="accent-[#D97757]"
                        />
                        Night
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-[#554238] mb-1">Days</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full rounded-lg border border-[#E3D4CC] bg-white px-3 py-2 text-xs focus:border-[#D97757] focus:outline-none"
                        value={row.durationDays}
                        onChange={e => handleMedicineChange(idx, "durationDays", e.target.value)}
                        required
                      />
                    </div>
                    {prescriptionMedicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(idx)}
                        className="mt-5 text-red-600 hover:text-red-800 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Lab Tests Section */}
          <div className="border-t border-[#F3EAE5] pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-md font-bold text-[#3D2010]">Suggested Lab Tests</h3>
                <p className="text-xs text-[#9C8276] mt-0.5">Optional — add tests you&apos;d like the patient to undergo</p>
              </div>
              <button
                type="button"
                onClick={() => setSuggestedLabTests([...suggestedLabTests, { labTestId: "", scheduledDate: "", notes: "" }])}
                className="rounded-lg bg-[#EEF4FF] border border-[#C7D9F8] px-3 py-1.5 text-xs font-semibold text-[#4B7BF5] hover:bg-[#E4EDFF]"
              >
                + Add Lab Test
              </button>
            </div>

            {suggestedLabTests.length === 0 && (
              <p className="text-xs text-[#B8A8A1] italic py-2">No lab tests suggested for this prescription.</p>
            )}

            <div className="space-y-3">
              {suggestedLabTests.map((lab, li) => (
                <div key={li} className="grid gap-3 sm:grid-cols-12 items-end bg-[#F5F8FF] p-3 rounded-xl border border-[#C7D9F8]">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-[#554238] mb-1">Lab Test</label>
                    <LabTestSearchInput
                      value={lab.labTestId}
                      onChange={val => {
                        const updated = [...suggestedLabTests];
                        updated[li] = { ...updated[li], labTestId: val };
                        setSuggestedLabTests(updated);
                      }}
                      placeholder="Type to search lab test..."
                      labTests={labTests}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-[#554238] mb-1">Suggested Date</label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-[#C7D9F8] bg-white px-3 py-2 text-xs focus:border-[#4B7BF5] focus:outline-none"
                      value={lab.scheduledDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={e => {
                        const updated = [...suggestedLabTests];
                        updated[li] = { ...updated[li], scheduledDate: e.target.value };
                        setSuggestedLabTests(updated);
                      }}
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-[#554238] mb-1">Pre-test Notes <span className="text-[#9C8276] font-normal">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Fasting required, no prior meds"
                      className="w-full rounded-lg border border-[#C7D9F8] bg-white px-3 py-2 text-xs focus:border-[#4B7BF5] focus:outline-none"
                      value={lab.notes}
                      onChange={e => {
                        const updated = [...suggestedLabTests];
                        updated[li] = { ...updated[li], notes: e.target.value };
                        setSuggestedLabTests(updated);
                      }}
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSuggestedLabTests(suggestedLabTests.filter((_, i) => i !== li))}
                      className="mt-4 text-red-500 hover:text-red-700 text-sm font-bold"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white px-5 py-3 text-sm font-semibold transition-colors"
            >
              {editingPrescription ? "Save Changes" : "Issue Prescription Sheet"}
            </button>
            {editingPrescription && (
              <button
                type="button"
                onClick={() => {
                  setEditingPrescription(null);
                  setIsPrescriptionFormOpen(false);
                  setPrescriptionMeta({ encounterId: "", symptoms: "", diagnosisText: "", severity: "MILD", nextVisit: "" });
                  setPrescriptionMedicines([{ medicineId: "", dosage: "", times: { morning: false, afternoon: false, night: false }, durationDays: 5 }]);
                }}
                className="rounded-xl border border-[#E3D4CC] px-5 py-3 text-sm font-semibold text-[#806B61] hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  };

  const renderRecordVitals = () => {
    return (
      <div className="bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm max-w-2xl">
        <h2 className="text-xl font-bold text-[#3D2010] mb-4">Record Patient Vitals</h2>

        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-xl bg-[#FFF9F5] border border-[#EEDFD7]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Filter Date:</span>
            <input
              type="date"
              value={queueDate}
              onChange={e => setQueueDate(e.target.value)}
              className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Filter Hospital:</span>
            <select
              value={queueHospitalId}
              onChange={e => setQueueHospitalId(e.target.value)}
              className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-sm text-[#3D2010] outline-none focus:border-[#D97757] max-w-[200px]"
            >
              {doctorHospitals.map(h => (
                <option key={h.hospitalId} value={h.hospitalId}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form onSubmit={handleRecordVital} className="space-y-4">
          <div>
            <AutocompleteSelect
              label="Select Appointment / Patient"
              value={vitalForm.encounterId}
              onChange={(val) => setVitalForm({ ...vitalForm, encounterId: val })}
              options={filteredActiveEncounters.map(enc => ({
                id: enc.encounterId,
                name: `${fullName(enc.patient?.user)} - ${formatDate(enc.scheduledTime)} (${enc.status})`
              }))}
              placeholder="Type to search encounter..."
              required
            />
          </div>

          <div>
            <AutocompleteSelect
              label="Select Vital Type"
              value={vitalForm.vitalTypeId}
              onChange={(val) => setVitalForm({ ...vitalForm, vitalTypeId: val })}
              options={vitalTypes.map(t => ({
                id: t.vitalTypeId,
                name: `${t.name} (${t.unit ? t.unit : "No unit"})`
              }))}
              placeholder="Type to search vital type..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Vital Value</label>
            <input
              type="text"
              placeholder="e.g. 120/80 (BP) or 72 (Heart Rate)"
              className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              value={vitalForm.value}
              onChange={e => setVitalForm({ ...vitalForm, value: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white px-5 py-3 text-sm font-semibold transition-colors"
          >
            Record Vital Value
          </button>
        </form>
      </div>
    );
  };

  const renderManagePrescriptions = () => {
    const patientPrescs = scopedPrescriptions.filter(p => p.encounter?.patientId === managingPatient.patientId);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setManagingPatient(null); setIsPrescriptionFormOpen(false); }}
            className="rounded-lg bg-[#FFF1E8] border border-[#F2D7C8] px-3 py-1.5 text-xs font-semibold text-[#D97757] hover:bg-[#FFF4EC]"
          >
            &larr; Back to Patients Registry
          </button>
          <h2 className="text-xl font-bold text-[#3D2010]">
            Manage Prescriptions: {fullName(managingPatient.user)}
          </h2>
        </div>

        {isPrescriptionFormOpen ? (
          renderPrescribe()
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-[#3D2010]">Prescription Catalog</h3>
              <button
                onClick={() => {
                  setEditingPrescription(null);
                  setPrescriptionMeta({
                    encounterId: "",
                    symptoms: "",
                    diagnosisText: "",
                    severity: "MILD",
                    nextVisit: "",
                  });
                  setPrescriptionMedicines([{ medicineId: "", dosage: "", times: { morning: false, afternoon: false, night: false }, durationDays: 5 }]);
                  setIsPrescriptionFormOpen(true);
                }}
                className="rounded-xl bg-[#3D2010] text-white px-4 py-2 text-xs font-semibold hover:bg-[#D97757]"
              >
                + New Prescription
              </button>
            </div>

            <DataTable
              rows={patientPrescs}
              keyFor={(row) => row.prescriptionId}
              emptyMessage="No prescription sheets registered for this patient."
              columns={[
                { label: "Date", render: (row) => formatDate(row.generatedAt || row.encounter?.scheduledTime) },
                { label: "Doctor", render: (row) => fullName(row.encounter?.doctor?.user) },
                { label: "Diagnosis Summary", render: (row) => row.encounter?.diagnoses?.[0]?.diagnosisText || row.encounter?.diagnosis || row.encounter?.reason || "—" },
                {
                  label: "Medications",
                  render: (row) => (
                    <div className="space-y-1 text-xs">
                      {row.medicines?.map((m, idx) => (
                        <div key={idx}>
                          • <span className="font-semibold">{m.medicine?.name || "Medicine"}</span> - {m.dosage} ({m.frequency}, {m.durationDays} days)
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  label: "Actions",
                  render: (row) => (
                    <button
                      onClick={() => openEditPrescription(row)}
                      className="rounded-lg bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 text-xs font-semibold hover:bg-blue-100"
                    >
                      Edit Prescription
                    </button>
                  ),
                },
              ]}
            />
          </>
        )}
      </div>
    );
  };

  const renderActiveView = () => {
    if (managingPatient) return renderManagePrescriptions();

    const views = {
      Dashboard: renderOverview(),
      "Appointments Queue": (
        <>
          <SectionHeader description="Log of scheduled checkups assigned to you." />
          
          <DataTable
            rows={filteredQueue}
            keyFor={(row) => row.encounterId}
            emptyMessage="No appointments scheduled."
            filterSlot={
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Date:</span>
                  <input
                    type="date"
                    value={queueDate}
                    onChange={e => setQueueDate(e.target.value)}
                    className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Hospital:</span>
                  <select
                    value={queueHospitalId}
                    onChange={e => setQueueHospitalId(e.target.value)}
                    className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-sm text-[#3D2010] outline-none focus:border-[#D97757] max-w-[200px]"
                  >
                    {doctorHospitals.map(h => (
                      <option key={h.hospitalId} value={h.hospitalId}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            }
            columns={[
              { label: "Token", render: (row) => <span className="font-bold text-[#D97757]">#{row.tokenNo || 1}</span> },
              { label: "Patient", render: (row) => fullName(row.patient?.user) },
              { label: "Scheduled", render: (row) => formatDate(row.scheduledTime, true) },
              { label: "Reason", render: (row) => row.reason || "General Checkup" },
              { label: "Visit", render: (row) => row.visitType },
              { label: "Status", render: (row) => <StatusBadge value={row.status} /> },
              {
                label: "Clinical Actions",
                render: (row) => {
                  const isScheduled = row.status === "SCHEDULED";
                  const isInProgress = row.status === "IN_PROGRESS";
                  const isApptToday = new Date(row.scheduledTime).toDateString() === new Date().toDateString();

                  return (
                    <div className="flex gap-2">
                      {isScheduled && isApptToday && (
                        <button
                          onClick={() => handleUpdateStatus(row.encounterId, "IN_PROGRESS")}
                          className="rounded-lg bg-[#3D2010] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#D97757]"
                        >
                          Start Consultation
                        </button>
                      )}
                      {isScheduled && !isApptToday && (
                        <span className="text-xs text-[#9C8276] font-medium italic">Today Only</span>
                      )}
                      {isInProgress && (
                        <button
                          onClick={() => handleUpdateStatus(row.encounterId, "COMPLETED")}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Complete Consultation
                        </button>
                      )}
                    </div>
                  );
                },
              },
            ]}
          />
        </>
      ),
      "Prescribe Medication": renderPrescribe(),
      "Record Vitals": renderRecordVitals(),
      "Patients Registry": (
        <>
          <SectionHeader description="View details of registered patients in your scope." />
          <DataTable
            rows={scopedPatients}
            keyFor={(row) => row.patientId}
            emptyMessage="No patients assigned."
            columns={[
              { label: "Name", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.user)}</span> },
              { label: "Contact Phone", render: (row) => row.user?.phoneNumber || "—" },
              { label: "Gender", render: (row) => row.gender || "—" },
              { label: "DOB", render: (row) => formatDate(row.dob) },
              { label: "Blood Group", render: (row) => row.bloodGroup || "—" },
              { label: "Chronic Conditions", render: (row) => row.chronicConditions?.join(", ") || "None" },
              {
                label: "Recorded Vitals",
                render: (row) => {
                  const patientEncounters = appointments.filter(enc => enc.patientId === row.patientId);
                  const allVitals = [];
                  patientEncounters.forEach(enc => {
                    if (enc.vitals && enc.vitals.length > 0) {
                      enc.vitals.forEach(v => {
                        allVitals.push({
                          name: v.name || v.vitalType?.name || 'Vital',
                          value: v.value,
                          unit: v.unit || v.vitalType?.unit || '',
                          recordedAt: new Date(v.recordedAt)
                        });
                      });
                    }
                  });

                  if (allVitals.length === 0) return <span className="text-[#8B7469] italic text-xs">No vitals</span>;

                  allVitals.sort((a, b) => b.recordedAt - a.recordedAt);

                  const seen = new Set();
                  const uniqueVitals = [];
                  for (const v of allVitals) {
                    if (!seen.has(v.name)) {
                      seen.add(v.name);
                      uniqueVitals.push(v);
                    }
                    if (uniqueVitals.length >= 3) break;
                  }

                  return (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {uniqueVitals.map((v, i) => (
                        <span key={i} className="inline-flex items-center rounded-lg bg-[#FFF1E8] border border-[#F2D7C8] px-2 py-0.5 text-[11px] font-semibold text-[#D97757]" title={`Recorded on ${formatDate(v.recordedAt, true)}`}>
                          {v.name}: {v.value} {v.unit}
                        </span>
                      ))}
                    </div>
                  );
                }
              },
              {
                label: "Management Actions",
                render: (row) => (
                  <button
                    onClick={() => { setManagingPatient(row); setIsPrescriptionFormOpen(false); }}
                    className="rounded-lg bg-[#FFF1E8] border border-[#F2D7C8] text-[#D97757] px-3 py-1.5 text-xs font-semibold hover:bg-[#FFF4EC]"
                  >
                    Manage Prescriptions
                  </button>
                ),
              },
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
          <button onClick={() => { setActiveNav("Dashboard"); setManagingPatient(null); setIsPrescriptionFormOpen(false); }} className="flex justify-center items-center w-full h-full px-4">
            <Image src="/logo.png" alt="VitaData Solutions" width={180} height={90} className="h-[60px] w-auto object-contain" priority />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  onClick={() => { setActiveNav(item); setIsSidebarOpen(false); setSuccessMsg(""); setManagingPatient(null); setIsPrescriptionFormOpen(false); }}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${activeNav === item && !managingPatient ? "bg-[#FFF1E8] text-[#D97757]" : "text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#3D2010]"}`}
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
              <p className="text-xs font-medium text-[#9C8276]">Clinical Workspace</p>
              <p className="text-sm font-bold text-[#3D2010]">{docSpecialization}</p>
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
                <p className="text-sm font-semibold text-[#3D2010]">Dr. {doctorName}</p>
                <p className="text-xs text-[#9C8276]">{docSpecialization}</p>
              </div>
              {profile?.profile ? (
                <img src={profile.profile} alt={doctorName} className="h-10 w-10 rounded-full border border-[#F0CDBB] object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0CDBB] bg-[#FFF1E8] text-sm font-bold text-[#D97757]">
                  {doctorName.charAt(0)}
                </div>
              )}
            </button>

            {isProfileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                <div className="profile-dropdown-menu absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#EEDFD7] bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-[#F3EAE5] mb-1">
                    <p className="text-xs text-[#9C8276] font-medium font-sans">Logged in as</p>
                    <p className="text-sm font-bold text-[#3D2010]">Dr. {doctorName}</p>
                  </div>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); setIsViewProfileOpen(true); }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#D97757] font-medium"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); setIsEditProfileOpen(true); }}
                    className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#D97757] font-medium"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); alert("Settings config: Theme & notifications preferences are set to auto-detect."); }}
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
                <h1 className="text-2xl font-bold tracking-tight text-[#2F1A10] md:text-3xl">
                  {managingPatient ? `Patients Registry / Manage Prescriptions` : activeNav}
                </h1>
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

      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F3EAE5] pb-3 mb-5">
              <h3 className="font-bold text-lg text-[#3D2010]">Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-sm font-bold text-[#806B61] hover:text-red-500">Close</button>
            </div>
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="relative">
                {profile?.profile ? (
                  <img src={profile.profile} alt="Avatar" className="h-20 w-20 rounded-full border-2 border-[#D97757] object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D97757] bg-[#FFF1E8] text-2xl font-bold text-[#D97757]">
                    {doctorName.charAt(0)}
                  </div>
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer rounded-lg bg-[#3D2010] hover:bg-[#D97757] px-3 py-1.5 text-xs font-semibold text-white transition-colors">
                Upload User Logo
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Blocked/Read-only Fields */}
              <div>
                <label className="block text-xs font-semibold text-[#8B7469] uppercase tracking-wider mb-1">Doctor ID (Verified)</label>
                <input type="text" value={profile?.doctor?.doctorId || ""} disabled className="w-full rounded-xl border border-[#F2D7C8] bg-[#FFF9F5] px-4 py-2 text-sm text-[#806B61] cursor-not-allowed" />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#8B7469] uppercase tracking-wider mb-1">Full Name (Verified)</label>
                  <input type="text" value={`Dr. ${doctorName}`} disabled className="w-full rounded-xl border border-[#F2D7C8] bg-[#FFF9F5] px-4 py-2 text-sm text-[#806B61] cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8B7469] uppercase tracking-wider mb-1">Specialization (Verified)</label>
                  <input type="text" value={profile?.doctor?.specialization || ""} disabled className="w-full rounded-xl border border-[#F2D7C8] bg-[#FFF9F5] px-4 py-2 text-sm text-[#806B61] cursor-not-allowed" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#554238] uppercase mb-1 font-sans">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editProfileForm.phoneNumber}
                    onChange={e => setEditProfileForm({ ...editProfileForm, phoneNumber: e.target.value })}
                    className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8B7469] uppercase tracking-wider mb-1 font-sans">Email Address (Verified)</label>
                  <input type="text" value={profile?.email || ""} disabled className="w-full rounded-xl border border-[#F2D7C8] bg-[#FFF9F5] px-4 py-2 text-sm text-[#806B61] cursor-not-allowed" />
                </div>
              </div>

              <hr className="border-[#F3EAE5]" />

              {/* Editable Fields */}
              <div>
                <label className="block text-xs font-semibold text-[#554238] uppercase mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={editProfileForm.emergencyContact}
                  onChange={e => setEditProfileForm({ ...editProfileForm, emergencyContact: e.target.value })}
                  className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                  placeholder="+91..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#554238] uppercase mb-1">Consultation Fee (INR)</label>
                  <input
                    type="number"
                    value={editProfileForm.consultationFee}
                    onChange={e => setEditProfileForm({ ...editProfileForm, consultationFee: e.target.value })}
                    className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#554238] uppercase mb-1">Availability Status</label>
                  <select
                    value={editProfileForm.isAvailable ? "true" : "false"}
                    onChange={e => setEditProfileForm({ ...editProfileForm, isAvailable: e.target.value === "true" })}
                    className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm text-[#3D2010] outline-none focus:border-[#D97757]"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="rounded-xl border border-[#E3D4CC] px-4 py-2 text-sm font-semibold text-[#806B61] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] px-4 py-2 text-sm font-semibold text-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {isViewProfileOpen && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/45 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto relative">
              <button 
                onClick={() => setIsViewProfileOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1.5 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <h2 className="text-xl font-bold text-[#3D2010] mb-6 font-sans">Doctor Profile</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-[#F3EAE5]">
                  {profile?.profile ? (
                    <img src={profile.profile} alt={doctorName} className="h-16 w-16 rounded-full border border-[#F0CDBB] object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#F0CDBB] bg-[#FFF1E8] text-2xl font-bold text-[#D97757]">
                      {doctorName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-[#3D2010]">Dr. {doctorName}</h3>
                    <p className="text-xs text-[#9C8276] font-medium font-sans">{profile?.doctor?.specialization || "Clinician"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Doctor ID</p>
                    <p className="text-sm font-medium text-[#3D2010]">{profile?.doctor?.doctorId || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Specialization</p>
                    <p className="text-sm font-medium text-[#3D2010]">{profile?.doctor?.specialization || "—"}</p>
                  </div>
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
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Consultation Fee</p>
                    <p className="text-sm font-semibold text-[#D97757]">
                      {profile?.doctor?.consultationFee ? `₹${profile.doctor.consultationFee}` : "—"}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Availability Status</p>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      profile?.doctor?.isAvailable 
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}>
                      {profile?.doctor?.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Hospital Affiliation(s)</p>
                    <p className="text-sm font-medium text-[#3D2010]">
                      {profile?.doctor?.hospitals?.length > 0
                        ? profile.doctor.hospitals.map(h => h.hospital?.name).filter(Boolean).join(", ")
                        : "VITADATA Solutions"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#F3EAE5] mt-6">
                  <button
                    type="button"
                    onClick={() => { setIsViewProfileOpen(false); setIsEditProfileOpen(true); }}
                    className="flex-1 py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm font-sans"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsViewProfileOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 font-sans"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
