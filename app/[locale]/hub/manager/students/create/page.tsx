import { Container } from "@/components/ui/container";
import { StudentProfileSurvey } from "@/components/students/survey/StudentProfileSurvey";

export default function CreateStudentProfilePage() {
  return (
    <div className="container-padding space-y-6">
      <StudentProfileSurvey />
    </div>
  );
}
