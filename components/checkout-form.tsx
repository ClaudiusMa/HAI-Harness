"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CheckoutFormData {
  firstName: string
  lastName: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  cardNumber: string
  expiry: string
  cvv: string
}

export default function CheckoutForm() {
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log("Checkout form submitted:", formData)
    alert("Order placed successfully!")
    
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>Complete your purchase</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shipping Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                placeholder="123 Main St"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  placeholder="New York"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  placeholder="NY"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input 
                  id="zip" 
                  placeholder="10001"
                  value={formData.zip}
                  onChange={(e) => handleInputChange("zip", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Payment Information</h3>
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input 
                id="cardNumber" 
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input 
                  id="expiry" 
                  placeholder="MM/YY"
                  value={formData.expiry}
                  onChange={(e) => handleInputChange("expiry", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input 
                  id="cvv" 
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Complete Purchase"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
