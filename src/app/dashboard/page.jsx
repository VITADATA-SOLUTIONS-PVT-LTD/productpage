"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const navItems = [
  "Dashboard",
  "Doctors",
  "Receptionists",
  "Lab Staff",
  "Appointments",
  "Patients",
  "Lab Reports",
  "Financial Reports",
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

function DataTable({ columns, rows, keyFor, emptyMessage }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredRows = useMemo(() => {
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

function DashboardOverview({ data }) {
  const overview = data.overview;
  const recentAppointments = data.appointments.slice(0, 6);
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Doctors" value={overview.doctors} detail={`${overview.hospitals} hospital location${overview.hospitals === 1 ? "" : "s"}`} />
        <MetricCard label="Patients" value={overview.patients} detail={`${overview.appointments} recorded appointments`} tone="blue" />
        <MetricCard label="Completed Visits" value={overview.completedAppointments} detail={`${overview.pendingAppointments} currently scheduled`} tone="green" />
        <MetricCard label="Collected Revenue" value={formatCurrency(overview.totalRevenue)} detail={`${formatCurrency(overview.outstandingRevenue)} outstanding`} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <div>
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
      </div>
    </div>
  );
}

function DoctorsView({ rows }) {
  return (
    <>
      <SectionHeader title="Doctors" description="Verified clinicians linked to the hospitals you manage." />
      <DataTable
        rows={rows}
        keyFor={(row) => row.doctorId}
        emptyMessage="No doctors are linked to this hospital."
        columns={[
          { label: "Doctor", render: (row) => <div><p className="font-semibold text-[#3D2010]">{fullName(row.user)}</p><p className="mt-1 text-xs text-[#9C8276]">{row.user?.email || row.user?.phoneNumber}</p></div> },
          { label: "Specialization", render: (row) => String(row.specialization || "General").replaceAll("_", " ") },
          { label: "Hospital", render: (row) => row.hospital?.name || "—" },
          { label: "Consultation", render: (row) => formatCurrency(row.consultationFee) },
          { label: "Rating", render: (row) => row.avgRating ? `${row.avgRating} / 5` : "Not rated" },
          { label: "Availability", render: (row) => <StatusBadge value={row.isAvailable ? "ACTIVE" : "UNAVAILABLE"} /> },
        ]}
      />
    </>
  );
}

function ReceptionistsView({ rows }) {
  return (
    <>
      <SectionHeader title="Receptionists" description="Front-desk staff and their assigned shifts." />
      <DataTable
        rows={rows}
        keyFor={(row) => row.receptionistId}
        emptyMessage="No receptionists are assigned to this hospital."
        columns={[
          { label: "Name", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.user)}</span> },
          { label: "Phone", render: (row) => row.user?.phoneNumber || "—" },
          { label: "Email", render: (row) => row.user?.email || "—" },
          { label: "Hospital", render: (row) => row.hospital?.name || "—" },
          { label: "Shift", render: (row) => <StatusBadge value={row.shift || "UNASSIGNED"} /> },
          { label: "Account", render: (row) => <StatusBadge value={row.user?.isActive ? "ACTIVE" : "INACTIVE"} /> },
        ]}
      />
    </>
  );
}

function LabStaffView({ rows }) {
  return (
    <>
      <SectionHeader title="Lab staff" description="Lab managers, departments, and diagnostic capacity." />
      <DataTable
        rows={rows}
        keyFor={(row) => row.managerId}
        emptyMessage="No lab staff are assigned to this hospital."
        columns={[
          { label: "Name", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.user)}</span> },
          { label: "Contact", render: (row) => <div><p>{row.user?.phoneNumber || "—"}</p><p className="mt-1 text-xs text-[#9C8276]">{row.user?.email || "—"}</p></div> },
          { label: "Department", render: (row) => String(row.department || "Unassigned").replaceAll("_", " ") },
          { label: "Hospital", render: (row) => row.hospital?.name || "—" },
          { label: "Labs", render: (row) => row.labs?.map((lab) => lab.name).join(", ") || "No lab assigned" },
          { label: "Available slots", render: (row) => row.labs?.reduce((sum, lab) => sum + Number(lab.availableSlots || 0), 0) || 0 },
        ]}
      />
    </>
  );
}

