"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import TipTapWorkbooks from "./TipTapWorkbooks";
import { Spinner } from "../ui/spinner";

interface LessonViewerProps {
  lesson: string | null;
  workbook: string | null;
}

export default function LessonViewer({ lesson, workbook }: LessonViewerProps) {
  const { data: session } = useSession();

  const [content, setContent] = useState<string>("");
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Set role-based editability
  useEffect(() => {
    if (session) {
      const role = session.user.role;
      setIsEditable(role === "admin"); // Editable only for admin
    }
  }, [session]);

  // Fetch content
  useEffect(() => {
    const fetchNotebookContent = async () => {
      if (!lesson || !workbook) return;

      try {
        const notebookDoc = await getDoc(doc(db, `Apostilas/${workbook}/Lessons/${lesson}`));
        if (notebookDoc.exists()) {
          setContent(notebookDoc.data().content || "");
        } else {
          setContent("");
        }
      } catch (error) {
        console.error("Error fetching notebook content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotebookContent();
  }, [lesson, workbook]);

  // Save content handler
  const handleContentChange = async (newContent: string) => {
    setContent(newContent); // Update local state
    try {
      if (workbook && lesson) {
        await setDoc(
          doc(db, `Apostilas/${workbook}/Lessons/${lesson}`),
          { content: newContent },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error saving notebook content:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <TipTapWorkbooks
      content={content}
      isEditable={isEditable}
      onChange={handleContentChange}
    />
  );
}