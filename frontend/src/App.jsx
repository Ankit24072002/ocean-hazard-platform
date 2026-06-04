import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  Flame,
  Layers,
  LogOut,
  Map,
  Menu,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
  UserRound,
  Waves,
  X
} from "lucide-react";
import AuthForm from "./components/Authform.jsx";
import MapView from "./components/MapView.jsx";
import ReportForm from "./components/ReportForm.jsx";
import { toast } from "react-hot-toast";

const API = import.meta.env.VITE_API || "http://localhost:4000";

const fallbackReports = [
  {
    id: "sample-1",
    hazard_type: "High Waves",
    description: "Strong wave run-up reported near fishing harbour.",
    status: "pending",
    credibility: 0.76,
    lat: 9.9312,
    lon: 76.2673,
    created_at: new Date().toISOString()
  },
  {
    id: "sample-2",
    hazard_type: "Coastal Flooding",
    description: "Beach road is waterlogged after high tide.",
    status: "verified",
    credibility: 0.88,
    lat: 13.0827,
    lon: 80.2707,
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

const navItems = [
  ["dashboard", "Dashboard", BarChart3],
  ["map", "Map", Map],
  ["report", "Report", AlertTriangle],
  ["social", "Social", Radio],
  ["roles", "Access", ShieldCheck]
];

export default function App() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    try {
      return token && user ? { token, user: JSON.parse(user) } : null;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [filters, setFilters] = useState({ type: "all", status: "all", search: "" });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const isPrivileged = ["analyst", "official"].includes(session?.user?.role);

  useEffect(() => {
    if (session) refreshData();
  }, [session]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const encodedUser = params.get("user");

    if (!token || !encodedUser) return;

    try {
      const user = JSON.parse(atobUrl(encodedUser));
      handleLogin({ token, user });
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  async function refreshData() {
    setLoading(true);
    try {
      const [reportsRes, socialRes, warningsRes, hotspotsRes] = await Promise.all([
        fetch(`${API}/api/reports`),
        fetch(`${API}/api/social`),
        fetch(`${API}/api/social/warnings`),
        fetch(`${API}/api/reports/analytics/hotspots`)
      ]);

      setReports(reportsRes.ok ? await reportsRes.json() : fallbackReports);
      setSocialPosts(socialRes.ok ? await socialRes.json() : []);
      setWarnings(warningsRes.ok ? await warningsRes.json() : []);
      setHotspots(hotspotsRes.ok ? await hotspotsRes.json() : []);
    } catch {
      setReports(fallbackReports);
      setSocialPosts([]);
      setWarnings([]);
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  }

  function handleLogin(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setSession(data);
  }

  function logout(message) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession(null);
    // Avoid showing blocking alert popups (they can show [object Object]).
    // Log the message for debugging instead.
    if (message) {
      try {
        if (typeof message === "string") console.info(message);
        else console.info(JSON.stringify(message));
        if (typeof message === "string") toast.error(message);
        else toast.error("Session ended");
      } catch {
        console.info(message);
      }
    } else {
      toast.success("Signed out successfully");
    }
  }

  async function verifyReport(report, status) {
    try {
      const res = await fetch(`${API}/api/reports/${report.id}/verify`, {
    const promise = fetch(`${API}/api/reports/${report.id}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ status, note: `Marked ${status} from dashboard` })
      });
      }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        logout(data.error || "Your session expired. Please sign in again.");
        return;
          throw new Error("Session expired");
      }
      if (!res.ok) throw new Error(data.error || "Failed to update report status");
        return data;
      });

      const updated = data;
      setReports((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      alert(error.message);
    }
    toast.promise(promise, {
      loading: "Updating status...",
      success: (updated) => {
        setReports((items) => items.map((item) => (item.id === updated.id ? updated : item)));
        return `Report marked as ${status}`;
      },
      error: (err) => err.message || "Action failed"
    });
  }

  async function chooseRole(role) {
    try {
      const res = await fetch(`${API}/api/auth/me/role`, {
    const promise = fetch(`${API}/api/auth/me/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify({ role })
      });
      }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        logout(data.error || "Your session expired. Please sign in again.");
        return;
          throw new Error("Session expired");
      }
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      handleLogin(data);
    } catch (error) {
      alert(error.message);
    }
        return data;
      });

    toast.promise(promise, {
      loading: "Setting role...",
      success: (data) => {
        handleLogin(data);
        return "Role updated successfully";
      },
      error: (err) => err.message || "Failed to update role"
    });
  }

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const typeOk = filters.type === "all" || report.hazard_type === filters.type;
      const statusOk = filters.status === "all" || report.status === filters.status;
      const q = filters.search.toLowerCase();
      const searchOk =
        !q ||
        report.description?.toLowerCase().includes(q) ||
        report.hazard_type?.toLowerCase().includes(q);
      return typeOk && statusOk && searchOk;
    });
  }, [reports, filters]);

  const hazardTypes = useMemo(
    () => ["all", ...new Set(reports.map((report) => report.hazard_type).filter(Boolean))],
    [reports]
  );

  const urgentSignals = socialPosts.filter((post) => post.urgency === "high").length;
  const verifiedReports = reports.filter((report) => report.status === "verified").length;
  const pendingReports = reports.filter((report) => !report.status || report.status === "pending").length;
  const stats = [
    { label: "Citizen reports", value: reports.length, detail: `${pendingReports} pending`, icon: AlertTriangle, tone: "cyan" },
    { label: "Verified reports", value: verifiedReports, detail: "Field-confirmed", icon: CheckCircle2, tone: "emerald" },
    { label: "Social signals", value: socialPosts.length, detail: `${urgentSignals} high urgency`, icon: Radio, tone: "blue" },
    { label: "Active warnings", value: warnings.length, detail: `${hotspots.length} hotspots`, icon: Bell, tone: "amber" }
  ];

  if (!session) {
    return <AuthForm onLogin={handleLogin} />;
  }

  if (session.user.role === "pending") {
    return <RoleSetup user={session.user} onChoose={chooseRole} onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col">
          <BrandBlock />
          <NavRail activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-auto border-t border-white/10 p-4">
            <UserBadge user={session.user} dark />
            <button
              onClick={logout}
              className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-white/10 px-3 text-sm font-medium hover:bg-white/15"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-6">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 lg:hidden"
                title="Open navigation"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Live coastal intelligence</p>
                <h1 className="truncate text-lg font-semibold md:text-2xl">{titleFor(activeTab)}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshData}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <div className="hidden md:block">
                  <UserBadge user={session.user} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
              {navItems.map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium ${
                    activeTab === id ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </header>

          {mobileNavOpen && (
            <MobileDrawer
              user={session.user}
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileNavOpen(false);
              }}
              close={() => setMobileNavOpen(false)}
              logout={logout}
            />
          )}

          <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6">
            {activeTab === "dashboard" && (
              <Dashboard
                stats={stats}
                reports={filteredReports}
                warnings={warnings}
                hotspots={hotspots}
                filters={filters}
                setFilters={setFilters}
                hazardTypes={hazardTypes}
                canVerify={isPrivileged}
                onVerify={verifyReport}
                socialPosts={socialPosts}
              />
            )}

            {activeTab === "map" && (
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
                <MapView
                  reports={filteredReports}
                  warnings={warnings}
                  hotspots={hotspots}
                  socialPosts={socialPosts}
                  onMapClick={(latlng) => setSelectedLocation({ lat: latlng.lat, lon: latlng.lng })}
                />
                <ReportForm
                  onCreated={(report) => setReports((items) => [report, ...items])}
                  defaultLat={selectedLocation?.lat?.toFixed(5) || ""}
                  defaultLon={selectedLocation?.lon?.toFixed(5) || ""}
                />
              </section>
            )}

            {activeTab === "report" && (
              <section className="grid gap-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(280px,0.28fr)]">
                <ReportForm onCreated={(report) => setReports((items) => [report, ...items])} />
                <QuickGuide />
              </section>
            )}

            {activeTab === "social" && <SocialPanel posts={socialPosts} />}

            {activeTab === "roles" && <RolePanel role={session.user.role} />}
          </main>
        </section>
      </div>
    </div>
  );
}

