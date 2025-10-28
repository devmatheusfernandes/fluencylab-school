import { StudentClass } from "../classes/class";
import { User } from "./users";

// Este tipo representa a visão 360º de um utilizador
export interface FullUserDetails extends User {
  // Dados agregados
  scheduledClasses?: StudentClass[];
  vacationDaysRemaining?: number;

  // contractStatus?: 'signed' | 'pending' | 'none'; // Exemplo para o futuro
  // paymentHistory?: any[]; // Exemplo para o futuro
}
