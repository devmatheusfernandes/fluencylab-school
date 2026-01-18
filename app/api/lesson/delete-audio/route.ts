import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth"; // Ajuste o import conforme seu projeto
import { adminStorage } from "@/lib/firebase/admin";

// Helper duplicado para manter isolamento (ou mova para @/lib/utils)
function extractObjectPath(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.host;
    if (host.includes("storage.googleapis.com")) {
      const [, ...rest] = u.pathname.split("/");
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      let path = rest.join("/");
      if (bucketName && path.startsWith(bucketName)) {
        path = path.replace(`${bucketName}/`, "");
      }
      return path || null;
    }
    if (host.includes("firebasestorage.googleapis.com")) {
      const parts = u.pathname.split("/");
      const oIndex = parts.indexOf("o");
      if (oIndex >= 0 && parts.length > oIndex + 1) {
        return decodeURIComponent(parts[oIndex + 1]);
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // Opcional: Verificar permissão de admin/manager
    // if (!["admin", "manager"].includes(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const url = body?.url as string;

    if (!url) return NextResponse.json({ error: "No url provided" }, { status: 400 });

    const objectPath = extractObjectPath(url);
    if (!objectPath) return NextResponse.json({ error: "Invalid url format" }, { status: 400 });

    // --- SEGURANÇA ESPECÍFICA PARA ÁUDIO ---
    // O arquivo DEVE começar com 'lessons/' e conter '/audio/'
    // Exemplo válido: lessons/123xyz/audio/podcast.mp3
    if (!objectPath.startsWith("lessons/") || !objectPath.includes("/audio/")) {
      return NextResponse.json({ error: "Forbidden: Invalid file path for audio deletion" }, { status: 403 });
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) return NextResponse.json({ error: "No bucket config" }, { status: 500 });

    const bucket = adminStorage.bucket(storageBucket);
    const fileRef = bucket.file(objectPath);
    
    await fileRef.delete({ ignoreNotFound: true });
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Delete audio error:", e);
    const msg = e?.message || "Delete failed";
    const code = msg === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}