function BrandBlock() {
  return (
    <div className="border-b border-white/10 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500 text-slate-950">
          <Waves size={27} />
        </div>
        <div>
          <p className="text-lg font-semibold">Ocean Hazard</p>
          <p className="text-sm text-cyan-100">Operations platform</p>
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <Activity size={16} />
          Response status
        </div>
        <p className="mt-2 text-2xl font-semibold">Monitoring</p>
        <p className="mt-1 text-xs text-slate-300">Citizen and social signals are being evaluated.</p>
      </div>
    </div>
  );
}

function NavRail({ activeTab, setActiveTab }) {
  return (
    <nav className="space-y-1 p-4">
      {navItems.map(([id, label, Icon]) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
            activeTab === id ? "bg-cyan-500 text-slate-950" : "text-slate-200 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function MobileDrawer({ user, activeTab, setActiveTab, close, logout }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button className="absolute inset-0 bg-slate-950/45" onClick={close} aria-label="Close navigation" />
      <aside className="relative flex h-full w-[min(88vw,320px)] flex-col bg-slate-950 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500 text-slate-950">
              <Waves size={22} />
            </div>
            <p className="font-semibold">Ocean Hazard</p>
          </div>
          <button onClick={close} className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10" title="Close">
            <X size={18} />
          </button>
        </div>
        <NavRail activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-auto border-t border-white/10 p-4">
          <UserBadge user={user} dark />
          <button onClick={logout} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-white/10 text-sm font-medium">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}

function Dashboard({ stats, reports, warnings, hotspots, filters, setFilters, hazardTypes, canVerify, onVerify, socialPosts }) {
  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-cyan-900/10 bg-slate-950 text-white">
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-cyan-400/15 px-3 py-1 text-sm font-medium text-cyan-100">
              <Siren size={16} />
              Integrated coastal command view
            </div>
            <h2 className="mt-4 text-2xl font-semibold md:text-3xl">Reports, warnings, and public chatter in one place.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Track crowdsourced incidents, inspect social media urgency, and prioritize official verification from a responsive dashboard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-80">
            <SignalChip label="Map layers" value="4 active" icon={Layers} />
            <SignalChip label="Priority queue" value={`${reports.length} items`} icon={Clock3} />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Filters filters={filters} setFilters={setFilters} hazardTypes={hazardTypes} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <ReportTable reports={reports} canVerify={canVerify} onVerify={onVerify} />
        <div className="space-y-5">
          <WarningPanel warnings={warnings} hotspots={hotspots} />
          <SocialSummary posts={socialPosts} />
        </div>
      </div>
    </section>
  );
}

function SignalChip({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 text-slate-300">
        <Icon size={15} />
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function StatCard({ label, value, detail, icon: Icon, tone }) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700"
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function Filters({ filters, setFilters, hazardTypes }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Filter size={16} />
        Filters
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
        <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-cyan-700">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search by hazard, report, or location context"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <select
          value={filters.type}
          onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
          className="min-h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700"
        >
          {hazardTypes.map((type) => (
            <option key={type} value={type}>
              {type === "all" ? "All hazards" : type}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          className="min-h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
  );
}

function ReportTable({ reports, canVerify, onVerify }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Citizen Report Queue</h2>
          <p className="text-sm text-slate-500">Latest incoming field signals requiring review.</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{reports.length} shown</span>
      </div>

      {reports.length === 0 ? (
        <EmptyState title="No reports match the filters" detail="Clear search or submit a new citizen report to populate the queue." />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Hazard</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Credibility</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{report.hazard_type || "Unknown"}</td>
                    <td className="max-w-md px-4 py-3 text-slate-700">{report.description}</td>
                    <td className="px-4 py-3">
                      <Credibility value={report.credibility || 0} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={report.status || "pending"} />
                    </td>
                    <td className="px-4 py-3">
                      <ReportActions report={report} canVerify={canVerify} onVerify={onVerify} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 md:hidden">
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} canVerify={canVerify} onVerify={onVerify} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReportCard({ report, canVerify, onVerify }) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{report.hazard_type || "Unknown"}</p>
          <p className="mt-1 text-sm text-slate-600">{report.description}</p>
        </div>
        <StatusBadge status={report.status || "pending"} />
      </div>
      <div className="mt-4">
        <Credibility value={report.credibility || 0} />
      </div>
      <div className="mt-4">
        <ReportActions report={report} canVerify={canVerify} onVerify={onVerify} />
      </div>
    </article>
  );
}

function ReportActions({ report, canVerify, onVerify }) {
  if (!canVerify) return <span className="text-xs text-slate-500">Citizen view</span>;

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onVerify(report, "verified")} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
        Verify
      </button>
      <button onClick={() => onVerify(report, "rejected")} className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">
        Reject
      </button>
    </div>
  );
}

function Credibility({ value }) {
  const pct = Math.round(value * 100);
  return (
    <div className="min-w-28">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{pct}%</span>
        <span>{pct >= 75 ? "high" : pct >= 45 ? "medium" : "low"}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-cyan-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200"
  };
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ring-1 ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

function WarningPanel({ warnings, hotspots }) {
  return (
    <div className="space-y-5">
      <Panel title="Official Warnings" icon={Bell}>
        <div className="space-y-3">
          {warnings.map((warning) => (
            <div key={warning.id} className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="font-medium text-amber-950">{warning.title}</p>
              <p className="mt-1 text-sm text-amber-800">{warning.area} - {warning.severity}</p>
            </div>
          ))}
          {!warnings.length && <EmptyState compact title="No active warnings" detail="Official alerts will appear here." />}
        </div>
      </Panel>
      <Panel title="Detected Hotspots" icon={Flame}>
        <div className="space-y-2">
          {hotspots.map((hotspot, index) => (
            <div key={`${hotspot.lat}-${hotspot.lon}-${index}`} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-medium">{hotspot.hazard_type || "Hazard"} cluster</p>
              <p className="mt-1 text-slate-600">{hotspot.lat}, {hotspot.lon} with {hotspot.count} signals</p>
            </div>
          ))}
          {!hotspots.length && <EmptyState compact title="No hotspots yet" detail="Clusters appear after reports group by location." />}
        </div>
      </Panel>
    </div>
  );
}

function SocialSummary({ posts }) {
  const highUrgency = posts.filter((post) => post.urgency === "high").slice(0, 3);
  return (
    <Panel title="High Urgency Chatter" icon={Radio}>
      <div className="space-y-3">
        {highUrgency.map((post) => (
          <div key={post.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{post.platform}</p>
              <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">High</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{post.content}</p>
          </div>
        ))}
        {!highUrgency.length && <EmptyState compact title="No high urgency chatter" detail="Social monitor has no high-priority posts." />}
      </div>
    </Panel>
  );
}

function SocialPanel({ posts }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="font-semibold">Social Media NLP Monitor</h2>
        <p className="text-sm text-slate-500">Hazard keywords, language, sentiment, and urgency from public chatter.</p>
      </div>
      {posts.length === 0 ? (
        <EmptyState title="No social posts loaded" detail="Demo or ingested social signals will appear here." />
      ) : (
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{post.platform}</span>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${post.urgency === "high" ? "bg-rose-50 text-rose-700" : "bg-cyan-50 text-cyan-800"}`}>
                  {post.urgency || "low"} urgency
                </span>
              </div>
              <p className="text-sm leading-6 text-slate-700">{post.content}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{post.hazard_type || "unknown"}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{post.language || "en"}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{post.sentiment || "informative"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RolePanel({ role }) {
  const rows = [
    ["citizen", "Citizen", "Submit geotagged reports, save offline drafts, and view own submissions."],
    ["analyst", "Analyst", "Review social chatter, verify reports, and inspect hotspot clusters."],
    ["official", "Government official", "Use the operations dashboard for warnings, verification, and response prioritization."]
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Role-Based Access</h2>
      <p className="mt-1 text-sm text-slate-500">Your current role controls verification and operational tools.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {rows.map(([name, title, detail]) => (
          <div key={name} className={`rounded-lg border p-4 ${role === name ? "border-cyan-700 bg-cyan-50" : "border-slate-200"}`}>
            <p className="font-medium">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickGuide() {
  return (
    <Panel title="Report Quality Checklist" icon={ShieldCheck}>
      <div className="space-y-3 text-sm text-slate-600">
        <p>Use current GPS location or tap the map first for precise coordinates.</p>
        <p>Include visible impact, nearest landmark, and whether people are in immediate danger.</p>
        <p>Attach a clear photo or video when possible to improve credibility scoring.</p>
      </div>
    </Panel>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={17} className="text-cyan-700" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, detail, compact = false }) {
  return (
    <div className={`text-center ${compact ? "py-4" : "px-4 py-12"}`}>
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function UserBadge({ user, dark = false }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-md border px-3 py-2 text-sm ${dark ? "border-white/10 bg-white/5 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
      <UserRound size={16} className="shrink-0" />
      <span className="truncate">{user.name}</span>
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs capitalize ${dark ? "bg-white/10 text-cyan-100" : "bg-cyan-50 text-cyan-800"}`}>
        {user.role}
      </span>
    </div>
  );
}

function RoleSetup({ user, onChoose, onLogout }) {
  const options = [
    ["citizen", "Citizen", "Submit geotagged hazard reports and track your submissions."],
    ["analyst", "Analyst", "Review social media signals, report credibility, and hotspots."],
    ["official", "Government official", "Use the operations dashboard for verification and response."]
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-950">
      <section className="w-full max-w-4xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-cyan-800">Google registration successful</p>
            <h1 className="mt-1 text-2xl font-semibold">Choose your access type</h1>
            <p className="mt-2 text-sm text-slate-600">
              Signed in as {user.name} ({user.email})
            </p>
          </div>
          <button onClick={onLogout} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">
            Sign out
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {options.map(([role, title, detail]) => (
            <button
              key={role}
              onClick={() => onChoose(role)}
              className="min-h-44 rounded-lg border border-slate-200 p-5 text-left transition hover:border-cyan-700 hover:bg-cyan-50"
            >
              <p className="text-lg font-semibold">{title}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function titleFor(tab) {
  const titles = {
    dashboard: "Operations Dashboard",
    map: "Hazard Map",
    report: "Citizen Reporting",
    social: "Social Media Analysis",
    roles: "Access Control"
  };
  return titles[tab] || "Ocean Hazard Platform";
}

function atobUrl(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}
