/** Aulas do mês de cada aluno (dados fictícios, determinísticos). "Hoje" nas demos é 05/11/2026. */

export type ClassStatus = "compareceu" | "faltou" | "cancelada_aluno" | "cancelada_prof" | "reposicao" | "agendada";

type Tone = "ok" | "warn" | "danger" | "neutral" | "brand";

export const CLASS_STATUS: Record<ClassStatus, { label: string; tone: Tone }> = {
  compareceu: { label: "Aluno veio", tone: "ok" },
  faltou: { label: "Aluno faltou", tone: "danger" },
  cancelada_aluno: { label: "Aluno cancelou", tone: "warn" },
  cancelada_prof: { label: "Eu cancelei", tone: "neutral" },
  reposicao: { label: "Reposição", tone: "brand" },
  agendada: { label: "Agendada", tone: "neutral" },
};

export const TODAY = { year: 2026, month: 11, day: 5 };

export const MONTHS = [
  { year: 2026, month: 10, label: "Outubro de 2026" },
  { year: 2026, month: 11, label: "Novembro de 2026" },
] as const;

export type MonthClass = {
  id: string;
  day: number;
  date: string;
  weekday: string;
  time: string;
  status: ClassStatus;
  topic: string;
  isToday: boolean;
  recorded: boolean;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Dias da semana (0 = domingo) e horário das aulas de cada aluno. */
const SCHEDULE: Record<string, { days: number[]; time: string }> = {
  s1: { days: [1, 4], time: "09:00" },
  s2: { days: [2], time: "10:00" },
  s3: { days: [1, 3], time: "14:00" },
  s4: { days: [2], time: "15:00" },
  s5: { days: [3], time: "09:00" },
  s6: { days: [1], time: "16:00" },
  s7: { days: [4], time: "18:30" },
  s8: { days: [5], time: "08:00" },
  s9: { days: [2, 4], time: "11:00" },
  s10: { days: [5], time: "08:00" },
};

const TOPICS = [
  "Travel vocabulary",
  "Simple past",
  "At the doctor",
  "Weekend stories",
  "Daily routine",
  "Phrasal verbs",
  "Listening practice",
  "Job interview",
  "Formal emails",
  "Pronunciation: th",
];

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 7;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function monthClasses(studentId: string, attendance: number, year: number, month: number): MonthClass[] {
  const schedule = SCHEDULE[studentId] ?? { days: [2], time: "10:00" };
  const rand = seeded(hash(studentId) + month * 101);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const list: MonthClass[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (!schedule.days.includes(dow)) continue;

    const before = year < TODAY.year || (year === TODAY.year && (month < TODAY.month || (month === TODAY.month && day < TODAY.day)));
    const isToday = year === TODAY.year && month === TODAY.month && day === TODAY.day;

    let status: ClassStatus = "agendada";
    if (before) {
      const r = rand();
      if (r < attendance / 100) status = "compareceu";
      else {
        const k = rand();
        status = k < 0.45 ? "faltou" : k < 0.75 ? "cancelada_aluno" : k < 0.9 ? "cancelada_prof" : "reposicao";
      }
    }

    const index = list.length;
    list.push({
      id: `${studentId}-${year}-${month}-${day}`,
      day,
      date: `${pad(day)}/${pad(month)}`,
      weekday: WEEKDAYS[dow],
      time: schedule.time,
      status,
      topic: TOPICS[(day + index) % TOPICS.length],
      isToday,
      recorded: false,
    });
  }

  // Garante variedade de status na história da Beatriz, para a demo mostrar todos.
  if (studentId === "s1" && month === 10) {
    const overrides: [number, ClassStatus][] = [
      [2, "cancelada_aluno"],
      [4, "faltou"],
      [5, "cancelada_prof"],
      [6, "reposicao"],
    ];
    for (const [i, status] of overrides) if (list[i]) list[i].status = status;
  }

  return list.map((c, i) => ({ ...c, recorded: c.status === "compareceu" && (i + hash(studentId)) % 5 !== 0 }));
}

export function countByStatus(list: MonthClass[]): Record<ClassStatus, number> {
  const base: Record<ClassStatus, number> = { compareceu: 0, faltou: 0, cancelada_aluno: 0, cancelada_prof: 0, reposicao: 0, agendada: 0 };
  for (const c of list) base[c.status] += 1;
  return base;
}
