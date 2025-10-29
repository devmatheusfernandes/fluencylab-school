import { adminDb } from "@/lib/firebase/admin";
import { Vacation } from "@/types/time/vacation";
import { Timestamp, Transaction } from "firebase-admin/firestore";

const vacationsCollection = adminDb.collection("vacations");

export class VacationRepository {
  /**
   * Cria um novo período de férias no banco de dados.
   * @param vacationData - Os dados do período de férias.
   * @returns O período de férias criado com o ID.
   */
  async create(vacationData: Omit<Vacation, "id">): Promise<Vacation> {
    // Criamos uma cópia dos dados para poder modificá-la
    const dataToSave: any = {
      ...vacationData,
      // Garante que as datas sejam salvas no formato Timestamp
      startDate: Timestamp.fromDate(vacationData.startDate),
      endDate: Timestamp.fromDate(vacationData.endDate),
      createdAt: Timestamp.now(),
    };

    // Remove o campo 'reason' se ele for undefined, evitando o erro do Firestore
    if (dataToSave.reason === undefined) {
      delete dataToSave.reason;
    }

    const docRef = await vacationsCollection.add(dataToSave);

    return { id: docRef.id, ...vacationData };
  }

  /**
   * Cria um novo período de férias DENTRO de uma transação do Firestore.
   * @param transaction O objeto da transação.
   * @param vacationData Os dados do período de férias.
   */
  createWithTransaction(
    transaction: Transaction,
    vacationData: Omit<Vacation, "id">
  ): void {
    const newVacationRef = vacationsCollection.doc(); // Gera um ID automático

    const dataToSave: any = {
      ...vacationData,
      startDate: Timestamp.fromDate(vacationData.startDate),
      endDate: Timestamp.fromDate(vacationData.endDate),
      createdAt: Timestamp.now(), // Usamos o tempo do servidor para consistência
    };

    if (dataToSave.reason === undefined) {
      delete dataToSave.reason;
    }

    transaction.set(newVacationRef, dataToSave);
  }

  /**
   * Busca todos os períodos de férias de um professor para um ano específico.
   * @param teacherId O ID do professor.
   * @param year O ano a ser consultado.
   * @returns Uma lista de períodos de férias.
   */
  async findByTeacherAndYear(
    teacherId: string,
    year: number
  ): Promise<Vacation[]> {
    const startDate = new Date(year, 0, 1); // 1º de Janeiro do ano
    const endDate = new Date(year, 11, 31); // 31 de Dezembro do ano

    const snapshot = await vacationsCollection
      .where("teacherId", "==", teacherId)
      .where("startDate", ">=", Timestamp.fromDate(startDate))
      .where("endDate", "<=", Timestamp.fromDate(endDate))
      .get();

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Vacation;
    });
  }

  /**
   * Busca todos os períodos de férias de um professor, ordenados pelo mais recente.
   * @param teacherId O ID do professor.
   * @returns Uma lista de períodos de férias.
   */
  async findAllByTeacherId(teacherId: string): Promise<Vacation[]> {
    const snapshot = await vacationsCollection
      .where("teacherId", "==", teacherId)
      .orderBy("startDate", "desc")
      .get();
    console.log(
      `[REPOSITÓRIO vacations] A consulta para o professor ${teacherId} encontrou ${snapshot.docs.length} documentos.`
    );

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: (data.startDate as Timestamp).toDate(),
        endDate: (data.endDate as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as Vacation;
    });
  }

  /**
   * Apaga um período de férias pelo seu ID.
   * @param vacationId O ID do documento de férias.
   */
  async delete(vacationId: string): Promise<void> {
    await vacationsCollection.doc(vacationId).delete();
  }
}
