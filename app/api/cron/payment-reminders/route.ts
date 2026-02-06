import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { announcementService } from "@/services/communication/announcementService";
import { MonthlyPayment } from "@/types/financial/subscription";

export async function GET(req: NextRequest) {
  // 1. Verify Authentication
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const results = {
    reminders: 0,
    dueToday: 0,
    overdue: 0,
    errors: 0,
  };

  try {
    // Helper to get start/end of day timestamps
    const getDayRange = (date: Date) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    };

    // Common query builder
    const getPaymentsByDateRange = async (date: Date) => {
      const { start, end } = getDayRange(date);
      const snapshot = await adminDb
        .collection("monthlyPayments")
        .where("status", "in", ["pending", "available"])
        .where("dueDate", ">=", start)
        .where("dueDate", "<=", end)
        .get();
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as MonthlyPayment,
      );
    };

    // 2. Process "Due Tomorrow" Reminders
    const paymentsDueTomorrow = await getPaymentsByDateRange(tomorrow);
    for (const payment of paymentsDueTomorrow) {
      try {
        await announcementService.createSystemAnnouncement(
          "Lembrete de Pagamento",
          `Sua mensalidade de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payment.amount / 100)} vence amanhã via PIX.`,
          payment.userId,
          "/hub/financial", //TODO: ATUALIZAR O URL
        );
        results.reminders++;
      } catch (e) {
        console.error(`Error processing reminder for payment ${payment.id}`, e);
        results.errors++;
      }
    }

    // 3. Process "Due Today" Reminders
    const paymentsDueToday = await getPaymentsByDateRange(today);
    for (const payment of paymentsDueToday) {
      try {
        await announcementService.createSystemAnnouncement(
          "Pagamento Vence Hoje!",
          `Sua mensalidade vence hoje. Realize o pagamento via PIX para evitar atrasos.`,
          payment.userId,
          "/hub/financial", //TODO: ATUALIZAR O URL
        );
        results.dueToday++;
      } catch (e) {
        console.error(
          `Error processing due today for payment ${payment.id}`,
          e,
        );
        results.errors++;
      }
    }

    // 4. Process "Overdue (3 days)" Reminders
    const paymentsOverdue = await getPaymentsByDateRange(threeDaysAgo);
    for (const payment of paymentsOverdue) {
      try {
        await announcementService.createSystemAnnouncement(
          "Pagamento em Atraso",
          `Sua mensalidade está atrasada há 3 dias. Regularize para evitar suspensão.`,
          payment.userId,
          "/hub/financial", //TODO: ATUALIZAR O URL
        );
        results.overdue++;
      } catch (e) {
        console.error(`Error processing overdue for payment ${payment.id}`, e);
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Cron job failed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
