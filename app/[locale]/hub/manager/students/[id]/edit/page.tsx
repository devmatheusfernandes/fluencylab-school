import { Container } from "@/components/ui/container";
import { StudentProfileSurvey } from "@/components/students/survey/StudentProfileSurvey";
import { getStudentProfileById } from "@/actions/studentProfile";
import { notFound } from "next/navigation";

export default async function EditStudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getStudentProfileById(id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="container-padding space-y-6">
      <StudentProfileSurvey initialData={profile} isEditing />
    </div>
  );
}
