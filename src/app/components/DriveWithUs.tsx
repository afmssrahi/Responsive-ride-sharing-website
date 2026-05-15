import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

export function DriveWithUs() {
  return (
    <section
      id="drive"
      className="py-20 bg-[#F7F7F5]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Two-column editorial layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Left */}
          <div>
            <p
              className="text-gray-400 mb-4"
              style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Drive with us
            </p>
            <h2
              className="text-gray-900 mb-5"
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              Your car,
              <br />
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                your schedule,
              </span>
              <br />
              your earnings.
            </h2>

            <p className="text-gray-500 mb-8" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
              No minimum hours. No uniform. No boss. You decide when you drive and
              when you don't. The average SwiftRide driver keeps 85% of every fare,
              and most who drive part-time earn between BDT 6,000–BDT 12,000 a week.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/drive/apply"
                className="bg-gray-900 hover:bg-gray-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                style={{ fontWeight: 700, fontSize: "0.9rem" }}
              >
                Apply to drive
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/drive/requirements"
                className="border border-gray-300 text-gray-600 hover:border-gray-400 px-6 py-3 rounded-xl transition-colors flex items-center justify-center"
                style={{ fontWeight: 500, fontSize: "0.9rem" }}
              >
                See requirements
              </Link>
            </div>
          </div>

          {/* Right — honest stats, no buzzwords */}
          <div>
            <div className="grid grid-cols-2 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200">
              {[
                { value: "85%", label: "of every fare goes to you" },
                { value: "~4 min", label: "avg. time until next ride request" },
                { value: "BDT 9,500", label: "avg. weekly earnings, part-time" },
                { value: "50K+", label: "active drivers on the platform" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`bg-white p-6 ${i === 0 ? "rounded-tl-2xl" : ""} ${i === 1 ? "rounded-tr-2xl" : ""} ${i === 2 ? "rounded-bl-2xl" : ""} ${i === 3 ? "rounded-br-2xl" : ""}`}
                >
                  <div
                    className="text-gray-900 mb-1.5"
                    style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-gray-500" style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-gray-400 text-xs mt-4">
              *Earnings vary by city, time of day, and hours driven. Stats based on
              2025 SwiftRide Bangladesh platform averages.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
