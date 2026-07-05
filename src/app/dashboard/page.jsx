"use client";

import React from "react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardCalendar from "@/components/DashboardCalendar";

const navItems = [
  "Dashboard",
  "Pending Requests",
  "Doctors",
  "Receptionists",
  "Lab Staff",
  "Appointments",
  "Patients",
  "Lab Reports",
  "Financial Reports",
  "Patient Feedback",
  "Analytics",
  "Hospital Settings",
];

const apiBaseUrl =
  process.env.NEXT_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL;

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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const statusStyles = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  ABNORMAL: "bg-red-50 text-red-700 border-red-200",
  NORMAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px]">
          {filterSlot}
        </div>
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

function DashboardOverview({ data }) {
  const overview = data.overview;
  const recentAppointments = data.appointments.slice(0, 6);

  const calendarEvents = useMemo(() => {
    if (!data.appointments) return [];
    return data.appointments.map(a => ({
      date: a.scheduledTime ? a.scheduledTime.split("T")[0] : "",
      type: a.visitType || "Appointment",
      title: `Appt: ${fullName(a.patient?.user)} with Dr. ${fullName(a.doctor?.user)}`,
      time: formatDate(a.scheduledTime, true).split(" - ")[1] || formatDate(a.scheduledTime, true),
      details: `Hospital: ${a.hospital?.name || "Clinic"} | Reason: ${a.reason || "General checkup"} (${a.status})`
    })).filter(e => e.date);
  }, [data.appointments]);

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Doctors" value={overview.doctors} detail={`${overview.hospitals} hospital location${overview.hospitals === 1 ? "" : "s"}`} />
        <MetricCard label="Patients" value={overview.patients} detail={`${overview.appointments} recorded appointments`} tone="blue" />
        <MetricCard label="Completed Visits" value={overview.completedAppointments} detail={`${overview.pendingAppointments} currently scheduled`} tone="green" />
        <MetricCard label="Collected Revenue" value={formatCurrency(overview.totalRevenue)} detail={`${formatCurrency(overview.outstandingRevenue)} outstanding`} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeader title="Recent appointments" description="Latest clinical visits across your hospital scope." />
          <DataTable
            rows={recentAppointments}
            keyFor={(row) => row.encounterId}
            emptyMessage="No appointments have been recorded."
            columns={[
              { label: "Patient", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.patient?.user)}</span> },
              { label: "Doctor", render: (row) => fullName(row.doctor?.user) },
              { label: "Hospital", render: (row) => row.hospital?.name || "—" },
              { label: "Scheduled", render: (row) => formatDate(row.scheduledTime, true) },
              { label: "Status", render: (row) => <StatusBadge value={row.status} /> },
            ]}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#EEDFD7] bg-white p-5 shadow-sm">
            <h3 className="font-bold text-[#3D2010]">Operations snapshot</h3>
            <div className="mt-5 space-y-4">
              {[
                ["Reception team", overview.receptionists],
                ["Lab staff", overview.labStaff],
                ["Abnormal lab results", overview.abnormalLabResults],
                ["Pending appointments", overview.pendingAppointments],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[#F3EAE5] pb-3 last:border-0 last:pb-0">
                  <span className="text-sm text-[#7A655B]">{label}</span>
                  <span className="rounded-lg bg-[#FFF4EC] px-2.5 py-1 text-sm font-bold text-[#D97757]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <DashboardCalendar events={calendarEvents} />
        </div>
      </div>
    </div>
  );
}

function DoctorScheduleModal({ doctor, appointments, onClose }) {
  const docAppointments = React.useMemo(() => {
    return appointments.filter(
      (a) => a.doctorId === doctor.doctorId && new Date(a.scheduledTime) >= new Date()
    );
  }, [doctor, appointments]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#EEDFD7] shadow-2xl p-6 max-w-lg w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-lg font-bold">&times;</button>
        <h3 className="text-base font-bold text-[#3D2010] mb-1 font-sans">Upcoming Schedule: Dr. {fullName(doctor.user)}</h3>
        <p className="text-xs text-[#8B7469] mb-4 font-sans font-medium">List of upcoming scheduled consultations</p>

        <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
          {docAppointments.length === 0 ? (
            <p className="text-xs text-gray-500 font-sans">No upcoming consultations scheduled.</p>
          ) : (
            docAppointments.map((appt) => (
              <div key={appt.encounterId} className="p-3 bg-[#FFF9F5] border border-[#EEDFD7] rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-[#3D2010]">{fullName(appt.patient?.user)}</p>
                  <p className="text-[10px] text-gray-500 font-sans mt-0.5">{appt.hospital?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#D97757] font-sans">{formatDate(appt.scheduledTime, true)}</p>
                  <p className="text-[10px] text-gray-500 font-sans mt-0.5">{appt.reason || "General Checkup"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DoctorAvailabilityModal({ doctor, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#EEDFD7] shadow-2xl p-6 max-w-md w-full relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-lg font-bold">&times;</button>
        <h3 className="text-base font-bold text-[#3D2010] mb-1 font-sans">Clinician Availability: Dr. {fullName(doctor.user)}</h3>
        <p className="text-xs text-[#8B7469] mb-4 font-sans font-medium">Weekly availability schedule per linked hospital location</p>

        <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1">
          {doctor.hospitals.length === 0 ? (
            <p className="text-xs text-gray-500 font-sans font-medium">No linked hospitals registered.</p>
          ) : (
            doctor.hospitals.map((hosp) => (
              <div key={hosp.hospitalId} className="p-4 bg-[#FFF9F5] border border-[#EEDFD7] rounded-2xl">
                <p className="font-bold text-xs text-[#3D2010] border-b border-[#EEDFD7] pb-1.5 mb-2 font-sans">{hosp.name}</p>
                <div className="space-y-1.5 text-xs text-gray-600 font-sans">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Monday - Friday:</span>
                    <span className="font-bold text-[#D97757]">09:00 AM - 05:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Saturday:</span>
                    <span className="font-bold text-[#D97757]">09:00 AM - 01:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-500">Sunday:</span>
                    <span className="text-gray-400 font-medium">Closed</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AddStaffModal({ isOpen, onClose, role, hospitals, onSuccess }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    hospitalId: hospitals[0]?.hospitalId || '',
    specialization: 'GENERAL_PRACTICE',
    licenseNo: '',
    shift: 'MORNING',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hospitals.length > 0) {
      setForm(prev => ({ ...prev, hospitalId: hospitals[0].hospitalId }));
    }
  }, [hospitals, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${apiBaseUrl}/users/signup-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          role,
        })
      });

      const resData = await response.json();
      if (!response.ok || resData.status === 'ERROR') {
        throw new Error(resData.message || 'Failed to create staff member');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#EEDFD7] shadow-2xl p-6 sm:p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-lg font-bold">&times;</button>
        <h2 className="text-base font-bold text-[#3D2010] mb-1 font-sans">Add New {String(role).replace('_', ' ')}</h2>
        <p className="text-xs text-gray-500 mb-4 font-sans font-medium">Directly register a verified clinical staff member.</p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">First Name</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                placeholder="John"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#D97757]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Last Name</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                placeholder="Doe"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#D97757]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Phone Number</label>
            <input
              type="text"
              required
              value={form.phoneNumber}
              onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#D97757]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="e.g. staff@example.com"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#D97757]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#D97757]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Assign Hospital</label>
            <select
              value={form.hospitalId}
              onChange={e => setForm(p => ({ ...p, hospitalId: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#D97757] font-sans"
            >
              {hospitals.map(h => (
                <option key={h.hospitalId} value={h.hospitalId}>{h.name} — {h.city}</option>
              ))}
            </select>
          </div>

          {role === 'DOCTOR' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Specialization</label>
                <select
                  value={form.specialization}
                  onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#D97757] font-sans"
                >
                  <option value="CARDIOLOGY">Cardiology</option>
                  <option value="NEUROLOGY">Neurology</option>
                  <option value="ORTHOPEDICS">Orthopedics</option>
                  <option value="GENERAL_SURGERY">General Surgery</option>
                  <option value="DERMATOLOGY">Dermatology</option>
                  <option value="PSYCHIATRY">Psychiatry</option>
                  <option value="PEDIATRICS">Pediatrics</option>
                  <option value="GYNECOLOGY">Gynecology</option>
                  <option value="ENT">ENT</option>
                  <option value="OPHTHALMOLOGY">Ophthalmology</option>
                  <option value="GENERAL_PRACTICE">General Practice</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">License Number</label>
                <input
                  type="text"
                  required
                  value={form.licenseNo}
                  onChange={e => setForm(p => ({ ...p, licenseNo: e.target.value }))}
                  placeholder="MC-123456"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#D97757]"
                />
              </div>
            </div>
          )}

          {role === 'RECEPTIONIST' && (
            <div>
              <label className="block text-xs font-bold text-[#8B7469] uppercase tracking-wider mb-1.5 font-sans">Shift Duty</label>
              <select
                value={form.shift}
                onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#D97757] font-sans"
              >
                <option value="MORNING">Morning Shift</option>
                <option value="AFTERNOON">Afternoon Shift</option>
                <option value="NIGHT">Night Shift</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors disabled:opacity-50 text-xs font-sans"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PendingRequestsView() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${apiBaseUrl}/admin/pending-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await response.json();
      if (resData.status === 'OK') {
        setRequests(resData.data);
      } else {
        setError(resData.message || "Failed to load requests");
      }
    } catch (err) {
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (userId, action) => {
    setProcessingId(userId);
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${apiBaseUrl}/admin/pending-requests/${userId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await response.json();
      if (resData.status === 'OK') {
        fetchRequests();
      } else {
        alert(resData.message || "Action failed");
      }
    } catch (err) {
      alert("Action failed");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 font-sans p-4">Loading pending verification requests...</div>;
  if (error) return <div className="text-sm text-red-500 font-sans p-4">{error}</div>;

  return (
    <>
      <SectionHeader description="Verify and approve clinician, staff, and administrator sign up requests." />
      <DataTable
        rows={requests}
        keyFor={(row) => row.userId}
        emptyMessage="No pending signup requests."
        columns={[
          { label: "Name", render: (row) => <span className="font-semibold text-[#3D2010]">{row.firstName} {row.lastName}</span> },
          { label: "Role", render: (row) => <span className="text-xs font-bold uppercase tracking-wider text-[#D97757] font-sans">{row.role}</span> },
          { label: "Hospital", render: (row) => <span className="text-xs font-medium text-gray-600 font-sans">{row.hospitalName}</span> },
          { label: "Email", render: (row) => <span className="text-xs font-mono">{row.email || "—"}</span> },
          { label: "Phone", render: (row) => <span className="text-xs font-mono">{row.phoneNumber}</span> },
          { label: "Requested Date", render: (row) => <span className="text-xs font-sans text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</span> },
          {
            label: "Verification Status",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  disabled={processingId === row.userId}
                  onClick={() => handleAction(row.userId, 'approve')}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 font-sans transition-colors"
                >
                  Approve
                </button>
                <button
                  disabled={processingId === row.userId}
                  onClick={() => handleAction(row.userId, 'reject')}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 font-sans transition-colors"
                >
                  Reject
                </button>
              </div>
            )
          }
        ]}
      />
    </>
  );
}

function DoctorsView({ rows, appointments = [], hospitals = [], onRefresh }) {
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");
  const [hospitalFilter, setHospitalFilter] = useState("ALL");
  
  // Modals state
  const [selectedDocSchedule, setSelectedDocSchedule] = useState(null);
  const [selectedDocAvailability, setSelectedDocAvailability] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Group doctors
  const groupedDoctors = React.useMemo(() => {
    const map = new Map();
    rows?.forEach((doc) => {
      if (!map.has(doc.doctorId)) {
        map.set(doc.doctorId, {
          ...doc,
          hospitals: doc.hospital ? [doc.hospital] : [],
        });
      } else {
        const existing = map.get(doc.doctorId);
        if (doc.hospital && !existing.hospitals.some(h => h.hospitalId === doc.hospital.hospitalId)) {
          existing.hospitals.push(doc.hospital);
        }
      }
    });
    return Array.from(map.values());
  }, [rows]);

  // Apply filters
  const filteredDoctors = React.useMemo(() => {
    return groupedDoctors.filter(doc => {
      const matchSpecialty = specialtyFilter === "ALL" || doc.specialization === specialtyFilter;
      const matchHospital = hospitalFilter === "ALL" || doc.hospitals.some(h => h.hospitalId === hospitalFilter);
      return matchSpecialty && matchHospital;
    });
  }, [groupedDoctors, specialtyFilter, hospitalFilter]);

  const uniqueSpecialties = React.useMemo(() => {
    const list = new Set(groupedDoctors.map(d => d.specialization).filter(Boolean));
    return Array.from(list);
  }, [groupedDoctors]);

  const uniqueHospitals = React.useMemo(() => {
    const list = new Map();
    groupedDoctors.forEach(d => {
      d.hospitals.forEach(h => {
        list.set(h.hospitalId, h);
      });
    });
    return Array.from(list.values());
  }, [groupedDoctors]);

  return (
    <>
      <SectionHeader 
        description="Verified clinicians linked to the hospitals you manage." 
        action={
          <button
            onClick={() => setIsAddOpen(true)}
            className="rounded-xl bg-[#3D2010] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#D97757] transition-colors font-sans"
          >
            + Add Doctor
          </button>
        }
      />
      <DataTable
        rows={filteredDoctors}
        keyFor={(row) => row.doctorId}
        emptyMessage="No doctors match the selected filters."
        filterSlot={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Specialty:</span>
              <select
                value={specialtyFilter}
                onChange={e => setSpecialtyFilter(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
              >
                <option value="ALL">All Specialties</option>
                {uniqueSpecialties.map(spec => (
                  <option key={spec} value={spec}>{String(spec).replaceAll("_", " ")}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Hospital:</span>
              <select
                value={hospitalFilter}
                onChange={e => setHospitalFilter(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
              >
                <option value="ALL">All Hospitals</option>
                {uniqueHospitals.map(h => (
                  <option key={h.hospitalId} value={h.hospitalId}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        }
        columns={[
          { label: "Doctor", render: (row) => <div><p className="font-semibold text-[#3D2010]">{fullName(row.user)}</p><p className="mt-1 text-xs text-[#9C8276] font-mono">{row.user?.email || row.user?.phoneNumber}</p></div> },
          { label: "Specialization", render: (row) => <span className="font-medium text-xs font-sans text-gray-700">{String(row.specialization || "General").replaceAll("_", " ")}</span> },
          { label: "Hospitals", render: (row) => <span className="text-xs font-sans">{row.hospitals.map(h => h.name).join(", ") || "—"}</span> },
          { label: "Consultation", render: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{formatCurrency(row.consultationFee)}</span> },
          { 
            label: "Schedule", 
            render: (row) => (
              <button
                onClick={() => setSelectedDocSchedule(row)}
                className="rounded-lg border border-[#EEDFD7] px-2.5 py-1 text-xs font-bold text-[#3D2010] hover:border-[#D97757] hover:text-[#D97757] font-sans transition-all"
              >
                View Schedule
              </button>
            ) 
          },
          { 
            label: "Availability", 
            render: (row) => (
              <button
                onClick={() => setSelectedDocAvailability(row)}
                className="rounded-lg border border-[#EEDFD7] px-2.5 py-1 text-xs font-bold text-[#3D2010] hover:border-[#D97757] hover:text-[#D97757] font-sans transition-all"
              >
                View Availability
              </button>
            ) 
          },
          { label: "Status", render: (row) => <StatusBadge value={row.isAvailable ? "ACTIVE" : "UNAVAILABLE"} /> },
        ]}
      />

      {/* Schedule Modal */}
      {selectedDocSchedule && (
        <DoctorScheduleModal 
          doctor={selectedDocSchedule} 
          appointments={appointments} 
          onClose={() => setSelectedDocSchedule(null)} 
        />
      )}

      {/* Availability Modal */}
      {selectedDocAvailability && (
        <DoctorAvailabilityModal 
          doctor={selectedDocAvailability} 
          onClose={() => setSelectedDocAvailability(null)} 
        />
      )}

      {/* Add Staff Modal */}
      <AddStaffModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        role="DOCTOR" 
        hospitals={hospitals} 
        onSuccess={onRefresh} 
      />
    </>
  );
}

function ReceptionistsView({ rows, hospitals = [], onRefresh }) {
  const [shiftFilter, setShiftFilter] = useState("ALL");
  const [hospitalFilter, setHospitalFilter] = useState("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredRows = React.useMemo(() => {
    return rows.filter(row => {
      const matchShift = shiftFilter === "ALL" || row.shift === shiftFilter;
      const matchHospital = hospitalFilter === "ALL" || row.hospital?.hospitalId === hospitalFilter;
      return matchShift && matchHospital;
    });
  }, [rows, shiftFilter, hospitalFilter]);

  return (
    <>
      <SectionHeader 
        description="Front-desk staff and their assigned shifts." 
        action={
          <button
            onClick={() => setIsAddOpen(true)}
            className="rounded-xl bg-[#3D2010] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#D97757] transition-colors font-sans"
          >
            + Add Receptionist
          </button>
        }
      />
      <DataTable
        rows={filteredRows}
        keyFor={(row) => row.receptionistId}
        emptyMessage="No receptionists match the filters."
        filterSlot={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Shift:</span>
              <select
                value={shiftFilter}
                onChange={e => setShiftFilter(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
              >
                <option value="ALL">All Shifts</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Hospital:</span>
              <select
                value={hospitalFilter}
                onChange={e => setHospitalFilter(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
              >
                <option value="ALL">All Hospitals</option>
                {hospitals.map(h => (
                  <option key={h.hospitalId} value={h.hospitalId}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        }
        columns={[
          { label: "Name", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.user)}</span> },
          { label: "Phone", render: (row) => <span className="text-xs font-mono">{row.user?.phoneNumber || "—"}</span> },
          { label: "Email", render: (row) => <span className="text-xs font-mono">{row.user?.email || "—"}</span> },
          { label: "Hospital", render: (row) => <span className="text-xs font-sans text-gray-700">{row.hospital?.name || "—"}</span> },
          { label: "Shift", render: (row) => <StatusBadge value={row.shift || "UNASSIGNED"} /> },
          { label: "Account", render: (row) => <StatusBadge value={row.user?.isActive ? "ACTIVE" : "INACTIVE"} /> },
        ]}
      />
      <AddStaffModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        role="RECEPTIONIST" 
        hospitals={hospitals} 
        onSuccess={onRefresh} 
      />
    </>
  );
}

function LabStaffView({ rows, hospitals = [], onRefresh }) {
  const [hospitalFilter, setHospitalFilter] = useState("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filteredRows = React.useMemo(() => {
    return rows.filter(row => {
      return hospitalFilter === "ALL" || row.hospital?.hospitalId === hospitalFilter;
    });
  }, [rows, hospitalFilter]);

  return (
    <>
      <SectionHeader 
        description="Lab managers, departments, and diagnostic capacity." 
        action={
          <button
            onClick={() => setIsAddOpen(true)}
            className="rounded-xl bg-[#3D2010] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#D97757] transition-colors font-sans"
          >
            + Add Lab Staff
          </button>
        }
      />
      <DataTable
        rows={filteredRows}
        keyFor={(row) => row.managerId}
        emptyMessage="No lab staff match the filter."
        filterSlot={
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Hospital:</span>
            <select
              value={hospitalFilter}
              onChange={e => setHospitalFilter(e.target.value)}
              className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
            >
              <option value="ALL">All Hospitals</option>
              {hospitals.map(h => (
                <option key={h.hospitalId} value={h.hospitalId}>{h.name}</option>
              ))}
            </select>
          </div>
        }
        columns={[
          { label: "Name", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.user)}</span> },
          { label: "Contact", render: (row) => <div><p className="text-xs font-mono">{row.user?.phoneNumber || "—"}</p><p className="mt-1 text-xs text-[#9C8276] font-mono">{row.user?.email || "—"}</p></div> },
          { label: "Department", render: (row) => <span className="text-xs font-medium text-gray-700">{String(row.department || "Unassigned").replaceAll("_", " ")}</span> },
          { label: "Hospital", render: (row) => <span className="text-xs font-sans text-gray-700">{row.hospital?.name || "—"}</span> },
          { label: "Labs", render: (row) => <span className="text-xs font-sans text-gray-500">{row.labs?.map((lab) => lab.name).join(", ") || "No lab assigned"}</span> },
          { label: "Available slots", render: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.labs?.reduce((sum, lab) => sum + Number(lab.availableSlots || 0), 0) || 0}</span> },
        ]}
      />
      <AddStaffModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        role="LAB_MANAGER" 
        hospitals={hospitals} 
        onSuccess={onRefresh} 
      />
    </>
  );
}

function AppointmentsView({ rows, hospitals = [] }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [hospitalFilter, setHospitalFilter] = useState("ALL");

  const filteredRows = React.useMemo(() => {
    return rows.filter(row => {
      const matchStatus = statusFilter === "ALL" || row.status === statusFilter;
      const matchHospital = hospitalFilter === "ALL" || row.hospital?.hospitalId === hospitalFilter;
      return matchStatus && matchHospital;
    });
  }, [rows, statusFilter, hospitalFilter]);

  return (
    <>
      <SectionHeader description="Scheduled and completed encounters with clinical context." />
      <DataTable
        rows={filteredRows}
        keyFor={(row) => row.encounterId}
        emptyMessage="No appointments match the filters."
        filterSlot={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Hospital:</span>
              <select
                value={hospitalFilter}
                onChange={e => setHospitalFilter(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
              >
                <option value="ALL">All Hospitals</option>
                {hospitals.map(h => (
                  <option key={h.hospitalId} value={h.hospitalId}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        }
        columns={[
          { label: "Patient", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.patient?.user)}</span> },
          { label: "Doctor", render: (row) => fullName(row.doctor?.user) },
          { label: "Date & time", render: (row) => <span className="font-mono text-xs font-medium text-gray-700">{formatDate(row.scheduledTime, true)}</span> },
          { label: "Visit", render: (row) => <span className="font-sans text-xs text-gray-500 font-semibold">{row.visitType}</span> },
          { label: "Reason", render: (row) => <span className="text-xs text-gray-600 font-sans">{row.reason || row.chiefComplaint || "General consultation"}</span> },
          { label: "Status", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </>
  );
}

function PatientsView({ rows }) {
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [bloodFilter, setBloodFilter] = useState("ALL");

  const filteredRows = React.useMemo(() => {
    return rows.filter(row => {
      const matchGender = genderFilter === "ALL" || String(row.gender).toLowerCase() === genderFilter.toLowerCase();
      const matchBlood = bloodFilter === "ALL" || row.bloodGroup === bloodFilter;
      return matchGender && matchBlood;
    });
  }, [rows, genderFilter, bloodFilter]);

  const bloodGroups = ["O_POSITIVE", "O_NEGATIVE", "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE"];

  return (
    <>
      <SectionHeader description="Patient identities and clinical-history coverage." />
      <DataTable
        rows={filteredRows}
        keyFor={(row) => row.patientId}
        emptyMessage="No patients match the filters."
        filterSlot={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Gender:</span>
              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
              >
                <option value="ALL">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Blood Group:</span>
              <select
                value={bloodFilter}
                onChange={e => setBloodFilter(e.target.value)}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans"
              >
                <option value="ALL">All Groups</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{String(bg).replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>
        }
        columns={[
          { label: "Patient", render: (row) => <div><p className="font-semibold text-[#3D2010]">{fullName(row.user)}</p><p className="mt-1 text-xs text-[#9C8276] font-mono">{row.user?.phoneNumber}</p></div> },
          { label: "Gender", render: (row) => <span className="text-xs font-sans text-gray-500 font-semibold">{row.gender ? row.gender[0].toUpperCase() + row.gender.slice(1) : "—"}</span> },
          { label: "Date of birth", render: (row) => <span className="text-xs font-sans">{formatDate(row.dob)}</span> },
          { label: "Blood group", render: (row) => <span className="text-xs font-sans text-gray-600 font-bold">{String(row.bloodGroup || "—").replace("_", " ")}</span> },
          { label: "Conditions", render: (row) => <span className="text-xs text-gray-500 font-sans">{row.chronicConditions?.join(", ") || "None recorded"}</span> },
          { label: "Visits", render: (row) => <span className="font-mono text-xs text-gray-800 font-bold">{row._count?.encounters || 0}</span> },
        ]}
      />
    </>
  );
}

function FeedbackView({ hospitals = [], doctors = [], profile }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState("");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isSuperAdmin = profile?.roles?.includes("SUPER_ADMIN");
  const isHospitalAdmin = profile?.roles?.includes("HOSPITAL_ADMIN");
  const adminHospitalId = profile?.hospitalAdmin?.hospitalId || "";

  useEffect(() => {
    if (isHospitalAdmin && adminHospitalId) {
      setSelectedHospitalFilter(adminHospitalId);
    }
  }, [isHospitalAdmin, adminHospitalId]);

  const loadFeedbacks = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL;
      
      let url = `${apiBaseUrl}/feedback?`;
      if (isHospitalAdmin) {
        url += `hospitalId=${adminHospitalId}&`;
      } else if (selectedHospitalFilter) {
        url += `hospitalId=${selectedHospitalFilter}&`;
      }
      
      if (selectedDoctorFilter) {
        url += `doctorId=${selectedDoctorFilter}&`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to load feedbacks");
      }

      const list = await res.json();
      setFeedbacks(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  }, [isHospitalAdmin, adminHospitalId, selectedHospitalFilter, selectedDoctorFilter]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const renderStars = (rating) => {
    if (!rating) return "—";
    const num = Number(rating);
    const fullStars = Math.floor(num);
    const hasHalf = num % 1 !== 0;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push("★");
    }
    if (hasHalf) {
      stars.push("½");
    }
    const emptyCount = 5 - Math.ceil(num);
    for (let i = 0; i < emptyCount; i++) {
      stars.push("☆");
    }
    return <span className="text-amber-500 font-bold tracking-wider text-xs">{stars.join("")} ({num})</span>;
  };

  const filteredDoctors = useMemo(() => {
    if (!selectedHospitalFilter) return doctors;
    return doctors.filter(doc => {
      return doc.hospitals?.some(h => h.hospitalId === selectedHospitalFilter || h.hospital?.hospitalId === selectedHospitalFilter);
    });
  }, [doctors, selectedHospitalFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Patient Feedback Reports" description="Review ratings and comments submitted by patients after completing their visits." />
      
      <div className="bg-white rounded-2xl border border-[#EEDFD7] p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          {isSuperAdmin && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Hospital:</span>
              <select
                value={selectedHospitalFilter}
                onChange={e => {
                  setSelectedHospitalFilter(e.target.value);
                  setSelectedDoctorFilter("");
                }}
                className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans min-w-[200px]"
              >
                <option value="">All Hospitals</option>
                {hospitals.map(h => (
                  <option key={h.hospitalId} value={h.hospitalId}>{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {isHospitalAdmin && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Hospital:</span>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 font-sans min-w-[200px] font-semibold">
                {hospitals.find(h => h.hospitalId === adminHospitalId)?.name || "Linked Hospital"}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#8B7469] uppercase tracking-wider font-sans">Doctor:</span>
            <select
              value={selectedDoctorFilter}
              onChange={e => setSelectedDoctorFilter(e.target.value)}
              className="rounded-xl border border-[#EEDFD7] bg-white px-3 py-1.5 text-xs text-[#3D2010] outline-none focus:border-[#D97757] font-sans min-w-[200px]"
            >
              <option value="">All Doctors</option>
              {filteredDoctors.map(doc => (
                <option key={doc.doctorId} value={doc.doctorId}>
                  Dr. {doc.user?.firstName} {doc.user?.lastName} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-[#EEDFD7] bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#F3DED2] border-t-[#D97757]" />
            <p className="mt-3 text-xs text-[#8B7469]">Loading feedbacks...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#EEDFD7] bg-white p-8 text-center text-sm text-[#9C8276]">
          No feedback reports found for the selected filters.
        </div>
      ) : (
        <DataTable
          rows={feedbacks}
          keyFor={(row) => row.feedbackId}
          emptyMessage="No feedbacks found."
          columns={[
            {
              label: "Date / Patient",
              render: (row) => {
                const patientUser = row.encounter?.patient?.user;
                const patientName = patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : "Anonymous";
                return (
                  <div>
                    <p className="font-semibold text-[#3D2010]">{patientName}</p>
                    <p className="mt-1 text-[10px] text-[#9C8276]">{formatDate(row.submittedAt, true)}</p>
                  </div>
                );
              }
            },
            {
              label: "Clinical Ratings",
              render: (row) => (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8B7469] w-12">Doc:</span>
                    {renderStars(row.doctorRating)}
                  </div>
                  <div className="text-[10px] text-gray-500 italic pl-14">
                    Dr. {row.encounter?.doctor?.user?.firstName} {row.encounter?.doctor?.user?.lastName}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8B7469] w-12">Hosp:</span>
                    {renderStars(row.hospitalRating)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8B7469] w-12">Recept:</span>
                    {renderStars(row.receptionistRating)}
                  </div>
                </div>
              )
            },
            {
              label: "Tech / Web Ratings",
              render: (row) => (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8B7469] w-12">Website:</span>
                    {renderStars(row.websiteRating)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8B7469] w-12">Payment:</span>
                    {renderStars(row.paymentRating)}
                  </div>
                </div>
              )
            },
            {
              label: "Comments / Suggestions",
              render: (row) => (
                <p className="text-xs text-[#554238] max-w-sm whitespace-pre-wrap leading-relaxed">
                  {row.comments || <span className="italic text-[#9C8276]">No comments provided.</span>}
                </p>
              )
            }
          ]}
        />
      )}
    </div>
  );
}

function LabReportsView({ rows }) {
  return (
    <>
      <SectionHeader description="Reported diagnostic results and abnormal-result monitoring." />
      <DataTable
        rows={rows}
        keyFor={(row) => row.resultId}
        emptyMessage="No lab reports have been recorded."
        columns={[
          { label: "Patient", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.encounter?.patient?.user)}</span> },
          { label: "Test", render: (row) => row.labTest?.testName || "Unnamed test" },
          { label: "Result", render: (row) => `${row.resultValue || "—"}${row.labTest?.unit ? ` ${row.labTest.unit}` : ""}` },
          { label: "Reference", render: (row) => row.labTest?.normalRange || "—" },
          { label: "Reported", render: (row) => formatDate(row.reportedAt, true) },
          { label: "Flag", render: (row) => <StatusBadge value={row.isAbnormal ? "ABNORMAL" : "NORMAL"} /> },
        ]}
      />
    </>
  );
}

function FinancialReportsView({ rows, overview }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Collected" value={formatCurrency(overview.totalRevenue)} tone="green" />
        <MetricCard label="Outstanding" value={formatCurrency(overview.outstandingRevenue)} tone="amber" />
        <MetricCard label="Invoices" value={rows.length} detail={`${rows.filter((row) => row.status === "PAID").length} fully paid`} />
      </div>
      <div>
        <SectionHeader description="Invoices, payment status, totals, and due dates." />
        <DataTable
          rows={rows}
          keyFor={(row) => row.invoiceId}
          emptyMessage="No invoices have been generated."
          columns={[
            { label: "Invoice", render: (row) => <span className="font-semibold text-[#3D2010]">{row.invoiceNumber || row.invoiceId.slice(0, 8)}</span> },
            { label: "Patient", render: (row) => fullName(row.patient?.user) },
            { label: "Generated", render: (row) => formatDate(row.generatedAt) },
            { label: "Due", render: (row) => formatDate(row.dueDate) },
            { label: "Amount", render: (row) => formatCurrency(row.finalAmount) },
            { label: "Status", render: (row) => <StatusBadge value={row.status} /> },
          ]}
        />
      </div>
    </div>
  );
}

function AnalyticsView({ rows, overview }) {
  const completionRate = overview.appointments
    ? Math.round((overview.completedAppointments / overview.appointments) * 100)
    : 0;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Visit completion" value={`${completionRate}%`} tone="green" />
        <MetricCard label="Abnormal results" value={overview.abnormalLabResults} tone="amber" />
        <MetricCard label="Revenue tracked" value={formatCurrency(overview.totalRevenue + overview.outstandingRevenue)} tone="blue" />
        <MetricCard label="Metrics recorded" value={rows.length} />
      </div>
      <div>
        <SectionHeader description="Stored operational and clinical metrics from the VitaData analytics pipeline." />
        <DataTable
          rows={rows}
          keyFor={(row) => row.analyticsId}
          emptyMessage="No analytics metrics have been recorded."
          columns={[
            { label: "Metric", render: (row) => <span className="font-semibold text-[#3D2010]">{String(row.metric).replaceAll("_", " ")}</span> },
            { label: "Value", render: (row) => Number(row.value).toLocaleString("en-IN") },
            { label: "Hospital", render: (row) => row.hospital?.name || "System-wide" },
            { label: "Doctor", render: (row) => row.doctor ? fullName(row.doctor.user) : "—" },
            { label: "Patient", render: (row) => row.patient ? fullName(row.patient.user) : "—" },
            { label: "Date", render: (row) => formatDate(row.date) },
          ]}
        />
      </div>
    </div>
  );
}

function HospitalSettingsView({ hospitals, selectedId, onSelect, form, onChange, onSave, saving, message, isSuperAdmin, onAddClick }) {
  return (
    <div className="max-w-3xl">
      <SectionHeader 
        description="Update the operational identity shown throughout the admin workspace." 
        action={isSuperAdmin && (
          <button 
            type="button" 
            onClick={onAddClick} 
            className="rounded-xl bg-[#D97757] hover:bg-[#C26243] text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Hospital
          </button>
        )}
      />
      <form onSubmit={onSave} className="rounded-2xl border border-[#EEDFD7] bg-white p-6 shadow-sm font-sans">
        {hospitals.length > 1 && (
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-[#554238]">Hospital</label>
            <select value={selectedId} onChange={(event) => onSelect(event.target.value)} className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-3 text-sm outline-none focus:border-[#D97757]">
              {hospitals.map((hospital) => <option key={hospital.hospitalId} value={hospital.hospitalId}>{hospital.name} — {hospital.city}</option>)}
            </select>
          </div>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            ["name", "Hospital name"],
            ["city", "City"],
            ["state", "State"],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="mb-2 block text-sm font-semibold text-[#554238] font-sans">{label}</label>
              <input name={name} value={form[name]} onChange={onChange} required={name !== "state"} className="w-full rounded-xl border border-[#E3D4CC] px-4 py-3 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/10" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[#554238] font-sans">Address</label>
            <textarea name="address" value={form.address} onChange={onChange} required rows={4} className="w-full resize-none rounded-xl border border-[#E3D4CC] px-4 py-3 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/10" />
          </div>
        </div>
        {message && <p className={`mt-4 text-sm ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
        <button type="submit" disabled={saving || !selectedId} className="mt-6 rounded-xl bg-[#3D2010] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D97757] disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? "Saving changes..." : "Save hospital settings"}
        </button>
      </form>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#EEDFD7] bg-white">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#F3DED2] border-t-[#D97757]" />
        <p className="mt-4 text-sm font-medium text-[#8B7469]">Loading hospital data…</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalMode, setProfileModalMode] = useState("view"); // "view" or "edit"
  const [isAddHospitalModalOpen, setIsAddHospitalModalOpen] = useState(false);
  const [newHospitalForm, setNewHospitalForm] = useState({ name: "", address: "", city: "", state: "" });
  const [addingHospital, setAddingHospital] = useState(false);
  const [addHospitalMessage, setAddHospitalMessage] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    emergencyContact: "",
  });

  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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


  // IMPORTANT: `data` must be declared before this effect to avoid
  // `ReferenceError: Cannot access 'data' before initialization`.


  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSavingSettings(true);
    const token = localStorage.getItem("adminToken");

    try {
      const res = await fetch(`${apiBaseUrl}/users/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Failed to update profile");

      setIsProfileModalOpen(false);
      
      // Force reload data
      loadDashboard(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const [data, setData] = useState(null);

  useEffect(() => {
    if (data?.profile) {
      setEditForm({
        firstName: data.profile.firstName || "",
        lastName: data.profile.lastName || "",
        phoneNumber: data.profile.phoneNumber || "",
        emergencyContact: data.profile.emergencyContact || "",
      });
    }
  }, [data, isProfileModalOpen]);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("adminToken");
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
    const token = localStorage.getItem("adminToken");
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [hospitalForm, setHospitalForm] = useState({ name: "", address: "", city: "", state: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRoles");
    localStorage.removeItem("adminUser");
    document.cookie = "admin_token=; path=/; max-age=0; samesite=lax";
    router.replace("/admin");
  }, [router]);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    const token = localStorage.getItem("adminToken");
    if (!token || !apiBaseUrl) {
      logout();
      return;
    }
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok || payload.status !== "OK") {
        throw new Error(payload.message || "Unable to load dashboard data");
      }
      setData(payload);
      setSelectedHospitalId((current) => current || payload.profile.hospitalId || payload.hospitals[0]?.hospitalId || "");
      fetchNotifications();
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the VitaData API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout, fetchNotifications]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
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

  const selectedHospital = React.useMemo(
    () => data?.hospitals?.find((hospital) => hospital.hospitalId === selectedHospitalId),
    [data, selectedHospitalId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedHospital) return;
      setHospitalForm({
        name: selectedHospital.name || "",
        address: selectedHospital.address || "",
        city: selectedHospital.city || "",
        state: selectedHospital.state || "",
      });
      setSettingsMessage(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedHospital]);

  const saveHospitalSettings = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("adminToken");
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      const response = await fetch(`${apiBaseUrl}/admin/dashboard/hospitals/${selectedHospitalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(hospitalForm),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to update hospital settings");
      setSettingsMessage({ type: "success", text: "Hospital settings saved successfully." });
      await loadDashboard(true);
    } catch (requestError) {
      setSettingsMessage({ type: "error", text: requestError.message });
    } finally {
      setSavingSettings(false);
    }
  };

  const addNewHospitalBySuperAdmin = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("adminToken");
    setAddingHospital(true);
    setAddHospitalMessage(null);
    try {
      const response = await fetch(`${apiBaseUrl}/admin/dashboard/hospitals`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newHospitalForm),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to create new hospital");
      
      setAddHospitalMessage({ type: "success", text: "Hospital created successfully." });
      setNewHospitalForm({ name: "", address: "", city: "", state: "" });
      
      await loadDashboard(true);
      
      setTimeout(() => {
        setIsAddHospitalModalOpen(false);
        setAddHospitalMessage(null);
      }, 2000);
    } catch (requestError) {
      setAddHospitalMessage({ type: "error", text: requestError.message });
    } finally {
      setAddingHospital(false);
    }
  };

  const adminName = data ? fullName(data.profile) : "Administrator";
  const adminRole = data?.profile?.roles?.includes("SUPER_ADMIN") ? "Super Admin" : "Hospital Admin";

  const renderActiveView = () => {
    if (!data) return null;
    const views = {
      Dashboard: <DashboardOverview data={data} />,
      "Pending Requests": <PendingRequestsView />,
      Doctors: (
        <DoctorsView
          rows={data.doctors}
          appointments={data.appointments}
          hospitals={data.hospitals}
          onRefresh={() => loadDashboard(true)}
        />
      ),
      Receptionists: (
        <ReceptionistsView
          rows={data.receptionists}
          hospitals={data.hospitals}
          onRefresh={() => loadDashboard(true)}
        />
      ),
      "Lab Staff": (
        <LabStaffView
          rows={data.labStaff}
          hospitals={data.hospitals}
          onRefresh={() => loadDashboard(true)}
        />
      ),
      Appointments: <AppointmentsView rows={data.appointments} hospitals={data.hospitals} />,
      Patients: <PatientsView rows={data.patients} />,
      "Lab Reports": <LabReportsView rows={data.labResults} />,
      "Financial Reports": <FinancialReportsView rows={data.invoices} overview={data.overview} />,
      "Patient Feedback": (
        <FeedbackView
          hospitals={data.hospitals}
          doctors={data.doctors}
          profile={data.profile}
        />
      ),
      Analytics: <AnalyticsView rows={data.analytics} overview={data.overview} />,
      "Hospital Settings": (
        <HospitalSettingsView
          hospitals={data.hospitals}
          selectedId={selectedHospitalId}
          onSelect={setSelectedHospitalId}
          form={hospitalForm}
          onChange={(event) => setHospitalForm((current) => ({ ...current, [event.target.name]: event.target.value }))}
          onSave={saveHospitalSettings}
          saving={savingSettings}
          message={settingsMessage}
          isSuperAdmin={data?.profile?.roles?.includes("SUPER_ADMIN")}
          onAddClick={() => setIsAddHospitalModalOpen(true)}
        />
      ),
    };
    return views[activeNav];
  };

  return (
    <div className="flex min-h-screen bg-[#F9F9F9] font-sans text-[#3D2010]">
      {isSidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

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
                <button onClick={() => { setActiveNav(item); setIsSidebarOpen(false); }} className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${activeNav === item ? "bg-[#FFF1E8] text-[#D97757]" : "text-[#806B61] hover:bg-[#FFF9F5] hover:text-[#3D2010]"}`}>
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

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[74px] items-center justify-between border-b border-[#EEDFD7] bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button aria-label="Open navigation" className="rounded-lg p-2 text-[#6B554A] hover:bg-[#FFF4EC] lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <span className="block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" />
            </button>
            <span className="text-xl font-extrabold tracking-tight text-[#D97757]">VitaData</span>
            <div className="hidden sm:block border-l border-[#EEDFD7] pl-3">
              <p className="text-xs font-medium text-[#9C8276]">VitaData administration</p>
              <p className="text-sm font-bold text-[#3D2010]">{data?.hospitals?.length === 1 ? data.hospitals[0].name : "Healthcare network"}</p>
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
                <p className="text-sm font-semibold text-[#3D2010]">{adminName}</p>
                <p className="text-xs text-[#9C8276]">{adminRole}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0CDBB] bg-[#FFF1E8] text-sm font-bold text-[#D97757]">
                {adminName.charAt(0)}
              </div>
            </button>

            {isProfileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                <div className="profile-dropdown-menu absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#EEDFD7] bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-[#F3EAE5] mb-1">
                    <p className="text-xs text-[#9C8276] font-medium font-sans">Logged in as</p>
                    <p className="text-sm font-bold text-[#3D2010]">{adminName}</p>
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

        <main className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h1 className="text-2xl font-bold tracking-tight text-[#2F1A10] md:text-3xl">{activeNav}</h1>{data?.generatedAt && <p className="mt-1 text-xs text-[#9C8276]">Data refreshed {formatDate(data.generatedAt, true)}</p>}</div>
              <button onClick={() => loadDashboard(true)} disabled={refreshing} className="self-start rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm font-semibold text-[#6B554A] shadow-sm transition-colors hover:border-[#D97757] hover:text-[#D97757] disabled:opacity-50">{refreshing ? "Refreshing..." : "Refresh data"}</button>
            </div>

            {error && <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button onClick={() => loadDashboard()} className="font-bold underline">Try again</button></div>}
            {loading ? <LoadingState /> : renderActiveView()}
          </div>
        </main>

        <button onClick={() => { window.location.href = "mailto:support@vitadata.example?subject=Admin%20dashboard%20support"; }} aria-label="Contact support" className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#3D2010] text-lg font-bold text-white shadow-lg transition-colors hover:bg-[#D97757]">?</button>
      </div>
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
                    {adminName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#3D2010]">{adminName}</h3>
                    <p className="text-xs text-[#9C8276] font-medium font-sans">Administrator Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Email Address</p>
                    <p className="text-sm font-medium text-[#3D2010] break-all">{data?.profile?.email || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Phone Number</p>
                    <p className="text-sm font-medium text-[#3D2010]">{data?.profile?.phoneNumber || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Emergency Contact</p>
                    <p className="text-sm font-medium text-[#3D2010]">{data?.profile?.emergencyContact || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[11px] font-bold text-[#8B7469] uppercase tracking-wider mb-0.5">Hospital Affiliation</p>
                    <p className="text-sm font-medium text-[#3D2010]">{data?.profile?.hospitalAdmin?.hospital?.name || "VITADATA Solutions"}</p>
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
      {isAddHospitalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F3EAE5] shadow-2xl p-6 sm:p-8 max-w-md w-full relative animate-in zoom-in-95 duration-200 text-left">
            <button 
              type="button"
              onClick={() => {
                setIsAddHospitalModalOpen(false);
                setAddHospitalMessage(null);
                setNewHospitalForm({ name: "", address: "", city: "", state: "" });
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#8B7469] hover:bg-[#FFF4EC] hover:text-[#D97757] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-lg font-bold text-[#3D2010] mb-2 font-sans">
              Add New Hospital
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Enter the hospital details to create a new branch/location.
            </p>

            <form onSubmit={addNewHospitalBySuperAdmin} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-[#554238] mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. City General Hospital"
                  value={newHospitalForm.name}
                  onChange={(e) => setNewHospitalForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#554238] mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={newHospitalForm.city}
                    onChange={(e) => setNewHospitalForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#554238] mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. MH"
                    value={newHospitalForm.state}
                    onChange={(e) => setNewHospitalForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#554238] mb-1">Address</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Street address..."
                  value={newHospitalForm.address}
                  onChange={(e) => setNewHospitalForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 resize-none rounded-lg border border-gray-200 text-sm text-[#3D2010] outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/10"
                />
              </div>

              {addHospitalMessage && (
                <div className={`text-sm ${addHospitalMessage.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
                  {addHospitalMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={addingHospital}
                className="w-full py-2.5 rounded-xl text-white font-bold bg-[#3D2010] hover:bg-[#D97757] transition-colors text-sm disabled:opacity-50"
              >
                {addingHospital ? 'Creating...' : 'Create Hospital'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
