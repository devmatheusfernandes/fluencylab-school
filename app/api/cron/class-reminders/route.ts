import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { announcementService } from "@/services/communication/announcementService";
import { ClassStatus, StudentClass } from "@/types/classes/class";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    // Busca aulas nos próximos 60 minutos
    const sixtyMinutesFromNow = new Date(now.getTime() + 60 * 60000);

    const snapshot = await adminDb
      .collection("classes")
      .where("status", "==", ClassStatus.SCHEDULED)
      .where("scheduledAt", ">=", Timestamp.fromDate(now))
      .where("scheduledAt", "<=", Timestamp.fromDate(sixtyMinutesFromNow))
      .get();

    const results = { found: snapshot.size, remindersSent: 0, errors: 0 };

    if (snapshot.empty) return NextResponse.json({ success: true, results });

    const batch = adminDb.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const classData = doc.data() as StudentClass & { reminderSent?: boolean };

      if (classData.reminderSent) continue;

      try {
        const scheduledAt = (
          classData.scheduledAt as unknown as Timestamp
        ).toDate();
        const diffInMinutes = Math.floor(
          (scheduledAt.getTime() - now.getTime()) / 60000,
        );

        const timeString = scheduledAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // --- Lógica de Mensagem Personalizada ---
        let title = "Sua aula começará em breve!";
        let message = `Sua aula de ${classData.language} está agendada para às ${timeString}. Prepare-se!`;

        if (diffInMinutes <= 15) {
          title = "Sua aula começa em instantes! 🚨";
          message = `Sua aula de ${classData.language} começa em ${diffInMinutes} minutos (${timeString}). Já deixa tudo no jeito!`;
        }
        // ----------------------------------------

        await announcementService.createSystemAnnouncement(
          title,
          message,
          classData.studentId,
          "/hub/student/my-classes",
        );

        batch.update(doc.ref, { reminderSent: true });
        batchCount++;
        results.remindersSent++;

        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      } catch (error) {
        console.error(`[ClassCron] Erro na aula ${doc.id}:`, error);
        results.errors++;
      }
    }

    if (batchCount > 0) await batch.commit();

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}
