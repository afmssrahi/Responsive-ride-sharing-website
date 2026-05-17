import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Home, Clock, DollarSign, Star, User as UserIcon,
  LogOut, Menu, Car, Shield, Check, ChevronRight,
  Phone, Mail, FileText, X, Smartphone, Camera, MapPin,
  TrendingUp, AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SIDEBAR_NAV = [
  { label: "Home", icon: Home },
  { label: "My Trips", icon: Clock },
  { label: "Earnings", icon: DollarSign },
  { label: "Ratings", icon: Star },
];

const DOCUMENTS = [
  { label: "National ID (NID)", info: "Issued: BRTA 2021", verified: true },
  { label: "Driving Licence", info: "Expires: March 2027 · Class B", verified: true },
  { label: "Vehicle Registration", info: "Dhaka Metro-G 11-2345", verified: true },
  { label: "Background Check", info: "Completed: November 2024", verified: true },
  { label: "Vehicle Insurance", info: "Green Delta Insurance · Expires Dec 2025", verified: false },
];

function StatusDot({ verified }: { verified: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${verified ? "bg-green-500" : "bg-gray-300"}`} />
      <span className={`text-xs ${verified ? "text-green-700" : "text-gray-400"}`}>{verified ? "Verified" : "Pending review"}</span>
    </span>
  );
}

export function DriverAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Personal info
  const [name, setName] = useState(user?.name ?? "Rasel Miah");
  const [phone, setPhone] = useState("+880 1700-847293");
  const [address, setAddress] = useState("Mirpur-10, Dhaka 1216");
  const [infoSaved, setInfoSaved] = useState(false);
  function saveInfo() { setInfoSaved(true); setTimeout(() => setInfoSaved(false), 2000); }

  // Vehicle info
  const [vehicle, setVehicle] = useState({
    model: "Toyota Allion",
    year: "2019",
    color: "Silver",
    plate: "Dhaka Metro-G 11-2345",
  });
  const [vehicleSaved, setVehicleSaved] = useState(false);
  function saveVehicle() { setVehicleSaved(true); setTimeout(() => setVehicleSaved(false), 2000); }

  // Payout
  const [payout, setPayout] = useState({ method: "bKash", number: "01700-847293", schedule: "weekly" });
  const [payoutSaved, setPayoutSaved] = useState(false);
  function savePayout() { setPayoutSaved(true); setTimeout(() => setPayoutSaved(false), 2000); }

  // Work preferences
  const [zones, setZones] = useState("Gulshan, Banani, Baridhara");
  const [maxDist, setMaxDist] = useState("30");
  const [airportTrips, setAirportTrips] = useState(true);
  const [nightShift, setNightShift] = useState(false);
  const [workSaved, setWorkSaved] = useState(false);
  function saveWork() { setWorkSaved(true); setTimeout(() => setWorkSaved(false), 2000); }

  // Password
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwSaved, setPwSaved] = useState(false);
  function savePw() { setPwSaved(true); setTimeout(() => { setPwSaved(false); setShowPw(false); setPw({ current: "", next: "", confirm: "" }); }, 1800); }

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex`}
        style={{ width: 224 }}
      >
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <button onClick={() => navigate("/")} className="block">
            <span className="text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              uni<span className="text-green-600">ride</span>
            </span>
          </button>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Car className="w-2.5 h-2.5 text-gray-400" />
            <p className="text-gray-400 text-xs">Driver Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {SIDEBAR_NAV.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => { navigate("/driver"); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              style={{ fontSize: "0.82rem", fontWeight: 500 }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" /> {label}
            </button>
          ))}
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left bg-gray-900 text-white"
            style={{ fontSize: "0.82rem", fontWeight: 500 }}
          >
            <UserIcon className="w-3.5 h-3.5 flex-shrink-0" /> Account
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors text-xs">
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500"><Menu className="w-5 h-5" /></button>
          <span className="text-gray-900 text-sm font-semibold">Account</span>
        </header>

        <main className="flex-1 overflow-auto">

          {/* ── Editorial Hero ────────────────────────────────────────── */}
          <div className="bg-white border-b border-gray-100">
            <div className="px-6 sm:px-10 lg:px-12 py-10 lg:py-14">
              <div className="max-w-5xl">
                <p className="text-gray-400 mb-3" style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase" }}>
                  Driver Account
                </p>
                <h1
                  className="text-gray-900 mb-8"
                  style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", lineHeight: 1.08, fontWeight: 400 }}
                >
                  Road life,<br />your terms.
                </h1>

                {/* Driver profile row */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-8">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-base">
                        {user?.avatar}
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors shadow-sm">
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-gray-900 font-bold">{user?.name}</p>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          <span className="text-green-700 text-xs font-medium">Verified driver</span>
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{user?.email}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                        ))}
                        <span className="text-gray-400 text-xs ml-1">4.9 &middot; 312 trips</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-16 bg-gray-100 flex-shrink-0" />

                  {/* Vehicle callout */}
                  <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <Car className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">{vehicle.model} · {vehicle.color}</p>
                      <p className="text-gray-400 text-xs">{vehicle.plate} &middot; {vehicle.year}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-16 bg-gray-100 flex-shrink-0" />

                  <div className="flex gap-6 sm:gap-8">
                    {[
                      { label: "Total earnings", value: "BDT 28,410" },
                      { label: "Acceptance rate", value: "92%" },
                      { label: "On platform", value: "Aug 2024" },
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
                      <p className="text-gray-400 text-xs mt-0.5">Visible only to UniRide administrators.</p>
                    </div>
                    <UserIcon className="w-4 h-4 text-gray-200" />
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
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Mobile Number</label>
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
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Home Area</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                          <input
                            value={address} onChange={(e) => setAddress(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <button onClick={saveInfo} className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                      {infoSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save Changes"}
                    </button>
                  </div>
                </section>

                {/* Vehicle Information */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Vehicle Information</p>
                      <p className="text-gray-400 text-xs mt-0.5">Changes require admin approval before going live.</p>
                    </div>
                    <Car className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Make & Model</label>
                        <input value={vehicle.model} onChange={(e) => setVehicle(v => ({ ...v, model: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Year</label>
                        <input value={vehicle.year} onChange={(e) => setVehicle(v => ({ ...v, year: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Colour</label>
                        <input value={vehicle.color} onChange={(e) => setVehicle(v => ({ ...v, color: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Registration Plate</label>
                        <input value={vehicle.plate} onChange={(e) => setVehicle(v => ({ ...v, plate: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 p-3.5 bg-gray-50 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-500 text-xs">Plate and model changes will be paused for review. Your account remains active in the meantime.</p>
                    </div>
                    <button onClick={saveVehicle} className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                      {vehicleSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save Changes"}
                    </button>
                  </div>
                </section>

                {/* Documents */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Documents & Verification</p>
                      <p className="text-gray-400 text-xs mt-0.5">Your compliance status for all required papers.</p>
                    </div>
                    <FileText className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-2">
                    {DOCUMENTS.map((doc, i) => (
                      <div key={i} className={`flex items-center justify-between py-3.5 ${i < DOCUMENTS.length - 1 ? "border-b border-gray-50" : ""}`}>
                        <div>
                          <p className="text-gray-800 text-sm font-medium">{doc.label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{doc.info}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <StatusDot verified={doc.verified} />
                          <button className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors">
                            Update
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Payout Settings */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Payout Settings</p>
                      <p className="text-gray-400 text-xs mt-0.5">Where your earnings land.</p>
                    </div>
                    <Smartphone className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Payout Method</label>
                        <select
                          value={payout.method}
                          onChange={(e) => setPayout(p => ({ ...p, method: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                        >
                          <option>bKash</option>
                          <option>Nagad</option>
                          <option>Rocket</option>
                          <option>Bank Transfer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Mobile Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                          <input
                            value={payout.number} onChange={(e) => setPayout(p => ({ ...p, number: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Payout Schedule</label>
                      <div className="flex gap-2">
                        {["daily", "weekly", "monthly"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setPayout(p => ({ ...p, schedule: s }))}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${payout.schedule === s ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={savePayout} className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                      {payoutSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save Changes"}
                    </button>
                  </div>
                </section>

                {/* Work Preferences */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Work Preferences</p>
                      <p className="text-gray-400 text-xs mt-0.5">Where and how you like to drive.</p>
                    </div>
                    <MapPin className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Preferred Zones</label>
                        <input
                          value={zones} onChange={(e) => setZones(e.target.value)}
                          placeholder="e.g. Gulshan, Banani"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Max Trip Distance (km)</label>
                        <input
                          value={maxDist} onChange={(e) => setMaxDist(e.target.value)}
                          type="number"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Accept airport trips", desc: "Hazrat Shahjalal International Airport routes.", value: airportTrips, set: setAirportTrips },
                        { label: "Night shift availability", desc: "Available for rides between 10 PM and 6 AM.", value: nightShift, set: setNightShift },
                      ].map((pref) => (
                        <div key={pref.label} className="flex items-center justify-between py-1">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">{pref.label}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{pref.desc}</p>
                          </div>
                          <button
                            onClick={() => pref.set(!pref.value)}
                            className={`relative rounded-full transition-colors flex-shrink-0 ${pref.value ? "bg-gray-900" : "bg-gray-200"}`}
                            style={{ width: 40, height: 22 }}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${pref.value ? "left-5" : "left-0.5"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={saveWork} className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                      {workSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save Preferences"}
                    </button>
                  </div>
                </section>

              </div>

              {/* ── Right column ────────────────────────────────────────── */}
              <div className="space-y-5">

                {/* Performance card */}
                <div className="bg-gray-900 rounded-2xl p-6 text-white">
                  <p className="text-white/40 mb-3" style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase" }}>Driver rating</p>
                  <div className="flex items-end gap-2 mb-1">
                    <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "3.2rem", lineHeight: 1, fontWeight: 400 }}>4.9</p>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/40 text-xs">Based on 312 completed trips</p>
                  <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
                    {[
                      { label: "Completion rate", value: "96%" },
                      { label: "Acceptance rate", value: "92%" },
                      { label: "Avg. trip length", value: "11.4 km" },
                      { label: "Peak hour bonus", value: "BDT 1,240" },
                      { label: "Online hours", value: "218 hrs" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <p className="text-white/40 text-xs">{s.label}</p>
                        <p className="text-white text-xs font-semibold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Earnings snapshot */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-gray-900 text-sm font-semibold">Earnings Snapshot</p>
                    <TrendingUp className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    {[
                      { label: "Today", value: "BDT 1,840" },
                      { label: "This week", value: "BDT 13,720" },
                      { label: "This month", value: "BDT 28,410" },
                      { label: "Pending payout", value: "BDT 6,200" },
                    ].map((e) => (
                      <div key={e.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <p className="text-gray-500 text-xs">{e.label}</p>
                        <p className="text-gray-900 text-xs font-bold">{e.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-gray-900 text-sm font-semibold">Security</p>
                    <Shield className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-5 py-3">
                    {!showPw ? (
                      <div className="space-y-0">
                        <div className="flex items-center justify-between py-3 border-b border-gray-50">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">Password</p>
                            <p className="text-gray-400 text-xs">Last updated 2 months ago</p>
                          </div>
                          <button onClick={() => setShowPw(true)} className="text-xs text-gray-500 hover:text-gray-900 underline transition-colors">Change</button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">Last login</p>
                            <p className="text-gray-400 text-xs">Today · Dhaka, Bangladesh</p>
                          </div>
                          <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
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

                {/* Account actions */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <p className="text-gray-900 text-sm font-semibold">Account</p>
                  </div>
                  <div className="px-5 py-2">
                    <button onClick={handleLogout} className="w-full flex items-center justify-between py-3 text-left border-b border-gray-50 group">
                      <span className="text-gray-600 text-sm group-hover:text-gray-900 flex items-center gap-2.5 transition-colors">
                        <LogOut className="w-3.5 h-3.5 text-gray-400" /> Sign out of UniRide
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between py-3 text-left group">
                      <span className="text-red-400 hover:text-red-600 text-sm transition-colors flex items-center gap-2.5">
                        <X className="w-3.5 h-3.5" /> Deactivate driver account
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
