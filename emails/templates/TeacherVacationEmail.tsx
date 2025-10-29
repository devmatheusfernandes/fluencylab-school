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

interface AffectedClass {
  date: string;
  time: string;
  language: string;
}

interface TeacherVacationEmailProps {
  studentName: string;
  teacherName: string;
  vacationStartDate: string;
  vacationEndDate: string;
  affectedClasses: AffectedClass[];
  platformLink: string;
}

export const TeacherVacationEmail: React.FC<TeacherVacationEmailProps> = ({
  studentName,
  teacherName,
  vacationStartDate,
  vacationEndDate,
  affectedClasses,
  platformLink,
}) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Suas aulas foram afetadas por férias do professor
          </Heading>
          <Section>
            <Text style={paragraph}>Olá, {studentName}!</Text>
            <Text style={paragraph}>
              Informamos que seu professor {teacherName} estará de férias e
              algumas de suas aulas foram afetadas.
            </Text>

            <Section style={vacationInfoSection}>
              <Text style={vacationInfoTitle}>Período de férias:</Text>
              <Text style={vacationInfoText}>
                <strong>De:</strong> {vacationStartDate}
              </Text>
              <Text style={vacationInfoText}>
                <strong>Até:</strong> {vacationEndDate}
              </Text>
            </Section>

            <Section style={classesSection}>
              <Text style={classesTitle}>Aulas afetadas:</Text>
              {affectedClasses.map((cls, index) => (
                <Text key={index} style={classItem}>
                  • {cls.date} às {cls.time} - {cls.language}
                </Text>
              ))}
            </Section>

            <Text style={paragraph}>
              Suas aulas foram automaticamente marcadas como canceladas devido
              às férias do professor. Você pode reagendar essas aulas escolhendo
              novos horários disponíveis na plataforma.
            </Text>

            <Text style={paragraph}>
              Nossa equipe também estará disponível para ajudá-lo a encontrar
              horários alternativos ou arranjar aulas com outros professores
              disponíveis.
            </Text>
          </Section>

          <EmailButton href={platformLink}>Reagendar Minhas Aulas</EmailButton>

          <Text style={paragraph}>
            Se você tiver dúvidas ou precisar de assistência para reagendar suas
            aulas, não hesite em entrar em contato conosco.
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

const vacationInfoSection = {
  backgroundColor: "#fff3cd",
  padding: "20px 40px",
  margin: "20px 0",
  borderRadius: "8px",
  border: "1px solid #ffeaa7",
};

const vacationInfoTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#856404",
  margin: "0 0 15px 0",
};

const vacationInfoText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#856404",
  margin: "8px 0",
};

const classesSection = {
  backgroundColor: "#f8f9fa",
  padding: "20px 40px",
  margin: "20px 0",
  borderRadius: "8px",
  border: "1px solid #e9ecef",
};

const classesTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#495057",
  margin: "0 0 15px 0",
};

const classItem = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#495057",
  margin: "8px 0",
};
