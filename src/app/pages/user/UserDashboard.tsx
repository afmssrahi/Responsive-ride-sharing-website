import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  MapPin, Clock, CreditCard, Bookmark, User as UserIcon,
  LogOut, Menu, Home, Star, Plus, Check,
  Navigation, X, Car, Loader2, MessageSquare
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MapComponent, RouteInfo } from "../../components/MapComponent";
import { NotificationBell } from "../../components/NotificationBell";
import { users, rides as ridesApi } from "../../services/api";

type Section = "book" | "rides" | "places" | "payments" | "profile";

const NAV = [
  { id: "book" as Section, label: "Book a Ride", icon: Navigation },
  { id: "rides" as Section, label: "My Rides", icon: Clock },
  { id: "places" as Section, label: "Saved Places", icon: Bookmark },
  { id: "payments" as Section, label: "Payments", icon: CreditCard },
  { id: "profile" as Section, label: "Profile", icon: UserIcon },
];

// ── Book a Ride ───────────────────────────────────────────────────────────────
function BookRide() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState("");
  const [dest, setDest] = useState("");
  const [rideType, setRideType] = useState("");
  const [booked, setBooked] = useState(false);
  const [searching, setSearching] = useState(false);
  const [rideTypes, setRideTypes] = useState<any[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [bookedRide, setBookedRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<string>("PENDING");
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  useEffect(() => {
    ridesApi.getTypes().then(res => {
      setRideTypes(res.data || []);
      if (res.data?.length) setRideType(res.data[0].name);
    }).catch(() => {});
    users.getSavedPlaces().then(res => setSavedPlaces(res.data || [])).catch(() => {});
  }, []);

  // Socket.io: listen for ride status updates after booking
  useEffect(() => {
    if (!bookedRide?.id) return;
    import("../../services/socket").then(({ getSocket, joinRideRoom, leaveRideRoom }) => {
      joinRideRoom(bookedRide.id);
      const socket = getSocket();
      const handler = (data: any) => {
        if (data.status) setRideStatus(data.status);
        if (data.driver) setDriverInfo(data.driver);
        // Automatically navigate to chat when ride is accepted
        if (data.status === "CONFIRMED") {
          navigate(`/chat/${bookedRide.id}`);
        }
      };
      socket.on("ride:status_update", handler);
      return () => { socket.off("ride:status_update", handler); leaveRideRoom(bookedRide.id); };
    });
  }, [bookedRide?.id]);

  async function handleBook() {
    if (!pickup || !dest) return;
    setSearching(true);
    try {
      const res = await ridesApi.create({
        type: "ON_DEMAND",
        pickupLocation: pickup,
        pickupLat: routeInfo?.pickupCoords?.lat || 23.8103,
        pickupLng: routeInfo?.pickupCoords?.lng || 90.4125,
        dropoffLocation: dest,
        dropoffLat: routeInfo?.dropoffCoords?.lat || 23.7461,
        dropoffLng: routeInfo?.dropoffCoords?.lng || 90.3742,
        totalSeats: 1,
        paymentMethod: "CASH",
      });
      setBookedRide(res.data);
      setRideStatus(res.data.status || "PENDING");
      setBooked(true);
    } catch {
      setBooked(true); // show confirmation even on error
    } finally {
      setSearching(false);
    }
  }

  async function handleCancel() {
    if (bookedRide?.id) {
      try { await ridesApi.cancel(bookedRide.id, "Changed my mind"); } catch {}
    }
    setBooked(false); setPickup(""); setDest(""); setBookedRide(null); setRideStatus("PENDING");
  }

  if (booked) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${
          rideStatus === "CONFIRMED" || rideStatus === "IN_PROGRESS" ? "bg-green-50" : "bg-gray-100"
        }`}>
          {rideStatus === "CONFIRMED" || rideStatus === "IN_PROGRESS"
            ? <Check className="w-7 h-7 text-green-600" />
            : <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />}
        </div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>
          {rideStatus === "CONFIRMED" || rideStatus === "IN_PROGRESS" ? "Driver found!" : "Finding your driver…"}
        </h2>
        <p className="text-gray-500 text-sm mb-1">
          Code: <strong className="text-gray-800">{bookedRide?.rideCode || "SR-XXX"}</strong>
        </p>
        {driverInfo && (
          <p className="text-gray-400 text-sm mb-2">Driver: <strong className="text-gray-700">{driverInfo.name}</strong></p>
        )}
        <div className={`text-xs font-semibold px-3 py-1 rounded-full mb-6 ${
          rideStatus === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" :
          rideStatus === "CONFIRMED" ? "bg-green-50 text-green-600" :
          "bg-yellow-50 text-yellow-600"
        }`}>
          {rideStatus === "IN_PROGRESS" ? "Trip in progress" :
           rideStatus === "CONFIRMED" ? "Driver on the way" : "Searching…"}
        </div>
        <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 text-left space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">From</span>
            <span className="text-gray-900 font-semibold">{pickup}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">To</span>
            <span className="text-gray-900 font-semibold">{dest}</span>
          </div>
        </div>
        <div className="flex gap-2 w-full">
          {bookedRide?.id && (rideStatus === "CONFIRMED" || rideStatus === "IN_PROGRESS") && (
            <button onClick={() => navigate(`/chat/${bookedRide.id}`)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
              <MessageSquare className="w-4 h-4" /> Chat driver
            </button>
          )}
          <button onClick={handleCancel}
            className="flex-1 text-gray-400 hover:text-red-500 transition-colors text-sm flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  const iconMap: Record<string, any> = { Home, MapPin, Bookmark };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Book a Ride</h2>
        <p className="text-gray-400 text-sm">Where are you going?</p>
      </div>

      {(pickup || dest) && (
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <MapComponent pickupText={pickup} dropoffText={dest} onRouteChange={(r) => setRouteInfo(r)} height="300px" showGeolocationButton={false} />
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Pickup location" className="flex-1 text-sm text-gray-900 placeholder-gray-300 focus:outline-none" />
        </div>
        <div className="ml-1 border-l border-dashed border-gray-200 h-4" />
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-gray-900 flex-shrink-0" />
          <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Destination" className="flex-1 text-sm text-gray-900 placeholder-gray-300 focus:outline-none" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {savedPlaces.map((p: any) => {
          const Icon = iconMap[p.icon] || MapPin;
          return (
            <button key={p.id} onClick={() => setDest(p.address)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors text-sm text-gray-600 font-medium">
              <Icon className="w-3.5 h-3.5 text-gray-400" />{p.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-gray-500 text-sm">Ride type</p>
        <div className="grid grid-cols-2 gap-2.5">
          {rideTypes.map((t: any) => (
            <button key={t.name} onClick={() => setRideType(t.name)}
              className={`p-4 rounded-xl border text-left transition-all ${rideType === t.name ? "border-gray-900 bg-gray-900" : "border-gray-150 bg-white hover:border-gray-300"}`}
              style={{ borderColor: rideType === t.name ? "#111827" : "#e5e7eb" }}>
              <p className={`font-semibold text-sm mb-0.5 ${rideType === t.name ? "text-white" : "text-gray-900"}`}>{t.name}</p>
              <p className={`text-xs ${rideType === t.name ? "text-white/60" : "text-gray-400"}`}>{t.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs font-semibold ${rideType === t.name ? "text-white" : "text-gray-700"}`}>BDT {t.baseFare}+</span>
                <span className={`text-xs ${rideType === t.name ? "text-white/50" : "text-gray-400"}`}>{t.eta}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleBook} disabled={!pickup || !dest || searching}
        className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white py-3.5 rounded-xl font-semibold transition-colors text-sm">
        {searching ? "Finding driver…" : "Book Now"}
      </button>
    </div>
  );
}


