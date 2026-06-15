import { ModernHeader } from "@/components/modern-header"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />

      {/* Demo Content */}
      <main className="mx-auto max-w-[960px] px-6 py-16 pt-24">
        <div className="text-center space-y-6 px-2 py-2">
          <h1 className="text-4xl font-bold text-foreground">Welcome to Serif</h1>
          <h2 className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            a modern platform for creative professionals
          </h2>

          <div className="pt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gradient-to-r from-slate-50 to-emerald-50 border border-border rounded-2xl shadow-sm p-6 text-left">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Creative Tools</h3>
              <p className="text-muted-foreground text-sm">
                Professional-grade design tools built for modern creative workflows and collaboration.
              </p>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-emerald-50 border border-border rounded-2xl shadow-sm p-6 text-left">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Team Collaboration</h3>
              <p className="text-muted-foreground text-sm">
                Seamless collaboration features that keep your creative team in sync across projects.
              </p>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-emerald-50 border border-border rounded-2xl shadow-sm p-6 text-left md:col-span-2 lg:col-span-1">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Portfolio Showcase</h3>
              <p className="text-muted-foreground text-sm">
                Beautiful portfolio templates to showcase your work and attract new clients.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

