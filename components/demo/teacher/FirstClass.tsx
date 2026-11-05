"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { LESSONS } from "@/lib/demo-library";
import { SKILL_LABEL, SKILL_ORDER, buildPlan, profileFrom, type PlacementResult, type PlanWeek } from "@/lib/demo-placement";
import { Badge, Button, Card, Explain, SectionHead } from "@/components/demo/ui";
import { PlacementTest } from "@/components/demo/shared/PlacementTest";
import type { TeacherCtx } from "@/components/demo/teacher/types";

const STEPS = ["Convite", "Nivelamento", "Perfil", "Plano", "Pronto"];
const GOALS = ["Viajar com segurança", "Trabalho e carreira", "Entrevista de emprego", "Conversar no dia a dia", "Provas e certificados"];

export function FirstClass({ ctx }: { ctx: TeacherCtx }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Marcos Vieira");
  const [goal, setGoal] = useState(GOALS[0]);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<PlanWeek[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const first = name.trim().split(" ")[0] || "o aluno";

  function finishTest(r: PlacementResult) {
    setResult(r);
    setPlan(buildPlan(r.level, profileFrom(r).weakest));
    setGenerating(true);
    setStep(2);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setGenerating(false), 1700);
  }

  function swapLesson(weekIndex: number, lessonIndex: number) {
    if (!result) return;
    const level = result.level;
    const pool = LESSONS.filter((l) => l.level === level || l.level === "B1");
    setPlan((p) =>
      p.map((w, i) => {
        if (i !== weekIndex) return w;
        const current = w.lessons[lessonIndex];
        const options = pool.filter((l) => !w.lessons.includes(l.title) || l.title === current);
        const next = options[(options.findIndex((l) => l.title === current) + 1) % options.length];
        return { ...w, lessons: w.lessons.map((t, j) => (j === lessonIndex ? next.title : t)) };
      }),
    );
  }

  function restart() {
    setStep(0);
    setResult(null);
    setPlan([]);
    setGenerating(false);
  }

  const profile = result ? profileFrom(result) : null;

  return (
    <>
      <SectionHead title="Primeira aula" text="Do convite ao plano de estudos, sem montar nada na mão." />
      <Explain title="O que acontece com um aluno novo">
        Você convida o aluno. Na primeira aula ele faz o <b>nivelamento adaptativo</b>: o teste ajusta a dificuldade a cada
        resposta e descobre o nível real. Em seguida a plataforma cria o <b>perfil do aluno</b> e um{" "}
        <b>plano de estudos</b> com lições da biblioteca, que você revisa e aprova. Percorra as etapas abaixo.
      </Explain>

      <ol className="flex flex-wrap gap-2" aria-label="Etapas">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className={clsx("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold", i === step ? "bg-brand text-brand-ink" : i < step ? "bg-emerald-100 text-emerald-900" : "bg-card text-muted")}>
            {i < step ? <Check className="size-4" aria-hidden /> : <span>{i + 1}</span>}
            {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">Convidar um aluno</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-name" className="mb-1.5 block text-sm font-bold">
                Nome do aluno
              </label>
              <input id="new-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-line bg-card px-4 py-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60" />
            </div>
            <div>
              <label htmlFor="new-goal" className="mb-1.5 block text-sm font-bold">
                Objetivo
              </label>
              <select id="new-goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full rounded-xl border border-line bg-card px-4 py-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-amber/60">
                {GOALS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-muted">O convite leva o aluno ao seu endereço, onde ele cria a conta, assina o contrato e já recebe a primeira cobrança.</p>
          <Button
            onClick={() => {
              ctx.notify(`Convite enviado para ${first}.`);
              setStep(1);
            }}
          >
            Enviar convite
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Aula de nivelamento com {first}</h3>
            <p className="mt-1 text-sm text-muted">Na primeira aula, {first} faz o teste no próprio aparelho enquanto você acompanha. Responda como se fosse o aluno.</p>
          </div>
          <PlacementTest onDone={finishTest} />
        </Card>
      )}

      {step === 2 && result && profile && (
        <Card className="space-y-5">
          {generating ? (
            <div className="flex items-center gap-3 py-8" role="status">
              <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
              <p className="font-bold">Montando o perfil de {first}…</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">Nível identificado</p>
                  <p className="font-display text-5xl font-semibold">{result.level}</p>
                </div>
                <div className="text-right text-sm text-muted">
                  <p>Pontuação (Elo)</p>
                  <p className="font-display text-2xl font-semibold text-ink">{result.elo}</p>
                </div>
              </div>
              <div className="space-y-3">
                {SKILL_ORDER.map((skill) => {
                  const { right, total } = result.skills[skill];
                  const pct = total ? Math.round((right / total) * 100) : 0;
                  return (
                    <div key={skill}>
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">{SKILL_LABEL[skill]}</span>
                        <span className="text-muted">
                          {right} de {total}
                        </span>
                      </div>
                      <div className="mt-1 h-2.5 rounded-full bg-stone-200">
                        <div className="h-2.5 rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-50 p-4 text-sm">
                  <p className="font-bold text-emerald-900">Ponto forte</p>
                  <p>{SKILL_LABEL[profile.strongest]}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-4 text-sm">
                  <p className="font-bold text-amber-900">Precisa de atenção</p>
                  <p>{SKILL_LABEL[profile.weakest]}</p>
                </div>
              </div>
              <Button onClick={() => setStep(3)}>Gerar plano de estudos</Button>
            </>
          )}
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold">Plano de 4 semanas para {first}</h3>
            <p className="mt-1 text-sm text-muted">Gerado a partir do nível e do perfil. Troque as lições que quiser antes de aprovar.</p>
          </Card>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {plan.map((week, wi) => (
              <li key={week.n}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">
                      Semana {week.n}: {week.theme}
                    </p>
                    <Badge tone="brand">Foco: {SKILL_LABEL[week.focus]}</Badge>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {week.lessons.map((title, li) => (
                      <li key={`${title}-${li}`} className="flex items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2 text-sm">
                        <span className="font-semibold">{title}</span>
                        <button type="button" onClick={() => swapLesson(wi, li)} aria-label={`Trocar a lição ${title}`} className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
                          <RefreshCw className="size-3.5" aria-hidden /> Trocar
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted">Todo dia: {week.daily}</p>
                </Card>
              </li>
            ))}
          </ol>
          <Button onClick={() => setStep(4)}>Aprovar plano</Button>
        </div>
      )}

      {step === 4 && (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold">{first} está pronto para começar</h3>
          <ul className="space-y-3 text-sm">
            {[
              "Contrato gerado e enviado para assinatura",
              "Primeira cobrança agendada na sua conta de recebimento",
              "Plano de estudos publicado no app do aluno",
              "Vocabulário da primeira aula enviado para a revisão espaçada",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Button variant="ghost" onClick={restart}>
            Recomeçar a demonstração
          </Button>
        </Card>
      )}
    </>
  );
}
