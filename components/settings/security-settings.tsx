"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SecuritySettings() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isEnabling2FA, setIsEnabling2FA] = useState(false)

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      alert("Password must be at least 8 characters long!")
      return
    }

    setIsChangingPassword(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log("Password changed successfully")
    alert("Password changed successfully!")
    
    // Reset form
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
    
    setIsChangingPassword(false)
  }

  const handleToggle2FA = async () => {
    setIsEnabling2FA(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setTwoFactorEnabled(!twoFactorEnabled)
    console.log(`2FA ${!twoFactorEnabled ? 'enabled' : 'disabled'}`)
    
    setIsEnabling2FA(false)
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    )
    
    if (confirmed) {
      const doubleConfirm = window.confirm(
        "This will permanently delete all your data. Are you absolutely sure?"
      )
      
      if (doubleConfirm) {
        console.log("Account deletion requested")
        alert("Account deletion request submitted. You will receive an email with further instructions.")
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your account security and authentication methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Change Password */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                required
                placeholder="Enter your current password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                required
                placeholder="Enter your new password"
                minLength={8}
              />
              <p className="text-sm text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                required
                placeholder="Confirm your new password"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isChangingPassword}
              className="w-full sm:w-auto"
            >
              {isChangingPassword ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${twoFactorEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <Button
              onClick={handleToggle2FA}
              disabled={isEnabling2FA}
              variant={twoFactorEnabled ? "outline" : "default"}
            >
              {isEnabling2FA 
                ? "Processing..." 
                : twoFactorEnabled 
                  ? "Disable 2FA" 
                  : "Enable 2FA"
              }
            </Button>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium">Active Sessions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-gray-500">Chrome on macOS • San Francisco, CA</p>
                <p className="text-xs text-gray-400">Last active: Now</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <p className="font-medium">Mobile App</p>
                <p className="text-sm text-gray-500">iPhone • San Francisco, CA</p>
                <p className="text-xs text-gray-400">Last active: 2 hours ago</p>
              </div>
              <Button variant="outline" size="sm">
                Revoke
              </Button>
            </div>
          </div>
          
          <Button variant="outline" className="w-full sm:w-auto">
            Sign Out All Other Sessions
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="space-y-4 border-t border-red-200 pt-6">
          <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-red-800">Delete Account</h4>
                <p className="text-sm text-red-600 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleDeleteAccount}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
