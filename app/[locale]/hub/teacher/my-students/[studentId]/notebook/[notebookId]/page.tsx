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
  query,
  orderBy,
  limit,
  serverTimestamp,
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
  const { studentId, notebookId } = useParams();
  const { data: session } = useSession();
  const alunoId = studentId as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<FirestoreProvider | null>(null);
  const [content, setContent] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(1800000); // 30 minutos
  const ydocRef = useRef<Y.Doc | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

          setNotebook({
            id: notebookId as string,
            title: notebookData.title || "Caderno",
            description: notebookData.description || "",
            createdAt: notebookData.createdAt,
            updatedAt: notebookData.updatedAt,
            student: alunoId as string,
            content: fetchedContent,
          });

          setContent(fetchedContent);
          lastSavedContentRef.current = fetchedContent;

          // Salva versão inicial apenas se não existir uma recente
          if (fetchedContent) {
            const versionRef = collection(
              db,
              `users/${alunoId}/Notebooks/${notebookId}/versions`
            );
            const recentVersions = await getDocs(
              query(versionRef, orderBy("timestamp", "desc"), limit(1))
            );

            const shouldSaveInitial =
              recentVersions.empty ||
              recentVersions.docs[0].data().content !== fetchedContent;

            if (shouldSaveInitial) {
              await addDoc(versionRef, {
                content: fetchedContent,
                timestamp: serverTimestamp(),
                type: "initial",
              });
            }
          }
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

  // Debounced content save - apenas se houver mudanças significativas
  const debouncedSave = useCallback(
    async (newContent: string) => {
      if (!alunoId || !notebookId) return;

      // Só salva se o conteúdo mudou de verdade
      if (newContent === lastSavedContentRef.current) return;

      try {
        // O Y.js já sincroniza automaticamente, então só atualizamos o campo content
        // como fallback para leituras diretas do Firestore
        await updateDoc(doc(db, `users/${alunoId}/Notebooks/${notebookId}`), {
          content: newContent,
          updatedAt: serverTimestamp(),
        });

        lastSavedContentRef.current = newContent;
        console.log("Content saved to Firestore");
      } catch (error) {
        console.error("Error saving content to Firestore:", error);
      }
    },
    [alunoId, notebookId]
  );

  // Handle content changes with debounce
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);

      // Cancela o timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Agenda novo save após 3 segundos de inatividade
      saveTimeoutRef.current = setTimeout(() => {
        debouncedSave(newContent);
      }, 3000);

      // Update local notebook state
      if (notebook) {
        setNotebook({ ...notebook, content: newContent });
      }
    },
    [notebook, debouncedSave]
  );

  // Calcula se houve mudanças significativas (mais de 5% de diferença)
  const hasSignificantChanges = useCallback(
    (newContent: string, oldContent: string) => {
      if (!oldContent) return true;
      if (!newContent) return false;

      const lengthDiff = Math.abs(newContent.length - oldContent.length);
      const threshold = oldContent.length * 0.05; // 5% de mudança

      return lengthDiff > threshold || newContent !== oldContent;
    },
    []
  );

  // Version saving - apenas quando houver mudanças significativas
  useEffect(() => {
    if (!alunoId || !notebookId || !content) return;

    const saveVersion = async () => {
      try {
        // Busca a última versão salva
        const versionRef = collection(
          db,
          `users/${alunoId}/Notebooks/${notebookId}/versions`
        );
        const recentVersions = await getDocs(
          query(versionRef, orderBy("timestamp", "desc"), limit(1))
        );

        const lastVersion = recentVersions.empty
          ? ""
          : recentVersions.docs[0].data().content;

        // Só salva se houver mudanças significativas
        if (!hasSignificantChanges(content, lastVersion)) {
          console.log("No significant changes, skipping version save");
          return;
        }

        await addDoc(versionRef, {
          content,
          timestamp: serverTimestamp(),
          type: "auto",
        });

        console.log("Version saved");
      } catch (error) {
        console.error("Error saving version: ", error);
      }
    };

    // Salva a cada 30 minutos (reduzido de 10)
    const saveInterval = setInterval(() => {
      saveVersion();
      setTimeLeft(1800000); // Reset to 30 minutes
    }, 1800000);

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1000, 0));
    }, 1000);

    // Salva antes de sair da página
    const handleBeforeUnload = () => {
      // Força save imediato antes de sair
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      navigator.sendBeacon(
        `/api/save-notebook`,
        JSON.stringify({
          alunoId,
          notebookId,
          content,
        })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      clearInterval(countdownInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, alunoId, notebookId, hasSignificantChanges]);

  if (loading) {
    return (
      <div className="min-w-screen min-h-[90vh] flex justify-center items-center overflow-y-hidden">
        <Spinner className="w-16 h-16" />
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
