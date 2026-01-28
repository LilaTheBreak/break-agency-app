import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignin = () => {
    loginWithGoogle().catch(() => {});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      console.log('[LOGIN] Attempting login:', normalizedEmail);
      await loginWithEmail(normalizedEmail, form.password);
      console.log('[LOGIN] Success!');
      
      // Navigate to the page they were trying to access, or dashboard
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      console.log('[LOGIN] Error caught:', err);
      const message = err instanceof Error ? err.message : "Unable to sign in";
      if (/not found|doesn't exist/i.test(message)) {
        setError("No account found with this email. Try signing up first.");
      } else if (/incorrect|invalid/i.test(message)) {
        setError("Incorrect password. Please try again.");
      } else {
        setError(message || "Unable to sign in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-linen px-6 py-16 text-brand-black">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-[34px] border border-brand-black/10 bg-brand-white p-8 shadow-[0_30px_90px_rgba(0,0,0,0.15)]">
        <div className="space-y-2 text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-brand-red">Secure access</p>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.25em]">Sign in to The Break Console</h1>
          <p className="text-sm text-brand-black/70">
            You'll be redirected to Google to verify your identity. After authenticating, you'll return here with secure console access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignin}
          className="inline-flex w-full items-center justify-center rounded-full border border-brand-black/20 bg-brand-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-black transition hover:border-brand-black hover:bg-brand-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-black"
        >
          Continue with Google
        </button>

        <div className="flex items-center justify-center gap-3 text-[0.65rem] uppercase text-brand-black/60">
          <span className="h-px flex-1 bg-brand-black/10" />
          <span>or</span>
          <span className="h-px flex-1 bg-brand-black/10" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[0.65rem] uppercase tracking-[0.35em] text-brand-black/60 mb-2">
              Email
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
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                className="w-full rounded-2xl border border-brand-black/10 bg-brand-white/90 px-4 py-3 pr-10 text-sm text-brand-black focus:border-brand-red focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/50 hover:text-brand-black"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-2 flex items-center">
              <input
                type="checkbox"
                id="show-password"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-brand-black/20 text-brand-red focus:ring-brand-red"
              />
              <label htmlFor="show-password" className="ml-2 text-xs text-brand-black/60">
                Show password
              </label>
            </div>
          </div>
          
          {error ? <p className="text-sm text-brand-red">{error}</p> : null}
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-brand-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-brand-white transition hover:bg-brand-red/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-wait disabled:bg-brand-black/60"
          >
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>
        
        <p className="text-center text-xs text-brand-black/60">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-brand-red">
            Sign up
          </Link>
        </p>
        
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-full text-center text-xs text-brand-black/60 hover:text-brand-black"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
