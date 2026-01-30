import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Task, SubTask, TaskStatus, TaskPriority } from "@/types/tasks/task"
import { Plus, X, Trash2, Check, ChevronsUpDown, Bell, BellOff } from "lucide-react"
import { useStaffUsers } from "@/hooks/features/tasks/useStaffUsers"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/useCurrentUser"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task
  onSave: (task: Partial<Task>) => Promise<void>
  onDelete?: (taskId: string) => Promise<void>
  onToggleSubscription?: (taskId: string) => Promise<void>
}

export function TaskDialog({ open, onOpenChange, task, onSave, onDelete, onToggleSubscription }: TaskDialogProps) {
  const { user: currentUser } = useCurrentUser();
  const { users: staffUsers } = useStaffUsers();
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined)
  const [subTasks, setSubTasks] = useState<SubTask[]>([])
  
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setStatus(task.status)
      setPriority(task.priority)
      setDueDate(task.dueDate || "")
      setAssignedToId(task.assignedToId)
      setSubTasks(task.subTasks || [])
      setIsSubscribed(task.subscriberIds?.includes(currentUser?.id || "") || false)
    } else {
      setTitle("")
      setDescription("")
      setStatus("todo")
      setPriority("medium")
      setDueDate("")
      setAssignedToId(undefined)
      setSubTasks([])
      setIsSubscribed(true) // Auto-subscribe creator
    }
  }, [task, open, currentUser])

  const handleSave = async () => {
    if (!title.trim()) return
    await onSave({
      title,
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      assignedToId,
      subTasks,
      subscriberIds: task ? undefined : (isSubscribed && currentUser ? [currentUser.id] : []) // Only set on create here, update handled by separate logic or backend
    })
    onOpenChange(false)
  }

  const addSubTask = () => {
    setSubTasks([...subTasks, { id: crypto.randomUUID(), title: "", completed: false }])
  }

  const updateSubTask = (id: string, updates: Partial<SubTask>) => {
    setSubTasks(subTasks.map(st => st.id === id ? { ...st, ...updates } : st))
  }

  const removeSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id))
  }

  const selectedUser = staffUsers.find(u => u.id === assignedToId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
            <DialogTitle>{task ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
            {task && onToggleSubscription && (
                <Button variant="ghost" size="sm" onClick={() => onToggleSubscription(task.id)}>
                    {isSubscribed ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="O que precisa ser feito?"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todo">A Fazer</SelectItem>
                    <SelectItem value="in-progress">Em Progresso</SelectItem>
                    <SelectItem value="review">Revisão</SelectItem>
                    <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>

          <div className="space-y-2">
             <Label>Designado para</Label>
             <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between">
                        {selectedUser ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={selectedUser.avatarUrl} />
                                    <AvatarFallback>{selectedUser.name?.substring(0,2)}</AvatarFallback>
                                </Avatar>
                                {selectedUser.name}
                            </div>
                        ) : "Selecionar responsável..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar usuário..." />
                        <CommandList>
                            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                            <CommandGroup>
                                {staffUsers.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.name}
                                        onSelect={() => {
                                            setAssignedToId(user.id === assignedToId ? undefined : user.id)
                                            setComboboxOpen(false)
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", assignedToId === user.id ? "opacity-100" : "opacity-0")} />
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={user.avatarUrl} />
                                                <AvatarFallback>{user.name?.substring(0,2)}</AvatarFallback>
                                            </Avatar>
                                            {user.name}
                                            <span className="text-xs text-muted-foreground ml-1">({user.role})</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
             </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data de Entrega</Label>
            <Input 
            type="datetime-local" 
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Subtarefas</Label>
              <Button variant="ghost" size="sm" onClick={addSubTask}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {subTasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2">
                  <Input 
                    type="checkbox" 
                    className="h-4 w-4"
                    checked={st.completed}
                    onChange={(e) => updateSubTask(st.id, { completed: e.target.checked })}
                  />
                  <Input 
                    value={st.title} 
                    onChange={(e) => updateSubTask(st.id, { title: e.target.value })}
                    placeholder="Subtarefa..."
                    className="flex-1 h-8 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSubTask(st.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          {task && onDelete ? (
             <Button variant="destructive" onClick={() => {
               onDelete(task.id)
               onOpenChange(false)
             }}>
               <Trash2 className="h-4 w-4 mr-2" /> Excluir
             </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
