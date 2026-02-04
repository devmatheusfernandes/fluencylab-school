import { Task } from "@/types/tasks/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  className?: string;
  assignedUser?: { name: string; avatarUrl?: string };
  showCheckbox?: boolean;
  onStatusToggle?: () => void;
  style?: React.CSSProperties;
  innerRef?: React.Ref<HTMLDivElement>;
  isOverlay?: boolean;
  attributes?: any;
  listeners?: any;
  onMovePrev?: () => void;
  onMoveNext?: () => void;
  moveDirection?: "vertical" | "horizontal";
}

const MotionCard = motion.create(Card);

export function TaskCard({
  task,
  onClick,
  className,
  assignedUser,
  showCheckbox,
  onStatusToggle,
  style,
  innerRef,
  isOverlay,
  attributes,
  listeners,
  onMovePrev,
  onMoveNext,
  moveDirection,
}: TaskCardProps) {
  const t = useTranslations("Tasks");

  const completedSubtasks =
    task.subTasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subTasks?.length || 0;

  const statusMap: Record<string, string> = {
    todo: t("status.todo"),
    "in-progress": t("status.in_progress"),
    review: t("status.review"),
    done: t("status.done"),
  };

  const priorityConfig: Record<string, { label: string; className: string }> = {
    low: {
      label: t("priority.low"),
      className:
        "text-slate-500 border-slate-200 bg-slate-50 dark:text-white dark:border-slate-300 dark:bg-slate-600",
    },
    medium: {
      label: t("priority.medium"),
      className:
        "text-amber-600 border-amber-200 bg-amber-50 dark:text-white dark:border-amber-300 dark:bg-amber-600",
    },
    high: {
      label: t("priority.high"),
      className:
        "text-red-600 border-red-200 bg-red-50 dark:text-white dark:border-red-300 dark:bg-red-600",
    },
  };

  const priorityInfo = priorityConfig[task.priority] || {
    label: task.priority,
    className: "",
  };

  return (
    <MotionCard
      ref={innerRef}
      style={style}
      {...attributes}
      {...listeners}
      layoutId={!isOverlay ? task.id : undefined}
      initial={
        isOverlay
          ? {
              scale: 1.05,
              rotate: 2,
              boxShadow: "0px 10px 20px rgba(0,0,0,0.15)",
            }
          : { scale: 1 }
      }
      animate={isOverlay ? { scale: 1.05, rotate: 2 } : { scale: 1 }}
      whileHover={
        !isOverlay && onClick ? { y: -2, transition: { duration: 0.2 } } : {}
      }
      className={cn(
        "cursor-pointer border-l-4 transition-all relative group bg-card",
        task.status === "done"
          ? "opacity-60 bg-muted/30 border-l-slate-300"
          : task.priority === "high"
            ? "border-l-red-400"
            : task.priority === "medium"
              ? "border-l-amber-400"
              : "border-l-green-400",
        isOverlay ? "z-50 cursor-grabbing border-primary" : "hover:shadow-md",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 flex gap-3">
        {showCheckbox && (
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={task.status === "done"}
              onCheckedChange={() => onStatusToggle && onStatusToggle()}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        )}

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "font-semibold text-sm leading-tight line-clamp-2 text-foreground/90",
                task.status === "done" && "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </span>
            {assignedUser && (
              <Avatar size="xs" className="md:block hidden">
                <AvatarImage src={assignedUser.avatarUrl} />
                <AvatarFallback />
              </Avatar>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-5 px-1.5 font-normal rounded-md",
                priorityInfo.className,
              )}
            >
              {priorityInfo.label}
            </Badge>
            {task.status !== "todo" && (
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground font-normal rounded-md"
              >
                {statusMap[task.status] || task.status}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {task.dueDate && (
              <div
                className={cn(
                  "flex items-center gap-1.5",
                  new Date(task.dueDate) < new Date() && task.status !== "done"
                    ? "text-red-500 font-medium"
                    : "",
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {format(parseISO(task.dueDate), "dd MMM", { locale: ptBR })}
                </span>
              </div>
            )}

            {totalSubtasks > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
            )}
          </div>
        </div>

        {(onMovePrev || onMoveNext) && (
          <div
            className={cn(
              "flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity",
              moveDirection === "vertical"
                ? "flex-col justify-center border-l pl-1 ml-1"
                : "flex-row items-center border-l pl-2 ml-1",
            )}
          >
            {onMovePrev && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onMovePrev();
                }}
              >
                {moveDirection === "vertical" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            )}
            {onMoveNext && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveNext();
                }}
              >
                {moveDirection === "vertical" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </MotionCard>
  );
}

export function TaskCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-3 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex gap-4 pt-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
  );
}
