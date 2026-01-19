"use client";

import { useState, useEffect } from "react";
import TipTapWorkbooks from "../workbooks/TipTapWorkbooks";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface LessonEditorProps {
  lessonId: string;
  initialContent: string;
}

export default function LessonEditor({ lessonId, initialContent }: LessonEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const t = useTranslations("LessonEditor");

  useEffect(() => {
    if (initialContent && content === "") {
      setContent(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    if (content === initialContent) return;

    setStatus("saving");
    const timeoutId = setTimeout(async () => {
      try {
        const lessonRef = doc(db, "lessons", lessonId);
        await updateDoc(lessonRef, { content });
        setStatus("saved");
      } catch (error) {
        console.error("Error saving lesson:", error);
        setStatus("error");
        toast.error(t("toastError"));
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, lessonId, initialContent, t]);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex justify-between items-center px-4 py-2 border-b bg-muted/40">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("title")}
        </h3>
        <span
          className={`text-xs ${
            status === "saving"
              ? "text-amber-600"
              : status === "error"
              ? "text-rose-600"
              : "text-emerald-600"
          }`}
        >
          {status === "saving"
            ? t("statusSaving")
            : status === "error"
            ? t("statusError")
            : t("statusSaved")}
        </span>
      </div>

      <div className="flex-1 bg-card border rounded-xl overflow-hidden shadow-sm">
        <TipTapWorkbooks content={content} isEditable={true} onChange={setContent} />
      </div>
    </div>
  );
}
