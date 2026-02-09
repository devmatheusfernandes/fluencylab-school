"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/ui/header";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getActivePlanId,
  getStudentPlanDetails,
  getStudentArchivedPlans,
  purchaseReplaySession,
} from "@/actions/srsActions";
import { toast } from "sonner";
import {
  History,
  PlayCircle,
  Lock,
  CalendarDays,
  Coins,
  Map,
  CheckCircle,
  Clock,
  Archive,
} from "lucide-react";
import { format, isFuture, isPast, isToday } from "date-fns";
import { useStudentPanel } from "@/hooks/student/useStudentPanel";
import { cn } from "@/lib/utils";

import { StudentProfileHeader } from "@/components/student/StudentProfileHeader";

export default function HistoryPage() {
  const t = useTranslations("HistoryPage");
  const { data: session } = useSession();
  const studentId = session?.user?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [archivedPlans, setArchivedPlans] = useState<any[]>([]);

  // Replay Modal State
  const [replayModalOpen, setReplayModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [replayCost, setReplayCost] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { student, loading: studentLoading } = useStudentPanel(
    studentId as string,
  );
  const userXP = student?.gamification?.currentXP || 0;

  useEffect(() => {
    async function loadData() {
      if (!studentId) return;

      try {
        const pid = await getActivePlanId(studentId);

        // Fetch Active Plan Details
        if (pid) {
          const planData = await getStudentPlanDetails(pid);
          if (planData) {
            // Sort lessons by scheduledDate (ascending) for Roadmap view
            planData.lessons.sort((a: any, b: any) => {
              const dateA = new Date(a.scheduledDate).getTime();
              const dateB = new Date(b.scheduledDate).getTime();
              return dateA - dateB;
            });
            setActivePlan(planData);
          }
        }

        // Fetch Archived Plans
        const archived = await getStudentArchivedPlans(studentId);
        setArchivedPlans(archived);
      } catch (error) {
        console.error("Failed to load plan data", error);
        toast.error("Failed to load plan data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [studentId]);

  const handleDayClick = (lesson: any, day: number) => {
    // Logic for replay
    if (!lesson.scheduledDate) {
      setReplayCost(50);
    } else {
      const scheduledDate = new Date(lesson.scheduledDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - scheduledDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setReplayCost(50 + diffDays);
    }

    setSelectedLesson(lesson);
    setSelectedDay(day);
    setReplayModalOpen(true);
  };

  const handleStartLesson = (lesson: any) => {
    // Navigate to practice page for current lesson
    // Determine the next day index
    const completed = lesson.completedPracticeDays || 0;
    const nextDay = completed < 6 ? completed + 1 : 7;

    router.push(`/hub/student/my-practice?day=${nextDay}`);
  };

  const handleConfirmReplay = async () => {
    if (!activePlan?.id || !selectedLesson || selectedDay === null) return;

    if (userXP < replayCost) {
      toast.error("Insufficient XP points.");
      return;
    }

    setIsPurchasing(true);
    try {
      await purchaseReplaySession(
        activePlan.id,
        selectedDay,
        0,
        selectedLesson.id,
      );

      toast.success("Session unlocked! Starting replay...");
      setReplayModalOpen(false);

      router.push(
        `/hub/student/my-practice?day=${selectedDay}&replay=true&lessonId=${selectedLesson.id}`,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to purchase replay session.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <SpinnerLoading />
      </div>
    );
  }

  // Derived Data for History Tab
  const completedLessons =
    activePlan?.lessons
      ?.filter((l: any) => (l.completedPracticeDays || 0) > 0)
      .sort(
        (a: any, b: any) =>
          new Date(b.scheduledDate).getTime() -
          new Date(a.scheduledDate).getTime(),
      ) || [];

  return (
    <div className="container-padding mx-auto space-y-6 pb-32">
      <Header
        heading="My Learning Plan"
        subheading="Track your progress and review past achievements."
        icon={<Map className="w-8 h-8 text-primary" />}
        backHref="/hub/student/my-notebook"
      />

      <StudentProfileHeader student={student} loading={studentLoading} />

      <Tabs defaultValue="roadmap" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="roadmap">Lesson Plan</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* TAB 1: ROADMAP (LESSON PLAN) */}
        <TabsContent value="roadmap" className="space-y-4">
          {!activePlan ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/30">
              <Map className="w-12 h-12 mb-4 opacity-20" />
              <p>No active plan found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold">{activePlan.name}</h2>
                <p className="text-muted-foreground text-sm">
                  {activePlan.goal}
                </p>
              </div>

              <div className="relative border-l-2 border-muted ml-4 sm:ml-6 space-y-8 py-4">
                {activePlan.lessons?.map((lesson: any, index: number) => {
                  const isCompleted = (lesson.completedPracticeDays || 0) >= 6;
                  const isStarted = (lesson.completedPracticeDays || 0) > 0;
                  const scheduledDate = new Date(lesson.scheduledDate);
                  const isFutureDate =
                    isFuture(scheduledDate) && !isToday(scheduledDate);
                  // Logic: Current if not completed and not future (or is today/past)
                  const isCurrent =
                    !isCompleted &&
                    !isFutureDate &&
                    // It's the first non-completed lesson that is available
                    true;

                  // Refined Logic for "Current/Locked":
                  // A lesson is "Locked" if it's in the future AND the previous lesson isn't done?
                  // Or just purely based on Date? Usually based on Date + Progress.
                  // For now, let's stick to Date for "Future" status visualization.

                  let status: "completed" | "current" | "future" = "future";
                  if (isCompleted) status = "completed";
                  else if (!isFutureDate) status = "current";

                  return (
                    <div key={lesson.id} className="relative pl-8 sm:pl-10">
                      {/* Timeline Dot */}
                      <div
                        className={cn(
                          "absolute -left-[9px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-background transition-colors",
                          status === "completed"
                            ? "border-green-500 bg-green-500 text-white"
                            : status === "current"
                              ? "border-primary bg-primary text-white"
                              : "border-muted-foreground/30 bg-muted",
                        )}
                      >
                        {status === "completed" && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                        {status === "current" && (
                          <PlayCircle className="w-3 h-3" />
                        )}
                        {status === "future" && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>

                      {/* Content Card */}
                      <div
                        className={cn(
                          "rounded-xl border p-4 transition-all",
                          status === "current"
                            ? "bg-card shadow-md border-primary/50 ring-1 ring-primary/20"
                            : status === "completed"
                              ? "bg-muted/20 opacity-80"
                              : "bg-muted/10 opacity-60 grayscale",
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3
                              className={cn(
                                "font-semibold text-lg",
                                status === "future" && "text-muted-foreground",
                              )}
                            >
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <CalendarDays className="w-3 h-3" />
                              <span>{format(scheduledDate, "PPP")}</span>
                              {status !== "future" && (
                                <span
                                  className={cn(
                                    "text-xs font-medium px-2 py-0.5 rounded-full ml-2",
                                    status === "completed"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                                  )}
                                >
                                  {lesson.completedPracticeDays || 0}/6 Days
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {status === "current" && (
                              <Button
                                onClick={() => handleStartLesson(lesson)}
                                size="sm"
                                className="w-full sm:w-auto"
                              >
                                Continue Practice
                              </Button>
                            )}
                            {status === "completed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                className="text-green-600"
                              >
                                Completed
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: HISTORY */}
        <TabsContent value="history" className="space-y-8">
          {/* Section 1: Completed Lessons (Active Plan) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Activity
            </h3>

            {completedLessons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl bg-muted/10">
                No completed lessons yet.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {completedLessons.map((lesson: any) => {
                  const completedDays = lesson.completedPracticeDays || 0;
                  const progressPercentage = Math.min(
                    (completedDays / 6) * 100,
                    100,
                  );

                  return (
                    <AccordionItem
                      key={lesson.id}
                      value={lesson.id}
                      className="border rounded-xl px-4 bg-card shadow-sm transition-all hover:shadow-md data-[state=open]:border-primary/50"
                    >
                      <AccordionTrigger className="hover:no-underline py-5 group">
                        <div className="flex flex-col items-start text-left w-full gap-2">
                          <div className="flex justify-between w-full pr-2 items-start">
                            <span className="font-semibold text-lg leading-tight line-clamp-2">
                              {lesson.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 w-full text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                              <CalendarDays className="w-3 h-3" />
                              {lesson.scheduledDate
                                ? format(new Date(lesson.scheduledDate), "PPP")
                                : "No Date"}
                            </span>
                            <span className="font-medium text-primary">
                              {completedDays}/6 Days
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-secondary rounded-full mt-3 overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500 ease-out"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pt-2 pb-6">
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                          {Array.from({ length: 6 }, (_, i) => i + 1).map(
                            (day) => {
                              const canReplay =
                                day <= (lesson.completedPracticeDays || 0);
                              return (
                                <Button
                                  key={day}
                                  variant="ghost"
                                  className={cn(
                                    "h-20 sm:h-24 flex flex-col gap-2 rounded-xl border-2 transition-all relative overflow-hidden",
                                    canReplay
                                      ? "border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary hover:scale-[1.02] active:scale-95"
                                      : "border-transparent bg-muted/40 opacity-60 cursor-not-allowed",
                                  )}
                                  disabled={!canReplay}
                                  onClick={() =>
                                    canReplay && handleDayClick(lesson, day)
                                  }
                                >
                                  <span
                                    className={cn(
                                      "text-[10px] font-bold uppercase tracking-wider",
                                      canReplay
                                        ? "text-primary"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    Day {day}
                                  </span>
                                  {canReplay ? (
                                    <PlayCircle className="ml-2 w-8 h-8 text-primary animate-in zoom-in duration-300" />
                                  ) : (
                                    <Lock className="ml-2 w-6 h-6 text-muted-foreground" />
                                  )}
                                </Button>
                              );
                            },
                          )}
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-xs text-muted-foreground">
                            Tip: Replaying costs XP based on how old the lesson
                            is.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>

          {/* Section 2: Archived Plans */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Archive className="w-5 h-5 text-muted-foreground" />
              Past Plans
            </h3>

            {archivedPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-xl bg-muted/10">
                No past plans available.
              </div>
            ) : (
              <div className="grid gap-4">
                {archivedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border rounded-xl p-4 bg-card flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <div>
                      <h4 className="font-semibold">{plan.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Completed on{" "}
                        {plan.updatedAt
                          ? format(new Date(plan.updatedAt), "PPP")
                          : "Unknown date"}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium uppercase">
                      {plan.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Replay Confirmation Modal */}
      <Dialog open={replayModalOpen} onOpenChange={setReplayModalOpen}>
        <DialogContent className="sm:max-w-md w-[95%] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="text-yellow-500 w-5 h-5" />
              Unlock Replay
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to replay <strong>Day {selectedDay}</strong> of{" "}
              <span className="text-foreground font-medium">
                {selectedLesson?.title}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-lg space-y-3 my-2 border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Replay Cost</span>
              <span className="font-bold text-lg text-foreground flex items-center gap-1">
                -{replayCost}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  XP
                </span>
              </span>
            </div>
            <div className="h-px bg-border w-full" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Your Balance
              </span>
              <span
                className={cn(
                  "font-bold text-lg flex items-center gap-1",
                  userXP < replayCost ? "text-red-500" : "text-green-600",
                )}
              >
                {userXP}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  XP
                </span>
              </span>
            </div>
          </div>

          {userXP < replayCost && (
            <div className="bg-red-500/10 text-red-600 text-xs p-2 rounded text-center font-medium">
              You don't have enough XP for this action.
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setReplayModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReplay}
              disabled={isPurchasing || userXP < replayCost}
              className={cn(
                "w-full sm:w-auto text-white transition-all",
                isPurchasing
                  ? "opacity-80"
                  : "bg-indigo-600 hover:bg-indigo-700",
              )}
            >
              {isPurchasing ? (
                <>
                  <SpinnerLoading className="w-4 h-4 mr-2 text-white border-white" />
                  Unlocking...
                </>
              ) : (
                "Confirm & Play"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
