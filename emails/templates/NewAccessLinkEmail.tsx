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

interface NewAccessLinkEmailProps {
  actionLink: string;
}

export const NewAccessLinkEmail: React.FC<NewAccessLinkEmailProps> = ({
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

          <Heading style={heading}>Seu novo link chegou! 🔒</Heading>

          <Text style={paragraph}>Olá!</Text>

          <Text style={paragraph}>
            Vimos que o seu link anterior expirou ou que você solicitou um novo
            acesso. Não se preocupe, os links de criação de senha expiram
            naturalmente por questões de segurança.
          </Text>

          <Text style={paragraph}>
            Para garantir seu acesso à Fluency Lab, clique no botão abaixo e
            defina sua senha:
          </Text>

          <Section style={buttonSection}>
            <EmailButton href={actionLink}>Definir Minha Senha</EmailButton>
          </Section>

          <Text style={footer}>
            Lembrando: por segurança, este link é válido por tempo limitado. Se
            você não solicitou este link, pode ignorar este e-mail com
            segurança.
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
const footer = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#8898aa",
  margin: "32px 0 0 0",
  textAlign: "center" as const,
};
const buttonSection = { textAlign: "center" as const, marginTop: "32px" };
