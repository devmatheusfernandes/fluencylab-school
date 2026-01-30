"use client"

import { useMemo, useState } from "react"
import { Task, TaskStatus } from "@/types/tasks/task"
import { TaskCard } from "./TaskCard"
import { DraggableTaskCard } from "./DraggableTaskCard"
import { DndContext, DragOverlay, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { createPortal } from "react-dom"
import { useStaffUsers } from "@/hooks/features/tasks/useStaffUsers"
import { useDroppable } from "@dnd-kit/core"

interface TaskKanbanViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "A Fazer" },
  { id: "in-progress", title: "Em Progresso" },
  { id: "review", title: "Revisão" },
  { id: "done", title: "Concluído" },
]

export function TaskKanbanView({ tasks, onTaskClick, onStatusChange }: TaskKanbanViewProps) {
  const { users } = useStaffUsers()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const columns = useMemo(() => {
    const cols: Record<TaskStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      review: [],
      done: [],
    }
    tasks.forEach((t) => {
      if (cols[t.status]) {
        cols[t.status].push(t)
      }
    })
    return cols
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string // Can be a task ID or a column ID

    // Check if dropped on a column directly
    if (COLUMNS.some(c => c.id === overId)) {
       const task = tasks.find(t => t.id === taskId)
       if (task && task.status !== overId) {
          onStatusChange(taskId, overId as TaskStatus)
       }
       return
    }

    // Check if dropped on another task
    const overTask = tasks.find(t => t.id === overId)
    if (overTask) {
       const task = tasks.find(t => t.id === taskId)
       if (task && task.status !== overTask.status) {
          onStatusChange(taskId, overTask.status)
       }
    }
  }

  const activeTask = useMemo(() => tasks.find(t => t.id === activeId), [tasks, activeId])

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={columns[col.id]}
            users={users}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      {createPortal(
        <DragOverlay>
          {activeTask ? (
            <TaskCard 
                task={activeTask} 
                isOverlay 
                className="w-[300px]" 
                assignedUser={users.find(u => u.id === activeTask.assignedToId)}
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  )
}

interface KanbanColumnProps { 
  id: TaskStatus
  title: string
  tasks: Task[]
  users: any[]
  onTaskClick: (t: Task) => void
}

function KanbanColumn({ id, title, tasks, users, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <div ref={setNodeRef} className="flex-1 min-w-[300px] bg-muted/30 rounded-lg p-4 flex flex-col gap-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase">{title} ({tasks.length})</h3>
      <div className="flex-1 space-y-3 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              assignedUser={users.find(u => u.id === task.assignedToId)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
