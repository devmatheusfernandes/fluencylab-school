"use client";

import { useState, type FormEvent } from "react";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Grid3x3, Layers, Music2, Pause, Play } from "lucide-react";
import { Button } from "@/components/demo/ui";
import { box } from "@/components/demo/student/screens";

/* Jogos de imersão (versões de demonstração dos jogos da plataforma): Wordle, Word Ladder e Lyrics Training. */

type Mark = "correct" | "present" | "absent";

function evaluate(guess: string, target: string): Mark[] {
  const result: Mark[] = Array(target.length).fill("absent");
  const pool = target.split("");
  guess.split("").forEach((ch, i) => {
    if (ch === pool[i]) {
      result[i] = "correct";
      pool[i] = "*";
    }
  });
  guess.split("").forEach((ch, i) => {
    if (result[i] === "correct") return;
    const idx = pool.indexOf(ch);
    if (idx > -1) {
      result[i] = "present";
      pool[idx] = "*";
    }
  });
  return result;
}

const markClass: Record<Mark, string> = {
  correct: "border-emerald-500 bg-emerald-500 text-white",
  present: "border-amber-400 bg-amber-400 text-ink",
  absent: "border-stone-300 bg-stone-300 text-ink",
};

/* ───────── Wordle ───────── */

const TARGET = "BEACH";

