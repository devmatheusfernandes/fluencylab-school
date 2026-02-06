// services/emailService.ts

import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/templates/WelcomeEmail";
import { ClassRescheduledEmail } from "@/emails/templates/ClassRescheduledEmail";
import { ClassScheduledEmail } from "@/emails/templates/ClassScheduledEmail";
import { ClassCanceledEmail } from "@/emails/templates/ClassCanceledEmail";
import { TeacherVacationEmail } from "@/emails/templates/TeacherVacationEmail";
import { ContractRenewalEmail } from "@/emails/templates/ContractRenewalEmail";
import { PaymentConfirmationEmail } from "@/emails/templates/PaymentConfirmationEmail";
import { TeacherVacationCancellationEmail } from "@/emails/templates/TeacherVacationCancellationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

interface AffectedClass {
  date: string;
  time: string;
  language: string;
}

export class EmailService {
  async sendWelcomeAndSetPasswordEmail(
    email: string,
    name: string,
    actionLink: string,
    studentInfo?: string,
  ) {
    try {
      const buildCustomLink = (link: string) => {
        try {
          const u = new URL(link);
          const oobCode = u.searchParams.get("oobCode");
          const lang = u.searchParams.get("lang") || "pt";
          const locale = lang.split("-")[0];
          const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
          if (!oobCode) return link;
          return `${base}/${locale}/create-password?oobCode=${encodeURIComponent(
            oobCode,
          )}&lang=${encodeURIComponent(lang)}`;
        } catch {
          return link;
        }
      };
      const customActionLink = buildCustomLink(actionLink);
      const subject = studentInfo
        ? "Bem-vindo(a) à Fluency Lab! Defina sua senha para acessar a conta do estudante."
        : "Bem-vindo(a) à Fluency Lab! Defina sua senha.";

      await resend.emails.send({
        from: "Matheus Fernandes <contato@matheusfernandes.me>",
        to: email,
        subject,
        react: await WelcomeEmail({
          name,
          actionLink: customActionLink,
          studentInfo,
        }),
      });

    } catch (error) {
      console.error("Falha ao enviar e-mail de boas-vindas:", error);
      throw new Error(
        "Usuário criado, mas falha ao enviar o e-mail de boas-vindas.",
      );
    }
  }

  async sendClassScheduledEmail(
    email: string,
    recipientName: string,
    teacherName: string,
    scheduledAt: Date,
  ) {
    try {
      const platformLink =
        process.env.NEXT_PUBLIC_APP_URL || "https://app.fluencylab.com";
      const date = scheduledAt.toLocaleDateString("pt-BR");
      const time = scheduledAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      await resend.emails.send({
        from: "Agendamento <contato@matheusfernandes.me>",
        to: [email],
        subject: "Nova aula agendada - Fluency Lab",
        react: await ClassScheduledEmail({
          recipientName,
          recipientType: "student",
          otherPartyName: teacherName,
          date,
          time,
          platformLink: `${platformLink}/hub/student/my-class`,
        }),
      });
    } catch (error) {
      console.error("Falha ao enviar e-mail de agendamento (aluno):", error);
      // Não lançar erro para não quebrar o fluxo principal
    }
  }

  async sendClassScheduledTeacherEmail(
    email: string,
    recipientName: string,
    studentName: string,
    scheduledAt: Date,
  ) {
    try {
      const platformLink =
        process.env.NEXT_PUBLIC_APP_URL || "https://app.fluencylab.com";
      const date = scheduledAt.toLocaleDateString("pt-BR");
      const time = scheduledAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      await resend.emails.send({
        from: "Agendamento <contato@matheusfernandes.me>",
        to: [email],
        subject: "Nova aula agendada com você - Fluency Lab",
        react: await ClassScheduledEmail({
          recipientName,
          recipientType: "teacher",
          otherPartyName: studentName,
          date,
          time,
          platformLink: `${platformLink}/hub/teacher/my-classes`,
        }),
      });
    } catch (error) {
      console.error(
        "Falha ao enviar e-mail de agendamento (professor):",
        error,
      );
      // Não lançar erro para não quebrar o fluxo principal
    }
  }

  async sendClassRescheduledEmail({
    email,
    recipientName,
    recipientType,
    className,
    originalDate,
    originalTime,
    newDate,
    newTime,
    reason,
    rescheduleBy,
    platformLink,
  }: {
    email: string;
    recipientName: string;
    recipientType: "student" | "teacher";
    className: string;
    originalDate: string;
    originalTime: string;
    newDate: string;
    newTime: string;
    reason?: string;
    rescheduleBy: string;
    platformLink: string;
  }) {
    try {
      const subject =
        recipientType === "student"
          ? "Sua aula foi reagendada - Fluency Lab"
          : "Aula reagendada - Fluency Lab";

      await resend.emails.send({
        from: "Reagendamento <contato@matheusfernandes.me>",
        to: [email],
        subject,
        react: await ClassRescheduledEmail({
          recipientName,
          recipientType,
          className,
          originalDate,
          originalTime,
          newDate,
          newTime,
          reason,
          rescheduleBy,
          platformLink,
        }),
      });

    } catch (error) {
      console.error("Falha ao enviar e-mail de reagendamento:", error);
      throw new Error("Falha ao enviar o e-mail de reagendamento.");
    }
  }

