import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, MapPin, Navigation, Clock, Users, Car,
  ChevronRight, Loader2, CheckCircle2, X, Info,
  DollarSign, Share2, Zap,
} from "lucide-react";
import { MapComponent, RouteInfo } from "../components/MapComponent";
import { rides as ridesApi, drivers as driversApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

// ── Helpers ───────────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function formatTime(d: Date) {
  return d.toTimeString().slice(0, 5);
}

// Recommended fare: ~BDT 12/km per seat
function recommendedFare(distKm: number, seats: number) {
  if (!distKm) return 0;
  const raw = Math.round((distKm * 12) / seats) * seats; // keep per-seat round
  return Math.max(20, Math.round((distKm * 12)));
}

// ── Types ─────────────────────────────────────────────────────────────
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate: string;
  totalSeats: number;
}

// ── SeatSelector ──────────────────────────────────────────────────────
function SeatSelector({
  total,
  available,
  onAvailableChange,
}: {
  total: number;
  available: number;
  onAvailableChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-700 font-semibold text-sm">
          Seats available for passengers
        </p>
        <span className="text-gray-500 text-xs">
          {available} of {total} available
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const isDriver = n === total - available + 1 && false; // just for readability
          const isAvail = n <= available;
          return (
            <button
              key={n}
              onClick={() => onAvailableChange(n)}
              title={`${n} seat${n > 1 ? "s" : ""} available`}
              className={`w-10 h-10 rounded-xl border-2 text-sm font-bold transition-all ${
                n <= available
                  ? "bg-green-600 border-green-600 text-white shadow-sm"
                  : "bg-gray-50 border-gray-200 text-gray-400"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <p className="text-gray-400 text-xs mt-2">
        Tap a seat number to set how many seats are open for others to join.
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export function OfferRidePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Form state ────────────────────────────────────────────────────
  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo] = useState("");
  const [departureDate, setDepartureDate] = useState(formatDate(new Date()));
  const [departureTime, setDepartureTime] = useState(formatTime(new Date(Date.now() + 30 * 60 * 1000)));
  const [totalSeats, setTotalSeats] = useState(4);
  const [availableSeats, setAvailableSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [paymentMethod] = useState<"CASH">("CASH");

  // ── Data state ────────────────────────────────────────────────────
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ── Submission state ──────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [publishedRide, setPublishedRide] = useState<any>(null);
  const [error, setError] = useState("");

  // ── Load driver profile & vehicles ───────────────────────────────
  useEffect(() => {
    if (!user) {
      navigate("/login?redirect=/offer-ride");
      return;
    }
    if (user.role !== "driver") {
      // Non-drivers can still offer if they have no profile, direct them
    }
    driversApi
      .getProfile()
      .then((res: any) => {
        const profile = res.data;
        const vList: Vehicle[] = (profile?.vehicles || []).filter((v: any) => v.isActive);
        setVehicles(vList);
        if (vList.length > 0) {
          setSelectedVehicleId(vList[0].id);
          setTotalSeats(vList[0].totalSeats);
          setAvailableSeats(Math.max(1, vList[0].totalSeats - 1));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [user, navigate]);

  // ── When vehicle changes, update seat counts ──────────────────────
  useEffect(() => {
    const v = vehicles.find((v) => v.id === selectedVehicleId);
    if (v) {
      setTotalSeats(v.totalSeats);
      setAvailableSeats(Math.max(1, v.totalSeats - 1));
    }
  }, [selectedVehicleId, vehicles]);

  // ── Route change callback ─────────────────────────────────────────
  const handleRouteChange = useCallback((route: RouteInfo | null) => {
    setRouteInfo(route);
    if (route && !pricePerSeat) {
      setPricePerSeat(String(recommendedFare(route.distanceKm, availableSeats)));
    }
  }, [pricePerSeat, availableSeats]);

  // ── Auto-update recommended price when route/seats change ─────────
  useEffect(() => {
    if (routeInfo) {
      setPricePerSeat(String(recommendedFare(routeInfo.distanceKm, availableSeats)));
    }
  }, [routeInfo, availableSeats]);

  // ── Publish handler ───────────────────────────────────────────────
  async function handlePublish() {
    if (!user) { navigate("/login?redirect=/offer-ride"); return; }
    if (!routeFrom.trim() || !routeTo.trim()) {
      setError("Please enter both start and end locations."); return;
    }
    if (!departureDate || !departureTime) {
      setError("Please set a departure date and time."); return;
    }
    if (!pricePerSeat || Number(pricePerSeat) <= 0) {
      setError("Please enter a price per seat."); return;
    }
    const depTime = new Date(`${departureDate}T${departureTime}`);
    if (depTime <= new Date()) {
      setError("Departure time must be in the future."); return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await ridesApi.create({
        type: "DRIVER_CREATED_SHARED",
        pickupLocation: routeFrom.trim(),
        pickupLat: routeInfo?.pickupCoords?.lat ?? 23.8103,
        pickupLng: routeInfo?.pickupCoords?.lng ?? 90.4125,
        dropoffLocation: routeTo.trim(),
        dropoffLat: routeInfo?.dropoffCoords?.lat ?? 23.7461,
        dropoffLng: routeInfo?.dropoffCoords?.lng ?? 90.3742,
        departureTime: depTime.toISOString(),
        totalSeats: availableSeats,
        pricePerSeat: Number(pricePerSeat),
        paymentMethod,
        sharingEnabled: true,
        notes: notes.trim() || undefined,
        vehicleId: selectedVehicleId || undefined,
      });
      setPublishedRide(res.data);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to publish ride.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────
  if (publishedRide) {
    return (
      <div
        className="min-h-screen bg-white flex items-center justify-center"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="max-w-sm mx-auto text-center px-6 py-16">
          {/* Animated checkmark */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-40" />
            <div className="relative w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: "1.5rem" }}>
            Ride Published!
          </h2>
          <p className="text-gray-500 text-sm mb-1">
            Your ride code is{" "}
            <strong className="text-gray-900 font-mono">{publishedRide.rideCode}</strong>
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Passengers can now find and join your ride.
          </p>

          {/* Summary card */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left space-y-3 mb-6">
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs mb-0.5">From</p>
                <p className="text-gray-900 text-sm font-semibold">{routeFrom}</p>
              </div>
            </div>
            <div className="ml-1 w-px h-4 bg-gray-200" />
            <div className="flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-gray-900 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs mb-0.5">To</p>
                <p className="text-gray-900 text-sm font-semibold">{routeTo}</p>
              </div>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-gray-400 mb-0.5">Seats</p>
                <p className="text-gray-900 font-bold">{availableSeats}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-0.5">Price</p>
                <p className="text-gray-900 font-bold">BDT {pricePerSeat}/seat</p>
              </div>
              {routeInfo && (
                <div>
                  <p className="text-gray-400 mb-0.5">Distance</p>
                  <p className="text-gray-900 font-bold">~{routeInfo.distanceKm.toFixed(1)} km</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/ride/${publishedRide.id}`)}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              View Ride
            </button>
            <button
              onClick={() => navigate("/driver")}
              className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-700 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Dashboard
            </button>
          </div>

          <button
            onClick={() => {
              setPublishedRide(null);
              setRouteFrom("");
              setRouteTo("");
              setNotes("");
              setPricePerSeat("");
            }}
            className="mt-3 text-gray-400 hover:text-gray-600 text-sm transition-colors"
          >
            Offer another ride
          </button>
        </div>
      </div>
    );
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // ── Main form ─────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1rem" }}>
              Offer a Ride
            </h1>
            <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>
              Share your route and set available seats
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
            <Share2 className="w-3.5 h-3.5 text-green-600" />
            <span className="text-green-700 text-xs font-semibold">Carpool Mode</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-[1fr,380px] gap-8">

          {/* ── Left column ──────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Map preview */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
                Route Preview
              </p>
              <MapComponent
                pickupText={routeFrom}
                dropoffText={routeTo}
                onRouteChange={handleRouteChange}
                height="280px"
                showGeolocationButton={false}
              />
              {routeInfo && (
                <div className="flex gap-3 mt-3">
                  <span className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-medium text-center">
                    📏 ~{routeInfo.distanceKm.toFixed(1)} km
                  </span>
                  <span className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-medium text-center">
                    ⏱ ~{Math.round(routeInfo.durationMin)} min
                  </span>
                  <span className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 font-medium text-center">
                    💰 BDT {pricePerSeat || "—"}/seat
                  </span>
                </div>
              )}
            </div>

            {/* Route inputs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-gray-900 font-bold" style={{ fontSize: "1rem" }}>
                Your Route
              </h3>

              {/* From */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10">
                  <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-white" />
                </div>
                <input
                  type="text"
                  value={routeFrom}
                  onChange={(e) => setRouteFrom(e.target.value)}
                  className="w-full pl-9 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-green-500 text-sm transition"
                  placeholder="Start location (e.g. Mirpur 10)"
                />
                <button
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition(pos => {
                      setRouteFrom(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                    });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition"
                  title="Use my location"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>

              {/* Connector */}
              <div className="flex items-center gap-3 px-3">
                <div className="flex flex-col gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-0.5 h-1.5 bg-gray-300 rounded-full mx-auto" />
                  ))}
                </div>
              </div>

              {/* To */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
                  <div className="w-2.5 h-2.5 rounded-sm bg-gray-800" />
                </div>
                <input
                  type="text"
                  value={routeTo}
                  onChange={(e) => setRouteTo(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-green-500 text-sm transition"
                  placeholder="End location (e.g. Gulshan 2)"
                />
              </div>
            </div>

            {/* Departure time */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-gray-900 font-bold text-sm">Departure Time</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 text-xs font-medium block mb-1">Date</label>
                  <input
                    type="date"
                    value={departureDate}
                    min={formatDate(new Date())}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-medium block mb-1">Time</label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full py-2.5 px-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-green-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle & seats */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-4 h-4 text-gray-400" />
                <h3 className="text-gray-900 font-bold text-sm">Vehicle & Seats</h3>
              </div>

              {loadingProfile ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading vehicle info…
                </div>
              ) : vehicles.length > 0 ? (
                <div className="space-y-4">
                  {/* Vehicle selector */}
                  <div>
                    <label className="text-gray-500 text-xs font-medium block mb-2">Select vehicle</label>
                    <div className="space-y-2">
                      {vehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all flex items-center justify-between ${
                            selectedVehicleId === v.id
                              ? "border-green-600 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Car className={`w-4 h-4 ${selectedVehicleId === v.id ? "text-green-600" : "text-gray-400"}`} />
                            <div>
                              <p className="text-gray-900 text-sm font-semibold">
                                {v.make} {v.model} ({v.year})
                              </p>
                              <p className="text-gray-500 text-xs">{v.color} · {v.plate} · {v.totalSeats} seats</p>
                            </div>
                          </div>
                          {selectedVehicleId === v.id && (
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seat visual selector */}
                  <div className="pt-4 border-t border-gray-100">
                    <SeatSelector
                      total={totalSeats}
                      available={availableSeats}
                      onAvailableChange={setAvailableSeats}
                    />
                    {selectedVehicle && (
                      <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-700 text-xs leading-relaxed">
                          You have a <strong>{totalSeats}-seater {selectedVehicle.make} {selectedVehicle.model}</strong>. Currently offering{" "}
                          <strong>{availableSeats} seat{availableSeats > 1 ? "s" : ""}</strong> to passengers.
                          {totalSeats - availableSeats > 0 && ` ${totalSeats - availableSeats} seat${totalSeats - availableSeats > 1 ? "s are" : " is"} reserved for you/others.`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 text-sm font-semibold mb-1">No vehicle registered</p>
                      <p className="text-amber-700 text-xs leading-relaxed mb-3">
                        You need to register as a driver and add a vehicle to offer rides.
                      </p>
                      <button
                        onClick={() => navigate("/drive/apply")}
                        className="text-amber-800 text-xs font-semibold underline"
                      >
                        Apply to drive →
                      </button>
                    </div>
                  </div>

                  {/* Allow manual seat entry even without vehicle */}
                  <div className="mt-4 pt-4 border-t border-amber-200">
                    <p className="text-amber-700 text-xs font-medium mb-3">Or enter manually:</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-gray-500 text-xs font-medium block mb-1">Total seats in car</label>
                        <select
                          value={totalSeats}
                          onChange={(e) => {
                            const t = Number(e.target.value);
                            setTotalSeats(t);
                            setAvailableSeats(Math.min(availableSeats, t - 1));
                          }}
                          className="w-full py-2 px-3 bg-white border border-amber-200 rounded-lg text-gray-700 text-sm"
                        >
                          {[2, 3, 4, 5, 6, 7, 8].map(n => (
                            <option key={n} value={n}>{n} seats</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-gray-500 text-xs font-medium block mb-1">Available for passengers</label>
                        <select
                          value={availableSeats}
                          onChange={(e) => setAvailableSeats(Number(e.target.value))}
                          className="w-full py-2 px-3 bg-white border border-amber-200 rounded-lg text-gray-700 text-sm"
                        >
                          {Array.from({ length: totalSeats - 1 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <label className="text-gray-900 font-bold text-sm block mb-3">
                Notes for passengers <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="E.g. AC car, no smoking, prefer light luggage, will stop at Farmgate on the way…"
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-green-500 text-sm transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* ── Right column (sticky summary) ─────────────────────── */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-5">

            {/* Pricing */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <h3 className="text-gray-900 font-bold text-sm">Price per Seat</h3>
              </div>

              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">
                  BDT
                </span>
                <input
                  type="number"
                  min="10"
                  max="5000"
                  step="5"
                  value={pricePerSeat}
                  onChange={(e) => setPricePerSeat(e.target.value)}
                  className="w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold text-lg focus:outline-none focus:border-green-500 transition"
                  placeholder="—"
                />
              </div>

              {routeInfo && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <Zap className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 text-xs">
                    Recommended: <strong>BDT {recommendedFare(routeInfo.distanceKm, availableSeats)}/seat</strong> for ~{routeInfo.distanceKm.toFixed(1)} km
                  </p>
                </div>
              )}
            </div>

            {/* Summary card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-gray-900 font-bold text-sm mb-4">Trip Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Route</span>
                  <span className="text-gray-900 font-semibold text-right max-w-[170px] truncate">
                    {routeFrom ? `${routeFrom} → ${routeTo || "…"}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Departure</span>
                  <span className="text-gray-900 font-semibold">
                    {departureDate && departureTime
                      ? `${departureDate} ${departureTime}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Seats offered</span>
                  <span className="text-gray-900 font-semibold">{availableSeats}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Price/seat</span>
                  <span className="text-gray-900 font-semibold">
                    {pricePerSeat ? `BDT ${pricePerSeat}` : "—"}
                  </span>
                </div>
                {routeInfo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Distance</span>
                      <span className="text-gray-900 font-semibold">~{routeInfo.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Est. duration</span>
                      <span className="text-gray-900 font-semibold">~{Math.round(routeInfo.durationMin)} min</span>
                    </div>
                  </>
                )}
                {pricePerSeat && availableSeats > 0 && (
                  <>
                    <div className="h-px bg-gray-100" />
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-bold">Max earnings</span>
                      <span className="text-green-600 font-bold text-base">
                        BDT {Number(pricePerSeat) * availableSeats}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={submitting || !routeFrom.trim() || !routeTo.trim() || !pricePerSeat}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>Publishing…</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span style={{ fontWeight: 700, fontSize: "1rem" }}>Publish Ride Offer</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-gray-400 text-center text-xs leading-relaxed">
              Passengers will send join requests which you can approve or decline. Seats are only reserved after your approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
