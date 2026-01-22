
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { planRepository } from "@/repositories/planRepository";

export default async function MyPracticePage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const activePlan = await planRepository.findActivePlanByStudent(sessionUser.id);

  if (!activePlan) {
    // Handle user with no plan (redirect or show message)
    // For now, redirect back to notebook
    redirect("/hub/student/my-notebook?error=no_plan");
  }

  return (
    <PracticeSession planId={activePlan.id} />
  );
}
