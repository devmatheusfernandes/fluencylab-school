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

interface PaymentConfirmationEmailProps {
  studentName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: "pix" | "credit_card";
  nextBillingDate: Date;
  receiptUrl?: string;
}

export const PaymentConfirmationEmail: React.FC<
  PaymentConfirmationEmailProps
> = ({
  studentName,
  amount,
  paymentDate,
  paymentMethod,
  nextBillingDate,
  receiptUrl,
}) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);
  const formattedDate = paymentDate.toLocaleDateString("pt-BR");
  const formattedNext = nextBillingDate.toLocaleDateString("pt-BR");

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

          <Heading style={heading}>Pagamento Confirmado! 🚀</Heading>

          <Text style={paragraph}>
            Olá, <strong>{studentName}</strong>.
          </Text>
          <Text style={paragraph}>Recebemos seu pagamento com sucesso.</Text>

          <Section style={detailsBox}>
            <Text style={detailText}>
              <strong>Valor:</strong> {formattedAmount}
            </Text>
            <Text style={detailText}>
              <strong>Data:</strong> {formattedDate}
            </Text>
            <Text style={detailText}>
              <strong>Método:</strong>{" "}
              {paymentMethod === "pix" ? "PIX" : "Cartão de Crédito"}
            </Text>
            <Text style={detailText}>
              <strong>Próxima fatura:</strong> {formattedNext}
            </Text>
          </Section>

          {receiptUrl && (
            <Section style={buttonSection}>
              <EmailButton href={receiptUrl}>Ver Recibo</EmailButton>
            </Section>
          )}
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
const detailsBox = {
  backgroundColor: "#f0fdf4",
  padding: "24px",
  borderRadius: "8px",
  border: "1px solid #bbf7d0",
  margin: "24px 0",
};
const detailText = { color: "#166534", fontSize: "16px", margin: "8px 0" };
const buttonSection = { textAlign: "center" as const, marginTop: "24px" };
