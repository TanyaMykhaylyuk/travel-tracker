import { useCallback, useEffect, useState } from "react";
import type { ServerUser } from "../../lib/userApi";
import {
  claimAccountWithPassword,
  getStoredUserId,
  loginWithPassword,
  registerNewAccount,
} from "../../lib/userApi";
import {
  getCountryFillColors,
  getVisitedCountriesSet,
  getVisitedLandmarksSet,
} from "../../lib/visitStorage";
import type { ProfileData } from "../../types/profile";

type Props = {
  accountSecured: boolean;
  profile: ProfileData;
  photoUrl: string | null;
  onAuthed: (user: ServerUser) => void;
  onLogout: () => void;
};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none";

type AccountFlow = "register" | "login";

const flowTabClass =
  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500";

export function ProfileAccountSection({
  accountSecured,
  profile,
  photoUrl,
  onAuthed,
  onLogout,
}: Props) {
  const [flow, setFlow] = useState<AccountFlow>("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [logHandle, setLogHandle] = useState("");
  const [logPassword, setLogPassword] = useState("");

  const [claimDisplayName, setClaimDisplayName] = useState(profile.displayName);
  const [claimHandle, setClaimHandle] = useState(profile.handle);
  const [claimPassword, setClaimPassword] = useState("");

  useEffect(() => {
    setClaimDisplayName(profile.displayName);
    setClaimHandle(profile.handle);
  }, [profile.displayName, profile.handle]);

  const [regDisplayName, setRegDisplayName] = useState("");
  const [regHandle, setRegHandle] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const visitPayload = useCallback(
    () => ({
      visitedCountries: [...getVisitedCountriesSet()],
      visitedLandmarks: [...getVisitedLandmarksSet()],
      countryFillColors: getCountryFillColors(),
    }),
    []
  );

  const handleLogin = useCallback(async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      const user = await loginWithPassword(logHandle, logPassword);
      onAuthed(user);
      setLogPassword("");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setAuthBusy(false);
    }
  }, [logHandle, logPassword, onAuthed]);

  const handleClaim = useCallback(async () => {
    const uid = getStoredUserId();
    if (!uid) {
      setAuthError("No local session to secure.");
      return;
    }
    setAuthError(null);
    setAuthBusy(true);
    try {
      const user = await claimAccountWithPassword({
        userId: uid,
        handle: claimHandle.trim().replace(/^@/, ""),
        displayName: claimDisplayName.trim(),
        password: claimPassword,
        bio: profile.bio.trim(),
        photoDataUrl: photoUrl ?? "",
        ...visitPayload(),
      });
      onAuthed(user);
      setClaimPassword("");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Could not secure account");
    } finally {
      setAuthBusy(false);
    }
  }, [
    claimDisplayName,
    claimHandle,
    claimPassword,
    profile.bio,
    photoUrl,
    onAuthed,
    visitPayload,
  ]);

  const handleRegister = useCallback(async () => {
    setAuthError(null);
    setAuthBusy(true);
    try {
      const user = await registerNewAccount({
        handle: regHandle.trim().replace(/^@/, ""),
        displayName: regDisplayName.trim(),
        password: regPassword,
        bio: "",
        photoDataUrl: "",
        ...visitPayload(),
      });
      onAuthed(user);
      setRegPassword("");
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setAuthBusy(false);
    }
  }, [regDisplayName, regHandle, regPassword, onAuthed, visitPayload]);

  const handleLogoutClick = useCallback(() => {
    onLogout();
  }, [onLogout]);

  const hasLocalId = Boolean(getStoredUserId());

  return (
    <div className="border-b border-zinc-800 px-5 pb-5">
      <h3 className="text-sm font-semibold text-zinc-200">Account</h3>

      {authError && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {authError}
        </p>
      )}

      {accountSecured ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-zinc-400">
            You&apos;re signed in. On another device, open Account → Log in with the same username and password.
          </p>
          <button
            type="button"
            disabled={authBusy}
            onClick={handleLogoutClick}
            className="rounded-md border border-zinc-600 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            Log out
          </button>
        </div>
      ) : (
        <>
          <div
            className="mt-4 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1"
            role="tablist"
            aria-label="Account"
          >
            <button
              type="button"
              role="tab"
              aria-selected={flow === "register"}
              onClick={() => {
                setAuthError(null);
                setFlow("register");
              }}
              className={`${flowTabClass} ${
                flow === "register"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Register
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={flow === "login"}
              onClick={() => {
                setAuthError(null);
                setFlow("login");
              }}
              className={`${flowTabClass} ${
                flow === "login"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Log in
            </button>
          </div>

          {flow === "register" ? (
            <div className="mt-4" role="tabpanel">
              <p className="text-xs leading-relaxed text-zinc-500">
                {hasLocalId
                  ? "Add a username and password so you can sign in again after clearing site data or on another browser. Your visits stay on the server under that username."
                  : "Create a new account. Visits you save are stored on the server under your username (min. 8 character password)."}
              </p>
              {hasLocalId ? (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Secure this device</p>
                  <p className="mt-1 text-xs text-zinc-500">Choose a public username and password (min. 8 characters).</p>
                  <label className="mt-3 block text-xs text-zinc-400">
                    Display name
                    <input
                      type="text"
                      value={claimDisplayName}
                      onChange={(e) => setClaimDisplayName(e.target.value)}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </label>
                  <label className="mt-2 block text-xs text-zinc-400">
                    Username
                    <input
                      type="text"
                      value={claimHandle}
                      onChange={(e) => setClaimHandle(e.target.value)}
                      className={inputClass}
                      autoComplete="username"
                    />
                  </label>
                  <label className="mt-2 block text-xs text-zinc-400">
                    Password
                    <input
                      type="password"
                      value={claimPassword}
                      onChange={(e) => setClaimPassword(e.target.value)}
                      className={inputClass}
                      autoComplete="new-password"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => void handleClaim()}
                    className="mt-3 rounded-md border border-sky-700 bg-sky-900/40 px-3 py-2 text-sm text-sky-100 transition hover:bg-sky-900/60 disabled:opacity-50"
                  >
                    {authBusy ? "Saving…" : "Save username & password"}
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">New account</p>
                  <p className="mt-1 text-xs text-zinc-500">Choose a display name, public username, and password.</p>
                  <label className="mt-3 block text-xs text-zinc-400">
                    Display name
                    <input
                      type="text"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </label>
                  <label className="mt-2 block text-xs text-zinc-400">
                    Username
                    <input
                      type="text"
                      value={regHandle}
                      onChange={(e) => setRegHandle(e.target.value)}
                      className={inputClass}
                      autoComplete="username"
                    />
                  </label>
                  <label className="mt-2 block text-xs text-zinc-400">
                    Password
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={inputClass}
                      autoComplete="new-password"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => void handleRegister()}
                    className="mt-3 rounded-md border border-sky-700 bg-sky-900/40 px-3 py-2 text-sm text-sky-100 transition hover:bg-sky-900/60 disabled:opacity-50"
                  >
                    {authBusy ? "Creating…" : "Create account"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4" role="tabpanel">
              <p className="text-xs leading-relaxed text-zinc-500">
                Already have a username? Sign in to load your map and visits from the server.
              </p>
              <label className="mt-4 block text-xs text-zinc-400">
                Username
                <input
                  type="text"
                  value={logHandle}
                  onChange={(e) => setLogHandle(e.target.value)}
                  className={inputClass}
                  autoComplete="username"
                />
              </label>
              <label className="mt-2 block text-xs text-zinc-400">
                Password
                <input
                  type="password"
                  value={logPassword}
                  onChange={(e) => setLogPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="current-password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleLogin();
                  }}
                />
              </label>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void handleLogin()}
                className="mt-3 rounded-md border border-zinc-600 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {authBusy ? "…" : "Log in"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
