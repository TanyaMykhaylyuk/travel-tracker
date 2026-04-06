import { useUserProfile } from "../../hooks/useUserProfile";
import { ProfileEditForm } from "./ProfileEditForm";
import { ProfilePhotoSection } from "./ProfilePhotoSection";
import { ProfileReadView } from "./ProfileReadView";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UserProfilePanel({ open, onClose }: Props) {
  const {
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
  } = useUserProfile(open, onClose);

  if (!open) return null;

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
          <ProfilePhotoSection
            fileInputRef={fileInputRef}
            photoUrl={photoUrl}
            onFileChange={handleFileChange}
            onRemovePhoto={removePhoto}
          />

          {photoError && (
            <p className="mx-5 mt-3 text-sm text-zinc-400" role="alert">
              {photoError}
            </p>
          )}

          <div className="px-5 pt-5">
            {isEditing ? (
              <ProfileEditForm draft={draft} setDraft={setDraft} />
            ) : (
              <ProfileReadView
                profile={profile}
                displayName={displayName}
                handleLine={handleLine}
                bioText={bioText}
              />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
