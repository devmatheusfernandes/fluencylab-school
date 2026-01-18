import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    await requireAuth();
    
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const lessonId = formData.get("lessonId") as string | null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!lessonId) return NextResponse.json({ error: "Lesson ID required" }, { status: 400 });

    const max = 10 * 1024 * 1024; // 10MB
    if (file.size > max) return NextResponse.json({ error: "File too large" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validação de Magic Numbers (Áudio)
    const header = buffer.toString('hex', 0, 4);
    let isValidType = false;
    let ext = 'mp3';

    if (header.startsWith('494433') || header.startsWith('fff')) { isValidType = true; ext = 'mp3'; }
    else if (header === '52494646') { isValidType = true; ext = 'wav'; }
    else if (header === '4f676753') { isValidType = true; ext = 'ogg'; }
    else if (header === '1a45dfa3') { isValidType = true; ext = 'webm'; }

    if (!isValidType) {
        return NextResponse.json({ error: "Invalid audio format" }, { status: 400 });
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) return NextResponse.json({ error: "No bucket" }, { status: 500 });

    const name = `${uuidv4()}.${ext}`;
    const bucket = adminStorage.bucket(storageBucket);
    
    // --- MUDANÇA AQUI: Caminho baseado na Lesson ---
    const fileRef = bucket.file(`lessons/${lessonId}/audio/${name}`);

    await new Promise((resolve, reject) => {
      const stream = fileRef.createWriteStream({ 
        metadata: { contentType: `audio/${ext}` } 
      });
      stream.on("finish", resolve);
      stream.on("error", reject);
      stream.end(buffer);
    });

    await fileRef.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    return NextResponse.json({ url });
  } catch (e: any) {
    const msg = e?.message || "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}