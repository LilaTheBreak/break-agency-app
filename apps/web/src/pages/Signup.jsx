import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_OPTIONS = [
  { value: "BRAND", label: "Brand", description: "Commission campaigns and collaborations" },
  { value: "FOUNDER", label: "Founder", description: "Personal brand strategy and founder-led content" },
  { value: "CREATOR", label: "Creator", description: "Standard creator opportunities" },
  { value: "UGC", label: "UGC Creator", description: "Content creation without audience leverage" },
  { value: "AGENT", label: "Agent", description: "Represent talent and manage deals" }
];

export default function SignupPage() {
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", role: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = () => {
    if (!form.role) {
      setError("Please select a role first");
      return;
    }
    loginWithGoogle().catch(() => {});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!form.role) {
      setError("Please select a role");
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      await signupWithEmail(normalizedEmail, form.password, form.role);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-linen px-6 py-16 text-brand-black">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-[34px] border border-brand-black/10 bg-brand-white p-8 shadow-[0_30px_90px_rgba(0,0,0,0.15)]">
        <div className="space-y-2 text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-red">Secure access</p>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.25em]">Create an account</h1>
          <p className="text-sm text-brand-black/70">
            Select your role and create your account. You can sign in with Google anytime.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              I am a *
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                    form.role === option.value
                      ? "border-brand-red bg-brand-red/5"
                      : "border-brand-black/10 hover:border-brand-black/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={form.role === option.value}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="mt-0.5"
                    required
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-black">{option.label}</p>
                    <p className="text-xs text-brand-black/60">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 text-[0.65rem] uppercase text-brand-black/60">
            <span className="h-px flex-1 bg-brand-black/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-brand-black/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="inline-flex w-full items-center justify-center rounded-full border border-brand-black/20 bg-brand-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:border-brand-black hover:bg-brand-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-black"
          >
            Continue with Google
          </button>

          <div className="flex items-center justify-center gap-3 text-[0.65rem] uppercase text-brand-black/60">
            <span className="h-px flex-1 bg-brand-black/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-brand-black/10" />
          </div>
          
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
              className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              minLength={8}
              required
              className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 text-sm text-brand-black focus:border-brand-red focus:outline-none"
            />
            <p className="mt-1 text-xs text-brand-black/50">Minimum 8 characters</p>
          </div>
          
          {error ? <p className="text-sm text-brand-red">{error}</p> : null}
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:bg-brand-red/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-wait disabled:bg-brand-black/60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="text-center text-xs text-brand-black/60">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-red">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
