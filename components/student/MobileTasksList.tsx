"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { NoResults } from "@/components/ui/no-results";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  dueDate?: Date | string;
}

interface MobileTasksListProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
}

const parseTaskDates = (task: any): Task => {
  return {
    ...task,
    createdAt:
      typeof task.createdAt === "string"
        ? new Date(task.createdAt)
        : task.createdAt,
    updatedAt: task.updatedAt
      ? typeof task.updatedAt === "string"
        ? new Date(task.updatedAt)
        : task.updatedAt
      : undefined,
    dueDate: task.dueDate
      ? typeof task.dueDate === "string"
        ? new Date(task.dueDate)
        : task.dueDate
      : undefined,
  };
};

export default function MobileTasksList({
  tasks,
  onUpdateTask,
}: MobileTasksListProps) {
  const t = useTranslations("TasksCard");
  const locale = useLocale();
  const [localTasks, setLocalTasks] = useState<Task[]>(
    tasks.map(parseTaskDates)
  );

  useEffect(() => {
    setLocalTasks(tasks.map(parseTaskDates));
  }, [tasks]);

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );

    try {
      const success = await onUpdateTask(taskId, updates);
      if (!success) {
        // Revert
        setLocalTasks(tasks.map(parseTaskDates));
      }
    } catch (error) {
      setLocalTasks(tasks.map(parseTaskDates));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-3">
      {localTasks.length > 0 ? (
        localTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start p-3 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) =>
                handleUpdateTask(task.id, {
                  completed: checked as boolean,
                })
              }
              className="mt-1 mr-3 h-5 w-5"
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 break-words",
                  task.completed && "line-through opacity-50"
                )}
              >
                {task.text}
              </p>
              {task.dueDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("due")}{" "}
                  {task.dueDate instanceof Date
                    ? task.dueDate.toLocaleDateString(locale)
                    : new Date(task.dueDate).toLocaleDateString(locale)}
                </p>
              )}
            </div>
          </div>
        ))
      ) : (
        <NoResults
          customMessage={{
            withoutSearch: t("noTasks"),
          }}
          className="p-4"
        />
      )}
    </div>
  );
}
