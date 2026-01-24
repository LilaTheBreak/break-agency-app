import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/apiClient.js';
import { getDashboardPathForRole, shouldRouteToOnboarding } from "../lib/onboardingState.js";

export default function DevLogin() {
  const [email, setEmail] = useState('creator@thebreakco.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const testAccounts = [
    { email: 'creator@thebreakco.com', role: 'Creator' },
    { email: 'brand@thebreakco.com', role: 'Brand' },
    { email: 'admin@thebreakco.com', role: 'Admin' },
    { email: 'exclusive@thebreakco.com', role: 'Exclusive Talent' },
    { email: 'manager@thebreakco.com', role: 'Talent Manager' },
    { email: 'ugc@thebreakco.com', role: 'UGC Talent' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/dev-auth/login', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store auth token in localStorage for Bearer authentication
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      const user = data.user || {};
      const needsOnboarding = shouldRouteToOnboarding(user);
      const roleParam = user.role ? `?role=${user.role}` : "";
      const redirectPath = needsOnboarding
        ? `/onboarding${roleParam}`
        : getDashboardPathForRole(user.role);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-linen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-brand-black/10 p-8 shadow-lg">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl uppercase text-brand-black mb-2">
              Dev Login
            </h1>
            <p className="text-sm text-brand-red uppercase tracking-widest">
              Development Mode Only
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-black mb-2">
                Select Test Account
              </label>
              <select
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-brand-black/20 focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
              >
                {testAccounts.map((account) => (
                  <option key={account.email} value={account.email}>
                    {account.email} ({account.role})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red text-white py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-brand-linen/50 rounded-xl">
            <p className="text-xs text-brand-black/60 text-center">
              This is a development-only login bypass. Do not use in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
