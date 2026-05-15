const testimonials = [
  {
    name: "Sarah M.",
    location: "New York",
    text: "I've tried three different ride apps and SwiftRide is the only one where the driver actually shows up on time. Every single day.",
    detail: "Daily commuter for 8 months",
  },
  {
    name: "James O.",
    location: "Chicago",
    text: "Used it for a client dinner last week. Clean car, quiet driver, arrived with time to spare. I've switched permanently.",
    detail: "SwiftLux rider",
  },
  {
    name: "Priya K.",
    location: "Los Angeles",
    text: "The pool option is genuinely good value. I share a ride most mornings and I've probably saved $200 this month.",
    detail: "SwiftPool regular",
  },
  {
    name: "Tom R.",
    location: "Austin",
    text: "My driver waited 3 extra minutes without complaint while I ran back inside. Small thing but it matters.",
    detail: "Using SwiftRide since 2024",
  },
];

export function Testimonials() {
  return (
    <section
      className="py-20 bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {/* Heading */}
        <div className="mb-14">
          <p
            className="text-gray-400 mb-3"
            style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}
          >
            From real riders
          </p>
          <h2
            className="text-gray-900"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
            }}
          >
            People seem to{" "}
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              like us.
            </span>
          </h2>
        </div>

        {/* Featured quote + smaller ones */}
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Featured */}
          <div className="lg:col-span-3 bg-gray-900 text-white rounded-2xl p-8 flex flex-col justify-between">
            <p
              style={{
                fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              "{testimonials[0].text}"
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs" style={{ fontWeight: 700 }}>
                {testimonials[0].name[0]}
              </div>
              <div>
                <div className="text-white text-sm" style={{ fontWeight: 600 }}>{testimonials[0].name}</div>
                <div className="text-gray-400 text-xs">{testimonials[0].detail} · {testimonials[0].location}</div>
              </div>
            </div>
          </div>

          {/* Smaller quotes */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {testimonials.slice(1, 3).map((t) => (
              <div
                key={t.name}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col justify-between"
              >
                <p
                  className="text-gray-700"
                  style={{ fontSize: "0.9rem", lineHeight: 1.65, fontStyle: "italic" }}
                >
                  "{t.text}"
                </p>
                <div className="mt-4 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs" style={{ fontWeight: 700 }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-gray-800 text-xs" style={{ fontWeight: 600 }}>{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fourth testimonial — full width strip */}
        <div className="mt-5 border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs flex-shrink-0" style={{ fontWeight: 700 }}>
            {testimonials[3].name[0]}
          </div>
          <p
            className="text-gray-600 flex-1 italic"
            style={{ fontSize: "0.9rem", lineHeight: 1.65 }}
          >
            "{testimonials[3].text}"
          </p>
          <div className="text-right flex-shrink-0">
            <div className="text-gray-800 text-sm" style={{ fontWeight: 600 }}>{testimonials[3].name}</div>
            <div className="text-gray-400 text-xs">{testimonials[3].detail} · {testimonials[3].location}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
