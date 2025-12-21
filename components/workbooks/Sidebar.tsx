"use client";
import { useState, useRef, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Notebook } from "@/types/notebooks/notebooks";
import { useSession } from "next-auth/react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function Sidebar({
  lessons,
  activeLesson,
  onSelectLesson,
  collapsed,
}: {
  lessons: Notebook[];
  activeLesson: Notebook | null;
  onSelectLesson: (lesson: Notebook) => void;
  collapsed: boolean;
}) {
  const [editingLessonId, setEditingLessonId] = useState<string | undefined | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});
  const activeLessonRef = useRef<HTMLButtonElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const grouped = lessons.reduce((acc, lesson) => {
    const unitKey = (lesson.unit ?? "Geral").toString(); // Fallback para "Geral" se null
    acc[unitKey] = acc[unitKey] || [];
    acc[unitKey].push(lesson);
    return acc;
  }, {} as Record<string, Notebook[]>);

  // Ordenação numérica inteligente para Unidades (1, 2, 10 vem depois de 2)
  const groupedEntries = Object.entries(grouped).sort((a, b) => 
    a[0].localeCompare(b[0], undefined, { numeric: true })
  );

  useEffect(() => {
    if (activeLesson && activeLessonRef.current && !collapsed) {
      setTimeout(() => {
         activeLessonRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center' // Centraliza melhor na tela
         });
      }, 300);
    }
  }, [activeLesson, collapsed]);

  // ... (Funções de edição mantidas iguais: handleEditStart, handleEditCancel, handleEditSave, handleKeyPress)
  // Vou omitir aqui para economizar espaço, mas você deve manter as funções originais do seu código.
  // Apenas certifique-se de importar e usar conforme seu código original.
  const handleEditStart = (lesson: Notebook, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingLessonId(lesson.docID ?? lesson.id);
      setEditingTitle(lesson.title);
  };
  const handleEditCancel = () => { setEditingLessonId(null); setEditingTitle(""); };
  const handleEditSave = async (lesson: Notebook) => { /* Lógica original aqui */ setEditingLessonId(null); };
  const handleKeyPress = (e: React.KeyboardEvent, lesson: Notebook) => { if(e.key === 'Enter') handleEditSave(lesson); };


  return (
    <aside
      className={`
        h-full overflow-y-auto no-scrollbar
        w-full transition-all duration-300
        ${collapsed ? " px-2" : "md:w-full px-4"}
        py-4
      `}
    >
      {!collapsed ? (
        groupedEntries.map(([unit, items]) => (
          <div key={unit} className="mb-6 last:mb-20">
            <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 sticky top-0 bg-white dark:bg-gray-900 z-10 py-1">
              Unidade {unit}
            </h2>
            <ul className="space-y-1">
              {[...items].sort((a, b) => a.title.localeCompare(b.title)).map((lesson) => (
                <li key={lesson.docID ?? lesson.id} className="relative group">
                  {editingLessonId === lesson.docID ? (
                    // --- MODO EDIÇÃO ---
                    <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleEditSave(lesson)}
                        onKeyDown={(e) => handleKeyPress(e, lesson)}
                        className="flex-1 px-2 py-2 text-sm border rounded bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                  ) : (
                    // --- MODO VISUALIZAÇÃO ---
                    <div className="flex items-center">
                      <button
                        ref={(activeLesson?.docID ?? activeLesson?.id) === (lesson.docID ?? lesson.id) ? activeLessonRef : null}
                        onClick={() => onSelectLesson(lesson)}
                        className={`
                          group flex items-start text-left w-full rounded-lg transition-all
                          px-3 md:px-3
                          py-3 md:py-2.5 
                          text-sm md:text-sm
                          border border-transparent
                          ${
                            activeLesson?.docID === lesson.docID
                              ? "bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-100 font-medium border-blue-100 dark:border-blue-500/30 shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                          }
                        `}
                      >
                        <span className="line-clamp-2 leading-relaxed">
                            {titleOverrides[lesson.docID ?? lesson.id] ?? lesson.title}
                        </span>
                      </button>
                      
                      {/* Botão de Edição (Só Admin) */}
                      {session?.user.role === "admin" && (
                        <button
                          onClick={(e) => handleEditStart(lesson, e)}
                          className="md:opacity-0 md:group-hover:opacity-100 p-2 ml-1 text-gray-400 hover:text-blue-600 transition-all"
                          title="Editar título"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        // --- MODO COLAPSADO (DESKTOP ONLY) ---
        <div className="flex flex-col items-center space-y-4 pt-2">
          {groupedEntries.map(([unit, items]) => (
            <Popover key={unit}>
              <PopoverTrigger asChild>
                <button
                  className="
                    w-10 h-10 flex items-center justify-center rounded-xl 
                    bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 
                    text-gray-700 dark:text-gray-300 font-bold text-xs border dark:border-gray-700
                    transition-all hover:scale-105 active:scale-95
                  "
                >
                  {unit}
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="p-0 w-72 overflow-hidden shadow-xl border-none">
                <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg flex flex-col max-h-[60vh]">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                    <h3 className="font-bold text-sm">Unidade {unit}</h3>
                  </div>
                  <ul className="overflow-y-auto p-2 space-y-1">
                    {[...items].sort((a, b) => a.title.localeCompare(b.title)).map((lesson) => (
                      <li key={lesson.docID ?? lesson.id}>
                        <button
                          onClick={() => onSelectLesson(lesson)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            activeLesson?.docID === lesson.docID
                              ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          {titleOverrides[lesson.docID ?? lesson.id] ?? lesson.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      )}
    </aside>
  );
}