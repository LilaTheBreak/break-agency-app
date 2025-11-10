import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleSignIn from "../auth/GoogleSignIn.jsx";

const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const interestEndpoint = apiBase ? `${apiBase}/api/interest` : "/api/interest";

export default function ComingSoon() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);

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

  return (
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
              className="w-full rounded-full bg-gradient-to-r from-white via-white to-white/80 text-black py-3.5 text-sm font-semibold tracking-[0.2em] uppercase shadow-[0_18px_45px_rgba(255,255,255,0.35)] hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
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
  );
}
