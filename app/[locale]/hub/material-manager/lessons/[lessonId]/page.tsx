"use client";

import { useEffect, useState, use } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Lesson } from "@/types/learning/lesson";
import LessonOperations from "@/components/lessons/LessonOperations";
import LessonEditor from "@/components/lessons/LessonEditor";
import { Spinner } from "@/components/ui/spinner";
import ErrorAlert from "@/components/ui/error-alert";
import { Header } from "@/components/ui/header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";

export default function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMobileView, setActiveMobileView] = useState<
    "operations" | "editor"
  >("operations");
  const t = useTranslations("MaterialManager");

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "lessons", lessonId),
      (docSnap) => {
        if (docSnap.exists()) {
          setLesson({ id: docSnap.id, ...docSnap.data() } as Lesson);
        } else {
          setLesson(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching lesson:", error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [lessonId]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );

  if (!lesson)
    return (
      <div className="p-4 md:p-8">
        <ErrorAlert message={t("lessonNotFound")} />
      </div>
    );

  return (
    <div className="container-padding overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <Header
          heading={lesson.title}
          subheading={t("description")}
          backHref="/hub/material-manager/lessons"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:hidden">
          <Tabs
            value={activeMobileView}
            onValueChange={(value) =>
              setActiveMobileView(value as "operations" | "editor")
            }
            className="w-full mb-4"
          >
            <TabsList className="w-full">
              <TabsTrigger value="operations" className="flex-1">
                {t("detailTabOperations")}
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex-1">
                {t("detailTabEditor")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div
          className={`${
            activeMobileView === "operations" ? "block" : "hidden"
          } lg:block lg:col-span-4 h-[calc(100vh-13rem)]`}
        >
          <div className="h-full bg-card border rounded-xl overflow-hidden">
            <LessonOperations lesson={lesson} />
          </div>
        </div>
        <div
          className={`${
            activeMobileView === "editor" ? "block" : "hidden"
          } lg:block lg:col-span-8 h-[calc(100vh-13rem)]`}
        >
          <div className="h-full bg-card border rounded-xl overflow-hidden">
            <LessonEditor
              lessonId={lesson.id}
              initialContent={lesson.content}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
