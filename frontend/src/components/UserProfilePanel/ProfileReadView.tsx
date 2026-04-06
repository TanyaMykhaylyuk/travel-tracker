import type { ProfileData } from "../../types/profile";

type Props = {
  profile: ProfileData;
  displayName: string;
  handleLine: string;
  bioText: string;
};

export function ProfileReadView({ profile, displayName, handleLine, bioText }: Props) {
  return (
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

      <section className="mt-8 pb-8">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Bio</h4>
        <p
          className={`mt-2 text-sm leading-relaxed ${profile.bio ? "text-zinc-400" : "text-zinc-600 italic"}`}
        >
          {bioText}
        </p>
      </section>
    </>
  );
}
