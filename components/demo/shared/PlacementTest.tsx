"use client";

import { useState } from "react";
import clsx from "clsx";
import { Headphones } from "lucide-react";
import {
  QUESTIONS,
  SKILL_LABEL,
  START_ELO,
  TEST_LENGTH,
  emptySkills,
  levelFromElo,
  pickNext,
  updateElo,
  type PlacementQuestion,
  type PlacementResult,
} from "@/lib/demo-placement";
import { Badge } from "@/components/demo/ui";

/** Teste de nivelamento adaptativo: a dificuldade acompanha o desempenho do aluno a cada resposta. */
export function PlacementTest({ onDone }: { onDone: (result: PlacementResult) => void }) {
  const [elo, setElo] = useState(START_ELO);
  const [answered, setAnswered] = useState<string[]>([]);
  const [skills, setSkills] = useState(emptySkills);
  const [current, setCurrent] = useState<PlacementQuestion | null>(() => pickNext(START_ELO, []));
  const [picked, setPicked] = useState<number | null>(null);
  const [heard, setHeard] = useState(false);

  const step = answered.length;

  function choose(index: number) {
    if (picked !== null || !current) return;
    setPicked(index);
  }

  function next() {
    if (!current || picked === null) return;
    const correct = picked === current.answer;
    const newElo = updateElo(elo, current, correct);
    const newSkills = { ...skills, [current.skill]: { right: skills[current.skill].right + (correct ? 1 : 0), total: skills[current.skill].total + 1 } };
    const newAnswered = [...answered, current.id];
    setElo(newElo);
    setSkills(newSkills);
    setAnswered(newAnswered);
    setPicked(null);
    setHeard(false);
    if (newAnswered.length >= TEST_LENGTH || newAnswered.length >= QUESTIONS.length) {
      onDone({ elo: newElo, level: levelFromElo(newElo), skills: newSkills });
      return;
    }
    setCurrent(pickNext(newElo, newAnswered));
  }

  if (!current) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold">
          Pergunta {step + 1} de {TEST_LENGTH}
        </p>
        <div className="flex items-center gap-2">
          <Badge tone="brand">{SKILL_LABEL[current.skill]}</Badge>
          <Badge>Nível estimado agora: {levelFromElo(elo)}</Badge>
        </div>
      </div>
      <div className="h-2 rounded-full bg-stone-200" role="progressbar" aria-label="Progresso do teste" aria-valuenow={step} aria-valuemax={TEST_LENGTH}>
        <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${(step / TEST_LENGTH) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-line bg-card p-5">
        {current.context && <p className="mb-3 rounded-xl bg-cream p-3 text-sm italic">{current.context}</p>}
        {current.audio && (
          <div className="mb-3">
            <button type="button" onClick={() => setHeard(true)} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">
              <Headphones className="size-4" aria-hidden /> Ouvir o áudio
            </button>
            {heard && <p className="mt-2 rounded-xl bg-cream p-3 text-sm italic">Áudio (simulado): “{current.audio}”</p>}
          </div>
        )}
        <p className="font-bold">{current.prompt}</p>
        <div className="mt-3 space-y-2">
          {current.options.map((option, i) => {
            const isPicked = picked === i;
            const right = i === current.answer;
            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(i)}
                disabled={picked !== null}
                className={clsx(
                  "w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                  picked === null && "border-line hover:border-ink",
                  picked !== null && right && "border-emerald-600 bg-emerald-50",
                  picked !== null && isPicked && !right && "border-red-500 bg-red-50",
                  picked !== null && !isPicked && !right && "border-line opacity-60",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Acertou: a próxima pergunta fica mais difícil. Errou: fica mais fácil.</p>
        <button
          type="button"
          onClick={next}
          disabled={picked === null}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-brand-ink transition hover:brightness-110 disabled:opacity-40"
        >
          {step + 1 >= TEST_LENGTH ? "Ver resultado" : "Próxima"}
        </button>
      </div>
    </div>
  );
}
