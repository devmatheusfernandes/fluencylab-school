import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Verifica autenticação (idealmente checar se é admin/manager também)
    await requireAuth(); 
    
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const lessonId = formData.get("lessonId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 });
    }

    const max = 5 * 1024 * 1024; // 5MB
    if (file.size > max) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Validação de Magic Numbers (Imagens)
    const header = buffer.toString('hex', 0, 4);
    let isValidType = false;
    let ext = '';

    if (header.startsWith('ffd8ff')) { isValidType = true; ext = 'jpg'; } 
    else if (header === '89504e47') { isValidType = true; ext = 'png'; }
    else if (header === '47494638') { isValidType = true; ext = 'gif'; }
    else if (header === '52494646') { isValidType = true; ext = 'webp'; }

    if (!isValidType) {
        return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) return NextResponse.json({ error: "No bucket config" }, { status: 500 });

    const name = `${uuidv4()}.${ext}`;
    const bucket = adminStorage.bucket(storageBucket);
    
    // --- MUDANÇA AQUI: Caminho baseado na Lesson ---
    const fileRef = bucket.file(`lessons/${lessonId}/images/${name}`);

    await new Promise((resolve, reject) => {
      const stream = fileRef.createWriteStream({ 
        metadata: { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` } 
      });
      stream.on("finish", resolve);
      stream.on("error", reject);
      stream.end(buffer);
    });

    await fileRef.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    return NextResponse.json({ url });
  } catch (e: any) {
    console.error(e);
    const msg = e?.message || "Upload failed";
    const code = msg === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}