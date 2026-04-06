import type { ProfileData } from "../../types/profile";

type Props = {
  draft: ProfileData;
  setDraft: React.Dispatch<React.SetStateAction<ProfileData>>;
};

export function ProfileEditForm({ draft, setDraft }: Props) {
  return (
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
  );
}
