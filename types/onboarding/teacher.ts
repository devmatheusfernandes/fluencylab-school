import { AvailabilityType } from "../time/availability";

export type PaymentMethod = "account" | "pix";
export type PixKeyType = "cpf" | "email" | "phone" | "random";

export interface BankingInfo {
  // Common
  cpf: string;
  fullName: string;
  paymentMethod: PaymentMethod;

  // Account specific
  accountType?: "checking" | "savings";
  bankCode?: string;
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  accountDigit?: string;

  // PIX specific
  pixKeyType?: PixKeyType;
  pixKey?: string;
}

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:MM" format
  endTime: string; // "HH:MM" format
  title: string;
  type: AvailabilityType; // Adicionado para compatibilidade com sistema de disponibilidade
}

export interface TeacherOnboardingData {
  // Basic Info
  nickname: string;
  interfaceLanguage: string;
  theme: "light" | "dark";

  // Email verification
  emailVerified: boolean;

  // Banking Information
  bankingInfo: BankingInfo;

  // Schedule
  scheduleSlots: ScheduleSlot[];

  // Completion
  onboardingCompleted: boolean;
}
