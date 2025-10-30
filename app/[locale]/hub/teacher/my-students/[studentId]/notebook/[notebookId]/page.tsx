"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import * as Y from "yjs";
import { FirestoreProvider } from "@gmcfall/yjs-firestore-provider";
import { app, db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { Spinner } from "@/components/ui/spinner";
import TiptapEditor from "@/components/editor/tiptap";

interface Notebook {
  id: string;
  title: string;
  description: string;
  createdAt: any;
  updatedAt: any;
  student: string;
  content: any;
}

export default function VisualizarCaderno() {
  const { alunoId, notebookId } = useParams();
  const { data: session } = useSession();

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<FirestoreProvider | null>(null);
  const [content, setContent] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(600000); // 10 minutes in milliseconds
  const ydocRef = useRef<Y.Doc | null>(null);

  // Y.js and FirestoreProvider setup
  useEffect(() => {
    if (!alunoId || !notebookId) return;

    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
    }

    const basePath: string[] = [
      "users",
      alunoId as string,
      "Notebooks",
      notebookId as string,
    ];
    const newProvider = new FirestoreProvider(app, ydocRef.current, basePath);

    newProvider.on("synced", (isSynced: boolean) => {
      console.log("Provider synced:", isSynced);
    });

    newProvider.on("update", (update: any) => {
      console.log("Update sent to Firestore:", update);
    });

    setProvider(newProvider);
    return () => {
      if (newProvider) {
        newProvider.destroy();
      }
    };
  }, [alunoId, notebookId]);

  // Fetch notebook content and initialize Y.js document
  useEffect(() => {
    const fetchNotebookContent = async () => {
      if (!alunoId || !notebookId) return;

      try {
        setLoading(true);
        const notebookDoc = await getDoc(
          doc(db, `users/${alunoId}/Notebooks/${notebookId}`)
        );

        if (notebookDoc.exists()) {
          const notebookData = notebookDoc.data();
          const fetchedContent = notebookData.content || "";

          // Set notebook data
          setNotebook({
            id: notebookId as string,
            title: notebookData.title || "Caderno",
            description: notebookData.description || "",
            createdAt: notebookData.createdAt,
            updatedAt: notebookData.updatedAt,
            student: alunoId as string,
            content: fetchedContent,
          });

          const versionRef = collection(
            db,
            `users/${alunoId}/Notebooks/${notebookId}/versions`
          );
          const versionSnapshot = await getDocs(versionRef);

          const isAlreadySaved = versionSnapshot.docs.some(
            (doc) => doc.data().content === fetchedContent
          );

          if (!isAlreadySaved && fetchedContent) {
            const timestamp = new Date();
            await addDoc(versionRef, {
              content: fetchedContent,
              date: timestamp.toLocaleDateString(),
              time: timestamp.toLocaleTimeString(),
            });
          } else {
            console.log("Fetched content is already saved, skipping...");
          }

          if (ydocRef.current) {
            ydocRef.current
              .getText("content")
              .delete(0, ydocRef.current.getText("content").length);
            ydocRef.current.getText("content").insert(0, fetchedContent);
          }

          setContent(fetchedContent);
        }
      } catch (error) {
        console.error("Error fetching notebook content:", error);
        setError("Erro ao carregar o caderno. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotebookContent();
  }, [alunoId, notebookId]);

  const handleContentChange = async (newContent: string) => {
    setContent(newContent);

    if (!alunoId || !notebookId) return;

    try {
      await updateDoc(doc(db, `users/${alunoId}/Notebooks/${notebookId}`), {
        content: newContent,
      });

      // Update local notebook state
      if (notebook) {
        setNotebook({ ...notebook, content: newContent });
      }
    } catch (error) {
      console.error("Error saving content to Firestore:", error);
    }
  };

  // Version saving with intervals and beforeunload
  useEffect(() => {
    if (!alunoId || !notebookId || !content) return;

    const saveVersion = async () => {
      try {
        const timestamp = new Date();
        await addDoc(
          collection(db, `users/${alunoId}/Notebooks/${notebookId}/versions`),
          {
            content,
            date: timestamp.toLocaleDateString(),
            time: timestamp.toLocaleTimeString(),
          }
        );
      } catch (error) {
        console.error("Error saving version: ", error);
      }
    };

    const saveInterval = setInterval(() => {
      saveVersion();
      setTimeLeft(600000); // Reset to 10 minutes
    }, 600000); // Save every 10 minutes

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1000, 0));
    }, 1000);

    const handleBeforeUnload = () => {
      saveVersion();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      clearInterval(countdownInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [content, alunoId, notebookId]);

  if (loading) {
    return (
      <div className="min-w-screen min-h-[90vh] flex justify-center items-center overflow-y-hidden">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Erro! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Caderno não encontrado! </strong>
          <span className="block sm:inline">
            O caderno solicitado não foi encontrado.
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fade-in min-h-screen"
    >
      <TiptapEditor
        content={content || notebook.content || ""}
        onSave={handleContentChange}
        placeholder="Comece a escrever o conteúdo do caderno..."
        className="min-h-screen"
        ydoc={ydocRef.current}
      />
    </motion.div>
  );
}
