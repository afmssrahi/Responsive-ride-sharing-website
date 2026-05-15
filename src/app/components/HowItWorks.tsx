const steps = [
  {
    n: "01",
    title: "Open the app and enter your destination",
    body: "Type in where you're headed — or just tap on the map. We'll figure out the rest.",
  },
  {
    n: "02",
    title: "We match you with a nearby driver",
    body: "Usually under a minute. You'll see their name, photo, car, and live location on the map.",
  },
  {
    n: "03",
    title: "Ride comfortably, pay automatically",
    body: "Your saved card is charged at the end. No cash, no fumbling, no awkward moment at drop-off.",
  },
  {
    n: "04",
    title: "Rate the trip and you're done",
    body: "Takes five seconds. Your feedback keeps the quality high for everyone.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 bg-[#F7F7F5]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Header — left aligned, not centered */}
        <div className="mb-14 max-w-xl">
          <h2
            className="text-gray-900 mb-3"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}
          >
            Four steps,
            <br />
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              then you're moving.
            </span>
          </h2>
          <p className="text-gray-500" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
            We've removed every unnecessary step. No creating accounts just to see prices. No
            mystery fees at the end.
          </p>
        </div>

        {/* Steps — editorial numbered list */}
        <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="flex gap-6 sm:gap-10 py-7 group"
            >
              {/* Number */}
              <div
                className="text-gray-200 select-none flex-shrink-0 w-10"
                style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}
              >
                {step.n}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-start sm:gap-12">
                <h3
                  className="text-gray-900 sm:w-72 flex-shrink-0"
                  style={{ fontWeight: 700, fontSize: "1rem", lineHeight: 1.4 }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-gray-500 mt-2 sm:mt-0"
                  style={{ fontSize: "0.9rem", lineHeight: 1.7 }}
                >
                  {step.body}
                </p>
              </div>

              {/* Step indicator */}
              <div className="hidden md:flex items-center flex-shrink-0">
                <div
                  className={`w-2 h-2 rounded-full ${
                    i === 0 ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
