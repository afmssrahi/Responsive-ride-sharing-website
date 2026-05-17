import { useState } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Users, Car, MapPin, BarChart2, Settings,
  LogOut, Menu, Shield, Check, ChevronRight, X,
  Phone, Mail, Clock, Activity, Lock, Globe, Bell, Key,
  AlertTriangle, Download
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SIDEBAR_NAV = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Users", icon: Users },
  { label: "Drivers", icon: Car },
  { label: "Rides", icon: MapPin },
  { label: "Analytics", icon: BarChart2 },
  { label: "Settings", icon: Settings },
];

const ACTIVITY_LOG = [
  { action: "Suspended user account", target: "Sumaiya Khanam", time: "14 min ago", type: "warning" },
  { action: "Approved new driver", target: "Sharmin Akter", time: "1 hour ago", type: "success" },
  { action: "Updated platform commission", target: "20% → 22%", time: "3 hours ago", type: "neutral" },
  { action: "Exported ride report", target: "March 2026", time: "Yesterday", type: "neutral" },
  { action: "Revoked driver access", target: "Monjur Hossain", time: "2 days ago", type: "warning" },
  { action: "Surge multiplier updated", target: "1.4× → 1.6×", time: "3 days ago", type: "neutral" },
  { action: "New admin account created", target: "Tanvir Ahmed", time: "4 days ago", type: "success" },
];

const PERMISSIONS = [
  { perm: "Manage users & accounts", granted: true },
  { perm: "Approve / revoke drivers", granted: true },
  { perm: "View full ride history", granted: true },
  { perm: "Edit platform settings", granted: true },
  { perm: "Export financial reports", granted: true },
  { perm: "Manage admin accounts", granted: false },
];

function dotColor(type: string) {
  if (type === "success") return "bg-green-500";
  if (type === "warning") return "bg-yellow-400";
  return "bg-gray-300";
}

