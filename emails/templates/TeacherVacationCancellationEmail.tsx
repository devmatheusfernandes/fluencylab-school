import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
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

export default async function TeacherVacationCancellationEmail({
  studentName = "Aluno",
  teacherName = "Professor",
  vacationStartDate = "01/01/2023",
  vacationEndDate = "10/01/2023",
  affectedClasses = [],
  platformLink = "https://app.fluencylab.com",
}: TeacherVacationCancellationEmailProps) {
  const previewText = `Férias do professor ${teacherName} canceladas - Suas aulas foram reagendadas`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Férias Canceladas</Heading>
          <Text style={text}>Olá {studentName},</Text>
          <Text style={text}>
            Informamos que o período de férias do professor {teacherName} foi
            cancelado. As seguintes aulas que estavam marcadas como "Férias do
            Professor" foram reagendadas para o status "Agendada":
          </Text>

          <Section style={vacationInfoSection}>
            <Text style={vacationInfoTitle}>Período de férias cancelado:</Text>
            <Text style={vacationInfoText}>
              <strong>De:</strong> {vacationStartDate}
            </Text>
            <Text style={vacationInfoText}>
              <strong>Até:</strong> {vacationEndDate}
            </Text>
          </Section>

          <Section style={classesSection}>
            <Text style={classesTitle}>Aulas reagendadas:</Text>
            {affectedClasses.map((cls, index) => (
              <Text key={index} style={classItem}>
                • {cls.date} às {cls.time} - {cls.language}
              </Text>
            ))}
          </Section>

          <Text style={text}>
            Suas aulas voltaram ao status normal de "Agendada". Se você já
            reagendou essas aulas, não é necessário tomar nenhuma ação
            adicional.
          </Text>

          <Text style={text}>
            Se tiver dúvidas ou precisar de ajuda, nossa equipe está à
            disposição para ajudá-lo.
          </Text>

          <EmailButton href={platformLink}>Acessar Minhas Aulas</EmailButton>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#ffffff",
};

const container = {
  paddingLeft: "12px",
  paddingRight: "12px",
  margin: "0 auto",
};

const h1 = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const text = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "16px",
  lineHeight: "26px",
};

const vacationInfoSection = {
  backgroundColor: "#f0f0f0",
  padding: "16px",
  borderRadius: "8px",
  margin: "24px 0",
};

const vacationInfoTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  marginBottom: "12px",
  color: "#333",
};

const vacationInfoText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#555",
  margin: "4px 0",
};

const classesSection = {
  margin: "24px 0",
};

const classesTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  marginBottom: "12px",
  color: "#333",
};

const classItem = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#555",
  margin: "8px 0",
};
