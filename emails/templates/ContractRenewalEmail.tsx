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

interface ContractRenewalEmailProps {
  studentName: string;
  previousExpirationDate: string;
  newExpirationDate: string;
  renewalCount: number;
  contractId: string;
  platformLink?: string;
}

export const ContractRenewalEmail: React.FC<ContractRenewalEmailProps> = ({
  studentName,
  previousExpirationDate,
  newExpirationDate,
  renewalCount,
  contractId,
  platformLink = "https://app.fluencylab.com",
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

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

          <Heading style={heading}>🎉 Contrato Renovado!</Heading>

          <Text style={paragraph}>
            Olá, <strong>{studentName}</strong>,
          </Text>
          <Text style={paragraph}>
            Temos o prazer de informar que seu contrato foi renovado
            automaticamente por mais 12 meses.
          </Text>

          <Section style={infoSection}>
            <Heading as="h3" style={infoTitle}>
              Detalhes da Renovação #{renewalCount}
            </Heading>
            <Text style={infoText}>
              <strong>Vencimento anterior:</strong>{" "}
              {formatDate(previousExpirationDate)}
            </Text>
            <Text style={infoText}>
              <strong>Novo vencimento:</strong> {formatDate(newExpirationDate)}
            </Text>
            <Text style={infoText}>
              <strong>Contrato ID:</strong> {contractId}
            </Text>
          </Section>

          <Text style={paragraph}>
            Agradecemos por continuar sua jornada de aprendizado conosco!
          </Text>

          <Section style={buttonSection}>
            <EmailButton href={`${platformLink}/contracts/${contractId}`}>
              Ver Detalhes do Contrato
            </EmailButton>
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
  textAlign: "center" as const,
  color: "#1a1a1a",
  marginBottom: "24px",
};
const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  margin: "16px 0",
};

const infoSection = {
  backgroundColor: "#e6fffa",
  padding: "24px",
  borderRadius: "8px",
  border: "1px solid #81e6d9",
  margin: "24px 0",
};

const infoTitle = { fontSize: "18px", color: "#234e52", margin: "0 0 12px" };
const infoText = { fontSize: "16px", color: "#285e61", margin: "4px 0" };
const buttonSection = { textAlign: "center" as const, marginTop: "32px" };
