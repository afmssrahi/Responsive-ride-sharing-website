import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowLeft, Check, ChevronRight } from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const LEFT_PANEL_POINTS = [
  { step: "01", label: "Personal details" },
  { step: "02", label: "Vehicle information" },
  { step: "03", label: "Upload documents" },
  { step: "04", label: "Create your password" },
];

const EARNING_STATS = [
  { value: "BDT 850–1,400", label: "avg. weekly earnings, part-time" },
  { value: "85%", label: "of every fare is yours" },
  { value: "BDT 0", label: "application fee" },
];

const VEHICLE_TYPES = ["Sedan", "SUV", "Hatchback", "Minivan"];
const COLORS = ["White", "Silver", "Black", "Red", "Blue", "Grey", "Other"];

export function DriverApplyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 – Personal
  const [personal, setPersonal] = useState({
    name: "",
    phone: "",
    email: "",
    nid: "",
    city: "",
  });

  // Step 2 – Vehicle
  const [vehicle, setVehicle] = useState({
    make: "",
    model: "",
    year: "",
    color: "",
    type: "",
    plate: "",
  });

  // Step 3 – Documents (mock file names)
  const [docs, setDocs] = useState({
    nidPhoto: "",
    licence: "",
    registration: "",
    fitness: "",
    insurance: "",
  });

  // Step 4 – Password
  const [password, setPassword] = useState({ pw: "", confirm: "" });

  function updatePersonal(k: keyof typeof personal) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setPersonal((p) => ({ ...p, [k]: e.target.value }));
      setError("");
    };
  }

  function updateVehicle(k: keyof typeof vehicle) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setVehicle((v) => ({ ...v, [k]: e.target.value }));
      setError("");
    };
  }

  function updateDoc(k: keyof typeof docs) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setDocs((d) => ({ ...d, [k]: file.name }));
      setError("");
    };
  }

  // ── Step validation ──────────────────────────────────────
  function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!personal.name || !personal.phone || !personal.email) {
      setError("Please fill in name, phone, and email.");
      return;
    }
    if (!personal.nid) {
      setError("Your NID number is required.");
      return;
    }
    setStep(2);
    setError("");
  }

  function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.plate) {
      setError("Please fill in all required vehicle fields.");
      return;
    }
    const yr = parseInt(vehicle.year);
    if (isNaN(yr) || yr < 2015 || yr > 2026) {
      setError("Vehicle year must be 2015 or newer.");
      return;
    }
    setStep(3);
    setError("");
  }

  function submitStep3(e: React.FormEvent) {
    e.preventDefault();
    if (!docs.nidPhoto || !docs.licence || !docs.registration) {
      setError("NID photo, driving licence, and vehicle registration are required.");
      return;
    }
    setStep(4);
    setError("");
  }

  function submitStep4(e: React.FormEvent) {
    e.preventDefault();
    if (!password.pw || password.pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password.pw !== password.confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/drive/apply/submitted");
    }, 1600);
  }

  const pwStrength = Math.min(4, Math.floor(password.pw.length / 2));

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Left panel ─────────────────────────────────────── */}
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
              fontSize: "1.9rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
              marginBottom: "2rem",
            }}
          >
            Drive on your
            <br />
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#4ade80",
              }}
            >
              own terms.
            </span>
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 mb-10">
            {EARNING_STATS.map((s) => (
              <div key={s.label} className="border-l-2 border-green-500/40 pl-4">
                <div
                  className="text-white"
                  style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.03em" }}
                >
                  {s.value}
                </div>
                <div className="text-white/50" style={{ fontSize: "0.78rem" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Step list */}
          <div className="space-y-3">
            {LEFT_PANEL_POINTS.map((pt, i) => {
              const done = step > i + 1;
              const active = step === i + 1;
              return (
                <div key={pt.step} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done
                        ? "bg-green-500"
                        : active
                        ? "bg-white"
                        : "bg-white/10"
                    }`}
                    style={{ fontSize: "0.7rem", fontWeight: 700 }}
                  >
                    {done ? (
                      <Check className="w-3 h-3 text-gray-900" />
                    ) : (
                      <span className={active ? "text-gray-900" : "text-white/40"}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: "0.83rem",
                      fontWeight: active ? 600 : 400,
                      color: active ? "#ffffff" : done ? "#6ee7b7" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-white/30 text-xs">
          © 2026 SwiftRide Bangladesh · Privacy · Terms
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#F7F7F5]">
        {/* Back link */}
        <div className="max-w-md mx-auto w-full px-5 pt-6">
          <Link
            to="/#drive"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            style={{ fontSize: "0.85rem", fontWeight: 500 }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
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

            {/* Step pill indicator */}
            <div className="flex items-center gap-1.5 mb-8">
              {([1, 2, 3, 4] as Step[]).map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s < step
                      ? "bg-green-500 w-6"
                      : s === step
                      ? "bg-gray-900 w-10"
                      : "bg-gray-200 w-6"
                  }`}
                />
              ))}
              <span className="text-gray-400 text-xs ml-2">
                Step {step} of 4
              </span>
            </div>

            {/* ── STEP 1 ── Personal ────────────────────────── */}
            {step === 1 && (
              <form onSubmit={submitStep1} className="space-y-5">
                <div>
                  <h1
                    className="text-gray-900 mb-1"
                    style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}
                  >
                    Tell us about yourself.
                  </h1>
                  <p className="text-gray-500 mb-6" style={{ fontSize: "0.88rem" }}>
                    We'll use this to verify your identity and create your driver profile.
                  </p>
                </div>

                {[
                  { label: "Full name", key: "name", type: "text", placeholder: "Rasel Miah", auto: "name" },
                  { label: "Mobile number", key: "phone", type: "tel", placeholder: "+880 1700-000000", auto: "tel" },
                  { label: "Email address", key: "email", type: "email", placeholder: "rasel@example.com", auto: "email" },
                  { label: "NID number", key: "nid", type: "text", placeholder: "19 or 10-digit NID", auto: "off" },
                ].map(({ label, key, type, placeholder, auto }) => (
                  <div key={key}>
                    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      {label}
                    </label>
                    <input
                      type={type}
                      autoComplete={auto}
                      value={personal[key as keyof typeof personal]}
                      onChange={updatePersonal(key as keyof typeof personal)}
                      placeholder={placeholder}
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    City <span className="text-gray-400 font-normal">(where you'll mostly drive)</span>
                  </label>
                  <input
                    type="text"
                    value={personal.city}
                    onChange={updatePersonal("city")}
                    placeholder="e.g. Dhaka, Chittagong, Sylhet"
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  style={{ fontWeight: 700, fontSize: "0.9rem" }}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* ── STEP 2 ── Vehicle ─────────────────────────── */}
            {step === 2 && (
              <form onSubmit={submitStep2} className="space-y-5">
                <div>
                  <h1
                    className="text-gray-900 mb-1"
                    style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}
                  >
                    Your vehicle.
                  </h1>
                  <p className="text-gray-500 mb-6" style={{ fontSize: "0.88rem" }}>
                    The car you'll use for SwiftRide trips. Must be 2015 or newer.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      Make
                    </label>
                    <input
                      type="text"
                      value={vehicle.make}
                      onChange={updateVehicle("make")}
                      placeholder="Toyota"
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      Model
                    </label>
                    <input
                      type="text"
                      value={vehicle.model}
                      onChange={updateVehicle("model")}
                      placeholder="Allion"
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      Year
                    </label>
                    <input
                      type="number"
                      value={vehicle.year}
                      onChange={updateVehicle("year")}
                      placeholder="2019"
                      min="2015"
                      max="2026"
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                      Colour
                    </label>
                    <select
                      value={vehicle.color}
                      onChange={updateVehicle("color")}
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-400 transition text-sm"
                    >
                      <option value="">Select</option>
                      {COLORS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Vehicle type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {VEHICLE_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setVehicle((v) => ({ ...v, type: t }))}
                        className={`border py-2.5 rounded-xl text-sm transition-colors ${
                          vehicle.type === t
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                        }`}
                        style={{ fontWeight: vehicle.type === t ? 700 : 500 }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    BRTA registration plate
                  </label>
                  <input
                    type="text"
                    value={vehicle.plate}
                    onChange={updateVehicle("plate")}
                    placeholder="Dhaka Metro-G 11-2345"
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="flex-1 border border-gray-200 text-gray-600 hover:border-gray-400 py-3 rounded-xl transition-colors"
                    style={{ fontWeight: 500, fontSize: "0.88rem" }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    style={{ fontWeight: 700, fontSize: "0.9rem" }}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 3 ── Documents ───────────────────────── */}
            {step === 3 && (
              <form onSubmit={submitStep3} className="space-y-5">
                <div>
                  <h1
                    className="text-gray-900 mb-1"
                    style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}
                  >
                    Upload your documents.
                  </h1>
                  <p className="text-gray-500 mb-6" style={{ fontSize: "0.88rem" }}>
                    Clear photos or scans. JPG or PDF up to 5 MB each. Marked{" "}
                    <span className="text-gray-700" style={{ fontWeight: 600 }}>*</span>{" "}
                    are required.
                  </p>
                </div>

                {[
                  { label: "NID (front & back)*", key: "nidPhoto", required: true },
                  { label: "BRTA driving licence*", key: "licence", required: true },
                  { label: "Vehicle registration (blue book)*", key: "registration", required: true },
                  { label: "Vehicle fitness certificate", key: "fitness", required: false },
                  { label: "Vehicle insurance policy", key: "insurance", required: false },
                ].map(({ label, key, required }) => (
                  <div key={key}>
                    <label
                      className="block text-gray-700 mb-1.5"
                      style={{ fontSize: "0.8rem", fontWeight: 600 }}
                    >
                      {label}
                    </label>
                    <label
                      className={`flex items-center justify-between w-full border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                        docs[key as keyof typeof docs]
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      }`}
                    >
                      <span
                        className={`text-sm truncate ${
                          docs[key as keyof typeof docs] ? "text-green-700" : "text-gray-400"
                        }`}
                      >
                        {docs[key as keyof typeof docs] || "Choose file…"}
                      </span>
                      {docs[key as keyof typeof docs] ? (
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <span
                          className="text-gray-500 flex-shrink-0"
                          style={{ fontSize: "0.75rem", fontWeight: 600 }}
                        >
                          Browse
                        </span>
                      )}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="sr-only"
                        onChange={updateDoc(key as keyof typeof docs)}
                        required={required}
                      />
                    </label>
                  </div>
                ))}

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(2); setError(""); }}
                    className="flex-1 border border-gray-200 text-gray-600 hover:border-gray-400 py-3 rounded-xl transition-colors"
                    style={{ fontWeight: 500, fontSize: "0.88rem" }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    style={{ fontWeight: 700, fontSize: "0.9rem" }}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 4 ── Password ────────────────────────── */}
            {step === 4 && (
              <form onSubmit={submitStep4} className="space-y-5">
                <div>
                  <h1
                    className="text-gray-900 mb-1"
                    style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}
                  >
                    Almost there.
                  </h1>
                  <p className="text-gray-500 mb-6" style={{ fontSize: "0.88rem" }}>
                    Create a password for your SwiftRide driver account.
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
                      value={password.pw}
                      onChange={(e) => {
                        setPassword((p) => ({ ...p, pw: e.target.value }));
                        setError("");
                      }}
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
                  {password.pw.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            i < pwStrength
                              ? pwStrength >= 4
                                ? "bg-green-500"
                                : pwStrength >= 2
                                ? "bg-yellow-400"
                                : "bg-red-400"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                    Confirm password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password.confirm}
                    onChange={(e) => {
                      setPassword((p) => ({ ...p, confirm: e.target.value }));
                      setError("");
                    }}
                    placeholder="Repeat your password"
                    className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition text-sm"
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <p className="text-gray-400 text-xs" style={{ lineHeight: 1.65 }}>
                  By submitting this application you agree to SwiftRide's{" "}
                  <a href="#" className="underline">Terms of Service</a>,{" "}
                  <a href="#" className="underline">Driver Agreement</a>, and{" "}
                  <a href="#" className="underline">Privacy Policy</a>.
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(3); setError(""); }}
                    className="flex-1 border border-gray-200 text-gray-600 hover:border-gray-400 py-3 rounded-xl transition-colors"
                    style={{ fontWeight: 500, fontSize: "0.88rem" }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    style={{ fontWeight: 700, fontSize: "0.9rem" }}
                  >
                    {loading ? "Submitting…" : "Submit application"}
                  </button>
                </div>
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
