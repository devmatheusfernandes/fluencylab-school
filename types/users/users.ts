// types/users.ts
import { UserRoles } from "./userRoles";
import { UserPermission } from "./userPermissions";
import { RegularClassCredit } from "../credits/regularClassCredits";
import { StudentAchievement } from "./achievements";

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

export type User = {
  id: string;
  firebaseUid?: string;
  name: string;
  nickname?: string;
  email: string;
  role: UserRoles;
  permissions: UserPermission[];
  createdAt: Date;
  updatedAt?: Date;
  isActive: boolean;
  deactivatedAt?: Date;

  avatarUrl: string;
  interfaceLanguage: string;
  theme?: "light" | "dark";
  themeColor?: "violet" | "rose" | "indigo" | "yellow" | "green";
  tutorialCompleted: boolean;
  onboardingCompletedAt?: Date;

  //PERSONAL INFO
  birthDate?: Date;
  gender?: "male" | "female";
  phoneNumber?: string;
  taxId?: string; // CPF

  // Guardian info for minors (GUARDED_STUDENT)
  guardian?: {
    name: string;
    email: string;
    phoneNumber?: string;
    relationship?: string;
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
  languages?: string[];

  // ACHIEVEMENTS
  achievements?: StudentAchievement[];
  completedClassesCount?: number;

  // GAMIFICATION
  gamification?: {
    currentXP: number;
    level: number;
    streak: {
      current: number;
      best: number;
      lastStudyDate: Date | null;
    };
    studyHeatmap: Record<string, number>;
  };

  contractStartDate?: Date;
  contractLengthMonths?: 6 | 12;

  monthlyReschedules?: {
    month: string;
    count: number;
  }[];

  // GOOGLE CALENDAR
  googleCalendarConnected?: boolean;
  googleCalendarTokens?: GoogleCalendarTokens;
  googleCalendarDefaultTimes?: GoogleCalendarDefaultTimes;

  placementDone?: boolean;

  // REGULAR STUDENTS
  regularClassCredits?: RegularClassCredit[];

  // PAYMENT
  subscriptionStatus?: "active" | "canceled" | "incomplete" | null;
  lastPaymentIntentId?: string | null;

  // SUBSCRIPTION FIELDS
  currentSubscriptionId?: string | null;
  subscriptionPaymentMethod?: "pix" | "credit_card" | null;
  subscriptionBillingDay?: number;
  subscriptionNextBilling?: Date;
  subscriptionCreatedAt?: Date;
  subscriptionCanceledAt?: Date;
  subscriptionCancellationReason?: string;

  // TECHER
  taxRegime?: "PF" | "PJ";
  vacationDaysRemaining?: number;
  ratePerClassCents?: number;
  schedulingSettings?: {
    bookingLeadTimeHours?: number;
    bookingHorizonDays?: number;
    cancellationPolicyHours?: number;
  };

  preferences?: {
    soundEffectsEnabled?: boolean;
    autoJoinClasses?: boolean;
    defaultClassDuration?: number;
    preferredTeachers?: string[];
    [key: string]: any;
  };

  hasPassword?: boolean;

  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
};
