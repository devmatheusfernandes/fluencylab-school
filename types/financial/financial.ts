// Using any for timestamps to support both client (Timestamp) and server (admin.firestore.Timestamp) usage,
// consistent with other parts of the application to avoid SDK conflicts.
export type FirestoreTimestamp = any; 

export type CompanyType = "MEI" | "ME";
export type FiscalStatus = "SAFE" | "WARNING" | "CRITICAL";
export type PaymentStatus = "ACCRUED" | "PAID";
export type TeacherType = "PF" | "PJ";

export interface CompanyConfig {
  companyType: CompanyType;
  meiAnnualLimit: number; // e.g., 81000
  meAnnualLimit: number; // e.g., 360000
  meTaxRate: number; // e.g., 0.08
  inssRate: number; // e.g., 0.11
}

export interface FiscalYear {
  year: number;
  totalRevenue: number;
  limit: number;
  percentageUsed: number;
  status: FiscalStatus;
  companyType: CompanyType;
}

export interface MonthlyRevenue {
  month: string; // YYYY-MM
  totalRevenue: number;
  totalStudents: number;
  studentSnapshots: {
    studentId: string;
    valuePaid: number;
  }[];
  createdAt: FirestoreTimestamp;
}

export interface TeacherPaymentRecord {
  id?: string;
  teacherId: string;
  teacherName?: string; // Optional helper for UI
  competenceMonth: string; // YYYY-MM (e.g., 2023-10)
  paymentMonth: string; // YYYY-MM (e.g., 2023-11)
  grossValue: number; // Calculated: completedClasses * ratePerClass
  
  inssDiscount?: number;
  netValue: number;
  teacherType: TeacherType;
  status: PaymentStatus; // ACCRUED | PAID
  paidAt?: FirestoreTimestamp;
  receiptUrl?: string;
  invoiceId?: string; // if PJ
  rpaId?: string; // if PF
}

export interface IrpfRange {
  limit: number;      // Limit in cents
  rate: number;       // Rate (0.075, 0.15, etc)
  deduction: number;  // Deduction in cents
}

export interface IrpfConfig {
  year: number;
  ranges: IrpfRange[];
  updatedAt?: FirestoreTimestamp;
  updatedBy?: string;
}
