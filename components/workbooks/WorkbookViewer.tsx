'use client';
import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Sidebar from "./Sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import GuidelinesModal from "./GuidelinesModal";
import { Notebook } from "@/types/notebooks/notebooks";
import { markdownComponents } from "./MarkdownComponents";
import LessonViewer from "./LessonViewer";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkbookViewer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const book = searchParams.get('book');
  const lessonId = searchParams.get("lesson");
  const workbook = searchParams.get("workbook");

  const [lessons, setLessons] = useState<Notebook[]>([]);
  const [activeLesson, setActiveLesson] = useState<Notebook | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [workbookGuidelines, setWorkbookGuidelines] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!book) return;

    const colRef = collection(db, `Apostilas/${book}/Lessons`);
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const notes: Notebook[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as Notebook;
        notes.push({ ...data, docID: doc.id, workbook: book });
      });
      notes.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
      setLessons(notes);

      if (!lessonId && notes.length > 0) {
        setActiveLesson(notes[0]);
      }
    });

    const fetchGuidelines = async () => {
      const docRef = doc(db, "Apostilas", book);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWorkbookGuidelines(docSnap.data()?.guidelines || "");
      }
    };
    fetchGuidelines();

    return () => unsubscribe();
  }, [book, lessonId]);

  useEffect(() => {
    if (!lessonId || !workbook) return;

    const fetchLesson = async () => {
      const docRef = doc(db, `Apostilas`, workbook as string, "Lessons", lessonId as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Notebook;
        setActiveLesson({ ...data, docID: lessonId as string, workbook: workbook as string });
      }
    };

    fetchLesson();
  }, [lessonId, workbook]);

  const handleSelectLesson = (lesson: Notebook) => {
    setActiveLesson(lesson);
    setSidebarOpen(false);

    const params = new URLSearchParams();
    params.set("book", String(lesson.workbook ?? ""));
    params.set("lesson", String(lesson.docID ?? ""));
    params.set("workbook", String(lesson.workbook ?? ""));

    router.replace(`?${params.toString()}`);
  };

  if (!book) return null;

  return (
    <div className="flex flex-col md:flex-row h-[95vh] overflow-hidden rounded-lg">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden flex items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-800 dark:text-white">
          {activeLesson?.title || "Selecione uma lição"}
        </h1>
      </div>

      {/* Sidebar with animation */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || !isMobile) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: sidebarCollapsed && !isMobile ? "64px" : isMobile ? "280px" : "320px",
              opacity: 1 
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.4, 0, 0.2, 1]
            }}
            className="border-r dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
          >
            <div className={`border-b sidebar-base flex items-center transition-all ${sidebarCollapsed ? 'p-2 justify-center' : 'p-4 justify-between'}`}>
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                className={`text-lg font-bold text-gray-800 dark:text-white whitespace-nowrap ${sidebarCollapsed ? 'hidden' : 'block'}`}
              >
                Lições
              </motion.h1>

              <AnimatePresence>
                {workbookGuidelines && !sidebarCollapsed && !isMobile && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setShowGuidelines(true)}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm font-medium"
                  >
                    Guia
                  </motion.button>
                )}
              </AnimatePresence>

              {!isMobile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <motion.div
                    animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </motion.div>
                </motion.button>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center"
            >
              <Sidebar
                lessons={lessons}
                activeLesson={activeLesson}
                onSelectLesson={handleSelectLesson}
                collapsed={sidebarCollapsed}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeLesson ? (
          <div className="flex-1 p-6 overflow-auto bg-background no-scrollbar">
            <LessonViewer key={activeLesson.docID ?? ""} lesson={activeLesson.docID ?? null} workbook={activeLesson.workbook ?? null} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Selecione uma lição
          </div>
        )}
      </div>

      {/* Guidelines modal */}
      {showGuidelines && (
        <GuidelinesModal 
          guidelines={workbookGuidelines} 
          onClose={() => setShowGuidelines(false)} 
          markdownComponents={markdownComponents}
        />
      )}
    </div>
  );
}
