import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Home, Clock, DollarSign, Star, User as UserIcon,
  LogOut, Menu, MessageSquare, Check,
  TrendingUp, Navigation, Car, Loader2, Bell,
  Plus, MapPin, Users, CheckCircle2, X, Zap,
  ChevronRight, Share2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../../components/NotificationBell";
import { drivers as driversApi, rides as ridesApi } from "../../services/api";
import { MapComponent, RouteInfo } from "../../components/MapComponent";
import { getSocket } from "../../services/socket";

type Section = "home" | "offer" | "requests" | "trips" | "earnings" | "ratings" | "profile";

const NAV = [
  { id: "home"     as Section, label: "Home",          icon: Home     },
  { id: "offer"    as Section, label: "Offer a Ride",  icon: Share2   },
  { id: "requests" as Section, label: "Ride Requests", icon: Bell     },
  { id: "trips"    as Section, label: "My Trips",      icon: Clock    },
  { id: "earnings" as Section, label: "Earnings",      icon: DollarSign },
  { id: "ratings"  as Section, label: "Ratings",       icon: Star     },
  { id: "profile"  as Section, label: "Profile",       icon: UserIcon },
];

// ── Helpers ───────────────────────────────────────────────────────────
function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function fmtTime(d: Date) { return d.toTimeString().slice(0, 5); }
function recFare(distKm: number) { return Math.max(20, Math.round(distKm * 12)); }

// ── Home ──────────────────────────────────────────────────────────────
function DriverHome({ onGoOffer }: { onGoOffer: () => void }) {
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
      {/* Online toggle */}
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {todayStats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-2">{s.label}</p>
            <p className="text-gray-900" style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick action: Offer a Ride */}
      <button
        onClick={onGoOffer}
        className="w-full flex items-center justify-between bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-4 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p style={{ fontWeight: 700, fontSize: "0.95rem" }}>Offer a Ride</p>
            <p className="text-white/60 text-xs">Post your route &amp; available seats</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/60" />
      </button>
    </div>
  );
}

// ── Offer a Ride (inline dashboard section) ───────────────────────────
// ── My Offer Status Badge ──────────────────────────────────────────────
function offerStatusBadge(ride: any) {
  const seats = ride.availableSeats ?? 0;
  if (ride.status === 'CANCELLED') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">Dismissed</span>;
  }
  if (ride.status === 'COMPLETED') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">Completed</span>;
  }
  if (seats === 0) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">Full</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />Active</span>;
}

