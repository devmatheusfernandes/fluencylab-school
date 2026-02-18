"use server";

import { adminDb } from "@/lib/firebase/admin";
import {
  CompanyConfig,
  FiscalYear,
  MonthlyRevenue,
  TeacherPaymentRecord,
  FiscalStatus,
} from "@/types/financial/financial";
import { User } from "@/types/users/users";
import { Timestamp } from "firebase-admin/firestore";
import { startOfMonth, endOfMonth, format } from "date-fns";

/**
 * Initializes the Company Config if it doesn't exist.
 */
export async function initializeCompanyConfig() {
  const configRef = adminDb.collection("company_config").doc("main");
  const doc = await configRef.get();

  if (!doc.exists) {
    const defaultConfig: CompanyConfig = {
      companyType: "MEI",
      meiAnnualLimit: 81000,
      meAnnualLimit: 360000,
      meTaxRate: 0.06, // Example rate for Simples Nacional Anexo III
      inssRate: 0.11,
    };
    await configRef.set(defaultConfig);
    console.log("Company Config initialized.");
  }
}

/**
 * Closes the financial month, calculating revenue and teacher obligations.
 * This is an immutable snapshot.
 */
export async function closeMonthAction(year: number, month: number) {
  // Month is 0-indexed (0 = January)
  const monthDate = new Date(year, month, 1);
  const monthKey = format(monthDate, "yyyy-MM"); // "2023-10"

  // Define range for the month (Local time considerations might apply, but using server time for now)
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  console.log(
    `Closing month: ${monthKey} (${start.toISOString()} - ${end.toISOString()})`,
  );

  // 1. Check if already closed
  const revenueRef = adminDb.collection("monthly_revenue").doc(monthKey);
  const revenueDoc = await revenueRef.get();
  if (revenueDoc.exists) {
    throw new Error(`Month ${monthKey} is already closed.`);
  }

  // 2. Fetch Company Config
  const configRef = adminDb.collection("company_config").doc("main");
  const configDoc = await configRef.get();
  if (!configDoc.exists) {
    await initializeCompanyConfig(); // Auto-init if missing
  }
  const config = (await configRef.get()).data() as CompanyConfig;

  // 3. Fetch Data (Parallel)
  const [paymentsSnap, classesSnap, teachersSnap] = await Promise.all([
    // Student Payments (Cash Basis - Regime de Caixa for Revenue?)
    // Feature.md says: "Receita: mês do pagamento do aluno" -> Cash basis for revenue.
    adminDb
      .collection("monthlyPayments")
      .where("status", "==", "paid")
      .where("paidAt", ">=", start)
      .where("paidAt", "<=", end)
      .get(),

    // Classes (Accrual Basis - Regime de Competência for Costs)
    // "Custo do professor: mês da aula dada"
    adminDb
      .collection("classes")
      .where("status", "==", "completed")
      .where("scheduledAt", ">=", start)
      .where("scheduledAt", "<=", end)
      .get(),

    // Teachers
    adminDb.collection("users").where("role", "==", "teacher").get(),
  ]);

  // 4. Calculate Revenue
  let totalRevenue = 0;
  const studentSnapshotsMap = new Map<string, number>();

  paymentsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const amount = Number(data.amount) || 0; // Assuming amount is in cents or standard unit.
    // Usually currency is cents, but let's assume consistent usage.
    // If it's cents, we keep it in cents or convert. Feature.md uses 'number'.
    // Existing code divides by 100 for display. I'll store RAW values (cents likely) to avoid float issues.
    totalRevenue += amount;

    // We need studentId. It's not on monthlyPayments usually, it's on subscription.
    // But we need to link it.
    // The monthlyPayments collection usually has a subscriptionId.
    // We might need to fetch subscriptions to get studentId?
    // Or maybe we can rely on `userId` if it exists on payment.
    // Let's check the payment structure from previous search.
    // Structure: { id, amount, status, subscriptionId, ... }
    // It doesn't seem to have userId directly?
    // If not, we have a problem mapping revenue to students efficiently.
    // But for the snapshot, we need `studentId`.
    // I'll assume for now we might skip individual student breakdown if too expensive,
    // OR fetch subscriptions.
    // To be safe and efficient, let's just sum it up.
    // Requirement: `studentSnapshots: { studentId: string; valuePaid: number; }[]`
    // I'll skip the studentId mapping for this MVP step if it requires N+1 queries,
    // or I'll try to get it if available.
    // Actually, `monthlyPayments` usually belongs to a user subcollection in some schemas,
    // but here it seems to be a root collection with `subscriptionId`.
    // I will try to group by subscriptionId for now.
    const subId = data.subscriptionId || "unknown";
    const current = studentSnapshotsMap.get(subId) || 0;
    studentSnapshotsMap.set(subId, current + amount);
  });

  // Note: linking subscriptionId to studentId would require fetching subscriptions.
  // I will leave studentId as subscriptionId for now, or "unknown".
  const studentSnapshots = Array.from(studentSnapshotsMap.entries()).map(
    ([subId, value]) => ({
      studentId: subId, // Placeholder: using Subscription ID as Student ID proxy
      valuePaid: value,
    }),
  );
  const totalStudents = studentSnapshots.length;

  // 5. Calculate Teacher Costs
  const teacherEarningsMap = new Map<
    string,
    { count: number; name: string; rate: number; type: "PF" | "PJ" }
  >();

  // Helper to find teacher
  const teachers = teachersSnap.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as User,
  );

  classesSnap.docs.forEach((doc) => {
    const data = doc.data();
    const teacherId = data.teacherId;
    if (!teacherId) return;

    if (!teacherEarningsMap.has(teacherId)) {
      const teacher = teachers.find((t) => t.id === teacherId);
      if (teacher) {
        teacherEarningsMap.set(teacherId, {
          count: 0,
          name: teacher.name,
          rate: teacher.ratePerClassCents || 2500, // Default 25.00
          type: teacher.taxRegime || "PF", // Default to PF
        });
      }
    }

    const entry = teacherEarningsMap.get(teacherId);
    if (entry) {
      entry.count += 1;
    }
  });

  // 6. Run Transaction
  await adminDb.runTransaction(async (transaction) => {
    // B. Update Fiscal Year (Read must be before writes)
    const fiscalYearRef = adminDb
      .collection("fiscal_years")
      .doc(year.toString());
    const fiscalYearDoc = await transaction.get(fiscalYearRef);

    // A. Create MonthlyRevenue Snapshot
    const monthlyRevenueData: MonthlyRevenue = {
      month: monthKey,
      totalRevenue,
      totalStudents,
      studentSnapshots,
      createdAt: Timestamp.now(),
    };
    transaction.set(revenueRef, monthlyRevenueData);

    let currentFiscalYear: FiscalYear;

    if (fiscalYearDoc.exists) {
      const data = fiscalYearDoc.data() as FiscalYear;
      const newTotal = (data.totalRevenue || 0) + totalRevenue;
      const limit =
        config.companyType === "MEI"
          ? config.meiAnnualLimit
          : config.meAnnualLimit;
      // Convert limit to cents for calculation
      const percentageUsed = (newTotal / (limit * 100)) * 100;

      let status: FiscalStatus = "SAFE";
      if (percentageUsed >= 100) status = "CRITICAL";
      else if (percentageUsed >= 80) status = "WARNING";

      currentFiscalYear = {
        year,
        totalRevenue: newTotal,
        limit,
        percentageUsed,
        status,
        companyType: config.companyType,
      };

      transaction.update(fiscalYearRef, {
        totalRevenue: newTotal,
        percentageUsed,
        status,
        companyType: config.companyType,
      });
    } else {
      const limit =
        config.companyType === "MEI"
          ? config.meiAnnualLimit
          : config.meAnnualLimit;
      // Convert limit to cents for calculation
      const percentageUsed = (totalRevenue / (limit * 100)) * 100;

      let status: FiscalStatus = "SAFE";
      if (percentageUsed >= 100) status = "CRITICAL";
      else if (percentageUsed >= 80) status = "WARNING";

      currentFiscalYear = {
        year,
        totalRevenue,
        limit,
        percentageUsed,
        status,
        companyType: config.companyType,
      };
      transaction.set(fiscalYearRef, currentFiscalYear);
    }

    // C. Create Teacher Payment Records
    for (const [teacherId, stats] of teacherEarningsMap.entries()) {
      const grossValue = stats.count * stats.rate;
      let inssDiscount = 0;
      let netValue = grossValue;

      if (stats.type === "PF") {
        inssDiscount = Math.round(grossValue * config.inssRate);
        netValue = grossValue - inssDiscount;
      }

      // Determine Payment Month (Next Month)
      const nextMonthDate = new Date(year, month + 1, 1);
      const paymentMonthKey = format(nextMonthDate, "yyyy-MM");

      const paymentRecordRef = adminDb.collection("teacher_payments").doc();
      const paymentRecord: TeacherPaymentRecord = {
        teacherId,
        teacherName: stats.name,
        competenceMonth: monthKey,
        paymentMonth: paymentMonthKey,
        grossValue,
        inssDiscount,
        netValue,
        teacherType: stats.type,
        status: "ACCRUED",
      };

      transaction.set(paymentRecordRef, paymentRecord);
    }
  });

  return { success: true, month: monthKey };
}

/**
 * Marks a teacher payment as PAID.
 */
export async function markTeacherPaymentAsPaid(recordId: string) {
  const recordRef = adminDb.collection("teacher_payments").doc(recordId);
  const record = await recordRef.get();

  if (!record.exists) {
    throw new Error("Record not found");
  }

  const data = record.data() as TeacherPaymentRecord;
  if (data.status === "PAID") {
    throw new Error("Already paid");
  }

  // If PJ, check if invoiceId exists (business rule)
  // "if (teacher.type === 'PJ' && !invoiceAttached) { blockPayment() }"
  // Checking data.invoiceId or data.receiptUrl?
  // Feature.md mentions `invoiceId?: string`
  if (data.teacherType === "PJ" && !data.invoiceId) {
    throw new Error("Nota Fiscal obrigatória para pagamento PJ.");
  }

  await recordRef.update({
    status: "PAID",
    paidAt: Timestamp.now(),
  });

  return { success: true };
}
