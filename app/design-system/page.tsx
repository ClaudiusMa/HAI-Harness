import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Color palette component
function ColorPalette() {
  const colors = [
    { name: "Background", var: "--background", class: "bg-background" },
    { name: "Foreground", var: "--foreground", class: "bg-foreground" },
    { name: "Primary", var: "--primary", class: "bg-primary" },
    { name: "Primary Foreground", var: "--primary-foreground", class: "bg-primary-foreground" },
    { name: "Secondary", var: "--secondary", class: "bg-secondary" },
    { name: "Secondary Foreground", var: "--secondary-foreground", class: "bg-secondary-foreground" },
    { name: "Muted", var: "--muted", class: "bg-muted" },
    { name: "Muted Foreground", var: "--muted-foreground", class: "bg-muted-foreground" },
    { name: "Accent", var: "--accent", class: "bg-accent" },
    { name: "Accent Foreground", var: "--accent-foreground", class: "bg-accent-foreground" },
    { name: "Destructive", var: "--destructive", class: "bg-destructive" },
    { name: "Border", var: "--border", class: "bg-border" },
    { name: "Input", var: "--input", class: "bg-input" },
    { name: "Ring", var: "--ring", class: "bg-ring" },
    { name: "Card", var: "--card", class: "bg-card" },
    { name: "Card Foreground", var: "--card-foreground", class: "bg-card-foreground" },
    { name: "Popover", var: "--popover", class: "bg-popover" },
    { name: "Popover Foreground", var: "--popover-foreground", class: "bg-popover-foreground" },
  ]

  const chartColors = [
    { name: "Chart 1", var: "--chart-1", class: "bg-chart-1" },
    { name: "Chart 2", var: "--chart-2", class: "bg-chart-2" },
    { name: "Chart 3", var: "--chart-3", class: "bg-chart-3" },
    { name: "Chart 4", var: "--chart-4", class: "bg-chart-4" },
    { name: "Chart 5", var: "--chart-5", class: "bg-chart-5" },
  ]

  const sidebarColors = [
    { name: "Sidebar", var: "--sidebar", class: "bg-sidebar" },
    { name: "Sidebar Foreground", var: "--sidebar-foreground", class: "bg-sidebar-foreground" },
    { name: "Sidebar Primary", var: "--sidebar-primary", class: "bg-sidebar-primary" },
    { name: "Sidebar Primary Foreground", var: "--sidebar-primary-foreground", class: "bg-sidebar-primary-foreground" },
    { name: "Sidebar Accent", var: "--sidebar-accent", class: "bg-sidebar-accent" },
    { name: "Sidebar Accent Foreground", var: "--sidebar-accent-foreground", class: "bg-sidebar-accent-foreground" },
    { name: "Sidebar Border", var: "--sidebar-border", class: "bg-sidebar-border" },
    { name: "Sidebar Ring", var: "--sidebar-ring", class: "bg-sidebar-ring" },
  ]

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Core Colors</CardTitle>
          <CardDescription>
            The primary color palette used throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`h-16 w-full rounded-lg border ${color.class}`} />
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.var}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chart Colors</CardTitle>
          <CardDescription>
            Colors used for data visualization and charts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {chartColors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`h-16 w-full rounded-lg border ${color.class}`} />
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.var}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sidebar Colors</CardTitle>
          <CardDescription>
            Color palette specifically for sidebar components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sidebarColors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`h-16 w-full rounded-lg border ${color.class}`} />
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.var}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Typography showcase component
function Typography() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Typography</CardTitle>
        <CardDescription>
          Font families, sizes, and text styles used in the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Font Families */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Font Families</h3>
          <div className="grid gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Geist Sans (Default)</p>
              <p className="text-2xl font-sans">The quick brown fox jumps over the lazy dog</p>
              <p className="text-sm font-mono text-muted-foreground">font-family: var(--font-geist-sans)</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Geist Mono</p>
              <p className="text-2xl font-mono">The quick brown fox jumps over the lazy dog</p>
              <p className="text-sm font-mono text-muted-foreground">font-family: var(--font-geist-mono)</p>
            </div>
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Headings</h3>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>
              <code className="text-xs text-muted-foreground">text-4xl font-bold tracking-tight</code>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
              <code className="text-xs text-muted-foreground">text-3xl font-semibold tracking-tight</code>
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
              <code className="text-xs text-muted-foreground">text-2xl font-semibold tracking-tight</code>
            </div>
            <div>
              <h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
              <code className="text-xs text-muted-foreground">text-xl font-semibold tracking-tight</code>
            </div>
            <div>
              <h5 className="text-lg font-semibold">Heading 5</h5>
              <code className="text-xs text-muted-foreground">text-lg font-semibold</code>
            </div>
            <div>
              <h6 className="text-base font-semibold">Heading 6</h6>
              <code className="text-xs text-muted-foreground">text-base font-semibold</code>
            </div>
          </div>
        </div>

        {/* Body Text */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Body Text</h3>
          <div className="space-y-4">
            <div>
              <p className="text-lg">Large body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <code className="text-xs text-muted-foreground">text-lg</code>
            </div>
            <div>
              <p className="text-base">Default body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <code className="text-xs text-muted-foreground">text-base</code>
            </div>
            <div>
              <p className="text-sm">Small body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.</p>
              <code className="text-xs text-muted-foreground">text-sm</code>
            </div>
            <div>
              <p className="text-xs">Extra small text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <code className="text-xs text-muted-foreground">text-xs</code>
            </div>
          </div>
        </div>

        {/* Text Variants */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Text Variants</h3>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground">Muted text - Used for secondary information</p>
              <code className="text-xs text-muted-foreground">text-muted-foreground</code>
            </div>
            <div>
              <p className="font-medium">Medium weight text</p>
              <code className="text-xs text-muted-foreground">font-medium</code>
            </div>
            <div>
              <p className="font-semibold">Semibold text</p>
              <code className="text-xs text-muted-foreground">font-semibold</code>
            </div>
            <div>
              <p className="font-bold">Bold text</p>
              <code className="text-xs text-muted-foreground">font-bold</code>
            </div>
            <div>
              <p className="italic">Italic text</p>
              <code className="text-xs text-muted-foreground">italic</code>
            </div>
            <div>
              <p className="underline">Underlined text</p>
              <code className="text-xs text-muted-foreground">underline</code>
            </div>
            <div>
              <p className="line-through">Strikethrough text</p>
              <code className="text-xs text-muted-foreground">line-through</code>
            </div>
          </div>
        </div>

        {/* Code Text */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Code & Monospace</h3>
          <div className="space-y-4">
            <div>
              <code className="text-sm font-mono bg-muted px-1 py-0.5 rounded">Inline code</code>
              <p className="text-xs text-muted-foreground mt-1">font-mono bg-muted px-1 py-0.5 rounded</p>
            </div>
            <div>
              <pre className="text-sm font-mono bg-muted p-4 rounded-lg overflow-x-auto">
{`function example() {
  return "Hello, World!";
}`}
              </pre>
              <p className="text-xs text-muted-foreground mt-1">font-mono bg-muted p-4 rounded-lg</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Component showcase
function ComponentShowcase() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>
            All available button variants and sizes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Button Variants */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Variants</h4>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Sizes</h4>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">🎨</Button>
            </div>
          </div>

          {/* Button States */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">States</h4>
            <div className="flex flex-wrap gap-4">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>
            Input fields, labels, and form components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="example-input">Label</Label>
            <Input id="example-input" placeholder="Enter text here..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disabled-input">Disabled Input</Label>
            <Input id="disabled-input" placeholder="Disabled input" disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cards</CardTitle>
          <CardDescription>
            Card components with various layouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>
                  A basic card with title and description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This is the card content area where you can place any content.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card with Action</CardTitle>
                <CardDescription>
                  A card that includes an action button
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This card demonstrates how content and actions work together.
                </p>
                <Button size="sm">Action</Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Spacing and Layout showcase
function SpacingLayout() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spacing & Layout</CardTitle>
        <CardDescription>
          Spacing scale and layout patterns used in the design system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Spacing Scale */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Spacing Scale</h3>
          <div className="space-y-3">
            {[
              { name: "0.5", value: "2px", class: "w-0.5" },
              { name: "1", value: "4px", class: "w-1" },
              { name: "1.5", value: "6px", class: "w-1.5" },
              { name: "2", value: "8px", class: "w-2" },
              { name: "2.5", value: "10px", class: "w-2.5" },
              { name: "3", value: "12px", class: "w-3" },
              { name: "4", value: "16px", class: "w-4" },
              { name: "5", value: "20px", class: "w-5" },
              { name: "6", value: "24px", class: "w-6" },
              { name: "8", value: "32px", class: "w-8" },
              { name: "10", value: "40px", class: "w-10" },
              { name: "12", value: "48px", class: "w-12" },
              { name: "16", value: "64px", class: "w-16" },
              { name: "20", value: "80px", class: "w-20" },
              { name: "24", value: "96px", class: "w-24" },
            ].map((spacing) => (
              <div key={spacing.name} className="flex items-center gap-4">
                <div className={`h-4 bg-primary rounded ${spacing.class}`} />
                <span className="text-sm font-mono w-12">{spacing.name}</span>
                <span className="text-sm text-muted-foreground">{spacing.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Border Radius</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Small", class: "rounded-sm", value: "calc(var(--radius) - 4px)" },
              { name: "Medium", class: "rounded-md", value: "calc(var(--radius) - 2px)" },
              { name: "Large", class: "rounded-lg", value: "var(--radius)" },
              { name: "Extra Large", class: "rounded-xl", value: "calc(var(--radius) + 4px)" },
            ].map((radius) => (
              <div key={radius.name} className="space-y-2">
                <div className={`h-16 w-full bg-muted border ${radius.class}`} />
                <div>
                  <p className="text-sm font-medium">{radius.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{radius.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shadows */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shadows</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-16 w-full bg-background border rounded-lg shadow-sm" />
              <div>
                <p className="text-sm font-medium">Small</p>
                <p className="text-xs text-muted-foreground">shadow-sm</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-full bg-background border rounded-lg shadow" />
              <div>
                <p className="text-sm font-medium">Default</p>
                <p className="text-xs text-muted-foreground">shadow</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-16 w-full bg-background border rounded-lg shadow-lg" />
              <div>
                <p className="text-sm font-medium">Large</p>
                <p className="text-xs text-muted-foreground">shadow-lg</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive guide to Serif&apos;s visual design language, components, and patterns.
        </p>
      </div>

      {/* Color Palette */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Color Palette</h2>
        <ColorPalette />
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Typography</h2>
        <Typography />
      </section>

      {/* Components */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Components</h2>
        <ComponentShowcase />
      </section>

      {/* Spacing & Layout */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Spacing & Layout</h2>
        <SpacingLayout />
      </section>
    </div>
  )
}
