import { TerratechHeader } from "@/components/terratech/terratech-header"
import { ProductCard } from "@/components/terratech/product-card"
import { TERRATECH_PRODUCTS } from "@/lib/design-system/terratech-products"

export default function TerratechProductsPage() {
  return (
    <>
      <TerratechHeader active="products" />

      <main className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <h1
              className="mb-2 font-bold text-foreground"
              style={{ fontSize: "var(--tt-text-3xl)" }}
            >
              Products
            </h1>
            <p
              className="max-w-2xl text-muted-foreground"
              style={{ fontSize: "var(--tt-text-base)" }}
            >
              Every card uses Alex&apos;s Button, Card, and token palette. Change{" "}
              <code className="rounded bg-muted px-1 text-xs">--tt-primary</code> in{" "}
              <code className="rounded bg-muted px-1 text-xs">theme.css</code> and
              watch prices and CTAs update live.
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TERRATECH_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
