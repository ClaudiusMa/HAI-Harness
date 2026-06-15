import Link from "next/link"
import { Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

interface TerratechHeaderProps {
  active?: "home" | "products"
}

export function TerratechHeader({ active = "home" }: TerratechHeaderProps) {
  const links = [
    { href: "/terratech", label: "Home", id: "home" as const },
    { href: "/terratech/products", label: "Products", id: "products" as const },
    { href: "/workspace", label: "Alex Workspace", id: null },
  ]

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/terratech" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-lg font-bold leading-tight">TerraTech</p>
            <p className="text-xs text-muted-foreground">Sustainable Electronics</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                link.id && active === link.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
