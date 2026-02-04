"use client";

import { useMemo, useState } from "react";
import { Task, TaskStatus } from "@/types/tasks/task";
import { TaskCard, TaskCardSkeleton } from "./TaskCard";
import { DraggableTaskCard } from "./DraggableTaskCard";
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { useStaffUsers } from "@/hooks/features/tasks/useStaffUsers";
import { useDroppable } from "@dnd-kit/core";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";

interface TaskKanbanViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  isLoading?: boolean;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export function TaskKanbanView({
  tasks,
  onTaskClick,
  onStatusChange,
  isLoading,
}: TaskKanbanViewProps) {
  const t = useTranslations("Tasks");
  const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
    { id: "todo", title: t("status.todo"), color: "bg-slate-500" },
    { id: "in-progress", title: t("status.in_progress"), color: "bg-blue-500" },
    { id: "review", title: t("status.review"), color: "bg-amber-500" },
    { id: "done", title: t("status.done"), color: "bg-green-500" },
  ];

  const { users } = useStaffUsers();
  const [activeId, setActiveId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduzido para ser mais responsivo, mas prevenir cliques acidentais
      },
    }),
  );

  const columns = useMemo(() => {
    const cols: Record<TaskStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      review: [],
      done: [],
    };
    tasks.forEach((t) => {
      if (cols[t.status]) {
        cols[t.status].push(t);
      }
    });
    return cols;
  }, [tasks]);

  const handleMoveStatus = (taskId: string, direction: "prev" | "next") => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentIndex = COLUMNS.findIndex((c) => c.id === task.status);
    if (currentIndex === -1) return;

    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < COLUMNS.length) {
      onStatusChange(taskId, COLUMNS[newIndex].id);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    if (COLUMNS.some((c) => c.id === overId)) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== overId) {
        onStatusChange(taskId, overId as TaskStatus);
      }
      return;
    }

    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== overTask.status) {
        onStatusChange(taskId, overTask.status);
      }
    }
  };

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId),
    [tasks, activeId],
  );

  if (isLoading) {
    return <KanbanSkeleton isMobile={isMobile} />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >
      <ScrollArea className="h-full min-w-full whitespace-nowrap rounded-md">
        <div
          className={cn(
            "flex h-full gap-4 pb-4",
            isMobile ? "flex-col w-full" : "w-max min-w-full",
          )}
        >
          {COLUMNS.map((col, index) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              tasks={columns[col.id]}
              users={users}
              onTaskClick={onTaskClick}
              onMoveStatus={isMobile ? handleMoveStatus : undefined}
              isFirst={index === 0}
              isLast={index === COLUMNS.length - 1}
            />
          ))}
        </div>
      </ScrollArea>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              isOverlay
              className="w-[300px] cursor-grabbing shadow-2xl scale-105"
              assignedUser={users.find((u) => u.id === activeTask.assignedToId)}
            />
          ) : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  users: any[];
  onTaskClick: (t: Task) => void;
  onMoveStatus?: (taskId: string, direction: "prev" | "next") => void;
  isFirst?: boolean;
  isLast?: boolean;
}

function KanbanColumn({
  id,
  title,
  color,
  tasks,
  users,
  onTaskClick,
  onMoveStatus,
  isFirst,
  isLast,
}: KanbanColumnProps) {
  const t = useTranslations("Tasks");
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[300px] rounded-xl flex flex-col gap-3 transition-colors duration-200",
        isOver ? "bg-muted/80 ring-2 ring-primary/20" : "bg-muted/30",
      )}
    >
      <div className="p-4 pb-2 border-b border-border/50 flex items-center justify-between sticky top-0 bg-inherit z-10 rounded-t-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", color)} />
          <h3 className="font-semibold text-sm text-foreground/80 uppercase tracking-tight">
            {title}
          </h3>
        </div>
        <span className="text-xs font-medium bg-background px-2 py-1 rounded-full text-muted-foreground border shadow-sm">
          {tasks.length}
        </span>
      </div>

      <div className="flex-1 p-3 pt-0 overflow-y-auto min-h-[150px]">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3 pb-2">
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <DraggableTaskCard
                    task={task}
                    onClick={() => onTaskClick(task)}
                    assignedUser={users.find((u) => u.id === task.assignedToId)}
                    onMovePrev={
                      onMoveStatus && !isFirst
                        ? () => onMoveStatus(task.id, "prev")
                        : undefined
                    }
                    onMoveNext={
                      onMoveStatus && !isLast
                        ? () => onMoveStatus(task.id, "next")
                        : undefined
                    }
                    moveDirection="vertical"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {tasks.length === 0 && (
              <div className="h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                {t("kanban.dropHere")}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function KanbanSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full gap-4 pb-4 overflow-hidden",
        isMobile ? "flex-col" : "",
      )}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex-1 min-w-[300px] bg-muted/30 rounded-xl p-4 flex flex-col gap-3"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-5 w-8 bg-muted animate-pulse rounded-full" />
          </div>
          <div className="space-y-3">
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}
