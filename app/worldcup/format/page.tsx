import { FormatExplainer } from "@/components/worldcup/format-explainer"

export default function FormatPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          New to the tournament?
        </p>
        <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
          The 48-team format, explained
        </h1>
        <p className="mt-3 text-lg text-white/60">
          The 2026 World Cup is the biggest ever. Here&apos;s how groups, advancement, and the
          knockout bracket work — written for fans coming from the NFL, NBA, or MLB.
        </p>
      </div>
      <FormatExplainer />
    </div>
  )
}
