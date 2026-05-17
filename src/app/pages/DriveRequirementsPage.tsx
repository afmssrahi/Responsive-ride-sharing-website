import { Link } from "react-router";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Navbar } from "../components/Navbar";

const requirements = [
  {
    category: "Who can apply",
    items: [
      { title: "Age", detail: "You must be at least 21 years old." },
      { title: "Nationality", detail: "Bangladeshi citizen or valid work permit holder." },
      { title: "Driving experience", detail: "Minimum 2 years of active driving history." },
      { title: "Clean record", detail: "No major traffic violations in the past 3 years. No criminal convictions." },
    ],
  },
  {
    category: "Your vehicle",
    items: [
      { title: "Model year", detail: "2015 or newer. Older vehicles may apply for an exception with proof of servicing." },
      { title: "Type", detail: "4-door saloon or SUV. CNG autorickshaws are not eligible at this time." },
      { title: "Condition", detail: "Functional A/C, working seatbelts on all seats, no visible bodywork damage." },
      { title: "Registered in BD", detail: "Vehicle must have a valid Dhaka or Chittagong metro registration under BRTA." },
    ],
  },
  {
    category: "Documents you'll need",
    items: [
      { title: "National ID (NID)", detail: "Original NID issued by Bangladesh Election Commission. Smart card preferred." },
      { title: "Driving licence", detail: "Valid professional or non-professional licence, Class B or above, issued by BRTA." },
      { title: "Vehicle registration", detail: "Current BRTA registration certificate (blue book) in your name or a close family member's." },
      { title: "Vehicle fitness certificate", detail: "Valid BRTA fitness certificate — not expired." },
      { title: "Vehicle insurance", detail: "Third-party or comprehensive motor insurance policy currently in effect." },
    ],
  },
  {
    category: "Equipment",
    items: [
      { title: "Smartphone", detail: "Android 9.0 or iOS 14 or newer. The UniRide Driver app requires at least 2 GB RAM." },
      { title: "Data plan", detail: "An active mobile data subscription (any operator — Grameenphone, Robi, Banglalink, Teletalk)." },
      { title: "bKash or Nagad account", detail: "Your weekly earnings are paid out directly to your bKash or Nagad mobile banking number." },
    ],
  },
];

const process = [
  {
    step: "01",
    title: "Submit your application",
    body: "Fill in the online form — takes about 10 minutes. You'll upload photos of your NID, licence, and vehicle documents. No appointment needed.",
  },
  {
    step: "02",
    title: "Document review",
    body: "Our compliance team checks your documents within 2–3 working days. If anything needs clarification, we'll reach you by phone.",
  },
  {
    step: "03",
    title: "Background check",
    body: "We run a standard police clearance check in partnership with the Bangladesh Police e-Service portal. This step usually takes 3–5 days.",
  },
  {
    step: "04",
    title: "Vehicle inspection",
    body: "A UniRide inspector visits at a location convenient to you — typically a service centre near Farmgate, Mohakhali, or Mirpur. Takes 30 minutes.",
  },
  {
    step: "05",
    title: "Account activation",
    body: "Once cleared, your account goes live. You'll receive an SMS on your registered number, and the driver app will unlock within the hour.",
  },
];

const faqs = [
  {
    q: "Can I drive a rented or borrowed car?",
    a: "No — the vehicle must be registered in your name or an immediate family member's name. Leased vehicles from a registered leasing company are also accepted with a copy of the lease agreement.",
  },
  {
    q: "My licence is non-professional. Can I still apply?",
    a: "Yes. A non-professional (private) licence Class B is sufficient for standard UniRide trips. A professional licence is required only if you want to take intercity routes.",
  },
  {
    q: "How long does the full process take?",
    a: "Most applicants are on the road within 10–14 calendar days. Delays are usually caused by pending BRTA document renewals or unavailability for the vehicle inspection.",
  },
  {
    q: "Is there an application fee?",
    a: "None. Applying is completely free. The vehicle inspection is also free of charge.",
  },
  {
    q: "What if my vehicle fails the inspection?",
    a: "We'll give you a written list of items to fix. Once they're addressed, you can book a re-inspection at no extra cost — usually within the same week.",
  },
  {
    q: "When and how do I get paid?",
    a: "Earnings are totalled every Monday and disbursed to your bKash or Nagad account by Wednesday. The minimum payout threshold is BDT 500.",
  },
];

