"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useStudentPanel } from "@/hooks/useStudentPanel";
import { ClassStatus } from "@/types/classes/class";

import TasksCard from "@/components/teacher/TaskCard";
import NotebooksCard from "@/components/teacher/NotebooksCard";
import ClassesCard from "@/components/teacher/ClassesCard";
import StudentInfoCard from "@/components/teacher/StudentInfoCard";

import { Container } from "@/components/ui/container";
import { SubContainer } from "@/components/ui/sub-container";
import ErrorAlert from "@/components/ui/error-alert";
import { ContainerCard } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

// Skeleton component for the student panel
const StudentPanelSkeleton = () => (
  <Container className="flex flex-col sm:flex-row gap-2">
    <div className="w-full sm:w-fit h-full flex flex-col gap-2">
      <SubContainer className="skeleton-base flex flex-row items-center justify-start !py-6 gap-2">
        {/* Avatar skeleton */}
        <Skeleton className="skeleton-sub w-16 h-16 rounded-xl" />

        {/* Action cards skeletons */}
        <div className="flex gap-2">
          {[...Array(3)].map((_, index) => (
            <Skeleton
              key={index}
              className="skeleton-sub w-16 h-16 rounded-lg"
            />
          ))}
        </div>
      </SubContainer>

      {/* Notebooks card skeleton */}
      <Skeleton className="skeleton-base rounded-xl p-4 min-h-[300px]">
        <div className="flex flex-col gap-3">
          {/* Search bar skeleton */}
          <Skeleton className="skeleton-sub h-10 rounded-lg mb-4" />

          {/* Notebook items skeletons */}
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="skeleton-sub p-2 flex flex-row items-start justify-between rounded-lg overflow-hidden"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="skeleton-base h-5 rounded w-3/4" />
                <Skeleton className="skeleton-base h-3 rounded w-1/2" />
              </div>
              <Skeleton className="skeleton-base h-5 w-5 rounded" />
            </div>
          ))}
        </div>
      </Skeleton>
    </div>

    {/* Tasks card skeleton */}
    <Skeleton className="skeleton-base rounded-xl p-4 flex-1">
      <div className="flex flex-col gap-3">
        {/* Header with progress bar skeleton */}
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="skeleton-sub h-6 rounded w-1/4" />
          <Skeleton className="skeleton-sub h-6 rounded w-10" />
        </div>
        <Skeleton className="skeleton-sub h-4 rounded w-full mb-4" />

        {/* Task input skeleton */}
        <Skeleton className="skeleton-sub h-12 rounded-lg mb-4" />

        {/* Task items skeletons */}
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="skeleton-sub flex items-center justify-between p-3 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Skeleton className="skeleton-base h-5 w-5 rounded" />
              <Skeleton className="h-5 rounded w-32" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="skeleton-sub h-5 w-5 rounded" />
              <Skeleton className="skeleton-sub h-5 w-5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </Skeleton>

    {/* Classes card skeleton */}
    <Skeleton className="skeleton-base rounded-xl p-4 flex-1">
      <div className="flex flex-col gap-3">
        {/* Month/year selector skeleton */}
        <div className="flex gap-2 mb-4">
          <Skeleton className="skeleton-sub h-10 rounded-lg flex-1" />
          <Skeleton className="skeleton-sub h-10 rounded-lg flex-1" />
        </div>

        {/* Class items skeletons */}
        {[...Array(5)].map((_, index) => (
          <div key={index} className="skeleton-sub rounded-lg p-3 sm:p-4 ">
            <div className="flex flex-col gap-3">
              <div className="flex flex-row w-full justify-between gap-2">
                <div className="flex flex-col space-y-2">
                  <Skeleton className="skeleton-base h-5 rounded w-24" />
                  <Skeleton className="skeleton-base h-4 rounded w-16" />
                </div>
                <Skeleton className="skeleton-base h-8 w-full xs:w-32 sm:w-40 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Skeleton>
  </Container>
);

export default function StudentDetailsPanel() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const {
    student,
    notebooks,
    tasks,
    classes,
    loading,
    error,
    fetchClasses,
    addTask: addTaskAction,
    createNotebook: createNotebookAction,
    updateClassStatus,
    updateClassFeedback,
    updateTask: updateTaskAction,
    deleteTask: deleteTaskAction,
    deleteAllTasks: deleteAllTasksAction,
  } = useStudentPanel(id);

  // Handle updating class status
  const handleUpdateClassStatus = async (
    classId: string,
    newStatus: ClassStatus
  ) => {
    const success = await updateClassStatus(classId, newStatus);
    if (success) {
      // Refresh classes to ensure UI is up to date
      fetchClasses(new Date().getMonth(), new Date().getFullYear());
    }
  };

  // Handle updating class feedback
  const handleUpdateClassFeedback = async (
    classId: string,
    feedback: string
  ) => {
    const success = await updateClassFeedback(classId, feedback);
    if (success) {
      // Refresh classes to ensure UI is up to date
      fetchClasses(new Date().getMonth(), new Date().getFullYear());
    }
  };

  if (loading) {
    return <StudentPanelSkeleton />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <ContainerCard className="flex flex-col sm:flex-row gap-4">
      <div className="w-full flex flex-col gap-2">
        <StudentInfoCard isMobile={isMobile} student={student} />

        <NotebooksCard
          student={student}
          notebooks={notebooks}
          onCreateNotebook={createNotebookAction}
          userRole={session?.user?.role}
          onAddTask={addTaskAction}
          loading={loading}
        />
      </div>

      <TasksCard
        tasks={tasks}
        onAddTask={addTaskAction}
        onUpdateTask={updateTaskAction}
        onDeleteTask={deleteTaskAction}
        onDeleteAllTasks={deleteAllTasksAction}
        userRole={session?.user?.role}
      />

      <ClassesCard
        classes={classes}
        onUpdateClassStatus={handleUpdateClassStatus}
        onUpdateClassFeedback={handleUpdateClassFeedback}
        onFetchClasses={fetchClasses}
        loading={loading}
      />
    </ContainerCard>
  );
}
