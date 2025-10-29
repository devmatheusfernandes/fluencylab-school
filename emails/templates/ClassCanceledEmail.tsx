import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
} from "@react-email/components";
import { EmailButton } from "../components/EmailButton";

interface ClassCanceledEmailProps {
  recipientName: string;
  recipientType: "student" | "teacher";
  className: string;
  scheduledDate: string;
  scheduledTime: string;
  canceledBy: string;
  reason?: string;
  creditRefunded?: boolean;
  makeupCreditGranted?: boolean; // New property for makeup credit
  platformLink: string;
  classId?: string; // ID da aula para conversão em slot livre
}

export const ClassCanceledEmail: React.FC<ClassCanceledEmailProps> = ({
  recipientName,
  recipientType,
  className,
  scheduledDate,
  scheduledTime,
  canceledBy,
  reason,
  creditRefunded,
  makeupCreditGranted, // New property
  platformLink,
  classId,
}) => {
  const isStudent = recipientType === "student";
  const title = isStudent ? "Sua aula foi cancelada" : "Aula cancelada";
  const greetingText = isStudent
    ? "Informamos que uma de suas aulas foi cancelada."
    : "Informamos que uma aula foi cancelada.";

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{title}</Heading>
          <Section>
            <Text style={paragraph}>Olá, {recipientName}!</Text>
            <Text style={paragraph}>{greetingText}</Text>

            <Section style={classInfoSection}>
              <Text style={classInfoTitle}>Detalhes da aula cancelada:</Text>
              <Text style={classInfoText}>
                <strong>Aula:</strong> {className}
              </Text>
              <Text style={classInfoText}>
                <strong>Data/Hora:</strong> {scheduledDate} às {scheduledTime}
              </Text>
              <Text style={classInfoText}>
                <strong>Cancelado por:</strong> {canceledBy}
              </Text>
              {reason && (
                <Text style={classInfoText}>
                  <strong>Motivo:</strong> {reason}
                </Text>
              )}
              {isStudent && creditRefunded !== undefined && (
                <Text style={classInfoText}>
                  <strong>Crédito devolvido:</strong>{" "}
                  {creditRefunded ? "Sim" : "Não"}
                </Text>
              )}
              {isStudent && makeupCreditGranted && (
                <Text style={classInfoText}>
                  <strong>Crédito de reposição:</strong> Concedido (válido por
                  45 dias)
                </Text>
              )}
            </Section>

            <Text style={paragraph}>
              {isStudent
                ? creditRefunded
                  ? "Seu crédito foi devolvido e você pode agendar uma nova aula quando desejar."
                  : "Como o cancelamento foi feito fora do prazo permitido, o crédito não foi devolvido. Entre em contato conosco se tiver dúvidas."
                : "O aluno foi notificado sobre o cancelamento. O horário ficou disponível novamente em sua agenda."}
            </Text>

            {isStudent && makeupCreditGranted && (
              <Text style={paragraph}>
                <strong>Crédito de reposição concedido:</strong> Você recebeu um
                crédito especial para reposição desta aula. Este crédito é
                válido por 45 dias e pode ser usado para agendar uma nova aula
                de reposição.
              </Text>
            )}

            {isStudent && (
              <Text style={paragraph}>
                Para agendar uma nova aula, acesse a plataforma e escolha um
                novo horário disponível.
              </Text>
            )}
          </Section>

          <EmailButton href={platformLink}>
            {isStudent ? "Agendar Nova Aula" : "Acessar Plataforma"}
          </EmailButton>

          {!isStudent && classId && (
            <>
              <Text style={paragraph}>
                <strong>Quer disponibilizar este horário para outros alunos?</strong>
                <br />
                Você pode converter esta aula cancelada em um slot disponível para que outros alunos possam agendá-la.
              </Text>
              <EmailButton href={`${platformLink}/convert-slot/${classId}`}>
                Tornar Slot Livre
              </EmailButton>
            </>
          )}

          <Text style={paragraph}>
            Se você tiver dúvidas, não hesite em entrar em contato conosco.
          </Text>
          <Text style={paragraph}>
            Atenciosamente,
            <br />
            Equipe Fluency Lab
          </Text>
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
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#484848",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  padding: "0 40px",
};

const classInfoSection = {
  backgroundColor: "#f8f9fa",
  padding: "20px 40px",
  margin: "20px 0",
  borderRadius: "8px",
  border: "1px solid #e9ecef",
};

const classInfoTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#495057",
  margin: "0 0 15px 0",
};

const classInfoText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#495057",
  margin: "8px 0",
};
