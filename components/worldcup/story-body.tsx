interface StoryBodyProps {
  body: string
}

/** Renders Axios-style markdown-lite body with **bold** support */
export function StoryBody({ body }: StoryBodyProps) {
  const paragraphs = body.split("\n\n")

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="text-base leading-relaxed text-white/80">
          {renderInlineBold(paragraph)}
        </p>
      ))}
    </div>
  )
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}
