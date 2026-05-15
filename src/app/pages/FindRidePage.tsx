import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, MapPin, Navigation, Calendar, Clock, User, ChevronRight } from "lucide-react";
import { MapComponent, getLocationCoordinates } from "../components/MapComponent";
import { rides as ridesApi } from "../services/api";

// Ride types fetched from API

const PAYMENT_METHODS = [
  { id: "cash", name: "Cash", icon: "BDT" },
  { id: "bkash", name: "bKash" },
  { id: "nagad", name: "Nagad" },
  { id: "card", name: "Card" },
];

export function FindRidePage() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState("Dhanmondi 27");
  const [dropoff, setDropoff] = useState("Gulshan 1 Circle");
  const [selectedRide, setSelectedRide] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [RIDE_TYPES, setRideTypes] = useState<any[]>([]);

  useEffect(() => {
    ridesApi.getTypes().then(res => {
      const types = (res.data || []).map((t: any) => ({
        id: t.name.toLowerCase(),
        name: t.name,
        description: t.description,
        price: `BDT${t.baseFare}–${t.baseFare + t.pricePerKm * 10}`,
        eta: t.eta || '3 min',
        capacity: `${t.capacity} passengers`,
        features: t.features || [],
      }));
      setRideTypes(types);
      if (types.length) setSelectedRide(types[0].id);
    }).catch(() => {
      // Fallback
      setRideTypes([{id:'economy',name:'Economy',description:'Affordable rides',price:'BDT120–160',eta:'3 min',capacity:'3 passengers',features:['AC']}]);
      setSelectedRide('economy');
    });
  }, []);
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");

  const [pickupCoords, setPickupCoords] = useState(getLocationCoordinates("Dhanmondi 27"));
  const [dropoffCoords, setDropoffCoords] = useState(getLocationCoordinates("Gulshan 1 Circle"));

  useEffect(() => {
    const coords = getLocationCoordinates(pickup);
    if (coords) setPickupCoords(coords);
  }, [pickup]);

  useEffect(() => {
    const coords = getLocationCoordinates(dropoff);
    if (coords) setDropoffCoords(coords);
  }, [dropoff]);

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
          <div>
            <h1 className="text-gray-900" style={{ fontWeight: 700, fontSize: "1rem" }}>
              Book your ride
            </h1>
            <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>
              Choose your ride type and confirm details
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8 lg:py-12">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8 lg:gap-12">
          {/* Main content - asymmetric layout */}
          <div className="space-y-8">
            {/* Map section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 lg:p-6">
              <MapComponent
                pickupLat={pickupCoords?.lat}
                pickupLng={pickupCoords?.lng}
                dropoffLat={dropoffCoords?.lat}
                dropoffLng={dropoffCoords?.lng}
                height="350px"
              />
            </div>

            {/* Route card - natural, non-uniform design */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-5">
                <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 mb-1" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Your route
                  </p>
                  <h2
                    className="text-gray-900 mb-4"
                    style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1.3 }}
                  >
                    {pickup}
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
                      to {dropoff}
                    </span>
                  </h2>
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
                    placeholder="Pickup location"
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
                    placeholder="Drop-off location"
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
                        className="flex-1 py-1.5 px-2 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-green-400 text-xs"
                      />
                      <input
                        type="time"
                        className="w-24 py-1.5 px-2 bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-green-400 text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ride type selection - asymmetric card heights */}
            <div>
              <div className="mb-4">
                <h3
                  className="text-gray-900 mb-1"
                  style={{ fontSize: "1.2rem", fontWeight: 700 }}
                >
                  Choose your ride
                </h3>
                <p className="text-gray-500" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                  All estimates based on current traffic from Dhanmondi to Gulshan
                </p>
              </div>

              <div className="space-y-3">
                {RIDE_TYPES.map((ride, idx) => (
                  <button
                    key={ride.id}
                    onClick={() => setSelectedRide(ride.id)}
                    className={`w-full text-left border-2 rounded-2xl p-4 transition-all ${
                      selectedRide === ride.id
                        ? "border-green-600 bg-green-50/30"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    style={{
                      // Slightly different padding/heights for asymmetry
                      paddingTop: idx === 1 ? "1.2rem" : "1rem",
                      paddingBottom: idx === 1 ? "1.2rem" : "1rem",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h4
                            className="text-gray-900"
                            style={{ fontSize: "1rem", fontWeight: 700 }}
                          >
                            {ride.name}
                          </h4>
                          <span
                            className="text-gray-400"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {ride.capacity}
                          </span>
                        </div>
                        <p
                          className="text-gray-500 mb-2"
                          style={{ fontSize: "0.8rem", lineHeight: 1.4 }}
                        >
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
                        <div
                          className="text-gray-900 mb-0.5"
                          style={{ fontSize: "1.1rem", fontWeight: 700 }}
                        >
                          {ride.price}
                        </div>
                        <div
                          className="text-gray-400"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {ride.eta} away
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Passengers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p
                      className="text-gray-900"
                      style={{ fontSize: "0.9rem", fontWeight: 600 }}
                    >
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
                  <span
                    className="w-8 text-center text-gray-900"
                    style={{ fontSize: "1rem", fontWeight: 700 }}
                  >
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
              <h3
                className="text-gray-900 mb-4"
                style={{ fontSize: "1rem", fontWeight: 700 }}
              >
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
                        <span
                          className="text-gray-700"
                          style={{ fontSize: "1.1rem", fontWeight: 700 }}
                        >
                          {method.icon}
                        </span>
                      )}
                      <span
                        className="text-gray-900"
                        style={{ fontSize: "0.875rem", fontWeight: 600 }}
                      >
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
                <h3
                  className="text-gray-900 mb-3"
                  style={{ fontSize: "1rem", fontWeight: 700 }}
                >
                  Trip summary
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ride type</span>
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>
                      {RIDE_TYPES.find((r) => r.id === selectedRide)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distance</span>
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>
                      ~8.4 km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Est. time</span>
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>
                      18–22 min
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900" style={{ fontWeight: 700 }}>
                      Total fare
                    </span>
                    <span
                      className="text-gray-900"
                      style={{ fontSize: "1.1rem", fontWeight: 700 }}
                    >
                      {RIDE_TYPES.find((r) => r.id === selectedRide)?.price}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm">
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Confirm and request ride
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <p
                className="text-gray-400 text-center"
                style={{ fontSize: "0.7rem", lineHeight: 1.4 }}
              >
                By continuing, you agree to our terms of service. Final fare may vary based on actual distance and time.
              </p>
            </div>

            {/* Promo code - different styling for variety */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <input
                type="text"
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
