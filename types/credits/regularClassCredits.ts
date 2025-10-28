// types/credits/regularClassCredits.ts

/**
 * Credit types for regular students
 */
export enum RegularCreditType {
  BONUS = "bonus", // Bonus credits awarded by admin/manager
  LATE_STUDENTS = "late-students", // Credits for students who started late in the month
  TEACHER_CANCELLATION = "teacher-cancellation", // Credits for students who were cancelled by teacher
}

/**
 * Individual credit entry with tracking information
 */
export interface RegularClassCredit {
  id: string; // Unique identifier for the credit
  type: RegularCreditType; // Type of credit (bonus or late-students)
  amount: number; // Number of credits
  expiresAt: Date; // Expiration date set by admin/manager
  grantedBy: string; // Admin/manager user ID who granted the credit
  grantedAt: Date; // When the credit was granted
  usedAt?: Date; // When the credit was used (if used)
  usedForClassId?: string; // Class ID if credit was used
  reason?: string; // Optional reason for granting the credit
  isExpired?: boolean; // Computed field for expiration status
}

/**
 * Summary of regular class credits for a student
 */
export interface RegularCreditsBalance {
  totalCredits: number; // Total available credits
  bonusCredits: number; // Available bonus credits
  lateStudentCredits: number; // Available late-student credits
  expiredCredits: number; // Number of expired credits
  usedCredits: number; // Number of used credits
  credits: RegularClassCredit[]; // Detailed credit entries
}

/**
 * Credit transaction for audit trail
 */
export interface CreditTransaction {
  id: string;
  studentId: string;
  creditId: string;
  action: "granted" | "used" | "expired";
  amount: number;
  performedBy: string; // User ID who performed the action
  performedAt: Date;
  reason?: string;
  classId?: string; // If action is 'used'
}

/**
 * Request payload for granting credits
 */
export interface GrantCreditRequest {
  studentId: string;
  type: RegularCreditType;
  amount: number;
  expiresAt: Date;
  reason?: string;
}

/**
 * Request payload for using credits
 */
export interface UseCreditRequest {
  studentId: string;
  creditId: string;
  classId: string;
}
