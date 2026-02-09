import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { planRepository } from "@/repositories/financial/planRepository";

export default async function MyPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const activePlan = await planRepository.findActivePlanByStudent(
    sessionUser.id,
  );

  if (!activePlan) {
    // Handle user with no plan (redirect or show message)
    // For now, redirect back to notebook
    redirect("/hub/student/my-notebook?error=no_plan");
  }

  // Parse Query Params
  const params = await searchParams;
  const dayParam = params.day ? parseInt(params.day as string) : undefined;
  const isReplay = params.replay === "true";
  const lessonId = params.lessonId as string | undefined;

  return (
    <PracticeSession
      planId={activePlan.id}
      dayOverride={dayParam}
      isReplay={isReplay}
      lessonId={lessonId}
    />
  );
}
