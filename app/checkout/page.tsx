import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CheckoutForm from "@/components/checkout-form"

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your items before checkout</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Sample Product</span>
                  <span className="font-medium">$29.99</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <span className="font-medium">$5.99</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="font-medium">$2.88</span>
                </div>
                <div className="flex justify-between items-center py-2 font-semibold text-lg">
                  <span>Total</span>
                  <span>$38.86</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="order-1 lg:order-2">
            <CheckoutForm />
          </div>
        </div>
      </div>
    </div>
  )
}
