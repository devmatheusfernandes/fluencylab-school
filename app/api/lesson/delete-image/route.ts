import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth"; // Ajuste o import conforme seu projeto
import { adminStorage } from "@/lib/firebase/admin";

// Helper para extrair o caminho do objeto do URL
function extractObjectPath(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.host;
    
    // Caso 1: storage.googleapis.com
    if (host.includes("storage.googleapis.com")) {
      const [, ...rest] = u.pathname.split("/");
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      let path = rest.join("/");
      // Remove o nome do bucket se ele estiver no início do path
      if (bucketName && path.startsWith(bucketName)) {
        path = path.replace(`${bucketName}/`, "");
      }
      return path || null;
    }
    
    // Caso 2: firebasestorage.googleapis.com
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

    // --- SEGURANÇA ESPECÍFICA PARA IMAGENS ---
    // O arquivo DEVE começar com 'lessons/' e conter '/images/'
    // Exemplo válido: lessons/123xyz/images/foto.jpg
    if (!objectPath.startsWith("lessons/") || !objectPath.includes("/images/")) {
      return NextResponse.json({ error: "Forbidden: Invalid file path for image deletion" }, { status: 403 });
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) return NextResponse.json({ error: "No bucket config" }, { status: 500 });

    const bucket = adminStorage.bucket(storageBucket);
    const fileRef = bucket.file(objectPath);
    
    await fileRef.delete({ ignoreNotFound: true });
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Delete image error:", e);
    const msg = e?.message || "Delete failed";
    const code = msg === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}