export function AdminAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Personal info
  const [name, setName] = useState(user?.name ?? "Nusrat Jahan");
  const [phone, setPhone] = useState("+880 1711-000001");
  const [dept, setDept] = useState("Operations & Trust");
  const [infoSaved, setInfoSaved] = useState(false);
  function saveInfo() { setInfoSaved(true); setTimeout(() => setInfoSaved(false), 2000); }

  // Preferences
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    smsAlerts: false,
    weeklyReport: true,
    maintenanceMode: false,
  });
  const [lang, setLang] = useState("English (BD)");

  // Password
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwSaved, setPwSaved] = useState(false);
  function savePw() { setPwSaved(true); setTimeout(() => { setPwSaved(false); setShowPw(false); setPw({ current: "", next: "", confirm: "" }); }, 1800); }

  // Activity filter
  const [activityFilter, setActivityFilter] = useState<"all" | "warning" | "success">("all");
  const filteredLog = activityFilter === "all" ? ACTIVITY_LOG : ACTIVITY_LOG.filter(l => l.type === activityFilter);

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Sidebar — dark ───────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-gray-950 text-white flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex`}
        style={{ width: 228 }}
      >
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
          <button onClick={() => navigate("/")} className="block">
            <span className="text-white" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              uni<span className="text-green-400">ride</span>
            </span>
          </button>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Shield className="w-2.5 h-2.5 text-white/30" />
            <span className="text-white/30 text-xs">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {SIDEBAR_NAV.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => { navigate("/admin"); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors text-white/40 hover:text-white/80 hover:bg-white/5"
              style={{ fontSize: "0.82rem", fontWeight: 500 }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" /> {label}
            </button>
          ))}
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left bg-white/10 text-white"
            style={{ fontSize: "0.82rem", fontWeight: 500 }}
          >
            <Shield className="w-3.5 h-3.5 flex-shrink-0" /> My Account
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs font-bold flex-shrink-0">
              {user?.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-white/80 text-xs font-medium truncate">{user?.name}</p>
              <p className="text-white/30 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/30 hover:text-red-400 transition-colors text-xs py-1">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500"><Menu className="w-5 h-5" /></button>
          <span className="text-gray-900 text-sm font-semibold">My Account</span>
        </header>

        <main className="flex-1 overflow-auto">

          {/* ── Editorial Hero ────────────────────────────────────────── */}
          <div className="bg-white border-b border-gray-100">
            <div className="px-6 sm:px-10 lg:px-12 py-10 lg:py-14">
              <div className="max-w-5xl">
                <p className="text-gray-400 mb-3" style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase" }}>
                  Admin Account
                </p>
                <h1
                  className="text-gray-900 mb-8"
                  style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", lineHeight: 1.08, fontWeight: 400 }}
                >
                  Platform trust<br />starts here.
                </h1>

                {/* Admin profile row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                      {user?.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-gray-900 font-bold">{user?.name}</p>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-green-700 text-xs font-medium">Super Admin</span>
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{user?.email}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Operations & Trust &middot; UniRide Bangladesh</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-14 bg-gray-100 flex-shrink-0" />

                  <div className="flex gap-6 sm:gap-10">
                    {[
                      { label: "Actions this month", value: "148" },
                      { label: "Drivers approved", value: "23" },
                      { label: "Admin since", value: "Sep 2024" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-gray-900 font-bold text-sm">{s.value}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Content ───────────────────────────────────────────────── */}
          <div className="px-6 sm:px-10 lg:px-12 py-8 max-w-5xl">
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Left col */}
              <div className="lg:col-span-2 space-y-5">

                {/* Personal Information */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Personal Information</p>
                      <p className="text-gray-400 text-xs mt-0.5">Displayed within the admin panel.</p>
                    </div>
                    <Shield className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Full Name</label>
                        <input
                          value={name} onChange={(e) => setName(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Mobile</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                          <input
                            value={phone} onChange={(e) => setPhone(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                          <input value={user?.email ?? ""} readOnly
                            className="w-full border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Department</label>
                        <input
                          value={dept} onChange={(e) => setDept(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                    </div>
                    <button onClick={saveInfo} className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                      {infoSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save Changes"}
                    </button>
                  </div>
                </section>

                {/* Role & Permissions */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Role & Permissions</p>
                      <p className="text-gray-400 text-xs mt-0.5">Your access level across the platform.</p>
                    </div>
                    <Lock className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-3 mb-5 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 text-sm font-semibold">Super Administrator</p>
                        <p className="text-gray-400 text-xs">Full platform access &middot; Assigned by UniRide BD</p>
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-1">
                      {PERMISSIONS.map((p, i) => (
                        <div key={i} className="flex items-center gap-2.5 py-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.granted ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className={`text-sm ${p.granted ? "text-gray-700" : "text-gray-400"}`}>{p.perm}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs mt-4">Permission changes must be requested through the UniRide operations team.</p>
                  </div>
                </section>

                {/* Activity Log */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Recent Activity</p>
                      <p className="text-gray-400 text-xs mt-0.5">Your last admin actions on the platform.</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(["all", "warning", "success"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setActivityFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${activityFilter === f ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700 border border-gray-100 hover:border-gray-300"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-2">
                    {filteredLog.map((log, i) => (
                      <div key={i} className={`flex items-start gap-3 py-3.5 ${i < filteredLog.length - 1 ? "border-b border-gray-50" : ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${dotColor(log.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-sm font-medium">{log.action}</p>
                          <p className="text-gray-400 text-xs">{log.target}</p>
                        </div>
                        <span className="text-gray-300 text-xs flex-shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {log.time}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-50">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-xs transition-colors">
                      <Download className="w-3 h-3" /> Export full audit log
                    </button>
                  </div>
                </section>

                {/* Preferences */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Preferences</p>
                      <p className="text-gray-400 text-xs mt-0.5">Alerts and system preferences for your session.</p>
                    </div>
                    <Bell className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-2">
                    {[
                      { key: "emailAlerts", label: "Email alerts", desc: "Critical platform events sent to your inbox." },
                      { key: "smsAlerts", label: "SMS alerts", desc: "Urgent notifications via SMS to your registered number." },
                      { key: "weeklyReport", label: "Weekly performance report", desc: "Delivered every Monday at 8 AM." },
                      { key: "maintenanceMode", label: "Maintenance mode notifications", desc: "Notified before any scheduled downtime." },
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between py-4 border-b border-gray-50 last:border-0">
                        <div className="flex-1 pr-8">
                          <p className="text-gray-800 text-sm font-medium">{item.label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setPrefs(p => ({ ...p, [item.key]: !p[item.key as keyof typeof p] }))}
                          className={`relative rounded-full transition-colors flex-shrink-0 mt-0.5 ${prefs[item.key as keyof typeof prefs] ? "bg-gray-900" : "bg-gray-200"}`}
                          style={{ width: 40, height: 22 }}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${prefs[item.key as keyof typeof prefs] ? "left-5" : "left-0.5"}`} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-gray-800 text-sm font-medium">Display language</p>
                        <p className="text-gray-400 text-xs">Interface language for the admin panel.</p>
                      </div>
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                      >
                        <option>English (BD)</option>
                        <option>Bengali</option>
                      </select>
                    </div>
                  </div>
                </section>

              </div>

              {/* ── Right column ────────────────────────────────────────── */}
              <div className="space-y-5">

                {/* Platform pulse */}
                <div className="bg-gray-900 rounded-2xl p-6 text-white">
                  <p className="text-white/40 mb-3" style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase" }}>Platform status</p>
                  <p
                    className="mb-1 text-white"
                    style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.8rem", lineHeight: 1.1, fontWeight: 400 }}
                  >
                    All systems<br />operational.
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-green-400 text-xs">Live &middot; Updated just now</span>
                  </div>
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    {[
                      { label: "Users on platform", value: "12,847" },
                      { label: "Drivers online now", value: "214" },
                      { label: "Rides in progress", value: "97" },
                      { label: "Today's revenue", value: "BDT 3,82,100" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <p className="text-white/40 text-xs">{s.label}</p>
                        <p className="text-white text-xs font-semibold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-gray-900 text-sm font-semibold">Security</p>
                    <Key className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-5 py-3">
                    {!showPw ? (
                      <div className="space-y-0">
                        <div className="flex items-center justify-between py-3 border-b border-gray-50">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">Password</p>
                            <p className="text-gray-400 text-xs">Last changed 1 month ago</p>
                          </div>
                          <button onClick={() => setShowPw(true)} className="text-xs text-gray-500 hover:text-gray-900 underline transition-colors">Change</button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-50">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">Two-factor auth</p>
                            <p className="text-gray-400 text-xs">Enforced for all admin accounts.</p>
                          </div>
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-green-700">Active</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-50">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">Last login</p>
                            <p className="text-gray-400 text-xs">Today, 9:42 AM · Dhaka</p>
                          </div>
                          <Globe className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">Active sessions</p>
                            <p className="text-gray-400 text-xs">1 device signed in</p>
                          </div>
                          <button className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-0.5 transition-colors">
                            View <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 py-2">
                        {[
                          { label: "Current password", key: "current", val: pw.current },
                          { label: "New password", key: "next", val: pw.next },
                          { label: "Confirm new", key: "confirm", val: pw.confirm },
                        ].map((f) => (
                          <div key={f.key}>
                            <label className="block text-gray-400 mb-1 text-xs font-medium">{f.label}</label>
                            <input type="password" value={f.val}
                              onChange={(e) => setPw(p => ({ ...p, [f.key]: e.target.value }))}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button onClick={savePw} className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition-colors">
                            {pwSaved ? "Updated" : "Update"}
                          </button>
                          <button onClick={() => setShowPw(false)} className="text-gray-400 hover:text-gray-700 px-4 py-2 text-xs transition-colors">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-gray-900 text-sm font-semibold">Account</p>
                  </div>
                  <div className="px-5 py-2">
                    <button onClick={handleLogout} className="w-full flex items-center justify-between py-3 text-left border-b border-gray-50 group">
                      <span className="text-gray-600 text-sm group-hover:text-gray-900 flex items-center gap-2.5 transition-colors">
                        <LogOut className="w-3.5 h-3.5 text-gray-400" /> Sign out of admin panel
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between py-3 text-left group">
                      <span className="text-red-400 hover:text-red-600 text-sm transition-colors flex items-center gap-2.5">
                        <X className="w-3.5 h-3.5" /> Request account removal
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
