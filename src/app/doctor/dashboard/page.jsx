"use client";

import React from "react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

// Medicine Search Component
function MedicineSearchInput({ value, onChange, placeholder, apiBaseUrl }) {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (!searchText || searchText.length < 2 || !isOpen) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("doctorToken");
    const delayDebounce = setTimeout(() => {
      fetch(`${apiBaseUrl}/medicines?name=${encodeURIComponent(searchText)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(res => {
          setSuggestions(res.data || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText, isOpen, apiBaseUrl]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#E3D4CC] px-3 py-2 text-xs focus:border-[#D97757] focus:outline-none"
        value={searchText}
        onChange={(e) => { setSearchText(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-[#E3D4CC] bg-white shadow-lg">
          {loading && <div className="px-4 py-2 text-xs text-[#9C8276] animate-pulse">Searching catalog...</div>}
          {!loading && suggestions.length === 0 && searchText.length >= 2 && (
            <div className="px-4 py-2 text-xs text-red-500">No matching medicines found</div>
          )}
          {suggestions.map((m) => (
            <button
              key={m.medicineId}
              type="button"
              onClick={() => {
                onChange(m.medicineId);
                setSearchText(m.name);
                setIsOpen(false);
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
          className="fixed inset-0 -z-10 bg-transparent cursor-default"
        />
      )}
    </div>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      // 1. Profile Info (cached)
      const cachedProfile = getCachedItem("doctor_cached_profile");
      let currentProfile = cachedProfile;
      if (!currentProfile) {
        const profileRes = await fetch(`${apiBaseUrl}/users/myinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          currentProfile = profileData.data;
          setCachedItem("doctor_cached_profile", currentProfile);
        }
      }
      setProfile(currentProfile);

      const docId = currentProfile?.doctor?.doctorId;

      // 2. Encounters (dynamic)
      const encountersRes = await fetch(`${apiBaseUrl}/encounters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (encountersRes.ok) {
        const encountersData = await encountersRes.json();
        const filtered = Array.isArray(encountersData) 
          ? (docId ? encountersData.filter(e => e.doctorId === docId) : encountersData)
          : [];
        setAppointments(filtered);
      }

      // 3. Patients (dynamic)
      const patientsRes = await fetch(`${apiBaseUrl}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      }

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

      // 5. Prescriptions (dynamic)
      const prescriptionsRes = await fetch(`${apiBaseUrl}/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (prescriptionsRes.ok) {
        const prescData = await prescriptionsRes.json();
        setPrescriptions(Array.isArray(prescData) ? prescData : []);
      }

    } catch (requestError) {
      setError(requestError.message || "Failed to load clinical portal data");
    } finally {
      setLoading(false);
    }
  }, [logout]);

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
      setPrescriptionMeta({
        encounterId: "",
        symptoms: "",
        diagnosisText: "",
        severity: "MILD",
        nextVisit: "",
      });
      setPrescriptionMedicines([{ medicineId: "", dosage: "", times: { morning: false, afternoon: false, night: false }, durationDays: 5 }]);
      setEditingPrescription(null);
      setIsPrescriptionFormOpen(false);
      if (managingPatient) {
        // Return to patient list
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
          <MetricCard label="Total Prescriptions Issued" value={prescriptions.length} detail="Recorded clinical catalog" tone="green" />
        </div>

        <div>
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
      </div>
    );
  };

  const renderPrescribe = () => {
    return (
      <div className="bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm max-w-4xl">
        <h2 className="text-xl font-bold text-[#3D2010] mb-4">
          {editingPrescription ? `Edit Prescription Sheet` : "New Prescription Sheet"}
        </h2>
        <form onSubmit={handlePrescribe} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <AutocompleteSelect
                label="Select Appointment / Patient"
                value={prescriptionMeta.encounterId}
                onChange={(val) => setPrescriptionMeta({ ...prescriptionMeta, encounterId: val })}
                options={(editingPrescription 
                  ? [editingPrescription.encounter, ...activeEncounters.filter(e => e.encounterId !== editingPrescription.encounterId)].filter(Boolean)
                  : activeEncounters
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
        <form onSubmit={handleRecordVital} className="space-y-4">
          <div>
            <AutocompleteSelect
              label="Select Appointment / Patient"
              value={vitalForm.encounterId}
              onChange={(val) => setVitalForm({ ...vitalForm, encounterId: val })}
              options={activeEncounters.map(enc => ({
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
    const patientPrescs = prescriptions.filter(p => p.encounter?.patientId === managingPatient.patientId);
    
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
                { label: "Doctor", render: (row) => row.encounter?.doctor?.name || "Consultant" },
                { label: "Diagnosis Summary", render: (row) => row.encounter?.diagnoses?.[0]?.diagnosisText || row.encounter?.diagnosis || "—" },
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
          <SectionHeader title="Patient Consultation Queue" description="Log of scheduled checkups assigned to Dr. name." />
          <DataTable
            rows={appointments}
            keyFor={(row) => row.encounterId}
            emptyMessage="No appointments scheduled."
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
          <SectionHeader title="Clinical Patients Registry" description="View details of registered patients in your scope." />
          <DataTable
            rows={patients}
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
        <button onClick={() => { setActiveNav("Dashboard"); setManagingPatient(null); setIsPrescriptionFormOpen(false); }} className="flex h-[74px] items-center border-b border-[#EEDFD7] px-6 text-left">
          <Image src="/logo.png" alt="VitaData Solutions" width={112} height={56} className="h-12 w-auto object-contain object-left" priority />
        </button>
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
          <button aria-label="Open navigation" className="rounded-lg p-2 text-[#6B554A] hover:bg-[#FFF4EC] lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <span className="block h-0.5 w-5 bg-current" />
            <span className="mt-1.5 block h-0.5 w-5 bg-current" />
            <span className="mt-1.5 block h-0.5 w-5 bg-current" />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-[#9C8276]">Clinical Workspace</p>
            <p className="text-sm font-bold text-[#3D2010]">{docSpecialization}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#3D2010]">Dr. {doctorName}</p>
              <p className="text-xs text-[#9C8276]">{docSpecialization}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0CDBB] bg-[#FFF1E8] text-sm font-bold text-[#D97757]">
              {doctorName.charAt(0)}
            </div>
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
    </div>
  );
}
