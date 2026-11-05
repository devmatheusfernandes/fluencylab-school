/** Prática diária, cadernos, perfis e gravações dos alunos (dados fictícios). */
import type { Skill } from "@/lib/demo-placement";

export type Practice = {
  /** Dias concluídos no ciclo atual (0 a 6), como na plataforma real. */
  cycleDays: number;
  streak: number;
  minutesWeek: number;
  accuracy: number;
  itemsReviewed: number;
  /** Últimos 14 dias: 0 = não praticou, 1 a 3 = intensidade. */
  last14: number[];
};

export const PRACTICE: Record<string, Practice> = {
  s1: { cycleDays: 5, streak: 6, minutesWeek: 74, accuracy: 91, itemsReviewed: 132, last14: [2, 3, 2, 0, 3, 2, 3, 3, 2, 0, 3, 2, 3, 3] },
  s2: { cycleDays: 3, streak: 2, minutesWeek: 41, accuracy: 82, itemsReviewed: 68, last14: [1, 0, 2, 0, 1, 2, 0, 0, 2, 1, 0, 2, 1, 2] },
  s3: { cycleDays: 6, streak: 12, minutesWeek: 98, accuracy: 95, itemsReviewed: 181, last14: [3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3] },
  s4: { cycleDays: 1, streak: 0, minutesWeek: 12, accuracy: 64, itemsReviewed: 19, last14: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0] },
  s5: { cycleDays: 4, streak: 4, minutesWeek: 55, accuracy: 88, itemsReviewed: 97, last14: [2, 2, 0, 2, 3, 2, 0, 2, 2, 3, 0, 2, 2, 3] },
  s6: { cycleDays: 3, streak: 3, minutesWeek: 38, accuracy: 79, itemsReviewed: 60, last14: [1, 2, 0, 1, 2, 0, 0, 1, 2, 1, 0, 2, 2, 1] },
  s7: { cycleDays: 6, streak: 9, minutesWeek: 88, accuracy: 96, itemsReviewed: 160, last14: [3, 2, 3, 3, 2, 3, 3, 3, 2, 3, 3, 2, 3, 3] },
  s8: { cycleDays: 0, streak: 0, minutesWeek: 0, accuracy: 58, itemsReviewed: 8, last14: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  s9: { cycleDays: 5, streak: 5, minutesWeek: 66, accuracy: 90, itemsReviewed: 119, last14: [2, 2, 3, 2, 0, 3, 2, 2, 3, 2, 0, 3, 3, 2] },
  s10: { cycleDays: 4, streak: 4, minutesWeek: 49, accuracy: 85, itemsReviewed: 90, last14: [2, 0, 2, 2, 2, 0, 3, 2, 0, 2, 2, 2, 0, 3] },
};

export type NotebookItem = { id: string; title: string; date: string; kind: "Colaborativo" | "Apostila pronta" | "Meu material" };

const DEFAULT_NOTEBOOKS: NotebookItem[] = [
  { id: "nb-1", title: "At the doctor", date: "03/11", kind: "Colaborativo" },
  { id: "nb-2", title: "Travel vocabulary", date: "27/10", kind: "Colaborativo" },
  { id: "nb-3", title: "Sobrevivência em viagens", date: "20/10", kind: "Apostila pronta" },
  { id: "nb-4", title: "Weekend stories", date: "13/10", kind: "Meu material" },
];

export function notebooksFor(studentId: string): NotebookItem[] {
  const count = studentId === "s8" ? 1 : studentId === "s4" ? 2 : 4;
  return DEFAULT_NOTEBOOKS.slice(0, count);
}

export type StudentProfileInfo = { placedOn: string; strongest: Skill; weakest: Skill; goal: string };

export const PROFILE_INFO: Record<string, StudentProfileInfo> = {
  s1: { placedOn: "12/08", strongest: "vocabulary", weakest: "listening", goal: "Viajar com segurança" },
  s2: { placedOn: "03/03", strongest: "reading", weakest: "grammar", goal: "Conversar no dia a dia" },
  s3: { placedOn: "20/07", strongest: "grammar", weakest: "listening", goal: "Entrevista de emprego" },
  s4: { placedOn: "30/06", strongest: "vocabulary", weakest: "grammar", goal: "Começar do zero" },
  s5: { placedOn: "11/09", strongest: "listening", weakest: "reading", goal: "Entender séries e podcasts" },
  s6: { placedOn: "08/04", strongest: "grammar", weakest: "vocabulary", goal: "Conversar no trabalho" },
  s7: { placedOn: "25/05", strongest: "reading", weakest: "listening", goal: "E-mails e reuniões" },
  s8: { placedOn: "19/02", strongest: "vocabulary", weakest: "reading", goal: "Retomar o inglês" },
  s9: { placedOn: "04/10", strongest: "listening", weakest: "grammar", goal: "Viagem no fim do ano" },
  s10: { placedOn: "12/12", strongest: "reading", weakest: "listening", goal: "Conversar sobre tecnologia" },
};

export type RecordingLine = { t: number; who: "Prof" | "Aluno"; text: string };

export const RECORDING = {
  title: "At the doctor",
  duration: 180,
  chapters: [
    { t: 0, label: "Aquecimento" },
    { t: 25, label: "Sintomas" },
    { t: 58, label: "Perguntas do médico" },
    { t: 100, label: "Conselhos com should" },
    { t: 150, label: "Tarefa" },
  ],
  lines: [
    { t: 0, who: "Prof", text: "Good morning! Today we are going to talk about the doctor." },
    { t: 12, who: "Aluno", text: "Okay! I had a headache yesterday." },
    { t: 25, who: "Prof", text: "Great. We say: I have a headache. What else can you have?" },
    { t: 40, who: "Aluno", text: "A sore throat and a fever." },
    { t: 58, who: "Prof", text: "Perfect. Now the doctor's questions: How long have you felt like this?" },
    { t: 80, who: "Aluno", text: "Since Monday." },
    { t: 100, who: "Prof", text: "Good. Let's practice should: You should rest." },
    { t: 125, who: "Aluno", text: "You should drink a lot of water." },
    { t: 150, who: "Prof", text: "Excellent! For homework, write a short dialogue in the notebook." },
  ] as RecordingLine[],
};

export const fmtTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
