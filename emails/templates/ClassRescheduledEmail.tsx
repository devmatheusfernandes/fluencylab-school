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
  originalClassId?: string;
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

          <Heading style={heading}>Aula Reagendada</Heading>

          <Text style={paragraph}>
            Olá, <strong>{recipientName}</strong>.
          </Text>
          <Text style={paragraph}>
            A aula <strong>{className}</strong> foi reagendada por{" "}
            {rescheduleBy}.
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>De:</strong> {originalDate} às {originalTime}
            </Text>
            <Text style={infoText}>
              <strong>Para:</strong> {newDate} às {newTime}
            </Text>
          </Section>

          {reason && (
            <Text style={paragraph}>
              <strong>Motivo:</strong> {reason}
            </Text>
          )}

          {!isStudent && originalClassId && (
            <Section style={buttonSection}>
              <EmailButton
                href={`${platformLink}/convert-slot/${originalClassId}`}
              >
                Liberar Horário Original
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
const infoBox = {
  backgroundColor: "#fff3cd",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #ffeeba",
  margin: "20px 0",
};
const infoText = { color: "#856404", fontSize: "16px", margin: "4px 0" };
const buttonSection = { textAlign: "center" as const, marginTop: "24px" };
