"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
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

interface NotebookViewerProps {
  studentId: string;
  notebookId: string;
}

interface Notebook {
  id: string;
  title: string;
  description: string;
  createdAt: any;
  updatedAt: any;
  student: string;
  content: any;
}

export default function NotebookViewer({ studentId, notebookId }: NotebookViewerProps) {
  const alunoId = studentId;
  const { data: session } = useSession();
  const rawName = (session?.user?.name || session?.user?.email || "Usuário") as string;
  const first = rawName.split(" ")[0] || rawName;
  const userName = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  const seedSource = (session?.user?.id || rawName) as string;
  const seed = Array.from(seedSource).reduce((a, c) => a + c.charCodeAt(0), 0);
  const seededRandom = (s: number) => {
    let x = s % 2147483647;
    if (x <= 0) x += 2147483646;
    return () => ((x = (x * 16807) % 2147483647) / 2147483647);
  };
  const toHex = (v: number) => {
    const h = v.toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  const hslToHex = (h: number, s: number, l: number) => {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  const rand = seededRandom(seed);
  const paletteSize = 16;
  const palette = Array.from({ length: paletteSize }, () => {
    const h = Math.floor(rand() * 360);
    const s = 60 + Math.floor(rand() * 30);
    const l = 45 + Math.floor(rand() * 20);
    return hslToHex(h, s, l);
  });
  const userColor = palette[Math.floor(rand() * paletteSize)];

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<FirestoreProvider | null>(null);
  const [content, setContent] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(1800000);
  const ydocRef = useRef<Y.Doc | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!alunoId || !notebookId) return;

    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
    }

    const basePath: string[] = ["users", alunoId as string, "Notebooks", notebookId as string];
    const newProvider = new FirestoreProvider(app, ydocRef.current, basePath);

    newProvider.on("synced", (isSynced: boolean) => {});

    setProvider(newProvider);
    return () => {
      if (newProvider) {
        newProvider.destroy();
      }
    };
  }, [alunoId, notebookId]);

  useEffect(() => {
    const fetchNotebookContent = async () => {
      if (!alunoId || !notebookId) return;

      try {
        setLoading(true);
        const notebookDoc = await getDoc(doc(db, `users/${alunoId}/Notebooks/${notebookId}`));

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

          if (fetchedContent) {
            const versionRef = collection(db, `users/${alunoId}/Notebooks/${notebookId}/versions`);
            const recentVersions = await getDocs(query(versionRef, orderBy("timestamp", "desc"), limit(1)));

            const shouldSaveInitial = recentVersions.empty || recentVersions.docs[0].data().content !== fetchedContent;

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
        setError("Erro ao carregar o caderno. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotebookContent();
  }, [alunoId, notebookId]);

  const debouncedSave = useCallback(
    async (newContent: string) => {
      if (!alunoId || !notebookId) return;
      if (newContent === lastSavedContentRef.current) return;
      try {
        await updateDoc(doc(db, `users/${alunoId}/Notebooks/${notebookId}`), {
          content: newContent,
          updatedAt: serverTimestamp(),
        });
        lastSavedContentRef.current = newContent;
      } catch (error) {}
    },
    [alunoId, notebookId]
  );

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        debouncedSave(newContent);
      }, 3000);
      if (notebook) {
        setNotebook({ ...notebook, content: newContent });
      }
    },
    [notebook, debouncedSave]
  );

  const hasSignificantChanges = useCallback(
    (newContent: string, oldContent: string) => {
      if (!oldContent) return true;
      if (!newContent) return false;
      const lengthDiff = Math.abs(newContent.length - oldContent.length);
      const threshold = oldContent.length * 0.05;
      return lengthDiff > threshold || newContent !== oldContent;
    },
    []
  );

  useEffect(() => {
    if (!alunoId || !notebookId || !content) return;

    const saveVersion = async () => {
      try {
        const versionRef = collection(db, `users/${alunoId}/Notebooks/${notebookId}/versions`);
        const recentVersions = await getDocs(query(versionRef, orderBy("timestamp", "desc"), limit(1)));
        const lastVersion = recentVersions.empty ? "" : recentVersions.docs[0].data().content;
        if (!hasSignificantChanges(content, lastVersion)) {
          return;
        }
        await addDoc(versionRef, {
          content,
          timestamp: serverTimestamp(),
          type: "auto",
        });
      } catch (error) {}
    };

    const saveInterval = setInterval(() => {
      saveVersion();
      setTimeLeft(1800000);
    }, 1800000);

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1000, 0));
    }, 1000);

    const handleBeforeUnload = () => {
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Caderno não encontrado! </strong>
          <span className="block sm:inline">O caderno solicitado não foi encontrado.</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fade-in min-h-screen">
      <TiptapEditor
        content={content || notebook?.content || ""}
        onSave={handleContentChange}
        placeholder="Comece a escrever o conteúdo do caderno..."
        className="min-h-screen"
        ydoc={ydocRef.current}
        provider={provider}
        docId={`notebook_${String(alunoId)}_${String(notebookId)}`}
        userName={userName}
        userColor={userColor}
      />
    </motion.div>
  );
}
