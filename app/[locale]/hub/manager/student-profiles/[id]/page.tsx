import { getStudentProfileById } from "@/actions/studentProfile";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function StudentProfileDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getStudentProfileById(id);
  const t = await getTranslations("StudentProfileList");

  if (!profile) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hub/manager/student-profiles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/hub/manager/student-profiles/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            {t("edit")}
          </Link>
        </Button>
      </div>

      {/* Content */}
      <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Status da Conta</h2>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Associação:</span>
            <Badge variant={profile.studentId ? "default" : "secondary"}>
              {profile.studentId ? t("associated") : t("loose")}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
