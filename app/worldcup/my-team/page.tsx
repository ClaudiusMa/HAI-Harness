import { WorldCupPreferencesForm } from "@/components/worldcup/worldcup-preferences-form"

export default function MyTeamPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Personalize
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">My Team & settings</h1>
        <p className="mt-3 text-white/60">
          Pick your team, set your experience level, and control how much hand-holding you want.
          We&apos;ll tailor scores, tips, and stories to you.
        </p>
      </div>
      <WorldCupPreferencesForm />
    </div>
  )
}
