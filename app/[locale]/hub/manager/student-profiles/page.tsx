import { UserAdminRepository } from "@/repositories/user.admin.repository";
import { StudentProfileForm } from "@/components/students/StudentProfileForm";
import { Container } from "@/components/ui/container";
import { Header } from "@/components/ui/header";
import { getTranslations } from "next-intl/server";

export default async function CreateStudentProfilePage() {
  const t = await getTranslations("StudentProfile");
  const userAdminRepo = new UserAdminRepository();
  
  const students = await userAdminRepo.findUsersByRole("student");
  const guarded = await userAdminRepo.findUsersByRole("guarded_student");
  const users = [...students, ...guarded];
  
  return (
    <Container className="p-4 md:p-6 space-y-6">
      <Header 
        heading={t("createTitle")} 
        subheading={t("createDescription")}
      />
      <div className="mt-8">
        <StudentProfileForm users={JSON.parse(JSON.stringify(users))} />
      </div>
    </Container>
  )
}
