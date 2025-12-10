import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { adminStorage } from "@/lib/firebase/admin"

function extractObjectPath(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.host
    if (host.includes("storage.googleapis.com")) {
      const [, bucket, ...rest] = u.pathname.split("/")
      return rest.join("/") || null
    }
    if (host.includes("firebasestorage.googleapis.com")) {
      const parts = u.pathname.split("/")
      const oIndex = parts.indexOf("o")
      if (oIndex >= 0 && parts.length > oIndex + 1) {
        const obj = decodeURIComponent(parts[oIndex + 1])
        return obj
      }
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const url = body?.url as string
    if (!url) {
      return NextResponse.json({ error: "No url" }, { status: 400 })
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!storageBucket) {
      return NextResponse.json({ error: "No bucket" }, { status: 500 })
    }

    const objectPath = extractObjectPath(url)
    if (!objectPath) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 })
    }

    const expectedPrefix = `user-uploads/${user.id}/images/`
    if (!objectPath.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const bucket = adminStorage.bucket(storageBucket)
    const fileRef = bucket.file(objectPath)
    await fileRef.delete({ ignoreNotFound: true })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    const msg = e?.message || "Delete failed"
    const code = msg === "Authentication required" ? 401 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}

