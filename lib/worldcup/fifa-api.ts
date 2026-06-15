import type { LiveUpdate, Match, TournamentSnapshot } from "@/types/worldcup"
import { buildTournamentSnapshot, SEED_MATCHES } from "./seed-data"

/**
 * FIFA live data adapter.
 *
 * Official FIFA betting/streaming data is distributed exclusively via Stats Perform
 * (Opta) to licensed partners. Set FIFA_API_URL + FIFA_API_KEY when you have access.
 *
 * @see https://www.statsperform.com/resource/fifa-betting-data-streaming-rights-distributor/
 */

interface FifaApiConfig {
  baseUrl: string
  apiKey: string
}

function getFifaConfig(): FifaApiConfig | null {
  const baseUrl = process.env.FIFA_API_URL
  const apiKey = process.env.FIFA_API_KEY
  if (!baseUrl || !apiKey) return null
  return { baseUrl, apiKey }
}

export function isFifaApiConfigured(): boolean {
  return getFifaConfig() !== null
}

/** In-memory state for mock live simulation */
let mockMatches: Match[] = structuredClone(SEED_MATCHES)
let simulationTick = 0

async function fetchFromFifaApi<T>(path: string): Promise<T> {
  const config = getFifaConfig()
  if (!config) throw new Error("FIFA API not configured")

  const res = await fetch(`${config.baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`FIFA API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

/** Advance mock live matches to simulate real-time updates */
function simulateLiveTick(): LiveUpdate[] {
  simulationTick += 1
  const updates: LiveUpdate[] = []
  const now = new Date().toISOString()

  mockMatches = mockMatches.map((match) => {
    if (match.status !== "live") return match

    const newMinute = (match.minute ?? 0) + 1
    const updated: Match = { ...match, minute: newMinute }

    // Simulate a goal every ~30 ticks on the USA match for demo
    if (match.id === "wc26-001" && simulationTick % 30 === 0 && match.homeScore !== null) {
      const newScore = match.homeScore + 1
      const event = {
        id: `sim-${simulationTick}`,
        minute: newMinute,
        type: "goal" as const,
        teamCode: "USA",
        playerName: "Gio Reyna",
        detail: "Simulated live update",
      }
      updated.homeScore = newScore
      updated.events = [...match.events, event]
      updates.push({
        type: "event",
        matchId: match.id,
        timestamp: now,
        payload: { homeScore: newScore, minute: newMinute, event },
      })
    } else {
      updates.push({
        type: "status",
        matchId: match.id,
        timestamp: now,
        payload: { minute: newMinute, status: "live" },
      })
    }

    if (newMinute >= 90) {
      updated.status = "finished"
      updates.push({
        type: "status",
        matchId: match.id,
        timestamp: now,
        payload: { status: "finished", minute: 90 },
      })
    }

    return updated
  })

  return updates
}

export async function fetchLiveSnapshot(): Promise<TournamentSnapshot> {
  if (isFifaApiConfigured()) {
    try {
      const data = await fetchFromFifaApi<TournamentSnapshot>("/worldcup/2026/live")
      return { ...data, dataSource: "fifa" }
    } catch (error) {
      console.error("[fifa-api] Falling back to mock data:", error)
    }
  }

  return buildTournamentSnapshot(mockMatches)
}

export async function fetchMatch(matchId: string): Promise<Match | null> {
  if (isFifaApiConfigured()) {
    try {
      return await fetchFromFifaApi<Match>(`/worldcup/2026/matches/${matchId}`)
    } catch (error) {
      console.error("[fifa-api] Match fetch failed:", error)
    }
  }

  return mockMatches.find((m) => m.id === matchId) ?? null
}

export function getLiveUpdates(): LiveUpdate[] {
  if (isFifaApiConfigured()) {
    return []
  }
  return simulateLiveTick()
}

export function resetMockState(): void {
  mockMatches = structuredClone(SEED_MATCHES)
  simulationTick = 0
}

export function getMockMatches(): Match[] {
  return mockMatches
}
