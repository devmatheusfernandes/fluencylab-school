import { Container } from "@/components/ui/container";
import { StudentProfileSurvey } from "@/components/students/survey/StudentProfileSurvey";

export default function CreateStudentProfilePage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <StudentProfileSurvey />
    </div>
  );
}