// ── My Rides ──────────────────────────────────────────────────────────────────
function MyRides() {
  const navigate = useNavigate();
  const [rideHistory, setRideHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    users.getRideHistory()
      .then(res => setRideHistory(res.rides || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>My Rides</h2>
        <p className="text-gray-400 text-sm">{rideHistory.filter((r: any) => r.status === "COMPLETED").length} completed rides.</p>
      </div>
      {rideHistory.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-sm">No rides yet. Book your first ride!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rideHistory.map((r: any) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{r.pickupLocation} &rarr; {r.dropoffLocation}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })} &middot; {r.driver?.name || 'Unassigned'}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-900 font-semibold text-sm">BDT {r.totalFare || r.baseFare || '—'}</p>
                  <p className={`text-xs mt-0.5 ${r.status === "COMPLETED" ? "text-green-600" : r.status === "CANCELLED" ? "text-red-400" : "text-blue-500"}`}>
                    {r.status === "COMPLETED" ? "Completed" : r.status === "CANCELLED" ? "Cancelled" : r.status === "IN_PROGRESS" ? "In Progress" : "Pending"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                {r.ratings?.[0] ? (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.ratings[0].rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                    ))}
                    <span className="text-gray-300 text-xs ml-1.5">Your rating</span>
                  </div>
                ) : <div />}
                
                {(r.status === 'CONFIRMED' || r.status === 'IN_PROGRESS') && (
                  <button onClick={() => navigate(`/chat/${r.id}`)}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors text-xs">
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

// ── Saved Places ──────────────────────────────────────────────────────────────
function SavedPlaces() {
  const [places, setPlaces] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    users.getSavedPlaces()
      .then(res => setPlaces(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function add() {
    if (!newLabel || !newAddr) return;
    try {
      const res = await users.addSavedPlace({ label: newLabel, address: newAddr });
      setPlaces(prev => [...prev, (res as any).data]);
      setNewLabel(""); setNewAddr(""); setAdding(false);
    } catch {}
  }

  async function remove(id: string) {
    try {
      await users.deleteSavedPlace(id);
      setPlaces(prev => prev.filter(x => x.id !== id));
    } catch {}
  }

  const iconMap: Record<string, any> = { Home, MapPin, Bookmark };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Saved Places</h2>
          <p className="text-gray-400 text-sm">Your frequent destinations.</p>
        </div>
        <button onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3.5 py-2 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {adding && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Name (e.g. University)"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
          <input value={newAddr} onChange={(e) => setNewAddr(e.target.value)} placeholder="Full address"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
          <div className="flex gap-2">
            <button onClick={add} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">Save</button>
            <button onClick={() => setAdding(false)} className="text-gray-400 px-4 py-2 rounded-lg text-sm hover:text-gray-700 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {places.map((p: any) => {
          const Icon = iconMap[p.icon] || MapPin;
          return (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 group hover:border-gray-200 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-sm">{p.label}</p>
                <p className="text-gray-400 text-xs truncate">{p.address}</p>
              </div>
              <button onClick={() => remove(p.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Payments ──────────────────────────────────────────────────────────────────
function Payments() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    users.getPaymentMethods()
      .then(res => setCards(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function setDefault(id: string) {
    try {
      await users.setDefaultPayment(id);
      setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
    } catch {}
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Payments</h2>
        <p className="text-gray-400 text-sm">Manage your payment methods.</p>
      </div>
      <div className="space-y-2.5">
        {cards.map((c: any) => (
          <div key={c.id} className={`bg-white rounded-xl p-5 flex items-center justify-between border transition-colors ${c.isDefault ? "border-gray-900" : "border-gray-100"}`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-sm">
                  {c.type}{c.details?.last4 ? ` ···· ${c.details.last4}` : c.details?.number ? ` ${c.details.number}` : ''}
                </p>
                {c.details?.expiry && <p className="text-gray-400 text-xs">Expires {c.details.expiry}</p>}
                {c.details?.number && !c.details?.last4 && <p className="text-gray-400 text-xs">Mobile banking</p>}
              </div>
            </div>
            <div>
              {c.isDefault
                ? <span className="text-xs text-gray-900 border border-gray-200 px-2.5 py-1 rounded-full font-medium">Default</span>
                : <button onClick={() => setDefault(c.id)} className="text-xs text-gray-400 hover:text-gray-900 underline transition-colors">Set default</button>}
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">No payment methods added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function Profile({ user: authUser }: { user: { name: string; email: string; avatar: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState(authUser.name);
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    users.getProfile().then(res => {
      setProfile(res.data);
      setName(res.data.name);
      setPhone(res.data.phone || "");
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await users.updateProfile({ name, phone });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Profile</h2>
        <p className="text-gray-400 text-sm">Manage your personal information.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold">{authUser.avatar}</div>
        <div>
          <p className="text-gray-900 font-bold">{authUser.name}</p>
          <p className="text-gray-400 text-sm">{authUser.email}</p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />)}
            <span className="text-gray-300 text-xs ml-1.5">{profile?.stats?.totalRides || 0} rides</span>
          </div>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-gray-500 mb-1.5 text-xs font-medium">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors" />
        </div>
        <div>
          <label className="block text-gray-500 mb-1.5 text-xs font-medium">Email</label>
          <input value={authUser.email} readOnly
            className="w-full border border-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-gray-500 mb-1.5 text-xs font-medium">Mobile Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors" />
        </div>
        <button onClick={save} disabled={saving} className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("book");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() { logout(); navigate("/login"); }

  const sectionMap: Record<Section, JSX.Element> = {
    book: <BookRide />,
    rides: <MyRides />,
    places: <SavedPlaces />,
    payments: <Payments />,
    profile: <Profile user={user!} />,
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <aside className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`} style={{ width: 220 }}>
        <div className="px-5 py-5 border-b border-gray-100">
          <span className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            uni<span className="text-green-600">ride</span>
          </span>
          <p className="text-gray-400 text-xs mt-0.5">Passenger Portal</p>
        </div>
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { 
              if (id === "profile") { navigate("/dashboard/account"); setSidebarOpen(false); }
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