import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { adminDb } from "@/lib/firebase/admin";
import { LearningStructure } from "@/types/lesson";

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !["admin", "manager", "material-manager"].includes(session.user.role || "")) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const snapshot = await adminDb
      .collection("learningStructures")
      .orderBy("metadata.createdAt", "desc")
      .limit(500)
      .get();

    const items = snapshot.docs.map((doc) => {
      const data = doc.data() as LearningStructure;
      return {
        id: doc.id,
        type: data.type,
        level: data.level,
        language: data.language,
        sentences: data.sentences || [] // Envia as sentenças para o frontend visualizar
      };
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Error fetching learning structures:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao carregar estruturas" },
      { status: 500 }
    );
  }
}