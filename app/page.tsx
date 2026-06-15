import Link from "next/link";
import { ModernHeader } from "@/components/modern-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Radio, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen w-full relative bg-[#0a0f1a]">
      <ModernHeader />

      <div className="min-h-screen w-full relative flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-[#0a0f1a] to-red-900/20" />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-4">
            FIFA World Cup 2026
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-6 leading-tight">
            Your World Cup companion.
          </h1>
          <p className="text-lg sm:text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
            Live scores, plain-English explainers, and short stories built for US fans
            discovering the beautiful game.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/worldcup">
              <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-base">
                <Radio className="h-4 w-4" />
                Open World Cup Hub
              </Button>
            </Link>
            <Link href="/worldcup/format">
              <Button variant="outline" className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 px-6 py-3 text-base">
                48-team guide
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/terratech">
              <Button variant="outline" className="gap-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 px-6 py-3 text-base">
                <Leaf className="h-4 w-4" />
                TerraTech demo
              </Button>
            </Link>
            <Link href="/workspace">
              <Button variant="outline" className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 px-6 py-3 text-base">
                <Users className="h-4 w-4" />
                Alex workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}