"use client";

import { StudentProfile, RoadmapLesson } from "@/types/students/studentProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { generateRoadmapAction } from "@/actions/generateRoadmap";
import { updateStudentProfile } from "@/actions/studentProfile";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Pencil,
  BookOpen,
  Target,
  Clock,
  Calendar,
  CheckCircle2,
  Layers,
  GraduationCap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RoadmapTabProps {
  profile: StudentProfile;
}

export default function RoadmapTab({ profile }: RoadmapTabProps) {
  const [isGenerating, startTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();
  const [editingLesson, setEditingLesson] = useState<RoadmapLesson | null>(
    null,
  );

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateRoadmapAction(profile.id!);
      if (result.success) {
        toast.success("Roadmap gerado com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar roadmap.");
      }
    });
  };

  const handleSaveLesson = () => {
    if (!editingLesson || !profile.roadmap) return;

    startSaveTransition(async () => {
      const updatedLessons = profile.roadmap!.lessons.map((l) =>
        l.id === editingLesson.id ? editingLesson : l,
      );

      const updatedRoadmap = {
        ...profile.roadmap!,
        lessons: updatedLessons,
        updatedAt: new Date().toISOString(),
      };

      const result = await updateStudentProfile(profile.id!, {
        roadmap: updatedRoadmap,
      });

      if (result.success) {
        toast.success("Lição atualizada com sucesso!");
        setEditingLesson(null);
      } else {
        toast.error(result.error || "Erro ao atualizar lição.");
      }
    });
  };

  // --- Empty States ---
  if (!profile.generatedPromptPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border rounded-lg border-dashed bg-muted/30">
        <div className="p-4 bg-muted rounded-full">
          <Layers className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="max-w-md px-4">
          <h3 className="font-semibold text-lg">Roadmap Indisponível</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Gere o "Prompt de Plano" na aba anterior para desbloquear a criação
            do roadmap.
          </p>
        </div>
      </div>
    );
  }

  if (!profile.roadmap) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 border rounded-xl border-dashed bg-muted/10">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="relative p-4 bg-background border rounded-full shadow-sm">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="max-w-lg px-4 space-y-2">
          <h3 className="font-semibold text-xl tracking-tight">
            Gerar Roadmap Inteligente
          </h3>
          <p className="text-muted-foreground text-sm">
            Nossa IA irá criar um plano de estudos personalizado de 6 a 12
            meses, alinhado exatamente aos objetivos do aluno.
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="lg"
          className="w-full max-w-xs shadow-md hover:shadow-lg transition-all"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando plano...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Roadmap
            </>
          )}
        </Button>
      </div>
    );
  }

  const { roadmap } = profile;

  // --- Main Content ---

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Header & Stats */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Plano de Estudos
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl mt-1">
              {roadmap.objectives.main}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard
            icon={Target}
            label="Nível"
            value={`${roadmap.objectives.startLevel} → ${roadmap.objectives.targetLevel}`}
          />
          <StatsCard
            icon={Calendar}
            label="Prazo"
            value={roadmap.objectives.deadline}
          />
          <StatsCard
            icon={BookOpen}
            label="Aulas"
            value={roadmap.structure.totalLessons}
          />
          <StatsCard
            icon={Clock}
            label="Carga Horária"
            value={roadmap.structure.estimatedHours}
          />
        </div>
      </div>

      {/* 2. Secondary Details (Collapsed) */}
      <Accordion
        type="single"
        collapsible
        className="w-full border rounded-lg bg-card px-4"
      >
        <AccordionItem value="details" className="border-0">
          <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Layers className="h-4 w-4" />
              Ver Metodologia e Tipos de Atividade
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Metodologia
                </h4>
                <ul className="space-y-2">
                  {roadmap.methodology.personalization.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Estilos de Atividade
                </h4>
                <div className="flex flex-wrap gap-2">
                  {roadmap.activityTypes.map((type, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="font-normal px-3 py-1"
                    >
                      {type.style}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Separator />

      {/* 3. Timeline Layout for Lessons */}
      <div className="relative space-y-4 pl-2 md:pl-0 max-h-[calc(100vh-15px)] overflow-auto">
        {/* Vertical Guide Line */}
        <div className="absolute left-[19px] top-2 bottom-6 w-px bg-border md:left-[27px]" />

        {roadmap.lessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={index}
            onEdit={() => setEditingLesson(lesson)}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingLesson}
        onOpenChange={(open) => !open && setEditingLesson(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Conteúdo da Aula</DialogTitle>
            <DialogDescription>
              Ajuste os detalhes específicos desta lição.
            </DialogDescription>
          </DialogHeader>

          {editingLesson && (
            <div className="grid gap-5 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="title"
                    className="text-xs uppercase text-muted-foreground font-semibold"
                  >
                    Título
                  </Label>
                  <Input
                    id="title"
                    value={editingLesson.title}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="subject"
                    className="text-xs uppercase text-muted-foreground font-semibold"
                  >
                    Assunto
                  </Label>
                  <Input
                    id="subject"
                    value={editingLesson.subject}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        subject: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="objective"
                  className="text-xs uppercase text-muted-foreground font-semibold"
                >
                  Objetivo
                </Label>
                <Textarea
                  id="objective"
                  className="min-h-[80px]"
                  value={editingLesson.lessonObjective}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lessonObjective: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="description"
                  className="text-xs uppercase text-muted-foreground font-semibold"
                >
                  Descrição Detalhada
                </Label>
                <Textarea
                  id="description"
                  className="min-h-[80px]"
                  value={editingLesson.description}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="grammar"
                    className="text-xs uppercase text-muted-foreground font-semibold"
                  >
                    Gramática
                  </Label>
                  <Input
                    id="grammar"
                    value={editingLesson.grammarPoint || ""}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        grammarPoint: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold">
                    Vocabulário (csv)
                  </Label>
                  <Input
                    value={editingLesson.vocabulary.join(", ")}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        vocabulary: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground font-semibold">
                  Atividades (uma por linha)
                </Label>
                <Textarea
                  value={editingLesson.activities.join("\n")}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      activities: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingLesson(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLesson} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Sub-Component for Lessons (Collapsible) ---

function LessonCard({
  lesson,
  index,
  onEdit,
}: {
  lesson: RoadmapLesson;
  index: number;
  onEdit: () => void;
}) {
  const [value, setValue] = useState("");
  const isOpen = value === "item-1";

  return (
    <div className="relative pl-10 md:pl-14 group">
      {/* Timeline Node */}
      <div
        className={cn(
          "absolute left-[10px] top-6 md:left-[18px] w-5 h-5 rounded-full z-10 flex items-center justify-center transition-all duration-300",
          isOpen
            ? "bg-primary border-primary"
            : "bg-background border-2 border-primary group-hover:bg-primary/10",
        )}
      >
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            isOpen ? "bg-background" : "bg-primary",
          )}
        />
      </div>

      {/* Accordion Card */}
      <Accordion
        type="single"
        collapsible
        value={value}
        onValueChange={setValue}
        className={cn(
          "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 overflow-hidden",
          isOpen
            ? "ring-1 ring-primary/20 shadow-md"
            : "hover:border-primary/50",
        )}
      >
        <AccordionItem value="item-1" className="border-0">
          <AccordionTrigger className="w-full text-left p-5 md:p-6 cursor-pointer hover:no-underline py-0">
            <div className="flex justify-between items-start gap-4 flex-1">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-primary tracking-wider uppercase">
                    Aula {index + 1}
                  </span>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-xs text-muted-foreground font-medium line-clamp-1">
                    {lesson.subject}
                  </span>
                </div>
                <h3 className="font-semibold text-lg leading-tight mb-2">
                  {lesson.title}
                </h3>

                {!isOpen && (
                  <p className="text-sm text-muted-foreground line-clamp-1 font-normal">
                    {lesson.lessonObjective}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Show condensed tags when closed */}
                {!isOpen && lesson.grammarPoint && (
                  <Badge
                    variant="outline"
                    className="hidden md:flex text-[10px] h-5 px-1.5 border-primary/20 text-primary bg-primary/5"
                  >
                    Gramática
                  </Badge>
                )}
              </div>
            </div>
          </AccordionTrigger>

          {/* Expanded Content */}
          <AccordionContent className="px-5 pb-5 md:px-6 md:pb-6 pt-0 space-y-5">
            <Separator className="bg-border/60 mb-4" />

            {/* 1. Objective & Description */}
            <div>
              <h4 className="text-xs font-bold text-foreground mb-1">
                Objetivo & Descrição
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {lesson.lessonObjective}
                <br />
                <br />
                {lesson.description}
              </p>
            </div>

            {/* 2. Grid for Details */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Grammar */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase">
                    Ponto Gramatical
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {lesson.grammarPoint || "Nenhum ponto específico"}
                </p>
              </div>

              {/* Vocabulary */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase">
                    Vocabulário
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lesson.vocabulary.map((v, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs bg-background hover:bg-background border-none shadow-sm"
                    >
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Activities List */}
            <div>
              <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Roteiro de Atividades
              </h4>
              <ul className="space-y-1.5 pl-1">
                {lesson.activities.map((activity, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex gap-2 items-start"
                  >
                    <span className="text-xs font-mono text-primary/60 mt-0.5">
                      0{i + 1}.
                    </span>
                    {activity}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-2"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent closing when clicking edit
                  onEdit();
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar Conteúdo
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// --- Helper Stats Card ---
function StatsCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-muted/40 border border-transparent hover:border-border transition-colors rounded-lg p-3 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-1 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="font-semibold text-sm truncate" title={String(value)}>
        {value}
      </p>
    </div>
  );
}
