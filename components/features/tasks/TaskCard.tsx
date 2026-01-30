import { Task } from "@/types/tasks/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

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
}

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
  listeners
}: TaskCardProps) {
  
  const completedSubtasks = task.subTasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subTasks?.length || 0;

  const statusMap: Record<string, string> = {
      'todo': 'A Fazer',
      'in-progress': 'Em Progresso',
      'review': 'Revisão',
      'done': 'Concluído'
  };

  const priorityMap: Record<string, string> = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta'
  };

  return (
    <Card 
      ref={innerRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-colors relative group",
        task.status === "done" ? "opacity-70 bg-muted/50" : "",
        isOverlay ? "shadow-xl rotate-2 cursor-grabbing z-50 bg-background" : "",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          {showCheckbox && (
            <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                <Checkbox 
                    checked={task.status === 'done'} 
                    onCheckedChange={() => onStatusToggle && onStatusToggle()} 
                />
            </div>
          )}
          <div className="flex-1 min-w-0">
             <div className="flex items-start justify-between gap-2">
                <span className={cn("font-medium text-sm line-clamp-2", task.status === "done" && "line-through text-muted-foreground")}>
                    {task.title}
                </span>
                {assignedUser && (
                    <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={assignedUser.avatarUrl} />
                        <AvatarFallback className="text-[10px]">{assignedUser.name.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                )}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pl-6">
            <Badge variant={task.status === "done" ? "secondary" : task.status === "in-progress" ? "default" : "outline"} className="text-[10px] h-5 px-1.5 shrink-0">
                {statusMap[task.status] || task.status}
            </Badge>
            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 shrink-0", 
                task.priority === 'high' ? "text-red-500 border-red-200" : 
                task.priority === 'medium' ? "text-amber-500 border-amber-200" : "text-green-500 border-green-200"
            )}>
                {priorityMap[task.priority] || task.priority}
            </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground pl-6">
            {task.dueDate && (
            <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(parseISO(task.dueDate), 'dd/MM', { locale: ptBR })}</span>
            </div>
            )}
            
            {totalSubtasks > 0 && (
            <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
