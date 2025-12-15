import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { Readable } from "stream";

function arrayBufferToStream(arrayBuffer: ArrayBuffer): Readable {
  const buffer = Buffer.from(arrayBuffer);
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo inválido. Use JPEG, JPG, PNG ou PDF." },
        { status: 400 }
      );
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Arquivo maior que 5MB. Tamanho: ${(file.size / (1024 * 1024)).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Storage bucket
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      return NextResponse.json({ error: "Storage não configurado." }, { status: 500 });
    }
    const bucket = adminStorage.bucket(storageBucket);

    // Build path and upload
    const ext = file.type.split("/")[1] || "bin";
    const fileName = `attachment_${Date.now()}.${ext}`;
    const attachmentPath = `finance/transactions/${id}/${fileName}`;
    const fileRef = bucket.file(attachmentPath);

    const arrayBuffer = await file.arrayBuffer();
    const stream = arrayBufferToStream(arrayBuffer);
    await new Promise((resolve, reject) => {
      const writeStream = fileRef.createWriteStream({
        metadata: { contentType: file.type },
      });
      stream.pipe(writeStream).on("finish", resolve).on("error", reject);
    });

    await fileRef.makePublic();
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileRef.name}`;

    // Update transaction document with attachment info
    await adminDb
      .collection("financeTransactions")
      .doc(id)
      .set(
        {
          attachmentUrl: downloadURL,
          attachmentContentType: file.type,
          attachmentFileName: fileName,
          attachmentPath,
          updatedAt: new Date(),
        },
        { merge: true }
      );

    return NextResponse.json({
      url: downloadURL,
      contentType: file.type,
      fileName,
      path: attachmentPath,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

