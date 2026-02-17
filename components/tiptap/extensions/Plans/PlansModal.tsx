"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  PlusCircle,
  GraduationCap,
  X,
  Calendar,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlanLessonReference {
  id: string;
  scheduledDate: Timestamp;
}

interface PlanData {
  name: string;
  status: "active" | "completed" | "archived"; // Ajuste conforme seu DB
  studentId: string;
  lessons: PlanLessonReference[];
}

interface FullLesson {
  id: string;
  title: string;
  content?: any;
  scheduledDate?: Date;
}

// Interface combinada: Plano + Lições Reais
interface EnrichedPlan {
  id: string;
  title: string;
  status: string;
  lessons: FullLesson[];
}

type StudentPlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor;
  studentId: string;
};

export const StudentPlanModal: React.FC<StudentPlanModalProps> = ({
  isOpen,
  onClose,
  editor,
  studentId,
}) => {
  // Estado agora armazena PLANOS enriquecidos, não apenas lições soltas
  const [plans, setPlans] = useState<EnrichedPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>(""); // Para controlar qual accordion abre

  useEffect(() => {
    if (isOpen && studentId) {
      fetchAllStudentPlans();
    } else {
      setTimeout(() => {
        setPlans([]);
        setSearchQuery("");
      }, 300);
    }
  }, [isOpen, studentId]);

  const fetchAllStudentPlans = async () => {
    setLoading(true);
    try {
      const plansRef = collection(db, "plans");
      const q = query(plansRef, where("studentId", "==", studentId));
      const planSnap = await getDocs(q);

      if (planSnap.empty) {
        setPlans([]);
        return;
      }

      // Processar TODOS os planos encontrados em paralelo
      const plansPromises = planSnap.docs.map(async (planDoc) => {
        const pData = planDoc.data() as PlanData;
        const lessonRefs = pData.lessons || [];

        // Resolver as lições deste plano específico
        const lessonsPromises = lessonRefs.map(async (ref) => {
          if (!ref.id) return null;
          try {
            const lessonSnap = await getDoc(doc(db, "lessons", ref.id));
            if (lessonSnap.exists()) {
              const lData = lessonSnap.data();
              return {
                id: lessonSnap.id,
                title: lData.title,
                content: lData.content,
                scheduledDate: ref.scheduledDate
                  ? ref.scheduledDate.toDate()
                  : undefined,
              } as FullLesson;
            }
            return null;
          } catch {
            return null;
          }
        });

        const resolvedLessons = await Promise.all(lessonsPromises);
        const validLessons = resolvedLessons.filter(
          (l): l is FullLesson => l !== null,
        );

        // Retorna o plano montado
        return {
          id: planDoc.id,
          title: pData.name || "Plano Sem Título",
          status: pData.status || "archived",
          lessons: validLessons,
        } as EnrichedPlan;
      });

      const allPlans = await Promise.all(plansPromises);

      const sortedPlans = allPlans.sort((a, b) => {
        if (a.status === "active" && b.status !== "active") return -1;
        if (a.status !== "active" && b.status === "active") return 1;
        return a.title.localeCompare(b.title);
      });

      setPlans(sortedPlans);

      const firstActive = sortedPlans.find((p) => p.status === "active");
      if (firstActive) setActiveTab(firstActive.id);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      toast.error("Erro ao carregar planos do aluno.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = useMemo(() => {
    if (!searchQuery) return plans;
    const lower = searchQuery.toLowerCase();

    return plans
      .map((plan) => {
        // Filtra as lições dentro do plano
        const matchingLessons = plan.lessons.filter((l) =>
          (l.title || "").toLowerCase().includes(lower),
        );
        // Retorna o plano com apenas as lições que deram match
        return { ...plan, lessons: matchingLessons };
      })
      .filter((plan) => plan.lessons.length > 0); // Remove planos vazios (sem resultados)
  }, [plans, searchQuery]);

  const handleInsertContent = (lesson: FullLesson) => {
    if (!lesson.content) {
      toast.error("Lição sem conteúdo.");
      return;
    }
    try {
      editor.commands.insertContent(lesson.content);
      toast.success("Conteúdo inserido!");
      onClose();
    } catch (error) {
      toast.error("Erro ao inserir.");
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-4 px-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-[95vh] sm:h-[85vh] sm:max-w-3xl flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
        {/* HEADER */}
        <DialogHeader className="px-4 py-4 sm:px-6 border-b shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <GraduationCap className="w-3.5 h-3.5 mr-1" />
              Planos de Estudos
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Biblioteca do Aluno
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* SEARCH BAR */}
        <div className="p-4 sm:px-6 border-b bg-muted/20 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lição em todos os planos..."
              className="pl-9 pr-9 bg-background h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-hidden bg-muted/5 relative">
          <ScrollArea className="h-full w-full">
            <div className="p-4 sm:p-6 pb-20">
              {loading ? (
                renderSkeletons()
              ) : filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-muted rounded-full p-4 mb-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    Nenhum plano encontrado
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs mt-1">
                    {searchQuery
                      ? "Nenhuma lição corresponde à sua busca."
                      : "Este aluno não possui planos vinculados."}
                  </p>
                </div>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  defaultValue={activeTab}
                  onValueChange={setActiveTab}
                  className="space-y-4"
                >
                  {filteredPlans.map((plan) => (
                    <AccordionItem
                      key={plan.id}
                      value={plan.id}
                      className="border rounded-lg bg-background shadow-sm"
                    >
                      <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-2">
                        <div className="flex items-center gap-3 w-full text-left">
                          <div
                            className={cn(
                              "p-2 rounded-full",
                              plan.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500",
                            )}
                          >
                            {plan.status === "active" ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <BookOpen className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="font-semibold text-sm sm:text-base">
                              {plan.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  plan.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {plan.status === "active"
                                  ? "Ativo"
                                  : "Concluído"}
                              </Badge>
                              <span className="text-xs text-muted-foreground font-normal">
                                {plan.lessons.length} lições
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="pt-2 pb-4 px-2">
                        <div className="flex flex-col space-y-1">
                          {plan.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-1.5 bg-primary/10 text-primary rounded shrink-0">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span
                                    className="font-medium text-sm truncate"
                                    title={lesson.title}
                                  >
                                    {lesson.title || "Lição Sem Título"}
                                  </span>
                                  {lesson.scheduledDate && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {lesson.scheduledDate.toLocaleDateString(
                                        "pt-BR",
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleInsertContent(lesson)}
                              >
                                <PlusCircle className="w-5 h-5 text-primary" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-4 py-3 border-t bg-background shrink-0 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
