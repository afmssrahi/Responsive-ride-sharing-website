import { useState } from "react";

const rides = [
  {
    name: "SwiftGo",
    tag: "Solo",
    price: "From $3.99",
    eta: "2–5 min",
    seats: "Up to 3",
    description:
      "The everyday option. A regular car, a good driver, and a fair price. What more do you need?",
    accent: "bg-green-600",
    selected: true,
  },
  {
    name: "SwiftPool",
    tag: "Share",
    price: "From $1.99",
    eta: "5–10 min",
    seats: "1–2",
    description:
      "Share the ride with someone headed the same way and split the cost. Usually saves 40–60%.",
    accent: "bg-blue-600",
    selected: false,
  },
  {
    name: "SwiftLux",
    tag: "Premium",
    price: "From $9.99",
    eta: "3–8 min",
    seats: "Up to 4",
    description:
      "Higher-rated drivers, newer cars, a little extra quiet. Good for airport runs or client meetings.",
    accent: "bg-gray-800",
    selected: false,
  },
  {
    name: "SwiftXL",
    tag: "Group",
    price: "From $7.99",
    eta: "5–12 min",
    seats: "Up to 7",
    description:
      "A big SUV or van for when your group actually fits in one car, or you've got a lot of stuff.",
    accent: "bg-orange-600",
    selected: false,
  },
];

export function RideOptions() {
  const [selected, setSelected] = useState(0);

  return (
    <section
      id="ride-types"
      className="py-20 bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
          <div>
            <h2
              className="text-gray-900"
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              Pick what works{" "}
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                for you.
              </span>
            </h2>
          </div>
          <p className="text-gray-500 sm:max-w-xs sm:text-right" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
            All options include real-time tracking, in-app payment, and 24/7 support.
          </p>
        </div>

        {/* Options grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rides.map((ride, i) => (
            <button
              key={ride.name}
              onClick={() => setSelected(i)}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${
                selected === i
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              {/* Tag */}
              <span
                className={`inline-block text-xs px-2.5 py-0.5 rounded-full mb-4 ${
                  selected === i
                    ? "bg-white/10 text-white/70"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
                style={{ fontWeight: 600, letterSpacing: "0.03em" }}
              >
                {ride.tag}
              </span>

              <div
                className={`mb-1 ${selected === i ? "text-white" : "text-gray-900"}`}
                style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" }}
              >
                {ride.name}
              </div>

              <p
                className={`text-sm mb-5 ${selected === i ? "text-white/70" : "text-gray-500"}`}
                style={{ lineHeight: 1.6 }}
              >
                {ride.description}
              </p>

              <div className={`space-y-1 border-t pt-4 ${selected === i ? "border-white/10" : "border-gray-200"}`}>
                <div className="flex justify-between">
                  <span className={`text-xs ${selected === i ? "text-white/50" : "text-gray-400"}`}>Price</span>
                  <span
                    className={`text-sm ${selected === i ? "text-green-400" : "text-gray-800"}`}
                    style={{ fontWeight: 700 }}
                  >
                    {ride.price}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${selected === i ? "text-white/50" : "text-gray-400"}`}>ETA</span>
                  <span
                    className={`text-sm ${selected === i ? "text-white/80" : "text-gray-700"}`}
                    style={{ fontWeight: 500 }}
                  >
                    {ride.eta}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-xs ${selected === i ? "text-white/50" : "text-gray-400"}`}>Seats</span>
                  <span
                    className={`text-sm ${selected === i ? "text-white/80" : "text-gray-700"}`}
                    style={{ fontWeight: 500 }}
                  >
                    {ride.seats}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-gray-400 text-sm mt-6" style={{ fontWeight: 400 }}>
          Prices vary by distance, time, and demand. You'll always see the exact fare before you confirm.
        </p>
      </div>
    </section>
  );
}
