"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Mode = "add" | "view" | "list";

type ReplyRecord = {
  id: string;
  text: string;
  createdAt: number;
  updatedAt?: number;
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

async function apiList(docId: string) {
  const res = await fetch(`/api/comments?docId=${encodeURIComponent(docId)}`);
  if (!res.ok) throw new Error(`Falha ao listar comentários: ${res.status}`);
  return (await res.json()) as Record<string, CommentRecord>;
}

async function apiUpsert(docId: string, id: string, text: string) {
  const res = await fetch(`/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docId, id, text }),
  });
  if (!res.ok) throw new Error(`Falha ao salvar comentário: ${res.status}`);
  return (await res.json()) as CommentRecord;
}

async function apiDelete(docId: string, id: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(id)}?docId=${encodeURIComponent(docId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Falha ao remover comentário: ${res.status}`);
}

async function apiAddReply(docId: string, id: string, text: string) {
  const res = await fetch(`/api/comments/${encodeURIComponent(id)}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docId, text }),
  });
  if (!res.ok) throw new Error(`Falha ao responder comentário: ${res.status}`);
  return (await res.json()) as CommentRecord;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({ editor, docId }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [commentId, setCommentId] = useState<string | undefined>(undefined);
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [listMap, setListMap] = useState<Record<string, CommentRecord>>({});

  const selectedText = useMemo(() => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    if (from === to) return "";
    try {
      return editor.state.doc.textBetween(from, to, " ");
    } catch {
      return "";
    }
  }, [editor, open]);

  useEffect(() => {
    const handler = (e: CustomEvent<{ id?: string; mode?: Mode }>) => {
      const { id, mode: incomingMode } = e.detail || {};
      const nextMode = incomingMode || (id ? "view" : "add");
      setMode(nextMode);
      setCommentId(id);

      setText("");
      setOpen(true);
    };

    window.addEventListener("open-comment-sheet", handler as EventListener);
    return () => {
      window.removeEventListener("open-comment-sheet", handler as EventListener);
    };
  }, []);

  // Sempre que abrir em 'list' ou 'view', busca comentários atuais
  useEffect(() => {
    const fetchCurrent = async () => {
      if (!docId || !open) return;
      try {
        const map = await apiList(docId);
        setListMap(map);
        if (commentId && map[commentId]) {
          setText(map[commentId].text || "");
        }
      } catch (e) {
        console.error('Falha ao buscar comentários', e);
      }
    };
    if (mode === 'list' || mode === 'view') {
      fetchCurrent();
    }
  }, [docId, open, mode, commentId]);

  const formatDateTime = useCallback((ts?: number) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  }, []);

  const getCommentIdsInDoc = useCallback((): string[] => {
    if (!editor) return [];
    const markType = editor.state.schema.marks["comment"];
    if (!markType) return [];
    const ids = new Set<string>();
    editor.state.doc.descendants((node) => {
      if (!node.isText) return true;
      node.marks.forEach((m) => {
        if (m.type === markType && (m.attrs as any).id) {
          ids.add((m.attrs as any).id);
        }
      });
      return true;
    });
    return Array.from(ids);
  }, [editor]);

  const getSnippetForId = useCallback((id: string): string => {
    if (!editor) return "";
    const markType = editor.state.schema.marks["comment"];
    if (!markType) return "";
    const pieces: string[] = [];
    editor.state.doc.descendants((node) => {
      if (!node.isText) return true;
      const hasTarget = node.marks.some(
        (m) => m.type === markType && (m.attrs as any).id === id
      );
      if (hasTarget) {
        pieces.push(node.text || "");
      }
      return true;
    });
    const snippet = pieces.join(" ").trim();
    return snippet.length > 120 ? snippet.slice(0, 118) + "…" : snippet;
  }, [editor]);

  const handleSave = useCallback(async () => {
    if (!editor || !docId) return;
    // Se o mark 'comment' não estiver no schema, evita erro e loga.
    if (!(editor as any).schema?.marks?.comment) {
      console.warn("Comment mark não encontrado no schema. Verifique se a extensão foi adicionada.");
      return;
    }
    let id = commentId;
    if (!id) {
      const now = Date.now();
      id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
      // aplica o mark na seleção atual (sem depender de comandos customizados)
      editor.chain().focus().setMark("comment", { id }).run();
    }
    await apiUpsert(docId, id!, text);
    setOpen(false);
  }, [editor, text, commentId, docId]);

  // Utilitário local para remover o mark "comment" por ID em todo o documento
  const unsetCommentById = useCallback(
    (id: string) => {
      if (!editor) return false;
      const { state } = editor;
      const markType = state.schema.marks["comment"];
      if (!markType) return false;

      const tr = state.tr;
      state.doc.descendants((node, pos) => {
        if (!node.isText) return true;
        const hasTarget = node.marks.some(
          (m) => m.type === markType && (m.attrs as any).id === id
        );
        if (hasTarget) {
          tr.removeMark(pos, pos + node.nodeSize, markType);
        }
        return true;
      });

      editor.view.dispatch(tr);
      return true;
    },
    [editor]
  );

  const handleDelete = useCallback(async () => {
    if (!editor || !commentId || !docId) return;
    await apiDelete(docId, commentId);
    unsetCommentById(commentId);
    setOpen(false);
  }, [editor, commentId, unsetCommentById, docId]);

  const handleAddReply = useCallback(async () => {
    if (!commentId || !replyText.trim() || !docId) return;
    await apiAddReply(docId, commentId, replyText.trim());
    setReplyText("");
  }, [commentId, replyText, docId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="p-0">
        <SheetHeader className="p-4">
          <SheetTitle>
            {mode === "add" ? "Adicionar comentário" : mode === "view" ? "Comentário" : "Comentários do documento"}
          </SheetTitle>
          {mode !== "list" && (
            <SheetDescription>
              {mode === "add"
                ? "Escreva um comentário para o texto selecionado."
                : "Editar, responder ou remover este comentário."}
            </SheetDescription>
          )}
        </SheetHeader>

        {mode === "list" ? (
          <div className="space-y-2 p-4">
            {(() => {
              const ids = getCommentIdsInDoc();
              if (ids.length === 0) {
                return (
                  <div className="text-muted-foreground text-sm">Nenhum comentário neste documento.</div>
                );
              }
              const map = listMap;
              return ids.map((id) => {
                const rec = map[id];
                const snippet = getSnippetForId(id);
                return (
                  <div key={id} className="border rounded-md p-3">
                    <div className="text-sm font-medium">{rec?.text || "(sem texto)"}</div>
                    {snippet && (
                      <div className="text-xs text-muted-foreground mt-1">Trecho: {snippet}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {rec?.updatedAt
                        ? `Editado em ${formatDateTime(rec.updatedAt)}`
                        : rec?.createdAt
                        ? `Criado em ${formatDateTime(rec.createdAt)}`
                        : ""}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => {
                        setMode("view");
                        setCommentId(id);
                        setText(rec?.text || "");
                      }}>Abrir</Button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4">
              {selectedText && (
                <div className="rounded-md border bg-muted/30 p-2 text-sm">
                  <div className="text-muted-foreground mb-1">Texto selecionado</div>
                  <div className="line-clamp-3">{selectedText}</div>
                </div>
              )}

              {mode === "view" && (() => {
                const rec = commentId ? listMap[commentId] : undefined;
                return (
                  <div className="text-xs text-muted-foreground">
                    {rec?.updatedAt
                      ? `Editado em ${formatDateTime(rec.updatedAt)}`
                      : rec?.createdAt
                      ? `Criado em ${formatDateTime(rec.createdAt)}`
                      : ""}
                  </div>
                );
              })()}

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={mode === "add" ? "Escreva seu comentário..." : "Editar comentário..."}
                className="min-h-[120px]"
              />

              {mode === "view" && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Respostas</div>
                  {(() => {
                    const replies = commentId ? (listMap[commentId]?.replies || []) : [];
                    if (replies.length === 0) {
                      return (
                        <div className="text-muted-foreground text-xs">Nenhuma resposta ainda.</div>
                      );
                    }
                    return replies.map((r) => (
                      <div key={r.id} className="border rounded p-2 text-sm">
                        <div>{r.text}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {r.updatedAt
                            ? `Editado em ${formatDateTime(r.updatedAt)}`
                            : `Criado em ${formatDateTime(r.createdAt)}`}
                        </div>
                      </div>
                    ));
                  })()}

                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva uma resposta..."
                    className="min-h-[80px]"
                  />
                  <div className="flex">
                    <Button onClick={handleAddReply} disabled={!replyText.trim()}>
                      Responder
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <SheetFooter className="p-4">
              <div className="flex gap-2">
                {mode === "view" && (
                  <Button variant="destructive" onClick={handleDelete}>
                    Remover
                  </Button>
                )}
                <Button onClick={handleSave} disabled={!text.trim()}>
                  {mode === "add" ? "Salvar" : "Salvar alterações"}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CommentsSheet;