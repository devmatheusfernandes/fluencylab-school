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
} from "@react-email/components";

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
}) => {
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

          <Heading style={heading}>Aviso de Férias 🏖️</Heading>

          <Text style={paragraph}>
            Olá, <strong>{studentName}</strong>!
          </Text>
          <Text style={paragraph}>
            Seu professor <strong>{teacherName}</strong> estará de férias entre{" "}
            {vacationStartDate} e {vacationEndDate}.
          </Text>

          <Section style={infoBox}>
            <Text style={infoTitle}>Aulas Afetadas:</Text>
            {affectedClasses.map((cls, i) => (
              <Text key={i} style={infoItem}>
                • {cls.date} às {cls.time}
              </Text>
            ))}
          </Section>

          <Text style={paragraph}>
            Não se preocupe, seus créditos estão seguros!
          </Text>
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
const infoBox = {
  backgroundColor: "#fff7ed",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #ffedd5",
  margin: "24px 0",
};
const infoTitle = {
  fontWeight: "bold",
  color: "#9a3412",
  marginBottom: "12px",
};
const infoItem = { color: "#c2410c", margin: "4px 0" };
