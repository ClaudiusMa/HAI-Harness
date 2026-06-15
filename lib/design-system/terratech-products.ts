import type { Product } from "@/components/terratech/product-card"

export const TERRATECH_PRODUCTS: Product[] = [
  {
    id: "solar-hub",
    name: "Solar Hub Mini",
    description: "Compact home energy monitor with repairable battery module.",
    price: "$149",
    badge: "Bestseller",
  },
  {
    id: "terra-phone",
    name: "TerraPhone One",
    description: "Modular smartphone with seven-year OS updates and open schematics.",
    price: "$699",
    badge: "New",
  },
  {
    id: "leaf-earbuds",
    name: "Leaf Earbuds",
    description: "Bioplastic shells, 40hr case, replaceable drivers.",
    price: "$129",
  },
  {
    id: "repair-kit",
    name: "Field Repair Kit",
    description: "Precision tools and spare fasteners for TerraTech devices.",
    price: "$49",
  },
  {
    id: "home-sensor",
    name: "Home Sensor Pack",
    description: "Air quality + energy usage — low-power mesh, no subscription.",
    price: "$89",
  },
  {
    id: "terra-tablet",
    name: "TerraTab 11",
    description: "Recycled-aluminum frame, e-ink mode, full shadcn UI kit inside.",
    price: "$449",
    badge: "Eco pick",
  },
]
