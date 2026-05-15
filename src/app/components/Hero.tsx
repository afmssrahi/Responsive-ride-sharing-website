import { useState } from "react";
import { ArrowRight, Navigation } from "lucide-react";
import { useNavigate } from "react-router";

export function Hero() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [tab, setTab] = useState<"now" | "later">("now");

  return (
    <section
      id="home"
      className="pt-14 min-h-screen flex flex-col lg:flex-row"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Left — content */}
      <div className="flex-1 flex flex-col justify-center px-5 sm:px-10 lg:px-16 py-14 lg:py-0 bg-white max-w-none lg:max-w-[600px]">
        <div className="max-w-lg">
          {/* Eyebrow */}
          <p
            className="text-green-600 mb-5"
            style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            Ride sharing, simplified
          </p>

          {/* Heading — editorial mix of roman and italic */}
          <h1
            className="text-gray-900 mb-4"
            style={{
              fontSize: "clamp(2.6rem, 5vw, 4rem)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            Get there
            <br />
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#16a34a",
              }}
            >
              without the hassle.
            </span>
          </h1>

          <p
            className="text-gray-500 mb-8"
            style={{ fontSize: "1rem", lineHeight: 1.7, maxWidth: "34ch" }}
          >
            Real drivers, fair prices, no surge pricing nonsense. Just a ride
            when you need one.
          </p>

          {/* Booking form */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-0.5 w-fit">
              {(["now", "later"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-md transition-all ${
                    tab === t
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  {t === "now" ? "Ride now" : "Schedule"}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-white" />
                <input
                  type="text"
                  placeholder="Where are you starting from?"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full pl-8 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-400 text-sm transition"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600">
                  <Navigation className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-900" />
                <input
                  type="text"
                  placeholder="Where to?"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-400 text-sm transition"
                />
              </div>

              {tab === "later" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 py-3 px-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-green-400 text-sm"
                  />
                  <input
                    type="time"
                    className="flex-1 py-3 px-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-green-400 text-sm"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/find-ride")}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              style={{ fontWeight: 700, fontSize: "0.9rem" }}
            >
              Find my ride
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trust bar */}
          <div className="flex gap-6 mt-7">
            {[
              { n: "4.9★", label: "avg. rating" },
              { n: "< 4 min", label: "avg. pickup" },
              { n: "10M+", label: "trips taken" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  className="text-gray-900"
                  style={{ fontWeight: 700, fontSize: "1rem" }}
                >
                  {s.n}
                </div>
                <div className="text-gray-400" style={{ fontSize: "0.75rem" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — photo, no overlay */}
      <div className="hidden lg:block flex-1 relative">
        <img
          src="https://images.unsplash.com/photo-1582849960485-69f186a876ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwcmlkZSUyMHNoYXJpbmclMjBjYXIlMjB1cmJhbnxlbnwxfHx8fDE3NzM1NTY1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="City streets"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Subtle gradient only on the left edge to blend into white */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
      </div>

      {/* Mobile image strip */}
      <div className="lg:hidden h-52 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1582849960485-69f186a876ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwcmlkZSUyMHNoYXJpbmclMjBjYXIlMjB1cmJhbnxlbnwxfHx8fDE3NzM1NTY1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="City streets"
          className="w-full h-full object-cover object-center"
        />
      </div>
    </section>
  );
}
