"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { getDoc, doc } from "firebase/firestore";
import TipTapWorkbooks from "@/components/workbooks/TipTapWorkbooks";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations } from "next-intl";

interface AdminNotebookViewerProps {
  studentId: string;
  notebookId: string;
}

export default function AdminNotebookViewer({ studentId, notebookId }: AdminNotebookViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("AdminClassDetails");

  useEffect(() => {
    const fetchNotebookContent = async () => {
      if (!studentId || !notebookId) return;

      try {
        const notebookDoc = await getDoc(doc(db, `users/${studentId}/Notebooks/${notebookId}`));
        if (notebookDoc.exists()) {
          setContent(notebookDoc.data().content || "");
        } else {
            setError(t("notFound"));
        }
      } catch (error) {
        console.error("Error fetching notebook content:", error);
        setError(t("notFound"));
      } finally {
        setLoading(false);
      }
    };

    fetchNotebookContent();
  }, [studentId, notebookId, t]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
      return (
          <div className="min-h-screen p-8 flex justify-center items-center">
              <p className="text-red-500">{error}</p>
          </div>
      )
  }

  return (
    <div className="min-w-screen min-h-screen">
        <TipTapWorkbooks
          content={content}
          isEditable={true}
          onChange={() => {}}
        />
    </div>
  );
}
