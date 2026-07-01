"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  return (
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
            {rows.map((row, index) => (
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
      {rows.length === 0 && (
        <div className="px-6 py-14 text-center text-sm text-[#9C8276]">{emptyMessage}</div>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Data States
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
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

      // 2. Load Doctors (cached)
      const cachedDoctors = getCachedItem("receptionist_cached_doctors");
      let currentDoctors = cachedDoctors || [];
      if (!cachedDoctors) {
        const doctorsRes = await fetch(`${apiBaseUrl}/doctors`, {
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
      const patientsRes = await fetch(`${apiBaseUrl}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      }

      // 4. Load Appointments (dynamic)
      const appointmentsRes = await fetch(`${apiBaseUrl}/encounters`, {
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
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("receptionistToken");

    try {
      if (!hospitalId) throw new Error("Receptionist has no linked hospital");
      if (!bookingForm.patientId) throw new Error("Please select a patient");
      if (!bookingForm.doctorId) throw new Error("Please select a doctor");
      if (!bookingDate) throw new Error("Please select a date");
      if (!bookingSlot) throw new Error("Please select an available slot");

      const payload = {
        ...bookingForm,
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
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to book appointment");

      // OPTIMISTIC LOCAL STATE UPDATE
      const newAppt = data.data;
      if (newAppt) {
        setAppointments(prev => [newAppt, ...prev]);
      }

      setSuccessMsg("Appointment booked successfully!");
      setBookingForm({
        patientId: "",
        doctorId: "",
        visitType: "OPD",
        reason: "",
      });
      setBookingDate("");
      setBookingSlot("");
      setActiveNav("Appointments");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (encounterId, newStatus) => {
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("receptionistToken");

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

        <div>
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
    return (
      <div className="max-w-2xl bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#3D2010] mb-4">Book Patient Appointment</h2>
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Select Patient</label>
            <select
              className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              value={bookingForm.patientId}
              onChange={e => setBookingForm({ ...bookingForm, patientId: e.target.value })}
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>
                  {fullName(p.user)} ({p.user?.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#554238] mb-1.5">Select Doctor</label>
            <select
              className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
              value={bookingForm.doctorId}
              onChange={e => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
              required
            >
              <option value="">-- Choose Doctor --</option>
              {doctors.map(d => (
                <option key={d.doctorId} value={d.doctorId}>
                  Dr. {fullName(d.user)} - {d.specialization}
                </option>
              ))}
            </select>
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
                required
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
            className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white px-5 py-3 text-sm font-semibold transition-colors"
          >
            Confirm Appointment
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
          <SectionHeader title="Appointments Queue" description="Full log of clinical encounters linked to your Hospital." />
          <DataTable
            rows={appointments}
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
          <SectionHeader title="Hospital Patients" description="Complete registry of patient identities." />
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
      <aside className={`fixed bottom-0 left-0 top-0 z-50 flex w-[250px] shrink-0 flex-col border-r border-[#EEDFD7] bg-white transition-transform duration-300 lg:static ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <button onClick={() => setActiveNav("Dashboard")} className="flex h-[82px] items-center border-b border-[#EEDFD7] px-6 text-left">
          <Image src="/logo.png" alt="VitaData Solutions" width={112} height={56} className="h-auto w-[112px] object-contain object-left" priority />
        </button>
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
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#3D2010]">{receptionistName}</p>
              <p className="text-xs text-[#9C8276]">Receptionist</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0CDBB] bg-[#FFF1E8] text-sm font-bold text-[#D97757]">
              {receptionistName.charAt(0)}
            </div>
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
    </div>
  );
}
