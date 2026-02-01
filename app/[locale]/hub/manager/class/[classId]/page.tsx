import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SchedulingService } from "@/services/learning/schedulingService";
import ClassDetailsView from "@/components/admin/ClassDetailsView";
import { NoResults } from "@/components/ui/no-results";
import { getTranslations } from "next-intl/server";

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
  const { classId: pathClassId } = await params;
  const sp = await searchParams;
  const classId = sp?.aula || sp?.classId || sp?.id || pathClassId;

  // Busca os dados da aula no servidor
  const classDetails = await schedulingService.getClassDetails(
    classId,
    session!.user.id
  );

  if (!classDetails) {
    return (
      <NoResults
        customMessage={{ withoutSearch: t("notFound") }}
        className="py-10"
      />
    );
  }

  return <ClassDetailsView classDetails={classDetails} />;
}
