import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router";

const NAV_LINKS = [
  { label: "How it works", id: "how-it-works" },
  { label: "Ride types", id: "ride-types" },
  { label: "Safety", id: "safety" },
  { label: "Drive", id: "drive" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function scrollToSection(id: string) {
    setIsOpen(false);
    if (location.pathname === "/") {
      // Already on landing page — smooth scroll
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // Navigate to home with hash, LandingPage will scroll on mount
      navigate(`/#${id}`);
    }
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-1.5"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span
              className="text-gray-900"
              style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              swift<span className="text-green-600">ride</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                style={{ fontSize: "0.875rem", fontWeight: 500, background: "none", border: "none", padding: 0 }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              Log in
            </Link>
            <Link
              to="/get-started"
              className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              Get started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 text-gray-500"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="md:hidden border-t border-gray-100 bg-white"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <div className="max-w-6xl mx-auto px-5 py-4 space-y-0.5">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="block w-full text-left text-gray-700 hover:text-gray-900 py-2.5 border-b border-gray-50"
                style={{ fontSize: "0.9rem", fontWeight: 500, background: "none", border: "none", borderBottom: "1px solid #f9fafb" }}
              >
                {label}
              </button>
            ))}
            <div className="flex gap-3 pt-4">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center border border-gray-200 py-2.5 rounded-lg text-gray-700 hover:border-gray-300 transition-colors"
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                Log in
              </Link>
              <Link
                to="/get-started"
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