// ── My Posted Offers list ──────────────────────────────────────────────
function MyPostedOffers({ refreshKey }: { refreshKey: number }) {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    ridesApi.myCreated()
      .then(res => {
        const shared = (res.rides || []).filter((r: any) => r.type === 'DRIVER_CREATED_SHARED');
        setOffers(shared);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleCancel(id: string) {
    if (!window.confirm('Cancel this ride offer? Passengers who requested seats will be notified.')) return;
    setCancelling(id);
    try {
      await ridesApi.cancel(id, 'Driver cancelled offer');
      setOffers(prev => prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o));
    } catch { /* ignore */ }
    setCancelling(null);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;

  if (offers.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
        <Share2 className="w-9 h-9 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 text-sm font-medium">No ride offers posted yet</p>
        <p className="text-gray-300 text-xs mt-1">Post your first offer using the form above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map(offer => {
        const pending = (offer.shareRequests || []).filter((r: any) => r.status === 'PENDING').length;
        const approved = (offer.participants || []).length;
        return (
          <div key={offer.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-all">
            {/* Status + code */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {offerStatusBadge(offer)}
                <span className="text-gray-300 font-mono text-xs">#{offer.rideCode}</span>
              </div>
              {offer.departureTime && (
                <p className="text-gray-400 text-xs flex-shrink-0">
                  {new Date(offer.departureTime).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })}
                  {' · '}
                  {new Date(offer.departureTime).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            {/* Route */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex flex-col items-center mt-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-green-100" />
                <div className="w-px h-4 bg-gray-200 my-0.5" />
                <div className="w-2.5 h-2.5 rounded-sm bg-gray-800 ring-2 ring-gray-100" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-sm truncate">{offer.pickupLocation}</p>
                <p className="text-gray-900 font-semibold text-sm truncate mt-1">{offer.dropoffLocation}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3 text-xs mb-3">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                <Users className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600 font-medium">{offer.availableSeats} seats left / {offer.totalSeats}</span>
              </div>
              {offer.pricePerSeat && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span className="text-green-700 font-semibold">BDT {offer.pricePerSeat}/seat</span>
                </div>
              )}
              {pending > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-700 font-semibold">{pending} pending request{pending > 1 ? 's' : ''}</span>
                </div>
              )}
              {approved > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-500" />
                  <span className="text-blue-700 font-semibold">{approved} approved</span>
                </div>
              )}
            </div>

            {offer.notes && (
              <p className="text-gray-400 text-xs italic mb-3 leading-relaxed">"{offer.notes}"</p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-50">
              <button
                onClick={() => navigate(`/ride/${offer.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                <MapPin className="w-3.5 h-3.5" /> View Details
              </button>
              {['CONFIRMED', 'PENDING'].includes(offer.status) && (
                <button
                  onClick={() => handleCancel(offer.id)}
                  disabled={cancelling === offer.id}
                  className="flex items-center justify-center gap-1.5 border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {cancelling === offer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Cancel
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Offer a Ride Section (tabs: Post + My Offers) ──────────────────────
function OfferRideSection() {
  const navigate = useNavigate();

  // Form fields
  // Tab state
  const [tab, setTab] = useState<'form' | 'offers'>('form');
  const [refreshKey, setRefreshKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [routeFrom,      setRouteFrom]      = useState("");
  const [routeTo,        setRouteTo]        = useState("");
  const [depDate,        setDepDate]        = useState(fmtDate(new Date()));
  const [depTime,        setDepTime]        = useState(fmtTime(new Date(Date.now() + 30 * 60 * 1000)));
  const [totalSeats,     setTotalSeats]     = useState(4);
  const [availableSeats, setAvailableSeats] = useState(3);
  const [pricePerSeat,   setPricePerSeat]   = useState("");
  const [notes,          setNotes]          = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  // Data
  const [vehicles,      setVehicles]      = useState<any[]>([]);
  const [routeInfo,     setRouteInfo]     = useState<RouteInfo | null>(null);
  const [loadingVeh,    setLoadingVeh]    = useState(true);

  // Submission
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");

  // Load vehicles from driver profile
  useEffect(() => {
    driversApi.getProfile().then((res: any) => {
      const vList = (res.data?.vehicles || []).filter((v: any) => v.isActive);
      setVehicles(vList);
      if (vList.length > 0) {
        setSelectedVehicleId(vList[0].id);
        setTotalSeats(vList[0].totalSeats);
        setAvailableSeats(Math.max(1, vList[0].totalSeats - 1));
      }
    }).catch(() => {}).finally(() => setLoadingVeh(false));
  }, []);

  // When vehicle changes update seat counts
  useEffect(() => {
    const v = vehicles.find(v => v.id === selectedVehicleId);
    if (v) { setTotalSeats(v.totalSeats); setAvailableSeats(Math.max(1, v.totalSeats - 1)); }
  }, [selectedVehicleId, vehicles]);

  // Auto-fill recommended price when route resolves
  const handleRouteChange = useCallback((r: RouteInfo | null) => {
    setRouteInfo(r);
    if (r) setPricePerSeat(String(recFare(r.distanceKm)));
  }, []);

  async function handlePublish() {
    setError("");
    if (!routeFrom.trim() || !routeTo.trim()) { setError("Enter start and end locations."); return; }
    if (!pricePerSeat || Number(pricePerSeat) <= 0) { setError("Set a price per seat."); return; }
    const dt = new Date(`${depDate}T${depTime}`);
    if (dt <= new Date()) { setError("Departure time must be in the future."); return; }

    setSubmitting(true);
    try {
      const res = await ridesApi.create({
        type: "DRIVER_CREATED_SHARED",
        pickupLocation:  routeFrom.trim(),
        pickupLat:       routeInfo?.pickupCoords?.lat  ?? 23.8103,
        pickupLng:       routeInfo?.pickupCoords?.lng  ?? 90.4125,
        dropoffLocation: routeTo.trim(),
        dropoffLat:      routeInfo?.dropoffCoords?.lat ?? 23.7461,
        dropoffLng:      routeInfo?.dropoffCoords?.lng ?? 90.3742,
        departureTime:   dt.toISOString(),
        totalSeats:      availableSeats,
        pricePerSeat:    Number(pricePerSeat),
        paymentMethod:   "CASH",
        sharingEnabled:  true,
        notes:           notes.trim() || undefined,
        vehicleId:       selectedVehicleId || undefined,
      });
      // Reset form
      setRouteFrom(""); setRouteTo(""); setNotes(""); setPricePerSeat(""); setRouteInfo(null);
      // Show success toast, refresh offers list, switch to My Offers tab
      setSuccessMsg(`Ride offer published! Code: ${res.data.rideCode}`);
      setRefreshKey(k => k + 1);
      setTab('offers');
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to publish.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // ── Return: header + tab switcher + success banner + content ────
  return (
    <div className="space-y-6">
      {/* Header + tabs */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Offer a Ride</h2>
            <p className="text-gray-400 text-sm">Post your route — passengers can join with their own pickup & destination.</p>
          </div>
        </div>
        {/* Tab buttons */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('form')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'form' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            + Post New Offer
          </button>
          <button
            onClick={() => setTab('offers')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === 'offers' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            My Offers
          </button>
        </div>
      </div>

      {/* Success toast banner */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-600 text-white px-4 py-3 rounded-2xl shadow-lg animate-pulse">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Ride Published!</p>
            <p className="text-green-100 text-xs">{successMsg} — passengers can now see and join it.</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-green-200 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab content */}
      {tab === 'offers' ? (
        <MyPostedOffers refreshKey={refreshKey} />
      ) : (
        <div className="space-y-5">

      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Route Preview</p>
        <MapComponent
          pickupText={routeFrom}
          dropoffText={routeTo}
          onRouteChange={handleRouteChange}
          height="220px"
          showGeolocationButton={false}
        />
        {routeInfo && (
          <div className="flex gap-2 mt-3">
            <span className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs text-gray-600 font-medium text-center">
              📏 ~{routeInfo.distanceKm.toFixed(1)} km
            </span>
            <span className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs text-gray-600 font-medium text-center">
              ⏱ ~{Math.round(routeInfo.durationMin)} min
            </span>
            <span className="flex-1 bg-green-50 border border-green-100 rounded-lg px-2 py-1.5 text-xs text-green-700 font-medium text-center">
              💰 BDT {pricePerSeat || "—"}/seat
            </span>
          </div>
        )}
      </div>

      {/* ── Route inputs ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <p className="text-gray-700 text-sm font-semibold">Route</p>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-white z-10" />
          <input
            type="text"
            value={routeFrom}
            onChange={e => setRouteFrom(e.target.value)}
            className="w-full pl-8 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-green-500 text-sm transition"
            placeholder="Start location (e.g. Mirpur 10)"
          />
          <button
            onClick={() => navigator.geolocation?.getCurrentPosition(pos => {
              setRouteFrom(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-gray-800 z-10" />
          <input
            type="text"
            value={routeTo}
            onChange={e => setRouteTo(e.target.value)}
            className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-green-500 text-sm transition"
            placeholder="End location (e.g. Gulshan 2)"
          />
        </div>
      </div>

      {/* ── Departure time ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-gray-700 text-sm font-semibold mb-3">Departure Time</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Date</label>
            <input
              type="date"
              value={depDate}
              min={fmtDate(new Date())}
              onChange={e => setDepDate(e.target.value)}
              className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-green-500 text-sm"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-1">Time</label>
            <input
              type="time"
              value={depTime}
              onChange={e => setDepTime(e.target.value)}
              className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-green-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Vehicle & seat management ─────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <p className="text-gray-700 text-sm font-semibold">Vehicle &amp; Available Seats</p>

        {loadingVeh ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading vehicles…
          </div>
        ) : vehicles.length > 0 ? (
          <>
            {/* Vehicle selector */}
            <div className="space-y-2">
              {vehicles.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all flex items-center justify-between ${
                    selectedVehicleId === v.id
                      ? "border-green-600 bg-green-50"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Car className={`w-4 h-4 ${selectedVehicleId === v.id ? "text-green-600" : "text-gray-300"}`} />
                    <div>
                      <p className="text-gray-900 text-sm font-semibold">{v.make} {v.model} ({v.year})</p>
                      <p className="text-gray-400 text-xs">{v.color} · {v.plate} · {v.totalSeats} seats</p>
                    </div>
                  </div>
                  {selectedVehicleId === v.id && <div className="w-2 h-2 rounded-full bg-green-600" />}
                </button>
              ))}
            </div>

            {/* Seat visual picker */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-600 text-sm font-medium">Seats for passengers</p>
                <span className="text-gray-400 text-xs">{availableSeats} of {totalSeats} open</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: totalSeats }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setAvailableSeats(n)}
                    className={`w-10 h-10 rounded-xl border-2 text-sm font-bold transition-all ${
                      n <= availableSeats
                        ? "bg-green-600 border-green-600 text-white shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                    title={`${n} seat${n > 1 ? "s" : ""} available`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {selectedVehicle && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-700 text-xs leading-relaxed">
                    <strong>{totalSeats}-seater {selectedVehicle.make} {selectedVehicle.model}</strong> — offering{" "}
                    <strong>{availableSeats} seat{availableSeats > 1 ? "s" : ""}</strong> to passengers.
                    {totalSeats - availableSeats > 0 && (
                      <> {totalSeats - availableSeats} seat{totalSeats - availableSeats > 1 ? "s" : ""} reserved for you.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Manual fallback */}
            <p className="text-gray-400 text-xs">No registered vehicle found. Enter manually:</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">Total car seats</label>
                <select
                  value={totalSeats}
                  onChange={e => { const t = Number(e.target.value); setTotalSeats(t); setAvailableSeats(Math.min(availableSeats, t - 1)); }}
                  className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} seats</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium block mb-1">Available for passengers</label>
                <select
                  value={availableSeats}
                  onChange={e => setAvailableSeats(Number(e.target.value))}
                  className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm"
                >
                  {Array.from({ length: totalSeats - 1 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Price ────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-gray-700 text-sm font-semibold mb-3">Price per Seat</p>
        <div className="relative mb-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">BDT</span>
          <input
            type="number"
            min="10"
            max="5000"
            step="5"
            value={pricePerSeat}
            onChange={e => setPricePerSeat(e.target.value)}
            className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-lg focus:outline-none focus:border-green-500 transition"
            placeholder="—"
          />
        </div>
        {routeInfo && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            <Zap className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-xs">
              Recommended: <strong>BDT {recFare(routeInfo.distanceKm)}/seat</strong> for ~{routeInfo.distanceKm.toFixed(1)} km
            </p>
          </div>
        )}
        {pricePerSeat && availableSeats > 0 && (
          <p className="text-gray-500 text-xs mt-2">
            Max earnings if full: <strong className="text-green-700">BDT {Number(pricePerSeat) * availableSeats}</strong>
          </p>
        )}
      </div>

      {/* ── Notes ────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <label className="text-gray-700 text-sm font-semibold block mb-3">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="E.g. AC car, no smoking, will stop at Farmgate…"
          className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-green-500 text-sm transition resize-none leading-relaxed"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Publish */}
      <button
        onClick={handlePublish}
        disabled={submitting || !routeFrom.trim() || !routeTo.trim() || !pricePerSeat}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        {submitting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /><span style={{ fontWeight: 700 }}>Publishing…</span></>
        ) : (
          <>
<Plus className="w-5 h-5" /><span style={{ fontWeight: 700 }}>Publish Ride Offer</span><ChevronRight className="w-5 h-5" /></>
        )}
      </button>
      <p className="text-gray-400 text-center text-xs leading-relaxed">
        Passengers send join requests. You approve or decline — seats are only reserved after your approval.
      </p>
        </div>
      )}
    </div>
  );
}


// ── My Trips ──────────────────────────────────────────────────────────
function MyTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driversApi.getTrips().then(res => setTrips(res.trips || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Calculate driver earnings for a trip
  function getDriverEarnings(t: any): number | null {
    // ON_DEMAND rides
    if (t.totalFare) return t.totalFare;
    if (t.baseFare) return t.baseFare;
    // Shared rides: pricePerSeat × booked seats
    if (t.pricePerSeat) {
      const bookedSeats = t.totalSeats - (t.availableSeats ?? t.totalSeats);
      return t.pricePerSeat * Math.max(bookedSeats, 0);
    }
    // Sum participant fares
    if (t.participants?.length) {
      const total = t.participants.reduce((s: number, p: any) => s + (p.fareAmount || 0), 0);
      if (total > 0) return total;
    }
    return null;
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  const completedTrips = trips.filter((t: any) => t.status === "COMPLETED");
  const totalEarned = completedTrips.reduce((sum: number, t: any) => sum + (getDriverEarnings(t) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>My Trips</h2>
        <p className="text-gray-400 text-sm">{trips.length} trips total · {completedTrips.length} completed.</p>
      </div>

      {/* Total earned summary */}
      {completedTrips.length > 0 && (
        <div className="bg-green-600 rounded-xl p-5 text-white">
          <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Total Earned</p>
          <p style={{ fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.03em" }}>BDT {totalEarned.toLocaleString()}</p>
          <p className="text-white/40 text-xs mt-1">{completedTrips.length} trip{completedTrips.length !== 1 ? 's' : ''} completed</p>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center"><p className="text-gray-400 text-sm">No trips yet.</p></div>
      ) : (
        <div className="space-y-3">
          {trips.map((t: any) => {
            const earnings = getDriverEarnings(t);
            const passengers = t.participants?.length || 0;
            return (
              <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-gray-900 font-semibold text-sm truncate">{t.pickupLocation} &rarr; {t.dropoffLocation}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })}
                      {passengers > 0 && <> &middot; {passengers} passenger{passengers > 1 ? 's' : ''}</>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {earnings ? (
                      <p className="text-green-700 font-bold text-sm">+BDT {earnings}</p>
                    ) : (
                      <p className="text-gray-300 font-medium text-sm">—</p>
                    )}
                    <p className={`text-xs mt-0.5 font-medium ${
                      t.status === "COMPLETED" ? "text-green-600" :
                      t.status === "CANCELLED" ? "text-red-400" :
                      t.status === "IN_PROGRESS" ? "text-blue-500" : "text-yellow-500"
                    }`}>
                      {t.status === "COMPLETED" ? "Completed" :
                       t.status === "CANCELLED" ? "Cancelled" :
                       t.status === "IN_PROGRESS" ? "In Progress" :
                       t.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-50 justify-between">
                  {/* Rating stars */}
                  {t.ratings?.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < t.ratings[0].rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                      ))}
                      <span className="text-gray-300 text-xs ml-1">Rider rated</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.status}</span>
                  )}
                  <div className="flex items-center gap-3">
                    {(t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS') && (
                      <button onClick={() => navigate(`/chat/${t.id}`)}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </button>
                    )}
                    <button onClick={() => navigate(`/ride/${t.id}`)}
                      className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-medium transition-colors">
                      <MapPin className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Pending Ride Requests (ON_DEMAND) ─────────────────────────────────
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

  // Real-time: listen for new passenger ride requests
  useEffect(() => {
    const socket = getSocket();
    const handler = (newRide: any) => {
      if (newRide?.type === 'ON_DEMAND' || !newRide?.type) {
        setRides(prev => {
          const exists = prev.some(r => r.id === newRide.id);
          return exists ? prev : [newRide, ...prev];
        });
      }
    };
    socket.on('ride:new_request', handler);
    return () => { socket.off('ride:new_request', handler); };
  }, []);

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

  async function handleDecline(rideId: string) {
    try {
      await ridesApi.cancel(rideId, 'Driver declined');
      setRides(prev => prev.filter(r => r.id !== rideId));
    } catch {}
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
              {r.totalFare && (
                <div className="flex items-center justify-between mb-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <span className="text-green-600 text-xs font-medium">Estimated fare</span>
                  <span className="text-green-700 font-bold text-sm">BDT {r.totalFare}</span>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(r.id)}
                  disabled={accepting === r.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {accepting === r.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting…</> : <><Check className="w-4 h-4" /> Accept</>}
                </button>
                <button
                  onClick={() => handleDecline(r.id)}
                  className="px-4 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Earnings ──────────────────────────────────────────────────────────
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
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `BDT${(v / 1000).toFixed(1)}k`} />
              <Tooltip formatter={(v) => [`BDT ${Number(v).toLocaleString()}`, "Earnings"]} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11, boxShadow: "none" }} />
              <Bar dataKey="amount" fill="#111827" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Ratings ───────────────────────────────────────────────────────────
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

// ── Profile ───────────────────────────────────────────────────────────
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

// ── Shell ─────────────────────────────────────────────────────────────
export function DriverDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() { logout(); navigate("/login"); }

  function sectionContent() {
    switch (section) {
      case "home":     return <DriverHome onGoOffer={() => setSection("offer")} />;
      case "offer":    return <OfferRideSection />;
      case "requests": return <PendingRides />;
      case "trips":    return <MyTrips />;
      case "earnings": return <Earnings />;
      case "ratings":  return <Ratings />;
      case "profile":  return <DriverProfile user={user!} />;
    }
  }

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
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                section === id
                  ? id === "offer"
                    ? "bg-green-600 text-white"
                    : "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              }`}
              style={{ fontSize: "0.8rem", fontWeight: 500 }}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" /> {label}
              {id === "offer" && section !== "offer" && (
                <span className="ml-auto bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded font-semibold">New</span>
              )}
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
          <div className="flex items-center gap-3">
            {/* Quick-offer fab for small screens */}
            {section !== "offer" && (
              <button
                onClick={() => setSection("offer")}
                className="lg:hidden flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Offer Ride
              </button>
            )}
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 px-5 sm:px-8 py-8 overflow-auto">
          {sectionContent()}
        </main>
      </div>
    </div>
  );
}