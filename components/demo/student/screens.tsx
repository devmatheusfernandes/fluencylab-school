"use client";

import { useState } from "react";
import clsx from "clsx";
import { Award, CheckCircle2, Copy, Lock, RotateCcw } from "lucide-react";
import { FLASHCARDS } from "@/lib/demo-data";
import { Badge, Button, Modal } from "@/components/demo/ui";

export type StudentTab = "inicio" | "aulas" | "estudar" | "revisar" | "pagar";

export type Notify = (message: string) => void;

export const box = "rounded-2xl border border-line bg-card p-4";

/* ───────── Estudar (cursos + caderno) ───────── */

const QUIZ = {
  question: "Escolha a frase correta:",
  options: ["I go to Rio last year.", "I went to Rio last year.", "I goed to Rio last year."],
  correct: 1,
};

export function StudyScreen({ notify }: { notify: Notify }) {
  const [view, setView] = useState<"cursos" | "caderno">("cursos");
  const [answer, setAnswer] = useState<number | null>(null);
  const [cert, setCert] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Estudar</h2>
      <div className="inline-flex rounded-full border border-line bg-card p-1" role="tablist" aria-label="Estudar">
        {(
          [
            ["cursos", "Cursos"],
            ["caderno", "Caderno"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={clsx("rounded-full px-4 py-1.5 text-sm font-bold", view === id ? "bg-brand text-brand-ink" : "hover:bg-cream")}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "cursos" ? (
        <>
          <div className={box}>
            <div className="flex items-center justify-between">
              <p className="font-bold">English for Travel</p>
              <span className="text-sm font-bold">70%</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-stone-200">
              <div className="h-2.5 rounded-full bg-brand" style={{ width: "70%" }} />
            </div>
            <p className="mt-4 text-sm font-bold">Exercício rápido</p>
            <p className="mt-1 text-sm">{QUIZ.question}</p>
            <div className="mt-2 space-y-2">
              {QUIZ.options.map((opt, i) => {
                const picked = answer === i;
                const right = i === QUIZ.correct;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(i)}
                    className={clsx(
                      "w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
                      answer === null && "border-line hover:border-ink",
                      answer !== null && picked && right && "border-emerald-600 bg-emerald-50",
                      answer !== null && picked && !right && "border-red-500 bg-red-50",
                      answer !== null && !picked && "border-line opacity-60",
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {answer !== null && (
              <p className={clsx("mt-3 rounded-xl p-3 text-sm font-bold", answer === QUIZ.correct ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900")} role="status">
                {answer === QUIZ.correct
                  ? "Isso! “Went” é o passado de “go”."
                  : "Quase. Para fatos no passado, use “went”, o passado de “go”."}
              </p>
            )}
          </div>

          <div className={box}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold">Pronúncia essencial</p>
              <Badge tone="ok">
                <CheckCircle2 className="size-3" aria-hidden /> Concluído
              </Badge>
            </div>
            <Button className="mt-3" variant="ghost" onClick={() => setCert(true)}>
              <Award className="size-4" aria-hidden /> Ver certificado
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className={box}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Aula de 27/10 · Weekend stories</p>
            <p className="mt-2 text-sm leading-relaxed">
              Passado simples: usamos <mark className="rounded bg-amber/40 px-1">went</mark> e{" "}
              <mark className="rounded bg-amber/40 px-1">ate</mark> para ações que já terminaram.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">Lembrar: “We went to the beach and ate a lot of seafood.”</p>
          </div>
          <div className={box}>
            <p className="text-sm font-bold">Vocabulário novo</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["seafood", "weekend", "to travel", "beach"].map((w) => (
                <button key={w} type="button" onClick={() => notify(`“${w}” adicionado à revisão.`)} className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-bold">
                  {w}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Toque numa palavra para mandá-la para a revisão espaçada.</p>
          </div>
        </div>
      )}

      <Modal open={cert} onClose={() => setCert(false)} title="Certificado de conclusão">
        <div className="rounded-2xl border-4 border-double border-amber p-6 text-center">
          <Award className="mx-auto size-10 text-amber" aria-hidden />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">Certificamos que</p>
          <p className="mt-2 font-display text-3xl font-semibold">Beatriz Lima</p>
          <p className="mt-3 text-sm">concluiu o curso</p>
          <p className="font-display text-xl font-semibold">Pronúncia essencial</p>
          <p className="mt-5 text-sm text-muted">Inglês com a Ana · 02/11/2026</p>
        </div>
      </Modal>
    </div>
  );
}

/* ───────── Revisar (flashcards) ───────── */

export function ReviewScreen() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<("errei" | "dificil" | "facil")[]>([]);
  const [last, setLast] = useState("");

  const done = index >= FLASHCARDS.length;
  const card = FLASHCARDS[index];

  function answer(kind: "errei" | "dificil" | "facil") {
    setResults((r) => [...r, kind]);
    setLast(kind === "errei" ? "Esse volta em 10 minutos." : kind === "dificil" ? "Esse volta amanhã." : "Esse volta em 4 dias.");
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  function restart() {
    setIndex(0);
    setFlipped(false);
    setResults([]);
    setLast("");
  }

  if (done) {
    const hits = results.filter((r) => r !== "errei").length;
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold">Revisão concluída</h2>
        <div className={box}>
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
          <p className="mt-3 font-display text-3xl font-semibold">
            {hits} de {FLASHCARDS.length}
          </p>
          <p className="text-sm text-muted">cartões lembrados</p>
          {last && <p className="mt-3 text-sm">{last}</p>}
        </div>
        <Button onClick={restart} variant="ghost" className="mx-auto">
          <RotateCcw className="size-4" aria-hidden /> Refazer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">Revisão espaçada</h3>
        <span className="text-sm font-bold text-muted">
          {index + 1} / {FLASHCARDS.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        aria-label={flipped ? "Virar o cartão para a frente" : "Virar o cartão para ver a resposta"}
        className="grid min-h-60 w-full place-items-center rounded-3xl border border-line bg-card p-6 text-center shadow-sm transition hover:border-ink"
      >
        {flipped ? (
          <span>
            <span className="block font-display text-2xl font-semibold">{card.back}</span>
            <span className="mt-3 block text-sm italic text-muted">“{card.example}”</span>
          </span>
        ) : (
          <span>
            <span className="block font-display text-3xl font-semibold">{card.front}</span>
            <span className="mt-4 block text-xs font-bold uppercase tracking-wider text-muted">Toque para ver a resposta</span>
          </span>
        )}
      </button>

      {flipped ? (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="danger" onClick={() => answer("errei")}>
            Errei
          </Button>
          <Button variant="ghost" onClick={() => answer("dificil")}>
            Difícil
          </Button>
          <Button onClick={() => answer("facil")}>Fácil</Button>
        </div>
      ) : (
        <p className="text-center text-sm text-muted">Tente lembrar antes de virar o cartão.</p>
      )}
      {last && <p className="text-center text-sm font-bold">{last}</p>}
    </div>
  );
}

/* ───────── Pagar ───────── */

function buildQr(): boolean[][] {
  const n = 25;
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const grid: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd() > 0.52));
  const finder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const ring = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = ring || core;
      }
    }
    for (let i = -1; i <= 7; i++) {
      for (const [r, c] of [
        [r0 - 1, c0 + i],
        [r0 + 7, c0 + i],
        [r0 + i, c0 - 1],
        [r0 + i, c0 + 7],
      ]) {
        if (r >= 0 && r < n && c >= 0 && c < n) grid[r][c] = false;
      }
    }
  };
  finder(0, 0);
  finder(0, n - 7);
  finder(n - 7, 0);
  return grid;
}

const QR = buildQr();
const PIX_CODE = "00020126EXEMPLO-DEMONSTRATIVO-NAO-E-UM-PIX-REAL";

function QrMock() {
  return (
    <svg viewBox="0 0 25 25" className="mx-auto size-44" role="img" aria-label="QR Code de exemplo" shapeRendering="crispEdges">
      <rect width="25" height="25" fill="#fff" />
      {QR.map((row, r) => row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#12263a" /> : null)))}
    </svg>
  );
}

export function PayScreen({ notify }: { notify: Notify }) {
  const [contract, setContract] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(PIX_CODE);
      notify("Código PIX de exemplo copiado.");
    } catch {
      notify("Não foi possível copiar aqui, mas na plataforma funciona.");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Pagamento</h2>
      <div className={box}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold">Mensalidade de novembro</p>
            <p className="text-sm text-muted">Vence dia 5</p>
          </div>
          <p className="font-display text-xl font-semibold">R$ 320</p>
        </div>
        <div className="mt-4 rounded-xl bg-cream p-3">
          <QrMock />
          <p className="mt-2 text-center text-xs text-muted">QR Code de exemplo</p>
        </div>
        <Button className="mt-3 w-full" onClick={copy}>
          <Copy className="size-4" aria-hidden /> Copiar código PIX
        </Button>
        <p className="mt-3 text-xs text-muted">O pagamento cai direto na conta do professor e a baixa é automática.</p>
      </div>

      <div className={box}>
        <p className="font-bold">Contrato</p>
        <p className="mt-1 text-sm text-muted">Vigente até 02/08/2027 · renovação automática</p>
        <Button className="mt-3" variant="ghost" onClick={() => setContract(true)}>
          Ver contrato
        </Button>
      </div>

      <Modal open={contract} onClose={() => setContract(false)} title="Seu contrato">
        <p className="text-sm leading-relaxed">
          Contrato de aulas de idioma entre <b>Beatriz Lima</b> e <b>Inglês com a Ana</b>, na modalidade 2 aulas por
          semana, valor mensal de R$ 320, vigente até 02/08/2027 com renovação automática. Assinado digitalmente
          (exemplo ilustrativo).
        </p>
      </Modal>
    </div>
  );
}

/* ───────── Acesso bloqueado ───────── */

export function BlockedScreen({ onPaid }: { onPaid: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-red-100 text-red-700">
        <Lock className="size-8" aria-hidden />
      </span>
      <h2 className="text-2xl font-semibold">Acesso suspenso</h2>
      <p className="max-w-xs text-sm leading-relaxed text-muted">
        Há uma mensalidade em aberto. Assim que o pagamento for confirmado, o seu acesso volta na hora.
      </p>
      <div className={clsx(box, "w-full text-left")}>
        <p className="font-bold">Mensalidade de novembro</p>
        <p className="text-sm text-muted">Venceu há 6 dias · R$ 320</p>
      </div>
      <Button className="w-full" onClick={onPaid}>
        Já paguei (simular)
      </Button>
    </div>
  );
}
