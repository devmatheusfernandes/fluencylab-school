import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SchedulingService } from "@/services/learning/schedulingService";
import ClassDetailsView from "@/components/admin/ClassDetailsView";
import { NoResults } from "@/components/ui/no-results";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

const schedulingService = new SchedulingService();

interface ClassPageProps {
  params: Promise<{ classId: string }>;
  searchParams?: { [key: string]: string | undefined };
}

export default async function ClassPage({
  params,
  searchParams,
}: ClassPageProps) {
  const t = await getTranslations("AdminClassDetails");
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  const { classId: pathClassId } = await params;
  const sp = await searchParams;
  const classId = sp?.aula || sp?.classId || sp?.id || pathClassId;

  let classDetails;
  let hasError = false;

  try {
    // Busca os dados da aula no servidor
    classDetails = await schedulingService.getClassDetails(
      classId,
      session.user.id,
    );
  } catch (error) {
    console.error("Error fetching class details:", error);
    hasError = true;
  }

  if (hasError) {
    return (
      <NoResults
        customMessage={{
          withoutSearch: "Erro ao carregar aula. Verifique suas permissões.",
        }}
        className="py-10"
      />
    );
  }

  if (!classDetails) {
    return (
      <NoResults
        customMessage={{ withoutSearch: t("notFound") }}
        className="py-10"
      />
    );
  }

  return (
    <ClassDetailsView
      classDetails={classDetails}
      backHref="/hub/manager/students"
    />
  );
}
