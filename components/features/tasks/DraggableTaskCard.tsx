import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types/tasks/task";
import { TaskCard } from "./TaskCard";

interface DraggableTaskCardProps {
  task: Task;
  onClick: () => void;
  assignedUser?: { name: string; avatarUrl?: string };
  showCheckbox?: boolean;
  onStatusToggle?: () => void;
}

export function DraggableTaskCard({ task, onClick, assignedUser, showCheckbox, onStatusToggle }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none" as React.CSSProperties["touchAction"], // Critical for mobile
  };

  return (
    <TaskCard
      task={task}
      onClick={onClick}
      assignedUser={assignedUser}
      showCheckbox={showCheckbox}
      onStatusToggle={onStatusToggle}
      innerRef={setNodeRef}
      style={style}
      attributes={attributes}
      listeners={listeners}
    />
  );
}
