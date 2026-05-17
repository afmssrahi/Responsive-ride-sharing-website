import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth, DEMO_ACCOUNTS } from "../context/AuthContext";
import { ApiError } from "../services/api";

const ROUTE_MAP: Record<string, string> = {
  admin: "/admin",
  driver: "/driver",
  user: "/dashboard",
};

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const redirectTo = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in both fields."); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(redirectTo || ROUTE_MAP[user.role] || "/dashboard");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function quickLogin(account: typeof DEMO_ACCOUNTS[0]) {
    setLoading(true);
    setError("");
    try {
      const user = await login(account.email, account.password);
      navigate(redirectTo || account.route || ROUTE_MAP[user.role] || "/dashboard");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Demo login failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 w-full pt-5">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors" style={{ fontSize: "0.85rem", fontWeight: 500 }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to UniRide
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="block text-gray-900 mb-8" style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            uni<span className="text-green-600">ride</span>
          </Link>

          <h1 className="text-gray-900 mb-1" style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
            Welcome back.
          </h1>
          <p className="text-gray-500 mb-8" style={{ fontSize: "0.9rem" }}>Log in to your account to continue.</p>

          {/* Quick demo buttons */}
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-gray-500 mb-3" style={{ fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Demo access
            </p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => quickLogin(a)}
                  disabled={loading}
                  className="flex-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 rounded-lg transition-colors disabled:opacity-60"
                  style={{ fontSize: "0.75rem", fontWeight: 600 }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs">or sign in manually</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Email address</label>
              <input
                type="email" autoComplete="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-700" style={{ fontSize: "0.8rem", fontWeight: 600 }}>Password</label>
                <a href="#" className="text-green-600 hover:text-green-700 transition-colors" style={{ fontSize: "0.75rem", fontWeight: 500 }}>Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 pr-11 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white py-3 rounded-xl transition-colors"
              style={{ fontWeight: 700, fontSize: "0.9rem" }}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-8">
            Don't have an account?{" "}
            <Link to="/get-started" className="text-gray-900 hover:text-green-600 transition-colors" style={{ fontWeight: 600 }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}