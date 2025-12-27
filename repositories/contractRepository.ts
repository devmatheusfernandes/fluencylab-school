import { adminDb } from "@/lib/firebase/admin";
import {
  ContractStatus,
  ContractLog,
  ContractValidationError,
} from "@/types/contract";
export class ContractRepository {
  private readonly USERS_COLLECTION = "users";
  private readonly CONTRACTS_SUBCOLLECTION = "Contratos";
  private readonly CONTRACT_VALIDITY_MONTHS = 6;

  /**
   * Get contract status for a user
   */
  async getContractStatus(userId: string): Promise<ContractStatus | null> {
    try {
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        throw new Error("User not found");
      }

      const userData = userSnap.data();
      return userData?.ContratosAssinados || null;
    } catch (error) {
      console.error("Error fetching contract status:", error);
      throw error;
    }
  }

  /**
   * Get contract log by ID
   */
  async getContractLog(
    userId: string,
    logId: string
  ): Promise<ContractLog | null> {
    try {
      const logRef = adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection(this.CONTRACTS_SUBCOLLECTION)
        .doc(logId);
      const logSnap = await logRef.get();

      if (!logSnap.exists) {
        return null;
      }

      return logSnap.data() as ContractLog;
    } catch (error) {
      console.error("Error fetching contract log:", error);
      throw error;
    }
  }

  /**
   * Create a new contract log
   */
  async createContractLog(
    userId: string,
    contractData: Omit<ContractLog, "logID">
  ): Promise<string> {
    try {
      const contractRef = adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection(this.CONTRACTS_SUBCOLLECTION)
        .doc();
      const logId = contractRef.id;

      const contractLog: ContractLog = {
        ...contractData,
        logID: logId,
        viewedAt: new Date().toISOString(),
        signedAt: new Date().toISOString(),
        isValid: true,
        expiresAt: this.calculateExpirationDate(),
        contractVersion: "1.0",
      };

      await contractRef.set(contractLog);
      return logId;
    } catch (error) {
      console.error("Error creating contract log:", error);
      throw error;
    }
  }

  /**
   * Update contract status in user document
   */
  async updateContractStatus(
    userId: string,
    status: ContractStatus
  ): Promise<void> {
    try {
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      await userRef.update({
        ContratosAssinados: {
          ...status,
          isValid: this.isContractValid(status.signedAt),
          expiresAt: status.signedAt
            ? this.calculateExpirationDate(status.signedAt)
            : null,
        },
      });
    } catch (error) {
      console.error("Error updating contract status:", error);
      throw error;
    }
  }

  /**
   * Sign contract as admin
   */
  async signContractAsAdmin(
    userId: string,
    logId: string,
    adminData: {
      name: string;
      cpf: string;
      ip?: string;
      browser?: string;
    }
  ): Promise<void> {
    try {
      const logRef = adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection(this.CONTRACTS_SUBCOLLECTION)
        .doc(logId);
      const adminSignedAt = new Date().toISOString();

      // Update contract log
      await logRef.update({
        adminSigned: true,
        adminName: adminData.name,
        adminCPF: adminData.cpf,
        adminIP: adminData.ip || "N/A",
        adminBrowser: adminData.browser || "N/A",
        adminSignedAt,
      });

      // Update user contract status
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      await userRef.update({
        "ContratosAssinados.signedByAdmin": true,
        "ContratosAssinados.adminSignedAt": adminSignedAt,
      });
    } catch (error) {
      console.error("Error signing contract as admin:", error);
      throw error;
    }
  }

  /**
   * Invalidate expired contract
   */
  async invalidateContract(userId: string): Promise<void> {
    try {
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      const invalidatedStatus: ContractStatus = {
        signed: false,
        signedByAdmin: false,
        logId: undefined,
        signedAt: undefined,
        adminSignedAt: undefined,
        isValid: false,
        expiresAt: undefined,
        contractVersion: undefined,
      };

      await userRef.update({ ContratosAssinados: invalidatedStatus });
    } catch (error) {
      console.error("Error invalidating contract:", error);
      throw error;
    }
  }

  /**
   * Get all contract logs for a user
   */
  async getUserContractLogs(
    userId: string,
    limitCount: number = 10
  ): Promise<ContractLog[]> {
    try {
      const contractsRef = adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection(this.CONTRACTS_SUBCOLLECTION);
      const querySnapshot = await contractsRef
        .orderBy("signedAt", "desc")
        .limit(limitCount)
        .get();

      return querySnapshot.docs.map((doc) => doc.data() as ContractLog);
    } catch (error) {
      console.error("Error fetching user contract logs:", error);
      throw error;
    }
  }

  /**
   * Get users with pending contracts (admin function)
   */
  async getUsersWithPendingContracts(): Promise<
    { userId: string; status: ContractStatus }[]
  > {
    try {
      const usersRef = adminDb.collection(this.USERS_COLLECTION);
      const querySnapshot = await usersRef
        .where("ContratosAssinados.signed", "==", true)
        .where("ContratosAssinados.signedByAdmin", "==", false)
        .get();

      return querySnapshot.docs.map((doc) => ({
        userId: doc.id,
        status: doc.data().ContratosAssinados as ContractStatus,
      }));
    } catch (error) {
      console.error("Error fetching pending contracts:", error);
      throw error;
    }
  }

  /**
   * Check if contract is valid (not expired)
   */
  private isContractValid(signedAt?: string): boolean {
    if (!signedAt) return false;

    const signedDate = new Date(signedAt);
    const currentDate = new Date();
    const monthsDiff =
      (currentDate.getFullYear() - signedDate.getFullYear()) * 12 +
      (currentDate.getMonth() - signedDate.getMonth());

    return monthsDiff < this.CONTRACT_VALIDITY_MONTHS;
  }

  /**
   * Calculate contract expiration date
   */
  private calculateExpirationDate(fromDate?: string): string {
    const baseDate = fromDate ? new Date(fromDate) : new Date();
    const expirationDate = new Date(baseDate);
    expirationDate.setMonth(
      expirationDate.getMonth() + this.CONTRACT_VALIDITY_MONTHS
    );
    return expirationDate.toISOString();
  }

  /**
   * Validate contract data before saving
   */
  validateContractData(
    contractData: Partial<ContractLog>
  ): ContractValidationError[] {
    const errors: ContractValidationError[] = [];

    if (!contractData.name || contractData.name.trim().length < 2) {
      errors.push({
        field: "name",
        message: "Nome deve ter pelo menos 2 caracteres",
        code: "INVALID_NAME",
      });
    }

    if (!contractData.cpf) {
      errors.push({
        field: "cpf",
        message: "CPF/CNPJ inválido",
        code: "INVALID_DOCUMENT",
      });
    } else {
      const cleanDoc = contractData.cpf.replace(/[^\d]+/g, "");
      if (cleanDoc.length === 11) {
        if (!this.validateCPF(cleanDoc)) {
          errors.push({
            field: "cpf",
            message: "CPF inválido",
            code: "INVALID_CPF",
          });
        }
      } else if (cleanDoc.length === 14) {
        if (!this.validateCNPJ(cleanDoc)) {
          errors.push({
            field: "cpf",
            message: "CNPJ inválido",
            code: "INVALID_CNPJ",
          });
        }
      } else {
        errors.push({
          field: "cpf",
          message: "CPF/CNPJ inválido",
          code: "INVALID_DOCUMENT",
        });
      }
    }

    if (!contractData.birthDate || !this.isAdult(contractData.birthDate)) {
      errors.push({
        field: "birthDate",
        message: "É necessário ter 18 anos ou mais",
        code: "UNDERAGE",
      });
    }

    if (!contractData.address || contractData.address.trim().length < 5) {
      errors.push({
        field: "address",
        message: "Endereço deve ter pelo menos 5 caracteres",
        code: "INVALID_ADDRESS",
      });
    }

    if (!contractData.city || contractData.city.trim().length < 2) {
      errors.push({
        field: "city",
        message: "Cidade deve ter pelo menos 2 caracteres",
        code: "INVALID_CITY",
      });
    }

    if (!contractData.state || contractData.state.trim().length < 2) {
      errors.push({
        field: "state",
        message: "Estado deve ter pelo menos 2 caracteres",
        code: "INVALID_STATE",
      });
    }

    if (!contractData.zipCode || contractData.zipCode.trim().length < 8) {
      errors.push({
        field: "zipCode",
        message: "CEP deve ter 8 dígitos",
        code: "INVALID_ZIPCODE",
      });
    }

    return errors;
  }

  /**
   * Validate CPF format and checksum
   */
  private validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g, "");

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;

    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  /**
   * Validate CNPJ format and checksum
   */
  private validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]+/g, "");

    if (cnpj.length !== 14) return false;

    // Eliminate known invalid CNPJs
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }

  /**
   * Check if person is 18 years or older
   */
  private isAdult(birthDateString: string): boolean {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 18;
  }

  /**
   * Update contract status with renewal information
   */
  async updateContractForRenewal(
    userId: string,
    renewalData: {
      newExpirationDate: string;
      renewalCount: number;
      lastRenewalAt: string;
      autoRenewal: boolean;
    }
  ): Promise<void> {
    try {
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      await userRef.update({
        "ContratosAssinados.expiresAt": renewalData.newExpirationDate,
        "ContratosAssinados.renewalCount": renewalData.renewalCount,
        "ContratosAssinados.lastRenewalAt": renewalData.lastRenewalAt,
        "ContratosAssinados.autoRenewal": renewalData.autoRenewal,
        "ContratosAssinados.isValid": true,
      });
    } catch (error) {
      console.error("Error updating contract for renewal:", error);
      throw error;
    }
  }

  /**
   * Update contract status with cancellation information
   */
  async updateContractForCancellation(
    userId: string,
    cancellationData: {
      cancelledAt: string;
      cancelledBy: string;
      cancellationReason: string;
    }
  ): Promise<void> {
    try {
      const userRef = adminDb.collection(this.USERS_COLLECTION).doc(userId);
      await userRef.update({
        "ContratosAssinados.cancelledAt": cancellationData.cancelledAt,
        "ContratosAssinados.cancelledBy": cancellationData.cancelledBy,
        "ContratosAssinados.cancellationReason":
          cancellationData.cancellationReason,
        "ContratosAssinados.isValid": false,
        "ContratosAssinados.autoRenewal": false,
      });
    } catch (error) {
      console.error("Error updating contract for cancellation:", error);
      throw error;
    }
  }

  /**
   * Get all users with active contracts for renewal processing
   */
  async getAllUsersWithActiveContracts(): Promise<
    { userId: string; status: ContractStatus }[]
  > {
    try {
      const usersRef = adminDb.collection(this.USERS_COLLECTION);
      const querySnapshot = await usersRef
        .where("ContratosAssinados.signed", "==", true)
        .where("ContratosAssinados.signedByAdmin", "==", true)
        .get();

      const results: { userId: string; status: ContractStatus }[] = [];

      for (const doc of querySnapshot.docs) {
        const contractStatus = doc.data().ContratosAssinados as ContractStatus;

        // Only include contracts that are not cancelled and have expiration date
        if (!contractStatus.cancelledAt && contractStatus.expiresAt) {
          results.push({
            userId: doc.id,
            status: contractStatus,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error fetching users with active contracts:", error);
      throw error;
    }
  }

  /**
   * Create a renewal log entry in the contract subcollection
   */
  async createRenewalLog(
    userId: string,
    renewalData: {
      previousExpirationDate: string;
      newExpirationDate: string;
      renewalCount: number;
      renewalType: "automatic" | "manual";
      renewedBy?: string;
    }
  ): Promise<string> {
    try {
      const renewalLogRef = adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection("ContractRenewals")
        .doc();

      const renewalLogId = renewalLogRef.id;

      const renewalLog = {
        renewalId: renewalLogId,
        previousExpirationDate: renewalData.previousExpirationDate,
        newExpirationDate: renewalData.newExpirationDate,
        renewalCount: renewalData.renewalCount,
        renewalType: renewalData.renewalType,
        renewedBy: renewalData.renewedBy || "system",
        renewedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await renewalLogRef.set(renewalLog);
      return renewalLogId;
    } catch (error) {
      console.error("Error creating renewal log:", error);
      throw error;
    }
  }

  /**
   * Create a cancellation log entry in the contract subcollection
   */
  async createCancellationLog(
    userId: string,
    cancellationData: {
      cancelledBy: string;
      cancellationReason: string;
      isAdminCancellation: boolean;
    }
  ): Promise<string> {
    try {
      const cancellationLogRef = adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection("ContractCancellations")
        .doc();

      const cancellationLogId = cancellationLogRef.id;

      const cancellationLog = {
        cancellationId: cancellationLogId,
        cancelledBy: cancellationData.cancelledBy,
        cancellationReason: cancellationData.cancellationReason,
        isAdminCancellation: cancellationData.isAdminCancellation,
        cancelledAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await cancellationLogRef.set(cancellationLog);
      return cancellationLogId;
    } catch (error) {
      console.error("Error creating cancellation log:", error);
      throw error;
    }
  }

  /**
   * Get renewal history for a user
   */
  async getUserRenewalHistory(userId: string): Promise<any[]> {
    try {
      const renewalsRef = adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection("ContractRenewals");

      const querySnapshot = await renewalsRef
        .orderBy("renewedAt", "desc")
        .get();

      return querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error("Error fetching user renewal history:", error);
      throw error;
    }
  }

  /**
   * Get cancellation history for a user
   */
  async getUserCancellationHistory(userId: string): Promise<any[]> {
    try {
      const cancellationsRef = adminDb
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .collection("ContractCancellations");

      const querySnapshot = await cancellationsRef
        .orderBy("cancelledAt", "desc")
        .get();

      return querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error("Error fetching user cancellation history:", error);
      throw error;
    }
  }
}
