"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Lesson } from "@/types/learning/lesson";
import { useRouter } from "next/navigation";
import {
  Plus,
  BookOpen,
  Loader2,
  Trash2,
  Calendar,
  MoreVertical,
  Puzzle,
  Layers,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Componentes UI
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
  ModalBody,
  ModalField,
  ModalInput,
} from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { NoResults } from "@/components/ui/no-results";
import { Skeleton } from "@/components/ui/skeleton";
import { WizardModal, WizardStep } from "@/components/ui/wizard"; // Certifique-se de importar o Wizard criado
import { createLesson } from "@/actions/lessonProcessing";
import BreadcrumbActions from "@/components/shared/Breadcrum/BreadcrumbActions";
import BreadcrumbActionIcon from "@/components/shared/Breadcrum/BreadcrumbActionIcon";

export default function LessonsPage() {
  const t = useTranslations("MaterialManager");
  const router = useRouter();

  // --- Estados ---
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Create States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLang, setNewLang] = useState("en");
  const [creating, setCreating] = useState(false);

  // Delete States
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const q = query(
      collection(db, "lessons"),
      orderBy("metadata.updatedAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Lesson[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            ...data,
            metadata: {
              ...data.metadata,
              updatedAt: data.metadata?.updatedAt,
            },
          } as Lesson);
        });
        setLessons(list);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Erro ao carregar lições");
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // --- Handlers ---

  const handleCreate = async () => {
    if (!newTitle) return toast.error(t("errorTitleRequired"));

    setCreating(true);
    try {
      const res = await createLesson(newTitle, newLang);

      if (res.success && res.id) {
        toast.success(t("successCreated"));
        setIsCreateOpen(false);
        setNewTitle("");
        router.push(`/hub/material-manager/lessons/${res.id}`);
      } else {
        toast.error(t("errorCreate"));
      }
    } catch (e) {
      toast.error(t("serverError"));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!lessonToDelete) return;
    setIsDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "lessons", lessonToDelete));
      toast.success("Lição excluída com sucesso");
      setLessonToDelete(null); // Fecha o modal
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir lição");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // --- Helpers ---

  const formatDate = (value: any) => {
    if (!value) return "-";
    let date: Date;
    if (value?.toDate) date = value.toDate();
    else if (value?.seconds) date = new Date(value.seconds * 1000);
    else date = new Date(value);

    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case "reviewing":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "error":
        return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  // --- Configuração do Wizard ---
  const wizardSteps: WizardStep[] = [
    {
      id: "components",
      title: "Learning Components",
      description: "A base de tudo.",
      icon: Puzzle,
      headerBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      content: (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Podem ser vocabulário (palavra) ou estruturas de frase (SVO, SOV).
            <br />
            São os blocos fundamentais do aprendizado que compõem todo o resto.
          </p>
        </div>
      ),
    },
    {
      id: "lessons",
      title: "Lessons (Aulas)",
      description: "Onde o conteúdo ganha vida.",
      icon: BookOpen,
      headerBg: "bg-emerald-100 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      content: (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Compostas pelos Learning Components. Incluem quizzes, dinâmicas,
            conteúdo explicativo e áudio (podcast).
            <br />
            Variam em dificuldade, idioma e assunto.
          </p>
        </div>
      ),
    },
    {
      id: "plans",
      title: "Planos de Aula",
      description: "Organização estratégica.",
      icon: Layers,
      headerBg: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      content: (
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Conjunto de aulas (Lessons) organizadas logicamente.
            <br />
            Podem ser personalizados para necessidades específicas ou
            padronizados como apostilas customizáveis para turmas.
          </p>
        </div>
      ),
    },
  ];

  // --- Render ---

  return (
    <div className="container-padding space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <Header
        heading={t("title")}
        subheading={t("description")}
        icon={
          <>
            <div className="flex flex-row items-center gap-2">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" /> {t("newLesson")}
              </Button>
              <Button
                variant="glass"
                size="icon"
                onClick={() => setIsWizardOpen(true)}
                title="Como funciona?"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
            </div>

            <BreadcrumbActions>
              <BreadcrumbActionIcon
                onClick={() => setIsCreateOpen(true)}
                icon={Plus}
              />

              <BreadcrumbActionIcon
                onClick={() => setIsWizardOpen(true)}
                icon={HelpCircle}
              />
            </BreadcrumbActions>
          </>
        }
      />

      {/* Grid Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-card p-6 rounded-xl border space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="pt-4 border-t flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <NoResults customMessage={{ withoutSearch: t("noLessons") }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() =>
                router.push(`/hub/material-manager/lessons/${lesson.id}`)
              }
              className="group relative bg-card hover:bg-accent/5 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col"
            >
              {/* Barra lateral colorida no hover */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />

              <div className="p-5 flex flex-col h-full gap-4">
                {/* Top Row: Icon & Status */}
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider border",
                        getStatusColor(lesson.status),
                      )}
                    >
                      {/* @ts-ignore */}
                      {t(`status.${lesson.status}`) || lesson.status}
                    </span>

                    {/* Delete Button (Stop Propagation) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLessonToDelete(lesson.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Middle: Title & Meta */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {lesson.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="uppercase font-medium">
                      {lesson.language === "en" ? "EN-US" : "PT-BR"}
                    </span>
                    <span>•</span>
                    <span>{lesson.level || "N/A"}</span>
                  </div>
                </div>

                {/* Footer: Date & Counts */}
                <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <div
                    className="flex items-center gap-1.5"
                    title="Data de atualização"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(lesson.metadata?.updatedAt)}</span>
                  </div>
                  <div className="font-medium bg-secondary/50 px-2 py-0.5 rounded">
                    {(lesson.relatedLearningItemIds?.length || 0) +
                      (lesson.relatedLearningStructureIds?.length || 0)}{" "}
                    {t("items")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <ModalContent>
          <ModalIcon type="document" />
          <ModalHeader>
            <ModalTitle>{t("newLesson")}</ModalTitle>
            <ModalDescription>{t("createLessonDescription")}</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <ModalField label={t("titleLabel")} required>
                <ModalInput
                  placeholder={t("titlePlaceholder")}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </ModalField>
              <ModalField label={t("languageLabel")}>
                <Select value={newLang} onValueChange={setNewLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("english")}</SelectItem>
                    <SelectItem value="pt">{t("portuguese")}</SelectItem>
                  </SelectContent>
                </Select>
              </ModalField>
            </div>
          </ModalBody>
          <ModalFooter>
            <ModalSecondaryButton
              onClick={() => setIsCreateOpen(false)}
              disabled={creating}
            >
              {t("cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t("createLesson")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <Modal
        open={!!lessonToDelete}
        onOpenChange={(open) => !open && setLessonToDelete(null)}
      >
        <ModalContent>
          <ModalIcon type="delete" />
          <ModalHeader>
            <ModalTitle>Excluir Lição?</ModalTitle>
            <ModalDescription>
              Tem certeza que deseja excluir esta lição? Esta ação não pode ser
              desfeita e removerá todos os dados associados.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalSecondaryButton
              onClick={() => setLessonToDelete(null)}
              disabled={isDeleteLoading}
            >
              Cancelar
            </ModalSecondaryButton>
            <ModalPrimaryButton
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleteLoading}
            >
              {isDeleteLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Excluir Definitivamente
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* --- WIZARD MODAL --- */}
      <WizardModal
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        steps={wizardSteps}
        onComplete={() => setIsWizardOpen(false)}
        submitLabel="Entendi"
      />
    </div>
  );
}
