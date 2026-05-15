import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";

const perks = [
  "First ride up to $10 off",
  "No hidden fees, ever",
  "Cancel free up to 2 min after booking",
  "Live trip tracking from the start",
];

export function GetStartedPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError("");
    };
  }

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError("Please fill in your name and email.");
      return;
    }
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      // If login fails (new user), try registering first
    } catch {
      // User doesn't exist — register them
      try {
        const { auth: authApi, setTokens } = await import("../services/api");
        const res = await authApi.register({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password });
        setTokens(res.data.accessToken, res.data.refreshToken);
        navigate("/dashboard");
        return;
      } catch (regErr) {
        if (regErr instanceof ApiError) setError(regErr.message);
        else setError("Registration failed. Please try again.");
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    navigate("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Left panel — green/dark, perks */}
      <div className="hidden lg:flex flex-col justify-between bg-gray-900 text-white w-[420px] flex-shrink-0 p-12">
        <div>
          <Link
            to="/"
            className="text-white"
            style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            swift<span className="text-green-400">ride</span>
          </Link>
        </div>

        <div>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              marginBottom: "2rem",
            }}
          >
            Your first ride
            <br />
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#4ade80",
              }}
            >
              is on us.
            </span>
          </h2>

          <ul className="space-y-4">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-white/70 text-sm" style={{ lineHeight: 1.6 }}>
                  {perk}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/30 text-xs">
          © 2026 SwiftRide, Inc. · Privacy · Terms
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col bg-[#F7F7F5]">
        {/* Back link */}
        <div className="max-w-md mx-auto w-full px-5 pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            style={{ fontSize: "0.85rem", fontWeight: 500 }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to SwiftRide
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <Link
              to="/"
              className="lg:hidden block text-gray-900 mb-8"
              style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              swift<span className="text-green-600">ride</span>
            </Link>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                      step >= s
                        ? "bg-gray-900 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    {step > s ? <Check className="w-3 h-3" /> : s}
                  </div>
                  {s < 2 && (
                    <div
                      className={`w-10 h-px transition-all ${
                        step > s ? "bg-gray-900" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
              <span className="text-gray-400 text-xs ml-1">Step {step} of 2</span>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <h1
                    className="text-gray-900 mb-1"
                    style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}
                  >
                    Create your account.
                  </h1>
                  <p className="text-gray-500 mb-8" style={{ fontSize: "0.9rem" }}>
                    Takes less than two minutes.
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={update("name")}
                    placeholder="Jane Smith"
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Phone number{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="+1 (555) 000-0000"
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors"
                  style={{ fontWeight: 700, fontSize: "0.9rem" }}
                >
                  Continue
                </button>


              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div>
                  <h1
                    className="text-gray-900 mb-1"
                    style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}
                  >
                    One last thing.
                  </h1>
                  <p className="text-gray-500 mb-8" style={{ fontSize: "0.9rem" }}>
                    Choose a password for{" "}
                    <span className="text-gray-700" style={{ fontWeight: 500 }}>
                      {form.email}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={update("password")}
                      placeholder="Min. 8 characters"
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 pr-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {form.password.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            form.password.length >= (i + 1) * 2
                              ? form.password.length >= 10
                                ? "bg-green-500"
                                : "bg-yellow-400"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <p className="text-gray-400 text-xs" style={{ lineHeight: 1.6 }}>
                  By creating an account you agree to SwiftRide's{" "}
                  <a href="#" className="underline">Terms of Service</a> and{" "}
                  <a href="#" className="underline">Privacy Policy</a>.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl transition-colors"
                  style={{ fontWeight: 700, fontSize: "0.9rem" }}
                >
                  {loading ? "Creating your account…" : "Create account"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 transition-colors"
                  style={{ fontSize: "0.85rem" }}
                >
                  ← Back
                </button>
              </form>
            )}

            <p className="text-center text-gray-500 text-sm mt-8">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-gray-900 hover:text-green-600 transition-colors"
                style={{ fontWeight: 600 }}
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
