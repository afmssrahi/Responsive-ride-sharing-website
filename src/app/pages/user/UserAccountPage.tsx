import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Navigation, Clock, Bookmark, CreditCard, User as UserIcon,
  LogOut, Menu, Star, Plus, X, Check, Bell, Shield, ChevronRight,
  Phone, Mail, MapPin, Home, Smartphone, Car, Settings
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const PAYMENT_METHODS = [
  { id: 1, type: "bKash", number: "01700-210384", default: true, kind: "mobile" },
  { id: 2, type: "Nagad", number: "01800-210384", default: false, kind: "mobile" },
  { id: 3, type: "Visa", last4: "4242", expiry: "08/27", default: false, kind: "card" },
];

const SAVED_PLACES = [
  { id: 1, label: "Home", address: "House 12, Road 5, Dhanmondi, Dhaka 1205", icon: Home },
  { id: 2, label: "Office", address: "Bangladesh Bank Building, Motijheel, Dhaka 1000", icon: MapPin },
  { id: 3, label: "Gym", address: "Gulshan Shopping Center, Gulshan-1, Dhaka 1212", icon: Bookmark },
];

const RIDE_STATS = [
  { label: "Total rides", value: "47" },
  { label: "Total spent", value: "BDT 3,420" },
  { label: "Rating", value: "4.8 ★" },
];

const SIDEBAR_NAV = [
  { label: "Book a Ride", icon: Navigation },
  { label: "My Rides", icon: Clock },
  { label: "Saved Places", icon: Bookmark },
  { label: "Payments", icon: CreditCard },
];

const VEHICLE_PREFS = ["Standard", "Comfort", "XL", "Swift"];

