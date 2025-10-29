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
          <Heading style={heading}>Bem-vindo(a) à Fluency Lab!</Heading>
          <Section>
            <Text style={paragraph}>Olá, {name}!</Text>
            <Text style={paragraph}>
              {studentInfo 
                ? `Uma conta foi criada${studentInfo}. Como responsável, você terá acesso à plataforma para acompanhar o progresso e gerenciar as aulas. Para começar, por favor, defina uma senha segura para a conta clicando no botão abaixo:`
                : `Sua conta em nossa plataforma foi criada com sucesso. Para começar, por favor, defina uma senha segura para sua conta clicando no botão abaixo:`
              }
            </Text>
          </Section>
          <EmailButton href={actionLink}>Definir Minha Senha</EmailButton>
          <Text style={paragraph}>
            Se você não criou esta conta, por favor, ignore este e-mail.
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
