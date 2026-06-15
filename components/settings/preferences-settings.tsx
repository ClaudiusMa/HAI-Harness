"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export default function PreferencesSettings() {
  const [preferences, setPreferences] = useState({
    theme: "light",
    language: "en",
    timezone: "UTC",
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    weeklyDigest: true
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleToggle = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handleSelectChange = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log("Preferences saved:", preferences)
    setIsSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Customize your experience and notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Theme</Label>
          <div className="flex gap-4">
            {["light", "dark", "system"].map((theme) => (
              <label key={theme} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value={theme}
                  checked={preferences.theme === theme}
                  onChange={(e) => handleSelectChange("theme", e.target.value)}
                  className="w-4 h-4 text-blue-600"
                  aria-label={`Select ${theme} theme`}
                />
                <span className="capitalize">{theme}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <Label htmlFor="language" className="text-base font-medium">Language</Label>
          <select
            id="language"
            value={preferences.language}
            onChange={(e) => handleSelectChange("language", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select your preferred language"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        {/* Timezone Selection */}
        <div className="space-y-3">
          <Label htmlFor="timezone" className="text-base font-medium">Timezone</Label>
          <select
            id="timezone"
            value={preferences.timezone}
            onChange={(e) => handleSelectChange("timezone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select your timezone"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>

        {/* Notification Preferences */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Notifications</Label>
          
          {[
            { key: "emailNotifications", label: "Email Notifications", description: "Receive important updates via email" },
            { key: "pushNotifications", label: "Push Notifications", description: "Get real-time notifications in your browser" },
            { key: "marketingEmails", label: "Marketing Emails", description: "Receive promotional content and offers" },
            { key: "weeklyDigest", label: "Weekly Digest", description: "Get a summary of your activity each week" }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={key}
                checked={preferences[key as keyof typeof preferences] as boolean}
                onChange={() => handleToggle(key)}
                className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-blue-500"
                aria-describedby={`${key}-description`}
              />
              <div className="flex-1">
                <Label htmlFor={key} className="cursor-pointer font-medium">
                  {label}
                </Label>
                <p id={`${key}-description`} className="text-sm text-gray-500 mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
