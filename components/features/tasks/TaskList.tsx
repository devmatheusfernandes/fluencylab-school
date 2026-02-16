import { Task } from "@/types/tasks/task";
import { TaskCard, TaskCardSkeleton } from "./TaskCard";
import { useStaffUsers } from "@/hooks/features/tasks/useStaffUsers";
import { motion, Variants } from "framer-motion";
import { useTranslations } from "next-intl";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusToggle: (task: Task) => void;
  isLoading?: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function TaskList({
  tasks,
  onEdit,
  onStatusToggle,
  isLoading,
}: TaskListProps) {
  const { users } = useStaffUsers();
  const t = useTranslations("TasksCard");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full pb-4 content-start"
    >
      {tasks.map((task) => (
        <motion.div key={task.id} variants={item}>
          <TaskCard
            task={task}
            onClick={() => onEdit(task)}
            assignedUser={users.find((u) => u.id === task.assignedToId)}
            showCheckbox
            onStatusToggle={() => onStatusToggle(task)}
          />
        </motion.div>
      ))}
      {tasks.length === 0 && (
        <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground">
          <p>{t("noTasks")}</p>
        </div>
      )}
    </motion.div>
  );
}
