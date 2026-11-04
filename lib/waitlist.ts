import { z } from "zod";
import { ensureSchema, getSql } from "@/lib/db";
import {
  BILLING_VALUES,
  LANGUAGES,
  MAIN_PAINS,
  PAIN_VALUES,
  PRICE_INTENTS,
  PRICE_VALUES,
  STUDENTS_VALUES,
} from "@/lib/waitlist-options";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const waitlistSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido").max(200)),
  whatsapp: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^[\d\s()+-]{10,20}$/, "WhatsApp inválido (use DDD + número)")
      .optional(),
  ),
  language: z.enum(LANGUAGES, "Escolha o idioma que você ensina"),
  studentsRange: z.enum(STUDENTS_VALUES, "Escolha uma faixa de alunos"),
  billing: z.array(z.enum(BILLING_VALUES)).max(5).default([]),
  priceIntent: z.enum(PRICE_VALUES, "Escolha uma faixa de valor"),
  mainPain: z.enum(PAIN_VALUES, "Escolha o que mais atrapalha hoje"),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(600).optional()),
  source: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
  consent: z.literal(true, "É preciso aceitar para entrar na lista"),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export type WaitlistRow = {
  id: number;
  name: string;
  email: string;
  whatsapp: string | null;
  language: string;
  students_range: string;
  billing: string[];
  price_intent: string;
  main_pain: string;
  notes: string | null;
  source: string | null;
  created_at: string;
};

export async function saveWaitlistEntry(input: WaitlistInput): Promise<{ stored: boolean; inserted: boolean }> {
  const sql = getSql();
  if (!sql) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("WAITLIST_DATABASE_URL não configurada");
    }
    console.log("[waitlist] (sem banco, modo desenvolvimento)", input);
    return { stored: false, inserted: true };
  }

  await ensureSchema(sql);
  const rows = (await sql`
    INSERT INTO waitlist (name, email, whatsapp, language, students_range, billing, price_intent, main_pain, notes, source)
    VALUES (
      ${input.name}, ${input.email}, ${input.whatsapp ?? null}, ${input.language}, ${input.studentsRange},
      ${JSON.stringify(input.billing)}::jsonb, ${input.priceIntent}, ${input.mainPain},
      ${input.notes ?? null}, ${input.source ?? null}
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      whatsapp = EXCLUDED.whatsapp,
      language = EXCLUDED.language,
      students_range = EXCLUDED.students_range,
      billing = EXCLUDED.billing,
      price_intent = EXCLUDED.price_intent,
      main_pain = EXCLUDED.main_pain,
      notes = EXCLUDED.notes,
      updated_at = now()
    RETURNING (xmax = 0) AS inserted
  `) as { inserted: boolean }[];

  return { stored: true, inserted: rows[0]?.inserted ?? true };
}

export async function listWaitlist(): Promise<WaitlistRow[] | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema(sql);
  const rows = (await sql`
    SELECT id, name, email, whatsapp, language, students_range, billing, price_intent, main_pain, notes, source,
           to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') AS created_at
    FROM waitlist
    ORDER BY id DESC
  `) as WaitlistRow[];
  return rows;
}

export type WaitlistStats = {
  total: number;
  willPay: number;
  willPay100: number;
  averageIntent: number;
  byPrice: { label: string; count: number }[];
  byStudents: { label: string; count: number }[];
  byPain: { label: string; count: number }[];
  byLanguage: { label: string; count: number }[];
};

function countBy(rows: WaitlistRow[], pick: (row: WaitlistRow) => string, labelOf: (key: string) => string) {
  const map = new Map<string, number>();
  for (const row of rows) map.set(pick(row), (map.get(pick(row)) ?? 0) + 1);
  return [...map.entries()]
    .map(([key, count]) => ({ label: labelOf(key), count }))
    .sort((a, b) => b.count - a.count);
}

export function computeStats(rows: WaitlistRow[]): WaitlistStats {
  const midpoint = (value: string) => PRICE_INTENTS.find((o) => o.value === value)?.midpoint ?? 0;
  const willPay = rows.filter((r) => r.price_intent !== "nao_pagaria").length;
  const willPay100 = rows.filter((r) => midpoint(r.price_intent) >= 150).length;
  const payers = rows.filter((r) => r.price_intent !== "nao_pagaria");
  const averageIntent = payers.length
    ? Math.round(payers.reduce((sum, r) => sum + midpoint(r.price_intent), 0) / payers.length)
    : 0;

  return {
    total: rows.length,
    willPay,
    willPay100,
    averageIntent,
    byPrice: PRICE_INTENTS.map((o) => ({
      label: o.label,
      count: rows.filter((r) => r.price_intent === o.value).length,
    })),
    byStudents: countBy(rows, (r) => r.students_range, (k) => k),
    byPain: countBy(rows, (r) => r.main_pain, (k) => MAIN_PAINS.find((o) => o.value === k)?.label ?? k),
    byLanguage: countBy(rows, (r) => r.language, (k) => k),
  };
}
