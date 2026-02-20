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

interface ResetPasswordEmailProps {
  actionLink: string;
}

export const ResetPasswordEmail: React.FC<ResetPasswordEmailProps> = ({
  actionLink,
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

          <Heading style={heading}>Redefinição de senha 🔒</Heading>

          <Text style={paragraph}>Olá!</Text>

          <Text style={paragraph}>
            Recebemos uma solicitação para redefinir a senha da sua conta na
            Fluency Lab.
          </Text>

          <Text style={paragraph}>
            Se foi você quem solicitou, clique no botão abaixo para criar uma
            nova senha segura:
          </Text>

          <Section style={buttonSection}>
            <EmailButton href={actionLink}>Redefinir Minha Senha</EmailButton>
          </Section>

          <Text style={paragraph}>
            Se você não solicitou essa redefinição, pode ignorar este e-mail com
            segurança. Sua senha atual continuará válida.
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

const buttonSection = { textAlign: "center" as const, marginTop: "32px" };

