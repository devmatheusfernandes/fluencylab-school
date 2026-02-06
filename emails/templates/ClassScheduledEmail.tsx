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

interface ClassScheduledEmailProps {
  recipientName: string;
  recipientType: "student" | "teacher";
  otherPartyName: string; // Teacher name if recipient is student, Student name if recipient is teacher
  date: string;
  time: string;
  platformLink: string;
}

export const ClassScheduledEmail: React.FC<ClassScheduledEmailProps> = ({
  recipientName,
  recipientType,
  otherPartyName,
  date,
  time,
  platformLink,
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

          <Heading style={heading}>Nova Aula Agendada</Heading>

          <Text style={paragraph}>
            Olá, <strong>{recipientName}</strong>.
          </Text>

          <Text style={paragraph}>
            Uma nova aula foi agendada com <strong>{otherPartyName}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Data:</strong> {date}
            </Text>
            <Text style={infoText}>
              <strong>Horário:</strong> {time}
            </Text>
          </Section>

          <Section style={buttonSection}>
            <EmailButton href={platformLink}>
              {isStudent ? "Ver Minhas Aulas" : "Ver Minha Agenda"}
            </EmailButton>
          </Section>

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
  backgroundColor: "#e3f2fd",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #bbdefb",
  margin: "20px 0",
};
const infoText = { color: "#0d47a1", fontSize: "16px", margin: "4px 0" };
const buttonSection = { textAlign: "center" as const, marginTop: "24px" };
