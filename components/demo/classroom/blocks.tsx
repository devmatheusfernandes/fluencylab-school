"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Check, Link2, ListChecks, PenLine, Sparkles, Users, X } from "lucide-react";

/* Blocos interativos que ficam DENTRO do documento colaborativo (visual escuro, como a sala real). */

export function BlockShell({ icon, label, ai, children, id }: { icon: ReactNode; label: string; ai?: boolean; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-[#1f2733] bg-[#0d1218] p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#9aa7b6]">
        {icon}
        {label}
        {ai && <span className="rounded-full bg-[#6c47ff]/20 px-2 py-0.5 normal-case tracking-normal text-[#b8a6ff]">Gerado por IA a partir deste caderno</span>}
      </div>
      {children}
    </section>
  );
}

/* ───────── Quiz de múltipla escolha ───────── */

export function QuizBlock({ id, question, options, correct, why, ai }: { id?: string; question: string; options: string[]; correct: number; why: string; ai?: boolean }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <BlockShell id={id} icon={ai ? <Sparkles className="size-4" aria-hidden /> : <ListChecks className="size-4" aria-hidden />} label="Quiz" ai={ai}>
      <p className="font-semibold">{question}</p>
      <div className="mt-3 grid gap-2 @xl:grid-cols-3">
        {options.map((option, i) => (
          <button
            key={option}
            type="button"
            onClick={() => setPicked(i)}
            className={clsx(
              "rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
              picked === null && "border-[#263140] hover:border-[#6c47ff]",
              picked !== null && i === correct && "border-emerald-500 bg-emerald-500/15",
              picked !== null && picked === i && i !== correct && "border-red-500 bg-red-500/15",
              picked !== null && picked !== i && i !== correct && "border-[#263140] opacity-50",
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p role="status" className={clsx("mt-3 rounded-xl px-3 py-2 text-sm font-semibold", picked === correct ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200")}>
          {picked === correct ? "Isso mesmo! " : "Quase. "}
          {why}
        </p>
      )}
    </BlockShell>
  );
}

/* ───────── Lacunas ───────── */

const GAPS = [
  { pre: "My back", answer: "hurts", post: "." },
  { pre: "You", answer: "should", post: "rest today." },
  { pre: "How long have you", answer: "felt", post: "like this?" },
];

export function GapBlock({ id }: { id?: string }) {
  const [values, setValues] = useState<string[]>(GAPS.map(() => ""));
  const [checked, setChecked] = useState(false);
  const score = GAPS.filter((g, i) => values[i].trim().toLowerCase() === g.answer).length;

  return (
    <BlockShell id={id} icon={<PenLine className="size-4" aria-hidden />} label="Complete as lacunas">
      <ul className="space-y-3">
        {GAPS.map((gap, i) => {
          const ok = values[i].trim().toLowerCase() === gap.answer;
          return (
            <li key={gap.pre} className="flex flex-wrap items-center gap-2 text-sm">
              <span>{gap.pre}</span>
              <input
                value={values[i]}
                onChange={(e) => {
                  setChecked(false);
                  setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)));
                }}
                aria-label={`Lacuna ${i + 1}`}
                className={clsx(
                  "w-28 rounded-lg border bg-[#07090d] px-3 py-1.5 text-center font-semibold outline-none focus:border-[#6c47ff]",
                  !checked && "border-[#263140]",
                  checked && ok && "border-emerald-500 text-emerald-200",
                  checked && !ok && "border-red-500 text-red-200",
                )}
              />
              <span>{gap.post}</span>
              {checked && (ok ? <Check className="size-4 text-emerald-400" aria-label="Correto" /> : <X className="size-4 text-red-400" aria-label="Incorreto" />)}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setChecked(true)} className="rounded-full bg-[#6c47ff] px-4 py-2 text-sm font-bold text-white hover:brightness-110">
          Verificar
        </button>
        {checked && (
          <span role="status" className="text-sm font-semibold text-[#c9d2dc]">
            {score} de {GAPS.length} corretas
          </span>
        )}
      </div>
    </BlockShell>
  );
}

/* ───────── Combinar pares ───────── */

const PAIRS: [string, string][] = [
  ["fever", "febre"],
  ["cough", "tosse"],
  ["sore throat", "dor de garganta"],
  ["dizzy", "tonto"],
];
const RIGHT_ORDER = ["tosse", "tonto", "febre", "dor de garganta"];

export function MatchBlock({ id }: { id?: string }) {
  const [left, setLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function pickRight(pt: string) {
    if (!left) return;
    const pair = PAIRS.find(([en]) => en === left);
    if (pair && pair[1] === pt) {
      setMatched((m) => [...m, left]);
      setLeft(null);
    } else {
      setWrong(pt);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setWrong(null), 700);
    }
  }

  const done = matched.length === PAIRS.length;

  return (
    <BlockShell id={id} icon={<Link2 className="size-4" aria-hidden />} label="Combine os pares">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-2">
          {PAIRS.map(([en]) => {
            const isDone = matched.includes(en);
            return (
              <button
                key={en}
                type="button"
                disabled={isDone}
                onClick={() => setLeft(en)}
                aria-pressed={left === en}
                className={clsx(
                  "w-full rounded-xl border px-3 py-2.5 text-left font-semibold transition",
                  isDone ? "border-emerald-500 bg-emerald-500/15 text-emerald-200" : left === en ? "border-[#6c47ff] bg-[#6c47ff]/15" : "border-[#263140] hover:border-[#6c47ff]",
                )}
              >
                {en}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {RIGHT_ORDER.map((pt) => {
            const isDone = PAIRS.some(([en, p]) => p === pt && matched.includes(en));
            return (
              <button
                key={pt}
                type="button"
                disabled={isDone}
                onClick={() => pickRight(pt)}
                className={clsx(
                  "w-full rounded-xl border px-3 py-2.5 text-left font-semibold transition",
                  isDone ? "border-emerald-500 bg-emerald-500/15 text-emerald-200" : wrong === pt ? "border-red-500 bg-red-500/15" : "border-[#263140] hover:border-[#6c47ff]",
                )}
              >
                {pt}
              </button>
            );
          })}
        </div>
      </div>
      <p role="status" className="mt-3 text-sm text-[#c9d2dc]">
        {done ? "Parabéns, todos os pares combinados!" : left ? `Agora escolha a tradução de “${left}”.` : "Toque numa palavra em inglês e depois na tradução."}
      </p>
    </BlockShell>
  );
}

/* ───────── Escrita colaborativa ───────── */

function useTyped(text: string, delay: number) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      let i = 0;
      interval = setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length && interval) clearInterval(interval);
      }, 38);
    }, delay);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, delay]);
  return { shown: text.slice(0, count), typing: count < text.length };
}

export function WriteBlock({ id, me }: { id?: string; me: "Ana" | "Beatriz" }) {
  const other = me === "Ana" ? "Beatriz" : "Ana";
  const script = me === "Ana" ? "Doctor, I have a headache and a fever since yesterday." : "Good morning! What seems to be the problem?";
  const { shown, typing } = useTyped(script, 2600);
  const [mine, setMine] = useState("");

  const row = (name: string, color: string, children: ReactNode, live?: boolean) => (
    <div className="rounded-xl border border-[#263140] bg-[#07090d] p-3">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-bold" style={{ color }}>
        <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
        {name}
        {live && <span className="text-[#9aa7b6]">está escrevendo…</span>}
      </div>
      {children}
    </div>
  );

  const otherRow = row(
    other,
    me === "Ana" ? "#f2a541" : "#2ea89a",
    <p className="min-h-6 text-sm">
      {shown}
      {typing && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" aria-hidden />}
    </p>,
    typing && shown.length > 0,
  );

  const myRow = row(
    `${me} (você)`,
    me === "Ana" ? "#2ea89a" : "#f2a541",
    <textarea
      value={mine}
      onChange={(e) => setMine(e.target.value)}
      rows={2}
      placeholder="Escreva aqui. O outro lado vê em tempo real."
      aria-label="Seu texto no documento compartilhado"
      className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#5f6c7a]"
    />,
  );

  return (
    <BlockShell id={id} icon={<Users className="size-4" aria-hidden />} label="Escrevam juntos · roleplay no consultório">
      <p className="mb-3 text-sm text-[#c9d2dc]">Faça de conta que está no consultório. Um é o médico, o outro é o paciente.</p>
      <div className="space-y-2">
        {otherRow}
        {myRow}
      </div>
    </BlockShell>
  );
}
