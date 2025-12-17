"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Trash2,
  ArrowLeft,
  Send,
  Edit2,
  Quote
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// --- TIPOS ---
type Mode = "add" | "view" | "list";

type ReplyRecord = {
  id: string;
  text: string;
  createdAt: number;
};

type CommentRecord = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
  replies?: ReplyRecord[];
};

export interface CommentsSheetProps {
  editor?: Editor | null;
  docId?: string;
}

// --- API MOCKS ---
async function apiList(docId: string) {
  const res = await fetch(`/api/comments?docId=${encodeURIComponent(docId)}`);
  if (!res.ok) throw new Error(`Erro: ${res.status}`);
  return (await res.json()) as Record<string, CommentRecord>;
}

async function apiUpsert(docId: string, id: string, text: string) {
  const res = await fetch(`/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docId, id, text }),
  });
  if (!res.ok) throw new Error(`Erro: ${res.status}`);
  return (await res.json()) as CommentRecord;
}

async function apiDelete(docId: string, id: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(id)}?docId=${encodeURIComponent(docId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Erro: ${res.status}`);
}

async function apiAddReply(docId: string, id: string, text: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(id)}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docId, text }),
  });
  if (!res.ok) throw new Error(`Erro: ${res.status}`);
  return (await res.json()) as CommentRecord;
}