  async sendClassCanceledEmail({
    email,
    recipientName,
    recipientType,
    className,
    scheduledDate,
    scheduledTime,
    canceledBy,
    reason,
    creditRefunded,
    makeupCreditGranted,
    platformLink,
    classId,
  }: {
    email: string;
    recipientName: string;
    recipientType: "student" | "teacher";
    className: string;
    scheduledDate: string;
    scheduledTime: string;
    canceledBy: string;
    reason?: string;
    creditRefunded?: boolean;
    makeupCreditGranted?: boolean;
    platformLink: string;
    classId?: string;
  }) {
    try {
      const subject =
        recipientType === "student"
          ? "Sua aula foi cancelada - Fluency Lab"
          : "Aula cancelada - Fluency Lab";

      await resend.emails.send({
        from: "Cancelamento <contato@matheusfernandes.me>",
        to: [email],
        subject,
        react: await ClassCanceledEmail({
          recipientName,
          recipientType,
          className,
          scheduledDate,
          scheduledTime,
          canceledBy,
          reason,
          creditRefunded,
          makeupCreditGranted,
          platformLink,
          classId,
        }),
      });

    } catch (error) {
      console.error("Falha ao enviar e-mail de cancelamento:", error);
      throw new Error("Falha ao enviar o e-mail de cancelamento.");
    }
  }

  async sendTeacherVacationEmail({
    email,
    studentName,
    teacherName,
    vacationStartDate,
    vacationEndDate,
    affectedClasses,
    platformLink,
  }: {
    email: string;
    studentName: string;
    teacherName: string;
    vacationStartDate: string;
    vacationEndDate: string;
    affectedClasses: AffectedClass[];
    platformLink: string;
  }) {
    try {
      await resend.emails.send({
        from: "Férias <contato@matheusfernandes.me>",
        to: [email],
        subject:
          "Suas aulas foram afetadas por férias do professor - Fluency Lab",
        react: await TeacherVacationEmail({
          studentName,
          teacherName,
          vacationStartDate,
          vacationEndDate,
          affectedClasses,
          platformLink,
        }),
      });

    } catch (error) {
      console.error("Falha ao enviar e-mail de férias do professor:", error);
      throw new Error("Falha ao enviar o e-mail de férias do professor.");
    }
  }

  async sendTeacherVacationCancellationEmail({
    email,
    studentName,
    teacherName,
    vacationStartDate,
    vacationEndDate,
    affectedClasses,
    platformLink,
  }: {
    email: string;
    studentName: string;
    teacherName: string;
    vacationStartDate: string;
    vacationEndDate: string;
    affectedClasses: AffectedClass[];
    platformLink: string;
  }) {
    try {
      await resend.emails.send({
        from: "Férias Canceladas <contato@matheusfernandes.me>",
        to: [email],
        subject:
          "Férias do professor canceladas - Suas aulas foram reagendadas - Fluency Lab",
        react: await TeacherVacationCancellationEmail({
          studentName,
          teacherName,
          vacationStartDate,
          vacationEndDate,
          affectedClasses,
          platformLink,
        }),
      });

      console.log(
        `E-mail de cancelamento de férias do professor enviado para ${email}`,
      );
    } catch (error) {
      console.error(
        "Falha ao enviar e-mail de cancelamento de férias do professor:",
        error,
      );
      throw new Error(
        "Falha ao enviar o e-mail de cancelamento de férias do professor.",
      );
    }
  }

  async sendContractRenewalEmail({
    email,
    studentName,
    previousExpirationDate,
    newExpirationDate,
    renewalCount,
    contractId,
    platformLink = "https://app.fluencylab.com",
  }: {
    email: string;
    studentName: string;
    previousExpirationDate: string;
    newExpirationDate: string;
    renewalCount: number;
    contractId: string;
    platformLink?: string;
  }) {
    try {
      await resend.emails.send({
        from: "Renovação de Contrato <contato@matheusfernandes.me>",
        to: [email],
        subject: "🎉 Seu contrato foi renovado automaticamente - Fluency Lab",
        react: await ContractRenewalEmail({
          studentName,
          previousExpirationDate,
          newExpirationDate,
          renewalCount,
          contractId,
          platformLink,
        }),
      });

      console.log(`E-mail de renovação de contrato enviado para ${email}`);
    } catch (error) {
      console.error("Falha ao enviar e-mail de renovação de contrato:", error);
      throw new Error("Falha ao enviar o e-mail de renovação de contrato.");
    }
  }

  async sendPaymentConfirmationEmail({
    email,
    studentName,
    amount,
    paymentDate,
    paymentMethod,
    nextBillingDate,
    receiptUrl,
  }: {
    email: string;
    studentName: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: "pix" | "credit_card";
    nextBillingDate: Date;
    receiptUrl?: string;
  }) {
    try {
      await resend.emails.send({
        from: "Pagamento Confirmado <contato@matheusfernandes.me>",
        to: [email],
        subject: "Pagamento Confirmado! 🎉 - Fluency Lab",
        react: await PaymentConfirmationEmail({
          studentName,
          amount,
          paymentDate,
          paymentMethod,
          nextBillingDate,
          receiptUrl,
        }),
      });

    } catch (error) {
      console.error(
        "Falha ao enviar e-mail de confirmação de pagamento:",
        error,
      );
      // We don't throw error here to avoid breaking the payment flow if email fails
    }
  }
}

export const emailService = new EmailService();
