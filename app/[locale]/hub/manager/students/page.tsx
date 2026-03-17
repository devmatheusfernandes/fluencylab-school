import { Header } from "@/components/ui/header";
import { StudentProfileList } from "@/components/students/StudentProfileList";
import { getStudentProfiles } from "@/actions/studentProfile";
import { getTranslations } from "next-intl/server";

export default async function StudentProfilesPage() {
  const t = await getTranslations("StudentProfileList");
  const profiles = await getStudentProfiles();
  const formattedProfiles = profiles.map((profile) => ({
    ...profile,
    createdAt: new Date(profile.createdAt).toISOString(),
    updatedAt: new Date(profile.updatedAt).toISOString(),
  }));

  return (
    <div className="container-padding space-y-6">
      <Header
        heading={t("title")}
        subheading="Gerencie os perfis pedagógicos dos alunos."
      />
      <StudentProfileList initialProfiles={formattedProfiles} />
    </div>
  );
}
