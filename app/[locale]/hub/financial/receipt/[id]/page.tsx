import { subscriptionService } from "@/services/subscriptionService";
import { ReceiptView } from "./components/receipt-view";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { adminDb } from "@/lib/firebase/admin";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function ReceiptPage({ params }: PageProps) {
  const { id } = await params;
  const payment = await subscriptionService.getPaymentById(id);

  if (!payment) {
    notFound();
  }

  // Fetch user details for the receipt
  const userDoc = await adminDb.collection("users").doc(payment.userId).get();
  const userData = userDoc.data();

  const receiptData = {
    id: payment.id,
    amount: payment.amount,
    paymentDate: payment.paidAt || payment.updatedAt || new Date(),
    paymentMethod: payment.paymentMethod,
    description: payment.description,
    studentName: userData?.name || "Aluno",
    studentEmail: userData?.email || "",
  };

  return <ReceiptView payment={receiptData} />;
}
