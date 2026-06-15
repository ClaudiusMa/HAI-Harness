import { NextResponse } from "next/server"
import { fetchLiveSnapshot } from "@/lib/worldcup/fifa-api"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const snapshot = await fetchLiveSnapshot()
    return NextResponse.json(snapshot)
  } catch (error) {
    console.error("[api/worldcup/live]", error)
    return NextResponse.json(
      { error: "Failed to fetch live tournament data" },
      { status: 500 }
    )
  }
}
