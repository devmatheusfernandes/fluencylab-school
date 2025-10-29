// services/creditService.ts

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  RegularClassCredit,
  RegularCreditType,
  RegularCreditsBalance,
  GrantCreditRequest,
  UseCreditRequest,
  CreditTransaction,
} from "@/types/credits/regularClassCredits";
import { userAdminRepository } from "@/repositories";
import { UserAdminRepository } from "@/repositories/user.admin.repository";

export class CreditService {
  private userRepository: UserAdminRepository;

  constructor() {
    // Usando instância singleton centralizada
    this.userRepository = userAdminRepository;
  }

  /**
   * Grant credits to a student with expiration date
   */
  async grantCredits(
    request: GrantCreditRequest,
    grantedBy: string
  ): Promise<RegularClassCredit> {
    const { studentId, type, amount, expiresAt, reason } = request;

    // Validate student exists and is eligible for credits
    const student = await this.userRepository.findUserById(studentId);
    if (!student) {
      throw new Error("Estudante não encontrado.");
    }

    const credit: RegularClassCredit = {
      id: adminDb.collection("temp").doc().id, // Generate unique ID
      type,
      amount,
      expiresAt,
      grantedBy,
      grantedAt: new Date(),
      reason,
    };

    // Update user document with the new credit
    const userRef = adminDb.collection("users").doc(studentId);
    await userRef.update({
      regularClassCredits: FieldValue.arrayUnion(credit),
      updatedAt: new Date(),
    });

    // Create audit trail
    await this.createCreditTransaction({
      id: adminDb.collection("temp").doc().id,
      studentId,
      creditId: credit.id,
      action: "granted",
      amount,
      performedBy: grantedBy,
      performedAt: new Date(),
      reason,
    });

    return credit;
  }

  /**
   * Get available credits balance for a student
   */
  async getStudentCreditsBalance(
    studentId: string
  ): Promise<RegularCreditsBalance> {
    const student = await this.userRepository.findUserById(studentId);
    if (!student || !student.regularClassCredits) {
      return {
        totalCredits: 0,
        bonusCredits: 0,
        lateStudentCredits: 0,
        expiredCredits: 0,
        usedCredits: 0,
        credits: [],
      };
    }

    const now = new Date();
    const credits = student.regularClassCredits;

    // Categorize credits
    const availableCredits = credits.filter(
      (c: RegularClassCredit) => !c.usedAt && new Date(c.expiresAt) > now
    );
    const expiredCredits = credits.filter(
      (c: RegularClassCredit) => !c.usedAt && new Date(c.expiresAt) <= now
    );
    const usedCredits = credits.filter((c: RegularClassCredit) => c.usedAt);

    const bonusCredits = availableCredits
      .filter((c: RegularClassCredit) => c.type === RegularCreditType.BONUS)
      .reduce((sum: number, c: RegularClassCredit) => sum + c.amount, 0);

    const lateStudentCredits = availableCredits
      .filter(
        (c: RegularClassCredit) => c.type === RegularCreditType.LATE_STUDENTS
      )
      .reduce((sum: number, c: RegularClassCredit) => sum + c.amount, 0);

    const teacherCancellationCredits = availableCredits
      .filter(
        (c: RegularClassCredit) =>
          c.type === RegularCreditType.TEACHER_CANCELLATION
      )
      .reduce((sum: number, c: RegularClassCredit) => sum + c.amount, 0);

    return {
      totalCredits:
        bonusCredits + lateStudentCredits + teacherCancellationCredits,
      bonusCredits,
      lateStudentCredits,
      expiredCredits: expiredCredits.reduce(
        (sum: number, c: RegularClassCredit) => sum + c.amount,
        0
      ),
      usedCredits: usedCredits.reduce(
        (sum: number, c: RegularClassCredit) => sum + c.amount,
        0
      ),
      credits: availableCredits,
    };
  }

