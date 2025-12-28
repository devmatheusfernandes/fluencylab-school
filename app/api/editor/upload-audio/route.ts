import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { adminStorage } from "@/lib/firebase/admin"
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 })
    }

    const max = 10 * 1024 * 1024 // Aumentado para 10MB para áudio
    if (file.size > max) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer);

    // Validate Magic Numbers (File Signature)
    const header = buffer.toString('hex', 0, 4);
    let isValidType = false;
    let ext = 'mp3'; // default

    // MP3 (ID3): 49 44 33
    if (header.startsWith('494433')) {
        isValidType = true;
        ext = 'mp3';
    }
    // MP3 (MPEG frame sync - FF FB, FF F3, etc) - simplificado
    else if (header.startsWith('fff')) {
        isValidType = true;
        ext = 'mp3';
    }
    // WAV: 52 49 46 46 (RIFF)
    else if (header === '52494646') {
        isValidType = true;
        ext = 'wav';
    }
    // OGG: 4F 67 67 53
    else if (header === '4f676753') {
        isValidType = true;
        ext = 'ogg';
    }
    // WebM: 1A 45 DF A3
    else if (header === '1a45dfa3') {
        isValidType = true;
        ext = 'webm';
    }

    if (!isValidType) {
        // Fallback: log warning but maybe allow if strict mode is off?
        // For security, we reject unknown signatures.
        return NextResponse.json({ error: "Invalid file content or unknown format" }, { status: 400 });
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!storageBucket) {
      return NextResponse.json({ error: "No bucket" }, { status: 500 })
    }

    const name = `${uuidv4()}.${ext}`
    const bucket = adminStorage.bucket(storageBucket)
    const fileRef = bucket.file(`user-uploads/${user.id}/audio/${name}`)

    await new Promise((resolve, reject) => {
      const stream = fileRef.createWriteStream({ metadata: { contentType: `audio/${ext}` } })
      stream.on("finish", resolve)
      stream.on("error", reject)
      stream.end(buffer)
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

