import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
} from "@react-email/components";
import { EmailButton } from "../components/EmailButton";

interface ClassRescheduledEmailProps {
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
  originalClassId?: string; // ID da aula original para conversão em slot livre
}

export const ClassRescheduledEmail: React.FC<ClassRescheduledEmailProps> = ({
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
  originalClassId,
}) => {
  const isStudent = recipientType === "student";
  const title = isStudent ? "Sua aula foi reagendada" : "Aula reagendada";
  const greetingText = isStudent
    ? "Informamos que uma de suas aulas foi reagendada."
    : "Informamos que uma aula foi reagendada.";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{title}</Heading>
          <Section>
            <Text style={paragraph}>Olá, {recipientName}!</Text>
            <Text style={paragraph}>{greetingText}</Text>

            <Section style={classInfoSection}>
              <Text style={classInfoTitle}>Detalhes da aula:</Text>
              <Text style={classInfoText}>
                <strong>Aula:</strong> {className}
              </Text>
              <Text style={classInfoText}>
                <strong>Data/Hora Original:</strong> {originalDate} às{" "}
                {originalTime}
              </Text>
              <Text style={classInfoText}>
                <strong>Nova Data/Hora:</strong> {newDate} às {newTime}
              </Text>
              <Text style={classInfoText}>
                <strong>Reagendado por:</strong> {rescheduleBy}
              </Text>
              {reason && (
                <Text style={classInfoText}>
                  <strong>Motivo:</strong> {reason}
                </Text>
              )}
            </Section>

            <Text style={paragraph}>
              {isStudent
                ? "Por favor, confirme sua presença na nova data e horário. Caso não possa comparecer, entre em contato conosco o quanto antes."
                : "O aluno foi notificado sobre a mudança. Por favor, atualize sua agenda conforme necessário."}
            </Text>
          </Section>

          <EmailButton href={platformLink}>
            {isStudent ? "Acessar Minhas Aulas" : "Acessar Plataforma"}
          </EmailButton>

          {!isStudent && originalClassId && (
            <>
              <Text style={paragraph}>
                <strong>Quer disponibilizar o horário original para outros alunos?</strong>
                <br />
                Você pode converter o horário original desta aula reagendada em um slot disponível para que outros alunos possam agendá-lo.
              </Text>
              <EmailButton href={`${platformLink}/convert-slot/${originalClassId}`}>
                Tornar Slot Livre
              </EmailButton>
            </>
          )}

          <Text style={paragraph}>
            Se você tiver dúvidas, não hesite em entrar em contato conosco.
          </Text>
          <Text style={paragraph}>
            Atenciosamente,
            <br />
            Equipe Fluency Lab
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// Estilos para o e-mail
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #f0f0f0",
  borderRadius: "4px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#484848",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  padding: "0 40px",
};

const classInfoSection = {
  backgroundColor: "#f8f9fa",
  padding: "20px 40px",
  margin: "20px 0",
  borderRadius: "8px",
  border: "1px solid #e9ecef",
};

const classInfoTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#495057",
  margin: "0 0 15px 0",
};

const classInfoText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#495057",
  margin: "8px 0",
};
