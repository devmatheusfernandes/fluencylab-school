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
import { useIsMobile } from "@/hooks/use-mobile"; // Assumindo que você tem esse hook
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

  // Fecha a sidebar automaticamente ao mudar para mobile/desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

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
    if (isMobile) setSidebarOpen(false); // Fecha sidebar no mobile ao selecionar

    const params = new URLSearchParams();
    params.set("book", String(lesson.workbook ?? ""));
    params.set("lesson", String(lesson.docID ?? ""));
    params.set("workbook", String(lesson.workbook ?? ""));

    router.replace(`?${params.toString()}`);
  };

  if (!book) return null;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-background">
      
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
            {activeLesson?.title || "Lições"}
          </h1>
        </div>
        
        {workbookGuidelines && (
           <button 
             onClick={() => setShowGuidelines(true)}
             className="text-blue-600 dark:text-blue-400 p-2"
           >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </button>
        )}
      </div>

      {/* --- OVERLAY PARA MOBILE --- */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR CONTAINER --- */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || !isMobile) && (
          <motion.div
            // Lógica de Animação: Mobile usa X (slide), Desktop usa Width (collapse)
            initial={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
            animate={
              isMobile 
                ? { x: 0 } 
                : { width: sidebarCollapsed ? "64px" : "320px", opacity: 1 }
            }
            exit={isMobile ? { x: "-100%" } : { width: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            
            // Classes: Mobile é fixed e full height. Desktop é relative.
            className={`
              z-50 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col
              ${isMobile ? "fixed inset-y-0 left-0 w-[85vw] max-w-[320px] shadow-2xl" : "h-full"}
            `}
          >
            {/* Header da Sidebar */}
            <div className={`
              border-b dark:border-gray-800 flex items-center transition-all bg-gray-50 dark:bg-gray-900/50
              ${sidebarCollapsed && !isMobile ? 'p-2 justify-center' : 'p-4 justify-between'}
              ${isMobile ? 'pt-4' : ''}
            `}>
              <h2 className={`font-bold text-lg text-gray-800 dark:text-white ${sidebarCollapsed && !isMobile ? 'hidden' : 'block'}`}>
                Navegação
              </h2>
              
              {/* Botão Fechar (Apenas Mobile) */}
              {isMobile && (
                <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:text-red-500">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                </button>
              )}

              {/* Botão Collapse (Apenas Desktop) */}
              {!isMobile && (
                 <button
                 onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                 className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
               >
                 {sidebarCollapsed ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                 ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                 )}
               </button>
              )}
            </div>

            {/* Conteúdo da Sidebar */}
            <div className="flex-1 overflow-hidden">
              <Sidebar
                lessons={lessons}
                activeLesson={activeLesson}
                onSelectLesson={handleSelectLesson}
                collapsed={sidebarCollapsed && !isMobile}
              />
            </div>

            {/* Guia no Desktop (Footer da sidebar) */}
            {!isMobile && !sidebarCollapsed && workbookGuidelines && (
                <div className="p-4 border-t dark:border-gray-800">
                    <button 
                        onClick={() => setShowGuidelines(true)}
                        className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Ver Guia de Estudos
                    </button>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative pt-[60px] md:pt-0">
        {activeLesson ? (
          <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden bg-background">
            <div className="max-w-4xl mx-auto">
               <LessonViewer key={activeLesson.docID ?? ""} lesson={activeLesson.docID ?? null} workbook={activeLesson.workbook ?? null} />
            </div>
            {/* Espaço extra no final para mobile não cortar conteúdo com barras de navegação do browser */}
            <div className="h-20 md:h-0" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-6 text-center">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <p className="text-lg font-medium">Selecione uma lição para começar</p>
            <button onClick={() => setSidebarOpen(true)} className="mt-4 md:hidden text-blue-500 underline">Abrir menu</button>
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