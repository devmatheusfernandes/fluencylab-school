"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/features/tasks/useTasks";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { TaskDialog } from "./TaskDialog";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Plus, LayoutGrid, List, Calendar } from "lucide-react";
import { Task, TaskStatus } from "@/types/tasks/task";
import { TaskKanbanView } from "./TaskKanbanView";
import { TaskWeekView } from "./TaskWeekView";
import { TaskList } from "./TaskList";
import { useTranslations } from "next-intl";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";

export function TaskDashboard() {
  const {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskSubscription,
  } = useTasks();
  const t = useTranslations("Tasks");
  const { user } = useCurrentUser();
  const [view, setView] = useState<"board" | "list" | "week">("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const handleCreate = () => {
    setEditingTask(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleDateChange = async (taskId: string, newDate: string) => {
    await updateTask(taskId, { dueDate: newDate });
  };

  const handleStatusToggle = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    await updateTask(task.id, { status: newStatus });
  };

  const handleSave = async (data: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data as any);
    }
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleToggleSubscription = async (taskId: string) => {
    if (user) {
      await toggleTaskSubscription(taskId, user.id);
    }
  };

  return (
    <div className="container-padding space-y-6">
      <Header
        heading="Tarefas"
        className="items-center"
        icon={
          <BreadcrumbActions>
            <div className="flex items-center gap-2">
              <div className="bg-muted p-1 rounded-md flex">
                <Button
                  variant={view === "board" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("board")}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("week")}
                  className="h-8 w-8 p-0"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setView("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleCreate}
                className="h-10 w-10 p-0 sm:w-auto sm:px-4"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">
                  {t("dashboard.newTask")}
                </span>
              </Button>
            </div>
          </BreadcrumbActions>
        }
      />

      <div className="flex-1 overflow-hidden min-h-[500px]">
        {view === "board" && (
          <TaskKanbanView
            tasks={tasks}
            onTaskClick={handleEdit}
            onStatusChange={handleStatusChange}
            isLoading={loading}
          />
        )}
        {view === "week" && (
          <TaskWeekView
            tasks={tasks}
            onTaskClick={handleEdit}
            onDateChange={handleDateChange}
            onStatusToggle={handleStatusToggle}
            isLoading={loading}
          />
        )}
        {view === "list" && (
          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onStatusToggle={handleStatusToggle}
            isLoading={loading}
          />
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={handleSave}
        onDelete={handleDelete}
        onToggleSubscription={handleToggleSubscription}
      />
    </div>
  );
}
