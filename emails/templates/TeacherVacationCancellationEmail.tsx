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
  Preview,
} from "@react-email/components";
import { EmailButton } from "../components/EmailButton";

interface TeacherVacationCancellationEmailProps {
  studentName: string;
  teacherName: string;
  vacationStartDate: string;
  vacationEndDate: string;
  affectedClasses: {
    date: string;
    time: string;
    language: string;
  }[];
  platformLink: string;
}

export const TeacherVacationCancellationEmail: React.FC<
  TeacherVacationCancellationEmailProps
> = ({
  studentName = "Aluno",
  teacherName = "Professor",
  vacationStartDate,
  vacationEndDate,
  affectedClasses = [],
  platformLink,
}) => {
  const previewText = `Férias do professor ${teacherName} canceladas - Suas aulas foram reagendadas`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logo.png`}
              alt="Fluency Lab"
              style={logo}
            />
          </Section>

          <Heading style={heading}>Férias Canceladas</Heading>

          <Text style={paragraph}>
            Olá, <strong>{studentName}</strong>!
          </Text>
          <Text style={paragraph}>
            Informamos que as férias do professor <strong>{teacherName}</strong>
            , previstas para o período de {vacationStartDate} a{" "}
            {vacationEndDate}, foram canceladas.
          </Text>
          <Text style={paragraph}>
            Com isso, as aulas que haviam sido afetadas foram mantidas ou
            reagendadas para seus horários originais:
          </Text>

          {affectedClasses.length > 0 && (
            <Section style={infoSection}>
              <Text style={infoTitle}>Aulas Confirmadas:</Text>
              {affectedClasses.map((aula, index) => (
                <Text key={index} style={infoItem}>
                  • {aula.date} às {aula.time} ({aula.language})
                </Text>
              ))}
            </Section>
          )}

          <Section style={buttonSection}>
            <EmailButton href={platformLink}>Acessar Minhas Aulas</EmailButton>
          </Section>

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

// Estilos Padronizados
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
  borderRadius: "4px",
  border: "1px solid #f0f0f0",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  height: "40px",
  margin: "0 auto",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#1a1a1a",
  margin: "0 0 24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  margin: "16px 0",
};

const infoSection = {
  backgroundColor: "#f0f9ff",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  border: "1px solid #bae6fd",
};

const infoTitle = {
  fontWeight: "bold",
  color: "#0369a1",
  marginBottom: "12px",
};

const infoItem = {
  margin: "4px 0",
  color: "#0c4a6e",
  fontSize: "14px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};