export function UserAccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Personal info
  const [name, setName] = useState(user?.name ?? "Farhan Hossain");
  const [phone, setPhone] = useState("+880 1700-210384");
  const [infoSaved, setInfoSaved] = useState(false);
  function saveInfo() { setInfoSaved(true); setTimeout(() => setInfoSaved(false), 2000); }

  // Ride preferences
  const [preferredVehicle, setPreferredVehicle] = useState("Comfort");
  const [acPreference, setAcPreference] = useState(true);
  const [prefSaved, setPrefSaved] = useState(false);
  function savePref() { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 2000); }

  // Payment methods
  const [cards, setCards] = useState(PAYMENT_METHODS);
  function setDefault(id: number) { setCards(prev => prev.map(c => ({ ...c, default: c.id === id }))); }
  function removeCard(id: number) { setCards(prev => prev.filter(c => c.id !== id)); }

  // Saved places
  const [places, setPlaces] = useState(SAVED_PLACES);
  const [addingPlace, setAddingPlace] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddr, setNewAddr] = useState("");
  function addPlace() {
    if (!newLabel || !newAddr) return;
    setPlaces(prev => [...prev, { id: Date.now(), label: newLabel, address: newAddr, icon: MapPin }]);
    setNewLabel(""); setNewAddr(""); setAddingPlace(false);
  }

  // Notifications
  const [notifs, setNotifs] = useState({ rideUpdates: true, driverArrival: true, receipts: true, promotions: false });

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
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-100">
          <button onClick={() => navigate("/")} className="block">
            <span className="text-gray-900" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              swift<span className="text-green-600">ride</span>
            </span>
          </button>
          <p className="text-gray-400 text-xs mt-0.5">Passenger Portal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {SIDEBAR_NAV.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => { navigate("/dashboard"); setSidebarOpen(false); }}
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

        {/* User footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100">
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

        {/* Mobile header */}
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
                  Passenger Account
                </p>
                <h1
                  className="text-gray-900 mb-8"
                  style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", lineHeight: 1.08, fontWeight: 400 }}
                >
                  Your city,<br />your pace.
                </h1>

                {/* Profile row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                      {user?.avatar}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">{user?.name}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Member since January 2025</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-green-700 text-xs">Verified passenger</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-10 bg-gray-100" />

                  <div className="flex gap-6 sm:gap-10">
                    {RIDE_STATS.map((s) => (
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

              {/* Left col — 2 spans */}
              <div className="lg:col-span-2 space-y-5">

                {/* Personal Information */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Personal Information</p>
                      <p className="text-gray-400 text-xs mt-0.5">Your name and contact details.</p>
                    </div>
                    <UserIcon className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Full Name</label>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Mobile Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:border-gray-400 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1.5" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input
                          value={user?.email ?? ""}
                          readOnly
                          className="w-full border border-gray-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={saveInfo}
                        className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {infoSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save Changes"}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Ride Preferences */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Ride Preferences</p>
                      <p className="text-gray-400 text-xs mt-0.5">What you prefer when we find you a car.</p>
                    </div>
                    <Car className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-5 space-y-5">
                    <div>
                      <label className="block text-gray-400 mb-3" style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Preferred Vehicle Type</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {VEHICLE_PREFS.map((v) => (
                          <button
                            key={v}
                            onClick={() => setPreferredVehicle(v)}
                            className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors ${preferredVehicle === v ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 bg-white hover:border-gray-400"}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-gray-800 text-sm font-medium">Air conditioning</p>
                        <p className="text-gray-400 text-xs mt-0.5">Filter for AC-equipped vehicles by default.</p>
                      </div>
                      <button
                        onClick={() => setAcPreference(!acPreference)}
                        className={`relative rounded-full transition-colors flex-shrink-0 ${acPreference ? "bg-gray-900" : "bg-gray-200"}`}
                        style={{ width: 40, height: 22 }}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${acPreference ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={savePref}
                        className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        {prefSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save Preferences"}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Payment Methods */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Payment Methods</p>
                      <p className="text-gray-400 text-xs mt-0.5">Manage how you pay for rides.</p>
                    </div>
                    <CreditCard className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-4 space-y-2">
                    {cards.map((c) => (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${c.default ? "border-gray-900" : "border-gray-100 hover:border-gray-200"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 text-sm font-semibold">
                              {c.type}{"last4" in c ? ` ···· ${c.last4}` : ` ${c.number}`}
                            </p>
                            {"expiry" in c
                              ? <p className="text-gray-400 text-xs">Expires {(c as typeof c & { expiry: string }).expiry}</p>
                              : <p className="text-gray-400 text-xs">Mobile banking</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {c.default
                            ? <span className="text-xs text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full">Default</span>
                            : <button onClick={() => setDefault(c.id)} className="text-xs text-gray-400 hover:text-gray-800 underline transition-colors">Set default</button>}
                          <button onClick={() => removeCard(c.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="w-full border border-dashed border-gray-200 rounded-xl py-3.5 flex items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm">
                      <Plus className="w-3.5 h-3.5" /> Add bKash, Nagad, or card
                    </button>
                  </div>
                  <div className="px-6 pb-5">
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-gray-700 text-sm font-semibold">SwiftRide Credit</p>
                        <p className="text-gray-400 text-xs mt-0.5">Applied automatically on next ride.</p>
                      </div>
                      <p className="text-gray-900 font-bold">BDT 100</p>
                    </div>
                  </div>
                </section>

                {/* Saved Places */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Saved Places</p>
                      <p className="text-gray-400 text-xs mt-0.5">Your frequent destinations in Dhaka.</p>
                    </div>
                    <button
                      onClick={() => setAddingPlace(!addingPlace)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add place
                    </button>
                  </div>
                  <div className="px-6 py-4 space-y-1">
                    {addingPlace && (
                      <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50 mb-3">
                        <input
                          value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                          placeholder="Name — e.g. University"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gray-400 transition-colors"
                        />
                        <input
                          value={newAddr} onChange={(e) => setNewAddr(e.target.value)}
                          placeholder="Full address"
                          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-gray-400 transition-colors"
                        />
                        <div className="flex gap-2">
                          <button onClick={addPlace} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">Save</button>
                          <button onClick={() => setAddingPlace(false)} className="text-gray-400 px-4 py-2 rounded-lg text-sm hover:text-gray-700 transition-colors">Cancel</button>
                        </div>
                      </div>
                    )}
                    {places.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 group py-2.5 px-2 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <p.icon className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm font-semibold">{p.label}</p>
                          <p className="text-gray-400 text-xs truncate">{p.address}</p>
                        </div>
                        <button
                          onClick={() => setPlaces(prev => prev.filter(x => x.id !== p.id))}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Notifications */}
                <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">Notification Preferences</p>
                      <p className="text-gray-400 text-xs mt-0.5">Choose what you want to hear about.</p>
                    </div>
                    <Bell className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-6 py-2">
                    {[
                      { key: "rideUpdates", label: "Ride status updates", desc: "Driver accepted, en route, and trip end." },
                      { key: "driverArrival", label: "Driver arrival alerts", desc: "Notified 2 minutes before pickup." },
                      { key: "receipts", label: "Trip receipts", desc: "A receipt after every completed ride." },
                      { key: "promotions", label: "Offers & promotions", desc: "Seasonal deals and discount codes." },
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between py-4 border-b border-gray-50 last:border-0">
                        <div className="flex-1 pr-8">
                          <p className="text-gray-800 text-sm font-medium">{item.label}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => setNotifs(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                          className={`relative rounded-full transition-colors flex-shrink-0 mt-0.5 ${notifs[item.key as keyof typeof notifs] ? "bg-gray-900" : "bg-gray-200"}`}
                          style={{ width: 40, height: 22 }}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${notifs[item.key as keyof typeof notifs] ? "left-5" : "left-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

              </div>

              {/* ── Right column ────────────────────────────────────────── */}
              <div className="space-y-5">

                {/* Rating card */}
                <div className="bg-gray-900 rounded-2xl p-6 text-white">
                  <p className="text-white/40 mb-3" style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase" }}>Passenger rating</p>
                  <div className="flex items-end gap-2 mb-1">
                    <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "3.2rem", lineHeight: 1, fontWeight: 400 }}>4.8</p>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-white/40 text-xs">Based on 47 completed trips</p>
                  <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
                    {[
                      { label: "Rides this month", value: "11" },
                      { label: "Favourite route", value: "Home → Office" },
                      { label: "Avg. fare", value: "BDT 235" },
                      { label: "Member since", value: "Jan 2025" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <p className="text-white/40 text-xs">{s.label}</p>
                        <p className="text-white text-xs font-semibold">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent rides */}
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-gray-900 text-sm font-semibold">Recent Rides</p>
                    <button onClick={() => navigate("/dashboard")} className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-0.5">
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="px-5 py-2">
                    {[
                      { from: "Gulshan-1", to: "Airport", fare: "BDT 380", date: "Today" },
                      { from: "Home", to: "Office", fare: "BDT 140", date: "Yesterday" },
                      { from: "Dhanmondi", to: "Motijheel", fare: "BDT 260", date: "17 Mar" },
                    ].map((r, i) => (
                      <div key={i} className={`py-3 ${i < 2 ? "border-b border-gray-50" : ""}`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-gray-800 text-xs font-semibold">{r.from} → {r.to}</p>
                          <p className="text-gray-900 text-xs font-semibold">{r.fare}</p>
                        </div>
                        <p className="text-gray-400 text-xs">{r.date}</p>
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
                            <p className="text-gray-400 text-xs">Last updated 3 months ago</p>
                          </div>
                          <button onClick={() => setShowPw(true)} className="text-xs text-gray-500 hover:text-gray-900 underline transition-colors">Change</button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-50">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">Two-factor auth</p>
                            <p className="text-gray-400 text-xs">Adds a layer of protection.</p>
                          </div>
                          <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Off
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="text-gray-800 text-sm font-medium">Active sessions</p>
                            <p className="text-gray-400 text-xs">Dhaka, Bangladesh</p>
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
                            <input
                              type="password" value={f.val}
                              onChange={(e) => setPw(p => ({ ...p, [f.key]: e.target.value }))}
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                            />
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
                  <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-gray-900 text-sm font-semibold">Account</p>
                    <Settings className="w-4 h-4 text-gray-200" />
                  </div>
                  <div className="px-5 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between py-3 text-left border-b border-gray-50 group"
                    >
                      <span className="text-gray-600 text-sm group-hover:text-gray-900 flex items-center gap-2.5 transition-colors">
                        <LogOut className="w-3.5 h-3.5 text-gray-400" /> Sign out of SwiftRide
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between py-3 text-left group">
                      <span className="text-red-400 hover:text-red-600 text-sm transition-colors flex items-center gap-2.5">
                        <X className="w-3.5 h-3.5" /> Close my account
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
