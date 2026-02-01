// repositories/availabilityRepository.ts
import { adminDb } from "@/lib/firebase/admin";
import {
  AvailabilityException,
  AvailabilitySlot,
} from "@/types/time/availability";
import { FieldValue, Timestamp, Transaction } from "firebase-admin/firestore";

function normalizeTimestamp(dateField: any): Date | undefined {
  if (!dateField) return undefined;
  if (typeof dateField.toDate === "function") {
    return dateField.toDate();
  }
  return new Date(dateField);
}

export class AvailabilityRepository {
  private availabilitiesRef = adminDb.collection("availabilities");
  private exceptionsRef = adminDb.collection("availabilityExceptions");

  async create(
    slotData: Omit<AvailabilitySlot, "id">
  ): Promise<AvailabilitySlot> {
    // 1. Começamos com os dados que sempre existem
    const dataToSave: any = {
      ...slotData,
      startDate: Timestamp.fromDate(new Date(slotData.startDate)),
      createdAt: FieldValue.serverTimestamp(),
    };

    // 2. Se a propriedade 'repeating' existir no objeto recebido, nós a processamos.
    // Se não existir, ela simplesmente não será adicionada ao 'dataToSave'.
    if (slotData.repeating) {
      dataToSave.repeating = {
        ...slotData.repeating,
        endDate: slotData.repeating.endDate
          ? Timestamp.fromDate(new Date(slotData.repeating.endDate))
          : undefined,
      };
    }

    // Opcional mas recomendado: limpa qualquer 'undefined' que o 'endDate' possa ter criado
    if (dataToSave.repeating && dataToSave.repeating.endDate === undefined) {
      delete dataToSave.repeating.endDate;
    }

    // 3. Agora, 'dataToSave' está limpo e pronto para ser salvo.
    const docRef = await this.availabilitiesRef.add(dataToSave);
    return { id: docRef.id, ...slotData };
  }

  async findById(slotId: string): Promise<AvailabilitySlot | null> {
    const doc = await this.availabilitiesRef.doc(slotId).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: normalizeTimestamp(data?.startDate)!,
      repeating: data?.repeating
        ? {
            ...data.repeating,
            endDate: normalizeTimestamp(data.repeating.endDate),
          }
        : undefined,
    } as AvailabilitySlot;
  }

  async findByTeacherId(teacherId: string): Promise<AvailabilitySlot[]> {
    const snapshot = await this.availabilitiesRef
      .where("teacherId", "==", teacherId)
      .get();
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: normalizeTimestamp(data.startDate)!,
        repeating: data.repeating
          ? {
              ...data.repeating,
              endDate: normalizeTimestamp(data.repeating.endDate),
            }
          : undefined,
      } as AvailabilitySlot;
    });
  }

  async deleteById(slotId: string): Promise<void> {
    await this.availabilitiesRef.doc(slotId).delete();
  }

  async update(slotId: string, data: object): Promise<void> {
    await this.availabilitiesRef.doc(slotId).update(data);
  }

  async createException(
    slotId: string,
    teacherId: string,
    exceptionDate: Date
  ): Promise<void> {
    await this.exceptionsRef.add({
      originalSlotId: slotId,
      teacherId: teacherId,
      date: Timestamp.fromDate(exceptionDate),
    });
  }

  async findExceptionsByTeacherId(
    teacherId: string
  ): Promise<AvailabilityException[]> {
    const q = this.exceptionsRef.where("teacherId", "==", teacherId);
    const snapshot = await q.get();
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
      } as AvailabilityException;
    });
  }

  createExceptionWithTransaction(
    transaction: Transaction,
    slotId: string,
    teacherId: string,
    exceptionDate: Date
  ) {
    const newExceptionRef = this.exceptionsRef.doc();
    transaction.set(newExceptionRef, {
      originalSlotId: slotId,
      teacherId: teacherId,
      date: Timestamp.fromDate(exceptionDate),
    });
  }

  async findAndDeleteException(
    originalSlotId: string,
    exceptionDate: Date
  ): Promise<void> {
    // Define o início e o fim do dia da exceção
    const startOfDay = new Date(exceptionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(exceptionDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Converte para Timestamps do Firestore
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    // Faz uma busca por intervalo de data
    const q = this.exceptionsRef
      .where("originalSlotId", "==", originalSlotId)
      .where("date", ">=", startTimestamp)
      .where("date", "<=", endTimestamp);

    const snapshot = await q.get();

    if (!snapshot.empty) {
      const batch = adminDb.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      //console.log(`Exceção para o slot ${originalSlotId} na data ${exceptionDate.toDateString()} foi removida.`);
    } else {
      //console.warn(`Nenhuma exceção encontrada para o slot ${originalSlotId} na data ${exceptionDate.toDateString()}`);
    }
  }
}
