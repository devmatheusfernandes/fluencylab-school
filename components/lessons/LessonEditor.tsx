"use client";

import { useState, useEffect } from "react";
import TipTapWorkbooks from "../workbooks/TipTapWorkbooks";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "sonner";

interface LessonEditorProps {
  lessonId: string;
  initialContent: string;
}

export default function LessonEditor({ lessonId, initialContent }: LessonEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");

  // Update local state when initialContent changes (from server/parent)
  useEffect(() => {
    if (initialContent && content === "") {
      setContent(initialContent);
    }
  }, [initialContent]);

  // Debounced Auto-save
  useEffect(() => {
    // Skip if content matches initial (avoids saving on first load)
    // But we need to track if it actually changed from *current* db state. 
    // For now, we assume any change in `content` state triggers save.
    
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
        toast.error("Erro ao salvar alterações.");
      }
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timeoutId);
  }, [content, lessonId]);

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-sm font-semibold text-gray-500">Editor de Conteúdo</h3>
        <span className={`text-xs ${
          status === "saving" ? "text-yellow-600" : 
          status === "error" ? "text-red-600" : "text-green-600"
        }`}>
          {status === "saving" ? "Salvando..." : 
           status === "error" ? "Erro ao salvar" : "Salvo"}
        </span>
      </div>
      
      <div className="flex-1 border rounded-lg overflow-hidden bg-white shadow-sm">
        <TipTapWorkbooks
          content={content}
          isEditable={true}
          onChange={setContent}
        />
      </div>
    </div>
  );
}