function Wordle() {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [message, setMessage] = useState("");

  const won = guesses.includes(TARGET);
  const lost = !won && guesses.length >= 6;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (won || lost) return;
    if (!/^[A-Z]{5}$/.test(current)) {
      setMessage("Digite uma palavra de 5 letras.");
      return;
    }
    setGuesses((g) => [...g, current]);
    setCurrent("");
    setMessage("");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Descubra a palavra de 5 letras (dica: tem a ver com viagem). Verde: letra certa no lugar certo. Amarelo: letra certa no lugar errado.</p>
      <div className="mx-auto grid w-fit gap-1.5" role="group" aria-label="Tentativas">
        {Array.from({ length: 6 }, (_, row) => {
          const guess = guesses[row];
          const marks = guess ? evaluate(guess, TARGET) : null;
          const typing = row === guesses.length && !won && !lost ? current : "";
          return (
            <div key={row} className="flex gap-1.5">
              {Array.from({ length: 5 }, (_, col) => (
                <span key={col} className={clsx("grid size-11 place-items-center rounded-lg border-2 font-display text-xl font-semibold", marks ? markClass[marks[col]] : "border-line bg-card")}>
                  {guess ? guess[col] : typing[col] ?? ""}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      {won || lost ? (
        <p role="status" className={clsx("rounded-xl p-3 text-center text-sm font-bold", won ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900")}>
          {won ? `Acertou em ${guesses.length} tentativa${guesses.length > 1 ? "s" : ""}! BEACH = praia.` : `Era “${TARGET}” (praia). Tente outra vez amanhã.`}
        </p>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={current}
            onChange={(e) => setCurrent(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))}
            aria-label="Sua tentativa"
            placeholder="5 letras"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-line bg-card px-4 py-2.5 text-center font-display text-lg uppercase tracking-widest focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60"
          />
          <button type="submit" className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-ink hover:brightness-110">
            Enviar
          </button>
        </form>
      )}
      {message && (
        <p role="alert" className="text-center text-sm font-bold text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}

/* ───────── Word Ladder ───────── */

const START = "COLD";
const GOAL = "WARM";
const DICT = new Set(["COLD", "CORD", "CARD", "WARD", "WARM", "WORD", "WORM", "CORE", "CARE", "DARE", "FORM", "FARM", "HARM", "WARN", "WORE", "WARE", "BOLD", "GOLD", "HOLD", "FOLD", "CORN", "HORN", "WORN"]);

function oneLetterApart(a: string, b: string) {
  return a.length === b.length && a.split("").filter((ch, i) => ch !== b[i]).length === 1;
}

function WordLadder() {
  const [steps, setSteps] = useState<string[]>([START]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");

  const won = steps[steps.length - 1] === GOAL;

  function submit(event: FormEvent) {
    event.preventDefault();
    const word = input.toUpperCase();
    const last = steps[steps.length - 1];
    if (word.length !== 4) return setMessage("Use uma palavra de 4 letras.");
    if (!oneLetterApart(last, word)) return setMessage("Troque exatamente uma letra da palavra anterior.");
    if (!DICT.has(word)) return setMessage("Essa palavra não está no dicionário do jogo.");
    if (steps.includes(word)) return setMessage("Você já usou essa palavra.");
    setSteps([...steps, word]);
    setInput("");
    setMessage("");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Vá de <b>{START}</b> até <b>{GOAL}</b> trocando uma letra por vez, sempre formando uma palavra real.
      </p>
      <ol className="space-y-1.5" aria-label="Seus passos">
        {steps.map((word, i) => (
          <li key={word} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-2.5 font-display text-lg font-semibold tracking-widest">
            <span className="w-5 text-xs font-bold text-muted">{i}</span>
            {word}
            {word === GOAL && <CheckCircle2 className="ml-auto size-5 text-emerald-600" aria-label="Chegou" />}
          </li>
        ))}
      </ol>
      {won ? (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-center text-sm font-bold text-emerald-900">
          Chegou em {steps.length - 1} passos. O mínimo possível é 4!
        </p>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 4))}
            aria-label="Próxima palavra"
            placeholder="Próxima palavra"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-line bg-card px-4 py-2.5 text-center font-display text-lg uppercase tracking-widest focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60"
          />
          <button type="submit" className="shrink-0 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-ink hover:brightness-110">
            Enviar
          </button>
        </form>
      )}
      {message && (
        <p role="alert" className="text-center text-sm font-bold text-red-700">
          {message}
        </p>
      )}
      {steps.length > 1 && !won && (
        <button type="button" onClick={() => setSteps(steps.slice(0, -1))} className="text-sm font-bold underline">
          Desfazer o último passo
        </button>
      )}
    </div>
  );
}

/* ───────── Lyrics Training ───────── */

const LYRICS = [
  { pre: "I walk along the", options: ["river", "chair", "phone"], answer: 0, post: "as the sun goes down" },
  { pre: "I keep thinking about the things I", options: ["sit", "said", "sing"], answer: 1, post: "yesterday" },
  { pre: "If you", options: ["calls", "called", "call"], answer: 2, post: "me tonight, I will answer" },
  { pre: "We have been waiting", options: ["for", "since", "during"], answer: 0, post: "a very long time" },
];

function LyricsTraining() {
  const [picked, setPicked] = useState<(number | null)[]>(LYRICS.map(() => null));
  const [playing, setPlaying] = useState(false);
  const [checked, setChecked] = useState(false);
  const score = LYRICS.filter((l, i) => picked[i] === l.answer).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Ouça a música e complete a letra. Na versão real, o áudio toca junto com a letra. Aqui a letra é de exemplo, criada para a demonstração.</p>
      <div className="flex items-center gap-3 rounded-xl bg-ink p-3 text-cream">
        <button type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pausar" : "Tocar"} className="grid size-10 place-items-center rounded-full bg-amber text-ink">
          {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
        </button>
        <div className="flex h-8 flex-1 items-end gap-1" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} className={clsx("flex-1 rounded-sm bg-amber/80", playing && "animate-pulse")} style={{ height: `${25 + ((i * 37) % 70)}%`, animationDelay: `${(i % 6) * 120}ms` }} />
          ))}
        </div>
        <span className="text-xs">Exemplo</span>
      </div>
      <ul className="space-y-3">
        {LYRICS.map((line, i) => {
          const ok = picked[i] === line.answer;
          return (
            <li key={line.pre} className="rounded-xl border border-line bg-card p-3 text-sm">
              <p className="font-semibold">
                {line.pre}{" "}
                <span className={clsx("inline-block min-w-16 rounded-md border-b-2 px-2 text-center", checked ? (ok ? "border-emerald-500 text-emerald-700" : "border-red-500 text-red-700") : "border-ink")}>
                  {picked[i] !== null ? line.options[picked[i] as number] : "____"}
                </span>{" "}
                {line.post}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {line.options.map((option, oi) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setChecked(false);
                      setPicked((p) => p.map((x, j) => (j === i ? oi : x)));
                    }}
                    aria-pressed={picked[i] === oi}
                    className={clsx("rounded-full border px-3 py-1 text-xs font-bold", picked[i] === oi ? "border-ink bg-ink text-cream" : "border-line hover:border-ink")}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3">
        <Button onClick={() => setChecked(true)}>Verificar</Button>
        {checked && (
          <span role="status" className="text-sm font-bold">
            {score} de {LYRICS.length} corretas
          </span>
        )}
      </div>
    </div>
  );
}

/* ───────── Menu dos jogos ───────── */

const GAMES = [
  { id: "wordle", name: "Wordle", text: "Descubra a palavra do dia em 6 tentativas.", icon: Grid3x3 },
  { id: "ladder", name: "Word Ladder", text: "Transforme uma palavra em outra, uma letra por vez.", icon: Layers },
  { id: "lyrics", name: "Lyrics Training", text: "Complete a letra enquanto ouve a música.", icon: Music2 },
] as const;

export function GamesScreen() {
  const [game, setGame] = useState<(typeof GAMES)[number]["id"] | null>(null);
  const active = GAMES.find((g) => g.id === game);

  if (active) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setGame(null)} className="inline-flex items-center gap-2 text-sm font-bold underline-offset-2 hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> Jogos
        </button>
        <h3 className="text-xl font-semibold">{active.name}</h3>
        {active.id === "wordle" && <Wordle />}
        {active.id === "ladder" && <WordLadder />}
        {active.id === "lyrics" && <LyricsTraining />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Dinâmicas de imersão para praticar o idioma de forma leve, todos os dias.</p>
      {GAMES.map(({ id, name, text, icon: Icon }) => (
        <button key={id} type="button" onClick={() => setGame(id)} className={clsx(box, "flex w-full items-center gap-4 text-left transition hover:border-ink")}>
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft">
            <Icon className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block font-bold">{name}</span>
            <span className="text-sm text-muted">{text}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
