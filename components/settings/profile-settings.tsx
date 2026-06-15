"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "@supabase/supabase-js"

interface ProfileSettingsProps {
  user: User
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    displayName: user.user_metadata?.display_name || "",
    firstName: user.user_metadata?.first_name || "",
    lastName: user.user_metadata?.last_name || "",
    email: user.email || "",
    bio: user.user_metadata?.bio || ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call to update profile
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log("Profile updated:", formData)
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      displayName: user.user_metadata?.display_name || "",
      firstName: user.user_metadata?.first_name || "",
      lastName: user.user_metadata?.last_name || "",
      email: user.email || "",
      bio: user.user_metadata?.bio || ""
    })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and profile details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => handleInputChange("displayName", e.target.value)}
            disabled={!isEditing}
            placeholder="How others will see your name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            disabled={true} // Email changes require special verification
            className="bg-gray-50"
          />
          <p className="text-sm text-gray-500">
            Contact support to change your email address
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange("bio", e.target.value)}
            disabled={!isEditing}
            placeholder="Tell us about yourself..."
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
