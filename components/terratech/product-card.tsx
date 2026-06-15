import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Product {
  id: string
  name: string
  description: string
  price: string
  badge?: string
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="mb-2 flex items-start justify-between gap-2">
          <CardTitle className="text-xl">{product.name}</CardTitle>
          {product.badge && (
            <Badge variant="secondary" className="shrink-0">
              {product.badge}
            </Badge>
          )}
        </div>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-2xl font-bold text-primary">{product.price}</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button className="flex-1 sm:flex-none">Add to cart</Button>
        <Button variant="outline" className="flex-1 sm:flex-none">
          Details
        </Button>
      </CardFooter>
    </Card>
  )
}
