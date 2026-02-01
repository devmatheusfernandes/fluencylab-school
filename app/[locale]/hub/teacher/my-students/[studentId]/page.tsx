"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useStudentPanel } from "@/hooks/student/useStudentPanel";
import { ClassStatus } from "@/types/classes/class";

import TasksCard from "@/components/teacher/TaskCard";
import NotebooksCard from "@/components/teacher/NotebooksCard";
import ClassesCard from "@/components/teacher/ClassesCard";
import PlanCalendarCard from "@/components/teacher/PlanCalendarCard";

import { Container } from "@/components/ui/container";
import ErrorAlert from "@/components/ui/error-alert";
import { ContainerCard } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton component for the student panel
const StudentPanelSkeleton = () => (
  <ContainerCard className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {/* Notebooks card skeleton */}
    <Skeleton className=" rounded-xl p-4 min-h-[300px] flex flex-col gap-4">
      <Skeleton className=" h-10 rounded-lg" />
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className=" p-3 flex items-center justify-between rounded-lg"
          >
            <div className="space-y-2 w-full max-w-[70%]">
              <Skeleton className=" h-4 w-3/4 rounded" />
              <Skeleton className=" h-3 w-1/2 rounded" />
            </div>
            <Skeleton className=" h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </Skeleton>

    {/* Tasks card skeleton */}
    <Skeleton className=" rounded-xl p-4 min-h-[300px] flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Skeleton className=" h-6 w-1/3 rounded" />
        <Skeleton className=" h-6 w-12 rounded" />
      </div>
      <Skeleton className=" h-2 w-full rounded-full" />
      <Skeleton className=" h-10 rounded-lg" />
      <div className="space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className=" h-5 w-5 rounded shrink-0" />
            <Skeleton className=" h-4 w-full rounded" />
          </div>
        ))}
      </div>
    </Skeleton>

    {/* Classes card skeleton */}
    <Skeleton className=" rounded-xl p-4 min-h-[400px] flex flex-col gap-4">
      <div className="flex gap-2">
        <Skeleton className=" h-10 flex-1 rounded-lg" />
        <Skeleton className=" h-10 flex-1 rounded-lg" />
      </div>
      <div className="space-y-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className=" p-3 rounded-lg flex justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className=" h-4 w-24 rounded" />
              <Skeleton className=" h-3 w-16 rounded" />
            </div>
            <Skeleton className=" h-8 w-32 rounded" />
          </div>
        ))}
      </div>
    </Skeleton>

    {/* Plan card skeleton */}
    <Skeleton className=" rounded-xl p-4 min-h-[400px] flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center">
          <Skeleton className=" h-5 w-5 rounded" />
          <Skeleton className=" h-5 w-32 rounded" />
        </div>
        <Skeleton className=" h-8 w-8 rounded" />
      </div>
      <div className="flex gap-2">
        <Skeleton className=" h-10 flex-1 rounded-lg" />
        <Skeleton className=" h-10 flex-1 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className=" p-3 rounded-lg space-y-2">
            <div className="flex justify-between">
              <Skeleton className=" h-4 w-3/4 rounded" />
              <Skeleton className=" h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </Skeleton>
  </ContainerCard>
);

export default function StudentDetailsPanel() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { data: session } = useSession();
  const {
    student,
    notebooks,
    tasks,
    classes,
    plan,
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
    fetchPlan,
  } = useStudentPanel(id);

  // Handle updating class status
  const handleUpdateClassStatus = async (
    classId: string,
    newStatus: ClassStatus,
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
    feedback: string,
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
    <ContainerCard className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <NotebooksCard
        student={student}
        notebooks={notebooks}
        onCreateNotebook={createNotebookAction}
        userRole={session?.user?.role}
        onAddTask={addTaskAction}
        loading={loading}
      />

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

      <PlanCalendarCard 
        plan={plan} 
        loading={loading} 
        studentId={id} 
        onRefresh={fetchPlan}
      />
    </ContainerCard>
  );
}
