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

interface PaymentOverdueEmailProps {
  studentName: string;
  amount: number;
  dueDate: Date;
  overdueDays: number;
  pixCode?: string;
  pixExpiresAt?: Date;
  paymentUrl: string;
}

export const PaymentOverdueEmail: React.FC<PaymentOverdueEmailProps> = ({
  studentName,
  amount,
  dueDate,
  overdueDays,
  pixCode,
  paymentUrl,
}) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);
  const formattedDueDate = dueDate.toLocaleDateString("pt-BR");

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

          <Heading style={heading}>Pagamento Pendente ⚠️</Heading>

          <Text style={paragraph}>
            Olá, <strong>{studentName}</strong>.
          </Text>
          <Text style={paragraph}>
            Notamos que sua mensalidade no valor de{" "}
            <strong>{formattedAmount}</strong>, vencida em {formattedDueDate},
            está em atraso há {overdueDays} dias.
          </Text>

          <Section style={actionBox}>
            <Text style={paragraph}>
              Evite o bloqueio do seu acesso regularizando agora:
            </Text>
            <EmailButton href={paymentUrl}>Pagar Agora</EmailButton>
          </Section>

          {pixCode && (
            <Section style={pixBox}>
              <Text style={pixLabel}>Código PIX Copia e Cola:</Text>
              <Text style={pixCodeText}>{pixCode}</Text>
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
const actionBox = { textAlign: "center" as const, margin: "32px 0" };
const pixBox = {
  backgroundColor: "#f3f4f6",
  padding: "16px",
  borderRadius: "8px",
  marginTop: "24px",
  wordBreak: "break-all" as const,
};
const pixLabel = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "8px",
  fontWeight: "bold",
};
const pixCodeText = {
  fontFamily: "monospace",
  fontSize: "12px",
  color: "#374151",
};
