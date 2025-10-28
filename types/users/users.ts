// types/users.ts
import { UserRoles } from "./userRoles";
import { UserPermission } from "./userPermissions";
import { RegularClassCredit } from "../credits/regularClassCredits";
import { StudentAchievement } from "./achievements";

// Google Calendar types
export interface GoogleCalendarTokens {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
}

export interface GoogleCalendarDefaultTimes {
  monday?: { startTime: string; endTime: string };
  tuesday?: { startTime: string; endTime: string };
  wednesday?: { startTime: string; endTime: string };
  thursday?: { startTime: string; endTime: string };
  friday?: { startTime: string; endTime: string };
  saturday?: { startTime: string; endTime: string };
  sunday?: { startTime: string; endTime: string };
}

//firebase > db > users > user.id
export type User = {
  id: string;
  firebaseUid?: string; // UID do Firebase Auth
  name: string;
  nickname?: string;
  email: string;
  role: UserRoles;
  permissions: UserPermission[];
  createdAt: Date;
  updatedAt?: Date; // Campo para armazenar a data de última atualização
  isActive: boolean;
  deactivatedAt?: Date; //If the user is deactivated, this field will be filled

  avatarUrl: string;
  interfaceLanguage: string;
  theme?: "light" | "dark";
  tutorialCompleted: boolean;
  onboardingCompletedAt?: Date; // Campo para armazenar quando o onboarding foi concluído

  //PERSONAL INFO
  birthDate?: Date; //Required
  gender?: "male" | "female";
  phoneNumber?: string;

  // Guardian info for minors (GUARDED_STUDENT)
  guardian?: {
    name: string;
    email: string;
    phoneNumber?: string;
    relationship?: string; // "pai", "mãe", "responsável legal", etc.
  };

  address?: {
    //Required
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };

  //STUDENT
  teachersIds?: string[];
  badges?: string[]; //Maybe put in a differente collection
  coursesIds?: string[]; //Maybe put in a differente collection
  languages?: string[];

  // ACHIEVEMENTS
  achievements?: StudentAchievement[];

  // CAMPOS ADICIONADOS PARA CONTRATO E REAGENDAMENTO
  contractStartDate?: Date;
  contractLengthMonths?: 6 | 12;
  monthlyReschedules?: {
    month: string; // Formato "YYYY-MM"
    count: number;
  }[];

  placementDone?: boolean;

  // REGULAR STUDENTS - Extra class credits system
  regularClassCredits?: RegularClassCredit[];

  // PAYMENT
  subscriptionStatus?: "active" | "canceled" | "incomplete" | null;
  lastPaymentIntentId?: string | null;

  // MERCADO PAGO SUBSCRIPTION FIELDS
  mercadoPagoCustomerId?: string | null;
  mercadoPagoSubscriptionId?: string | null;
  subscriptionPaymentMethod?: "pix" | "credit_card" | null;
  subscriptionBillingDay?: number; // Day of month for billing (1-28)
  subscriptionNextBilling?: Date;
  subscriptionCreatedAt?: Date;
  subscriptionCanceledAt?: Date;
  subscriptionCancellationReason?: string;

  //TEACHER
  vacationDaysRemaining?: number; // <<< NOVO CAMPO ADICIONADO
  schedulingSettings?: {
    bookingLeadTimeHours?: number;
    bookingHorizonDays?: number;
    cancellationPolicyHours?: number;
  };

  profile?: {
    bio?: string;
    specialties?: string[];
    languages?: string[];
  };

  // TWO-FACTOR AUTHENTICATION FIELDS
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];

  // GOOGLE CALENDAR INTEGRATION
  googleCalendarTokens?: GoogleCalendarTokens;
  googleCalendarDefaultTimes?: GoogleCalendarDefaultTimes;
};
