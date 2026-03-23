"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import TiptapEditor from "@/components/tiptap/tiptap";
import { SpinnerLoading } from "@/components/transitions/spinner-loading";

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
  transcriptions?: { date: any; content: string }[];
  studentName?: string;
}

export default function NotebookViewer({
  studentId,
  notebookId,
}: NotebookViewerProps) {
  const { data: session } = useSession();

  const { userName, userColor } = useMemo(() => {
    const rawName = (session?.user?.name ||
      session?.user?.email ||
      "Usuário") as string;
    const first = rawName.split(" ")[0] || rawName;
    const name = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();

    const seedSource = (session?.user?.id || rawName) as string;
    const seed = Array.from(seedSource).reduce(
      (a, c) => a + c.charCodeAt(0),
      0,
    );
    const seededRandom = (s: number) => {
      let x = s % 2147483647;
      if (x <= 0) x += 2147483646;
      return () => (x = (x * 16807) % 2147483647) / 2147483647;
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
      const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      const r = Math.round(255 * f(0));
      const g = Math.round(255 * f(8));
      const b = Math.round(255 * f(4));
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const rand = seededRandom(seed);
    const paletteSize = 16;
    const palette = Array.from({ length: paletteSize }, () => {
      return hslToHex(
        Math.floor(rand() * 360),
        60 + Math.floor(rand() * 30),
        45 + Math.floor(rand() * 20),
      );
    });

    return {
      userName: name,
      userColor: palette[Math.floor(rand() * paletteSize)],
    };
  }, [session]);

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<FirestoreProvider | null>(null);

  const ydocRef = useRef<Y.Doc | null>(null);
  const lastSavedVersionRef = useRef<string>("");

  useEffect(() => {
    if (!studentId || !notebookId) return;

    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
    }

    const basePath: string[] = ["users", studentId, "Notebooks", notebookId];
    const newProvider = new FirestoreProvider(app, ydocRef.current, basePath);

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
    };
  }, [studentId, notebookId]);

  useEffect(() => {
    const fetchNotebookMetadata = async () => {
      if (!studentId || !notebookId) return;

      try {
        setLoading(true);
        const notebookDoc = await getDoc(
          doc(db, `users/${studentId}/Notebooks/${notebookId}`),
        );

        if (notebookDoc.exists()) {
          const data = notebookDoc.data();
          setNotebook({
            id: notebookId,
            title: data.title || "Caderno",
            description: data.description || "",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            student: studentId,
            transcriptions: data.transcriptions || [],
            studentName: data.studentName || "Aluno",
          });

          // Puxa a última versão de backup apenas para ter uma base de comparação
          const versionRef = collection(
            db,
            `users/${studentId}/Notebooks/${notebookId}/versions`,
          );
          const recentVersions = await getDocs(
            query(versionRef, orderBy("timestamp", "desc"), limit(1)),
          );
          if (!recentVersions.empty) {
            lastSavedVersionRef.current =
              recentVersions.docs[0].data().content || "";
          }
        }
      } catch (err) {
        setError("Erro ao carregar o caderno. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotebookMetadata();
  }, [studentId, notebookId]);

  const handleTitleChange = async (newTitle: string) => {
    if (!studentId || !notebookId || !notebook) return;
    setNotebook({ ...notebook, title: newTitle });
    try {
      await updateDoc(doc(db, `users/${studentId}/Notebooks/${notebookId}`), {
        title: newTitle,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const hasSignificantChanges = useCallback(
    (newContent: string, oldContent: string) => {
      if (!oldContent) return true;
      if (!newContent) return false;
      const lengthDiff = Math.abs(newContent.length - oldContent.length);
      const threshold = oldContent.length * 0.05; // 5% de mudança
      return lengthDiff > threshold || newContent !== oldContent;
    },
    [],
  );

  // 4. BACKUP DE 5 MINUTOS: Lê da memória (Y.Doc) e salva um backup legível
  useEffect(() => {
    if (!studentId || !notebookId) return;

    const saveVersion = async () => {
      if (!ydocRef.current) return;

      // Extrai o conteúdo do Tiptap que vive no Yjs no fragmento 'default'
      const currentJson = ydocRef.current.getXmlFragment("default").toJSON();
      const stringifiedContent = JSON.stringify(currentJson || {});

      // Evita salvar documentos vazios
      if (
        !stringifiedContent ||
        stringifiedContent === "{}" ||
        stringifiedContent === "[]"
      )
        return;

      // Só faz requisição se houve diferença de fato
      if (
        !hasSignificantChanges(stringifiedContent, lastSavedVersionRef.current)
      ) {
        return;
      }

      try {
        const versionRef = collection(
          db,
          `users/${studentId}/Notebooks/${notebookId}/versions`,
        );
        await addDoc(versionRef, {
          content: stringifiedContent,
          timestamp: serverTimestamp(),
          type: "auto-5min",
        });

        lastSavedVersionRef.current = stringifiedContent;
      } catch (error) {
        console.error("Erro no auto-save:", error);
      }
    };

    const INTERVAL_5_MIN = 5 * 60 * 1000;
    const saveInterval = setInterval(saveVersion, INTERVAL_5_MIN);

    // Salva ao fechar a aba do navegador
    const handleBeforeUnload = () => {
      if (!ydocRef.current) return;
      const currentJson = ydocRef.current.getXmlFragment("default").toJSON();
      const stringifiedContent = JSON.stringify(currentJson || {});

      if (
        hasSignificantChanges(stringifiedContent, lastSavedVersionRef.current)
      ) {
        navigator.sendBeacon(
          `/api/save-notebook`,
          JSON.stringify({
            alunoId: studentId,
            notebookId,
            content: stringifiedContent,
          }),
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [studentId, notebookId, hasSignificantChanges]);

  if (loading) {
    return <SpinnerLoading />;
  }

  if (error || !notebook) {
    return (
      <div className="flex justify-center items-center h-64">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">
            {error ? "Erro! " : "Não encontrado! "}
          </strong>
          <span className="block sm:inline">
            {error || "O caderno solicitado não foi encontrado."}
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
        className="min-h-screen"
        ydoc={ydocRef.current}
        provider={provider}
        docId={`notebook_${String(studentId)}_${String(notebookId)}`}
        userName={userName}
        userColor={userColor}
        studentID={studentId}
        notebookId={notebookId}
        title={notebook.title}
        onTitleChange={handleTitleChange}
        studentName={notebook.studentName}
      />
    </motion.div>
  );
}
