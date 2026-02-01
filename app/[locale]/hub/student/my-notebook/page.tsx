"use client";
import { useSession } from "next-auth/react";
import { useStudentPanel } from "@/hooks/student/useStudentPanel";
import NotebooksCard from "@/components/teacher/NotebooksCard";
import { LearningPath } from "@/components/notebook/LearningPath";
import { StatsDashboard } from "@/components/notebook/StatsDashboard";
import { useEffect, useState } from "react";
import {
  getStudentLearningStats,
  getActivePlanId,
} from "@/actions/srsActions";
import ErrorAlert from "@/components/ui/error-alert";
import { Header } from "@/components/ui/header";
import { useTranslations } from "next-intl";
import TasksCard from "@/components/teacher/TaskCard";
import { useGoogleCalendarSync } from "@/hooks/student/useGoogleCalendarSync";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { WordOfTheDayModal } from "@/components/word-of-the-day/word-of-the-day-modal";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Caderno() {
  const t = useTranslations("StudentNotebook");
  const { data: session } = useSession();
  const studentId = session?.user?.id;

  const { student, notebooks, tasks, loading, error, updateTask } =
    useStudentPanel(studentId as string);

  const [stats, setStats] = useState({
    reviewedToday: 0,
    dueToday: 0,
    totalLearned: 0,
    currentDay: 1,
    daysSinceClass: 7,
    hasActiveLesson: true,
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (studentId) {
        try {
          const planId = await getActivePlanId(studentId);
          if (planId) {
            const data = await getStudentLearningStats(planId);
            setStats(data);
          } else {
            setStats({
              reviewedToday: 0,
              dueToday: 0,
              totalLearned: 0,
              currentDay: 1,
              daysSinceClass: 7,
              hasActiveLesson: false,
            });
          }
        } catch (err) {
          console.error("Failed to load stats", err);
        } finally {
          setStatsLoading(false);
        }
      }
    }
    fetchStats();
  }, [studentId]);

  const { isSyncing: isSyncingWithGoogleCalendar, syncWithGoogleCalendar } =
    useGoogleCalendarSync(studentId as string);

  if (loading) return <SpinnerLoading />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="p-4 md:p-6 h-full">
      <Header
        heading={t("title")}
        subheading={t("subtitle")}
        className="mb-2"
        icon={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsWordModalOpen(true)}
            title="Word of the Day"
          >
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </Button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 order-1 lg:order-1 flex flex-col max-h-[calc(100vh-180px)]">
          <NotebooksCard
            student={student}
            notebooks={notebooks}
            onCreateNotebook={async () => false}
            userRole="student"
            onAddTask={undefined}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-3 order-3 lg:order-2 flex flex-col gap-4 max-h-[calc(100vh-180px)] overflow-auto">
          <div className="flex-none flex flex-col">
            {statsLoading ? (
              <SpinnerLoading />
            ) : (
              <StatsDashboard
                reviewedToday={stats.reviewedToday}
                dueToday={stats.dueToday}
                totalLearned={stats.totalLearned}
              />
            )}
          </div>
          <TasksCard
            tasks={tasks}
            onAddTask={undefined}
            onUpdateTask={updateTask}
            onDeleteTask={undefined}
            onDeleteAllTasks={undefined}
            onSyncWithGoogleCalendar={syncWithGoogleCalendar}
            isSyncingWithGoogleCalendar={isSyncingWithGoogleCalendar}
          />
        </div>

        <div className="lg:col-span-4 order-2 lg:order-3">
          <div className="card-base h-full max-h-[calc(100vh-180px)] overflow-auto">
            <h3 className="text-lg font-bold text-center mt-3 text-primary">
              Missions
            </h3>
            {statsLoading ? (
              <div className="flex justify-center p-4">
                <SpinnerLoading />
              </div>
            ) : (
              <LearningPath
                currentDay={stats.currentDay}
                daysSinceClass={stats.daysSinceClass}
                hasActiveLesson={stats.hasActiveLesson}
              />
            )}
          </div>
        </div>
      </div>
      <WordOfTheDayModal
        language={student?.languages?.[0] || "en"}
        isOpen={isWordModalOpen}
        onOpenChange={setIsWordModalOpen}
      />
    </div>
  );
}
