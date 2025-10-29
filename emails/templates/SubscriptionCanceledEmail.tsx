// emails/templates/SubscriptionCanceledEmail.tsx
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

interface SubscriptionCanceledEmailProps {
  studentName: string;
  cancellationDate: Date;
  cancellationReason: string;
  effectiveDate: Date;
  cancellationFee?: number;
  reactivationUrl: string;
}

export function SubscriptionCanceledEmail({
  studentName,
  cancellationDate,
  cancellationReason,
  effectiveDate,
  cancellationFee,
  reactivationUrl,
}: SubscriptionCanceledEmailProps) {
  const formattedCancellationDate = cancellationDate.toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  const formattedEffectiveDate = effectiveDate.toLocaleDateString("pt-BR", {
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
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
              alt="Fluency Lab"
              style={logo}
            />
          </Section>

          <Section style={content}>
            <Heading style={h1}>Assinatura Cancelada</Heading>

            <Text style={text}>
              Olá <strong>{studentName}</strong>,
            </Text>

            <Text style={text}>
              Confirmamos o cancelamento da sua assinatura na Fluency Lab.
              Lamentamos vê-lo partir, mas respeitamos sua decisão.
            </Text>

            <Section style={cancellationDetails}>
              <Heading style={h2}>Detalhes do Cancelamento</Heading>

              <Row style={detailRow}>
                <Column style={detailLabel}>Data do cancelamento:</Column>
                <Column style={detailValue}>{formattedCancellationDate}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Último dia de acesso:</Column>
                <Column style={detailValue}>{formattedEffectiveDate}</Column>
              </Row>

              <Row style={detailRow}>
                <Column style={detailLabel}>Motivo informado:</Column>
                <Column style={detailValue}>{cancellationReason}</Column>
              </Row>

              {cancellationFee && (
                <Row style={detailRow}>
                  <Column style={detailLabel}>Taxa de cancelamento:</Column>
                  <Column style={detailValue}>{formattedFee}</Column>
                </Row>
              )}
            </Section>

            <Text style={text}>
              <strong>O que acontece agora:</strong>
            </Text>

            <Section style={timelineSection}>
              <Text style={timelineItem}>
                ✅ Você pode continuar usando a plataforma até{" "}
                <strong>{formattedEffectiveDate}</strong>
              </Text>
              <Text style={timelineItem}>
                📚 Suas aulas agendadas até essa data serão mantidas
              </Text>
              <Text style={timelineItem}>
                🔒 Após essa data, o acesso será suspenso
              </Text>
              <Text style={timelineItem}>
                💾 Seus dados ficam salvos por 12 meses para possível reativação
              </Text>
            </Section>

            {cancellationFee && (
              <Section style={feeNotice}>
                <Text style={feeText}>
                  <strong>Taxa de Cancelamento:</strong> Como sua assinatura
                  tinha menos de 6 meses, foi aplicada uma taxa de cancelamento
                  de {formattedFee}. Você receberá um código PIX para pagamento
                  em breve.
                </Text>
              </Section>
            )}

            <Text style={text}>
              Valorizamos muito o tempo que você passou conosco e o feedback que
              compartilhou. Suas sugestões nos ajudam a melhorar continuamente.
            </Text>

            <Section style={buttonContainer}>
              <EmailButton href={reactivationUrl}>
                Reativar Assinatura
              </EmailButton>
            </Section>

            <Text style={comeBakcText}>
              Mudou de ideia? Você pode reativar sua assinatura a qualquer
              momento nos próximos 12 meses e manter todo seu histórico e
              progresso.
            </Text>

            <Hr style={hr} />

            <Text style={feedbackText}>
              <strong>Sua opinião é importante!</strong>
              <br />
              Gostaríamos muito de saber como podemos melhorar. Se puder,
              compartilhe sua experiência conosco respondendo a uma breve
              pesquisa.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Obrigado por fazer parte da família Fluency Lab.
              <br />
              Esperamos vê-lo novamente em breve! 🌟
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

const cancellationDetails = {
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

const timelineSection = {
  backgroundColor: "#f0f9ff",
  border: "1px solid #bae6fd",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const timelineItem = {
  color: "#0369a1",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "8px 0",
};

const feeNotice = {
  backgroundColor: "#fef3c7",
  border: "1px solid #fcd34d",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const feeText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const comeBakcText = {
  color: "#525252",
  fontSize: "15px",
  lineHeight: "22px",
  textAlign: "center" as const,
  fontStyle: "italic",
  margin: "16px 0",
};

const feedbackText = {
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
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "center" as const,
  fontWeight: "500",
};

export default SubscriptionCanceledEmail;
