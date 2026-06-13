import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  MapPin, Clock, CreditCard, Bookmark, User as UserIcon,
  LogOut, Menu, Home, Star, Plus, Check,
  Navigation, X, Car, Loader2, MessageSquare,
  Users, ChevronRight, Share2, Search, RefreshCw,
  Calendar, DollarSign, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { MapComponent, RouteInfo } from "../../components/MapComponent";
import { NotificationBell } from "../../components/NotificationBell";
import { users, rides as ridesApi, ratings } from "../../services/api";
import { getSocket, joinRideRoom, leaveRideRoom } from "../../services/socket";

type Section = "book" | "available" | "rides" | "places" | "payments" | "profile";

const NAV = [
  { id: "book"      as Section, label: "Book a Ride",     icon: Navigation },
  { id: "available" as Section, label: "Available Rides",  icon: Share2     },
  { id: "rides"     as Section, label: "My Rides",         icon: Clock      },
  { id: "places"    as Section, label: "Saved Places",     icon: Bookmark   },
  { id: "payments"  as Section, label: "Payments",         icon: CreditCard },
  { id: "profile"   as Section, label: "Profile",          icon: UserIcon   },
];

// ── Join Request Modal ────────────────────────────────────────────────
function JoinModal({
  ride,
  onClose,
  onSuccess,
}: {
  ride: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [myPickup,   setMyPickup]   = useState("");
  const [myDropoff,  setMyDropoff]  = useState("");
  const [seats,      setSeats]      = useState(1);
  const [message,    setMessage]    = useState("");
  const [routeInfo,  setRouteInfo]  = useState<RouteInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [done,       setDone]       = useState(false);

  const handleRouteChange = useCallback((r: RouteInfo | null) => setRouteInfo(r), []);

  async function handleJoin() {
    if (!myPickup.trim()) { setError("Enter your pickup location."); return; }
    setError("");
    setSubmitting(true);
    try {
      await ridesApi.bookSeat(ride.id, {
        seatsRequested:  seats,
        message:         message.trim() || undefined,
        pickupLocation:  myPickup.trim(),
        pickupLat:       routeInfo?.pickupCoords?.lat,
        pickupLng:       routeInfo?.pickupCoords?.lng,
        dropoffLocation: myDropoff.trim() || ride.dropoffLocation,
        dropoffLat:      routeInfo?.dropoffCoords?.lat,
        dropoffLng:      routeInfo?.dropoffCoords?.lng,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to send join request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ── Success screen ─────────────────────────────────────── */}
        {done ? (
          <div className="p-8 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-40" />
              <div className="relative w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-900 font-bold text-xl mb-2">Request Sent!</h3>
            <p className="text-gray-500 text-sm mb-1">
              Your join request has been sent to <strong>{ride.driver?.name || "the driver"}</strong>.
            </p>
            <p className="text-gray-400 text-sm mb-6">
              You'll get notified when the driver approves your seat.
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Your pickup</span>
                <span className="text-gray-900 font-semibold">{myPickup}</span>
              </div>
              {myDropoff && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Your drop-off</span>
                  <span className="text-gray-900 font-semibold">{myDropoff}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Seats</span>
                <span className="text-gray-900 font-semibold">{seats}</span>
              </div>
              {ride.pricePerSeat && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Fare</span>
                  <span className="text-green-700 font-bold">BDT {ride.pricePerSeat * seats}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="w-full bg-gray-900 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Join form ────────────────────────────────────────── */
          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-gray-900 font-bold text-lg leading-tight">Join this Ride</h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  {ride.pickupLocation} → {ride.dropoffLocation}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-4">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Ride summary strip */}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {ride.driver?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "D"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 text-sm font-semibold">{ride.driver?.name || "Driver"}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                  {ride.driver?.driverProfile?.rating > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {ride.driver.driverProfile.rating.toFixed(1)}
                    </span>
                  )}
                  {ride.vehicle && <span>{ride.vehicle.make} {ride.vehicle.model} · {ride.vehicle.plate}</span>}
                  <span className="text-green-600 font-semibold">
                    {ride.availableSeats} seat{ride.availableSeats > 1 ? "s" : ""} left
                  </span>
                </div>
              </div>
              {ride.pricePerSeat && (
                <div className="text-right flex-shrink-0">
                  <p className="text-green-700 font-bold text-sm">BDT {ride.pricePerSeat * seats}</p>
                  <p className="text-gray-400 text-xs">{ride.pricePerSeat}/seat</p>
                </div>
              )}
            </div>

            {/* Map mini preview */}
            {(myPickup || myDropoff) && (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
                <MapComponent
                  pickupText={myPickup || ride.pickupLocation}
                  dropoffText={myDropoff || ride.dropoffLocation}
                  onRouteChange={handleRouteChange}
                  height="180px"
                  showGeolocationButton={false}
                />
              </div>
            )}

            {/* Your pickup */}
            <div className="mb-3">
              <label className="text-gray-700 text-sm font-semibold block mb-2">
                Your Pickup Location <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-white z-10" />
                <input
                  type="text"
                  value={myPickup}
                  onChange={e => setMyPickup(e.target.value)}
                  className="w-full pl-8 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-green-500 text-sm transition"
                  placeholder="Where should the driver pick you up?"
                />
                <button
                  onClick={() => navigator.geolocation?.getCurrentPosition(pos => {
                    setMyPickup(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                  })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Your dropoff */}
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-2">
                Your Drop-off Location
                <span className="text-gray-400 font-normal ml-1 text-xs">
                  (optional — defaults to driver's destination)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-gray-800 z-10" />
                <input
                  type="text"
                  value={myDropoff}
                  onChange={e => setMyDropoff(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-green-500 text-sm transition"
                  placeholder={`Default: ${ride.dropoffLocation}`}
                />
              </div>
            </div>

            {/* Seats */}
            <div className="mb-4">
              <label className="text-gray-700 text-sm font-semibold block mb-2">Seats Needed</label>
              <div className="flex gap-2">
                {Array.from({ length: Math.min(ride.availableSeats, 4) }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setSeats(n)}
                    className={`w-11 h-11 rounded-xl border-2 text-sm font-bold transition-all ${
                      seats === n
                        ? "bg-gray-900 border-gray-900 text-white"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Message to driver */}
            <div className="mb-5">
              <label className="text-gray-700 text-sm font-semibold block mb-2">
                Message to Driver <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
                placeholder="E.g. I have a small bag, I'll be at the gate…"
                className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-green-500 text-sm transition resize-none"
              />
            </div>

            {/* Fare preview */}
            {ride.pricePerSeat && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 text-sm font-medium">
                    Total fare for {seats} seat{seats > 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-green-700 font-bold text-base">
                  BDT {ride.pricePerSeat * seats}
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleJoin}
              disabled={submitting || !myPickup.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-sm"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending Request…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Send Join Request</>
              )}
            </button>
            <p className="text-gray-400 text-center text-xs mt-3">
              The driver will approve or decline your request. Your seat is only reserved after approval.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Available Rides (driver offers) ──────────────────────────────────
function AvailableRides() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rides,         setRides]         = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [searchFrom,    setSearchFrom]    = useState("");
  const [searchTo,      setSearchTo]      = useState("");
  const [joiningRide,   setJoiningRide]   = useState<any>(null);
  const [successRideId, setSuccessRideId] = useState<string | null>(null);

  const loadRides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ridesApi.getShared({
        pickup:      searchFrom || undefined,
        destination: searchTo   || undefined,
        seats: 1,
      });
      setRides(res.rides || []);
    } catch {
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [searchFrom, searchTo]);

  useEffect(() => { loadRides(); }, []);

  // Real-time: new ride published by a driver → add to top of list instantly
  useEffect(() => {
    const socket = getSocket();
    const handler = (newRide: any) => {
      // Normalise: backend sends 'creator' field, cards expect 'driver'
      const normalised = {
        ...newRide,
        driver: newRide.driver ?? newRide.creator,
        type: newRide.type ?? 'DRIVER_CREATED_SHARED',
      };
      setRides(prev => {
        const exists = prev.some(r => r.id === normalised.id);
        return exists ? prev : [normalised, ...prev];
      });
    };
    socket.on("ride:offer_published", handler);
    return () => { socket.off("ride:offer_published", handler); };
  }, []);

  function formatDep(ride: any) {
    if (!ride.departureTime) return "Flexible";
    const d = new Date(ride.departureTime);
    return `${d.toLocaleDateString("en-BD", { day: "numeric", month: "short" })} · ${d.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>
            Available Rides
          </h2>
          <p className="text-gray-400 text-sm">
            Drivers have offered these routes. Join one that matches your commute.
          </p>
        </div>
        <button
          onClick={loadRides}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Search filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Filter rides</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500" />
            <input
              type="text"
              value={searchFrom}
              onChange={e => setSearchFrom(e.target.value)}
              placeholder="Rides from… (e.g. Mirpur)"
              className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-400 transition"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-gray-800" />
            <input
              type="text"
              value={searchTo}
              onChange={e => setSearchTo(e.target.value)}
              placeholder="Rides to… (e.g. Gulshan)"
              className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-400 transition"
            />
          </div>
        </div>
        <button
          onClick={loadRides}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Search className="w-3.5 h-3.5" /> Search Rides
        </button>
      </div>

      {/* Ride cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : rides.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-14 text-center">
          <Share2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No available rides right now</p>
          <p className="text-gray-300 text-xs mt-1">Check back later — drivers publish new routes frequently.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride: any) => {
            const alreadyJoined = successRideId === ride.id;
            return (
              <div
                key={ride.id}
                className={`bg-white border rounded-2xl p-5 transition-all hover:shadow-sm ${
                  alreadyJoined ? "border-green-200 bg-green-50/30" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                {/* Top row: driver + price */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {ride.driver?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "D"}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-sm">{ride.driver?.name || "Driver"}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap mt-0.5">
                        {ride.driver?.driverProfile?.rating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {ride.driver.driverProfile.rating.toFixed(1)}
                          </span>
                        )}
                        {ride.vehicle && (
                          <span>{ride.vehicle.make} {ride.vehicle.model}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {ride.pricePerSeat ? (
                      <>
                        <p className="text-green-700 font-bold text-base">BDT {ride.pricePerSeat}</p>
                        <p className="text-gray-400 text-xs">per seat</p>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">Free</span>
                    )}
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex flex-col items-center mt-1 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white ring-1 ring-green-200" />
                    <div className="w-px h-5 bg-gray-200 my-0.5" />
                    <div className="w-2.5 h-2.5 rounded-sm bg-gray-800 border-2 border-white ring-1 ring-gray-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm font-semibold truncate">{ride.pickupLocation}</p>
                    <p className="text-gray-400 text-xs my-1.5">↓</p>
                    <p className="text-gray-800 text-sm font-semibold truncate">{ride.dropoffLocation}</p>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {ride.departureTime && (
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600 text-xs font-medium">{formatDep(ride)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs font-medium ${ride.availableSeats === 0 ? "text-red-500" : "text-gray-600"}`}>
                      {ride.availableSeats} seat{ride.availableSeats !== 1 ? "s" : ""} left
                    </span>
                  </div>
                  <span className="text-gray-300 font-mono text-xs">#{ride.rideCode}</span>
                </div>

                {/* Notes */}
                {ride.notes && (
                  <p className="text-gray-400 text-xs italic mb-4 leading-relaxed">
                    "{ride.notes}"
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-50">
                  {alreadyJoined ? (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-2.5 rounded-xl text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Request Sent!
                    </div>
                  ) : ride.availableSeats === 0 ? (
                    <div className="flex-1 flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-400 py-2.5 rounded-xl text-sm font-medium">
                      Full
                    </div>
                  ) : (
                    <button
                      onClick={() => setJoiningRide(ride)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                    >
                      <Users className="w-4 h-4" /> Join Ride
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/ride/${ride.id}`)}
                    className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-gray-400 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join modal */}
      {joiningRide && (
        <JoinModal
          ride={joiningRide}
          onClose={() => setJoiningRide(null)}
          onSuccess={() => {
            setSuccessRideId(joiningRide.id);
            setJoiningRide(null);
            loadRides();
          }}
        />
      )}
    </div>
  );
}

// ── Fare calculator ───────────────────────────────────────────────────
function calcFare(distKm: number, baseFare = 30, perKmRate = 12) {
  return Math.max(baseFare, Math.round(distKm * perKmRate));
}

// ── Book a Ride ───────────────────────────────────────────────────────
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
  // Rating state
  const [ratingVal, setRatingVal] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  // Payment state
  const [isPaid, setIsPaid] = useState(false);
  const [payingMethod, setPayingMethod] = useState("CASH");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Computed fare
  const estimatedFare = routeInfo ? calcFare(routeInfo.distanceKm) : null;

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
    joinRideRoom(bookedRide.id);
    const socket = getSocket();
    const handler = (data: any) => {
      if (data.status) setRideStatus(data.status);
      if (data.driver) setDriverInfo(data.driver);
    };
    socket.on("ride:status_update", handler);
    return () => { socket.off("ride:status_update", handler); leaveRideRoom(bookedRide.id); };
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
        totalFare: estimatedFare || undefined,
        paymentMethod: "CASH",
      });
      setBookedRide(res.data);
      setRideStatus(res.data.status || "PENDING");
      setBooked(true);
    } catch {
      setBooked(true);
    } finally {
      setSearching(false);
    }
  }

  async function handleCancel() {
    if (bookedRide?.id) {
      try { await ridesApi.cancel(bookedRide.id); } catch {}
    }
    setBooked(false); setPickup(""); setDest(""); setBookedRide(null); setRideStatus("PENDING"); setDriverInfo(null);
  }

  async function handlePay() {
    if (!bookedRide?.id) return;
    setSubmittingPayment(true);
    setPaymentError("");
    try {
      await ridesApi.pay(bookedRide.id, payingMethod);
      setIsPaid(true);
    } catch (err: any) {
      console.error("PAYMENT ERROR:", err);
      setPaymentError(err?.data?.message || err?.message || "Payment failed. Please try again.");
    }
    setSubmittingPayment(false);
  }

  async function handleSubmitRating() {
    if (!ratingVal || !bookedRide?.id || !driverInfo?.id) return;
    setSubmittingRating(true);
    try {
      await ratings.submit({
        rideId: bookedRide.id,
        toUserId: driverInfo.id,
        rating: ratingVal,
        comment: ratingComment.trim() || undefined,
      });
      setRatingSubmitted(true);
    } catch { /* ignore */ }
    setSubmittingRating(false);
  }

  function handleNewRide() {
    setBooked(false); setPickup(""); setDest(""); setBookedRide(null);
    setRideStatus("PENDING"); setDriverInfo(null);
    setRatingVal(0); setRatingComment(""); setRatingSubmitted(false);
    setIsPaid(false); setPayingMethod("CASH"); setPaymentError("");
  }

  // ── Post-booking status screen ────────────────────────────────
  if (booked) {
    const isCompleted = rideStatus === "COMPLETED";
    const isConfirmed = rideStatus === "CONFIRMED";
    const isInProgress = rideStatus === "IN_PROGRESS";
    const isPending = !isCompleted && !isConfirmed && !isInProgress;

    return (
      <div className="flex flex-col items-center justify-center py-8 text-center max-w-md mx-auto space-y-5">
        {/* Status icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          isCompleted ? "bg-green-50" :
          isConfirmed || isInProgress ? "bg-blue-50" : "bg-gray-100"
        }`}>
          {isCompleted ? <CheckCircle2 className="w-8 h-8 text-green-600" /> :
           isConfirmed || isInProgress ? <Check className="w-8 h-8 text-blue-600" /> :
           <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />}
        </div>

        {/* Status title */}
        <div>
          <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>
            {isCompleted ? "Ride Completed!" :
             isInProgress ? "Ride in Progress" :
             isConfirmed ? "Driver Found!" : "Finding your driver…"}
          </h2>
          <p className="text-gray-500 text-sm">
            Code: <strong className="text-gray-800">{bookedRide?.rideCode || "SR-XXX"}</strong>
          </p>
        </div>

        {/* Status badge */}
        <div className={`text-xs font-semibold px-4 py-1.5 rounded-full ${
          isCompleted ? "bg-green-50 text-green-700 border border-green-100" :
          isInProgress ? "bg-blue-50 text-blue-600 border border-blue-100" :
          isConfirmed ? "bg-green-50 text-green-600 border border-green-100" :
          "bg-yellow-50 text-yellow-600 border border-yellow-100"
        }`}>
          {isCompleted ? "Trip completed — rate your driver below" :
           isInProgress ? "You're on the way!" :
           isConfirmed ? "Driver is on the way" : "Broadcasting to nearby drivers…"}
        </div>

        {/* Driver info */}
        {driverInfo && (
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 w-full">
            <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
              {driverInfo.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "D"}
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-900 font-semibold text-sm">{driverInfo.name}</p>
              <p className="text-gray-400 text-xs">Your driver</p>
            </div>
          </div>
        )}

        {/* Route + fare summary */}
        <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-5 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">From</span>
            <span className="text-gray-900 font-semibold">{pickup}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">To</span>
            <span className="text-gray-900 font-semibold">{dest}</span>
          </div>
          {estimatedFare && (
            <>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated fare</span>
                <span className="text-green-700 font-bold">BDT {estimatedFare}</span>
              </div>
            </>
          )}
          {routeInfo && (
            <>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Distance</span>
                <span className="text-gray-600 font-medium">{routeInfo.distanceKm.toFixed(1)} km · ~{Math.round(routeInfo.durationMin)} min</span>
              </div>
            </>
          )}
        </div>

        {/* ── COMPLETED: Payment + Rating Flow ─────────────────── */}
        {isCompleted && !isPaid && (
          <div className="w-full bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-gray-900 font-bold text-lg">Pay for Your Ride</h3>
              <p className="text-gray-400 text-xs mt-1">Complete payment to finish your trip</p>
            </div>

            {/* Fare breakdown */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ride fare</span>
                <span className="text-gray-900 font-semibold">BDT {estimatedFare || bookedRide?.totalFare || '—'}</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between text-base">
                <span className="text-gray-900 font-bold">Total</span>
                <span className="text-green-700 font-mono" style={{ fontWeight: 900, fontSize: "1.3rem" }}>
                  BDT {estimatedFare || bookedRide?.totalFare || '—'}
                </span>
              </div>
            </div>

            {/* Payment method selector */}
            <div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "CASH", label: "Cash", icon: "💵" },
                  { id: "BKASH", label: "bKash", icon: "📱" },
                  { id: "NAGAD", label: "Nagad", icon: "📲" },
                  { id: "ROCKET", label: "Rocket", icon: "🚀" },
                ].map(m => (
                  <button key={m.id} onClick={() => setPayingMethod(m.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                      payingMethod === m.id
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}>
                    <span className="text-lg">{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {paymentError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-600 text-sm">{paymentError}</p>
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={submittingPayment}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {submittingPayment ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment…</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Pay BDT {estimatedFare || bookedRide?.totalFare || '0'}</>
              )}
            </button>
          </div>
        )}

        {/* ── Payment Success + Rating UI ─────────────────────── */}
        {isCompleted && isPaid && (
          <>
            {/* Payment success badge */}
            <div className="w-full bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-green-700 font-bold text-sm">Payment Successful!</p>
                <p className="text-green-600 text-xs">BDT {estimatedFare || bookedRide?.totalFare} paid via {payingMethod}</p>
              </div>
            </div>

            {/* Rating UI (only after payment) */}
            {driverInfo && !ratingSubmitted && (
              <div className="w-full bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-gray-900 font-bold text-base">Rate Your Driver</h3>
                  <p className="text-gray-400 text-xs mt-0.5">How was your ride with {driverInfo.name}?</p>
                </div>
                {/* Stars */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRatingVal(n)}
                      className="group transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star className={`w-9 h-9 transition-colors ${
                        n <= ratingVal ? "fill-yellow-400 text-yellow-400" : "text-gray-200 group-hover:text-yellow-300"
                      }`} />
                    </button>
                  ))}
                </div>
                {ratingVal > 0 && (
                  <p className="text-center text-sm font-medium text-gray-700">
                    {ratingVal === 5 ? "Excellent! 🌟" :
                     ratingVal === 4 ? "Great ride! 👍" :
                     ratingVal === 3 ? "It was okay" :
                     ratingVal === 2 ? "Could be better" : "Poor experience"}
                  </p>
                )}
                {/* Comment */}
                <textarea
                  value={ratingComment}
                  onChange={e => setRatingComment(e.target.value)}
                  rows={2}
                  placeholder="Leave a comment (optional)…"
                  className="w-full py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-gray-400 text-sm transition resize-none"
                />
                {/* Submit */}
                <button
                  onClick={handleSubmitRating}
                  disabled={!ratingVal || submittingRating}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {submittingRating ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Star className="w-4 h-4" /> Submit Rating</>}
                </button>
              </div>
            )}

            {/* Rating submitted success */}
            {ratingSubmitted && (
              <div className="w-full bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-bold text-sm">Thank you for your feedback!</p>
                <p className="text-green-600 text-xs mt-1">Your {ratingVal}-star rating has been submitted.</p>
              </div>
            )}
          </>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 w-full">
          {isCompleted ? (
            <button onClick={handleNewRide}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
              Book Another Ride
            </button>
          ) : (
            <>
              {bookedRide?.id && (isConfirmed || isInProgress) && (
                <button onClick={() => navigate(`/chat/${bookedRide.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  <MessageSquare className="w-4 h-4" /> Chat Driver
                </button>
              )}
              {!isCompleted && (
                <button onClick={handleCancel}
                  className="flex-1 text-gray-400 hover:text-red-500 transition-colors text-sm flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  const iconMap: Record<string, any> = { Home, MapPin, Bookmark };

  // ── Booking form ────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Book a Ride</h2>
        <p className="text-gray-400 text-sm">Enter your pickup and destination — we'll calculate the fare automatically.</p>
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

      {/* ── Estimated fare card ──────────────────────────────── */}
      {estimatedFare && routeInfo && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Estimated Fare</span>
            <span className="text-green-700 font-mono" style={{ fontWeight: 900, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>
              BDT {estimatedFare}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{routeInfo.distanceKm.toFixed(1)} km</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />~{Math.round(routeInfo.durationMin)} min</span>
            <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />Cash</span>
          </div>
          <p className="text-gray-300 text-xs mt-2">Fare may vary slightly based on route and traffic.</p>
        </div>
      )}

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
        className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white py-3.5 rounded-xl font-semibold transition-colors text-sm flex items-center justify-center gap-2">
        {searching ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Broadcasting to drivers…</>
        ) : (
          <>{estimatedFare ? `Book Now · BDT ${estimatedFare}` : "Book Now"}</>
        )}
      </button>
      {estimatedFare && (
        <p className="text-gray-300 text-center text-xs">
          Your request will be sent to all nearby drivers. First driver to accept gets the ride.
        </p>
      )}
    </div>
  );
}


// ── My Rides ──────────────────────────────────────────────────────────
function MyRides() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rideHistory, setRideHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    users.getRideHistory()
      .then(res => setRideHistory(res.rides || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Calculate fare for a ride from the user's perspective
  function getUserFare(r: any): number | null {
    // ON_DEMAND: user is the creator, fare is totalFare
    if (r.totalFare) return r.totalFare;
    if (r.baseFare) return r.baseFare;
    // Shared ride: find the user's participant record
    if (r.participants && user?.id) {
      const myPart = r.participants.find((p: any) => p.userId === user.id);
      if (myPart?.fareAmount) return myPart.fareAmount;
      if (myPart && r.pricePerSeat) return r.pricePerSeat * (myPart.seatsBooked || 1);
    }
    // Fallback for shared rides where user is the creator (driver-shared)
    if (r.pricePerSeat) return r.pricePerSeat;
    return null;
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  const completedRides = rideHistory.filter((r: any) => r.status === "COMPLETED");
  const totalSpent = completedRides.reduce((sum: number, r: any) => sum + (getUserFare(r) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>My Rides</h2>
        <p className="text-gray-400 text-sm">{completedRides.length} completed rides.</p>
      </div>

      {/* Total spent summary */}
      {completedRides.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 text-white">
          <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Total Spent</p>
          <p style={{ fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.03em" }}>BDT {totalSpent.toLocaleString()}</p>
          <p className="text-white/30 text-xs mt-1">{completedRides.length} ride{completedRides.length !== 1 ? 's' : ''} completed</p>
        </div>
      )}

      {rideHistory.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-sm">No rides yet. Book your first ride!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rideHistory.map((r: any) => {
            const fare = getUserFare(r);
            return (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-gray-900 font-semibold text-sm truncate">{r.pickupLocation} &rarr; {r.dropoffLocation}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })} &middot; {r.driver?.name || 'Unassigned'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {fare ? (
                      <p className="text-green-700 font-bold text-sm">BDT {fare}</p>
                    ) : (
                      <p className="text-gray-300 font-medium text-sm">—</p>
                    )}
                    <p className={`text-xs mt-0.5 font-medium ${
                      r.status === "COMPLETED" ? "text-green-600" :
                      r.status === "CANCELLED" ? "text-red-400" :
                      r.status === "IN_PROGRESS" ? "text-blue-500" : "text-yellow-500"
                    }`}>
                      {r.status === "COMPLETED" ? "Completed" :
                       r.status === "CANCELLED" ? "Cancelled" :
                       r.status === "IN_PROGRESS" ? "In Progress" : "Pending"}
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
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/ride/${r.id}`)}
                      className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-medium transition-colors text-xs">
                      <MapPin className="w-3.5 h-3.5" /> View
                    </button>
                    {(r.status === 'CONFIRMED' || r.status === 'IN_PROGRESS') && (
                      <button onClick={() => navigate(`/chat/${r.id}`)}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors text-xs">
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </button>
                    )}
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

// ── Saved Places ──────────────────────────────────────────────────────
function SavedPlaces() {
  const [places, setPlaces] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddr, setNewAddr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    users.getSavedPlaces().then(res => setPlaces(res.data || [])).catch(() => {}).finally(() => setLoading(false));
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
    try { await users.deleteSavedPlace(id); setPlaces(prev => prev.filter(x => x.id !== id)); } catch {}
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
              <button onClick={() => remove(p.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Payments ──────────────────────────────────────────────────────────
function Payments() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    users.getPaymentMethods().then(res => setCards(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function setDefault(id: string) {
    try { await users.setDefaultPayment(id); setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id }))); } catch {}
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

// ── Profile ───────────────────────────────────────────────────────────
function Profile({ user: authUser }: { user: { name: string; email: string; avatar: string } }) {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState(authUser.name);
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    users.getProfile().then(res => { setProfile(res.data); setName(res.data.name); setPhone(res.data.phone || ""); }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try { await users.updateProfile({ name, phone }); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch {}
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

// ── Shell ─────────────────────────────────────────────────────────────
export function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("available");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() { logout(); navigate("/login"); }

  function sectionContent() {
    switch (section) {
      case "book":      return <BookRide />;
      case "available": return <AvailableRides />;
      case "rides":     return <MyRides />;
      case "places":    return <SavedPlaces />;
      case "payments":  return <Payments />;
      case "profile":   return <Profile user={user!} />;
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
          <p className="text-gray-400 text-xs mt-0.5">Passenger Portal</p>
        </div>
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => {
              if (id === "profile") { navigate("/dashboard/account"); setSidebarOpen(false); }
              else { setSection(id); setSidebarOpen(false); }
            }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors ${
                section === id
                  ? id === "available"
                    ? "bg-green-600 text-white"
                    : "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
              }`}
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
          {sectionContent()}
        </main>
      </div>
    </div>
  );
}