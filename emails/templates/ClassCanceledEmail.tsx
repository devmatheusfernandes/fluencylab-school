import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Img,
} from "@react-email/components";
import { EmailButton } from "../components/EmailButton";

interface ClassCanceledEmailProps {
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
}

export const ClassCanceledEmail: React.FC<ClassCanceledEmailProps> = ({
  recipientName,
  recipientType,
  className,
  scheduledDate,
  scheduledTime,
  canceledBy,
  reason,
  makeupCreditGranted,
  platformLink,
  classId,
}) => {
  const isStudent = recipientType === "student";
  const title = isStudent ? "Aula Cancelada" : "Aula Cancelada";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
              alt="Fluency Lab"
              style={logo}
            />
          </Section>

          <Heading style={heading}>{title}</Heading>

          <Text style={paragraph}>
            Olá, <strong>{recipientName}</strong>.
          </Text>
          <Text style={paragraph}>
            Informamos que a aula <strong>{className}</strong> agendada para{" "}
            {scheduledDate} às {scheduledTime} foi cancelada por {canceledBy}.
          </Text>

          {reason && (
            <Text style={paragraph}>
              <strong>Motivo:</strong> {reason}
            </Text>
          )}

          {isStudent && makeupCreditGranted && (
            <Section style={alertSection}>
              <Text style={alertText}>
                O crédito desta aula foi devolvido à sua conta. Você pode
                agendar uma nova aula a qualquer momento.
              </Text>
            </Section>
          )}

          {!isStudent && classId && (
            <Section style={buttonSection}>
              <EmailButton href={`${platformLink}/convert-slot/${classId}`}>
                Tornar Horário Disponível
              </EmailButton>
            </Section>
          )}

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

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  borderRadius: "8px",
};
const header = { textAlign: "center" as const, marginBottom: "32px" };
const logo = { height: "40px", margin: "0 auto" };
const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1a1a1a",
  textAlign: "center" as const,
  marginBottom: "24px",
};
const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  margin: "16px 0",
};
const alertSection = {
  backgroundColor: "#f0f9ff",
  padding: "16px",
  borderRadius: "8px",
  margin: "24px 0",
};
const alertText = { color: "#0369a1", fontSize: "15px", margin: 0 };
const buttonSection = { textAlign: "center" as const, marginTop: "24px" };
