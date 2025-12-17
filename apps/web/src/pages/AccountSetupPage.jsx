import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../services/apiClient.js";

export default function AccountSetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid setup link. Please contact your administrator.");
      setStatus("error");
      return;
    }
    
    // Verify token is valid
    verifySetupToken();
  }, [token, email]);

  const verifySetupToken = async () => {
    try {
      const response = await apiFetch(`/api/setup/verify`, {
        method: "POST",
        body: JSON.stringify({ token, email })
      });
      
      if (response.ok) {
        const data = await response.json();
        setName(data.name || "");
        setStatus("ready");
      } else {
        throw new Error("Invalid or expired setup link");
      }
    } catch (err) {
      console.error("Token verification failed:", err);
      setError("This setup link is invalid or has expired. Please contact your administrator.");
      setStatus("error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setStatus("submitting");
    setError("");

    try {
      const response = await apiFetch("/api/setup/complete", {
        method: "POST",
        body: JSON.stringify({
          token,
          email,
          password,
          name
        })
      });

      if (!response.ok) {
        throw new Error("Failed to complete setup");
      }

      const data = await response.json();
      
      // Setup complete, redirect to onboarding
      setStatus("success");
      setTimeout(() => {
        navigate("/onboarding");
      }, 1500);
      
    } catch (err) {
      console.error("Setup completion failed:", err);
      setError("Failed to complete setup. Please try again.");
      setStatus("ready");
    }
  };

  if (status === "verifying") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-ivory">
        <div className="text-center">
          <div className="mb-4 text-2xl">Verifying your invitation...</div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-ivory">
        <div className="max-w-md rounded-[36px] border border-brand-black/10 bg-brand-white p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
          <h1 className="font-display text-3xl uppercase text-brand-red">Setup Error</h1>
          <p className="mt-4 text-brand-black">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-ivory">
        <div className="max-w-md rounded-[36px] border border-brand-black/10 bg-brand-white p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
          <h1 className="font-display text-3xl uppercase text-brand-black">Welcome!</h1>
          <p className="mt-4 text-brand-black">Your account is ready. Redirecting to onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-ivory p-4">
      <div className="w-full max-w-lg rounded-[36px] border border-brand-black/10 bg-brand-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <h1 className="font-display text-3xl uppercase text-brand-black">Complete Your Setup</h1>
        <p className="mt-2 text-sm text-brand-black/60">
          Setting up account for <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
              Create Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.35em] text-brand-red">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-brand-black/20 bg-brand-white px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
              placeholder="Re-enter password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-brand-red/10 p-3 text-sm text-brand-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-full bg-brand-black px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-brand-white disabled:opacity-50"
          >
            {status === "submitting" ? "Setting up..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