  /**
   * Use a credit for a class
   */
  async useCredit(request: UseCreditRequest, usedBy: string): Promise<void> {
    const { studentId, creditId, classId } = request;

    const student = await this.userRepository.findUserById(studentId);
    if (!student || !student.regularClassCredits) {
      throw new Error("Estudante não encontrado ou sem créditos disponíveis.");
    }

    const creditIndex = student.regularClassCredits.findIndex(
      (c: RegularClassCredit) => c.id === creditId
    );
    if (creditIndex === -1) {
      throw new Error("Crédito não encontrado.");
    }

    const credit = student.regularClassCredits[creditIndex];

    // Validate credit is still available
    if (credit.usedAt) {
      throw new Error("Este crédito já foi utilizado.");
    }

    if (new Date(credit.expiresAt) <= new Date()) {
      throw new Error("Este crédito expirou.");
    }

    if (credit.amount <= 0) {
      throw new Error("Este crédito não tem quantidade disponível.");
    }

    // Update the credit as used
    const updatedCredit: RegularClassCredit = {
      id: credit.id,
      type: credit.type,
      amount: credit.amount - 1, // Decrease amount by 1
      expiresAt: credit.expiresAt,
      grantedBy: credit.grantedBy,
      grantedAt: credit.grantedAt,
      usedAt: new Date(),
      usedForClassId: classId,
      ...(credit.reason && { reason: credit.reason }),
      ...(credit.isExpired !== undefined && { isExpired: credit.isExpired }),
    };

    // Update user document
    const updatedCredits = [...student.regularClassCredits];
    updatedCredits[creditIndex] = updatedCredit;

    const userRef = adminDb.collection("users").doc(studentId);
    await userRef.update({
      regularClassCredits: updatedCredits,
      updatedAt: new Date(),
    });

    // Create audit trail
    await this.createCreditTransaction({
      id: adminDb.collection("temp").doc().id,
      studentId,
      creditId: credit.id,
      action: "used",
      amount: 1,
      performedBy: usedBy,
      performedAt: new Date(),
      classId,
    });
  }

  /**
   * Find an available credit for a student
   */
  async findAvailableCredit(
    studentId: string,
    preferredType?: RegularCreditType
  ): Promise<RegularClassCredit | null> {
    const balance = await this.getStudentCreditsBalance(studentId);

    if (balance.totalCredits === 0) {
      return null;
    }

    // Prefer the specified type if provided and available
    if (preferredType) {
      const creditOfType = balance.credits.find(
        (c) => c.type === preferredType && c.amount > 0
      );
      if (creditOfType) {
        return creditOfType;
      }
    }

    // Otherwise return any available credit (oldest first)
    return (
      balance.credits
        .filter((c: RegularClassCredit) => c.amount > 0)
        .sort(
          (a: RegularClassCredit, b: RegularClassCredit) =>
            new Date(a.grantedAt).getTime() - new Date(b.grantedAt).getTime()
        )[0] || null
    );
  }

  /**
   * Check if a student has available credits
   */
  async hasAvailableCredits(studentId: string): Promise<boolean> {
    const balance = await this.getStudentCreditsBalance(studentId);
    return balance.totalCredits > 0;
  }

  /**
   * Mark expired credits (should be run periodically)
   */
  async markExpiredCredits(): Promise<void> {
    // This would typically be implemented as a cloud function or cron job
    // For now, we'll handle expiration checking in real-time during balance calculations
  }

  /**
   * Remove expired credits from user accounts
   */
  async cleanupExpiredCredits(studentId: string): Promise<void> {
    const student = await this.userRepository.findUserById(studentId);
    if (!student || !student.regularClassCredits) {
      return;
    }

    const now = new Date();
    const activeCredits = student.regularClassCredits.filter(
      (c: RegularClassCredit) => c.usedAt || new Date(c.expiresAt) > now
    );

    if (activeCredits.length !== student.regularClassCredits.length) {
      const userRef = adminDb.collection("users").doc(studentId);
      await userRef.update({
        regularClassCredits: activeCredits,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Create an audit trail transaction
   */
  private async createCreditTransaction(
    transaction: CreditTransaction
  ): Promise<void> {
    const transactionRef = adminDb
      .collection("creditTransactions")
      .doc(transaction.id);
    await transactionRef.set(transaction);
  }

  /**
   * Get credit transaction history for a student
   */
  async getCreditTransactionHistory(
    studentId: string
  ): Promise<CreditTransaction[]> {
    const snapshot = await adminDb
      .collection("creditTransactions")
      .where("studentId", "==", studentId)
      .orderBy("performedAt", "desc")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      performedAt: doc.data().performedAt.toDate(),
    })) as CreditTransaction[];
  }
}

export const creditService = new CreditService();
