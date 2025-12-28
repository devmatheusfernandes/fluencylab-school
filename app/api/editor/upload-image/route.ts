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

    const max = 5 * 1024 * 1024
    if (file.size > max) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer);
    
    // Validate Magic Numbers (File Signature)
    const header = buffer.toString('hex', 0, 4);
    let isValidType = false;
    let ext = '';

    // JPEG: FF D8 FF
    if (header.startsWith('ffd8ff')) {
        isValidType = true;
        ext = 'jpg';
    } 
    // PNG: 89 50 4E 47
    else if (header === '89504e47') {
        isValidType = true;
        ext = 'png';
    }
    // GIF: 47 49 46 38
    else if (header === '47494638') {
        isValidType = true;
        ext = 'gif';
    }
    // WebP: RIFF....WEBP (complex check, simplified here just checking RIFF)
    // RIFF is 52 49 46 46
    else if (header === '52494646') {
        isValidType = true;
        ext = 'webp';
    }

    if (!isValidType) {
        return NextResponse.json({ error: "Invalid file content" }, { status: 400 });
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!storageBucket) {
      return NextResponse.json({ error: "No bucket" }, { status: 500 })
    }

    const name = `${uuidv4()}.${ext}`
    const bucket = adminStorage.bucket(storageBucket)
    const fileRef = bucket.file(`user-uploads/${user.id}/images/${name}`)

    await new Promise((resolve, reject) => {
      const stream = fileRef.createWriteStream({ metadata: { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` } })
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

