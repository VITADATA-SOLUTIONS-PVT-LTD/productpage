"use client";

import React from "react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardCalendar from "@/components/DashboardCalendar";

const navItems = [
  "Dashboard",
  "Submit Lab Result",
  "Lab Test Catalog",
  "Lab Results Log",
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
  NORMAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ABNORMAL: "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ value }) {
  const text = value ? "ABNORMAL" : "NORMAL";
  const style = value ? statusStyles.ABNORMAL : statusStyles.NORMAL;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style}`}>
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

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#EEDFD7] bg-white">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#F3DED2] border-t-[#D97757]" />
        <p className="mt-4 text-sm font-medium text-[#8B7469]">Loading laboratory portal data…</p>
      </div>
    </div>
  );
}

export default function LabStaffDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Data States
  const [profile, setProfile] = useState(null);
  const [labTests, setLabTests] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [resultForm, setResultForm] = useState({
    encounterId: "",
    labTestId: "",
    resultValue: "",
    isAbnormal: false,
  });

  const [testForm, setTestForm] = useState({
    testName: "",
    unit: "",
    normalRange: "",
  });

  const labEvents = useMemo(() => {
    const scheduledEvents = encounters.map(e => ({
      date: e.scheduledTime ? e.scheduledTime.split("T")[0] : "",
      type: e.visitType || "Lab Test",
      title: `Encounter: ${fullName(e.patient?.user)}`,
      time: formatDate(e.scheduledTime, true).split(" - ")[1] || formatDate(e.scheduledTime, true),
      details: `Visit Type: ${e.visitType || "OPD"} | Status: ${e.status || "Scheduled"}`
    }));

    const resultEvents = labResults.map(r => ({
      date: r.reportedAt ? r.reportedAt.split("T")[0] : "",
      type: "Lab Report",
      title: `${r.labTest?.testName || "Lab Test"} for ${r.encounter?.patient?.user ? fullName(r.encounter.patient.user) : "Patient"}`,
      time: formatDate(r.reportedAt, true).split(" - ")[1] || formatDate(r.reportedAt, true),
      details: `Value: ${r.resultValue || "—"} ${r.labTest?.unit || ""} | Range: ${r.labTest?.normalRange || "—"} (${r.isAbnormal ? "Abnormal" : "Normal"})`
    }));

    return [...scheduledEvents, ...resultEvents].filter(e => e.date);
  }, [encounters, labResults]);

  const logout = useCallback(() => {
    localStorage.removeItem("labStaffToken");
    localStorage.removeItem("labStaffRoles");
    localStorage.removeItem("labStaffUser");
    localStorage.removeItem("lab_cached_profile");
    localStorage.removeItem("lab_cached_tests");
    document.cookie = "lab_staff_token=; path=/; max-age=0; samesite=lax";
    router.replace("/login");
  }, [router]);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem("labStaffToken");
    if (!token || !apiBaseUrl) {
      logout();
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1. Get profile/hospital info (cached)
      const cachedProfile = getCachedItem("lab_cached_profile");
      let currentProfile = cachedProfile;
      if (!currentProfile) {
        const profileRes = await fetch(`${apiBaseUrl}/users/myinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          currentProfile = profileData.data;
          setCachedItem("lab_cached_profile", currentProfile);
        }
      }
      setProfile(currentProfile);

      // 2. Get lab tests (cached catalog)
      const cachedTests = getCachedItem("lab_cached_tests");
      let currentTests = cachedTests || [];
      if (!cachedTests) {
        const testsRes = await fetch(`${apiBaseUrl}/lab-managers/lab-tests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (testsRes.ok) {
          const testsData = await testsRes.json();
          currentTests = Array.isArray(testsData) ? testsData : [];
          setCachedItem("lab_cached_tests", currentTests);
        }
      }
      setLabTests(currentTests);

      // 3. Get lab results (dynamic log)
      const resultsRes = await fetch(`${apiBaseUrl}/lab-managers/lab-results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        setLabResults(Array.isArray(resultsData) ? resultsData : []);
      }

      // 4. Get encounters to select patient
      const encountersRes = await fetch(`${apiBaseUrl}/encounters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (encountersRes.ok) {
        const encountersData = await encountersRes.json();
        setEncounters(Array.isArray(encountersData) ? encountersData : []);
      }

    } catch (requestError) {
      setError(requestError.message || "Failed to load laboratory data");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const token = localStorage.getItem("labStaffToken");
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

  const staffName = profile ? fullName(profile) : "Lab Manager";
  const hospitalName = profile?.labManager?.hospital?.name || "VITADATA Solutions";

  // Form Submissions
  const handleSubmitResult = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("labStaffToken");
    setSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/lab-managers/lab-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(resultForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit result");

      // OPTIMISTIC LOCAL STATE UPDATE
      const newResult = data.data;
      if (newResult) {
        // Enforce basic relations from selected state
        const selectedEnc = encounters.find(e => e.encounterId === resultForm.encounterId);
        const selectedTest = labTests.find(t => t.labTestId === resultForm.labTestId);
        newResult.encounter = selectedEnc;
        newResult.labTest = selectedTest;
        setLabResults(prev => [newResult, ...prev]);
      }

      setSuccessMsg("Lab result submitted successfully!");
      setResultForm({
        encounterId: "",
        labTestId: "",
        resultValue: "",
        isAbnormal: false,
      });
      setActiveNav("Lab Results Log");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTestType = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("labStaffToken");
    setSubmitting(true);

    try {
      const res = await fetch(`${apiBaseUrl}/lab-managers/lab-tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add test to catalog");

      // OPTIMISTIC LOCAL STATE UPDATE
      const newTest = data.data;
      if (newTest) {
        setLabTests(prev => {
          const next = [newTest, ...prev];
          setCachedItem("lab_cached_tests", next);
          return next;
        });
      }

      setSuccessMsg(`Test type "${testForm.testName}" added successfully.`);
      setTestForm({
        testName: "",
        unit: "",
        normalRange: "",
      });
      setActiveNav("Lab Test Catalog");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Views
  const renderOverview = () => {
    const abnormalCount = labResults.filter(r => r.isAbnormal).length;

    return (
      <div className="space-y-7">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Completed Tests" value={labResults.length} detail="Recorded results log" />
          <MetricCard label="Abnormal Results" value={abnormalCount} detail="Needs medical attention" tone="amber" />
          <MetricCard label="Available Test Types" value={labTests.length} detail="In diagnostics catalog" tone="green" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader title="Recent Lab Reports" description="Latest diagnostic logs recorded." />
            <DataTable
              rows={labResults.slice(0, 10)}
              keyFor={(row) => row.resultId}
              emptyMessage="No lab results recorded."
              columns={[
                { label: "Patient", render: (row) => row.encounter?.patient?.user ? fullName(row.encounter.patient.user) : "Unknown Patient" },
                { label: "Test", render: (row) => row.labTest?.testName || "—" },
                { label: "Value", render: (row) => `${row.resultValue || "—"} ${row.labTest?.unit || ""}` },
                { label: "Reference Range", render: (row) => row.labTest?.normalRange || "—" },
                { label: "Reported At", render: (row) => formatDate(row.reportedAt, true) },
                { label: "Status", render: (row) => <StatusBadge value={row.isAbnormal} /> },
              ]}
            />
          </div>

          <div>
            <DashboardCalendar events={labEvents} />
          </div>
        </div>
      </div>
    );
  };

  const renderSubmitResult = () => {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#3D2010] mb-4">Record Test Result</h2>
          <form onSubmit={handleSubmitResult} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Select Encounter / Patient</label>
              <select
                className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={resultForm.encounterId}
                onChange={e => setResultForm({ ...resultForm, encounterId: e.target.value })}
                required
              >
                <option value="">-- Choose Encounter --</option>
                {encounters.map(enc => (
                  <option key={enc.encounterId} value={enc.encounterId}>
                    {fullName(enc.patient?.user)} - {formatDate(enc.scheduledTime)} ({enc.visitType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Select Test Type</label>
              <select
                className="w-full rounded-xl border border-[#E3D4CC] bg-white px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={resultForm.labTestId}
                onChange={e => setResultForm({ ...resultForm, labTestId: e.target.value })}
                required
              >
                <option value="">-- Choose Test --</option>
                {labTests.map(t => (
                  <option key={t.labTestId} value={t.labTestId}>
                    {t.testName} ({t.unit ? t.unit : "No unit"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Result Value</label>
              <input
                type="text"
                placeholder="e.g. 14.2"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={resultForm.resultValue}
                onChange={e => setResultForm({ ...resultForm, resultValue: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="isAbnormal"
                className="w-4 h-4 rounded border-[#FFCCAC] text-[#D97757] focus:ring-[#D97757]"
                checked={resultForm.isAbnormal}
                onChange={e => setResultForm({ ...resultForm, isAbnormal: e.target.checked })}
              />
              <label htmlFor="isAbnormal" className="text-sm font-semibold text-[#3D2010] cursor-pointer">
                Flag as Abnormal Result
              </label>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white px-5 py-3 text-sm font-semibold transition-colors"
            >
              Record Result
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-[#EEDFD7] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#3D2010] mb-4">Add Test Type to Catalog</h2>
          <form onSubmit={handleCreateTestType} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Test Name</label>
              <input
                type="text"
                placeholder="e.g. Hemoglobin, Lipid Profile"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={testForm.testName}
                onChange={e => setTestForm({ ...testForm, testName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Unit</label>
              <input
                type="text"
                placeholder="e.g. g/dL, mg/dL"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={testForm.unit}
                onChange={e => setTestForm({ ...testForm, unit: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#554238] mb-1.5">Normal Reference Range</label>
              <input
                type="text"
                placeholder="e.g. 12.0 - 16.0"
                className="w-full rounded-xl border border-[#E3D4CC] px-4 py-2.5 text-sm focus:border-[#D97757] focus:outline-none"
                value={testForm.normalRange}
                onChange={e => setTestForm({ ...testForm, normalRange: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#3D2010] hover:bg-[#D97757] text-white px-5 py-3 text-sm font-semibold transition-colors"
            >
              Add Test Type
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderActiveView = () => {
    const views = {
      Dashboard: renderOverview(),
      "Submit Lab Result": renderSubmitResult(),
      "Lab Test Catalog": (
        <>
          <SectionHeader description="Diagnostic catalog containing all verified test parameters." />
          <DataTable
            rows={labTests}
            keyFor={(row) => row.labTestId}
            emptyMessage="No test types defined."
            columns={[
              { label: "Test Name", render: (row) => <span className="font-semibold text-[#3D2010]">{row.testName}</span> },
              { label: "Unit", render: (row) => row.unit || "—" },
              { label: "Normal Range", render: (row) => row.normalRange || "—" },
            ]}
          />
        </>
      ),
      "Lab Results Log": (
        <>
          <SectionHeader description="Logbook of all diagnostic test values reported by lab staff." />
          <DataTable
            rows={labResults}
            keyFor={(row) => row.resultId}
            emptyMessage="No lab results recorded."
            columns={[
              { label: "Patient", render: (row) => row.encounter?.patient?.user ? fullName(row.encounter.patient.user) : "Unknown Patient" },
              { label: "Test", render: (row) => row.labTest?.testName || "—" },
              { label: "Value", render: (row) => `${row.resultValue || "—"} ${row.labTest?.unit || ""}` },
              { label: "Reference Range", render: (row) => row.labTest?.normalRange || "—" },
              { label: "Reported At", render: (row) => formatDate(row.reportedAt, true) },
              { label: "Status", render: (row) => <StatusBadge value={row.isAbnormal} /> },
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
            <p className="text-xs font-medium text-[#9C8276]">Clinical Lab Operations</p>
            <p className="text-sm font-bold text-[#3D2010]">{hospitalName}</p>
          </div>
          <div className="relative flex items-center gap-3">
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 focus:outline-none hover:opacity-90 text-left"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#3D2010]">{staffName}</p>
                <p className="text-xs text-[#9C8276]">Lab Manager</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F0CDBB] bg-[#FFF1E8] text-sm font-bold text-[#D97757]">
                {staffName.charAt(0)}
              </div>
            </button>

            {isProfileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#EEDFD7] bg-white p-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-[#F3EAE5] mb-1">
                    <p className="text-xs text-[#9C8276] font-medium font-sans">Logged in as</p>
                    <p className="text-sm font-bold text-[#3D2010]">{staffName}</p>
                  </div>
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
    </div>
  );
}
