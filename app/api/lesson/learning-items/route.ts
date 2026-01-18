import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";
import { LearningItem } from "@/types/lesson";

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !["admin", "manager", "material-manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const snapshot = await adminDb
      .collection("learningItems")
      .orderBy("metadata.createdAt", "desc")
      .limit(500)
      .get();

    const items = snapshot.docs.map((doc) => {
      const data = doc.data() as LearningItem;
      return {
        id: doc.id,
        slug: data.slug || "",
        mainText: data.mainText || "",
        language: data.language || "en",
        level: data.level || "A1",
        type: data.type || "noun",
        meanings: data.meanings || [] // Útil para preview
      };
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching learning items:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao carregar itens" },
      { status: 500 }
    );
  }
}