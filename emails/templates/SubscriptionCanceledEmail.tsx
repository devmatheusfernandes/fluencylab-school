import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Img,
} from "@react-email/components";
import { EmailButton } from "../components/EmailButton";

interface SubscriptionCanceledEmailProps {
  studentName: string;
  cancellationDate: Date;
  cancellationReason: string;
  effectiveDate: Date;
  cancellationFee?: number;
  reactivationUrl: string;
}

export const SubscriptionCanceledEmail: React.FC<
  SubscriptionCanceledEmailProps
> = ({
  studentName,
  cancellationDate,
  cancellationReason,
  effectiveDate,
  cancellationFee,
  reactivationUrl,
}) => {
  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formattedFee = cancellationFee
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(cancellationFee / 100)
    : null;

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

          <Heading style={heading}>Assinatura Cancelada</Heading>

          <Text style={paragraph}>
            Olá, <strong>{studentName}</strong>,
          </Text>
          <Text style={paragraph}>
            Confirmamos o cancelamento da sua assinatura na Fluency Lab.
            Lamentamos vê-lo partir, mas respeitamos sua decisão.
          </Text>

          <Section style={detailsSection}>
            <Heading as="h3" style={subHeading}>
              Detalhes do Cancelamento
            </Heading>

            <div style={detailItem}>
              <Text style={detailLabel}>Data do pedido:</Text>
              <Text style={detailValue}>{formatDate(cancellationDate)}</Text>
            </div>

            <div style={detailItem}>
              <Text style={detailLabel}>Vigência final:</Text>
              <Text style={detailValue}>{formatDate(effectiveDate)}</Text>
            </div>

            <div style={detailItem}>
              <Text style={detailLabel}>Motivo:</Text>
              <Text style={detailValue}>{cancellationReason}</Text>
            </div>
          </Section>

          {cancellationFee && (
            <Section style={feeNotice}>
              <Text style={feeText}>
                <strong>Atenção:</strong> Foi gerada uma taxa de cancelamento no
                valor de <strong>{formattedFee}</strong> conforme previsto em
                contrato.
              </Text>
            </Section>
          )}

          <Text style={paragraph}>
            Se você mudar de ideia, ficaremos felizes em recebê-lo de volta!
          </Text>

          <Section style={buttonSection}>
            <EmailButton href={reactivationUrl}>
              Reativar Minha Assinatura
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
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
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

const detailsSection = {
  backgroundColor: "#f8fafc",
  padding: "24px",
  borderRadius: "8px",
  margin: "24px 0",
  border: "1px solid #e2e8f0",
};

const subHeading = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1a1a1a",
  margin: "0 0 16px",
};

const detailItem = { marginBottom: "12px" };
const detailLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};
const detailValue = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "600",
  margin: "4px 0 0",
};

const feeNotice = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fcd34d",
  borderRadius: "8px",
  padding: "16px",
  color: "#92400e",
  fontSize: "14px",
};
const feeText = { margin: 0 };
const buttonSection = { textAlign: "center" as const, marginTop: "32px" };
