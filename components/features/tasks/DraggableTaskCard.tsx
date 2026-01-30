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
  onMovePrev?: () => void;
  onMoveNext?: () => void;
  moveDirection?: 'vertical' | 'horizontal';
}

export function DraggableTaskCard({ 
  task, 
  onClick, 
  assignedUser, 
  showCheckbox, 
  onStatusToggle, 
  onMovePrev, 
  onMoveNext, 
  moveDirection 
}: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id, 
    data: { task },
    animateLayoutChanges: () => false // Deixa o framer-motion lidar com animações de layout se necessário, mas evita glitch no drag
  });

  const style = {
    transform: CSS.Translate.toString(transform), // Use Translate ao invés de Transform para melhor performance com scale
    transition,
    opacity: isDragging ? 0.3 : 1,
    touchAction: "none" as React.CSSProperties["touchAction"],
    zIndex: isDragging ? 999 : undefined,
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
      onMovePrev={onMovePrev}
      onMoveNext={onMoveNext}
      moveDirection={moveDirection}
    />
  );
}