// repositories/user.admin.repository.ts

import { adminDb } from "@/lib/firebase/admin";
import { User } from "@/types/users/users";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import admin from "firebase-admin";

/**
 * Utility function to convert Firebase Timestamps to JavaScript Dates
 * This ensures consistent serialization for React Server Components
 */
function serializeTimestamps(data: any): any {
  // Helper function to safely convert timestamp to date
  const safeToDate = (timestamp: any): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp.toDate === "function") return timestamp.toDate();
    // If it's a string or number, try to convert it to a Date
    if (typeof timestamp === "string" || typeof timestamp === "number") {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  };

  // Handle regularClassCredits timestamps
  let serializedCredits = data.regularClassCredits;
  if (serializedCredits && Array.isArray(serializedCredits)) {
    serializedCredits = serializedCredits.map((credit: any) => ({
      ...credit,
      grantedAt: safeToDate(credit.grantedAt) || new Date(),
      expiresAt: safeToDate(credit.expiresAt) || new Date(),
      usedAt: safeToDate(credit.usedAt),
    }));
  }

  return {
    ...data,
    createdAt: safeToDate(data.createdAt) || new Date(),
    updatedAt: safeToDate(data.updatedAt),
    birthDate: safeToDate(data.birthDate),
    onboardingCompletedAt: safeToDate(data.onboardingCompletedAt),
    contractStartDate: safeToDate(data.contractStartDate),
    deactivatedAt: safeToDate(data.deactivatedAt),
    subscriptionNextBilling: safeToDate(data.subscriptionNextBilling),
    subscriptionCreatedAt: safeToDate(data.subscriptionCreatedAt),
    subscriptionCanceledAt: safeToDate(data.subscriptionCanceledAt),
    regularClassCredits: serializedCredits,
  };
}

/**
 * Busca um usuário pelo ID usando o Firebase Admin SDK.
 * Esta função SÓ DEVE ser usada em ambientes de servidor (API Routes, Server Components).
 * @param userId - O ID do usuário a ser buscado.
 * @returns O objeto do usuário ou null se não for encontrado.
 */
export async function getUserById_Admin(userId: string): Promise<User | null> {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const data = userDoc.data()!;
    const serializedData = serializeTimestamps(data);

    return {
      id: userDoc.id,
      ...serializedData,
    } as unknown as User;
  } catch (error) {
    console.error("Erro ao buscar usuário com Admin SDK:", error);
    return null;
  }
}

export class UserAdminRepository {
  private usersCollection = adminDb.collection("users");

  async findUsersByRole(role: string): Promise<User[]> {
    const snapshot = await this.usersCollection.where("role", "==", role).get();
    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const serializedData = serializeTimestamps(data);

      return {
        id: doc.id,
        ...serializedData,
      } as unknown as User;
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    const docRef = this.usersCollection.doc(userId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data()!;
    const serializedData = serializeTimestamps(data);

    return {
      id: docSnap.id,
      ...serializedData,
    } as unknown as User;
  }

  async findUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];

    const snapshot = await this.usersCollection
      .where(admin.firestore.FieldPath.documentId(), "in", userIds)
      .get();

    if (snapshot.empty) return [];

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const serializedData = serializeTimestamps(data);

      return {
        id: doc.id,
        ...serializedData,
      } as unknown as User;
    });
  }

  /**
   * Lista todos os usuários com opções de filtro.
   * @param filters - Objeto opcional para filtrar por role ou status de atividade.
   * @returns Uma lista de usuários.
   */
  async listUsers(filters?: {
    role?: string;
    isActive?: boolean;
  }): Promise<User[]> {
    let query: admin.firestore.Query = this.usersCollection;

    if (filters?.role) {
      query = query.where("role", "==", filters.role);
    }
    if (filters?.isActive !== undefined) {
      query = query.where("isActive", "==", filters.isActive);
    }

    // Only add orderBy if no filters are applied to avoid index requirements
    const hasFilters = filters?.role || filters?.isActive !== undefined;
    if (!hasFilters) {
      query = query.orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();
    if (snapshot.empty) return [];

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      const serializedData = serializeTimestamps(data);

      return {
        id: doc.id,
        ...serializedData,
      } as unknown as User;
    });

    // Sort in memory if we have filters
    if (hasFilters) {
      users.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // desc order
      });
    }

    return users;
  }

  /**
   * Atualiza o status de um usuário (ativo/inativo).
   * @param userId - O ID do usuário a ser atualizado.
   * @param isActive - O novo status de atividade.
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    const userRef = this.usersCollection.doc(userId);
    await userRef.update({
      isActive,
      deactivatedAt: isActive
        ? FieldValue.delete()
        : FieldValue.serverTimestamp(),
    });
  }

  /**
   * Atualiza um documento de utilizador com novos dados.
   * @param userId - O ID do utilizador a ser atualizado.
   * @param data - Um objeto com os campos a serem atualizados.
   */
  async update(userId: string, data: Partial<User>): Promise<void> {
    const userRef = this.usersCollection.doc(userId);

    // Add updatedAt timestamp for all updates
    const dataToUpdate = {
      ...data,
      updatedAt: new Date(),
    };

    await userRef.update(dataToUpdate);
  }

  async countNewUsersThisMonth(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const snapshot = await this.usersCollection
      .where("createdAt", ">=", Timestamp.fromDate(startOfMonth))
      .count()
      .get();
    return snapshot.data().count;
  }

  async countActiveTeachers(): Promise<number> {
    const snapshot = await this.usersCollection
      .where("role", "==", "teacher")
      .where("isActive", "==", true)
      .count()
      .get();
    return snapshot.data().count;
  }

  /**
   * Cria um novo usuário no Firestore
   * @param userData - Dados do usuário a ser criado
   * @returns O ID do documento criado
   */
  async create(userData: Partial<User>): Promise<string> {
    const dataToCreate = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await this.usersCollection.add(dataToCreate);
    return docRef.id;
  }
}
