import { adminDb } from "@/lib/firebase/admin";
import { Payment } from "@/types/financial/payments";
import { Timestamp } from "firebase-admin/firestore";

export class PaymentRepository {
  private collectionRef = adminDb.collection("payments");

  /**
   * Busca o histórico de pagamentos de um utilizador específico, ordenado por data.
   * @param userId - O ID do utilizador.
   * @returns Uma lista de pagamentos.
   */
  async findByUserId(userId: string): Promise<Payment[]> {
    const snapshot = await this.collectionRef
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Payment;
    });
  }

  /**
   * Calcula a receita total em um intervalo de datas.
   * Considera apenas pagamentos com status "completed".
   */
  async getRevenueInPeriod(startDate: Date, endDate: Date): Promise<number> {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const snapshot = await this.collectionRef
      .where("status", "==", "completed")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    let totalRevenue = 0;
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Assume que amount está em centavos ou unidade base, dependendo da implementação.
      // Baseado no tipo 'number', vou assumir que é o valor real (float) ou centavos.
      // Se for centavos, deve ser dividido na exibição.
      // Vou somar o valor cru aqui.
      totalRevenue += data.amount || 0;
    });

    return totalRevenue;
  }

  /**
   * Busca dados de receita para os últimos 6 meses para gráficos.
   * Retorna um array de objetos { month: string, revenue: number }.
   */
  async getRevenueLast6Months(): Promise<{ month: string; revenue: number }[]> {
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1); // 1º dia de 6 meses atrás

    // Ajusta para o final do dia de hoje
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    const startTimestamp = Timestamp.fromDate(sixMonthsAgo);
    const endTimestamp = Timestamp.fromDate(endOfToday);

    const snapshot = await this.collectionRef
      .where("status", "==", "completed")
      .where("createdAt", ">=", startTimestamp)
      .where("createdAt", "<=", endTimestamp)
      .orderBy("createdAt", "asc")
      .get();

    const revenueMap = new Map<string, number>();

    // Inicializa o mapa com os últimos 6 meses para garantir que meses sem receita apareçam como 0
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.toLocaleString("default", { month: "short" }); // "Jan", "Feb"
      revenueMap.set(monthKey, 0);
    }

    if (!snapshot.empty) {
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const date = (data.createdAt as Timestamp).toDate();
        const monthKey = date.toLocaleString("default", { month: "short" });

        const currentAmount = revenueMap.get(monthKey) || 0;
        revenueMap.set(monthKey, currentAmount + (data.amount || 0));
      });
    }

    // Converte o mapa para array e inverte para ordem cronológica (mais antigo -> mais recente)
    // A iteração do Map preserva ordem de inserção, mas nossa inicialização foi decrescente.
    // Vamos reconstruir na ordem correta.
    const result: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = d.toLocaleString("default", { month: "short" });
      result.push({
        month: monthKey,
        revenue: revenueMap.get(monthKey) || 0,
      });
    }

    return result;
  }
}

export const paymentRepository = new PaymentRepository();
