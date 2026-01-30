import { Task } from "@/types/tasks/task"
import { TaskCard } from "./TaskCard"
import { useStaffUsers } from "@/hooks/features/tasks/useStaffUsers"

interface TaskListProps {
    tasks: Task[]
    onEdit: (task: Task) => void
    onStatusToggle: (task: Task) => void
}

export function TaskList({ tasks, onEdit, onStatusToggle }: TaskListProps) {
    const { users } = useStaffUsers()
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto h-full pb-4">
            {tasks.map(task => (
                 <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => onEdit(task)}
                    assignedUser={users.find(u => u.id === task.assignedToId)}
                    showCheckbox
                    onStatusToggle={() => onStatusToggle(task)}
                />
            ))}
        </div>
    )
}
