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

interface WelcomeEmailProps {
  name: string;
  actionLink: string;
  studentInfo?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  actionLink,
  studentInfo,
}) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Bem-vindo(a) à Fluency Lab! 🎉</Heading>
          <Section style={section}>
            <Text style={greeting}>Olá, {name}!</Text>
            <Text style={paragraph}>
              {studentInfo 
                ? `Uma conta foi criada${studentInfo}. Como responsável, você terá acesso à plataforma para acompanhar o progresso e gerenciar as aulas. Para começar, por favor, defina uma senha segura para a conta clicando no botão abaixo:`
                : `Sua conta em nossa plataforma foi criada com sucesso. Para começar, por favor, defina uma senha segura para sua conta clicando no botão abaixo:`
              }
            </Text>
          </Section>
          <Section style={buttonSection}>
            <EmailButton href={actionLink}>Definir Minha Senha</EmailButton>
          </Section>
          <Section style={footerSection}>
            <Text style={footerText}>
              Se você não criou esta conta, por favor, ignore este e-mail.
            </Text>
            <Text style={signature}>
              Atenciosamente,
              <br />
              <strong>Equipe Fluency Lab</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Estilos para o e-mail
const main = {
  backgroundColor: "#f4f7fa",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 20px",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "48px 40px",
  maxWidth: "600px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
};

const heading = {
  fontSize: "32px",
  fontWeight: "700",
  textAlign: "center" as const,
  color: "#1a1a1a",
  marginBottom: "32px",
  marginTop: "0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "28px",
  color: "#4a5568",
  margin: "16px 0",
};

const section = {
  margin: "32px 0",
};

const greeting = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#2d3748",
  marginBottom: "16px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "40px 0",
};

const footerSection = {
  marginTop: "48px",
  paddingTop: "32px",
  borderTop: "1px solid #e2e8f0",
};

const footerText = {
  fontSize: "14px",
  color: "#718096",
  lineHeight: "24px",
  margin: "16px 0",
};

const signature = {
  fontSize: "16px",
  color: "#2d3748",
  lineHeight: "26px",
  marginTop: "24px",
};