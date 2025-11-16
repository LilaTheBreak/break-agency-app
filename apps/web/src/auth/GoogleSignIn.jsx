import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { ALLOWED_ADMINS, GOOGLE_CLIENT_ID } from "./config";
import { Roles, signInSession } from "./session";

const HAS_GOOGLE_CLIENT = Boolean(GOOGLE_CLIENT_ID?.trim());

export default function GoogleSignIn({ open, onClose, onSignedIn, allowedDomain }) {
  if (!open) return null;

  const [error, setError] = useState("");
  const domainSuffix = allowedDomain ? `@${allowedDomain.replace(/^@/, "")}` : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
      <div className="bg-white text-black rounded-2xl p-6 w-[480px] max-w-[92vw]">
        <h3 className="text-xl font-semibold">Sign in</h3>

        {HAS_GOOGLE_CLIENT ? (
          <div className="mt-5 flex flex-col items-center gap-2">
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
                  const roles = isAdmin ? [Roles.ADMIN, Roles.TALENT_MANAGER] : [Roles.CREATOR];
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
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        ) : (
          <p className="mt-5 text-sm text-neutral-600">
            Google Sign-In is disabled for this environment. Please contact The Break Co. to provision access.
          </p>
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
