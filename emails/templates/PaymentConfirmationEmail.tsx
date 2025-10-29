// emails/templates/PaymentConfirmationEmail.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Heading,
  Text,
  Button,
  Hr,
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

export function PaymentConfirmationEmail({
  studentName,
  amount,
  paymentDate,
  paymentMethod,
  nextBillingDate,
  receiptUrl,
}: PaymentConfirmationEmailProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  const formattedPaymentDate = paymentDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedNextBilling = nextBillingDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const paymentMethodText =
    paymentMethod === "pix" ? "PIX" : "Cartão de Crédito";

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

          <Section style={content}>
            <Heading style={h1}>Pagamento Confirmado! 🎉</Heading>

            <Text style={text}>
              Olá <strong>{studentName}</strong>,
            </Text>

            <Text style={text}>
              Recebemos seu pagamento com sucesso! Sua mensalidade está em dia e
              você pode continuar aproveitando todas as aulas e recursos da
              Fluency Lab.
            </Text>

            <Section style={paymentDetails}>
              <Heading style={h2}>Detalhes do Pagamento</Heading>

              <Row style={detailRow}>
                <Column style={detailLabel}>Valor:</Column>
                <Column style={detailValue}>{formattedAmount}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Data do pagamento:</Column>
                <Column style={detailValue}>{formattedPaymentDate}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Método de pagamento:</Column>
                <Column style={detailValue}>{paymentMethodText}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Próximo vencimento:</Column>
                <Column style={detailValue}>{formattedNextBilling}</Column>
              </Row>
            </Section>

            {receiptUrl && (
              <Section style={buttonContainer}>
                <EmailButton href={receiptUrl}>Baixar Comprovante</EmailButton>
              </Section>
            )}

            <Text style={text}>
              Agora você pode continuar agendando suas aulas normalmente. Se
              tiver alguma dúvida, nossa equipe está sempre disponível para
              ajudar.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Este e-mail é um comprovante automático de pagamento da Fluency
              Lab.
              <br />
              Se você tem dúvidas, entre em contato conosco.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
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
};

const header = {
  padding: "32px 24px",
  textAlign: "center" as const,
};

const logo = {
  height: "40px",
  margin: "0 auto",
};

const content = {
  padding: "0 24px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "600",
  lineHeight: "36px",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "0 0 16px",
};

const text = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const paymentDetails = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailRow = {
  margin: "8px 0",
};

const detailLabel = {
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "500",
  width: "40%",
};

const detailValue = {
  color: "#1a1a1a",
  fontSize: "14px",
  fontWeight: "600",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "20px",
  textAlign: "center" as const,
};

export default PaymentConfirmationEmail;
