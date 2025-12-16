"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase/config";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";

// --- Types ---

type QuestionType = "fill_in" | "multiple_choice" | "true_false";

type Option = {
  id: string;
  text: string;
  correct?: boolean;
};

type QuestionData = {
  id?: string;
  type: QuestionType;
  text: string;
  options?: Option[];
  answer?: string | boolean;
  imageUrl?: string;
  audioUrl?: string;
  // Campos de estado do usuário salvos no JSON
  useranswer?: any;
};

type DeckData = {
  id?: string;
  title: string;
  questionIds: string[];
  useranswers?: Record<string, any>;
  collapsed?: boolean;
};

type QuestionsAttrs = {
  mode: "question" | "deck";
  question?: QuestionData | null;
  deck?: DeckData | null;
};

// --- Icons Components (Inline for portability) ---
const IconCheck = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconHelp = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4 text-muted-foreground"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

// --- Component ---

export const QuestionsNodeView: React.FC<any> = ({ node, updateAttributes }) => {
  const rawAttrs: QuestionsAttrs = node.attrs;

  // Parsing seguro dos atributos JSON
  const attrs: QuestionsAttrs = {
    ...rawAttrs,
    question:
      typeof rawAttrs?.question === "string"
        ? (() => {
            try {
              return JSON.parse(rawAttrs.question as any);
            } catch {
              return null;
            }
          })()
        : rawAttrs?.question || null,
    deck:
      typeof rawAttrs?.deck === "string"
        ? (() => {
            try {
              return JSON.parse(rawAttrs.deck as any);
            } catch {
              return null;
            }
          })()
        : rawAttrs?.deck || null,
  };

  // State initialization logic
  const [isCorrect, setIsCorrect] = useState<boolean | null>(() => {
    const q = attrs.question as any;
    if (!q) return null;
    if (q.type === "multiple_choice") {
      const selected = q.useranswer;
      if (!selected) return null;
      const opt = Array.isArray(q.options)
        ? q.options.find((o: any) => o.id === selected)
        : null;
      return opt ? !!opt.correct : null;
    }
    if (q.type === "true_false") {
      if (typeof q.useranswer !== "boolean") return null;
      return q.useranswer === q.answer;
    }
    if (q.type === "fill_in") {
      const a = String(q.answer || "")
        .trim()
        .toLowerCase();
      const v = String(q.useranswer || "")
        .trim()
        .toLowerCase();
      if (!v) return null;
      return a.length > 0 && a === v;
    }
    return null;
  });

  const [fillValue, setFillValue] = useState<string>(() => {
    const q = attrs.question as any;
    return q?.type === "fill_in" && typeof q?.useranswer === "string"
      ? q.useranswer
      : "";
  });

  // Atualiza a resposta e verifica acerto
  const setUserAnswer = (q: QuestionData, value: any) => {
    const next = { ...(q || {}), useranswer: value } as any;
    updateAttributes?.({ question: next });

    if (q.type === "multiple_choice") {
      const opt = Array.isArray(q.options)
        ? q.options.find((o) => o.id === value)
        : null;
      setIsCorrect(opt ? !!opt.correct : false);
      return;
    }
    if (q.type === "true_false") {
      setIsCorrect(value === q.answer);
      return;
    }
    if (q.type === "fill_in") {
      const a = String(q.answer || "")
        .trim()
        .toLowerCase();
      const v = String(value || "")
        .trim()
        .toLowerCase();
      setIsCorrect(a.length > 0 && a === v);
      return;
    }
    setIsCorrect(null);
  };

  const renderQuestion = (q: QuestionData) => {
    const hasFeedback = isCorrect !== null;

    // Define cores de borda/estado baseado no feedback (Minimalista)
    const containerClasses = "bg-card border rounded-xl shadow-sm transition-all";
    const statusBorderClass =
      isCorrect === true
        ? "border-green-500 ring-1 ring-green-500/20"
        : isCorrect === false
        ? "border-red-500 ring-1 ring-red-500/20"
        : "border-border hover:border-primary/50";

    return (
      <div className={`flex flex-col gap-4 p-5 md:p-6 ${containerClasses} ${statusBorderClass}`}>
        
        {/* Header: Label e Texto */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <IconHelp />
              Questão
            </span>
            {hasFeedback && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isCorrect
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {isCorrect ? "Correto" : "Incorreto"}
              </span>
            )}
          </div>
          
          {q?.text && (
            <div className="text-base md:text-lg font-medium leading-relaxed text-foreground">
              {q.text}
            </div>
          )}
        </div>

        {/* Media (Imagem/Audio) */}
        {q.imageUrl && (
          <div className="relative w-full overflow-hidden rounded-lg bg-muted/50 border">
            <img
              src={q.imageUrl}
              alt="Contexto da pergunta"
              className="w-full h-auto max-h-[300px] object-contain mx-auto"
            />
          </div>
        )}
        {q.audioUrl && (
          <audio src={q.audioUrl} controls className="w-full mt-2" />
        )}

        {/* --- Interações (Inputs) --- */}
        <div className="mt-1 space-y-3">
          
          {/* MULTIPLE CHOICE */}
          {q.type === "multiple_choice" &&
            Array.isArray(q.options) &&
            q.options.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {q.options.map((opt: Option) => {
                  const isSelected = q.useranswer === opt.id;
                  let variant = "outline" as const;
                  let icon = null;

                  if (hasFeedback) {
                    if (isSelected && opt.correct) {
                      variant = "outline"; // Verde/Primário se o tema permitir
                      icon = <IconCheck />;
                    } else if (isSelected && !opt.correct) {
                      variant = "outline";
                      icon = <IconX />;
                    } else if (!isSelected && opt.correct) {
                      // Mostra qual era a correta se errou
                      variant = "outline"; 
                    }
                  } else {
                    variant = isSelected ? "outline" : "outline";
                  }

                  // Hack de estilo para cores específicas de sucesso fora do padrão Shadcn se necessário
                  const customStyle = 
                    (hasFeedback && isSelected && opt.correct) 
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                      : "";

                  return (
                    <Button
                      key={opt.id}
                      size="lg" // Maior para mobile
                      variant={variant}
                      className={`w-full justify-start text-left h-auto py-3 px-4 whitespace-normal ${customStyle}`}
                      onClick={() => setUserAnswer(q, opt.id)}
                      disabled={hasFeedback && isCorrect === true} // Trava se acertou
                    >
                      <div className="flex items-center w-full gap-3">
                         {/* Bolinha de seleção visual */}
                        <div className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                             isSelected ? "border-current bg-current" : "border-muted-foreground"
                        }`}>
                           {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                        </div>
                        <span className="flex-1">{opt.text}</span>
                        {icon}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}

          {/* TRUE / FALSE */}
          {q.type === "true_false" && (
            <div className="grid grid-cols-2 gap-3">
              {[true, false].map((val) => {
                const isSelected = q.useranswer === val;
                const isValCorrect = val === q.answer;
                
                let buttonStyle = isSelected ? "border-primary bg-primary/5" : "";
                if (hasFeedback && isSelected) {
                    buttonStyle = isCorrect 
                        ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/40 dark:text-green-300" 
                        : "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                }

                return (
                  <Button
                    key={String(val)}
                    size="lg"
                    variant="outline"
                    className={`h-14 text-base font-medium transition-all ${buttonStyle}`}
                    onClick={() => setUserAnswer(q, val)}
                  >
                    {val ? "Verdadeiro" : "Falso"}
                  </Button>
                );
              })}
            </div>
          )}

          {/* FILL IN THE BLANK */}
          {q.type === "fill_in" && (
            <div className="space-y-3">
              <Input
                value={fillValue}
                onChange={(e) => {
                   setFillValue(e.target.value);
                   // Reset visual state on type
                   if (isCorrect !== null) setIsCorrect(null);
                }}
                placeholder="Digite sua resposta aqui..."
                className="h-12 text-base"
                onKeyDown={(e) => {
                   if (e.key === 'Enter') setUserAnswer(q, fillValue);
                }}
              />
              <Button
                size="lg"
                className="w-full md:w-auto md:min-w-[120px]"
                onClick={() => setUserAnswer(q, fillValue)}
                disabled={!fillValue}
              >
                Verificar Resposta
              </Button>
            </div>
          )}
        </div>

        {/* Feedback Message Footer (Aparece após responder) */}
        {hasFeedback && (
          <div
            className={`mt-2 rounded-lg p-3 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1 ${
              isCorrect
                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            <div className="mt-0.5 shrink-0">
               {isCorrect ? <IconCheck /> : <IconX />}
            </div>
            <div>
              <p className="font-semibold">
                {isCorrect ? "Muito bem!" : "Não foi dessa vez."}
              </p>
              {!isCorrect && q.type === "fill_in" && (
                 <p className="mt-1 opacity-90">A resposta correta é: <strong>{String(q.answer)}</strong></p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDeck = (d: DeckData) => {
    const [deckLoading, setDeckLoading] = useState(false);
    const [deckQuestions, setDeckQuestions] = useState<QuestionData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [deckAnswers, setDeckAnswers] = useState<Record<string, any>>(() => d.useranswers || {});
    const [deckCorrect, setDeckCorrect] = useState<Record<string, boolean | null>>({});
    const [deckFillValues, setDeckFillValues] = useState<Record<string, string>>({});
    const [collapsed, setCollapsed] = useState<boolean>(() => !!d.collapsed);

    useEffect(() => {
      let active = true;
      async function load() {
        const ids = Array.isArray(d.questionIds) ? d.questionIds.filter(Boolean) : [];
        if (!ids.length) {
          setDeckQuestions([]);
          return;
        }
        setDeckLoading(true);
        try {
          const col = collection(db, "tiptap", "extensions", "questions");
          const all: QuestionData[] = [];
          for (let i = 0; i < ids.length; i += 10) {
            const chunk = ids.slice(i, i + 10);
            const q = query(col, where(documentId(), "in", chunk));
            const snap = await getDocs(q);
            snap.forEach((doc) => {
              const data = doc.data() as any;
              all.push({
                id: doc.id,
                type: data.type,
                text: data.text,
                options: data.options || [],
                answer: data.answer,
                imageUrl: data.imageUrl,
                audioUrl: data.audioUrl,
              });
            });
          }
          if (active) {
            setDeckQuestions(all);
            setCurrentIndex(0);
          }
        } finally {
          if (active) setDeckLoading(false);
        }
      }
      load();
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [d.id, JSON.stringify(d.questionIds)]);

    const goPrev = () => {
      setCurrentIndex((idx) => (idx > 0 ? idx - 1 : idx));
    };
    const goNext = () => {
      setCurrentIndex((idx) => (idx < deckQuestions.length - 1 ? idx + 1 : idx));
    };

    const setDeckUserAnswer = (q: QuestionData, value: any) => {
      const qid = q.id || String(currentIndex);
      const next = { ...deckAnswers, [qid]: value };
      setDeckAnswers(next);
      updateAttributes?.({ deck: { ...(d || {}), useranswers: next } });
      if (q.type === "multiple_choice") {
        const opt = Array.isArray(q.options) ? q.options.find((o) => o.id === value) : null;
        setDeckCorrect((prev) => ({ ...prev, [qid]: opt ? !!opt.correct : false }));
        return;
      }
      if (q.type === "true_false") {
        setDeckCorrect((prev) => ({ ...prev, [qid]: value === q.answer }));
        return;
      }
      if (q.type === "fill_in") {
        const a = String(q.answer || "").trim().toLowerCase();
        const v = String(value || "").trim().toLowerCase();
        setDeckCorrect((prev) => ({ ...prev, [qid]: a.length > 0 && a === v }));
        return;
      }
      setDeckCorrect((prev) => ({ ...prev, [qid]: null }));
    };

    const renderQuestionDeck = (q: QuestionData) => {
      const qid = q.id || String(currentIndex);
      const hasFeedback = deckCorrect[qid] !== undefined && deckCorrect[qid] !== null;
      const isDeckCorrect = deckCorrect[qid] ?? null;
      const ua = deckAnswers[qid];
      const fv = deckFillValues[qid] ?? (typeof ua === "string" ? ua : "");

      const containerClasses = "bg-card border rounded-xl shadow-sm transition-all";
      const statusBorderClass =
        isDeckCorrect === true
          ? "border-green-500 ring-1 ring-green-500/20"
          : isDeckCorrect === false
          ? "border-red-500 ring-1 ring-red-500/20"
          : "border-border hover:border-primary/50";

      return (
        <div className={`flex flex-col gap-4 p-5 md:p-6 ${containerClasses} ${statusBorderClass}`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <IconHelp />
                Questão
              </span>
              {hasFeedback && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isDeckCorrect
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {isDeckCorrect ? "Correto" : "Incorreto"}
                </span>
              )}
            </div>
            {q?.text && (
              <div className="text-base md:text-lg font-medium leading-relaxed text-foreground">
                {q.text}
              </div>
            )}
          </div>

          {q.imageUrl && (
            <div className="relative w-full overflow-hidden rounded-lg bg-muted/50 border">
              <img
                src={q.imageUrl}
                alt="Contexto da pergunta"
                className="w-full h-auto max-h-[300px] object-contain mx-auto"
              />
            </div>
          )}
          {q.audioUrl && <audio src={q.audioUrl} controls className="w-full mt-2" />}

          <div className="mt-1 space-y-3">
            {q.type === "multiple_choice" &&
              Array.isArray(q.options) &&
              q.options.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {q.options.map((opt: Option) => {
                    const isSelected = ua === opt.id;
                    let variant = "outline" as const;
                    let icon = null;
                    if (hasFeedback) {
                      if (isSelected && opt.correct) {
                        variant = "outline";
                        icon = <IconCheck />;
                      } else if (isSelected && !opt.correct) {
                        variant = "outline";
                        icon = <IconX />;
                      } else if (!isSelected && opt.correct) {
                        variant = "outline";
                      }
                    } else {
                      variant = isSelected ? "outline" : "outline";
                    }
                    const customStyle =
                      hasFeedback && isSelected && opt.correct
                        ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                        : "";
                    return (
                      <Button
                        key={opt.id}
                        size="lg"
                        variant={variant}
                        className={`w-full justify-start text-left h-auto py-3 px-4 whitespace-normal ${customStyle}`}
                        onClick={() => setDeckUserAnswer(q, opt.id)}
                        disabled={hasFeedback && isDeckCorrect === true}
                      >
                        <div className="flex items-center w-full gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                              isSelected ? "border-current bg-current" : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                          </div>
                          <span className="flex-1">{opt.text}</span>
                          {icon}
                        </div>
                      </Button>
                    );
                  })}
                </div>
              )}

            {q.type === "true_false" && (
              <div className="grid grid-cols-2 gap-3">
                {[true, false].map((val) => {
                  const isSelected = ua === val;
                  let buttonStyle = isSelected ? "border-primary bg-primary/5" : "";
                  if (hasFeedback && isSelected) {
                    buttonStyle =
                      (isDeckCorrect ?? false)
                        ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-red-100 border-red-500 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                  }
                  return (
                    <Button
                      key={String(val)}
                      size="lg"
                      variant="outline"
                      className={`h-14 text-base font-medium transition-all ${buttonStyle}`}
                      onClick={() => setDeckUserAnswer(q, val)}
                    >
                      {val ? "Verdadeiro" : "Falso"}
                    </Button>
                  );
                })}
              </div>
            )}

            {q.type === "fill_in" && (
              <div className="space-y-3">
                <Input
                  value={fv}
                  onChange={(e) => {
                    const v = e.target.value;
                    const qid = q.id || String(currentIndex);
                    setDeckFillValues((prev) => ({ ...prev, [qid]: v }));
                    const key = qid;
                    if (deckCorrect[key] !== null && deckCorrect[key] !== undefined) {
                      setDeckCorrect((prev) => ({ ...prev, [key]: null }));
                    }
                  }}
                  placeholder="Digite sua resposta aqui..."
                  className="h-12 text-base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setDeckUserAnswer(q, fv);
                  }}
                />
                <Button
                  size="lg"
                  className="w-full md:w-auto md:min-w-[120px]"
                  onClick={() => setDeckUserAnswer(q, fv)}
                  disabled={!fv}
                >
                  Verificar Resposta
                </Button>
              </div>
            )}
          </div>

          {hasFeedback && (
            <div
              className={`mt-2 rounded-lg p-3 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1 ${
                isDeckCorrect
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
              }`}
            >
              <div className="mt-0.5 shrink-0">{isDeckCorrect ? <IconCheck /> : <IconX />}</div>
              <div>
                <p className="font-semibold">{isDeckCorrect ? "Muito bem!" : "Não foi dessa vez."}</p>
                {!isDeckCorrect && q.type === "fill_in" && (
                  <p className="mt-1 opacity-90">
                    A resposta correta é: <strong>{String(q.answer)}</strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="rounded-xl border p-4 space-y-2 bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-1.5 rounded-md">
              <IconHelp />
            </span>
            <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Deck de perguntas
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {deckLoading
                ? "Carregando..."
                : `${deckQuestions.length > 0 ? currentIndex + 1 : 0}/${deckQuestions.length}`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCollapsed((v) => {
                  const next = !v;
                  updateAttributes?.({ deck: { ...(d || {}), collapsed: next } });
                  return next;
                })
              }
            >
              {collapsed ? "Expandir" : "Colapsar"}
            </Button>
          </div>
        </div>
        <div className="text-lg font-bold">{d.title}</div>
        {!collapsed && (
          <>
            {deckQuestions.length > 0 ? (
              <div className="space-y-3">
                {renderQuestionDeck(deckQuestions[currentIndex])}
                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>
                    ◀ Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={goNext}
                    disabled={currentIndex >= deckQuestions.length - 1}
                  >
                    Próximo ▶
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {deckLoading ? "Carregando perguntas..." : "Nenhuma pergunta encontrada neste deck."}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <NodeViewWrapper className="my-4 max-w-2xl mx-auto">
      {attrs.mode === "question" && attrs.question
        ? renderQuestion(attrs.question)
        : null}
      {attrs.mode === "deck" && attrs.deck ? renderDeck(attrs.deck) : null}
    </NodeViewWrapper>
  );
};

// --- TipTap Extension Definition ---

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    questions: {
      insertQuestion: (payload: QuestionData) => ReturnType;
      insertDeck: (payload: DeckData) => ReturnType;
      setQuestionsAttrs: (attrs: Partial<QuestionsAttrs>) => ReturnType;
    };
  }
}

export const QuestionsNode = Node.create({
  name: "questions",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      mode: { default: "question" },
      question: { default: null },
      deck: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "questions-node",
        getAttrs: (element: HTMLElement) => {
          const mode = element.getAttribute("mode") as "question" | "deck" | null;
          const qStr = element.getAttribute("question") || "";
          const dStr = element.getAttribute("deck") || "";
          let question: any = null;
          let deck: any = null;
          try {
            if (qStr) question = JSON.parse(qStr);
          } catch {}
          try {
            if (dStr) deck = JSON.parse(dStr);
          } catch {}
          return {
            mode: mode || "question",
            question,
            deck,
          };
        },
      },
      {
        tag: "div[data-questions]",
        getAttrs: (element: HTMLElement) => {
          const modeAttr = element.getAttribute("data-mode") as "question" | "deck" | null;
          const qStr = element.getAttribute("data-question") || "";
          const dStr = element.getAttribute("data-deck") || "";
          let question: any = null;
          let deck: any = null;
          try {
            if (qStr) question = JSON.parse(qStr);
          } catch {}
          try {
            if (dStr) deck = JSON.parse(dStr);
          } catch {}
          return {
            mode: modeAttr || "question",
            question,
            deck,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const mode = (HTMLAttributes as any)?.mode ?? "question";
    const q = (HTMLAttributes as any)?.question;
    const d = (HTMLAttributes as any)?.deck;
    const questionStr =
      typeof q === "string" ? q : q ? JSON.stringify(q) : "";
    const deckStr = typeof d === "string" ? d : d ? JSON.stringify(d) : "";
    return [
      "questions-node",
      mergeAttributes(HTMLAttributes, {
        mode,
        question: questionStr,
        deck: deckStr,
      }),
    ];
  },

  addCommands() {
    return {
      insertQuestion:
        (payload: QuestionData) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { mode: "question", question: payload, deck: null },
            })
            .run();
        },
      insertDeck:
        (payload: DeckData) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent({
              type: this.name,
              attrs: { mode: "deck", deck: payload, question: null },
            })
            .run();
        },
      setQuestionsAttrs:
        (attrs: Partial<QuestionsAttrs>) =>
        ({ chain }) => {
          return chain().focus().updateAttributes(this.name, attrs).run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuestionsNodeView);
  },
});

export default QuestionsNode;