function AppointmentsView({ rows }) {
  return (
    <>
      <SectionHeader title="Appointments" description="Scheduled and completed encounters with clinical context." />
      <DataTable
        rows={rows}
        keyFor={(row) => row.encounterId}
        emptyMessage="No appointments have been recorded."
        columns={[
          { label: "Patient", render: (row) => <span className="font-semibold text-[#3D2010]">{fullName(row.patient?.user)}</span> },
          { label: "Doctor", render: (row) => fullName(row.doctor?.user) },
          { label: "Date & time", render: (row) => formatDate(row.scheduledTime, true) },
          { label: "Visit", render: (row) => row.visitType },
          { label: "Reason", render: (row) => row.reason || row.chiefComplaint || "General consultation" },
          { label: "Status", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </>
  );
}

function PatientsView({ rows }) {
  return (
    <>
      <SectionHeader title="Patients" description="Patient identities and clinical-history coverage." />
      <DataTable
        rows={rows}
        keyFor={(row) => row.patientId}
        emptyMessage="No patients are available in this hospital scope."
        columns={[
          { label: "Patient", render: (row) => <div><p className="font-semibold text-[#3D2010]">{fullName(row.user)}</p><p className="mt-1 text-xs text-[#9C8276]">{row.user?.phoneNumber}</p></div> },
          { label: "Gender", render: (row) => row.gender ? row.gender[0].toUpperCase() + row.gender.slice(1) : "—" },
          { label: "Date of birth", render: (row) => formatDate(row.dob) },
          { label: "Blood group", render: (row) => String(row.bloodGroup || "—").replace("_", " ") },
          { label: "Conditions", render: (row) => row.chronicConditions?.join(", ") || "None recorded" },
          { label: "Visits", render: (row) => row._count?.encounters || 0 },
        ]}
      />
    </>
  );
}

function LabReportsView({ rows }) {
  return (
    <>
      <SectionHeader title="Lab reports" description="Reported diagnostic results and abnormal-result monitoring." />
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
        <SectionHeader title="Financial reports" description="Invoices, payment status, totals, and due dates." />
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
        <SectionHeader title="Analytics" description="Stored operational and clinical metrics from the VitaData analytics pipeline." />
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

function HospitalSettingsView({ hospitals, selectedId, onSelect, form, onChange, onSave, saving, message }) {
  return (
    <div className="max-w-3xl">
      <SectionHeader title="Hospital settings" description="Update the operational identity shown throughout the admin workspace." />
      <form onSubmit={onSave} className="rounded-2xl border border-[#EEDFD7] bg-white p-6 shadow-sm">
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
              <label className="mb-2 block text-sm font-semibold text-[#554238]">{label}</label>
              <input name={name} value={form[name]} onChange={onChange} required={name !== "state"} className="w-full rounded-xl border border-[#E3D4CC] px-4 py-3 text-sm outline-none focus:border-[#D97757] focus:ring-2 focus:ring-[#D97757]/10" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[#554238]">Address</label>
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
  const [data, setData] = useState(null);
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
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the VitaData API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

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

  const selectedHospital = useMemo(
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

  const adminName = data ? fullName(data.profile) : "Administrator";
  const adminRole = data?.profile?.roles?.includes("SUPER_ADMIN") ? "Super Admin" : "Hospital Admin";

  const renderActiveView = () => {
    if (!data) return null;
    const views = {
      Dashboard: <DashboardOverview data={data} />,
      Doctors: <DoctorsView rows={data.doctors} />,
      Receptionists: <ReceptionistsView rows={data.receptionists} />,
      "Lab Staff": <LabStaffView rows={data.labStaff} />,
      Appointments: <AppointmentsView rows={data.appointments} />,
      Patients: <PatientsView rows={data.patients} />,
      "Lab Reports": <LabReportsView rows={data.labResults} />,
      "Financial Reports": <FinancialReportsView rows={data.invoices} overview={data.overview} />,
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
        />
      ),
    };
    return views[activeNav];
  };

  return (
    <div className="flex min-h-screen bg-[#F9F9F9] font-sans text-[#3D2010]">
      {isSidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed bottom-0 left-0 top-0 z-50 flex w-[250px] shrink-0 flex-col border-r border-[#EEDFD7] bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <button onClick={() => setActiveNav("Dashboard")} className="flex h-[74px] items-center border-b border-[#EEDFD7] px-6 text-left">
          <Image src="/logo.png" alt="VitaData Solutions" width={112} height={56} className="h-12 w-auto object-contain object-left" priority />
        </button>
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
          <button aria-label="Open navigation" className="rounded-lg p-2 text-[#6B554A] hover:bg-[#FFF4EC] lg:hidden" onClick={() => setIsSidebarOpen(true)}>
            <span className="block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-[#9C8276]">VitaData administration</p>
            <p className="text-sm font-bold text-[#3D2010]">{data?.hospitals?.length === 1 ? data.hospitals[0].name : "Healthcare network"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-[#3D2010]">{adminName}</p><p className="text-xs text-[#9C8276]">{adminRole}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0CDBB] bg-[#FFF1E8] text-sm font-bold text-[#D97757]">{adminName.charAt(0)}</div>
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
    </div>
  );
}
