"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { NoResults } from "@/components/ui/no-results";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalPrimaryButton,
  ModalSecondaryButton,
  ModalIcon,
} from "@/components/ui/modal";
import DatePicker from "@/components/ui/date-picker";
import { Spinner } from "../ui/spinner";
import { Plus, RefreshCcw, Trash } from "lucide-react";

// Update the Task interface to include dueDate
interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  dueDate?: Date | string; // Add dueDate
}

// Update the TasksCardProps interface
interface TasksCardProps {
  tasks: Task[];
  onAddTask?: (text: string, dueDate?: Date) => Promise<boolean>; // Update this line
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<boolean>;
  onDeleteTask?: (taskId: string) => Promise<boolean>;
  onDeleteAllTasks?: () => Promise<boolean>;
  onSyncWithGoogleCalendar?: () => void;
  isSyncingWithGoogleCalendar?: boolean;
  userRole?: string; // Add this line to distinguish between teacher and student
}

// Helper function to convert string dates to Date objects
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

// Add this helper function to format date for input without timezone issues
const formatDateForInput = (date: Date): string => {
  // Use the date components directly to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TasksCard({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onDeleteAllTasks,
  onSyncWithGoogleCalendar,
  isSyncingWithGoogleCalendar = false,
  userRole, // Add this line
}: TasksCardProps) {
  const t = useTranslations("TasksCard");
  const locale = useLocale();
  const [newTask, setNewTask] = useState("");
  const [localTasks, setLocalTasks] = useState<Task[]>(
    tasks.map(parseTaskDates)
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>("");

  // Update local tasks when prop changes
  React.useEffect(() => {
    setLocalTasks(tasks.map(parseTaskDates));
  }, [tasks]);

  // Calculate completion percentage for progress bar
  const completedTasks = localTasks.filter((task) => task.completed).length;
  const completionPercentage =
    localTasks.length > 0
      ? Math.round((completedTasks / localTasks.length) * 100)
      : 0;

  // Update handleAddTask to include dueDate
  const handleAddTask = async () => {
    if (!newTask.trim() || !onAddTask || typeof onAddTask !== "function")
      return;

    // Create a pending ID for the skeleton
    const pendingId = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Add to pending tasks for skeleton display
    setPendingTasks((prev) => [...prev, pendingId]);

    // Clear the input immediately
    setNewTask("");
    setDueDate(""); // Clear the date input

    // Add in the background
    try {
      // Convert string date to Date object if provided, handling timezone correctly
      let dueDateObj: Date | undefined;
      if (dueDate) {
        // Create date object from YYYY-MM-DD string without timezone conversion
        const [year, month, day] = dueDate.split("-").map(Number);
        dueDateObj = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
      }

      const success = await onAddTask(newTask, dueDateObj);
      // Remove from pending tasks after completion
      setPendingTasks((prev) => prev.filter((id) => id !== pendingId));

      if (!success) {
        console.error("Failed to add task");
      }
    } catch (error) {
      // Remove from pending tasks if there was an error
      setPendingTasks((prev) => prev.filter((id) => id !== pendingId));
      console.error("Failed to add task", error);
    }
  };

  // Handle updating a task with optimistic update
  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    // Optimistically update the UI
    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );

    // Update in the background
    try {
      const success = await onUpdateTask(taskId, updates);
      if (!success) {
        // Revert the change if the update failed
        setLocalTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? { ...task, ...tasks.find((t) => t.id === taskId) }
              : task
          )
        );
      }
    } catch (error) {
      // Revert the change if there was an error
      setLocalTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, ...tasks.find((t) => t.id === taskId) }
            : task
        )
      );
      console.error("Failed to update task", error);
    }
  };

  // Handle deleting a single task (only if onDeleteTask is provided)
  const handleDeleteTask = async (taskId: string) => {
    // If onDeleteTask is not provided or returns false, don't delete
    if (!onDeleteTask || typeof onDeleteTask !== "function") return;

    // Optimistically remove the task from the UI
    setLocalTasks((prevTasks) =>
      prevTasks.filter((task) => task.id !== taskId)
    );

    // Delete in the background
    try {
      const success = await onDeleteTask(taskId);
      if (!success) {
        // Revert the change if the delete failed
        const originalTask = tasks.find((task) => task.id === taskId);
        if (originalTask) {
          setLocalTasks((prevTasks) => {
            // Check if the task is already in the list to avoid duplicates
            if (!prevTasks.some((t) => t.id === taskId)) {
              return [...prevTasks, originalTask];
            }
            return prevTasks;
          });
        }
      }
    } catch (error) {
      // Revert the change if there was an error
      const originalTask = tasks.find((task) => task.id === taskId);
      if (originalTask) {
        setLocalTasks((prevTasks) => {
          // Check if the task is already in the list to avoid duplicates
          if (!prevTasks.some((t) => t.id === taskId)) {
            return [...prevTasks, originalTask];
          }
          return prevTasks;
        });
      }
      console.error("Failed to delete task", error);
    }
  };

  // Handle deleting all tasks - opens confirmation modal (only if onDeleteAllTasks is provided)
  const handleDeleteAllTasks = () => {
    // If onDeleteAllTasks is not provided or returns false, don't delete
    if (
      !onDeleteAllTasks ||
      typeof onDeleteAllTasks !== "function" ||
      localTasks.length === 0
    )
      return;
    setIsDeleteModalOpen(true);
  };

  // Confirm deletion of all tasks (only if onDeleteAllTasks is provided)
  const confirmDeleteAllTasks = async () => {
    // If onDeleteAllTasks is not provided or returns false, don't delete
    if (!onDeleteAllTasks || typeof onDeleteAllTasks !== "function") {
      setIsDeleteModalOpen(false);
      return;
    }

    // Optimistically clear all tasks from the UI
    setLocalTasks([]);

    // Delete all in the background
    try {
      const success = await onDeleteAllTasks();
      if (!success) {
        // Revert the change if the delete failed
        setLocalTasks(tasks);
      }
    } catch (error) {
      // Revert the change if there was an error
      setLocalTasks(tasks);
      console.error("Failed to delete all tasks", error);
    }

    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="card-base w-full p-2 overflow-y-scroll h-[50vh] sm:h-full flex flex-col relative overflow-hidden">
        {/* Progress bar at the top */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-slate-700 dark:bg-gray-700 overflow-hidden rounded-t-xl">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 pt-2">
          <h2 className="text-xl font-bold text-primary">{t("title")}</h2>
          <div className="flex items-center gap-2">
            {/* Google Calendar Sync Button */}
            {onSyncWithGoogleCalendar && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSyncWithGoogleCalendar}
                disabled={isSyncingWithGoogleCalendar}
                className="flex items-center gap-1 px-2 py-2 bg-primary text-primary-text rounded-md text-sm font-medium disabled:opacity-50 group"
              >
                {isSyncingWithGoogleCalendar ? (
                  <Spinner />
                ) : (
                  <>
                    <RefreshCcw className="w-2 h-2" />
                    <span className="hidden group-hover:inline-block text-xs">
                      {t("syncCalendar")}
                    </span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>

        {/* Update the task input section to include date picker for teachers */}
        {onAddTask && typeof onAddTask === "function" && (
          <div className="flex flex-row sm:flex-row items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={t("addPlaceholder")}
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                className="pr-12"
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              >
                <Plus
                  onClick={handleAddTask}
                  className="w-6 h-6 text-success-light hover:text-success duration-300 ease-in-out transition-all"
                />
              </motion.div>
            </div>

            {/* Date picker for teachers */}
            {userRole === "teacher" && (
              <div className="relative">
                <DatePicker
                  value={dueDate ? new Date(dueDate) : undefined}
                  onChange={(date) => {
                    // Format the date to YYYY-MM-DD without timezone conversion
                    const formattedDate = formatDateForInput(date);
                    setDueDate(formattedDate);
                  }}
                  placeholder={t("selectDate")}
                />
              </div>
            )}

            {/* Only show delete all button if onDeleteAllTasks is provided and is a function */}
            {localTasks.length > 0 &&
              onDeleteAllTasks &&
              typeof onDeleteAllTasks === "function" && (
                <Trash
                  onClick={handleDeleteAllTasks}
                  className="w-4 h-4 text-destructive hover:text-destructive-light duration-300 ease-in-out transition-all cursor-pointer"
                />
              )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <AnimatePresence>
              {/* Render actual tasks */}
              {localTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center p-2 item-base"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      handleUpdateTask(task.id, {
                        completed: checked as boolean,
                      })
                    }
                    className="mr-3 h-5 w-5 text-primary rounded"
                  />
                  <div className="flex-1">
                    <motion.span
                      animate={{
                        textDecoration: task.completed
                          ? "line-through"
                          : "none",
                        opacity: task.completed ? 0.7 : 1,
                      }}
                      className="text-paragraph"
                    >
                      {task.text}
                    </motion.span>
                    {/* Display due date if available */}
                    {task.dueDate && (
                      <div className="text-xs text-paragraph/60 mt-1">
                        {t("due")}
                        {task.dueDate instanceof Date
                          ? task.dueDate.toLocaleDateString(locale)
                          : new Date(task.dueDate).toLocaleDateString(locale)}
                      </div>
                    )}
                  </div>
                  {/* Only show delete button if onDeleteTask is provided and is a function */}
                  {onDeleteTask && typeof onDeleteTask === "function" && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteTask(task.id)}
                      className="ml-2 cursor-pointer text-destructive hover:text-destructive-light"
                    >
                      <Trash
                        className="w-5 h-5"
                      />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {localTasks.length === 0 && pendingTasks.length === 0 && (
              <NoResults
                customMessage={{
                  withoutSearch: t("noTasks"),
                }}
                className="p-8"
              />
            )}
          </div>
        </div>
      </div>

      {/* Only show delete all tasks modal if onDeleteAllTasks is provided and is a function */}
      {onDeleteAllTasks && typeof onDeleteAllTasks === "function" && (
        <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <ModalContent>
            <ModalIcon type="delete" />
            <ModalHeader>
              <ModalTitle>{t("deleteAllTitle")}</ModalTitle>
              <ModalDescription>
                {t("deleteAllDescription", { count: localTasks.length })}
              </ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <ModalSecondaryButton onClick={() => setIsDeleteModalOpen(false)}>
                {t("cancel")}
              </ModalSecondaryButton>
              <ModalPrimaryButton
                onClick={confirmDeleteAllTasks}
                className="!bg-destructive !hover:bg-destructive-light"
              >
                {t("deleteAllConfirm")}
              </ModalPrimaryButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
