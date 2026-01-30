"use client"

import { useMemo, useState } from "react"
import { Task } from "@/types/tasks/task"
import { TaskCard } from "./TaskCard"
import { DraggableTaskCard } from "./DraggableTaskCard"
import { DndContext, DragOverlay, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { createPortal } from "react-dom"
import { useStaffUsers } from "@/hooks/features/tasks/useStaffUsers"
import { useDroppable } from "@dnd-kit/core"
import { addDays, format, isSameDay, startOfWeek, parseISO, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface TaskWeekViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onDateChange: (taskId: string, newDate: string) => void
  onStatusToggle: (task: Task) => void
}

export function TaskWeekView({ tasks, onTaskClick, onDateChange, onStatusToggle }: TaskWeekViewProps) {
  const { users } = useStaffUsers()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i))
  }, [startDate])

  const columns = useMemo(() => {
    const cols: Record<string, Task[]> = {}
    
    // Initialize columns
    days.forEach(day => {
        cols[day.toISOString()] = []
    })

    // Distribute tasks
    tasks.forEach((t) => {
      const dateToUse = t.dueDate || t.createdAt

      if (dateToUse) {
         // Normalize task date to match column keys (start of day)
         const taskDate = startOfDay(parseISO(dateToUse))
         const dayKey = days.find(d => isSameDay(d, taskDate))?.toISOString()
         
         if (dayKey) {
             cols[dayKey].push(t)
         }
      }
    })
    return cols
  }, [tasks, days])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string 
    
    // Determine the target date
    let targetDateStr = overId;
    
    // If dropped on another task, find that task's date
    const overTask = tasks.find(t => t.id === overId)
    if (overTask && overTask.dueDate) {
        const taskDate = startOfDay(parseISO(overTask.dueDate))
        const dayMatch = days.find(d => isSameDay(d, taskDate))
        if (dayMatch) targetDateStr = dayMatch.toISOString()
    }

    // Verify if it is a valid date column
    if (columns[targetDateStr] !== undefined) {
        const task = tasks.find(t => t.id === taskId)
        
        // Only update if date actually changed
        if (task) {
            const currentTaskDate = task.dueDate ? startOfDay(parseISO(task.dueDate)).toISOString() : null
            // Compare as ISO strings (start of day)
            if (currentTaskDate !== targetDateStr) {
                // Keep the time if exists, or default to 12:00? 
                // For simplicity, we just set the date part and keep it as ISO
                // But the user requested just changing the day. 
                // Let's preserve the time from original due date if possible, or set to EOD
                
                // Construct new date string
                // Since the column ID is the ISO string of the start of the day
                // We can just use that date.
                onDateChange(taskId, targetDateStr) 
            }
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
        {days.map((day) => (
          <WeekColumn
            key={day.toISOString()}
            date={day}
            id={day.toISOString()}
            tasks={columns[day.toISOString()] || []}
            users={users}
            onTaskClick={onTaskClick}
            onStatusToggle={onStatusToggle}
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
                showCheckbox
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  )
}

interface WeekColumnProps { 
  id: string
  date: Date
  tasks: Task[]
  users: any[]
  onTaskClick: (t: Task) => void
  onStatusToggle: (t: Task) => void
}

function WeekColumn({ id, date, tasks, users, onTaskClick, onStatusToggle }: WeekColumnProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  })

  const isToday = isSameDay(date, new Date())

  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[300px] rounded-lg p-4 flex flex-col gap-3 ${isToday ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'}`}>
      <div className="flex flex-col">
        <span className="text-sm font-medium uppercase text-muted-foreground">{format(date, 'EEEE', { locale: ptBR })}</span>
        <span className={`text-2xl font-bold ${isToday ? 'text-primary' : ''}`}>{format(date, 'd')}</span>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              assignedUser={users.find(u => u.id === task.assignedToId)}
              showCheckbox
              onStatusToggle={() => onStatusToggle(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
