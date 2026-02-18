"use client";

import React, { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import { useSession } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Task } from "@/types/tasks/tasks";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ModalIcon,
  ModalPrimaryButton,
  ModalSecondaryButton,
} from "@/components/ui/modal";

interface TasksToolSheetProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  studentId?: string;
}

export const TasksToolSheet: React.FC<TasksToolSheetProps> = ({
  isOpen,
  onClose,
  studentId,
}) => {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const isTeacher =
    session?.user?.role === "teacher" || session?.user?.role === "admin";
  const targetStudentId =
    studentId || (session?.user?.role === "student" ? session.user.id : null);

  useEffect(() => {
    if (!isOpen || !targetStudentId) return;

    setLoading(true);
    const q = query(
      collection(db, `users/${targetStudentId}/Tasks`),
      where("isDeleted", "!=", true),
      orderBy("isDeleted"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedTasks: Task[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loadedTasks.push({
            id: doc.id,
            text: data.text || data.title || "",
            completed: data.completed ?? data.isCompleted ?? false,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate(),
            isDeleted: data.isDeleted ?? false,
            dueDate: data.dueDate?.toDate(),
          } as Task);
        });
        setTasks(loadedTasks);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao buscar tarefas:", error);
        toast.error("Erro ao carregar tarefas.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isOpen, targetStudentId]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !targetStudentId) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `users/${targetStudentId}/Tasks`), {
        text: newTaskTitle,
        completed: false,
        isDeleted: false,
        dueDate: newTaskDate ? Timestamp.fromDate(newTaskDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: session?.user?.id,
      });
      setNewTaskTitle("");
      setNewTaskDate(undefined);
      toast.success("Tarefa adicionada!");
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      toast.error("Erro ao criar tarefa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTaskCompletion = async (
    taskId: string,
    currentStatus: boolean,
  ) => {
    if (!targetStudentId) return;
    try {
      await updateDoc(doc(db, `users/${targetStudentId}/Tasks`, taskId), {
        completed: !currentStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleDeleteTask = async () => {
    if (!targetStudentId || !taskToDelete) return;

    try {
      await updateDoc(doc(db, `users/${targetStudentId}/Tasks`, taskToDelete), {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });
      toast.success("Tarefa removida.");
    } catch (error) {
      console.error("Erro ao remover tarefa:", error);
      toast.error("Erro ao remover tarefa.");
    } finally {
      setTaskToDelete(null);
    }
  };

  if (!targetStudentId) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Tarefas</SheetTitle>
            <SheetDescription>
              Selecione um aluno para ver as tarefas.
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg flex flex-col h-full p-0 gap-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Tarefas do Aluno
            </SheetTitle>
            <SheetDescription>
              Gerencie as atividades e deveres de casa.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Add Task Form (Fixed at top for Teachers) */}
            {isTeacher && (
              <div className="p-4 bg-muted/30 border-b space-y-3 shrink-0">
                <div className="flex flex-col gap-2">
                  <Input
                    id="task-title"
                    placeholder="O que precisa ser feito?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                    className="bg-background"
                  />
                  <div className="flex justify-between gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          size="sm"
                          className={cn(
                            "w-[140px] justify-start text-left font-normal bg-background",
                            !newTaskDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newTaskDate
                            ? format(newTaskDate, "dd/MM/yyyy")
                            : "Data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newTaskDate}
                          onSelect={setNewTaskDate}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>

                    <Button
                      size="sm"
                      onClick={handleAddTask}
                      disabled={isSubmitting || !newTaskTitle.trim()}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-1" />
                      )}
                      Adicionar Tarefa
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Task List */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  <p className="text-sm">Carregando tarefas...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                  <div className="bg-muted rounded-full p-4 mb-3">
                    <CheckCircle2 className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="font-medium">Tudo limpo!</p>
                  <p className="text-sm">
                    Nenhuma tarefa pendente para este aluno.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pb-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
                        task.completed
                          ? "bg-muted/40 border-muted text-muted-foreground"
                          : "bg-card border-border hover:border-primary/30",
                      )}
                    >
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() =>
                          toggleTaskCompletion(task.id, task.completed)
                        }
                        className={cn(
                          "mt-1 transition-colors data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                          task.completed && "opacity-50",
                        )}
                      />

                      <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                        <Label
                          htmlFor={`task-${task.id}`}
                          className={cn(
                            "text-sm font-medium leading-snug cursor-pointer block break-words transition-all",
                            task.completed && "line-through opacity-70",
                          )}
                        >
                          {task.text}
                        </Label>

                        {task.dueDate && (
                          <div
                            className={cn(
                              "flex items-center text-xs",
                              task.completed
                                ? "text-muted-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {format(task.dueDate, "PPP", { locale: ptBR })}
                          </div>
                        )}
                      </div>

                      {isTeacher && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
                          onClick={() => setTaskToDelete(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <Modal
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <ModalContent>
          <ModalIcon type="delete" />
          <ModalHeader>
            <ModalTitle>Excluir tarefa?</ModalTitle>
            <ModalDescription>
              Esta ação moverá a tarefa para a lixeira. Você tem certeza?
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton onClick={() => setTaskToDelete(null)}>
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton
              variant="destructive"
              onClick={handleDeleteTask}
            >
              Sim, excluir
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
