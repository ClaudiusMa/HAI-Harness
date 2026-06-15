"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function NewsletterDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Get updates
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join the TerraTech newsletter</DialogTitle>
          <DialogDescription>
            Sustainable product drops, repair guides, and design system updates from Alex.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="tt-name">Name</Label>
            <Input id="tt-name" placeholder="Eco enthusiast" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tt-email">Email</Label>
            <Input id="tt-email" type="email" placeholder="you@example.com" />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
            <Button type="submit">Subscribe</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
