import { adminDb } from "@/lib/firebase/admin";
import { Payment } from "@/types/financial/payments";
import { Timestamp } from "firebase-admin/firestore";

export class PaymentRepository {
  private collectionRef = adminDb.collection('payments');

  /**
   * Busca o histórico de pagamentos de um utilizador específico, ordenado por data.
   * @param userId - O ID do utilizador.
   * @returns Uma lista de pagamentos.
   */
  async findByUserId(userId: string): Promise<Payment[]> {
    const snapshot = await this.collectionRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Payment;
    });
  }
}
