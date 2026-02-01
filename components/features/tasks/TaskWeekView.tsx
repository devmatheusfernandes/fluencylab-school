"use client"

import { useMemo, useState, useEffect } from "react"
import { Task } from "@/types/tasks/task"
import { TaskCard, TaskCardSkeleton } from "./TaskCard"
import { DraggableTaskCard } from "./DraggableTaskCard"
import { DndContext, DragOverlay, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, defaultDropAnimationSideEffects, DropAnimation } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { createPortal } from "react-dom"
import { useStaffUsers } from "@/hooks/features/tasks/useStaffUsers"
import { useDroppable } from "@dnd-kit/core"
import { addDays, format, isSameDay, startOfWeek, parseISO, startOfDay, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useIsMobile } from "@/hooks/ui/useMobile"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface TaskWeekViewProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onDateChange: (taskId: string, newDate: string) => void
  onStatusToggle: (task: Task) => void
  isLoading?: boolean
}

const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
};

export function TaskWeekView({ tasks, onTaskClick, onDateChange, onStatusToggle, isLoading }: TaskWeekViewProps) {
  const { users } = useStaffUsers()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }))
  const isMobile = useIsMobile()
  const [viewOffset, setViewOffset] = useState(0)

  useEffect(() => {
      setViewOffset(0)
  }, [startDate, isMobile])

  useEffect(() => {
    setStartDate(startOfWeek(new Date(), { weekStartsOn: 0 }))
  }, [])

  const visibleDaysCount = isMobile ? 2 : 7

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

  const visibleDays = useMemo(() => {
      return days.slice(viewOffset, viewOffset + visibleDaysCount)
  }, [days, viewOffset, visibleDaysCount])

  const columns = useMemo(() => {
    const cols: Record<string, Task[]> = {}
    days.forEach(day => {
        cols[day.toISOString()] = []
    })
    tasks.forEach((t) => {
      const dateToUse = t.dueDate || t.createdAt
      if (dateToUse) {
         const taskDate = startOfDay(parseISO(dateToUse))
         const dayKey = days.find(d => isSameDay(d, taskDate))?.toISOString()
         if (dayKey) cols[dayKey].push(t)
      }
    })
    return cols
  }, [tasks, days])

  const handleMoveDate = (taskId: string, direction: 'prev' | 'next') => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const baseDate = task.dueDate ? parseISO(task.dueDate) : new Date();
      const newDate = addDays(startOfDay(baseDate), direction === 'prev' ? -1 : 1);
      onDateChange(taskId, newDate.toISOString());
  }

  const handlePrevView = () => setViewOffset(prev => Math.max(0, prev - 1))
  const handleNextView = () => setViewOffset(prev => Math.min(days.length - visibleDaysCount, prev + 1))
  const handlePrevWeek = () => setStartDate(prev => addDays(prev, -7))
  const handleNextWeek = () => setStartDate(prev => addDays(prev, 7))
  const handleToday = () => {
      setStartDate(startOfWeek(new Date(), { weekStartsOn: 0 }))
      setViewOffset(0)
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string 
    
    let targetDateStr = overId;
    
    const overTask = tasks.find(t => t.id === overId)
    if (overTask && overTask.dueDate) {
        const taskDate = startOfDay(parseISO(overTask.dueDate))
        const dayMatch = days.find(d => isSameDay(d, taskDate))
        if (dayMatch) targetDateStr = dayMatch.toISOString()
    }

    if (columns[targetDateStr] !== undefined) {
        const task = tasks.find(t => t.id === taskId)
        if (task) {
            const currentTaskDate = task.dueDate ? startOfDay(parseISO(task.dueDate)).toISOString() : null
            if (currentTaskDate !== targetDateStr) {
                onDateChange(taskId, targetDateStr) 
            }
        }
    }
  }

  const activeTask = useMemo(() => tasks.find(t => t.id === activeId), [tasks, activeId])

  if (isLoading) {
      return <WeekSkeleton visibleDays={visibleDaysCount} />
  }

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
        // REMOVIDO: dropAnimation={...} não deve estar aqui
    >
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-1 gap-4">
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-lg">
            <Button
            onClick={isMobile ? handlePrevView : handlePrevWeek}
            disabled={isMobile ? viewOffset === 0 : false}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            >
            <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium w-32 text-center tabular-nums">
            {format(visibleDays[0], 'd MMM')} - {format(visibleDays[visibleDays.length - 1], 'd MMM', { locale: ptBR })}
            </span>
            
            <Button
            onClick={isMobile ? handleNextView : handleNextWeek}
            disabled={isMobile ? viewOffset >= days.length - visibleDaysCount : false}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            >
            <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
        
        <Button variant="outline" size="sm" onClick={handleToday} className="gap-2">
            <CalendarIcon className="h-3.5 w-3.5 mr-2" />
            <span>Hoje</span>
        </Button>
      </div>

      <div className={cn("grid gap-4 pb-4 h-full", 
          isMobile ? "grid-cols-2" : "grid-cols-7"
      )}>
        <AnimatePresence mode="popLayout">
            {visibleDays.map((day) => (
            <motion.div 
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
                className="h-full min-h-[500px]"
            >
                <WeekColumn
                    id={day.toISOString()}
                    date={day}
                    tasks={columns[day.toISOString()] || []}
                    users={users}
                    onTaskClick={onTaskClick}
                    onStatusToggle={onStatusToggle}
                    onMoveDate={isMobile ? handleMoveDate : undefined}
                />
            </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {createPortal(
        // CORREÇÃO: dropAnimation deve ser passado aqui no DragOverlay
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeTask ? (
            <TaskCard 
                task={activeTask} 
                isOverlay 
                className="w-[200px] shadow-2xl" 
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
  onMoveDate?: (taskId: string, direction: 'prev' | 'next') => void
}

function WeekColumn({ id, date, tasks, users, onTaskClick, onStatusToggle, onMoveDate }: WeekColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  const isToday = isSameDay(date, new Date())
  const isPastDay = isPast(date) && !isToday

  return (
    <div 
        ref={setNodeRef} 
        className={cn(
            "rounded-xl p-3 flex flex-col gap-3 h-full border transition-colors",
            isToday ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : "bg-muted/20 border-border/40",
            isOver ? "bg-muted/60 ring-2 ring-primary/20" : ""
        )}
    >
      <div className={cn("flex flex-col items-center pb-2 border-b border-border/40", isPastDay && "opacity-60")}>
        <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            {format(date, 'EEE', { locale: ptBR })}
        </span>
        <div className={cn(
            "text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full mt-1",
            isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
        )}>
            {format(date, 'd')}
        </div>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto min-h-[200px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              assignedUser={users.find(u => u.id === task.assignedToId)}
              showCheckbox
              onStatusToggle={() => onStatusToggle(task)}
              onMovePrev={onMoveDate ? () => onMoveDate(task.id, 'prev') : undefined}
              onMoveNext={onMoveDate ? () => onMoveDate(task.id, 'next') : undefined}
              moveDirection="horizontal"
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && isToday && (
             <div className="text-[10px] text-center text-muted-foreground py-4 border border-dashed rounded-lg">
                Nada para hoje
             </div>
        )}
      </div>
    </div>
  )
}

function WeekSkeleton({ visibleDays }: { visibleDays: number }) {
    return (
        <div className={`grid gap-4 pb-4 h-full grid-cols-${visibleDays === 2 ? '2' : '7'}`}>
            {Array.from({ length: visibleDays }).map((_, i) => (
                <div key={i} className="rounded-xl p-3 flex flex-col gap-3 h-full bg-muted/20 border border-border/40">
                    <div className="flex flex-col items-center pb-2">
                        <div className="h-3 w-8 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-8 bg-muted animate-pulse rounded-full mt-1" />
                    </div>
                    <div className="space-y-3">
                        <TaskCardSkeleton />
                        <TaskCardSkeleton />
                    </div>
                </div>
            ))}
        </div>
    )
}