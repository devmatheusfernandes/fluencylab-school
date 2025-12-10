import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { adminStorage } from "@/lib/firebase/admin"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 })
    }

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    const max = 5 * 1024 * 1024
    if (file.size > max) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!storageBucket) {
      return NextResponse.json({ error: "No bucket" }, { status: 500 })
    }

    const ext = file.type.split("/")[1]
    const name = `img_${Date.now()}.${ext}`
    const bucket = adminStorage.bucket(storageBucket)
    const fileRef = bucket.file(`user-uploads/${user.id}/images/${name}`)

    const arrayBuffer = await file.arrayBuffer()
    await new Promise((resolve, reject) => {
      const stream = fileRef.createWriteStream({ metadata: { contentType: file.type } })
      stream.on("finish", resolve)
      stream.on("error", reject)
      stream.end(Buffer.from(arrayBuffer))
    })

    await fileRef.makePublic()
    const url = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`

    return NextResponse.json({ url })
  } catch (e: any) {
    const msg = e?.message || "Upload failed"
    const code = msg === "Authentication required" ? 401 : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}

