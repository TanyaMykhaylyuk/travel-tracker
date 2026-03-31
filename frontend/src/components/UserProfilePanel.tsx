import { useCallback, useEffect, useRef, useState } from "react";
import {
  getVisitedCountriesSet,
  getVisitedLandmarksSet,
} from "../lib/visitStorage";
import {
  fetchUser,
  getStoredUserId,
  registerOrUpdateUser,
  setStoredUserId,
} from "../lib/userApi";

type ProfileData = {
  displayName: string;
  handle: string;
  bio: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const emptyProfile: ProfileData = {
  displayName: "",
  handle: "",
  bio: "",
};

export default function UserProfilePanel({ open, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const persistToServer = useCallback(
    async (nextProfile: ProfileData, nextPhotoUrl: string | null) => {
      const user = await registerOrUpdateUser({
        id: getStoredUserId() ?? undefined,
        handle: nextProfile.handle.trim().replace(/^@/, ""),
        displayName: nextProfile.displayName.trim(),
        bio: nextProfile.bio.trim(),
        photoDataUrl: nextPhotoUrl ?? "",
        visitedCountries: [...getVisitedCountriesSet()],
        visitedLandmarks: [...getVisitedLandmarksSet()],
      });
      setProfile({
        displayName: user.displayName,
        handle: user.handle,
        bio: user.bio,
      });
      setPhotoUrl(user.photoDataUrl || null);
      setStoredUserId(user.id);
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    const userId = getStoredUserId();
    if (!userId) return;
    fetchUser(userId)
      .then((user) => {
        setProfile({
          displayName: user.displayName,
          handle: user.handle,
          bio: user.bio,
        });
        setPhotoUrl(user.photoDataUrl || null);
      })
      .catch(() => {
        setStoredUserId(null);
      });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isEditing) {
        setIsEditing(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, isEditing]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;
      setPhotoUrl(result);
      if (!profile.handle || !profile.displayName) {
        setSaveError("Fill in name and username, then save profile to store photo in DB.");
        return;
      }
      setIsSaving(true);
      persistToServer(profile, result)
        .then(() => setSaveError(null))
        .catch((e) => setSaveError(e instanceof Error ? e.message : "Could not save photo."))
        .finally(() => setIsSaving(false));
    };
    reader.readAsDataURL(file);
  }, [persistToServer, profile]);

  const removePhoto = useCallback(() => {
    setPhotoUrl(null);
    setPhotoError(null);
    if (!profile.handle || !profile.displayName) {
      setSaveError("Fill in name and username, then save profile to remove photo in DB.");
      return;
    }
    setIsSaving(true);
    void persistToServer(profile, null)
      .then(() => setSaveError(null))
      .catch((e) => setSaveError(e instanceof Error ? e.message : "Could not remove photo."))
      .finally(() => setIsSaving(false));
  }, [persistToServer, profile]);

  const startEditing = useCallback(() => {
    setDraft(profile);
    setSaveError(null);
    setIsEditing(true);
  }, [profile]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const saveProfile = useCallback(async () => {
    const next: ProfileData = {
      displayName: draft.displayName.trim(),
      handle: draft.handle.trim().replace(/^@/, ""),
      bio: draft.bio.trim(),
    };
    setSaveError(null);
    setIsSaving(true);
    try {
      await persistToServer(next, photoUrl);
      setIsEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  }, [draft, persistToServer, photoUrl]);

  if (!open) return null;

  const displayName = profile.displayName || "Your name";
  const handleLine = profile.handle ? `@${profile.handle}` : "@username";
  const bioText = profile.bio || "No bio yet.";

  return (
    <>
      <div
        className="fixed inset-0 z-40 cursor-default bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
        role="presentation"
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-panel-title"
      >
        <header className="flex shrink-0 items-center gap-2 px-5 py-4">
          <h2 id="profile-panel-title" className="min-w-0 flex-1 text-base font-semibold text-zinc-100">
            Profile
          </h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={startEditing}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900 hover:text-zinc-100"
            >
              Edit profile
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={isSaving}
                className="shrink-0 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-700"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {saveError && (
          <p className="shrink-0 border-b border-zinc-800 bg-zinc-900/80 px-5 py-2 text-sm text-red-400" role="alert">
            {saveError}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
          />

          <div className="relative aspect-[4/3] w-full bg-zinc-900">
            {photoUrl ? (
              <>
                <img
                  src={photoUrl}
                  alt=""
                  className="h-full w-full object-cover object-top"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md border border-zinc-700/80 bg-black/50 px-3 py-1.5 text-xs font-medium text-zinc-200 shadow backdrop-blur-sm transition hover:border-zinc-600 hover:bg-zinc-900/90"
                  >
                    Change photo
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="rounded-md border border-zinc-700/80 bg-black/50 px-3 py-1.5 text-xs font-medium text-zinc-400 shadow backdrop-blur-sm transition hover:border-zinc-600 hover:bg-zinc-950 hover:text-zinc-200"
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center transition hover:bg-zinc-900/80"
                aria-label="Add profile photo"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-zinc-500">
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-zinc-300">Add photo</span>
                <span className="text-xs text-zinc-600">JPG, PNG or GIF — saved in this browser</span>
              </button>
            )}
          </div>

          {photoError && (
            <p className="mx-5 mt-3 text-sm text-zinc-400" role="alert">
              {photoError}
            </p>
          )}

          <div className="px-5 pt-5">
            {isEditing ? (
              <div className="flex flex-col gap-4">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">Name</span>
                  <input
                    type="text"
                    value={draft.displayName}
                    onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                    placeholder="Your name"
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">Username</span>
                  <div className="mt-1.5 flex rounded-lg border border-zinc-800 bg-zinc-900 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600">
                    <span className="flex items-center pl-3 text-sm text-zinc-600">@</span>
                    <input
                      type="text"
                      value={draft.handle}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          handle: e.target.value.replace(/^@+/, ""),
                        }))
                      }
                      placeholder="username"
                      className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                      autoComplete="username"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">Bio</span>
                  <textarea
                    value={draft.bio}
                    onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                    placeholder="Tell something about your travels…"
                    rows={5}
                    className="mt-1.5 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-lg font-bold ${profile.displayName ? "text-zinc-100" : "text-zinc-600 italic"}`}
                  >
                    {displayName}
                  </h3>
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-zinc-500 ring-2 ring-zinc-950"
                    title="Online"
                    aria-hidden
                  />
                </div>
                <p className={`mt-1 text-sm ${profile.handle ? "text-zinc-500" : "text-zinc-600 italic"}`}>
                  {handleLine}
                </p>
              </>
            )}

            {!isEditing && (
              <section className="mt-8 pb-8">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Bio</h4>
                <p
                  className={`mt-2 text-sm leading-relaxed ${profile.bio ? "text-zinc-400" : "text-zinc-600 italic"}`}
                >
                  {bioText}
                </p>
              </section>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