export function DriveRequirementsPage() {
  return (
    <div
      className="min-h-screen bg-[#F7F7F5]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-10"
          style={{ fontSize: "0.82rem", fontWeight: 500 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to UniRide
        </Link>

        <div className="max-w-3xl">
          <p
            className="text-gray-400 mb-4"
            style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}
          >
            Driver requirements
          </p>

          <h1
            className="text-gray-900 mb-6"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Everything you need{" "}
            <span
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              to get on the road
            </span>{" "}
            with us.
          </h1>

          <p
            className="text-gray-500"
            style={{ fontSize: "1rem", lineHeight: 1.8, maxWidth: "560px" }}
          >
            We keep the bar high — not to make it hard, but to make sure every
            passenger feels safe and every driver earns what they deserve. Below
            is everything you need to know before you apply.
          </p>
        </div>
      </section>

      {/* ── Requirements grid ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pb-20">
        <div className="space-y-14">
          {requirements.map((section) => (
            <div key={section.category} className="grid lg:grid-cols-[220px_1fr] gap-6 lg:gap-14">
              {/* Category label */}
              <div className="pt-0.5">
                <p
                  className="text-gray-900"
                  style={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "-0.01em" }}
                >
                  {section.category}
                </p>
              </div>

              {/* Items */}
              <div className="grid sm:grid-cols-2 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200">
                {section.items.map((item, i) => {
                  const corners = [
                    i === 0 ? "rounded-tl-2xl" : "",
                    i === 1 ? "rounded-tr-2xl" : "",
                    i === section.items.length - 2 && section.items.length % 2 === 0
                      ? "rounded-bl-2xl"
                      : "",
                    i === section.items.length - 1
                      ? section.items.length % 2 === 0
                        ? "rounded-br-2xl"
                        : "rounded-b-2xl sm:rounded-bl-none sm:rounded-br-2xl"
                      : "",
                  ].join(" ");

                  return (
                    <div key={item.title} className={`bg-white px-6 py-5 ${corners}`}>
                      <p
                        className="text-gray-900 mb-1.5"
                        style={{ fontWeight: 700, fontSize: "0.88rem" }}
                      >
                        {item.title}
                      </p>
                      <p className="text-gray-500" style={{ fontSize: "0.83rem", lineHeight: 1.65 }}>
                        {item.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-200 py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-[340px_1fr] gap-12 lg:gap-24 items-start">
            <div className="lg:sticky lg:top-10">
              <p
                className="text-gray-400 mb-3"
                style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}
              >
                The process
              </p>
              <h2
                className="text-gray-900 mb-5"
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.2,
                }}
              >
                From application
                <br />
                <span
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                  }}
                >
                  to first fare.
                </span>
              </h2>
              <p className="text-gray-500" style={{ fontSize: "0.88rem", lineHeight: 1.75 }}>
                Most drivers complete all five steps within two weeks. We'll
                keep you updated by SMS at every stage.
              </p>
            </div>

            <div className="space-y-0">
              {process.map((step, i) => (
                <div
                  key={step.step}
                  className={`flex gap-8 ${i < process.length - 1 ? "pb-10" : ""}`}
                >
                  {/* Step number + line */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0"
                      style={{ fontSize: "0.75rem", fontWeight: 700 }}
                    >
                      {step.step}
                    </div>
                    {i < process.length - 1 && (
                      <div className="flex-1 w-px bg-gray-200 mt-3" />
                    )}
                  </div>

                  <div className="pt-2 pb-2">
                    <p
                      className="text-gray-900 mb-2"
                      style={{ fontWeight: 700, fontSize: "0.95rem" }}
                    >
                      {step.title}
                    </p>
                    <p className="text-gray-500" style={{ fontSize: "0.85rem", lineHeight: 1.75 }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <div className="grid lg:grid-cols-[340px_1fr] gap-12 lg:gap-24 items-start">
          <div className="lg:sticky lg:top-10">
            <p
              className="text-gray-400 mb-3"
              style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}
            >
              Common questions
            </p>
            <h2
              className="text-gray-900"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Things people
              <br />
              <span
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                usually ask.
              </span>
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <p
                  className="text-gray-900 mb-2"
                  style={{ fontWeight: 700, fontSize: "0.92rem" }}
                >
                  {faq.q}
                </p>
                <p className="text-gray-500" style={{ fontSize: "0.85rem", lineHeight: 1.75 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p
                className="text-green-400 mb-4"
                style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" }}
              >
                Ready?
              </p>
              <h2
                className="text-white"
                style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15,
                }}
              >
                You meet the requirements.
                <br />
                <span
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#4ade80",
                  }}
                >
                  Let's get started.
                </span>
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
              <Link
                to="/drive/apply"
                className="bg-white hover:bg-gray-100 text-gray-900 px-7 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                style={{ fontWeight: 700, fontSize: "0.9rem" }}
              >
                Apply to drive
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-7 py-3.5 rounded-xl flex items-center justify-center transition-colors"
                style={{ fontWeight: 500, fontSize: "0.9rem" }}
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer note ──────────────────────────────────────── */}
      <div className="bg-gray-900 border-t border-white/10 py-5">
        <p
          className="text-center text-white/30"
          style={{ fontSize: "0.75rem" }}
        >
          © 2026 UniRide Bangladesh · Privacy · Terms · Driver Support: 09678-UNIRIDE
        </p>
      </div>
    </div>
  );
}
