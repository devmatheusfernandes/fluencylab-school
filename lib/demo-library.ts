/** Biblioteca da plataforma (fictícia): lições, cadernos/apostilas prontos e a revisão de qualidade por IA. */

export type Lesson = { id: string; title: string; level: "A1" | "A2" | "B1" | "B2" | "C1"; minutes: number; tag: string };

export const LESSONS: Lesson[] = [
  { id: "l-a1-1", title: "Greetings and introductions", level: "A1", minutes: 12, tag: "Conversação" },
  { id: "l-a1-2", title: "Numbers and prices", level: "A1", minutes: 10, tag: "Vocabulário" },
  { id: "l-a1-3", title: "Food and drinks", level: "A1", minutes: 14, tag: "Vocabulário" },
  { id: "l-a2-1", title: "Simple past in real life", level: "A2", minutes: 16, tag: "Gramática" },
  { id: "l-a2-2", title: "Getting around the city", level: "A2", minutes: 14, tag: "Viagens" },
  { id: "l-a2-3", title: "Making plans", level: "A2", minutes: 12, tag: "Conversação" },
  { id: "l-b1-1", title: "First conditional", level: "B1", minutes: 18, tag: "Gramática" },
  { id: "l-b1-2", title: "At the doctor", level: "B1", minutes: 15, tag: "Vocabulário" },
  { id: "l-b1-3", title: "Phrasal verbs for work", level: "B1", minutes: 17, tag: "Trabalho" },
  { id: "l-b2-1", title: "Giving opinions politely", level: "B2", minutes: 18, tag: "Conversação" },
  { id: "l-b2-2", title: "Formal emails", level: "B2", minutes: 20, tag: "Escrita" },
  { id: "l-b2-3", title: "Understanding fast speech", level: "B2", minutes: 16, tag: "Listening" },
  { id: "l-c1-1", title: "Nuance and hedging", level: "C1", minutes: 20, tag: "Escrita" },
  { id: "l-c1-2", title: "Debating current topics", level: "C1", minutes: 22, tag: "Conversação" },
];

export type ReadyNotebook = { id: string; title: string; level: string; pages: number; description: string; lessonIds: string[] };

/** Cadernos/apostilas prontos, montados com lições que já existem na biblioteca. */
export const READY_NOTEBOOKS: ReadyNotebook[] = [
  { id: "n-a1", title: "Primeiros passos", level: "A1", pages: 14, description: "Apresentações, números e comida para o aluno que está começando.", lessonIds: ["l-a1-1", "l-a1-2", "l-a1-3"] },
  { id: "n-a2", title: "Sobrevivência em viagens", level: "A2", pages: 18, description: "Passado simples, deslocamento e planos para viajar com confiança.", lessonIds: ["l-a2-1", "l-a2-2", "l-a2-3"] },
  { id: "n-b1", title: "Inglês para o trabalho", level: "B1", pages: 22, description: "Condicionais, phrasal verbs e situações de escritório.", lessonIds: ["l-b1-1", "l-b1-3", "l-b2-2"] },
  { id: "n-b2", title: "Conversação e opinião", level: "B2", pages: 20, description: "Dar opinião, argumentar e entender falantes nativos.", lessonIds: ["l-b2-1", "l-b2-3", "l-c1-2"] },
];

export const lessonTitle = (id: string) => LESSONS.find((l) => l.id === id)?.title ?? id;

/** Texto de exemplo (com dois problemas propositais) para a demo da revisão de qualidade. */
export const SAMPLE_MATERIAL = `Unit: Talking about likes
1. She don't like coffee.
2. Exercise: Do the sentences with verb.
3. Complete: He ____ (play) football on Sundays.`;

export type AiCheck = {
  id: string;
  label: string;
  result: "ok" | "ajuste";
  message: string;
  fix?: { from: string; to: string };
};

export const AI_CHECKS: AiCheck[] = [
  {
    id: "gramatica",
    label: "Correção gramatical e ortografia",
    result: "ajuste",
    message: "Encontrei um erro de concordância na frase 1.",
    fix: { from: "She don't like coffee.", to: "She doesn't like coffee." },
  },
  { id: "nivel", label: "Coerência com o nível (CEFR)", result: "ok", message: "Vocabulário e estruturas compatíveis com o nível A2." },
  {
    id: "clareza",
    label: "Clareza das instruções",
    result: "ajuste",
    message: "A instrução do exercício 2 está ambígua para o aluno.",
    fix: { from: "Exercise: Do the sentences with verb.", to: "Exercise: Complete the sentences with the correct form of the verb." },
  },
  { id: "gabarito", label: "Exercícios com gabarito", result: "ok", message: "Todos os exercícios têm resposta esperada definida." },
  { id: "conteudo", label: "Conteúdo adequado e original", result: "ok", message: "Nenhum trecho copiado de outra fonte foi identificado na verificação automática." },
];
