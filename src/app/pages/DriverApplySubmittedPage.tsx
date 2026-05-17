import { Link } from "react-router";

const NEXT_STEPS = [
  {
    step: "01",
    title: "Document review",
    body: "Our compliance team will check your submission within 2–3 working days and reach you by phone if anything needs clarification.",
  },
  {
    step: "02",
    title: "Background check",
    body: "A standard police clearance check runs in the background — you don't need to do anything. Usually takes 3–5 days.",
  },
  {
    step: "03",
    title: "Vehicle inspection",
    body: "We'll SMS you to book a free 30-minute inspection at a centre near you — Farmgate, Mohakhali, or Mirpur.",
  },
  {
    step: "04",
    title: "Account activation",
    body: "Once everything clears, your driver account goes live and you can start accepting rides.",
  },
];

export function DriverApplySubmittedPage() {
  return (
    <div
      className="min-h-screen bg-[#F7F7F5]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center">
          <Link
            to="/"
            className="text-gray-900"
            style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            uni<span className="text-green-600">ride</span>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
        {/* Hero */}
        <div className="max-w-2xl mb-20">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <p
              className="text-gray-500"
              style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Application received
            </p>
          </div>

          <h1
            className="text-gray-900 mb-5"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            We've got your
            <br />
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              application.
            </span>
          </h1>

          <p className="text-gray-500" style={{ fontSize: "0.95rem", lineHeight: 1.8, maxWidth: "500px" }}>
            Thanks for applying to drive with UniRide. We'll review your
            documents and update you by SMS at every step. The whole process
            usually takes 10–14 days.
          </p>
        </div>

        {/* What happens next */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-20">
          <div className="lg:sticky lg:top-10 self-start">
            <p
              className="text-gray-400 mb-2"
              style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}
            >
              What happens next
            </p>
            <h2
              className="text-gray-900"
              style={{
                fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Here's what
              <br />
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                to expect.
              </span>
            </h2>
          </div>

          <div className="space-y-0">
            {NEXT_STEPS.map((s, i) => (
              <div key={s.step} className={`flex gap-8 ${i < NEXT_STEPS.length - 1 ? "pb-10" : ""}`}>
                <div className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0"
                    style={{ fontSize: "0.75rem", fontWeight: 700 }}
                  >
                    {s.step}
                  </div>
                  {i < NEXT_STEPS.length - 1 && (
                    <div className="flex-1 w-px bg-gray-200 mt-3" />
                  )}
                </div>
                <div className="pt-2">
                  <p className="text-gray-900 mb-1.5" style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                    {s.title}
                  </p>
                  <p className="text-gray-500" style={{ fontSize: "0.84rem", lineHeight: 1.75 }}>
                    {s.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom links */}
        <div className="border-t border-gray-200 pt-10 flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="bg-gray-900 hover:bg-gray-700 text-white px-7 py-3 rounded-xl transition-colors inline-flex items-center justify-center"
            style={{ fontWeight: 700, fontSize: "0.88rem" }}
          >
            Back to UniRide
          </Link>
          <Link
            to="/drive/requirements"
            className="border border-gray-200 text-gray-600 hover:border-gray-400 px-7 py-3 rounded-xl transition-colors inline-flex items-center justify-center"
            style={{ fontWeight: 500, fontSize: "0.88rem" }}
          >
            Review requirements
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-200 py-5">
        <p className="text-center text-gray-400" style={{ fontSize: "0.75rem" }}>
          © 2026 UniRide Bangladesh · Questions? Call 09678-UNIRIDE
        </p>
      </div>
    </div>
  );
}
