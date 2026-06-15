import { PRO_CAST_SESSIONS } from "@/lib/worldcup/pro-cast"
import { ProCastCard } from "@/components/worldcup/pro-cast/pro-cast-card"
import { Mic, Radio } from "lucide-react"

export default function ProCastPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <div className="mb-3 flex items-center gap-2 text-red-400">
          <Radio className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-widest">
            What Would The Pros Do
          </span>
        </div>
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          The Manning Cast for the World Cup
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-white/60">
          An alternate feed where legends like Beckham and Zidane talk through the same play in
          real time — drawing on the telestrator, sharing first-World-Cup stories, and explaining
          rules like offside and the back-pass law while the match unfolds.
        </p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Radio, label: "Ex-player PIP", desc: "Host in the corner while the play runs" },
          { icon: Mic, label: "Telestrator", desc: "Arrows, zones, and offside lines drawn live" },
          { icon: Radio, label: "Rules + tactics", desc: "Strategy and education in conversation" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-[#0f1729] p-4">
            <item.icon className="mb-2 h-5 w-5 text-red-400" />
            <p className="font-semibold text-white">{item.label}</p>
            <p className="mt-1 text-sm text-white/50">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {PRO_CAST_SESSIONS.map((session, i) => (
          <ProCastCard key={session.id} session={session} featured={i === 0} />
        ))}
      </div>
    </div>
  )
}
