import { subscriptionService } from "@/services/financial/subscriptionService";
import { ReceiptView } from "@/components/financial/ReceiptViewer";
import { notFound } from "next/navigation";
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
    guardianName: userData?.guardian?.name || "Professor",
    birthDate: userData?.birthDate || "",
  };

  return <ReceiptView payment={receiptData} />;
}
