import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SchedulingService } from "@/services/learning/schedulingService";
import AdminNotebookViewer from "@/components/admin/AdminNotebookViewer";
import { NoResults } from "@/components/ui/no-results";
import { getTranslations } from "next-intl/server";

const schedulingService = new SchedulingService();

interface AdminNotebookPageProps {
  params: Promise<{ classId: string; notebookId: string }>;
}

export default async function AdminNotebookPage({
  params,
}: AdminNotebookPageProps) {
  const t = await getTranslations("AdminClassDetails");
  const session = await getServerSession(authOptions);
  const { classId, notebookId } = await params;

  if (!session?.user?.id) {
     return <NoResults customMessage={{ withoutSearch: t("notFound") }} />;
  }

  // Fetch class details to get student ID
  const classDetails = await schedulingService.getClassDetails(
    classId,
    session.user.id
  );

  if (!classDetails || !classDetails.student?.id) {
    return (
      <NoResults
        customMessage={{ withoutSearch: t("notFound") }}
        className="py-10"
      />
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-black">
      <AdminNotebookViewer
        studentId={classDetails.student.id}
        notebookId={notebookId}
      />
    </div>
  );
}
