/** Todos os dados abaixo são FICTÍCIOS e existem só para a demonstração. */

export type PayStatus = "em_dia" | "vence_breve" | "atrasado";

export type Student = {
  id: string;
  name: string;
  level: string;
  plan: string;
  price: number;
  dueDay: number;
  status: PayStatus;
  attendance: number;
  contractUntil: string;
  autoRenew: boolean;
  note: string;
};

export const STUDENTS: Student[] = [
  { id: "s1", name: "Beatriz Lima", level: "B1", plan: "2 aulas por semana", price: 320, dueDay: 5, status: "em_dia", attendance: 96, contractUntil: "02/08/2027", autoRenew: true, note: "Revisar phrasal verbs de viagem." },
  { id: "s2", name: "Carlos Mendes", level: "A2", plan: "1 aula por semana", price: 190, dueDay: 10, status: "vence_breve", attendance: 88, contractUntil: "15/03/2027", autoRenew: true, note: "Praticar o passado simples falando." },
  { id: "s3", name: "Daniela Souza", level: "B2", plan: "2 aulas por semana", price: 320, dueDay: 5, status: "em_dia", attendance: 100, contractUntil: "20/01/2027", autoRenew: false, note: "Preparar entrevista de emprego em inglês." },
  { id: "s4", name: "Eduardo Tavares", level: "A1", plan: "1 aula por semana", price: 190, dueDay: 15, status: "atrasado", attendance: 71, contractUntil: "30/06/2027", autoRenew: true, note: "Vocabulário básico de rotina." },
  { id: "s5", name: "Fernanda Rocha", level: "B1", plan: "2 aulas por semana", price: 320, dueDay: 10, status: "em_dia", attendance: 92, contractUntil: "11/09/2027", autoRenew: true, note: "Ouvir mais podcasts e resumir." },
  { id: "s6", name: "Gustavo Alves", level: "A2", plan: "1 aula por semana", price: 190, dueDay: 5, status: "vence_breve", attendance: 84, contractUntil: "08/04/2027", autoRenew: true, note: "Treinar perguntas do dia a dia." },
  { id: "s7", name: "Helena Prado", level: "C1", plan: "2 aulas por semana", price: 340, dueDay: 10, status: "em_dia", attendance: 98, contractUntil: "25/05/2027", autoRenew: false, note: "Escrita formal e e-mails de negócios." },
  { id: "s8", name: "Igor Martins", level: "B1", plan: "1 aula por semana", price: 190, dueDay: 15, status: "atrasado", attendance: 65, contractUntil: "19/02/2027", autoRenew: true, note: "Retomar leitura de artigos curtos." },
  { id: "s9", name: "Julia Freitas", level: "A2", plan: "2 aulas por semana", price: 320, dueDay: 10, status: "em_dia", attendance: 94, contractUntil: "04/10/2027", autoRenew: true, note: "Pronúncia do som do th." },
  { id: "s10", name: "Lucas Barros", level: "B2", plan: "1 aula por semana", price: 190, dueDay: 5, status: "em_dia", attendance: 90, contractUntil: "12/12/2026", autoRenew: true, note: "Conversação sobre tecnologia." },
];

export const STATUS_LABEL: Record<PayStatus, string> = {
  em_dia: "Em dia",
  vence_breve: "Vence em 3 dias",
  atrasado: "Atrasado",
};

/** O acesso do aluno só é bloqueado se a política automática estiver ligada. */
export function isBlocked(student: Student, autoBlock: boolean): boolean {
  return autoBlock && student.status === "atrasado";
}

export const WEEK_LESSONS = [
  { id: "l1", studentId: "s1", day: "Segunda", time: "09:00", student: "Beatriz Lima", topic: "Travel vocabulary" },
  { id: "l2", studentId: "s3", day: "Segunda", time: "14:00", student: "Daniela Souza", topic: "Job interview practice" },
  { id: "l3", studentId: "s2", day: "Terça", time: "10:00", student: "Carlos Mendes", topic: "Simple past" },
  { id: "l4", studentId: "s5", day: "Quarta", time: "09:00", student: "Fernanda Rocha", topic: "Podcast discussion" },
  { id: "l5", studentId: "s7", day: "Quinta", time: "18:30", student: "Helena Prado", topic: "Formal emails" },
  { id: "l6", studentId: "s10", day: "Sexta", time: "08:00", student: "Lucas Barros", topic: "Tech conversation" },
];

export const PAST_LESSONS = [
  {
    id: "p1",
    when: "Seg, 27/10 · 09:00",
    student: "Beatriz Lima",
    topic: "Weekend stories",
    excerpt: [
      { who: "Prof", text: "Good morning, Beatriz! How was your weekend?" },
      { who: "Aluna", text: "It was great! I traveled to Florianópolis with my family." },
      { who: "Aluna", text: "We go to the beach and eat a lot of seafood." },
      { who: "Prof", text: "Almost! We went to the beach and ate a lot of seafood." },
    ],
  },
  {
    id: "p2",
    when: "Ter, 28/10 · 10:00",
    student: "Carlos Mendes",
    topic: "Daily routine",
    excerpt: [
      { who: "Prof", text: "What time do you usually wake up?" },
      { who: "Aluno", text: "I wake up at six, then I take a shower." },
      { who: "Prof", text: "Perfect. And after that?" },
    ],
  },
];

export const LIVE_CAPTIONS = [
  { who: "Prof", text: "Good morning, Beatriz! How was your weekend?" },
  { who: "Aluna", text: "It was great! I traveled to Florianópolis with my family." },
  { who: "Prof", text: "Nice! Tell me more. What did you do there?" },
  { who: "Aluna", text: "We go to the beach and eat a lot of seafood." },
  { who: "Prof", text: "Almost! We went to the beach and ate a lot of seafood." },
  { who: "Aluna", text: "Went, ate. Thank you!" },
];

export const PLATFORM_COURSES = [
  { id: "c1", title: "English for Travel", level: "A2 a B1", lessons: 24, tag: "Viagens" },
  { id: "c2", title: "Business English Essentials", level: "B1 a B2", lessons: 32, tag: "Trabalho" },
  { id: "c3", title: "Pronúncia: sons difíceis", level: "Todos os níveis", lessons: 18, tag: "Pronúncia" },
  { id: "c4", title: "Conversação guiada", level: "B1", lessons: 40, tag: "Conversação" },
  { id: "c5", title: "Preparação para entrevistas", level: "B2", lessons: 12, tag: "Carreira" },
  { id: "c6", title: "Gramática do zero", level: "A1 a A2", lessons: 36, tag: "Gramática" },
];

export const OWN_COURSES = [{ id: "m1", title: "Inglês para o Natal", level: "A2", lessons: 6, size: "0,4 GB" }];

export const FLASHCARDS = [
  { front: "to run out of", back: "ficar sem, acabar", example: "We ran out of coffee this morning." },
  { front: "I used to live here", back: "eu morava aqui (antes)", example: "I used to live here when I was a kid." },
  { front: "although", back: "embora, apesar de", example: "Although it was late, we kept talking." },
  { front: "to look forward to", back: "esperar ansiosamente", example: "I look forward to seeing you." },
  { front: "by the way", back: "a propósito", example: "By the way, did you finish the exercise?" },
];
