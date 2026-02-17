"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronRight,
  ArrowLeft,
  X,
  Library,
  FileText,
  PlusCircle,
  BookOpen,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  collectionGroup,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Workbook, Notebook } from "@/types/notebooks/notebooks";
import { toast } from "sonner";
import { debounce } from "lodash";
import Image from "next/image";

type BaseModalProps = { isOpen: boolean; onClose: () => void; editor: Editor };

export const WorkbookToolModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  editor,
}) => {
  // Dados
  const [workbooks, setWorkbooks] = useState<Workbook[]>([]);
  const [lessons, setLessons] = useState<Notebook[]>([]); // Lições da apostila selecionada
  const [globalSearchResults, setGlobalSearchResults] = useState<Notebook[]>(
    [],
  ); // Resultados da busca global

  // Estados de Controle
  const [selectedWorkbook, setSelectedWorkbook] = useState<Workbook | null>(
    null,
  );
  const [loadingWorkbooks, setLoadingWorkbooks] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- EFEITOS ---

  useEffect(() => {
    if (isOpen) {
      fetchWorkbooks();
    } else {
      // Limpeza ao fechar
      setTimeout(() => {
        setSelectedWorkbook(null);
        setLessons([]);
        setGlobalSearchResults([]);
        setSearchQuery("");
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedWorkbook) {
      fetchLessons(selectedWorkbook.id);
      // Não limpamos o search query aqui caso o usuário queira filtrar dentro da apostila
    } else {
      setLessons([]);
    }
  }, [selectedWorkbook]);

  // Efeito para busca global (Debounce)
  useEffect(() => {
    if (!selectedWorkbook && searchQuery.trim().length > 0) {
      handleGlobalSearch(searchQuery);
    } else if (!selectedWorkbook && searchQuery.trim().length === 0) {
      setGlobalSearchResults([]);
    }
  }, [searchQuery, selectedWorkbook]);

  // --- FETCHING ---

  const fetchWorkbooks = async () => {
    setLoadingWorkbooks(true);
    try {
      const colRef = collection(db, "Apostilas");
      const q = query(colRef);
      const snap = await getDocs(q);
      const data: Workbook[] = [];
      snap.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id } as Workbook);
      });
      // Ordenação alfabética
      data.sort((a, b) => a.title.localeCompare(b.title));
      setWorkbooks(data);
    } catch (error) {
      console.error("Erro ao buscar apostilas:", error);
      toast.error("Erro ao carregar apostilas");
    } finally {
      setLoadingWorkbooks(false);
    }
  };

  const fetchLessons = async (workbookId: string) => {
    setLoadingLessons(true);
    try {
      const colRef = collection(db, `Apostilas/${workbookId}/Lessons`);
      const snap = await getDocs(colRef);
      const data: Notebook[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as Notebook;
        data.push({ ...d, id: doc.id, docID: doc.id });
      });

      // Tenta ordenar numericamente pelo título (ex: "Lição 1", "Lição 2")
      data.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );
      setLessons(data);
    } catch (error) {
      console.error("Erro ao buscar lições:", error);
      toast.error("Erro ao carregar lições");
    } finally {
      setLoadingLessons(false);
    }
  };

  // Busca Global usando collectionGroup
  // Nota: Isso busca em TODAS as subcoleções chamadas "Lessons" no banco inteiro
  const handleGlobalSearch = useCallback(
    debounce(async (term: string) => {
      if (!term) return;
      setSearchingGlobal(true);
      try {
        // Buscamos tudo e filtramos no cliente para evitar custos de índices complexos no Firestore
        // Se a base for GIGANTE, isso precisaria ser otimizado (ex: Algolia ou índices específicos)
        const q = query(collectionGroup(db, "Lessons"));
        const snap = await getDocs(q);

        const results: Notebook[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as Notebook;
          // Filtro simples case-insensitive
          if (data.title.toLowerCase().includes(term.toLowerCase())) {
            results.push({ ...data, id: doc.id, docID: doc.id });
          }
        });

        setGlobalSearchResults(results);
      } catch (error) {
        console.error("Erro na busca global:", error);
      } finally {
        setSearchingGlobal(false);
      }
    }, 500),
    [],
  );

  // --- ACTIONS ---

  const handleInsertLesson = (lesson: Notebook) => {
    if (!lesson.content) {
      toast.error("Esta lição não possui conteúdo.");
      return;
    }

    try {
      editor.commands.insertContent(lesson.content);
      toast.success("Conteúdo inserido!");
      onClose();
    } catch (error) {
      console.error("Erro ao inserir conteúdo:", error);
      toast.error("Erro ao inserir no editor.");
    }
  };

  const handleBack = () => {
    setSelectedWorkbook(null);
    setSearchQuery(""); // Limpa a busca ao voltar para a home
    setGlobalSearchResults([]);
  };

  // --- LOGICA DE EXIBIÇÃO ---

  // Modo 1: Dentro de uma apostila (filtragem local)
  const filteredInternalLessons = useMemo(() => {
    if (!selectedWorkbook) return [];
    if (!searchQuery) return lessons;
    const lower = searchQuery.toLowerCase();
    return lessons.filter((l) => l.title.toLowerCase().includes(lower));
  }, [lessons, searchQuery, selectedWorkbook]);

  // Determinar o que está sendo exibido
  const isInsideWorkbook = !!selectedWorkbook;
  const isGlobalSearching = !isInsideWorkbook && searchQuery.length > 0;

  // Lista final a ser renderizada quando for LIÇÕES (seja global ou interna)
  const lessonsToList = isInsideWorkbook
    ? filteredInternalLessons
    : globalSearchResults;
  const showLessonList = isInsideWorkbook || isGlobalSearching;

  // --- RENDERIZADORES ---

  const renderWorkbookSkeletons = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="aspect-[1/1.4] w-full rounded-md" />
      ))}
    </div>
  );

  const renderListSkeletons = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-[95vh] sm:h-[85vh] sm:max-w-5xl flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl">
        {/* HEADER */}
        <DialogHeader className="px-4 py-4 sm:px-6 border-b shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {isInsideWorkbook ? (
                <>
                  <button
                    onClick={handleBack}
                    className="hover:text-primary transition-colors flex items-center hover:underline"
                  >
                    <Library className="w-3.5 h-3.5 mr-1" />
                    Apostilas
                  </button>
                  <ChevronRight className="w-3 h-3" />
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {selectedWorkbook.title}
                  </span>
                </>
              ) : (
                <span className="flex items-center">
                  <Library className="w-3.5 h-3.5 mr-1" />
                  Biblioteca
                </span>
              )}
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              {isInsideWorkbook
                ? "Conteúdo da Apostila"
                : isGlobalSearching
                  ? "Resultados da Busca"
                  : "Minhas Apostilas"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* SEARCH BAR */}
        <div className="p-4 sm:px-6 border-b bg-muted/20 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                isInsideWorkbook
                  ? "Filtrar nesta apostila..."
                  : "Buscar lição em todas as apostilas..."
              }
              className="pl-9 pr-9 bg-background h-10 transition-all focus:ring-2 focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-hidden bg-muted/5 relative">
          <ScrollArea className="h-full w-full">
            <div className="p-4 sm:p-6 pb-20">
              {/* CASO 1: LISTA DE APOSTILAS (Visual Livro) */}
              {!showLessonList && (
                <>
                  {loadingWorkbooks ? (
                    renderWorkbookSkeletons()
                  ) : workbooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-semibold">
                        Nenhuma apostila encontrada
                      </h3>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {workbooks.map((wb) => (
                        <div
                          key={wb.id}
                          className="group cursor-pointer flex flex-col gap-2"
                          onClick={() => setSelectedWorkbook(wb)}
                        >
                          {/* Book Cover Container */}
                          <div className="aspect-[1/1.4] w-full relative group-hover:-translate-y-1 transition-all duration-300 ease-in-out overflow-hidden bg-primary-foreground">
                            {wb.coverURL ? (
                              <Image
                                fill
                                src={wb.coverURL}
                                alt={wb.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-center p-2">
                                <span className="font-bold text-primary/40 text-sm">
                                  {wb.title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* CASO 2: LISTA DE LIÇÕES (Visual Lista) */}
              {showLessonList && (
                <>
                  {loadingLessons || searchingGlobal ? (
                    renderListSkeletons()
                  ) : lessonsToList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="bg-muted rounded-full p-4 mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold">
                        Nenhuma lição encontrada
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-xs mt-1">
                        {isGlobalSearching
                          ? "Tente outro termo de busca."
                          : "Esta apostila está vazia."}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col border rounded-lg bg-background shadow-sm overflow-hidden">
                      {lessonsToList.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className={`
                            flex items-center justify-between p-3 sm:p-4 gap-3 group transition-colors
                            ${idx !== lessonsToList.length - 1 ? "border-b" : ""}
                            hover:bg-muted/50
                          `}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span
                                className="font-medium text-sm sm:text-base truncate"
                                title={lesson.title}
                              >
                                {lesson.title}
                              </span>
                              {isGlobalSearching && (
                                <span className="text-[10px] sm:text-xs text-muted-foreground">
                                  Resultado da busca global
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="secondary"
                            className="shrink-0 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleInsertLesson(lesson)}
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Inserir</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* FOOTER */}
        <DialogFooter className="px-4 py-3 border-t bg-background shrink-0 flex-row justify-between items-center sm:justify-between gap-4">
          <div className="text-xs text-muted-foreground order-1 sm:order-1">
            {showLessonList ? (
              <span>
                <strong>{lessonsToList.length}</strong> lições encontradas
              </span>
            ) : (
              <span>
                <strong>{workbooks.length}</strong> apostilas disponíveis
              </span>
            )}
          </div>

          <div className="flex gap-2 order-2 sm:order-2">
            {isInsideWorkbook && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="hidden sm:flex"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkbookToolModal;
