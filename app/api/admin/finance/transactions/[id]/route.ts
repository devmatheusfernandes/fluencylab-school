import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb, adminStorage } from "@/lib/firebase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const update: Record<string, any> = {};
    if (body.type && ["income", "expense"].includes(String(body.type).toLowerCase())) {
      update.type = String(body.type).toLowerCase();
    }
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
      }
      update.amount = amount;
    }
    if (body.currency) update.currency = String(body.currency);
    if (body.date) {
      if (typeof body.date === "string") {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(body.date);
        if (m) {
          update.date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
        } else {
          update.date = new Date(body.date);
        }
      } else if (body.date instanceof Date) {
        update.date = body.date;
      } else {
        update.date = new Date();
      }
    }
    if (body.description !== undefined) update.description = String(body.description || "");
    if (body.method !== undefined) update.method = String(body.method || "");
    if (body.category !== undefined) update.category = String(body.category || "");
    update.updatedAt = new Date();

    await adminDb.collection("financeTransactions").doc(id).update(update);
    const doc = await adminDb.collection("financeTransactions").doc(id).get();
    return NextResponse.json({ id, ...doc.data() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["admin", "manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection("financeTransactions").doc(id);
    const doc = await docRef.get();
    const data = doc.data() as any | undefined;

    // Delete the transaction document
    await docRef.delete();

    // Delete attachment from storage if present
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (storageBucket && data?.attachmentPath) {
      try {
        const bucket = adminStorage.bucket(storageBucket);
        const fileRef = bucket.file(String(data.attachmentPath));
        await fileRef.delete();
      } catch (e) {
        // silent fail to avoid blocking deletion
        console.warn("[finance] Falha ao excluir anexo do Storage:", e);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
