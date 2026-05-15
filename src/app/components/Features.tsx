export function Features() {
  return (
    <section
      id="safety"
      className="py-20 bg-[#F7F7F5]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Top split */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-16">
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
              We take safety{" "}
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                seriously.
              </span>
              <br />
              Not just "seriously."
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-gray-500" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
              Every driver on SwiftRide passes a multi-step background check before their first trip.
              We look at criminal history, driving record, license validity — and we re-run checks
              every six months. Not because we have to, because we think you deserve it.
            </p>
            <p className="text-gray-500" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
              Your trip is insured from the moment you're matched with a driver to the second you arrive.
              You get live location sharing, an emergency button, and the option to share your route
              with someone you trust.
            </p>
          </div>
        </div>

        {/* Feature list — horizontal, no cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 pt-10 border-t border-gray-200">
          {[
            {
              title: "Background-checked drivers",
              body: "Every driver is screened before joining and reviewed every six months.",
            },
            {
              title: "Live trip sharing",
              body: "Share your route and ETA with anyone. They don't need the app.",
            },
            {
              title: "In-app emergency button",
              body: "One tap connects you to local emergency services with your location.",
            },
            {
              title: "No surge pricing",
              body: "Prices are set upfront. What you see is what you pay, always.",
            },
            {
              title: "Cashless only",
              body: "No cash on hand means fewer uncomfortable situations for everyone.",
            },
            {
              title: "Two-way rating",
              body: "Drivers rate riders too. It keeps the community respectful.",
            },
          ].map((f) => (
            <div key={f.title}>
              <div
                className="w-1.5 h-1.5 rounded-full bg-green-500 mb-3"
              />
              <h3
                className="text-gray-800 mb-1.5"
                style={{ fontWeight: 700, fontSize: "0.95rem" }}
              >
                {f.title}
              </h3>
              <p className="text-gray-500" style={{ fontSize: "0.875rem", lineHeight: 1.65 }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
