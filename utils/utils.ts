import { UserRoles } from "@/types/users/userRoles";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function to serialize data for Client Components while preserving Date objects
 * This is needed because React Server Components can only pass serializable data to Client Components
 * but some components (like calendars) need actual Date objects
 */
export function serializeForClientComponent(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    return obj;
  }

  if (obj instanceof Date) {
    // Keep Date objects as they are for components that need them
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeForClientComponent(item));
  }

  if (typeof obj === "object") {
    // Handle special objects like Firestore Timestamps
    if (
      obj &&
      typeof obj === "object" &&
      "_seconds" in obj &&
      "_nanoseconds" in obj
    ) {
      // Convert Firestore Timestamp to Date object
      const timestamp = new Date(
        obj._seconds * 1000 + obj._nanoseconds / 1000000
      );
      return timestamp;
    }

    const serialized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeForClientComponent(obj[key]);
      }
    }
    return serialized;
  }

  return obj;
}

/**
 * Safely converts a date value to ISO string, handling invalid dates
 * @param dateValue - Date, string, number, or any date-like value
 * @returns ISO string if valid, undefined if invalid
 */
export function safeDateToISO(dateValue: any): string | undefined {
  if (!dateValue) return undefined;

  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>?/gm, "");

  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  return sanitized;
}

/**
 * Validates and sanitizes email addresses
 * @param email - Email address to validate
 * @returns Valid email or null
 */
export function validateAndSanitizeEmail(email: string): string | null {
  if (!email) return null;

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Sanitize input
  const sanitized = sanitizeInput(email.trim().toLowerCase());

  if (emailRegex.test(sanitized)) {
    return sanitized;
  }

  return null;
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with isValid flag and message
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message: string;
} {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "Password must be at least 6 characters long",
    };
  }

  return { isValid: true, message: "Password is valid" };
}

// Utility function to capitalize first letter
export const capitalizeFirstLetter = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Role mapping to Portuguese with first letter capitalized
export const roleLabels: Record<UserRoles, string> = {
  [UserRoles.ADMIN]: "Administrador",
  [UserRoles.MANAGER]: "Gerente",
  [UserRoles.STUDENT]: "Estudante",
  [UserRoles.TEACHER]: "Professor",
  [UserRoles.GUARDED_STUDENT]: "Estudante Tutelado",
  [UserRoles.MATERIAL_MANAGER]: "Gerente de Material",
};

export const determineCEFRLevel = (score: number): number => {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 45) return 2;
  if (score >= 30) return 1;
  return 0;
};

/**
 * Cria uma chave de texto única e consistente para uma data e hora.
 * Formato: "AAAA-MM-DD-HH:mm"
 */
export const createDateTimeKey = (date: Date, time: string): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}-${time}`;
};
