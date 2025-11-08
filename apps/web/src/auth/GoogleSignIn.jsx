import React, { useMemo, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { ALLOWED_ADMINS } from "./config";
import { MOCK_ACCOUNTS } from "./mockAccounts";
import { Roles, signInSession } from "./session";

export default function GoogleSignIn({
  open,
  onClose,
  onSignedIn,
  allowedDomain,
  enableTestAccounts = true
}) {
  if (!open) return null;

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const domainSuffix = allowedDomain ? `@${allowedDomain.replace(/^@/, "")}` : null;

  const sortedAccounts = useMemo(
    () => MOCK_ACCOUNTS.slice().sort((a, b) => a.email.localeCompare(b.email)),
    []
  );

  const handleManualLogin = (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

     if (domainSuffix && !email.endsWith(domainSuffix)) {
       setError(`Only ${domainSuffix} accounts can sign in here.`);
       return;
     }

    const account = sortedAccounts.find((acc) => acc.email.toLowerCase() === email);
    if (!account || account.password !== password) {
      setError("Invalid test credentials. Try buyer@test.com / password.");
      return;
    }

    const session = signInSession({
      email: account.email,
      name: account.name,
      avatar: account.avatar,
      roles: account.roles,
      provider: "test"
    });

    onSignedIn?.({ ...session });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="bg-white text-black rounded-2xl p-6 w-[480px] max-w-[92vw]">
        <h3 className="text-xl font-semibold">Sign in</h3>
        <p className="text-sm text-neutral-600 mt-1">
          Use Google for production credentials or the test accounts below for persona previews.
        </p>

        <div className="mt-5 flex justify-center">
          <GoogleLogin
            onSuccess={(cred) => {
              try {
                const payload = jwtDecode(cred.credential || "");
                const email = payload?.email || "";
                const profile = {
                  email,
                  name: payload?.name,
                  picture: payload?.picture,
                };

                if (domainSuffix && !email.toLowerCase().endsWith(domainSuffix)) {
                  setError(`Only ${domainSuffix} accounts can sign in here.`);
                  return;
                }

                const isAdmin = ALLOWED_ADMINS.includes(email);
                const roles = isAdmin ? [Roles.ADMIN, Roles.AGENT] : [Roles.BUYER];
                const session = signInSession({
                  email,
                  name: profile.name,
                  avatar: profile.picture,
                  roles,
                  provider: "google"
                });

                onSignedIn?.({ ...session });
                onClose?.();
              } catch (e) {
                alert("Could not verify Google token.");
                console.error(e);
              }
            }}
            onError={() => alert("Google login failed. Try again.")}
            useOneTap={false}
            theme="filled_black"
            shape="pill"
            text="signin_with"
          />
        </div>

        {enableTestAccounts && (
          <div className="mt-6 border-t border-neutral-200 pt-5">
          <p className="text-sm font-medium text-neutral-800">Test personas</p>
          <p className="text-xs text-neutral-500 mt-1">
            Email + password (`password`) to explore buyer, seller, agent, and hybrid views.
          </p>
          <form className="mt-4 space-y-3" onSubmit={handleManualLogin}>
            <div>
              <label className="block text-xs uppercase tracking-wide text-neutral-500">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="buyer@test.com"
                value={form.email}
                onChange={(e) => {
                  setError("");
                  setForm((prev) => ({ ...prev, email: e.target.value }));
                }}
                list="test-accounts"
              />
              <datalist id="test-accounts">
                {sortedAccounts.map((acc) => (
                  <option value={acc.email} key={acc.email} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-neutral-500">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                placeholder="password"
                value={form.password}
                onChange={(e) => {
                  setError("");
                  setForm((prev) => ({ ...prev, password: e.target.value }));
                }}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-black text-white py-2 text-sm font-medium hover:bg-black/90 transition"
            >
              Sign in with test account
            </button>
          </form>

          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600">
            {sortedAccounts.map((acc) => (
              <li
                key={acc.email}
                className="rounded-xl border border-neutral-200 px-3 py-2 bg-neutral-50"
              >
                <div className="font-medium text-neutral-800">{acc.email}</div>
                <div>{acc.roles.join(", ")}</div>
              </li>
            ))}
          </ul>
          </div>
        )}

        <button
          className="mt-3 text-sm text-neutral-500 hover:text-neutral-700"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
