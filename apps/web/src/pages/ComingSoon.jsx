import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleSignIn from "../auth/GoogleSignIn.jsx";

const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const interestEndpoint = apiBase ? `${apiBase}/api/interest` : "/api/interest";

const FAQ_BLOCK = [
  {
    q: "Who is Home AI for?",
    a: "Homeowners, buyers, landlords and property developers who want a faster, data-led way to sell or find property. We are not a service for estate agents."
  },
  {
    q: "What exactly is Home AI?",
    a: "Home AI is an AI-powered estate agent. We combine licensed data, pricing models and human experts to value, market and sell property; and to help buyers discover homes that fit their brief."
  },
  {
    q: "How do I get a valuation?",
    a: "Create an account and add your property details (address, photos, recent works, key features). Our models generate a pricing range and recommended launch strategy, which a human specialist reviews before you approve."
  },
  {
    q: "Is there an upfront fee?",
    a: "Yes — there’s an upfront payment payable on contract signing. Your agreement will clearly set out what’s included (valuation, prep, marketing set-up, etc.)."
  },
  {
    q: "How long until my property goes live?",
    a: "Once you’ve approved pricing and provided required information, we typically launch within up to two weeks. This allows for photography, copy, compliance checks and listing prep."
  },
  {
    q: "I’ve submitted the interest form — what happens next?",
    a: "We’ll review your details and reach out inside your account to confirm next steps. If we need anything else, you’ll receive a prompt in the dashboard."
  },
  {
    q: "I’m a developer — can you help with multiple units or off-plan?",
    a: "Yes. We support developer briefs (off-plan and completed stock), phased releases, bulk enquiries, and unit-level pricing. Ask about tailored marketing packs and buyer profiling."
  },
  {
    q: "How do buyers use Home AI?",
    a: "Create a buyer profile to set budget, location and must-haves. You’ll get price alerts for relevant listings and an AI assistant that shortlists homes, suggests comparable options and helps arrange viewings."
  },
  {
    q: "Do you cover my area?",
    a: "We’re rolling out across the UK. Enter your postcode when you create an account; if we’re not live in your area yet, you can register interest and we’ll notify you as soon as we are."
  },
  {
    q: "What marketing do you handle for sellers?",
    a: "Professional photography, copywriting, listing distribution, targeted digital campaigns, and AI-assisted buyer matching. We coordinate viewings and gather structured feedback to refine pricing and positioning."
  },
  {
    q: "Who conducts viewings?",
    a: "We offer flexible options: hosted viewings by our team or owner-led time slots with our scheduling tools. We’ll recommend the best approach for your property and location."
  },
  {
    q: "How do offers and sales progression work?",
    a: "Offers are submitted and verified through your dashboard. Once you accept, we move into sales progression with solicitors, surveys and milestones tracked transparently in your account."
  },
  {
    q: "How are fees structured?",
    a: "Your contract sets out the upfront payment and any success-based fee on completion. There are no hidden extras; optional services (e.g., premium video) are itemised."
  },
  {
    q: "Can I withdraw my listing?",
    a: "Yes. You can request withdrawal through your account. Any notice periods or costs will be defined in your contract."
  },
  {
    q: "How do price alerts work?",
    a: "Set your criteria and we’ll notify you of price changes and new matches in real time. You can tweak or pause alerts any time from your profile."
  },
  {
    q: "How does Home AI use my data?",
    a: "We use your information to deliver valuations, matches and communication about your listing or search. We never sell personal data. See our Privacy Policy for full details."
  },
  {
    q: "How do I get support?",
    a: "Use the in-app chat from your dashboard. You can also submit a support request via the contact form; we’ll reply inside your account."
  }
];

export default function ComingSoon() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const faqRef = useRef(null);

  const storeInterestLocally = (value) => {
    try {
      if (typeof window === "undefined") return false;
      const existing = JSON.parse(localStorage.getItem("offlineInterest") ?? "[]");
      existing.push({ email: value, storedAt: new Date().toISOString() });
      localStorage.setItem("offlineInterest", JSON.stringify(existing));
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setMessage("Please enter an email address.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch(interestEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error("Unable to save your interest right now.");
      setStatus("success");
      setMessage("Thanks! We will be in touch!");
      setEmail("");
    } catch (error) {
      const saved = storeInterestLocally(email);
      if (saved) {
        setStatus("success");
        setMessage("Thanks! We will be in touch!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(error.message || "Something went wrong. Please try again later.");
      }
    }
  };

  const handleScrollToFAQ = () => {
    faqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <main className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_60%)] text-white overflow-hidden bg-black">
        <button
          type="button"
          className="absolute top-4 right-4 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.35em] hover:bg-white/10 z-20"
          onClick={() => setShowSignIn(true)}
        >
          Admin access
        </button>
        <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden="true" />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center space-y-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">home ai</p>
            <h1 className="text-4xl md:text-6xl font-light">
              welcome <span className="shine-text font-semibold">home</span>
            </h1>
            <p className="text-sm text-white/60 max-w-lg mx-auto">
              We’re preparing a new era of AI-guided home selling and buying. Be the first to know when we launch.
            </p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-black/60 p-6 max-w-md w-full backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.65)] space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">Register interest</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-full bg-black/60 border border-white/20 px-5 py-3.5 text-sm text-white placeholder-white/40 focus:border-white/50 focus:outline-none focus:ring-0"
                required
              />
              <button
                type="submit"
                className="w-full rounded-full bg-white text-black py-3.5 text-sm font-medium tracking-[0.2em] uppercase shadow-[0_12px_30px_rgba(255,255,255,0.2)] hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending…" : "Notify me"}
              </button>
              {message && (
                <p
                  className={`text-xs ${
                    status === "success" ? "text-emerald-200 uppercase tracking-[0.2em]" : "text-rose-300"
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">Coming soon • home-ai.uk</p>
        </div>
        <button
          type="button"
          onClick={handleScrollToFAQ}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white transition flex flex-col items-center gap-2"
        >
          <span className="text-xs tracking-[0.5em] uppercase">More</span>
          <span className="animate-bounce">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 10l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
        <GoogleSignIn
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          allowedDomain="thebreakco.com"
          enableTestAccounts={false}
          onSignedIn={(session) => {
            if (!session?.email?.toLowerCase().endsWith("@thebreakco.com")) {
              return;
            }
            setShowSignIn(false);
            navigate("/login", { replace: true });
          }}
        />
      </main>

      <section
        ref={faqRef}
        className="bg-black text-white border-t border-white/5 px-6 py-16 sm:py-20"
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <p className="text-xs uppercase tracking-[0.5em] text-white/40">Home AI — FAQs</p>
            <h2 className="text-3xl font-light">Frequently Asked Questions</h2>
            <p className="text-white/70 text-sm max-w-2xl mx-auto">
              Scroll through the essentials on valuations, launch timelines, developer briefs and buyer workflows.
            </p>
          </div>
          <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
            {FAQ_BLOCK.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left px-6 py-5 flex flex-col gap-2 hover:bg-white/5 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-medium">{item.q}</span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/30 text-xs transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <div
                    className={`text-sm text-white/70 leading-relaxed transition-[max-height,opacity] duration-300 ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    {item.a}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
