import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft, MapPin, Navigation, Clock, User, ChevronRight, Loader2, LogIn, CheckCircle2, X,
} from "lucide-react";
import { MapComponent, RouteInfo } from "../components/MapComponent";
import { rides as ridesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const PAYMENT_METHODS = [
  { id: "cash", name: "Cash", icon: "৳" },
  { id: "bkash", name: "bKash", icon: "" },
  { id: "nagad", name: "Nagad", icon: "" },
  { id: "card", name: "Card", icon: "" },
];

interface RideType {
  id: string;
  name: string;
  description: string;
  baseFare: number;
  pricePerKm: number;
  eta: string;
  capacity: string;
  features: string[];
}

export function FindRidePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ── Form state ──────────────────────────────────────────────────
  const [pickup, setPickup] = useState("Dhanmondi 27");
  const [dropoff, setDropoff] = useState("Gulshan 1 Circle");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const p = params.get("pickup");
    const d = params.get("dropoff");
    if (p) setPickup(p);
    if (d) setDropoff(d);
  }, [location.search]);
  const [selectedRide, setSelectedRide] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [promoCode, setPromoCode] = useState("");

  // ── Data state ──────────────────────────────────────────────────
  const [rideTypes, setRideTypes] = useState<RideType[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // ── Booking state ───────────────────────────────────────────────
  const [booking, setBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");

  // ── Load ride types from backend ────────────────────────────────
  useEffect(() => {
    ridesApi
      .getTypes()
      .then((res) => {
        const types: RideType[] = (res.data || []).map((t: any) => ({
          id: t.name.toLowerCase().replace(/\s+/g, "-"),
          name: t.name,
          description: t.description,
          baseFare: t.baseFare ?? 80,
          pricePerKm: t.pricePerKm ?? 15,
          eta: t.eta || "3 min",
          capacity: `${t.capacity ?? 3} passengers`,
          features: Array.isArray(t.features) ? t.features : [],
        }));
        setRideTypes(types);
        if (types.length) setSelectedRide(types[0].id);
      })
      .catch(() => {
        // Fallback ride types if backend is down
        const fallback: RideType[] = [
          { id: "economy", name: "Economy", description: "Comfortable, affordable rides", baseFare: 80, pricePerKm: 15, eta: "3 min", capacity: "3 passengers", features: ["Standard vehicle", "AC"] },
          { id: "comfort", name: "Comfort", description: "Newer, more comfortable cars", baseFare: 120, pricePerKm: 20, eta: "5 min", capacity: "3 passengers", features: ["Premium vehicle", "AC", "USB charging"] },
          { id: "xl", name: "XL", description: "Up to 6 passengers", baseFare: 160, pricePerKm: 25, eta: "7 min", capacity: "6 passengers", features: ["Minivan/SUV", "AC", "Extra space"] },
        ];
        setRideTypes(fallback);
        setSelectedRide("economy");
      });
  }, []);

  // ── Route change callback from MapComponent ─────────────────────
  const handleRouteChange = useCallback((route: RouteInfo | null) => {
    setRouteInfo(route);
  }, []);

  // ── Compute fare for a ride type ────────────────────────────────
  function computeFare(rt: RideType): number {
    if (!routeInfo) return rt.baseFare;
    return Math.round(rt.baseFare + rt.pricePerKm * routeInfo.distanceKm);
  }

  const selectedRideType = rideTypes.find((r) => r.id === selectedRide);
  const totalFare = selectedRideType ? computeFare(selectedRideType) : 0;

  // ── Confirm booking ─────────────────────────────────────────────
  async function handleConfirm() {
    // Auth gate: redirect to login if not logged in
    if (!user) {
      navigate("/login?redirect=/find-ride");
      return;
    }

    if (!pickup.trim() || !dropoff.trim()) {
      setBookingError("Please enter both pickup and drop-off locations.");
      return;
    }

    setBooking(true);
    setBookingError("");

    try {
      const paymentMap: Record<string, string> = {
        cash: "CASH",
        bkash: "BKASH",
        nagad: "NAGAD",
        card: "CARD",
      };

      const res = await ridesApi.create({
        type: "ON_DEMAND",
        pickupLocation: pickup.trim(),
        pickupLat: routeInfo?.pickupCoords?.lat ?? 23.8103,
        pickupLng: routeInfo?.pickupCoords?.lng ?? 90.4125,
        dropoffLocation: dropoff.trim(),
        dropoffLat: routeInfo?.dropoffCoords?.lat ?? 23.7461,
        dropoffLng: routeInfo?.dropoffCoords?.lng ?? 90.3742,
        totalSeats: passengers,
        paymentMethod: paymentMap[paymentMethod] || "CASH",
        ...(scheduleType === "later" && scheduleDate && scheduleTime
          ? { departureTime: new Date(`${scheduleDate}T${scheduleTime}`).toISOString() }
          : {}),
        ...(promoCode ? { promoCode } : {}),
      });

      setBookingDone(res.data);
    } catch (err: any) {
      setBookingError(err?.data?.message || err?.message || "Failed to book ride. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  // ── Booking success screen ──────────────────────────────────────
  if (bookingDone) {
    return (
      <div
        className="min-h-screen bg-white flex items-center justify-center"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="max-w-sm mx-auto text-center px-6 py-16">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-gray-900 mb-2" style={{ fontWeight: 800, fontSize: "1.4rem" }}>
            Ride Confirmed!
          </h2>
          <p className="text-gray-500 text-sm mb-1">
            Your ride code is{" "}
            <strong className="text-gray-900">{bookingDone.rideCode}</strong>
          </p>
          <p className="text-gray-400 text-sm mb-8">A driver will be assigned shortly.</p>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">From</span>
              <span className="text-gray-900 font-semibold">{pickup}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">To</span>
              <span className="text-gray-900 font-semibold">{dropoff}</span>
            </div>
            {routeInfo && (
              <>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Distance</span>
                  <span className="text-gray-900 font-semibold">
                    ~{routeInfo.distanceKm.toFixed(1)} km
                  </span>
                </div>
              </>
            )}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fare</span>
              <span className="text-gray-900 font-bold">BDT {totalFare}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => {
                setBookingDone(null);
                setPickup("");
                setDropoff("");
              }}
              className="flex-1 border border-gray-200 hover:border-gray-400 text-gray-700 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main page ───────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1rem" }}>
              Book your ride
            </h1>
            <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>
              Choose your ride type and confirm details
            </p>
          </div>
          {!user && (
            <button
              onClick={() => navigate("/login?redirect=/find-ride")}
              className="flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-semibold transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8 lg:gap-12">
          {/* Main content */}
          <div className="space-y-8">
            {/* Map section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 lg:p-6">
              <MapComponent
                pickupText={pickup}
                dropoffText={dropoff}
                onRouteChange={handleRouteChange}
                height="350px"
              />
            </div>

            {/* Route card */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-5">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p
                    className="text-gray-500 mb-1"
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Your route
                  </p>
                  <h2
                    className="text-gray-900 mb-4"
                    style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1.3 }}
                  >
                    {pickup || "Enter pickup"}
                    <span
                      className="block mt-1"
                      style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontStyle: "italic",
                        fontWeight: 400,
                        fontSize: "1.1rem",
                        color: "#16a34a",
                      }}
                    >
                      to {dropoff || "Enter drop-off"}
                    </span>
                  </h2>
                  {routeInfo && (
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                        ~{routeInfo.distanceKm.toFixed(1)} km
                      </span>
                      <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg">
                        ~{Math.round(routeInfo.durationMin)} min
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location inputs */}
              <div className="space-y-2.5">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-white z-10" />
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full pl-8 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:border-green-500 text-sm transition"
                    placeholder="Pickup location (e.g. Dhanmondi 27)"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600">
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-900 z-10" />
                  <input
                    type="text"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:border-green-500 text-sm transition"
                    placeholder="Drop-off location (e.g. Gulshan 1)"
                  />
                </div>
              </div>

              {/* Schedule toggle */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="flex gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5">
                    {(["now", "later"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setScheduleType(t)}
                        className={`px-3 py-1.5 rounded-md transition-all ${
                          scheduleType === t
                            ? "bg-gray-900 text-white"
                            : "text-gray-500 hover:text-gray-800"
                        }`}
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                      >
                        {t === "now" ? "Now" : "Schedule"}
                      </button>
                    ))}
                  </div>
                  {scheduleType === "later" && (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="flex-1 py-1.5 px-2 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-green-400 text-xs"
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-24 py-1.5 px-2 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-green-400 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ride type selection */}
            <div>
              <div className="mb-4">
                <h3 className="text-gray-900 mb-1" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  Choose your ride
                </h3>
                <p className="text-gray-500" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                  {routeInfo
                    ? `Estimates for ~${routeInfo.distanceKm.toFixed(1)} km route`
                    : "Enter pickup & drop-off to see fare estimates"}
                </p>
              </div>

              <div className="space-y-3">
                {rideTypes.map((ride, idx) => {
                  const fare = computeFare(ride);
                  return (
                    <button
                      key={ride.id}
                      onClick={() => setSelectedRide(ride.id)}
                      className={`w-full text-left border-2 rounded-2xl p-4 transition-all ${
                        selectedRide === ride.id
                          ? "border-green-600 bg-green-50/30"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      style={{
                        paddingTop: idx === 1 ? "1.2rem" : "1rem",
                        paddingBottom: idx === 1 ? "1.2rem" : "1rem",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h4 className="text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>
                              {ride.name}
                            </h4>
                            <span className="text-gray-400" style={{ fontSize: "0.75rem" }}>
                              {ride.capacity}
                            </span>
                          </div>
                          <p className="text-gray-500 mb-2" style={{ fontSize: "0.8rem", lineHeight: 1.4 }}>
                            {ride.description}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {ride.features.map((feature) => (
                              <span
                                key={feature}
                                className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded"
                                style={{ fontSize: "0.7rem" }}
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-gray-900 mb-0.5" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                            BDT {fare}
                          </div>
                          <div className="text-gray-400" style={{ fontSize: "0.75rem" }}>
                            {ride.eta} away
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passengers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-900" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                      Number of passengers
                    </p>
                    <p className="text-gray-500" style={{ fontSize: "0.75rem" }}>
                      Including yourself
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    disabled={passengers <= 1}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-gray-900" style={{ fontSize: "1rem", fontWeight: 700 }}>
                    {passengers}
                  </span>
                  <button
                    onClick={() => setPassengers(Math.min(6, passengers + 1))}
                    disabled={passengers >= 6}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 transition"
                    style={{ fontSize: "1rem", fontWeight: 600 }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - sticky on desktop */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-6">
            {/* Payment method */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h3 className="text-gray-900 mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>
                Payment method
              </h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full text-left border-2 rounded-xl px-4 py-3 transition-all flex items-center justify-between ${
                      paymentMethod === method.id
                        ? "border-green-600 bg-white"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {method.icon && (
                        <span className="text-gray-700" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                          {method.icon}
                        </span>
                      )}
                      <span className="text-gray-900" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                        {method.name}
                      </span>
                    </div>
                    {paymentMethod === method.id && (
                      <span className="w-2 h-2 rounded-full bg-green-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-gray-900 mb-3" style={{ fontSize: "1rem", fontWeight: 700 }}>
                  Trip summary
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ride type</span>
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>
                      {selectedRideType?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distance</span>
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>
                      {routeInfo ? `~${routeInfo.distanceKm.toFixed(1)} km` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Est. time</span>
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>
                      {routeInfo ? `~${Math.round(routeInfo.durationMin)} min` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passengers</span>
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>
                      {passengers}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900" style={{ fontWeight: 700 }}>
                      Total fare
                    </span>
                    <span className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                      {routeInfo ? `BDT ${totalFare}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {bookingError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{bookingError}</p>
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={booking || !pickup.trim() || !dropoff.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {booking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Booking...</span>
                  </>
                ) : !user ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Login to confirm ride</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Confirm and request ride</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p
                className="text-gray-400 text-center"
                style={{ fontSize: "0.7rem", lineHeight: 1.4 }}
              >
                By continuing, you agree to our terms of service. Final fare may vary based on actual
                distance and time.
              </p>
            </div>

            {/* Promo code */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Have a promo code?"
                className="w-full bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none text-sm"
                style={{ fontWeight: 500 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
