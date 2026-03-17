import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
export const dynamic = "force-dynamic";

function extractObjectPathsFromContent(
  content: string,
  bucketName?: string
): string[] {
  const paths: string[] = [];
  if (typeof content !== "string" || content.length === 0) return paths;

  // storage.googleapis.com/{bucket}/{objectPath}
  const storageRegex =
    /https:\/\/storage\.googleapis\.com\/([^/]+)\/([^\s"'()<>]+)/g;
  let match1: RegExpExecArray | null;
  while ((match1 = storageRegex.exec(content)) !== null) {
    const [, bucket, objectPath] = match1;
    if (!bucketName || bucket === bucketName) {
      paths.push(objectPath);
    }
  }

  // firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedObjectPath}
  const fbRegex =
    /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^\s"'()<>?]+)/g;
  let match2: RegExpExecArray | null;
  while ((match2 = fbRegex.exec(content)) !== null) {
    const [, bucket, encoded] = match2;
    if (!bucketName || bucket === bucketName) {
      try {
        paths.push(decodeURIComponent(encoded));
      } catch {
        // ignore decode errors
      }
    }
  }

  return paths;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      return NextResponse.json(
        { error: "Bucket não configurado" },
        { status: 500 }
      );
    }
    const bucket = adminStorage.bucket(storageBucket);

    // Verifica imagens enviadas pelos usuários via Editor
    const [files] = await bucket.getFiles({ prefix: "user-uploads/" });

    const now = Date.now();
    const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

    // Considera apenas imagens com mais de 24h (carência) para evitar apagar uploads recentes
    const candidateFiles = files.filter((file) => {
      const metadata = file.metadata || {};
      const timeCreated = new Date(metadata.timeCreated as string).getTime();
      const isOld = now - timeCreated > GRACE_PERIOD_MS;
      const contentType = (metadata.contentType as string) || "";
      const isImage = contentType.startsWith("image/");
      return isOld && isImage;
    });

    if (candidateFiles.length === 0) {
      return NextResponse.json({
        message: "Nenhuma imagem antiga elegível encontrada.",
        deletedCount: 0,
      });
    }

    // Busca conteúdos salvos (ex.: cadernos) onde as imagens podem estar referenciadas
    const versionsSnapshot = await adminDb.collectionGroup("versions").get();

    // Extrai caminhos de objetos referenciados nos conteúdos
    const referenced = new Set<string>();
    versionsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.content) {
        const paths = extractObjectPathsFromContent(
          String(data.content),
          bucket.name
        );
        for (const p of paths) referenced.add(p);
      }
    });

    let deletedCount = 0;

    for (const file of candidateFiles) {
      const objectPath = file.name;

      if (!referenced.has(objectPath)) {
        await file.delete();
        deletedCount++;
        console.log(`🗑️ Imagem órfã deletada: ${objectPath}`);
      }
    }

    return NextResponse.json({
      message: "Limpeza concluída com sucesso",
      deletedCount,
    });
  } catch (error) {
    console.error("Erro na limpeza de imagens:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
