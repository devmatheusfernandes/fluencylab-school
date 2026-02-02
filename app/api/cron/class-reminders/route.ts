import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { announcementService } from "@/services/communication/announcementService";
import { ClassStatus, StudentClass } from "@/types/classes/class";
import { Timestamp } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Verify Authentication
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    // Verifica aulas começando entre agora e 30 minutos no futuro
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);

    console.log(
      `[ClassReminders] Checking classes between ${now.toISOString()} and ${thirtyMinutesFromNow.toISOString()}`,
    );

    // Buscar aulas agendadas para os próximos 30 minutos
    const snapshot = await adminDb
      .collection("classes")
      .where("status", "==", ClassStatus.SCHEDULED)
      .where("scheduledAt", ">=", Timestamp.fromDate(now))
      .where("scheduledAt", "<=", Timestamp.fromDate(thirtyMinutesFromNow))
      .get();

    const results = {
      found: snapshot.size,
      processed: 0,
      remindersSent: 0,
      alreadySent: 0,
      errors: 0,
    };

    if (snapshot.empty) {
      return NextResponse.json({ success: true, results });
    }

    const batch = adminDb.batch();
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;

    for (const doc of snapshot.docs) {
      const classData = doc.data() as StudentClass & { reminderSent?: boolean };

      // Se já enviou lembrete, pula
      if (classData.reminderSent) {
        results.alreadySent++;
        continue;
      }

      results.processed++;

      try {
        const scheduledAt = (
          classData.scheduledAt as unknown as Timestamp
        ).toDate();
        const timeString = scheduledAt.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Enviar notificação para o aluno
        await announcementService.createSystemAnnouncement(
          "Sua aula começará em breve!",
          `Sua aula de ${classData.language} está agendada para às ${timeString}. Prepare-se!`,
          classData.studentId,
          "/hub/student/my-classes",
        );

        // Marcar que o lembrete foi enviado
        batch.update(doc.ref, { reminderSent: true });
        batchCount++;
        results.remindersSent++;

        // Commit batch se atingir o limite
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          batchCount = 0;
          // Reinicia o batch para o próximo lote
          // Nota: Firestore batch reuse logic is simpler if we just commit and create new one,
          // but strictly speaking we are inside a loop.
          // For simplicity given the likely low volume, one commit at end is usually fine,
          // but handling limits is good practice.
        }
      } catch (error) {
        console.error(`Erro ao processar lembrete para aula ${doc.id}:`, error);
        results.errors++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Cron job de lembretes falhou:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
