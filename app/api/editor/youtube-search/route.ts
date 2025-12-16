import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    await requireAuth()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const maxResults = Math.min(Number(searchParams.get("maxResults") || 10), 25)
    const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY
    if (!key) {
      return NextResponse.json({ error: "missing_api_key" }, { status: 500 })
    }
    if (!q.trim()) {
      return NextResponse.json({ items: [] })
    }
    const params = new URLSearchParams({
      key,
      part: "snippet",
      type: "video",
      q,
      maxResults: String(maxResults),
      videoEmbeddable: "true",
      safeSearch: "none",
    })
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`)
    if (!r.ok) {
      return NextResponse.json({ error: "search_failed" }, { status: 502 })
    }
    const data = await r.json()
    const items = Array.isArray(data.items) ? data.items : []
    const mapped = items.map((it: any) => {
      const vid = it?.id?.videoId
      const sn = it?.snippet || {}
      const thumbs = sn?.thumbnails || {}
      const thumb =
        thumbs?.medium?.url ||
        thumbs?.high?.url ||
        thumbs?.default?.url ||
        null
      return {
        videoId: vid,
        title: sn?.title || "",
        channelTitle: sn?.channelTitle || "",
        thumbnail: thumb,
        publishedAt: sn?.publishedAt || null,
      }
    }).filter((x: any) => !!x.videoId)
    return NextResponse.json({ items: mapped })
  } catch (e: any) {
    const msg = e?.message || "error"
    const code = msg === "Authentication required" ? 401 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
