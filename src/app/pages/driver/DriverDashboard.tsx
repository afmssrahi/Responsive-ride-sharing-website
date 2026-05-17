import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Home, Clock, DollarSign, Star, User as UserIcon,
  LogOut, Menu, MessageSquare, Check,
  TrendingUp, Navigation, Car, Loader2, Bell
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../../components/NotificationBell";
import { drivers as driversApi, rides as ridesApi } from "../../services/api";

type Section = "home" | "requests" | "trips" | "earnings" | "ratings" | "profile";

const NAV = [
  { id: "home" as Section, label: "Home", icon: Home },
  { id: "requests" as Section, label: "Ride Requests", icon: Bell },
  { id: "trips" as Section, label: "My Trips", icon: Clock },
  { id: "earnings" as Section, label: "Earnings", icon: DollarSign },
  { id: "ratings" as Section, label: "Ratings", icon: Star },
  { id: "profile" as Section, label: "Profile", icon: UserIcon },
];

// ── Home ──────────────────────────────────────────────────────────────────────
function DriverHome() {
  const [online, setOnline] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    driversApi.getProfile().then(res => {
      setProfileData(res.data);
      setOnline(res.data?.driverProfile?.isOnline || false);
    }).catch(() => {});
  }, []);

  async function toggleOnline() {
    try {
      const res = await driversApi.toggleOnline();
      setOnline(res.data.isOnline);
    } catch { setOnline(!online); }
  }

  const dp = profileData?.driverProfile;
  const todayStats = [
    { label: "Total earnings", value: `BDT ${dp?.totalEarnings?.toLocaleString() || '0'}`, icon: DollarSign },
    { label: "Trips completed", value: String(dp?.totalRides || 0), icon: Navigation },
    { label: "Acceptance rate", value: `${dp?.acceptanceRate || 0}%`, icon: TrendingUp },
    { label: "Rating", value: String(dp?.rating || '—'), icon: Star },
  ];

  return (
    <div className="space-y-5">
      <div className={`rounded-xl p-5 border transition-colors ${online ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold mb-1 ${online ? "text-white" : "text-gray-700"}`} style={{ fontSize: "1rem" }}>
              {online ? "You are online" : "You are offline"}
            </p>
            <p className={`text-sm ${online ? "text-white/50" : "text-gray-400"}`}>
              {online ? "Accepting ride requests in your area." : "Go online to start earning."}
            </p>
          </div>
          <button onClick={toggleOnline}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${online ? "bg-green-500" : "bg-gray-200"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${online ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {todayStats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-2">{s.label}</p>
            <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── My Trips ──────────────────────────────────────────────────────────────────
function MyTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.getTrips().then(res => setTrips(res.trips || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>My Trips</h2>
        <p className="text-gray-400 text-sm">{trips.length} trips.</p>
      </div>
      {trips.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center"><p className="text-gray-400 text-sm">No trips yet.</p></div>
      ) : (
        <div className="space-y-3">
          {trips.map((t: any) => (
            <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{t.pickupLocation} &rarr; {t.dropoffLocation}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{new Date(t.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })}</p>
                </div>
                <p className="text-gray-900 font-semibold text-sm">BDT {t.totalFare || t.baseFare || '—'}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-50 justify-between">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.status}</span>
                {(t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS') && (
                  <button onClick={() => navigate(`/chat/${t.id}`)}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pending Ride Requests (ON_DEMAND) ─────────────────────────────────────────
function PendingRides() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    ridesApi.getPendingRequests()
      .then(res => setRides(res.rides || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleAccept(rideId: string) {
    setAccepting(rideId);
    try {
      await ridesApi.accept(rideId);
      setRides(prev => prev.filter(r => r.id !== rideId));
      navigate(`/chat/${rideId}`);
    } catch (err: any) {
      alert(err?.data?.message || 'Could not accept ride');
    } finally {
      setAccepting(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Ride Requests</h2>
          <p className="text-gray-400 text-sm">{rides.length} pending requests near you.</p>
        </div>
        <button onClick={load} className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">Refresh</button>
      </div>
      {rides.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <Car className="w-8 h-8 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No pending ride requests right now.</p>
          <p className="text-gray-300 text-xs mt-1">Check back shortly or go online to receive requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((r: any) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {r.creator?.avatar || 'U'}
                    </div>
                    <span className="text-gray-900 font-semibold text-sm">{r.creator?.name || 'Passenger'}</span>
                  </div>
                  <div className="space-y-1 ml-8">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{r.pickupLocation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{r.dropoffLocation}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-gray-300 text-xs mt-0.5">#{r.rideCode}</p>
                </div>
              </div>
              <button
                onClick={() => handleAccept(r.id)}
                disabled={accepting === r.id}
                className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {accepting === r.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting…</> : <><Check className="w-4 h-4" /> Accept Ride</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



// ── Earnings ──────────────────────────────────────────────────────────────────
function Earnings() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.getEarnings(period).then(res => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  const total = data?.totalEarnings || 0;
  const chartData = data?.dailyBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Earnings</h2>
          <p className="text-gray-400 text-sm">Your earnings breakdown.</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["week", "month"] as const).map((p) => (
            <button key={p} onClick={() => { setLoading(true); setPeriod(p); }}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
              {p === "week" ? "This week" : "This month"}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 rounded-xl p-6 text-white">
        <p className="text-white/40 text-xs mb-1 uppercase tracking-wide">{period === "week" ? "This week's earnings" : "This month's earnings"}</p>
        <p style={{ fontWeight: 900, fontSize: "2.2rem", letterSpacing: "-0.03em" }}>BDT {total.toLocaleString()}</p>
        <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
          <div><p className="text-white/40 text-xs">Trips</p><p className="text-white font-semibold text-sm mt-0.5">{data?.totalTrips || 0}</p></div>
          <div><p className="text-white/40 text-xs">Avg per trip</p><p className="text-white font-semibold text-sm mt-0.5">BDT {data?.totalTrips ? Math.round(total / data.totalTrips) : 0}</p></div>
        </div>
      </div>
      {chartData.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          <p className="text-gray-900 font-semibold text-sm mb-4">Daily Earnings (BDT)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={26}>
              <XAxis key="drv-x" dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis key="drv-y" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `BDT${(v / 1000).toFixed(1)}k`} />
              <Tooltip key="drv-tip" formatter={(v) => [`BDT ${Number(v).toLocaleString()}`, "Earnings"]} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11, boxShadow: "none" }} />
              <Bar key="drv-bar" dataKey="amount" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Ratings ───────────────────────────────────────────────────────────────────
function Ratings() {
  const [ratingsData, setRatingsData] = useState<any[]>([]);
  const [avg, setAvg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.getRatings().then(res => { setRatingsData(res.ratings || []); setAvg(res.avg || 0); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Ratings</h2>
        <p className="text-gray-400 text-sm">What passengers are saying about you.</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 flex items-center gap-8">
        <div className="text-center flex-shrink-0">
          <p style={{ fontWeight: 900, fontSize: "2.8rem", letterSpacing: "-0.04em", color: "#111827" }}>{avg.toFixed(1)}</p>
          <div className="flex justify-center gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avg) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />)}
          </div>
          <p className="text-gray-400 text-xs">{ratingsData.length} ratings</p>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-gray-700 font-semibold text-sm">Recent comments</p>
        {ratingsData.length === 0 && <p className="text-gray-400 text-sm">No ratings yet.</p>}
        {ratingsData.map((r: any, i: number) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">{r.fromUser?.name?.[0] || '?'}</div>
                <span className="text-gray-800 text-sm font-semibold">{r.fromUser?.name || 'Passenger'}</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, j) => <Star key={j} className={`w-3 h-3 ${j < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />)}
              </div>
            </div>
            {r.comment && <p className="text-gray-500 text-sm" style={{ lineHeight: 1.6 }}>{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function DriverProfile({ user }: { user: { name: string; email: string; avatar: string } }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [plate, setPlate] = useState("");
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    driversApi.getProfile().then(res => {
      const d = res.data;
      setProfileData(d);
      setPhone(d?.phone || "");
      const v = d?.vehicles?.[0];
      if (v) { setVehicle(`${v.make} ${v.model}`); setPlate(v.plate); }
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await driversApi.updateProfile({ phone });
      if (vehicle || plate) await driversApi.updateVehicle({ model: vehicle, plate });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }

  const dp = profileData?.driverProfile;

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Driver Profile</h2>
        <p className="text-gray-400 text-sm">Your driver account information.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">{user.avatar}</div>
        <div>
          <p className="text-gray-900 font-bold">{user.name}</p>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.round(dp?.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />)}
            <span className="text-gray-300 text-xs ml-1.5">{dp?.rating || '—'} &middot; {dp?.totalRides || 0} trips</span>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <p className="text-gray-700 text-sm font-semibold">Personal</p>
        <div className="h-px bg-gray-100" />
        <div>
          <label className="block text-gray-500 mb-1.5 text-xs font-medium">Mobile Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors" />
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <p className="text-gray-700 text-sm font-semibold">Vehicle</p>
        <div className="h-px bg-gray-100" />
        <div>
          <label className="block text-gray-500 mb-1.5 text-xs font-medium">Vehicle Model</label>
          <input value={vehicle} onChange={(e) => setVehicle(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors" />
        </div>
        <div>
          <label className="block text-gray-500 mb-1.5 text-xs font-medium">Registration Plate</label>
          <input value={plate} onChange={(e) => setPlate(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors" />
        </div>
      </div>
      {dp?.isApproved && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-gray-700 font-semibold text-sm">Background Verification</p>
            <p className="text-gray-400 text-xs mt-0.5">Passed {dp?.verifiedAt ? new Date(dp.verifiedAt).toLocaleDateString('en-BD', { month: 'long', year: 'numeric' }) : ''}</p>
          </div>
          <span className="text-green-700 text-xs font-medium border border-green-200 px-2.5 py-1 rounded-full">Verified</span>
        </div>
      )}
      <button onClick={save} disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export function DriverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() { logout(); navigate("/login"); }

  const sectionMap: Record<Section, JSX.Element> = {
    home: <DriverHome />,
    requests: <PendingRides />,
    trips: <MyTrips />,
    earnings: <Earnings />,
    ratings: <Ratings />,
    profile: <DriverProfile user={user!} />,
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`} style={{ width: 220 }}>
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            uni<span className="text-green-600">ride</span>
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Car className="w-2.5 h-2.5 text-gray-400" />
            <p className="text-gray-400 text-xs">Driver Portal</p>
          </div>
        </div>
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { 
              if (id === "profile") { navigate("/driver/account"); setSidebarOpen(false); }
              else { setSection(id); setSidebarOpen(false); }
            }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${section === id ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"}`}
              style={{ fontSize: "0.8rem", fontWeight: 500 }}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" /> {label}
            </button>
          ))}
        </nav>
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">{user?.avatar}</div>
            <div className="min-w-0">
              <p className="text-gray-900 text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors text-xs">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-5 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500"><Menu className="w-5 h-5" /></button>
            <p className="text-gray-900 text-sm font-semibold">{NAV.find(n => n.id === section)?.label}</p>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 px-5 sm:px-8 py-8 overflow-auto">
          {sectionMap[section]}
        </main>
      </div>
    </div>
  );
}