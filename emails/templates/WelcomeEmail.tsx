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
          <Section style={header}>
            <Img
              src={
                "https://raw.githubusercontent.com/devmatheusfernandes/fluencylab-school/refs/heads/main/public/brand/Logo.png"
              }
              alt="Fluency Lab"
              style={logo}
            />
          </Section>

          <Heading style={heading}>Bem-vindo(a) à Fluency Lab! 🎉</Heading>

          <Text style={paragraph}>
            Olá, <strong>{name}</strong>!
          </Text>
          <Text style={paragraph}>
            {studentInfo
              ? `Uma conta foi criada para o aluno(a) ${studentInfo}. Você já pode acessar a plataforma para gerenciar as aulas.`
              : `Sua conta foi criada com sucesso! Estamos muito felizes em ter você conosco.`}
          </Text>

          <Text style={paragraph}>
            Para começar, defina sua senha segura clicando abaixo:
          </Text>

          <Section style={buttonSection}>
            <EmailButton href={actionLink}>Definir Minha Senha</EmailButton>
          </Section>
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
const buttonSection = { textAlign: "center" as const, marginTop: "32px" };
