export function Footer() {
  const cols = [
    {
      heading: "Product",
      links: ["How it works", "Ride options", "Pricing", "Safety", "Cities"],
    },
    {
      heading: "Drivers",
      links: ["Drive with us", "Requirements", "Driver support", "Insurance info"],
    },
    {
      heading: "Company",
      links: ["About", "Blog", "Careers", "Press", "Contact"],
    },
    {
      heading: "Legal",
      links: ["Privacy", "Terms", "Accessibility", "Cookie settings"],
    },
  ];

  return (
    <footer
      className="bg-white border-t border-gray-200"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <a
              href="#home"
              className="text-gray-900"
              style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              uni<span className="text-green-600">ride</span>
            </a>
            <p className="text-gray-400 mt-3 text-sm" style={{ lineHeight: 1.65 }}>
              Getting you where you need to go, without the drama.
            </p>
            {/* App badges */}
            <div className="flex gap-2 mt-5">
              {["App Store", "Google Play"].map((label) => (
                <button
                  key={label}
                  className="text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:border-gray-400 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {cols.map((col) => (
            <div key={col.heading}>
              <p
                className="text-gray-900 mb-4"
                style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                {col.heading}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-500 hover:text-gray-900 transition-colors"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-400" style={{ fontSize: "0.8rem" }}>
            © 2026 UniRide, Inc.
          </p>
          <div className="flex gap-5">
            {["Twitter", "Instagram", "LinkedIn"].map((s) => (
              <a
                key={s}
                href="#"
                className="text-gray-400 hover:text-gray-800 transition-colors"
                style={{ fontSize: "0.8rem" }}
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
