import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleSignIn from "../auth/GoogleSignIn.jsx";

export default function ComingSoon() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);

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
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!response.ok) throw new Error("Unable to save your interest right now.");
      setStatus("success");
      setMessage("Thanks! We’ll keep you in the loop.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Something went wrong. Please try again later.");
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 max-w-md w-full">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Register interest</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-white/15 px-4 py-3 text-sm focus:border-white/40 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-white text-black py-3 text-sm font-medium hover:bg-white/90"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending…" : "Notify me"}
            </button>
            {message && (
              <p className={`text-xs ${status === "success" ? "text-emerald-300" : "text-rose-300"}`}>
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
