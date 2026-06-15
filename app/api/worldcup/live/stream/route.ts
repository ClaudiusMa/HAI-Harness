import { fetchLiveSnapshot, getLiveUpdates, isFifaApiConfigured } from "@/lib/worldcup/fifa-api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const POLL_INTERVAL_MS = 15_000

export async function GET(request: Request) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Initial full snapshot
      try {
        const snapshot = await fetchLiveSnapshot()
        send("snapshot", snapshot)
      } catch {
        send("error", { message: "Failed to load snapshot" })
        controller.close()
        return
      }

      const interval = setInterval(async () => {
        if (request.signal.aborted) {
          clearInterval(interval)
          controller.close()
          return
        }

        try {
          if (isFifaApiConfigured()) {
            const snapshot = await fetchLiveSnapshot()
            send("snapshot", snapshot)
          } else {
            const updates = getLiveUpdates()
            if (updates.length > 0) {
              send("updates", updates)
            }
            send("heartbeat", { timestamp: new Date().toISOString() })
          }
        } catch {
        send("error", { message: "Stream update failed" })
      }
      }, POLL_INTERVAL_MS)

      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
