"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Lesson } from "@/types/learning/lesson";
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
import { createLesson } from "@/actions/lessonProcessing";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/ui/header";
import { NoResults } from "@/components/ui/no-results";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function LessonsPage() {
  const t = useTranslations("MaterialManager");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLang, setNewLang] = useState("en");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

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
            // Handle potential timestamp issues safely
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
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const handleCreate = async () => {
    if (!newTitle) return toast.error(t("errorTitleRequired"));

    setCreating(true);
    try {
      // createLesson(title, language, contentHtml?, audioUrl?)
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

  const formatDate = (value: any) => {
    if (!value) return "-";
    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value?.toDate === "function") {
      date = value.toDate();
    } else if (typeof value === "object" && typeof value.seconds === "number") {
      date = new Date(value.seconds * 1000);
    } else if (
      typeof value === "object" &&
      typeof value._seconds === "number"
    ) {
      date = new Date(value._seconds * 1000);
    } else {
      date = new Date(value);
    }
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300";
      case "reviewing":
        return "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300";
      case "error":
        return "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300";
      default:
        return "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    // @ts-ignore
    return t(`status.${status}`) || status;
  };

  return (
    <div className="container-padding space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Header heading={t("title")} subheading={t("description")} />
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> {t("newLesson")}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card p-6 rounded-xl border space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className=" h-10 w-10 rounded-lg" />
                <Skeleton className=" h-6 w-16 rounded" />
              </div>
              <div className="space-y-2">
                <Skeleton className=" h-6 w-3/4" />
                <Skeleton className=" h-4 w-1/2" />
              </div>
              <div className="pt-4 border-t flex justify-between">
                <Skeleton className=" h-4 w-16" />
                <Skeleton className=" h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <NoResults customMessage={{ withoutSearch: t("noLessons") }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-card p-6 rounded-xl border hover:shadow-md transition cursor-pointer flex flex-col gap-4 group relative overflow-hidden"
              onClick={() =>
                router.push(`/hub/material-manager/lessons/${lesson.id}`)
              }
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-all ease-in-out duration-300" />

              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary text-foreground rounded-lg">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider ${getStatusColor(lesson.status)}`}
                >
                  {getStatusLabel(lesson.status)}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-indigo-600 transition text-foreground">
                  {lesson.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {lesson.language === "en" ? t("english") : t("portuguese")} •{" "}
                  {lesson.level || `${t("level")} ?`}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t text-xs text-muted-foreground flex justify-between items-center">
                <span className="flex items-center gap-1">
                  {(lesson.relatedLearningItemIds?.length || 0) +
                    (lesson.relatedLearningStructureIds?.length || 0)}{" "}
                  {t("items")}
                </span>
                <span>{formatDate(lesson.metadata?.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={creating}
            >
              {t("cancel")}
            </ModalSecondaryButton>
            <ModalPrimaryButton onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t("createLesson")}
            </ModalPrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
