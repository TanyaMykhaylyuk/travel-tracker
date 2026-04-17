import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCountryFillColors,
  getVisitedCountriesSet,
  getVisitedLandmarksSet,
} from "../lib/visitStorage";
import {
  fetchUser,
  getStoredUserId,
  logoutTraveler,
  registerOrUpdateUser,
  setStoredUserId,
  type ServerUser,
} from "../lib/userApi";
import type { ProfileData } from "../types/profile";

const emptyProfile: ProfileData = {
  displayName: "",
  handle: "",
  bio: "",
};

export function useUserProfile(open: boolean, onClose: () => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(profile);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [accountSecured, setAccountSecured] = useState(false);

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
        countryFillColors: getCountryFillColors(),
      });
      setProfile({
        displayName: user.displayName,
        handle: user.handle,
        bio: user.bio,
      });
      setPhotoUrl(user.photoDataUrl || null);
      setStoredUserId(user.id);
      setAccountSecured(Boolean(user.hasPassword));
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    const userId = getStoredUserId();
    if (!userId) {
      setAccountSecured(false);
      return;
    }
    fetchUser(userId)
      .then((user) => {
        setProfile({
          displayName: user.displayName,
          handle: user.handle,
          bio: user.bio,
        });
        setPhotoUrl(user.photoDataUrl || null);
        setAccountSecured(Boolean(user.hasPassword));
      })
      .catch(() => {
        setStoredUserId(null);
        setAccountSecured(false);
      });
  }, [open]);

  const handleAuthed = useCallback((user: ServerUser) => {
    setProfile({
      displayName: user.displayName,
      handle: user.handle,
      bio: user.bio,
    });
    setPhotoUrl(user.photoDataUrl || null);
    setAccountSecured(Boolean(user.hasPassword));
  }, []);

  const handleLogout = useCallback(() => {
    logoutTraveler();
    setProfile(emptyProfile);
    setPhotoUrl(null);
    setAccountSecured(false);
  }, []);

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

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setSaveError(
            "Fill in name and username, then save profile to store photo in DB."
          );
          return;
        }
        setIsSaving(true);
        persistToServer(profile, result)
          .then(() => setSaveError(null))
          .catch((err) =>
            setSaveError(err instanceof Error ? err.message : "Could not save photo.")
          )
          .finally(() => setIsSaving(false));
      };
      reader.readAsDataURL(file);
    },
    [persistToServer, profile]
  );

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
      .catch((e) =>
        setSaveError(e instanceof Error ? e.message : "Could not remove photo.")
      )
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

  const displayName = profile.displayName || "Your name";
  const handleLine = profile.handle ? `@${profile.handle}` : "@username";
  const bioText = profile.bio || "No bio yet.";

  return {
    fileInputRef,
    photoUrl,
    photoError,
    profile,
    isEditing,
    draft,
    setDraft,
    saveError,
    isSaving,
    handleFileChange,
    removePhoto,
    startEditing,
    cancelEditing,
    saveProfile,
    displayName,
    handleLine,
    bioText,
    accountSecured,
    handleAuthed,
    handleLogout,
  };
}
