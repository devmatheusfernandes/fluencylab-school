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
  getLearnedItemsDetails,
} from "@/actions/srsActions";
import ErrorAlert from "@/components/ui/error-alert";
import { Header } from "@/components/ui/header";
import { useTranslations } from "next-intl";
import TasksCard from "@/components/teacher/TaskCard";
import { useGoogleCalendarSync } from "@/hooks/student/useGoogleCalendarSync";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";
import { WordOfTheDayModal } from "@/components/word-of-the-day/word-of-the-day-modal";
import { LearnedItemsModal } from "@/components/notebook/LearnedItemsModal";
import { Star, CircleCheckIcon, NotebookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";
import BreadcrumbActionIcon from "@/components/shared/Breadcrum/BreadcrumbActionIcon";
import MobileNotebooksList from "@/components/student/MobileNotebooksList";
import MobileTasksList from "@/components/student/MobileTasksList";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsStandalone } from "@/hooks/ui/useIsStandalone";
import { useIsMobile } from "@/hooks/ui/useMobile";
import Link from "next/link";
import { HistoryIcon } from "@/public/animated/history";

export default function Caderno() {
  const t = useTranslations("StudentNotebook");
  const tNotebooks = useTranslations("NotebooksCard");
  const tTasks = useTranslations("TasksCard");
  const { data: session } = useSession();
  const studentId = session?.user?.id;
  const isStandalone = useIsStandalone();
  const isMobile = useIsMobile();

  const { student, notebooks, tasks, loading, error, updateTask, plan } =
    useStudentPanel(studentId as string);

  const [stats, setStats] = useState({
    reviewedToday: 0,
    dueToday: 0,
    totalLearned: 0,
    currentDay: 1,
    daysSinceClass: 7,
    hasActiveLesson: true,
  });

  const userXP = student?.gamification?.currentXP || 0;

  const [statsLoading, setStatsLoading] = useState(true);
  const [activePlanIdState, setActivePlanIdState] = useState<string | null>(
    null,
  );
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [isNotebooksDrawerOpen, setIsNotebooksDrawerOpen] = useState(false);
  const [isTasksDrawerOpen, setIsTasksDrawerOpen] = useState(false);
  const effectivePlanId = activePlanIdState || plan?.id;

  const [isLearnedModalOpen, setIsLearnedModalOpen] = useState(false);
  const [learnedItems, setLearnedItems] = useState<any[]>([]);
  const [learnedItemsLoading, setLearnedItemsLoading] = useState(false);

  const handleLearnedClick = async () => {
    setIsLearnedModalOpen(true);
    if (learnedItems.length === 0 && studentId) {
      setLearnedItemsLoading(true);
      try {
        const planId = await getActivePlanId(studentId);
        if (planId) {
          const items = await getLearnedItemsDetails(planId);
          setLearnedItems(items);
        }
      } catch (error) {
        console.error("Failed to load learned items", error);
      } finally {
        setLearnedItemsLoading(false);
      }
    }
  };

  useEffect(() => {
    async function fetchStats() {
      if (studentId) {
        try {
          const planId = await getActivePlanId(studentId);
          if (planId) {
            setActivePlanIdState(planId);
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
    <div className="container-padding h-full">
      <Header
        heading={t("title")}
        subheading={t("subtitle")}
        className="mb-2"
        icon={
          <div className="flex items-center gap-2">
            <BreadcrumbActions>
              <BreadcrumbActionIcon
                icon={NotebookIcon}
                onClick={() => setIsNotebooksDrawerOpen(true)}
              />
              <BreadcrumbActionIcon
                icon={CircleCheckIcon}
                onClick={() => setIsTasksDrawerOpen(true)}
              />
            </BreadcrumbActions>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsWordModalOpen(true)}
              title="Word of the Day"
            >
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div
          className={
            !isStandalone
              ? "lg:col-span-5 order-1 lg:order-1 flex flex-col max-h-[calc(101vh-180px)]"
              : "hidden"
          }
        >
          <NotebooksCard
            student={student}
            notebooks={notebooks}
            onCreateNotebook={async () => false}
            userRole="student"
            onAddTask={undefined}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-3 order-1 lg:order-2 flex flex-col gap-4 max-h-[calc(101vh-180px)] overflow-auto">
          <div className="flex-none flex flex-col">
            {statsLoading ? (
              <SpinnerLoading />
            ) : (
              <StatsDashboard
                reviewedToday={stats.reviewedToday}
                dueToday={stats.dueToday}
                totalLearned={stats.totalLearned}
                onLearnedClick={handleLearnedClick}
              />
            )}
          </div>
          <div className={!isStandalone ? "block" : "hidden"}>
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
        </div>

        <div
          className={
            isMobile
              ? "lg:col-span-4 order-2 lg:order-3 pb-4"
              : "lg:col-span-4 order-2 lg:order-3"
          }
        >
          <div
            className={
              isStandalone
                ? "card-base h-full max-h-[calc(92vh-180px)] overflow-auto"
                : "card-base h-full max-h-[calc(101vh-180px)] overflow-auto"
            }
          >
            <div className="flex flex-row justify-between items-center mt-3 px-4">
              <div />
              <span className="text-lg font-bold text-primary">Missions</span>
              <Link
                className="text-muted-foreground hover:text-primary"
                href="/hub/student/my-history"
              >
                <HistoryIcon size={20} />
              </Link>
            </div>
            {statsLoading ? (
              <div className="flex justify-center p-4">
                <SpinnerLoading />
              </div>
            ) : (
              <LearningPath
                currentDay={stats.currentDay}
                daysSinceClass={stats.daysSinceClass}
                hasActiveLesson={stats.hasActiveLesson}
                userXP={userXP}
                planId={effectivePlanId}
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

      <LearnedItemsModal
        isOpen={isLearnedModalOpen}
        onClose={() => setIsLearnedModalOpen(false)}
        items={learnedItems}
        loading={learnedItemsLoading}
      />

      <Drawer
        open={isNotebooksDrawerOpen}
        onOpenChange={setIsNotebooksDrawerOpen}
      >
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>{tNotebooks("title")}</DrawerTitle>
            <DrawerDescription className="sr-only">
              List of notebooks
            </DrawerDescription>
          </DrawerHeader>
          <MobileNotebooksList notebooks={notebooks} />
        </DrawerContent>
      </Drawer>

      <Drawer open={isTasksDrawerOpen} onOpenChange={setIsTasksDrawerOpen}>
        <DrawerContent className="h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>{tTasks("title")}</DrawerTitle>
            <DrawerDescription className="sr-only">
              List of tasks
            </DrawerDescription>
          </DrawerHeader>
          <MobileTasksList tasks={tasks} onUpdateTask={updateTask} />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
