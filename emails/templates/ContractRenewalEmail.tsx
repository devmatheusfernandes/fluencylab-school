import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
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
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
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
            <Heading style={heading}>
              🎉 Seu contrato foi renovado automaticamente!
            </Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>
              Olá <strong>{studentName}</strong>,
            </Text>

            <Text style={paragraph}>
              Temos o prazer de informar que seu contrato com a Fluency Lab foi 
              renovado automaticamente por mais 6 meses. Agora você pode continuar 
              aproveitando todos os nossos serviços sem interrupção!
            </Text>

            <Section style={renewalInfoSection}>
              <Heading style={renewalInfoTitle}>
                📋 Detalhes da Renovação
              </Heading>
              
              <Text style={renewalInfoText}>
                <strong>Data de vencimento anterior:</strong> {formatDate(previousExpirationDate)}
              </Text>
              
              <Text style={renewalInfoText}>
                <strong>Nova data de vencimento:</strong> {formatDate(newExpirationDate)}
              </Text>
              
              <Text style={renewalInfoText}>
                <strong>Número de renovações:</strong> {renewalCount}ª renovação
              </Text>
              
              <Text style={renewalInfoText}>
                <strong>ID do contrato:</strong> {contractId}
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>O que isso significa para você:</strong>
            </Text>

            <Section style={benefitsSection}>
              <Text style={benefitItem}>
                ✅ Continuidade total dos seus estudos
              </Text>
              <Text style={benefitItem}>
                ✅ Acesso a todos os recursos da plataforma
              </Text>
              <Text style={benefitItem}>
                ✅ Suporte pedagógico contínuo
              </Text>
              <Text style={benefitItem}>
                ✅ Acompanhamento personalizado do seu progresso
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>Importante:</strong> Se você deseja cancelar seu contrato, 
              lembre-se de que pode fazê-lo até 30 dias antes da data de vencimento. 
              Acesse sua área do aluno para gerenciar suas preferências de renovação.
            </Text>

            <Section style={buttonContainer}>
              <EmailButton
                href={`${platformLink}/hub/plataforma/student/contracts`}>email</EmailButton>
            </Section>

            <Hr style={hr} />

            <Text style={footerText}>
              Se você tiver alguma dúvida sobre sua renovação ou precisar de 
              assistência, nossa equipe está sempre disponível para ajudar.
            </Text>

            <Text style={footerText}>
              <strong>Equipe Fluency Lab</strong><br />
              Transformando seu futuro através do inglês
            </Text>
          </Section>
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
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  textAlign: "center" as const,
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#2d3748",
  margin: "0 0 16px 0",
};

const content = {
  padding: "0 40px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#4a5568",
  margin: "0 0 16px 0",
};

const renewalInfoSection = {
  backgroundColor: "#e6fffa",
  padding: "24px",
  margin: "24px 0",
  borderRadius: "8px",
  border: "1px solid #81e6d9",
};

const renewalInfoTitle = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#234e52",
  margin: "0 0 16px 0",
};

const renewalInfoText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#234e52",
  margin: "8px 0",
};

const benefitsSection = {
  backgroundColor: "#f7fafc",
  padding: "20px",
  margin: "20px 0",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
};

const benefitItem = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#2d3748",
  margin: "8px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footerText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#718096",
  textAlign: "center" as const,
  margin: "16px 0",
};

export default ContractRenewalEmail;