// --- COMPONENTE ---
export const CommentsSheet: React.FC<CommentsSheetProps> = ({ editor, docId }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [commentId, setCommentId] = useState<string | undefined>(undefined);
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [listMap, setListMap] = useState<Record<string, CommentRecord>>({});

  // --- HELPER: Pega o texto associado a um ID de comentário ---
  const getQuotedText = useCallback((targetId?: string) => {
    if (!editor || !targetId) return "";
    let extractedText = "";
    
    // Varre o documento procurando nós de texto que tenham a marcação com esse ID
    editor.state.doc.descendants((node) => {
      if (!node.isText) return true;
      const hasMark = node.marks.find(m => m.type.name === 'comment' && (m.attrs as any).id === targetId);
      if (hasMark) {
        extractedText += node.text;
      }
      return true;
    });

    return extractedText;
  }, [editor]);

  // --- HELPER: Texto selecionado atualmente pelo cursor (para novos comentários) ---
  const getCurrentSelection = useCallback(() => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    if (from === to) return "";
    try { return editor.state.doc.textBetween(from, to, " "); } catch { return ""; }
  }, [editor]);

  const formatTime = useCallback((ts?: number) => {
    if (!ts) return "";
    try { return formatDistanceToNow(new Date(ts), { addSuffix: true, locale: ptBR }); } catch { return ""; }
  }, []);

  const getCommentIdsInDoc = useCallback((): string[] => {
    if (!editor) return [];
    const markType = editor.state.schema.marks["comment"];
    if (!markType) return [];
    const ids = new Set<string>();
    editor.state.doc.descendants((node) => {
      if (!node.isText) return true;
      node.marks.forEach((m) => {
        if (m.type === markType && (m.attrs as any).id) ids.add((m.attrs as any).id);
      });
      return true;
    });
    return Array.from(ids);
  }, [editor]);

  // --- FUNÇÃO DE SCROLL ---
  const handleScrollToComment = useCallback((id: string) => {
    if (!editor) return;

    let from: number | null = null;
    let to: number | null = null;

    // Encontra a posição inicial e final da marcação
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return true;
      const hasMark = node.marks.find((m) => m.type.name === "comment" && (m.attrs as any).id === id);
      if (hasMark) {
        if (from === null) from = pos;
        to = pos + node.nodeSize;
      }
      return true;
    });

   if (from !== null && to !== null) {
      // Cria um snapshot dos valores atuais que são garantidamente números
      const selectionRange = { from, to };

      // Pequeno timeout para garantir que a UI do Sheet não bloqueie a thread
      setTimeout(() => {
        // Usa a variável local 'selectionRange' que o TS sabe que não é null
        editor.commands.setTextSelection(selectionRange);
        editor.commands.scrollIntoView();
      }, 50);
    }
  }, [editor]);

  // Effects
  useEffect(() => {
    const handler = (e: CustomEvent<{ id?: string; mode?: Mode }>) => {
      const { id, mode: incomingMode } = e.detail || {};
      const nextMode = incomingMode || (id ? "view" : "add");
      
      setMode(nextMode);
      setCommentId(id);
      setText("");
      setOpen(true);

      if (id) {
        handleScrollToComment(id);
      }
    };
    window.addEventListener("open-comment-sheet", handler as EventListener);
    return () => window.removeEventListener("open-comment-sheet", handler as EventListener);
  }, [handleScrollToComment]);

  useEffect(() => {
    const fetchCurrent = async () => {
      if (!docId || !open) return;
      try {
        const map = await apiList(docId);
        setListMap(map);
        if (commentId && map[commentId]) setText(map[commentId].text || "");
      } catch (e) { console.error(e); }
    };
    if (open) fetchCurrent();
  }, [docId, open, commentId]);

  // Actions
  const handleSave = useCallback(async () => {
    if (!editor || !docId) return;
    
    let id = commentId;
    if (!id) {
      const now = Date.now();
      id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
      editor.chain().focus().setMark("comment", { id }).run();
    }

    try {
      const savedRecord = await apiUpsert(docId, id!, text);
      
      setListMap((prev) => ({
        ...prev,
        [savedRecord.id]: {
            ...prev[savedRecord.id],
            ...savedRecord
        }
      }));

      setCommentId(savedRecord.id);
      setMode("view");
      toast.success("Comentário salvo!");
      
      // Scroll para o novo comentário criado
      handleScrollToComment(savedRecord.id);

    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar comentário");
    }
  }, [editor, text, commentId, docId, handleScrollToComment]);

  const handleDelete = useCallback(async () => {
    if (!editor || !commentId || !docId) return;
    await apiDelete(docId, commentId);
    
    const { state } = editor;
    const markType = state.schema.marks["comment"];
    if (markType) {
      const tr = state.tr;
      state.doc.descendants((node, pos) => {
        if (!node.isText) return true;
        if (node.marks.some((m) => m.type === markType && (m.attrs as any).id === commentId)) {
          tr.removeMark(pos, pos + node.nodeSize, markType);
        }
        return true;
      });
      editor.view.dispatch(tr);
    }
    setOpen(false);
  }, [editor, commentId, docId]);

  const handleAddReply = useCallback(async () => {
    if (!commentId || !replyText.trim() || !docId) return;
    const currentText = replyText.trim();
    const previousMap = { ...listMap };
    const tempReply: ReplyRecord = { id: `temp-${Date.now()}`, text: currentText, createdAt: Date.now() };

    setListMap((prev) => {
      const parent = prev[commentId];
      if (!parent) return prev;
      return { ...prev, [commentId]: { ...parent, replies: [...(parent.replies || []), tempReply] } };
    });
    setReplyText("");

    try {
      await apiAddReply(docId, commentId, currentText);
      const updatedMap = await apiList(docId); 
      setListMap(updatedMap);
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      setListMap(previousMap); 
      setReplyText(currentText);
      toast.error("Falha ao enviar resposta.");
    }
  }, [commentId, replyText, docId, listMap]);

  // --- Lógica de Visualização do Texto Referenciado ---
  // Se estiver em VIEW ou ADD(editando), mostramos o texto do ID do comentário.
  // Se estiver em ADD(novo), mostramos o texto da seleção atual.
  const displayedQuote = commentId ? getQuotedText(commentId) : getCurrentSelection();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-sm p-0 flex flex-col gap-0 border-l shadow-xl bg-background">
        
        {/* HEADER */}
        <SheetHeader className="px-5 py-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            {mode === "view" && "add" && (
              <button 
                onClick={() => setMode("list")} 
                className="hover:bg-muted p-1 rounded-full transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <SheetTitle className="text-sm font-semibold flex items-center gap-2">
              {mode === "add" ? (commentId ? "Editar Comentário" : "Novo Comentário") : "Comentários"}
            </SheetTitle>
          </div>
          <div className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
            {mode === "list" ? getCommentIdsInDoc().length : mode === "view" ? "Discussão" : "Editor"}
          </div>
        </SheetHeader>

        {/* CONTENT */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mode === "list" ? (
            <ScrollArea className="h-full">
              <div className="flex flex-col">
                {(() => {
                  const ids = getCommentIdsInDoc();
                  if (ids.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground p-4 mt-10">
                        <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-sm">Nenhum comentário ainda.</p>
                      </div>
                    );
                  }
                  return ids.map((id) => {
                    const rec = listMap[id];
                    return (
                      <div 
                        key={id} 
                        className="group relative p-4 hover:bg-muted/40 transition-all cursor-pointer border-b border-border/40"
                        onClick={() => {
                          // 1. Muda o modo
                          setMode("view");
                          setCommentId(id);
                          setText(rec?.text || "");
                          // 2. Rola até o texto
                          handleScrollToComment(id);
                        }}
                      >
                        <div className="flex gap-3">
                          <Avatar className="h-6 w-6 mt-0.5 rounded-full">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary rounded-full">U</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-semibold text-foreground">Usuário</span>
                              <span className="text-[10px] text-muted-foreground">
                                {rec?.createdAt ? formatTime(rec.createdAt) : ""}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/80 leading-snug line-clamp-2">
                              {rec?.text || "Carregando..."}
                            </p>
                            {rec?.replies && rec.replies.length > 0 && (
                              <div className="pt-1">
                                <span className="text-[10px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                                  {rec.replies.length} respostas
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCommentId(id);
                              setText(rec?.text || "");
                              setMode("add");
                              handleScrollToComment(id);
                            }}
                           >
                              <Edit2 className="w-3 h-3 text-muted-foreground" />
                           </Button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </ScrollArea>
          ) : (
            // VIEW OR ADD MODE
            <div className="flex flex-col h-full">
              <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
                  
                  {/* --- BLOCO DO TEXTO REFERENCIADO --- */}
                  {displayedQuote && (
                    <div className="relative bg-muted/40 rounded-lg p-3 border border-border/50">
                      <Quote className="absolute top-2 left-2 w-3 h-3 text-primary/40 rotate-180" />
                      <p className="text-xs text-muted-foreground italic pl-4 border-l-2 border-primary/30 line-clamp-4">
                        "{displayedQuote}"
                      </p>
                    </div>
                  )}

                  {mode === "view" && (() => {
                    const rec = commentId ? listMap[commentId] : undefined;
                    return (
                      <div className="space-y-6">
                        <div className="group relative flex gap-3">
                          <Avatar className="h-6 w-6 rounded-full">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary rounded-full">U</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold">Usuário</span>
                              <span className="text-[10px] text-muted-foreground">
                                {rec?.createdAt ? formatTime(rec.createdAt) : "agora"}
                              </span>
                            </div>
                            <div className="text-sm text-foreground leading-relaxed">
                              {rec?.text || text}
                            </div>
                          </div>
                          <button 
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                            onClick={() => {
                              setText(rec?.text || "");
                              setMode("add");
                              if(commentId) handleScrollToComment(commentId);
                            }}
                          >
                             <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>

                        {rec?.replies && rec.replies.length > 0 && (
                          <div className="pl-3 space-y-5 relative">
                            <div className="absolute left-[13px] top-0 bottom-4 w-px bg-border/60" />
                            {rec.replies.map((r) => (
                              <div key={r.id} className="group relative flex gap-3">
                                <div className="absolute left-[-16px] top-3 w-3 h-px bg-border/60" />
                                <Avatar className="h-5 w-5 rounded-full">
                                  <AvatarFallback className="text-[9px] bg-muted text-muted-foreground rounded-full">R</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs font-medium text-foreground/80">Resposta</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {r.createdAt ? formatTime(r.createdAt) : "agora"}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {r.text}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </ScrollArea>

              <div className="p-4 bg-background border-t">
                {mode === "view" ? (
                  <div className="relative flex items-end gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Responder..."
                      className="min-h-[44px] max-h-32 py-3 px-4 resize-none bg-muted/30 focus:bg-background border-none ring-1 ring-border focus:ring-primary/50 text-sm rounded-2xl"
                      rows={1}
                    />
                    <Button 
                      size="icon" 
                      className="h-10 w-10 rounded-full shrink-0"
                      disabled={!replyText.trim()}
                      onClick={handleAddReply}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Escreva seu comentário..."
                      className="min-h-[100px] resize-none bg-muted/30 p-3 text-sm focus:bg-background border-none ring-1 ring-border focus:ring-primary/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      {commentId && (
                         <Button variant="outline" size="sm" onClick={() => setMode("view")} className="flex-1">
                           Cancelar
                         </Button>
                      )}
                      <Button size="sm" onClick={handleSave} disabled={!text.trim()} className="flex-1">
                        {commentId ? "Atualizar" : "Salvar"}
                      </Button>
                    </div>
                  </div>
                )}

                {mode === "view" && (
                    <div className="mt-2 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={handleDelete} className="text-[10px] text-muted-foreground hover:text-destructive h-6 px-2">
                        <Trash2 className="w-3 h-3 mr-1" /> Excluir Tópico
                      </Button>
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;