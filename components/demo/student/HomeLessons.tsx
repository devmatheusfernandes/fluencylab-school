"use client";

import { useState } from "react";
import clsx from "clsx";
import { BookOpen, Flame, PlayCircle, Sparkles, Video } from "lucide-react";
import { buildPlan } from "@/lib/demo-placement";
import { PAST_LESSONS } from "@/lib/demo-data";
import { Badge, Button } from "@/components/demo/ui";
import { RecordingPlayer } from "@/components/demo/shared/RecordingPlayer";
import { box, type Notify, type StudentTab } from "@/components/demo/student/screens";

/* ───────── Início ───────── */

export function HomeScreen({ go, onJoin, wide }: { go: (tab: StudentTab) => void; onJoin: () => void; wide: boolean }) {
  const week = buildPlan("B1", "listening")[1];

  const greeting = (
    <div>
      <p className="text-sm text-muted">Bom dia,</p>
      <h2 className="text-2xl font-semibold sm:text-3xl">Beatriz</h2>
    </div>
  );

  const next = (
    <div className="rounded-2xl bg-brand p-4 text-brand-ink sm:p-6">
      <p className="text-xs font-bold uppercase tracking-wider opacity-80">Próxima aula</p>
      <p className="mt-1 font-display text-xl font-semibold sm:text-2xl">Travel vocabulary</p>
      <p className="text-sm opacity-90">Segunda, 09:00 · com Prof. Ana</p>
      <button type="button" onClick={onJoin} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">
        <Video className="size-4" aria-hidden /> Entrar na aula
      </button>
    </div>
  );

  const level = (
    <div className={box}>
      <div className="flex items-center justify-between">
        <p className="font-bold">Nível B1</p>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
          <Flame className="size-4" aria-hidden /> 6 dias seguidos
        </span>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-stone-200" role="progressbar" aria-label="Progresso no nível B1" aria-valuenow={62} aria-valuemax={100}>
        <div className="h-2.5 rounded-full bg-brand" style={{ width: "62%" }} />
      </div>
      <p className="mt-2 text-xs text-muted">62% do caminho até o B2</p>
    </div>
  );

  const review = (
    <button type="button" onClick={() => go("revisar")} className={clsx(box, "flex w-full items-center gap-3 text-left transition hover:border-ink")}>
      <span className="grid size-11 place-items-center rounded-xl bg-brand-soft">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-bold">Prática de hoje</span>
        <span className="text-sm text-muted">5 cartões de revisão e um jogo esperando</span>
      </span>
    </button>
  );

  const plan = (
    <div className={box}>
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-brand" aria-hidden />
        <p className="font-bold">Plano desta semana</p>
      </div>
      <p className="mt-2 text-sm font-semibold">{week.theme}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted">
        {week.lessons.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">Criado automaticamente a partir do seu nivelamento.</p>
    </div>
  );

  if (wide) {
    return (
      <div className="space-y-6">
        {greeting}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-5">
            {next}
            {level}
          </div>
          <div className="space-y-5">
            {review}
            {plan}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {greeting}
      {next}
      {level}
      {review}
      {plan}
    </div>
  );
}

/* ───────── Aulas ───────── */

const UPCOMING = [
  { id: "u1", title: "Travel vocabulary", when: "Seg, 09:00" },
  { id: "u2", title: "Past simple practice", when: "Qui, 09:00" },
];
const SLOTS = ["Qua, 10:00", "Qui, 18:30", "Sex, 09:00"];

export function LessonsScreen({ notify, onJoin }: { notify: Notify; onJoin: () => void }) {
  const [choosing, setChoosing] = useState<string | null>(null);
  const [moved, setMoved] = useState<Record<string, string>>({});
  const [recording, setRecording] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold sm:text-3xl">Minhas aulas</h2>
      {UPCOMING.map((l, index) => (
        <div key={l.id} className={box}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold">{l.title}</p>
              <p className="text-sm text-muted">{moved[l.id] ?? l.when}</p>
            </div>
            {moved[l.id] ? <Badge tone="warn">Reagendada</Badge> : <Badge tone="ok">Confirmada</Badge>}
          </div>
          {choosing === l.id ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-bold text-muted">Escolha um novo horário:</p>
              <div className="flex flex-wrap gap-2">
                {SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setMoved((m) => ({ ...m, [l.id]: slot }));
                      setChoosing(null);
                      notify(`Aula reagendada para ${slot}. O professor foi avisado.`);
                    }}
                    className="rounded-full border border-line px-3 py-1.5 text-sm font-bold hover:border-ink"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {index === 0 && (
                <Button onClick={onJoin}>
                  <Video className="size-4" aria-hidden /> Entrar na aula
                </Button>
              )}
              <Button variant="ghost" onClick={() => setChoosing(l.id)}>
                Reagendar
              </Button>
            </div>
          )}
        </div>
      ))}

      <div>
        <h3 className="mt-2 text-lg font-semibold">Aulas gravadas</h3>
        <p className="text-sm text-muted">Reveja o que foi dito, com transcrição, e salve frases no caderno.</p>
        <ul className="mt-3 space-y-3">
          {PAST_LESSONS.map((p) => (
            <li key={p.id} className={clsx(box, "flex items-center justify-between gap-3")}>
              <div>
                <p className="font-bold">{p.topic}</p>
                <p className="text-sm text-muted">{p.when}</p>
              </div>
              <button type="button" onClick={() => setRecording(p.when)} className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold">
                <PlayCircle className="size-5" aria-hidden /> Assistir
              </button>
            </li>
          ))}
        </ul>
      </div>

      <RecordingPlayer open={Boolean(recording)} onClose={() => setRecording(null)} when={recording ?? ""} onSave={notify} />
    </div>
  );
}
