import Link from "next/link"
import { ArrowRight, Recycle, Shield, Zap } from "lucide-react"
import { TerratechHeader } from "@/components/terratech/terratech-header"
import { NewsletterDialog } from "@/components/terratech/newsletter-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function TerratechHomePage() {
  return (
    <>
      <TerratechHeader active="home" />

      <main>
        {/* Hero — uses primary token + typography scale from theme.css */}
        <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
              Sustainable Electronics
            </p>
            <h1
              className="mb-4 max-w-2xl font-bold leading-tight text-foreground"
              style={{ fontSize: "var(--tt-text-4xl)" }}
            >
              Technology that respects the planet.
            </h1>
            <p
              className="mb-8 max-w-xl text-muted-foreground"
              style={{ fontSize: "var(--tt-text-lg)" }}
            >
              TerraTech builds repairable, modular devices with earthy materials and
              efficient power — designed by Alex&apos;s living design system.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/terratech/products">
                <Button size="lg" className="gap-2">
                  Shop products
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <NewsletterDialog />
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
            {[
              {
                icon: Recycle,
                title: "Circular by design",
                body: "Modular parts and take-back programs built into every product line.",
              },
              {
                icon: Zap,
                title: "Efficient power",
                body: "Low-draw chipsets and solar-ready accessories across the catalog.",
              },
              {
                icon: Shield,
                title: "Built to last",
                body: "Seven-year software support and open repair documentation.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <CardHeader>
                  <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* HMR demo callout */}
        <section className="border-t border-border bg-muted/50 px-4 py-8 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-6xl border-dashed border-primary/30 bg-card">
            <CardHeader>
              <CardTitle className="text-primary">Live design system demo</CardTitle>
              <CardDescription>
                Alex maintains tokens in{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  design-system/terratech/tokens.js
                </code>{" "}
                and{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  theme.css
                </code>
                . Edit{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  colors.primary
                </code>{" "}
                or{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  --tt-text-base
                </code>{" "}
                — this page hot-reloads instantly.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/workspace">
                <Button variant="secondary">Open Alex in workspace</Button>
              </Link>
              <Link href="/terratech/products">
                <Button variant="outline">See products page</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  )
}
