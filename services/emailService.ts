// services/emailService.ts

import { Resend } from "resend";
import { WelcomeEmail } from "@/emails/templates/WelcomeEmail";
import { ClassRescheduledEmail } from "@/emails/templates/ClassRescheduledEmail";
import { ClassCanceledEmail } from "@/emails/templates/ClassCanceledEmail";
import { TeacherVacationEmail } from "@/emails/templates/TeacherVacationEmail";
import TeacherVacationCancellationEmail from "@/emails/templates/TeacherVacationCancellationEmail";
import { ContractRenewalEmail } from "@/emails/templates/ContractRenewalEmail";

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
    studentInfo?: string
  ) {
    try {
      const subject = studentInfo
        ? "Bem-vindo(a) à Fluency Lab! Defina sua senha para acessar a conta do estudante."
        : "Bem-vindo(a) à Fluency Lab! Defina sua senha.";

      await resend.emails.send({
        from: "Matheus Fernandes <contato@matheusfernandes.me>",
        to: email,
        subject,
        react: await WelcomeEmail({ name, actionLink, studentInfo }),
      });

      console.log(`E-mail de boas-vindas enviado para ${email}`);
    } catch (error) {
      console.error("Falha ao enviar e-mail de boas-vindas:", error);
      throw new Error(
        "Usuário criado, mas falha ao enviar o e-mail de boas-vindas."
      );
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

      console.log(`E-mail de reagendamento enviado para ${email}`);
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

      console.log(`E-mail de cancelamento enviado para ${email}`);
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

      console.log(`E-mail de férias do professor enviado para ${email}`);
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
        `E-mail de cancelamento de férias do professor enviado para ${email}`
      );
    } catch (error) {
      console.error(
        "Falha ao enviar e-mail de cancelamento de férias do professor:",
        error
      );
      throw new Error(
        "Falha ao enviar o e-mail de cancelamento de férias do professor."
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
}

export const emailService = new EmailService();
