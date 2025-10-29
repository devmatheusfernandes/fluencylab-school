// emails/templates/PaymentOverdueEmail.tsx
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
  Hr,
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

export function PaymentOverdueEmail({
  studentName,
  amount,
  dueDate,
  overdueDays,
  pixCode,
  pixExpiresAt,
  paymentUrl,
}: PaymentOverdueEmailProps) {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);

  const formattedDueDate = dueDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedPixExpiry = pixExpiresAt?.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
            <Heading style={h1}>Mensalidade em Atraso ⚠️</Heading>

            <Text style={text}>
              Olá <strong>{studentName}</strong>,
            </Text>

            <Text style={text}>
              Notamos que sua mensalidade está em atraso há{" "}
              <strong>{overdueDays} dia(s)</strong>. Para continuar aproveitando
              suas aulas na Fluency Lab, é necessário regularizar o pagamento.
            </Text>

            <Section style={urgentNotice}>
              <Text style={urgentText}>
                ⚠️ <strong>Ação necessária:</strong> Sua conta pode ser suspensa
                se o pagamento não for realizado em breve.
              </Text>
            </Section>

            <Section style={paymentDetails}>
              <Heading style={h2}>Detalhes do Pagamento</Heading>

              <Row style={detailRow}>
                <Column style={detailLabel}>Valor em atraso:</Column>
                <Column style={detailValue}>{formattedAmount}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Data de vencimento:</Column>
                <Column style={detailValue}>{formattedDueDate}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Dias em atraso:</Column>
                <Column style={detailValue}>{overdueDays} dia(s)</Column>
              </Row>
            </Section>

            {pixCode && (
              <Section style={pixSection}>
                <Heading style={h2}>Código PIX para Pagamento</Heading>

                <Text style={text}>
                  Use o código PIX abaixo para efetuar o pagamento
                  imediatamente:
                </Text>

                <Section style={pixCodeContainer}>
                  <Text style={pixCodeText}>{pixCode}</Text>
                </Section>

                {formattedPixExpiry && (
                  <Text style={expiryText}>
                    ⏰ Este código PIX expira em:{" "}
                    <strong>{formattedPixExpiry}</strong>
                  </Text>
                )}
              </Section>
            )}

            <Section style={buttonContainer}>
              <EmailButton href={paymentUrl}>Pagar Agora</EmailButton>
            </Section>

            <Text style={text}>
              Assim que o pagamento for confirmado, você receberá um e-mail de
              confirmação e poderá continuar agendando suas aulas normalmente.
            </Text>

            <Hr style={hr} />

            <Text style={supportText}>
              <strong>Precisa de ajuda?</strong>
              <br />
              Nossa equipe está disponível para esclarecer dúvidas sobre seu
              pagamento. Entre em contato conosco pelo WhatsApp ou e-mail.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Este é um lembrete automático da Fluency Lab.
              <br />
              Se você já efetuou o pagamento, pode desconsiderar este e-mail.
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
  color: "#dc2626",
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

const urgentNotice = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const urgentText = {
  color: "#dc2626",
  fontSize: "16px",
  fontWeight: "500",
  lineHeight: "24px",
  margin: "0",
  textAlign: "center" as const,
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

const pixSection = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const pixCodeContainer = {
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
};

const pixCodeText = {
  fontFamily: "monospace",
  fontSize: "14px",
  lineHeight: "20px",
  wordBreak: "break-all" as const,
  color: "#1a1a1a",
  margin: "0",
};

const expiryText = {
  color: "#1d4ed8",
  fontSize: "14px",
  fontWeight: "500",
  textAlign: "center" as const,
  margin: "8px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const supportText = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "center" as const,
  margin: "24px 0",
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

export default PaymentOverdueEmail;
