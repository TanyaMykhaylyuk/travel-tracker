import type { RefObject } from "react";

type Props = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  photoUrl: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
};

export function ProfilePhotoSection({
  fileInputRef,
  photoUrl,
  onFileChange,
  onRemovePhoto,
}: Props) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileChange}
      />

      <div className="relative aspect-4/3 w-full bg-zinc-900">
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
                onClick={onRemovePhoto}
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
    </>
  );
}
